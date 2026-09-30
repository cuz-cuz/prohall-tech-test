from rest_framework import serializers

from apps.catalog.models import Banner, Listing, Menu


class ListingSerializer(serializers.ModelSerializer):
    effective_price = serializers.DecimalField(
        max_digits=12,
        decimal_places=2,
        read_only=True,
    )
    is_on_sale = serializers.BooleanField(read_only=True)
    is_available = serializers.BooleanField(read_only=True)
    brand = serializers.CharField(source="product.brand", read_only=True)
    category = serializers.CharField(source="product.category", read_only=True)
    sku = serializers.CharField(source="product.sku", read_only=True)
    thumbnail_url = serializers.URLField(
        source="product.thumbnail_url",
        read_only=True,
    )
    images = serializers.JSONField(source="product.images", read_only=True)

    class Meta:
        model = Listing
        fields = (
            "id",
            "slug",
            "title",
            "description",
            "brand",
            "category",
            "sku",
            "thumbnail_url",
            "images",
            "price",
            "promotional_price",
            "effective_price",
            "is_on_sale",
            "stock_quantity",
            "is_available",
        )


class MenuSerializer(serializers.ModelSerializer):
    class Meta:
        model = Menu
        fields = ("id", "name", "slug", "display_order")


class BannerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Banner
        fields = (
            "id",
            "title",
            "image_url",
            "link_url",
            "alt_text",
            "display_order",
        )
