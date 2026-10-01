from django.contrib import admin

from .models import Order, OrderItem


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    can_delete = False
    readonly_fields = (
        "listing",
        "listing_title",
        "product_external_id",
        "sku",
        "unit_price",
        "quantity",
        "subtotal",
        "image_url",
    )

    def has_add_permission(self, request, obj=None):
        return False


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = (
        "public_id",
        "customer",
        "customer_name",
        "status",
        "payment_status",
        "payment_method",
        "total",
        "created_at",
    )
    list_filter = ("status", "payment_status", "payment_method", "created_at")
    search_fields = (
        "=public_id",
        "customer_name",
        "customer__name",
        "customer__email",
    )
    readonly_fields = (
        "public_id",
        "customer",
        "customer_name",
        "status",
        "payment_status",
        "payment_method",
        "subtotal",
        "product_discount",
        "pix_discount",
        "shipping_fee",
        "shipping_saved",
        "total",
        "payment_last_four",
        "idempotency_key",
        "idempotency_fingerprint",
        "created_at",
        "updated_at",
    )
    inlines = (OrderItemInline,)

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return request.method in {"GET", "HEAD", "OPTIONS"}

    def has_delete_permission(self, request, obj=None):
        return False
