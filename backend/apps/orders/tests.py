import uuid
from decimal import Decimal

from django.utils import timezone
from rest_framework import status
from rest_framework.reverse import reverse
from rest_framework.test import APITestCase

from apps.catalog.models import ImportedProduct, Listing
from apps.customers.models import Customer

from .models import Order


class CheckoutAPITests(APITestCase):
    def setUp(self):
        self.product = ImportedProduct.objects.create(
            external_id=101,
            title="Secador profissional",
            description="Produto de teste",
            category="beleza",
            brand="Mosaico",
            sku="SEC-101",
            source_price=Decimal("120.00"),
            source_stock=10,
            thumbnail_url="https://example.com/secador.png",
            images=["https://example.com/secador.png"],
            last_synced_at=timezone.now(),
        )
        self.listing = Listing.objects.create(
            product=self.product,
            slug="secador-profissional",
            title="Secador profissional",
            description="Potente e compacto",
            price=Decimal("120.00"),
            promotional_price=Decimal("99.90"),
            stock_quantity=5,
            active=True,
        )
        self.url = reverse("orders:checkout")

    def payload(self, *, last_four="4242", quantity=2, price="99.90", key=None):
        return {
            "customer": {"name": "  Ana Lima  ", "email": "ANA@EXAMPLE.COM"},
            "items": [
                {
                    "listing_id": self.listing.id,
                    "quantity": quantity,
                    "expected_unit_price": price,
                }
            ],
            "payment": {"card_last_four": last_four},
            "idempotency_key": str(key or uuid.uuid4()),
        }

    def test_approved_checkout_creates_snapshots_and_reduces_stock(self):
        response = self.client.post(self.url, self.payload(), format="json")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["payment_status"], "approved")
        self.assertEqual(response.data["status"], "payment_approved")
        self.assertEqual(response.data["subtotal"], "199.80")
        self.assertEqual(response.data["total"], "199.80")
        self.assertEqual(response.data["payment_last_four"], "4242")
        self.assertNotIn("idempotency_key", response.data)
        self.assertEqual(response.data["customer"]["name"], "Ana Lima")
        self.assertEqual(response.data["customer"]["email"], "ana@example.com")

        self.listing.refresh_from_db()
        self.assertEqual(self.listing.stock_quantity, 3)
        order = Order.objects.get()
        item = order.items.get()
        self.assertEqual(item.listing_title, "Secador profissional")
        self.assertEqual(item.product_external_id, 101)
        self.assertEqual(item.sku, "SEC-101")
        self.assertEqual(item.unit_price, Decimal("99.90"))
        self.assertEqual(item.subtotal, Decimal("199.80"))
        self.assertEqual(item.image_url, "https://example.com/secador.png")

    def test_declined_checkout_keeps_stock(self):
        response = self.client.post(
            self.url,
            self.payload(last_four="0000"),
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["payment_status"], "declined")
        self.assertEqual(response.data["status"], "payment_declined")
        self.listing.refresh_from_db()
        self.assertEqual(self.listing.stock_quantity, 5)

    def test_repeated_idempotency_key_returns_order_without_second_stock_change(self):
        key = uuid.uuid4()
        payload = self.payload(key=key)

        first = self.client.post(self.url, payload, format="json")
        second = self.client.post(self.url, payload, format="json")

        self.assertEqual(first.status_code, status.HTTP_201_CREATED)
        self.assertEqual(second.status_code, status.HTTP_200_OK)
        self.assertEqual(first.data["public_id"], second.data["public_id"])
        self.assertEqual(Order.objects.count(), 1)
        self.listing.refresh_from_db()
        self.assertEqual(self.listing.stock_quantity, 3)

    def test_reusing_idempotency_key_for_changed_payload_returns_conflict(self):
        key = uuid.uuid4()
        self.client.post(self.url, self.payload(key=key), format="json")

        response = self.client.post(
            self.url,
            self.payload(key=key, quantity=1),
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_409_CONFLICT)
        self.assertEqual(response.data["code"], "idempotency_conflict")
        self.assertEqual(Order.objects.count(), 1)

    def test_price_change_returns_current_price_and_rolls_back(self):
        response = self.client.post(
            self.url,
            self.payload(price="89.90"),
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_409_CONFLICT)
        self.assertEqual(response.data["code"], "price_changed")
        self.assertEqual(response.data["current_price"], "99.90")
        self.assertFalse(Order.objects.exists())
        self.assertFalse(Customer.objects.exists())
        self.listing.refresh_from_db()
        self.assertEqual(self.listing.stock_quantity, 5)

    def test_insufficient_stock_returns_available_quantity_and_rolls_back(self):
        response = self.client.post(
            self.url,
            self.payload(quantity=6),
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_409_CONFLICT)
        self.assertEqual(response.data["code"], "insufficient_stock")
        self.assertEqual(response.data["available"], 5)
        self.assertFalse(Order.objects.exists())

    def test_inactive_or_missing_listing_is_unavailable(self):
        self.listing.active = False
        self.listing.save(update_fields=("active",))
        inactive_response = self.client.post(self.url, self.payload(), format="json")

        missing_payload = self.payload()
        missing_payload["items"][0]["listing_id"] = 99999
        missing_response = self.client.post(self.url, missing_payload, format="json")

        self.assertEqual(inactive_response.status_code, status.HTTP_409_CONFLICT)
        self.assertEqual(inactive_response.data["code"], "listing_unavailable")
        self.assertEqual(missing_response.status_code, status.HTTP_409_CONFLICT)
        self.assertEqual(missing_response.data["listing_id"], 99999)
        self.assertFalse(Order.objects.exists())

    def test_rejects_duplicate_items_unknown_fields_and_full_card_number(self):
        duplicate_payload = self.payload()
        duplicate_payload["items"].append(duplicate_payload["items"][0].copy())
        duplicate_response = self.client.post(
            self.url, duplicate_payload, format="json"
        )

        unsafe_payload = self.payload()
        unsafe_payload["payment"]["card_number"] = "4111111111111111"
        unsafe_response = self.client.post(self.url, unsafe_payload, format="json")

        self.assertEqual(duplicate_response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("items", duplicate_response.data)
        self.assertEqual(unsafe_response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("card_number", unsafe_response.data["payment"])
        self.assertFalse(Order.objects.exists())

    def test_validates_four_digit_payment_reference(self):
        for invalid_value in ("123", "12345", "12a4"):
            payload = self.payload(last_four=invalid_value)
            response = self.client.post(self.url, payload, format="json")
            self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

        self.assertFalse(Order.objects.exists())

    def test_customer_is_reused_by_normalized_email(self):
        first = self.client.post(self.url, self.payload(quantity=1), format="json")
        second_payload = self.payload(quantity=1)
        second_payload["customer"] = {
            "name": "Ana Souza",
            "email": "  ana@example.com  ",
        }
        second = self.client.post(self.url, second_payload, format="json")

        self.assertEqual(first.status_code, status.HTTP_201_CREATED)
        self.assertEqual(second.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Customer.objects.count(), 1)
        customer = Customer.objects.get()
        self.assertEqual(customer.name, "Ana Souza")
        self.assertEqual(customer.orders.count(), 2)

    def test_order_snapshot_survives_listing_changes_and_deletion(self):
        response = self.client.post(
            self.url,
            self.payload(quantity=1),
            format="json",
        )
        order = Order.objects.get(public_id=response.data["public_id"])

        self.listing.title = "Título alterado"
        self.listing.promotional_price = Decimal("79.90")
        self.listing.save(update_fields=("title", "promotional_price"))
        self.listing.delete()

        item = order.items.get()
        self.assertIsNone(item.listing)
        self.assertEqual(item.listing_title, "Secador profissional")
        self.assertEqual(item.unit_price, Decimal("99.90"))
        self.assertEqual(item.subtotal, Decimal("99.90"))
