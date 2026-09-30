from django.shortcuts import get_object_or_404
from rest_framework import generics
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.catalog.models import Banner, Listing, Menu

from .search import search_active_listings
from .serializers import (
    BannerSerializer,
    ListingSerializer,
    MenuSerializer,
    SearchQuerySerializer,
)


class PublicAPIViewMixin:
    permission_classes = (AllowAny,)


class HomeView(PublicAPIViewMixin, APIView):
    def get(self, request):
        banners = Banner.objects.visible()
        menus = Menu.objects.filter(active=True)
        return Response(
            {
                "banners": BannerSerializer(banners, many=True).data,
                "menus": MenuSerializer(menus, many=True).data,
            }
        )


class MenuListView(PublicAPIViewMixin, generics.ListAPIView):
    serializer_class = MenuSerializer
    queryset = Menu.objects.filter(active=True)


class MenuListingsView(PublicAPIViewMixin, generics.ListAPIView):
    serializer_class = ListingSerializer

    def get_queryset(self):
        menu = get_object_or_404(Menu, slug=self.kwargs["slug"], active=True)
        return (
            Listing.objects.filter(active=True, menu_links__menu=menu)
            .select_related("product")
            .order_by("menu_links__display_order", "id")
        )


class ListingListView(PublicAPIViewMixin, generics.ListAPIView):
    serializer_class = ListingSerializer
    queryset = Listing.objects.filter(active=True).select_related("product")


class ListingSearchPagination(PageNumberPagination):
    page_size = 12


class ListingSearchView(PublicAPIViewMixin, generics.ListAPIView):
    serializer_class = ListingSerializer
    pagination_class = ListingSearchPagination

    def get_queryset(self):
        query = SearchQuerySerializer(data=self.request.query_params)
        query.is_valid(raise_exception=True)
        return search_active_listings(query.validated_data["q"])


class ListingDetailView(PublicAPIViewMixin, generics.RetrieveAPIView):
    serializer_class = ListingSerializer
    queryset = Listing.objects.filter(active=True).select_related("product")
    lookup_field = "slug"
