from decimal import Decimal

from django.conf import settings
from django.db.models import (
    Case,
    DecimalField,
    ExpressionWrapper,
    F,
    IntegerField,
    OuterRef,
    Subquery,
    Sum,
    Value,
    When,
)
from django.db.models.functions import Coalesce

from apps.catalog.models import Listing
from apps.orders.models import Order, OrderItem


MONEY_FIELD = DecimalField(max_digits=12, decimal_places=2)


def active_listing_queryset():
    approved_sales = (
        OrderItem.objects.filter(
            listing_id=OuterRef("pk"),
            order__payment_status=Order.PaymentStatus.APPROVED,
        )
        .values("listing_id")
        .annotate(total=Sum("quantity"))
        .values("total")[:1]
    )
    effective_price = Case(
        When(promotional_price__isnull=False, then=F("promotional_price")),
        default=F("price"),
        output_field=MONEY_FIELD,
    )

    return Listing.objects.filter(active=True).select_related("product").annotate(
        storefront_effective_price=effective_price,
        storefront_discount=ExpressionWrapper(
            F("price") - effective_price,
            output_field=MONEY_FIELD,
        ),
        sales_count=Coalesce(
            Subquery(approved_sales, output_field=IntegerField()),
            Value(0),
        ),
    )


def filter_and_order_listings(queryset, filters, *, default_ordering="best_selling"):
    minimum = filters.get("min_price")
    maximum = filters.get("max_price")
    if minimum is not None:
        queryset = queryset.filter(storefront_effective_price__gte=minimum)
    if maximum is not None:
        queryset = queryset.filter(storefront_effective_price__lte=maximum)
    if filters.get("free_shipping"):
        queryset = queryset.filter(free_shipping=True)

    ordering = filters.get("ordering") or default_ordering
    if ordering == "featured" and default_ordering != "featured":
        ordering = default_ordering
    ordering_fields = {
        "best_selling": ("-sales_count", "-created_at", "id"),
        "least_selling": ("sales_count", "created_at", "id"),
        "price_asc": ("storefront_effective_price", "id"),
        "price_desc": ("-storefront_effective_price", "id"),
        "newest": ("-created_at", "id"),
        "oldest": ("created_at", "id"),
        "discount_desc": ("-storefront_discount", "storefront_effective_price", "id"),
        "featured": ("menu_links__display_order", "id"),
    }
    return queryset.order_by(*ordering_fields[ordering])
