from decimal import Decimal

from django.contrib.auth import authenticate
from django.contrib.auth import login as django_login
from django.contrib.auth import logout as django_logout
from django.core.management.base import CommandError
from django.db.models import Count, DecimalField, Max, Prefetch, Q, Sum, Value
from django.db.models.functions import Coalesce
from django.middleware.csrf import get_token
from django.utils import timezone
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_protect, ensure_csrf_cookie
from rest_framework import generics, status
from rest_framework.authentication import SessionAuthentication
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.catalog.models import Banner, ImportedProduct, Listing, Menu, MenuListing
from apps.catalog.niche import NICHE_CATEGORIES
from apps.core.models import StoreSettings
from apps.catalog.services.dummyjson import DummyJSONError
from apps.catalog.services.importer import ProductImportError, sync_products
from apps.customers.models import Customer
from apps.orders.models import Order

from .pagination import BackofficePagination
from .demo_reset import (
    DemoResetCooldown,
    DemoResetInProgress,
    DemoResetUnavailable,
    reset_status,
    restore_demo,
)
from .permissions import IsActiveStaff, IsActiveSuperuser
from .media import MediaStorageUnavailable, MediaUploadError, upload_image
from .serializers import (
    AdminBannerSerializer,
    AdminCustomerSerializer,
    AdminDemoResetSerializer,
    AdminImageUploadSerializer,
    AdminImportedProductSerializer,
    AdminListingSerializer,
    AdminLoginSerializer,
    AdminLowStockListingSerializer,
    AdminMenuSerializer,
    AdminOrderSerializer,
    AdminStoreSettingsSerializer,
)


def _active_filter(queryset, value, *, field="active"):
    normalized = value.strip().lower()
    if normalized in {"true", "1"}:
        return queryset.filter(**{field: True})
    if normalized in {"false", "0"}:
        return queryset.filter(**{field: False})
    return queryset


def _user_payload(user):
    return {
        "username": user.get_username(),
        "display_name": user.get_full_name().strip() or user.get_username(),
        "is_superuser": user.is_superuser,
    }


class AdminSessionView(APIView):
    authentication_classes = (SessionAuthentication,)
    permission_classes = (AllowAny,)

    @method_decorator(ensure_csrf_cookie)
    def get(self, request):
        user = request.user
        authenticated = bool(
            user.is_authenticated and user.is_active and user.is_staff
        )
        return Response(
            {
                "authenticated": authenticated,
                "user": _user_payload(user) if authenticated else None,
                "csrf_token": get_token(request),
            }
        )


class AdminLoginView(APIView):
    authentication_classes = (SessionAuthentication,)
    permission_classes = (AllowAny,)

    @method_decorator(csrf_protect)
    def post(self, request):
        serializer = AdminLoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = authenticate(
            request,
            username=serializer.validated_data["username"],
            password=serializer.validated_data["password"],
        )
        if user is None or not user.is_active or not user.is_staff:
            return Response(
                {"message": "Usuário ou senha inválidos para o painel."},
                status=status.HTTP_403_FORBIDDEN,
            )

        django_login(request, user)
        return Response(
            {
                "authenticated": True,
                "user": _user_payload(user),
                "csrf_token": get_token(request),
            }
        )


class StaffAPIViewMixin:
    authentication_classes = (SessionAuthentication,)
    permission_classes = (IsActiveStaff,)


class AdminLogoutView(StaffAPIViewMixin, APIView):
    def post(self, request):
        django_logout(request)
        return Response(status=status.HTTP_204_NO_CONTENT)


class AdminDashboardView(StaffAPIViewMixin, APIView):
    def get(self, request):
        approved_orders = Order.objects.filter(
            payment_status=Order.PaymentStatus.APPROVED
        )
        money_field = DecimalField(max_digits=14, decimal_places=2)
        approved_revenue = approved_orders.aggregate(
            total=Coalesce(
                Sum("total"),
                Value(Decimal("0.00"), output_field=money_field),
                output_field=money_field,
            )
        )["total"]

        low_stock = (
            Listing.objects.filter(active=True, stock_quantity__lte=5)
            .select_related("product")
            .order_by("stock_quantity", "title", "id")
        )
        latest_orders = (
            Order.objects.select_related("customer")
            .annotate(item_count=Count("items"))
            .order_by("-created_at", "-id")[:5]
        )
        last_synced_at = ImportedProduct.objects.aggregate(
            value=Max("last_synced_at")
        )["value"]
        last_import = None
        if last_synced_at is not None:
            last_import = {
                "completed_at": last_synced_at,
                "product_count": ImportedProduct.objects.filter(
                    last_synced_at=last_synced_at
                ).count(),
            }

        return Response(
            {
                "metrics": {
                    "imported_product_count": ImportedProduct.objects.count(),
                    "active_listing_count": Listing.objects.filter(active=True).count(),
                    "order_count": Order.objects.count(),
                    "customer_count": Customer.objects.count(),
                    "approved_revenue": format(approved_revenue, ".2f"),
                    "low_stock_count": low_stock.count(),
                },
                "latest_orders": AdminOrderSerializer(latest_orders, many=True).data,
                "low_stock": AdminLowStockListingSerializer(
                    low_stock[:5], many=True
                ).data,
                "last_import": last_import,
            }
        )


