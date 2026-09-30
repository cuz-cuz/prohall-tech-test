from django.db import models
from django.db.models import Q


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
        return f"{self.external_id} — {self.title}"
