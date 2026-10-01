from decimal import Decimal

from django.db import transaction
from django.utils.text import slugify
from rest_framework import serializers

from apps.catalog.models import Banner, ImportedProduct, Listing, Menu, MenuListing
from apps.core.models import StoreSettings
from apps.customers.models import Customer
from apps.orders.models import Order
from apps.orders.serializers import StrictSerializer


class RejectUnknownFieldsMixin:
    def to_internal_value(self, data):
        if hasattr(data, "keys"):
            unknown_fields = set(data.keys()) - set(self.fields.keys())
            if unknown_fields:
                raise serializers.ValidationError(
                    {
                        field: ["Este campo não é permitido."]
                        for field in sorted(unknown_fields)
                    }
                )
        return super().to_internal_value(data)


def unique_slug(model, value, *, instance=None):
    max_length = model._meta.get_field("slug").max_length
    base = slugify(value)[:max_length] or "item"
    candidate = base
    suffix = 2
    queryset = model.objects.all()
    if instance is not None:
        queryset = queryset.exclude(pk=instance.pk)
    while queryset.filter(slug=candidate).exists():
        tail = f"-{suffix}"
        candidate = f"{base[:max_length - len(tail)]}{tail}"
        suffix += 1
    return candidate


class AdminLoginSerializer(StrictSerializer):
    username = serializers.CharField(max_length=150, trim_whitespace=True)
    password = serializers.CharField(
        max_length=128,
        trim_whitespace=False,
        write_only=True,
        style={"input_type": "password"},
    )


class AdminImportedProductSerializer(serializers.ModelSerializer):
    listing_count = serializers.IntegerField(read_only=True)
    image_url = serializers.CharField(source="primary_image_url", read_only=True)

    class Meta:
        model = ImportedProduct
        fields = (
            "id",
            "external_id",
            "title",
            "brand",
            "category",
            "sku",
            "image_url",
            "source_price",
            "source_stock",
            "availability_status",
            "last_synced_at",
            "listing_count",
        )


class AdminOrderSerializer(serializers.ModelSerializer):
    # Snapshot taken at checkout, so an account rename never rewrites history.
    customer_name = serializers.CharField(read_only=True)
    customer_email = serializers.EmailField(source="customer.email", read_only=True)
    item_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Order
        fields = (
            "public_id",
            "customer_name",
            "customer_email",
            "status",
            "payment_status",
            "total",
            "item_count",
            "created_at",
        )


class AdminCustomerSerializer(serializers.ModelSerializer):
    order_count = serializers.IntegerField(read_only=True)
    approved_total = serializers.DecimalField(
        max_digits=14,
        decimal_places=2,
        read_only=True,
    )

    class Meta:
        model = Customer
        fields = (
            "id",
            "name",
            "email",
            "is_active",
            "order_count",
            "approved_total",
            "created_at",
        )


class AdminLowStockListingSerializer(serializers.ModelSerializer):
    sku = serializers.CharField(source="product.sku", read_only=True)

    class Meta:
        model = Listing
        fields = ("id", "title", "sku", "stock_quantity", "active")


class AdminListingSerializer(RejectUnknownFieldsMixin, serializers.ModelSerializer):
    product_id = serializers.PrimaryKeyRelatedField(source="product", queryset=ImportedProduct.objects.all())
    product_title = serializers.CharField(source="product.title", read_only=True)
    external_id = serializers.IntegerField(source="product.external_id", read_only=True)
    brand = serializers.CharField(source="product.brand", read_only=True)
    category = serializers.CharField(source="product.category", read_only=True)
    sku = serializers.CharField(source="product.sku", read_only=True)
    image_url = serializers.CharField(source="product.primary_image_url", read_only=True)
    slug = serializers.SlugField(max_length=255, required=False)

    class Meta:
        model = Listing
        fields = (
            "id", "product_id", "product_title", "external_id", "brand", "category",
            "sku", "image_url", "slug", "title", "description", "price",
            "promotional_price", "stock_quantity", "active", "free_shipping",
            "created_at", "updated_at",
        )
        read_only_fields = ("created_at", "updated_at")
        extra_kwargs = {
            "price": {"min_value": Decimal("0.01")},
            "promotional_price": {"min_value": Decimal("0.01")},
            "stock_quantity": {"min_value": 0},
        }

    def validate_product_id(self, value):
        if self.instance is not None and value.pk != self.instance.product_id:
            raise serializers.ValidationError("O produto de origem de um anúncio não pode ser alterado.")
        return value

    def validate(self, attrs):
        attrs = super().validate(attrs)
        price = attrs.get("price", getattr(self.instance, "price", None))
        promotional_price = attrs.get("promotional_price", getattr(self.instance, "promotional_price", None))
        if promotional_price is not None and price is not None and promotional_price >= price:
            raise serializers.ValidationError({"promotional_price": "O preço promocional deve ser menor que o preço normal."})
        return attrs

    def create(self, validated_data):
        if not validated_data.get("slug"):
            validated_data["slug"] = unique_slug(Listing, validated_data["title"])
        return super().create(validated_data)


