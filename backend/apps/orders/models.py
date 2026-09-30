import uuid

from django.core.validators import RegexValidator
from django.db import models
from django.db.models import F, Q

from apps.catalog.models import Listing
from apps.customers.models import Customer


class Order(models.Model):
    class Status(models.TextChoices):
        PAYMENT_APPROVED = "payment_approved", "Pagamento aprovado"
        PAYMENT_DECLINED = "payment_declined", "Pagamento recusado"
        CANCELLED = "cancelled", "Cancelado"

    class PaymentStatus(models.TextChoices):
        APPROVED = "approved", "Aprovado"
        DECLINED = "declined", "Recusado"

    public_id = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    customer = models.ForeignKey(
        Customer,
        on_delete=models.PROTECT,
        related_name="orders",
    )
    status = models.CharField(max_length=32, choices=Status.choices)
    payment_status = models.CharField(max_length=16, choices=PaymentStatus.choices)
    subtotal = models.DecimalField(max_digits=12, decimal_places=2)
    total = models.DecimalField(max_digits=12, decimal_places=2)
    payment_last_four = models.CharField(
        max_length=4,
        validators=(RegexValidator(r"^\d{4}$"),),
    )
    idempotency_key = models.UUIDField(unique=True, editable=False)
    idempotency_fingerprint = models.CharField(max_length=64, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("-created_at", "-id")
        constraints = [
            models.CheckConstraint(
                condition=Q(subtotal__gte=0),
                name="orders_order_subtotal_gte_0",
            ),
            models.CheckConstraint(
                condition=Q(total__gte=0),
                name="orders_order_total_gte_0",
            ),
        ]

    def __str__(self) -> str:
        return str(self.public_id)


class OrderItem(models.Model):
    order = models.ForeignKey(
        Order,
        on_delete=models.CASCADE,
        related_name="items",
    )
    listing = models.ForeignKey(
        Listing,
        on_delete=models.SET_NULL,
        related_name="order_items",
        null=True,
        blank=True,
    )
    listing_title = models.CharField(max_length=255)
    product_external_id = models.PositiveIntegerField()
    sku = models.CharField(max_length=120, blank=True)
    unit_price = models.DecimalField(max_digits=12, decimal_places=2)
    quantity = models.PositiveIntegerField()
    subtotal = models.DecimalField(max_digits=12, decimal_places=2)
    image_url = models.URLField(max_length=500, blank=True)

    class Meta:
        ordering = ("id",)
        constraints = [
            models.CheckConstraint(
                condition=Q(unit_price__gt=0),
                name="orders_item_unit_price_gt_0",
            ),
            models.CheckConstraint(
                condition=Q(quantity__gt=0),
                name="orders_item_quantity_gt_0",
            ),
            models.CheckConstraint(
                condition=Q(subtotal__gt=0),
                name="orders_item_subtotal_gt_0",
            ),
            models.CheckConstraint(
                condition=Q(subtotal=F("unit_price") * F("quantity")),
                name="orders_item_subtotal_exact",
            ),
        ]

    def __str__(self) -> str:
        return f"{self.quantity} × {self.listing_title}"
