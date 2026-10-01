from decimal import Decimal, ROUND_HALF_UP

from django.conf import settings
from rest_framework import serializers

from apps.catalog.models import Banner, Listing, Menu

from .search import normalize_search_term


class SearchQuerySerializer(serializers.Serializer):
    q = serializers.CharField(
        min_length=2,
        max_length=100,
        trim_whitespace=True,
    )

    def validate_q(self, value):
        if len(normalize_search_term(value)) < 2:
            raise serializers.ValidationError(
                "Informe ao menos dois caracteres pesquisáveis."
            )
        return value


class CatalogFilterSerializer(serializers.Serializer):
    ordering = serializers.ChoiceField(
        choices=(
            "featured",
            "best_selling",
            "least_selling",
            "price_asc",
            "price_desc",
            "newest",
            "oldest",
            "discount_desc",
        ),
        required=False,
    )
    min_price = serializers.DecimalField(
        max_digits=12,
        decimal_places=2,
        min_value=Decimal("0.00"),
        required=False,
    )
    max_price = serializers.DecimalField(
        max_digits=12,
        decimal_places=2,
        min_value=Decimal("0.00"),
        required=False,
    )
    free_shipping = serializers.BooleanField(required=False, default=False)

    def validate(self, attrs):
        minimum = attrs.get("min_price")
        maximum = attrs.get("max_price")
        if minimum is not None and maximum is not None and minimum > maximum:
            raise serializers.ValidationError(
                {"max_price": "O valor máximo deve ser maior ou igual ao mínimo."}
            )
        return attrs


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
        source="product.primary_image_url",
        read_only=True,
    )
    images = serializers.JSONField(source="product.images", read_only=True)
    sales_count = serializers.SerializerMethodField()
    discount_percentage = serializers.SerializerMethodField()
    pix_price = serializers.SerializerMethodField()
    installment_count = serializers.SerializerMethodField()
    installment_value = serializers.SerializerMethodField()

    @staticmethod
    def _money(value):
        return value.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

    def get_sales_count(self, obj):
        return getattr(obj, "sales_count", 0)

    def get_discount_percentage(self, obj):
        if not obj.is_on_sale:
            return "0.00"
        percentage = (obj.price - obj.effective_price) * Decimal("100") / obj.price
        return format(
            percentage.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP),
            ".2f",
        )

    def get_pix_price(self, obj):
        multiplier = (Decimal("100") - settings.PIX_DISCOUNT_PERCENT) / Decimal("100")
        return format(self._money(obj.effective_price * multiplier), ".2f")

    def get_installment_count(self, obj):
        return settings.MAX_INSTALLMENTS

    def get_installment_value(self, obj):
        return format(
            self._money(obj.effective_price / settings.MAX_INSTALLMENTS),
            ".2f",
        )

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
            "sales_count",
            "discount_percentage",
            "pix_price",
            "installment_count",
            "installment_value",
            "free_shipping",
            "created_at",
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
