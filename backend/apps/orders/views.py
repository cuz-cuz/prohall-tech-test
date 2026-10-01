from django.conf import settings
from django.http import Http404
from django.middleware.csrf import get_token
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_protect, ensure_csrf_cookie
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView

from apps.customers.models import Customer, CustomerAccessCode

from .models import Order

from .serializers import (
    CheckoutSerializer,
    CustomerAccessRequestSerializer,
    CustomerAccessVerifySerializer,
    OrderSerializer,
)
from .services import (
    CheckoutConflict,
    checkout_order,
    create_customer_access_code,
    verify_customer_access_code,
)


class CheckoutView(APIView):
    permission_classes = (AllowAny,)

    @method_decorator(csrf_protect)
    def post(self, request):
        serializer = CheckoutSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            order, replayed = checkout_order(serializer.validated_data)
        except CheckoutConflict as exc:
            return Response(exc.as_response(), status=status.HTTP_409_CONFLICT)

        request.session.flush()
        request.session["customer_id"] = order.customer_id

        return Response(
            OrderSerializer(order).data,
            status=status.HTTP_200_OK if replayed else status.HTTP_201_CREATED,
        )


class CustomerSessionView(APIView):
    permission_classes = (AllowAny,)

    @method_decorator(ensure_csrf_cookie)
    def get(self, request):
        customer = _session_customer(request)
        if customer is None:
            return Response(
                {
                    "authenticated": False,
                    "customer": None,
                    "csrf_token": get_token(request),
                }
            )
        return Response(
            {
                "authenticated": True,
                "customer": {"name": customer.name, "email": customer.email},
                "csrf_token": get_token(request),
            }
        )


class CustomerAccessRequestView(APIView):
    permission_classes = (AllowAny,)
    throttle_classes = (ScopedRateThrottle,)
    throttle_scope = "customer_access_request"

    @method_decorator(csrf_protect)
    def post(self, request):
        serializer = CustomerAccessRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        customer = Customer.objects.filter(
            email=serializer.validated_data["email"], is_active=True
        ).first()
        response_data = {
            "message": "Se houver uma conta para esse e-mail, enviaremos um código de acesso."
        }
        if customer:
            code = create_customer_access_code(customer)
            if settings.DEBUG:
                response_data["development_code"] = code
        return Response(response_data)


class CustomerAccessVerifyView(APIView):
    permission_classes = (AllowAny,)
    throttle_classes = (ScopedRateThrottle,)
    throttle_scope = "customer_access_verify"

    @method_decorator(csrf_protect)
    def post(self, request):
        serializer = CustomerAccessVerifySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        customer = verify_customer_access_code(
            email=serializer.validated_data["email"],
            code=serializer.validated_data["code"],
        )
        if customer is None:
            return Response(
                {"message": "Código inválido ou expirado."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        request.session.flush()
        request.session["customer_id"] = customer.pk
        return Response({"authenticated": True})


class CustomerLogoutView(APIView):
    permission_classes = (AllowAny,)

    @method_decorator(csrf_protect)
    def post(self, request):
        request.session.flush()
        return Response(status=status.HTTP_204_NO_CONTENT)


class MyOrdersView(APIView):
    @method_decorator(ensure_csrf_cookie)
    def get(self, request):
        customer = _session_customer(request)
        if customer is None:
            return Response(
                {"message": "Entre na sua conta para consultar os pedidos."},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        orders = (
            customer.orders.prefetch_related("items")
            .order_by("-created_at", "-id")
        )
        return Response(OrderSerializer(orders, many=True).data)


class MyOrderDetailView(APIView):
    def get(self, request, public_id):
        customer = _session_customer(request)
        if customer is None:
            return Response(
                {"message": "Entre na sua conta para consultar os pedidos."},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        try:
            order = customer.orders.prefetch_related("items").get(
                public_id=public_id
            )
        except (Order.DoesNotExist, ValueError):
            raise Http404
        return Response(OrderSerializer(order).data)


def _session_customer(request):
    customer_id = request.session.get("customer_id")
    if not customer_id:
        return None
    try:
        return Customer.objects.get(pk=customer_id, is_active=True)
    except (Customer.DoesNotExist, ValueError, TypeError):
        return None
