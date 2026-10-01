from django.conf import settings
from django.shortcuts import get_object_or_404
from rest_framework import generics
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.catalog.models import Banner, Listing, Menu

from .catalog import active_listing_queryset, filter_and_order_listings
from .search import search_active_listings
from .serializers import (
    BannerSerializer,
    CatalogFilterSerializer,
    ListingSerializer,
    MenuSerializer,
    SearchQuerySerializer,
)


class PublicAPIViewMixin:
    permission_classes = (AllowAny,)


class StorefrontPagination(PageNumberPagination):
    page_size = 12
    page_size_query_param = "page_size"
    max_page_size = 24


class FilteredListingMixin:
    pagination_class = StorefrontPagination

    def validated_filters(self):
        serializer = CatalogFilterSerializer(data=self.request.query_params)
        serializer.is_valid(raise_exception=True)
        return serializer.validated_data


class HomeView(PublicAPIViewMixin, APIView):
    def get(self, request):
        banners = Banner.objects.visible()
        menus = Menu.objects.filter(active=True)
        return Response(
            {
                "banners": BannerSerializer(banners, many=True).data,
                "menus": MenuSerializer(menus, many=True).data,
                "commercial_terms": {
                    "pix_discount_percentage": str(settings.PIX_DISCOUNT_PERCENT),
                    "max_installments": settings.MAX_INSTALLMENTS,
                    "free_shipping_minimum": str(settings.FREE_SHIPPING_MINIMUM),
                },
            }
        )


class MenuListView(PublicAPIViewMixin, generics.ListAPIView):
    serializer_class = MenuSerializer
    queryset = Menu.objects.filter(active=True)


class MenuListingsView(PublicAPIViewMixin, FilteredListingMixin, generics.ListAPIView):
    serializer_class = ListingSerializer

    def get_queryset(self):
        menu = get_object_or_404(Menu, slug=self.kwargs["slug"], active=True)
        queryset = active_listing_queryset().filter(menu_links__menu=menu)
        return filter_and_order_listings(
            queryset,
            self.validated_filters(),
            default_ordering="featured",
        )


class ListingListView(PublicAPIViewMixin, FilteredListingMixin, generics.ListAPIView):
    serializer_class = ListingSerializer

    def get_queryset(self):
        return filter_and_order_listings(
            active_listing_queryset(),
            self.validated_filters(),
        )


class ListingSearchView(PublicAPIViewMixin, generics.ListAPIView):
    serializer_class = ListingSerializer
    pagination_class = StorefrontPagination

    def get_queryset(self):
        query = SearchQuerySerializer(data=self.request.query_params)
        query.is_valid(raise_exception=True)
        return search_active_listings(query.validated_data["q"])


class ListingDetailView(PublicAPIViewMixin, generics.RetrieveAPIView):
    serializer_class = ListingSerializer
    lookup_field = "slug"

    def get_queryset(self):
        return active_listing_queryset()
