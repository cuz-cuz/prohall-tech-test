import hashlib
import json
import secrets
from dataclasses import dataclass
from datetime import timedelta
from decimal import Decimal

from django.contrib.auth.hashers import check_password, make_password
from django.core.mail import send_mail
from django.db import IntegrityError, transaction
from django.utils import timezone

from apps.catalog.models import Listing
from apps.customers.models import (
    Customer,
    CustomerAccessCode,
    normalize_customer_email,
)

from .models import Order, OrderItem


@dataclass
class CheckoutConflict(Exception):
    code: str
    message: str
    details: dict | None = None

    def as_response(self):
        return {"code": self.code, "message": self.message, **(self.details or {})}


def _payload_fingerprint(data):
    canonical_payload = {
        "customer": {
            "name": data["customer"]["name"].strip(),
            "email": normalize_customer_email(data["customer"]["email"]),
        },
        "items": sorted(
            (
                {
                    "listing_id": item["listing_id"],
                    "quantity": item["quantity"],
                    "expected_unit_price": format(
                        item["expected_unit_price"], ".2f"
                    ),
                }
                for item in data["items"]
            ),
            key=lambda item: item["listing_id"],
        ),
        "payment": {"card_last_four": data["payment"]["card_last_four"]},
    }
    encoded = json.dumps(
        canonical_payload,
        ensure_ascii=False,
        separators=(",", ":"),
        sort_keys=True,
    ).encode("utf-8")
    return hashlib.sha256(encoded).hexdigest()


def _order_for_key(idempotency_key):
    return (
        Order.objects.filter(idempotency_key=idempotency_key)
        .select_related("customer")
        .prefetch_related("items")
        .first()
    )


def _replay_or_conflict(order, fingerprint):
    if order.idempotency_fingerprint != fingerprint:
        raise CheckoutConflict(
            "idempotency_conflict",
            "Esta chave de idempotência já foi usada em outro checkout.",
        )
    return order, True


def _get_or_create_customer(customer_data):
    try:
        with transaction.atomic():
            return Customer.objects.get_or_create(
                email=customer_data["email"],
                defaults={"name": customer_data["name"]},
            )
    except IntegrityError:
        # Two unrelated carts can create the same normalized e-mail at once.
        return Customer.objects.get(email=customer_data["email"]), False


def checkout_order(data):
    """Create an order once, atomically validating price and locked stock."""

    fingerprint = _payload_fingerprint(data)
    idempotency_key = data["idempotency_key"]
    existing_order = _order_for_key(idempotency_key)
    if existing_order:
        return _replay_or_conflict(existing_order, fingerprint)

    try:
        return _checkout_order_atomic(data, fingerprint)
    except IntegrityError:
        # A concurrent request with the same key may have committed first.
        existing_order = _order_for_key(idempotency_key)
        if existing_order:
            return _replay_or_conflict(existing_order, fingerprint)
        raise


def create_customer_access_code(customer):
    code = f"{secrets.randbelow(1_000_000):06d}"
    now = timezone.now()
    with transaction.atomic():
        CustomerAccessCode.objects.filter(
            customer=customer,
            used_at__isnull=True,
        ).update(used_at=now)
        CustomerAccessCode.objects.create(
            customer=customer,
            code_hash=make_password(code),
            expires_at=now + timedelta(minutes=10),
        )
    send_mail(
        subject="Seu código de acesso à Mosaico",
        message=f"Seu código de acesso é {code}. Ele expira em 10 minutos.",
        from_email=None,
        recipient_list=[customer.email],
        fail_silently=False,
    )
    return code


@transaction.atomic
def verify_customer_access_code(*, email, code):
    now = timezone.now()
    customer = Customer.objects.filter(email=email, is_active=True).first()
    if customer is None:
        return None
    access_code = (
        CustomerAccessCode.objects.select_for_update()
        .filter(
            customer=customer,
            used_at__isnull=True,
            expires_at__gt=now,
            attempt_count__lt=5,
        )
        .order_by("-created_at", "-id")
        .first()
    )
    if access_code is None:
        return None
    if not check_password(code, access_code.code_hash):
        access_code.attempt_count += 1
        if access_code.attempt_count >= 5:
            access_code.used_at = now
        access_code.save(update_fields=("attempt_count", "used_at"))
        return None
    access_code.used_at = now
    access_code.save(update_fields=("used_at",))
    return customer


