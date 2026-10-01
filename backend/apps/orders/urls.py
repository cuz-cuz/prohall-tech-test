from django.urls import path

from .views import (
    CheckoutView,
    CustomerAccessRequestView,
    CustomerAccessVerifyView,
    CustomerLogoutView,
    CustomerSessionView,
    MyOrderDetailView,
    MyOrdersView,
)

app_name = "orders"

urlpatterns = [
    path("orders/checkout/", CheckoutView.as_view(), name="checkout"),
    path("customer/session/", CustomerSessionView.as_view(), name="customer-session"),
    path("customer/access/request/", CustomerAccessRequestView.as_view(), name="customer-access-request"),
    path("customer/access/verify/", CustomerAccessVerifyView.as_view(), name="customer-access-verify"),
    path("customer/logout/", CustomerLogoutView.as_view(), name="customer-logout"),
    path("orders/mine/", MyOrdersView.as_view(), name="my-orders"),
    path("orders/mine/<uuid:public_id>/", MyOrderDetailView.as_view(), name="my-order-detail"),
]
