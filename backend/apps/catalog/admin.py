from django.contrib import admin

from .models import ImportedProduct


@admin.register(ImportedProduct)
class ImportedProductAdmin(admin.ModelAdmin):
    list_display = (
        "external_id",
        "title",
        "brand",
        "category",
        "source_price",
        "source_stock",
        "last_synced_at",
    )
    list_filter = ("category", "availability_status")
    search_fields = ("=external_id", "title", "brand", "sku")
    ordering = ("title", "external_id")
    readonly_fields = (
        "external_id",
        "title",
        "description",
        "category",
        "brand",
        "sku",
        "source_price",
        "source_discount_percentage",
        "source_stock",
        "availability_status",
        "thumbnail_url",
        "images",
        "raw_payload",
        "last_synced_at",
        "created_at",
        "updated_at",
    )

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False
