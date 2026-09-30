from django.core.exceptions import ValidationError
from django.core.validators import URLValidator
from django.db import models
from django.db.models import Q
from django.utils import timezone


def validate_link_url(value):
    if not value:
        return
    if value.startswith("/") and not value.startswith("//"):
        return
    try:
        URLValidator()(value)
    except ValidationError as exc:
        raise ValidationError(
            "Informe uma URL absoluta ou um caminho interno iniciado por /."
        ) from exc


class ImportedProduct(models.Model):
    external_id = models.PositiveIntegerField(unique=True)
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    category = models.CharField(max_length=120, db_index=True)
    brand = models.CharField(max_length=120, blank=True, db_index=True)
    sku = models.CharField(max_length=120, blank=True, db_index=True)
    source_price = models.DecimalField(max_digits=12, decimal_places=2)
    source_discount_percentage = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
    )
    source_stock = models.PositiveIntegerField(default=0)
    availability_status = models.CharField(max_length=80, blank=True)
    thumbnail_url = models.URLField(max_length=500, blank=True)
    images = models.JSONField(default=list, blank=True)
    raw_payload = models.JSONField(default=dict, blank=True)
    last_synced_at = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("title", "external_id")
        constraints = [
            models.CheckConstraint(
                condition=Q(source_price__gte=0),
                name="catalog_imported_product_price_gte_0",
            ),
            models.CheckConstraint(
                condition=(
                    Q(source_discount_percentage__isnull=True)
                    | Q(
                        source_discount_percentage__gte=0,
                        source_discount_percentage__lte=100,
                    )
                ),
                name="catalog_imported_product_discount_range",
            ),
        ]
        indexes = [
            models.Index(
                fields=("category", "brand"),
                name="catalog_category_brand_idx",
            ),
        ]

    def __str__(self) -> str:
        return f"{self.external_id} - {self.title}"


class Listing(models.Model):
    product = models.ForeignKey(
        ImportedProduct,
        on_delete=models.PROTECT,
        related_name="listings",
    )
    slug = models.SlugField(max_length=255, unique=True)
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    price = models.DecimalField(max_digits=12, decimal_places=2)
    promotional_price = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True,
    )
    stock_quantity = models.PositiveIntegerField(default=0)
    active = models.BooleanField(default=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("title", "id")
        constraints = [
            models.CheckConstraint(
                condition=Q(price__gt=0),
                name="catalog_listing_price_gt_0",
            ),
            models.CheckConstraint(
                condition=(
                    Q(promotional_price__isnull=True)
                    | Q(
                        promotional_price__gt=0,
                        promotional_price__lt=models.F("price"),
                    )
                ),
                name="catalog_listing_promo_valid",
            ),
        ]

    @property
    def effective_price(self):
        return self.promotional_price or self.price

    @property
    def is_on_sale(self) -> bool:
        return self.promotional_price is not None

    @property
    def is_available(self) -> bool:
        return self.active and self.stock_quantity > 0

    def __str__(self) -> str:
        return self.title


class Menu(models.Model):
    name = models.CharField(max_length=120)
    slug = models.SlugField(max_length=120, unique=True)
    listings = models.ManyToManyField(
        Listing,
        through="MenuListing",
        related_name="menus",
        blank=True,
    )
    display_order = models.PositiveIntegerField(default=0, db_index=True)
    active = models.BooleanField(default=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("display_order", "name", "id")

    def __str__(self) -> str:
        return self.name


class MenuListing(models.Model):
    menu = models.ForeignKey(
        Menu,
        on_delete=models.CASCADE,
        related_name="listing_links",
    )
    listing = models.ForeignKey(
        Listing,
        on_delete=models.CASCADE,
        related_name="menu_links",
    )
    display_order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ("display_order", "id")
        constraints = [
            models.UniqueConstraint(
                fields=("menu", "listing"),
                name="catalog_unique_menu_listing",
            ),
        ]
        indexes = [
            models.Index(
                fields=("menu", "display_order"),
                name="catalog_menu_order_idx",
            ),
        ]

    def __str__(self) -> str:
        return f"{self.menu} - {self.listing}"


class BannerQuerySet(models.QuerySet):
    def visible(self, at=None):
        moment = at or timezone.now()
        return self.filter(active=True).filter(
            Q(starts_at__isnull=True) | Q(starts_at__lte=moment),
            Q(ends_at__isnull=True) | Q(ends_at__gt=moment),
        )


class Banner(models.Model):
    title = models.CharField(max_length=160)
    image_url = models.URLField(max_length=500)
    link_url = models.CharField(
        max_length=500,
        blank=True,
        validators=(validate_link_url,),
    )
    alt_text = models.CharField(max_length=255, blank=True)
    display_order = models.PositiveIntegerField(default=0, db_index=True)
    active = models.BooleanField(default=True, db_index=True)
    starts_at = models.DateTimeField(null=True, blank=True)
    ends_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = BannerQuerySet.as_manager()

    class Meta:
        ordering = ("display_order", "id")
        constraints = [
            models.CheckConstraint(
                condition=(
                    Q(starts_at__isnull=True)
                    | Q(ends_at__isnull=True)
                    | Q(ends_at__gt=models.F("starts_at"))
                ),
                name="catalog_banner_period_valid",
            ),
        ]

    def is_visible(self, at=None) -> bool:
        moment = at or timezone.now()
        starts_ok = self.starts_at is None or self.starts_at <= moment
        ends_ok = self.ends_at is None or self.ends_at > moment
        return self.active and starts_ok and ends_ok

    def __str__(self) -> str:
        return self.title