@transaction.atomic
def _checkout_order_atomic(data, fingerprint):
    idempotency_key = data["idempotency_key"]
    existing_order = _order_for_key(idempotency_key)
    if existing_order:
        return _replay_or_conflict(existing_order, fingerprint)

    requested_items = {item["listing_id"]: item for item in data["items"]}
    locked_listings = {
        listing.id: listing
        for listing in Listing.objects.select_for_update(of=("self",))
        .filter(id__in=sorted(requested_items))
        .select_related("product")
        .order_by("id")
    }

    # Requests for the same cart lock rows in a stable order. Check the key again
    # after the lock so a waiting duplicate never decrements stock twice.
    existing_order = _order_for_key(idempotency_key)
    if existing_order:
        return _replay_or_conflict(existing_order, fingerprint)

    missing_ids = sorted(set(requested_items) - set(locked_listings))
    if missing_ids:
        raise CheckoutConflict(
            "listing_unavailable",
            "Um produto do carrinho não está mais disponível.",
            {"listing_id": missing_ids[0]},
        )

    prepared_items = []
    subtotal = Decimal("0.00")
    for listing_id in sorted(requested_items):
        requested = requested_items[listing_id]
        listing = locked_listings[listing_id]
        if not listing.active:
            raise CheckoutConflict(
                "listing_unavailable",
                "Um produto do carrinho não está mais disponível.",
                {"listing_id": listing.id},
            )
        if listing.stock_quantity < requested["quantity"]:
            raise CheckoutConflict(
                "insufficient_stock",
                "A quantidade solicitada não está disponível.",
                {
                    "listing_id": listing.id,
                    "available": listing.stock_quantity,
                },
            )

        unit_price = listing.effective_price
        if unit_price != requested["expected_unit_price"]:
            raise CheckoutConflict(
                "price_changed",
                "O preço de um produto mudou. Revise o carrinho antes de continuar.",
                {
                    "listing_id": listing.id,
                    "current_price": format(unit_price, ".2f"),
                },
            )

        item_subtotal = unit_price * requested["quantity"]
        subtotal += item_subtotal
        prepared_items.append((listing, requested["quantity"], item_subtotal))

    customer_data = data["customer"]
    customer, created = _get_or_create_customer(customer_data)
    if not created and customer.name != customer_data["name"]:
        customer.name = customer_data["name"]
        customer.save(update_fields=("name", "updated_at"))

    payment_last_four = data["payment"]["card_last_four"]
    approved = payment_last_four != "0000"
    payment_status = (
        Order.PaymentStatus.APPROVED
        if approved
        else Order.PaymentStatus.DECLINED
    )
    order_status = (
        Order.Status.PAYMENT_APPROVED
        if approved
        else Order.Status.PAYMENT_DECLINED
    )
    order = Order.objects.create(
        customer=customer,
        status=order_status,
        payment_status=payment_status,
        subtotal=subtotal,
        total=subtotal,
        payment_last_four=payment_last_four,
        idempotency_key=idempotency_key,
        idempotency_fingerprint=fingerprint,
    )

    OrderItem.objects.bulk_create(
        [
            OrderItem(
                order=order,
                listing=listing,
                listing_title=listing.title,
                product_external_id=listing.product.external_id,
                sku=listing.product.sku,
                unit_price=listing.effective_price,
                quantity=quantity,
                subtotal=item_subtotal,
                image_url=listing.product.primary_image_url,
            )
            for listing, quantity, item_subtotal in prepared_items
        ]
    )

    if approved:
        updated_at = timezone.now()
        for listing, quantity, _ in prepared_items:
            listing.stock_quantity -= quantity
            listing.updated_at = updated_at
        Listing.objects.bulk_update(
            [listing for listing, _, _ in prepared_items],
            ("stock_quantity", "updated_at"),
        )

    return _order_for_key(idempotency_key), False