class AdminImportedProductListView(StaffAPIViewMixin, generics.ListAPIView):
    serializer_class = AdminImportedProductSerializer
    pagination_class = BackofficePagination

    def get_queryset(self):
        queryset = ImportedProduct.objects.annotate(
            listing_count=Count("listings")
        )
        query = self.request.query_params.get("q", "").strip()
        if query:
            queryset = queryset.filter(
                Q(title__icontains=query)
                | Q(description__icontains=query)
                | Q(brand__icontains=query)
                | Q(category__icontains=query)
                | Q(sku__icontains=query)
            )
        category = self.request.query_params.get("category", "").strip()
        if category:
            queryset = queryset.filter(category__iexact=category)
        niche = self.request.query_params.get("niche", "").strip().lower()
        if niche in {"true", "1"}:
            queryset = queryset.filter(category__in=NICHE_CATEGORIES)
        elif niche in {"false", "0"}:
            queryset = queryset.exclude(category__in=NICHE_CATEGORIES)
        has_listing = self.request.query_params.get("has_listing", "").strip().lower()
        if has_listing in {"true", "1"}:
            queryset = queryset.filter(listing_count__gt=0)
        elif has_listing in {"false", "0"}:
            queryset = queryset.filter(listing_count=0)
        return queryset.order_by("title", "external_id")


class AdminListingListCreateView(StaffAPIViewMixin, generics.ListCreateAPIView):
    serializer_class = AdminListingSerializer
    pagination_class = BackofficePagination

    def get_queryset(self):
        queryset = Listing.objects.select_related("product")
        query = self.request.query_params.get("q", "").strip()
        if query:
            queryset = queryset.filter(
                Q(title__icontains=query)
                | Q(description__icontains=query)
                | Q(product__title__icontains=query)
                | Q(product__brand__icontains=query)
                | Q(product__category__icontains=query)
                | Q(product__sku__icontains=query)
            )
        active = self.request.query_params.get("active", "")
        if active:
            queryset = _active_filter(queryset, active)
        stock = self.request.query_params.get("stock", "").strip().lower()
        if stock == "out":
            queryset = queryset.filter(stock_quantity=0)
        elif stock == "low":
            queryset = queryset.filter(stock_quantity__gt=0, stock_quantity__lte=5)
        elif stock == "in":
            queryset = queryset.filter(stock_quantity__gt=5)
        return queryset.order_by("title", "id")


class AdminListingDetailView(StaffAPIViewMixin, generics.RetrieveUpdateAPIView):
    serializer_class = AdminListingSerializer
    queryset = Listing.objects.select_related("product")
    http_method_names = ("get", "patch", "head", "options")


class AdminMenuListCreateView(StaffAPIViewMixin, generics.ListCreateAPIView):
    serializer_class = AdminMenuSerializer
    pagination_class = BackofficePagination

    def get_queryset(self):
        queryset = Menu.objects.prefetch_related(
            Prefetch(
                "listing_links",
                queryset=MenuListing.objects.select_related("listing", "listing__product").order_by("display_order", "id"),
            )
        )
        query = self.request.query_params.get("q", "").strip()
        if query:
            queryset = queryset.filter(Q(name__icontains=query) | Q(slug__icontains=query))
        active = self.request.query_params.get("active", "")
        if active:
            queryset = _active_filter(queryset, active)
        return queryset.order_by("display_order", "name", "id")


class AdminMenuDetailView(StaffAPIViewMixin, generics.RetrieveUpdateAPIView):
    serializer_class = AdminMenuSerializer
    http_method_names = ("get", "patch", "head", "options")

    def get_queryset(self):
        return Menu.objects.prefetch_related(
            Prefetch(
                "listing_links",
                queryset=MenuListing.objects.select_related("listing", "listing__product").order_by("display_order", "id"),
            )
        )


class AdminBannerListCreateView(StaffAPIViewMixin, generics.ListCreateAPIView):
    serializer_class = AdminBannerSerializer
    pagination_class = BackofficePagination

    def get_queryset(self):
        queryset = Banner.objects.all()
        query = self.request.query_params.get("q", "").strip()
        if query:
            queryset = queryset.filter(
                Q(title__icontains=query)
                | Q(alt_text__icontains=query)
                | Q(link_url__icontains=query)
            )
        active = self.request.query_params.get("active", "")
        if active:
            queryset = _active_filter(queryset, active)
        return queryset.order_by("display_order", "id")


