from django.urls import path

from .views import (
    HomeView,
    ListingDetailView,
    ListingListView,
    MenuListView,
    MenuListingsView,
)


app_name = "storefront"

urlpatterns = [
    path("storefront/home/", HomeView.as_view(), name="home"),
    path("menus/", MenuListView.as_view(), name="menu-list"),
    path(
        "menus/<slug:slug>/listings/",
        MenuListingsView.as_view(),
        name="menu-listings",
    ),
    path("listings/", ListingListView.as_view(), name="listing-list"),
    path(
        "listings/<slug:slug>/",
        ListingDetailView.as_view(),
        name="listing-detail",
    ),
]