class AdminMenuListingSerializer(serializers.ModelSerializer):
    sku = serializers.CharField(source="product.sku", read_only=True)

    class Meta:
        model = Listing
        fields = ("id", "title", "slug", "sku", "active", "stock_quantity")


class AdminMenuSerializer(RejectUnknownFieldsMixin, serializers.ModelSerializer):
    slug = serializers.SlugField(max_length=120, required=False)
    listing_ids = serializers.ListField(child=serializers.IntegerField(min_value=1), write_only=True, required=False)
    listings = serializers.SerializerMethodField()

    class Meta:
        model = Menu
        fields = ("id", "name", "slug", "display_order", "active", "listing_ids", "listings", "created_at", "updated_at")
        read_only_fields = ("created_at", "updated_at")
        extra_kwargs = {"display_order": {"min_value": 0}}

    def get_listings(self, obj):
        ordered = [link.listing for link in obj.listing_links.all()]
        return AdminMenuListingSerializer(ordered, many=True).data

    def validate_listing_ids(self, value):
        if len(value) != len(set(value)):
            raise serializers.ValidationError("Cada anúncio pode aparecer apenas uma vez.")
        found = set(Listing.objects.filter(id__in=value).values_list("id", flat=True))
        missing = [listing_id for listing_id in value if listing_id not in found]
        if missing:
            raise serializers.ValidationError(f"Anúncios inexistentes: {', '.join(map(str, missing))}.")
        return value

    @staticmethod
    def _replace_listings(menu, listing_ids):
        menu.listing_links.all().delete()
        MenuListing.objects.bulk_create([
            MenuListing(menu=menu, listing_id=listing_id, display_order=index)
            for index, listing_id in enumerate(listing_ids)
        ])

    @transaction.atomic
    def create(self, validated_data):
        listing_ids = validated_data.pop("listing_ids", [])
        if not validated_data.get("slug"):
            validated_data["slug"] = unique_slug(Menu, validated_data["name"])
        menu = super().create(validated_data)
        self._replace_listings(menu, listing_ids)
        return menu

    @transaction.atomic
    def update(self, instance, validated_data):
        listing_ids = validated_data.pop("listing_ids", None)
        menu = super().update(instance, validated_data)
        if listing_ids is not None:
            self._replace_listings(menu, listing_ids)
        return menu


class AdminBannerSerializer(RejectUnknownFieldsMixin, serializers.ModelSerializer):
    class Meta:
        model = Banner
        fields = ("id", "title", "image_url", "link_url", "alt_text", "display_order", "active", "starts_at", "ends_at", "created_at", "updated_at")
        read_only_fields = ("created_at", "updated_at")
        extra_kwargs = {"display_order": {"min_value": 0}}

    def validate(self, attrs):
        attrs = super().validate(attrs)
        starts_at = attrs.get("starts_at", getattr(self.instance, "starts_at", None))
        ends_at = attrs.get("ends_at", getattr(self.instance, "ends_at", None))
        if starts_at is not None and ends_at is not None and ends_at <= starts_at:
            raise serializers.ValidationError({"ends_at": "O fim da exibição deve ser posterior ao início."})
        return attrs


class AdminStoreSettingsSerializer(
    RejectUnknownFieldsMixin,
    serializers.ModelSerializer,
):
    class Meta:
        model = StoreSettings
        fields = ("free_shipping_minimum", "updated_at")
        read_only_fields = ("updated_at",)
        extra_kwargs = {
            "free_shipping_minimum": {"min_value": Decimal("0.01")},
        }
