from django.contrib import admin
from django.urls import reverse
from django.utils.html import format_html
from django.utils.text import slugify

from .models import Banner, ImportedProduct, Listing, Menu, MenuListing


@admin.register(ImportedProduct)
class ImportedProductAdmin(admin.ModelAdmin):
    list_display = (
        "external_id",
        "title",
        "brand",
        "category",
        "source_price",
        "source_stock",
        "listing_action",
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

    @admin.display(description="Anúncio")
    def listing_action(self, obj):
        listing = obj.listings.order_by("id").first()
        if listing:
            url = reverse("admin:catalog_listing_change", args=(listing.pk,))
            return format_html('<a href="{}">Editar anúncio</a>', url)

        url = reverse("admin:catalog_listing_add")
        return format_html('<a href="{}?product={}">Criar anúncio</a>', url, obj.pk)

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False


@admin.register(Listing)
class ListingAdmin(admin.ModelAdmin):
    list_display = (
        "title",
        "price",
        "promotional_price",
        "stock_quantity",
        "active",
        "updated_at",
    )
    list_editable = ("active",)
    list_filter = ("active", "product__category", "product__brand")
    search_fields = ("title", "description", "product__brand", "product__sku")
    autocomplete_fields = ("product",)
    prepopulated_fields = {"slug": ("title",)}
    readonly_fields = ("created_at", "updated_at")
    ordering = ("title", "id")
    actions = ("activate_listings", "deactivate_listings")

    @admin.action(description="Ativar anúncios selecionados")
    def activate_listings(self, request, queryset):
        queryset.update(active=True)

    @admin.action(description="Desativar anúncios selecionados")
    def deactivate_listings(self, request, queryset):
        queryset.update(active=False)

    def get_changeform_initial_data(self, request):
        initial = super().get_changeform_initial_data(request)
        product_id = request.GET.get("product")
        if not product_id:
            return initial

        try:
            product = ImportedProduct.objects.get(pk=product_id)
        except (ImportedProduct.DoesNotExist, ValueError):
            return initial

        initial.update(
            {
                "product": product.pk,
                "title": product.title,
                "slug": f"{slugify(product.title) or 'produto'}-{product.external_id}",
                "description": product.description,
                "price": product.source_price,
                "stock_quantity": product.source_stock,
            }
        )
        return initial


class MenuListingInline(admin.TabularInline):
    model = MenuListing
    autocomplete_fields = ("listing",)
    extra = 1
    ordering = ("display_order", "id")


@admin.register(Menu)
class MenuAdmin(admin.ModelAdmin):
    list_display = ("name", "slug", "display_order", "active", "updated_at")
    list_editable = ("display_order", "active")
    list_filter = ("active",)
    search_fields = ("name", "slug")
    prepopulated_fields = {"slug": ("name",)}
    inlines = (MenuListingInline,)
    ordering = ("display_order", "name", "id")


@admin.register(Banner)
class BannerAdmin(admin.ModelAdmin):
    list_display = (
        "title",
        "display_order",
        "active",
        "starts_at",
        "ends_at",
        "updated_at",
    )
    list_editable = ("display_order", "active")
    list_filter = ("active",)
    search_fields = ("title", "alt_text", "link_url")
    readonly_fields = ("created_at", "updated_at")
    ordering = ("display_order", "id")