class AdminBannerDetailView(StaffAPIViewMixin, generics.RetrieveUpdateAPIView):
    serializer_class = AdminBannerSerializer
    queryset = Banner.objects.all()
    http_method_names = ("get", "patch", "head", "options")


class AdminImageUploadView(StaffAPIViewMixin, APIView):
    parser_classes = (MultiPartParser, FormParser)

    def post(self, request):
        serializer = AdminImageUploadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            stored = upload_image(serializer.validated_data["image"])
        except MediaStorageUnavailable as exc:
            return Response(
                {"message": str(exc)},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        except MediaUploadError as exc:
            return Response(
                {"message": str(exc)},
                status=status.HTTP_502_BAD_GATEWAY,
            )
        return Response(
            {"url": stored.url, "width": stored.width, "height": stored.height},
            status=status.HTTP_201_CREATED,
        )


class AdminStoreSettingsView(StaffAPIViewMixin, generics.RetrieveUpdateAPIView):
    serializer_class = AdminStoreSettingsSerializer
    http_method_names = ("get", "patch", "head", "options")

    def get_object(self):
        return StoreSettings.load()


class AdminDemoResetView(APIView):
    authentication_classes = (SessionAuthentication,)
    permission_classes = (IsActiveSuperuser,)

    def get(self, request):
        return Response(reset_status())

    def post(self, request):
        serializer = AdminDemoResetSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            summary = restore_demo(username=request.user.get_username())
        except DemoResetUnavailable:
            return Response(
                {"message": "A restauração da demonstração está desativada."},
                status=status.HTTP_403_FORBIDDEN,
            )
        except DemoResetInProgress:
            return Response(
                {"message": "Uma restauração já está em andamento."},
                status=status.HTTP_409_CONFLICT,
            )
        except DemoResetCooldown as exc:
            return Response(
                {
                    "message": "Aguarde antes de restaurar novamente.",
                    "retry_after": exc.retry_after,
                },
                status=status.HTTP_429_TOO_MANY_REQUESTS,
            )
        except (DummyJSONError, ProductImportError, CommandError):
            return Response(
                {
                    "message": (
                        "O DummyJSON não pôde ser validado. Nenhum dado foi removido."
                    )
                },
                status=status.HTTP_502_BAD_GATEWAY,
            )
        request.session.pop("customer_id", None)
        return Response(summary)


class AdminProductImportView(StaffAPIViewMixin, APIView):
    def post(self, request):
        try:
            summary = sync_products()
        except (DummyJSONError, ProductImportError):
            return Response(
                {"message": "A importação não pôde ser concluída. Tente novamente mais tarde."},
                status=status.HTTP_502_BAD_GATEWAY,
            )
        return Response(
            {
                "created": summary.created,
                "updated": summary.updated,
                "total": summary.total,
                "skipped": summary.skipped,
                "categories": sorted(NICHE_CATEGORIES),
                "completed_at": timezone.now(),
            }
        )


class AdminOrderListView(StaffAPIViewMixin, generics.ListAPIView):
    serializer_class = AdminOrderSerializer
    pagination_class = BackofficePagination

    def get_queryset(self):
        queryset = (
            Order.objects.select_related("customer")
            .annotate(item_count=Count("items"))
        )
        query = self.request.query_params.get("q", "").strip()
        if query:
            # The table shows the snapshot, so it has to be searchable too.
            queryset = queryset.filter(
                Q(customer_name__icontains=query)
                | Q(customer__name__icontains=query)
                | Q(customer__email__icontains=query)
            )
        order_status = self.request.query_params.get("status", "").strip()
        if order_status in Order.Status.values:
            queryset = queryset.filter(status=order_status)
        return queryset.order_by("-created_at", "-id")


class AdminCustomerListView(StaffAPIViewMixin, generics.ListAPIView):
    serializer_class = AdminCustomerSerializer
    pagination_class = BackofficePagination

    def get_queryset(self):
        money_field = DecimalField(max_digits=14, decimal_places=2)
        queryset = Customer.objects.annotate(
            order_count=Count("orders", distinct=True),
            approved_total=Coalesce(
                Sum(
                    "orders__total",
                    filter=Q(
                        orders__payment_status=Order.PaymentStatus.APPROVED
                    ),
                ),
                Value(Decimal("0.00"), output_field=money_field),
                output_field=money_field,
            ),
        )
        query = self.request.query_params.get("q", "").strip()
        if query:
            queryset = queryset.filter(Q(name__icontains=query) | Q(email__icontains=query))
        active = self.request.query_params.get("active", "")
        if active:
            queryset = _active_filter(queryset, active, field="is_active")
        return queryset.order_by("name", "id")
