from django.urls import path

from .views import (
    AdminBannerDetailView,
    AdminBannerListCreateView,
    AdminCustomerListView,
    AdminDashboardView,
    AdminImportedProductListView,
    AdminLoginView,
    AdminListingDetailView,
    AdminListingListCreateView,
    AdminLogoutView,
    AdminOrderListView,
    AdminMenuDetailView,
    AdminMenuListCreateView,
    AdminProductImportView,
    AdminSessionView,
    AdminStoreSettingsView,
)


app_name = "backoffice"

urlpatterns = [
    path("session/", AdminSessionView.as_view(), name="session"),
    path("login/", AdminLoginView.as_view(), name="login"),
    path("logout/", AdminLogoutView.as_view(), name="logout"),
    path("dashboard/", AdminDashboardView.as_view(), name="dashboard"),
    path("products/", AdminImportedProductListView.as_view(), name="products"),
    path("products/import/", AdminProductImportView.as_view(), name="product-import"),
    path("listings/", AdminListingListCreateView.as_view(), name="listings"),
    path("listings/<int:pk>/", AdminListingDetailView.as_view(), name="listing-detail"),
    path("menus/", AdminMenuListCreateView.as_view(), name="menus"),
    path("menus/<int:pk>/", AdminMenuDetailView.as_view(), name="menu-detail"),
    path("banners/", AdminBannerListCreateView.as_view(), name="banners"),
    path("banners/<int:pk>/", AdminBannerDetailView.as_view(), name="banner-detail"),
    path("orders/", AdminOrderListView.as_view(), name="orders"),
    path("customers/", AdminCustomerListView.as_view(), name="customers"),
    path("settings/", AdminStoreSettingsView.as_view(), name="settings"),
]
