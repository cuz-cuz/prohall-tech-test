from dataclasses import dataclass
from decimal import Decimal, InvalidOperation, ROUND_HALF_UP
from typing import Any

from django.db import transaction
from django.utils import timezone

from apps.catalog.models import ImportedProduct

from .dummyjson import DummyJSONClient


MONEY_QUANTUM = Decimal("0.01")


class ProductImportError(ValueError):
    """Raised when a product cannot be normalized safely."""


@dataclass(frozen=True)
class ImportSummary:
    created: int
    updated: int

    @property
    def total(self) -> int:
        return self.created + self.updated


def normalize_product(payload: dict[str, Any]) -> dict[str, Any]:
    if not isinstance(payload, dict):
        raise ProductImportError("Product payload must be an object.")

    external_id = payload.get("id")
    if isinstance(external_id, bool) or not isinstance(external_id, int):
        raise ProductImportError("Product id must be an integer.")
    if external_id < 1:
        raise ProductImportError("Product id must be positive.")

    title = _text(payload, "title", required=True, max_length=255)
    category = _text(payload, "category", required=True, max_length=120)
    images = payload.get("images") or []
    if not isinstance(images, list) or not all(isinstance(item, str) for item in images):
        raise ProductImportError("Product images must be a list of strings.")

    source_stock = payload.get("stock", 0)
    if isinstance(source_stock, bool) or not isinstance(source_stock, int):
        raise ProductImportError("Product stock must be an integer.")
    if source_stock < 0:
        raise ProductImportError("Product stock cannot be negative.")

    source_discount = _decimal(
        payload.get("discountPercentage"),
        field="discountPercentage",
        nullable=True,
    )
    if source_discount is not None and not Decimal("0") <= source_discount <= Decimal(
        "100"
    ):
        raise ProductImportError("Product discount must be between 0 and 100.")

    return {
        "external_id": external_id,
        "title": title,
        "description": _text(payload, "description"),
        "category": category,
        "brand": _text(payload, "brand", max_length=120),
        "sku": _text(payload, "sku", max_length=120),
        "source_price": _decimal(payload.get("price"), field="price"),
        "source_discount_percentage": source_discount,
        "source_stock": source_stock,
        "availability_status": _text(
            payload,
            "availabilityStatus",
            max_length=80,
        ),
        "thumbnail_url": _text(payload, "thumbnail", max_length=500),
        "images": images,
        "raw_payload": payload,
    }


def sync_products(*, client: DummyJSONClient | None = None) -> ImportSummary:
    owns_client = client is None
    importer_client = client or DummyJSONClient()

    try:
        payloads = importer_client.fetch_all_products()
    finally:
        if owns_client:
            importer_client.close()

    normalized_products = [normalize_product(payload) for payload in payloads]
    synced_at = timezone.now()
    created_count = 0
    updated_count = 0

    with transaction.atomic():
        for product in normalized_products:
            values = product.copy()
            external_id = values.pop("external_id")
            values["last_synced_at"] = synced_at
            _, created = ImportedProduct.objects.update_or_create(
                external_id=external_id,
                defaults=values,
            )
            if created:
                created_count += 1
            else:
                updated_count += 1

    return ImportSummary(created=created_count, updated=updated_count)


def _text(
    payload: dict[str, Any],
    field: str,
    *,
    required: bool = False,
    max_length: int | None = None,
) -> str:
    value = payload.get(field)
    if value is None:
        value = ""
    if not isinstance(value, str):
        raise ProductImportError(f"Product field '{field}' must be text.")

    value = value.strip()
    if required and not value:
        raise ProductImportError(f"Product field '{field}' is required.")
    if max_length is not None and len(value) > max_length:
        raise ProductImportError(
            f"Product field '{field}' exceeds {max_length} characters."
        )
    return value


def _decimal(
    value: Any,
    *,
    field: str,
    nullable: bool = False,
) -> Decimal | None:
    if value is None and nullable:
        return None
    if isinstance(value, bool):
        raise ProductImportError(f"Product field '{field}' must be decimal.")

    try:
        decimal_value = Decimal(str(value))
    except (InvalidOperation, TypeError, ValueError) as exc:
        raise ProductImportError(
            f"Product field '{field}' must be decimal."
        ) from exc

    if not decimal_value.is_finite():
        raise ProductImportError(f"Product field '{field}' must be finite.")
    decimal_value = decimal_value.quantize(MONEY_QUANTUM, rounding=ROUND_HALF_UP)
    if decimal_value < 0:
        raise ProductImportError(f"Product field '{field}' cannot be negative.")
    return decimal_value
