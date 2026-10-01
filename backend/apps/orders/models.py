import uuid
from decimal import Decimal

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

    class PaymentMethod(models.TextChoices):
        CARD = "card", "Cartão"
        PIX = "pix", "Pix"

    public_id = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    customer = models.ForeignKey(
        Customer,
        on_delete=models.PROTECT,
        related_name="orders",
    )
    customer_name = models.CharField(max_length=150)
    status = models.CharField(max_length=32, choices=Status.choices)
    payment_status = models.CharField(max_length=16, choices=PaymentStatus.choices)
    payment_method = models.CharField(
        max_length=8,
        choices=PaymentMethod.choices,
        default=PaymentMethod.CARD,
    )
    # Sum of the line items at the price charged, before Pix discount and shipping.
    subtotal = models.DecimalField(max_digits=12, decimal_places=2)
    # Savings snapshot: list price minus promotional price across the items.
    product_discount = models.DecimalField(
        max_digits=12, decimal_places=2, default=Decimal("0.00")
    )
    pix_discount = models.DecimalField(
        max_digits=12, decimal_places=2, default=Decimal("0.00")
    )
    shipping_fee = models.DecimalField(
        max_digits=12, decimal_places=2, default=Decimal("0.00")
    )
    # Fee the order would have paid without reaching the free shipping minimum.
    shipping_saved = models.DecimalField(
        max_digits=12, decimal_places=2, default=Decimal("0.00")
    )
    total = models.DecimalField(max_digits=12, decimal_places=2)
    payment_last_four = models.CharField(
        max_length=4,
        blank=True,
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
            models.CheckConstraint(
                condition=Q(
                    product_discount__gte=0,
                    pix_discount__gte=0,
                    shipping_fee__gte=0,
                    shipping_saved__gte=0,
                ),
                name="orders_order_adjustments_gte_0",
            ),
            models.CheckConstraint(
                condition=Q(
                    total=F("subtotal") - F("pix_discount") + F("shipping_fee")
                ),
                name="orders_order_total_matches_breakdown",
            ),
            models.CheckConstraint(
                condition=(
                    Q(payment_method="card", payment_last_four__regex=r"^\d{4}$")
                    | Q(payment_method="pix", payment_last_four="")
                ),
                name="orders_order_payment_reference_matches_method",
            ),
            models.CheckConstraint(
                condition=Q(payment_method="pix") | Q(pix_discount=0),
                name="orders_order_pix_discount_only_for_pix",
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
