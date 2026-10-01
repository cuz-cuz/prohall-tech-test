import uuid
import re
import threading
from decimal import Decimal

from django.core import mail
from django.core.cache import cache
from django.db import IntegrityError, close_old_connections, connection, connections, transaction
from django.db.migrations.executor import MigrationExecutor
from django.utils import timezone
from django.test import TransactionTestCase, override_settings
from rest_framework import status
from rest_framework.reverse import reverse
from rest_framework.test import APITestCase
from rest_framework.test import APIClient

from apps.catalog.models import ImportedProduct, Listing
from apps.customers.models import Customer, CustomerAccessCode

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


@override_settings(
    REST_FRAMEWORK={
        "DEFAULT_THROTTLE_RATES": {
            "customer_access_request": "100/hour",
            "customer_access_verify": "100/hour",
        }
    }
)
class CustomerOrdersAndAccessTests(APITestCase):
    def setUp(self):
        cache.clear()
        self.customer = Customer.objects.create(
            name="Ana Lima",
            email="ana@example.com",
        )
        self.other_customer = Customer.objects.create(
            name="Bruno Lima",
            email="bruno@example.com",
        )
        self.orders_url = reverse("orders:my-orders")
        self.session_url = reverse("orders:customer-session")
        self.request_code_url = reverse("orders:customer-access-request")
        self.verify_code_url = reverse("orders:customer-access-verify")

    def make_order(self, customer):
        from apps.orders.models import Order

        return Order.objects.create(
            customer=customer,
            customer_name=customer.name,
            status=Order.Status.PAYMENT_APPROVED,
            payment_status=Order.PaymentStatus.APPROVED,
            subtotal=Decimal("12.50"),
            total=Decimal("12.50"),
            payment_last_four="4242",
            idempotency_key=uuid.uuid4(),
            idempotency_fingerprint="a" * 64,
        )

    def test_checkout_starts_customer_session_and_lists_owned_orders(self):
        product = ImportedProduct.objects.create(
            external_id=500,
            title="Produto de sessão",
            category="casa",
            source_price=Decimal("12.50"),
            last_synced_at=timezone.now(),
        )
        listing = Listing.objects.create(
            product=product,
            slug="produto-de-sessao",
            title="Produto de sessão",
            price=Decimal("12.50"),
            stock_quantity=3,
        )
        payload = {
            "customer": {"name": "Ana Lima", "email": "ana@example.com"},
            "items": [
                {
                    "listing_id": listing.pk,
                    "quantity": 1,
                    "expected_unit_price": "12.50",
                }
            ],
            "payment": {"card_last_four": "4242"},
            "idempotency_key": str(uuid.uuid4()),
        }

        checkout = self.client.post(reverse("orders:checkout"), payload, format="json")
        session = self.client.get(self.session_url)
        orders = self.client.get(self.orders_url)

        self.assertEqual(checkout.status_code, status.HTTP_201_CREATED)
        self.assertEqual(session.data["customer"]["email"], "ana@example.com")
        self.assertEqual(len(orders.data), 1)
        self.assertEqual(orders.data[0]["items"][0]["listing_title"], "Produto de sessão")

    def test_customer_session_cannot_read_another_customers_order(self):
        other_order = self.make_order(self.other_customer)
        self.client.get(self.request_code_url)
        session = self.client.session
        session["customer_id"] = self.customer.pk
        session.save()

        response = self.client.get(
            reverse("orders:my-order-detail", kwargs={"public_id": other_order.public_id})
        )

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_order_list_is_empty_until_customer_has_orders(self):
        session = self.client.session
        session["customer_id"] = self.customer.pk
        session.save()

        response = self.client.get(self.orders_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, [])

    def test_access_code_post_requires_csrf_cookie_and_header(self):
        csrf_client = APIClient(enforce_csrf_checks=True)
        csrf_client.get(self.session_url)
        csrf_secret = csrf_client.cookies["csrftoken"].value

        rejected = csrf_client.post(
            self.request_code_url,
            {"email": self.customer.email},
            format="json",
        )
        accepted = csrf_client.post(
            self.request_code_url,
            {"email": self.customer.email},
            format="json",
            HTTP_X_CSRFTOKEN=csrf_secret,
        )

        self.assertEqual(rejected.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(accepted.status_code, status.HTTP_200_OK)

    def test_checkout_requires_csrf_token(self):
        product = ImportedProduct.objects.create(
            external_id=501,
            title="Produto protegido por CSRF",
            category="casa",
            source_price=Decimal("12.50"),
            last_synced_at=timezone.now(),
        )
        listing = Listing.objects.create(
            product=product,
            slug="produto-protegido-csrf",
            title="Produto protegido por CSRF",
            price=Decimal("12.50"),
            stock_quantity=2,
        )
        payload = {
            "customer": {"name": "Ana Lima", "email": "ana@example.com"},
            "items": [
                {
                    "listing_id": listing.pk,
                    "quantity": 1,
                    "expected_unit_price": "12.50",
                }
            ],
            "payment": {"card_last_four": "4242"},
            "idempotency_key": str(uuid.uuid4()),
        }
        csrf_client = APIClient(enforce_csrf_checks=True)

        rejected = csrf_client.post(
            reverse("orders:checkout"), payload, format="json"
        )
        session = csrf_client.get(self.session_url)
        accepted = csrf_client.post(
            reverse("orders:checkout"),
            payload,
            format="json",
            HTTP_X_CSRFTOKEN=session.data["csrf_token"],
        )

        self.assertEqual(rejected.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(accepted.status_code, status.HTTP_201_CREATED)

    @override_settings(
        SESSION_COOKIE_SECURE=True,
        SESSION_COOKIE_HTTPONLY=True,
        SESSION_COOKIE_SAMESITE="Lax",
        CSRF_COOKIE_SECURE=True,
        CSRF_COOKIE_HTTPONLY=False,
        CSRF_COOKIE_SAMESITE="Lax",
    )
    def test_production_session_and_csrf_cookie_attributes(self):
        csrf_response = self.client.get(self.session_url)
        csrf_cookie = csrf_response.cookies["csrftoken"]

        self.client.post(
            self.request_code_url,
            {"email": self.customer.email},
            format="json",
        )
        code = re.search(r"\b(\d{6})\b", mail.outbox[-1].body).group(1)
        session_response = self.client.post(
            self.verify_code_url,
            {"email": self.customer.email, "code": code},
            format="json",
        )
        session_cookie = session_response.cookies["sessionid"]

        self.assertTrue(csrf_cookie["secure"])
        self.assertFalse(csrf_cookie["httponly"])
        self.assertEqual(csrf_cookie["samesite"], "Lax")
        self.assertTrue(session_cookie["secure"])
        self.assertTrue(session_cookie["httponly"])
        self.assertEqual(session_cookie["samesite"], "Lax")

    def test_access_code_is_hashed_single_use_and_authenticates_session(self):
        self.client.get(self.session_url)
        requested = self.client.post(
            self.request_code_url,
            {"email": " ANA@EXAMPLE.COM "},
            format="json",
        )
        code = re.search(r"\b(\d{6})\b", mail.outbox[-1].body).group(1)
        access_record = CustomerAccessCode.objects.get(customer=self.customer)

        self.assertEqual(requested.status_code, status.HTTP_200_OK)
        self.assertNotEqual(access_record.code_hash, code)
        self.assertTrue(access_record.code_hash.startswith("pbkdf2_sha256$"))

        verified = self.client.post(
            self.verify_code_url,
            {"email": "ana@example.com", "code": code},
            format="json",
        )
        session = self.client.get(self.session_url)
        replay = self.client.post(
            self.verify_code_url,
            {"email": "ana@example.com", "code": code},
            format="json",
        )

        self.assertEqual(verified.status_code, status.HTTP_200_OK)
        self.assertTrue(session.data["authenticated"])
        self.assertEqual(replay.status_code, status.HTTP_400_BAD_REQUEST)

    def test_fifth_invalid_code_attempt_expires_the_code(self):
        self.client.get(self.session_url)
        requested = self.client.post(
            self.request_code_url,
            {"email": self.customer.email},
            format="json",
        )
        self.assertEqual(requested.status_code, status.HTTP_200_OK)

        for _ in range(5):
            response = self.client.post(
                self.verify_code_url,
                {"email": self.customer.email, "code": "999999"},
                format="json",
            )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        record = CustomerAccessCode.objects.get(customer=self.customer)
        self.assertEqual(record.attempt_count, 5)
        self.assertIsNotNone(record.used_at)


class CheckoutAdditionalAPITests(CheckoutAPITests):
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

    def test_renaming_the_account_keeps_the_name_of_each_past_order(self):
        first = self.client.post(self.url, self.payload(quantity=1), format="json")
        renamed = self.payload(quantity=1)
        renamed["customer"] = {"name": "Ana Souza", "email": "ana@example.com"}
        second = self.client.post(self.url, renamed, format="json")

        self.assertEqual(first.data["customer"]["name"], "Ana Lima")
        self.assertEqual(second.data["customer"]["name"], "Ana Souza")

        # The account carries the newest name, each order carries its own.
        self.assertEqual(Customer.objects.get().name, "Ana Souza")
        self.assertEqual(
            Order.objects.get(public_id=first.data["public_id"]).customer_name,
            "Ana Lima",
        )

        # Reading the stored order back must not fall through to the account.
        listed = self.client.get(reverse("orders:my-orders"))
        self.assertEqual(
            [order["customer"]["name"] for order in listed.data],
            ["Ana Souza", "Ana Lima"],
        )
        self.assertEqual(
            {order["customer"]["email"] for order in listed.data},
            {"ana@example.com"},
        )

    def test_multi_item_order_total_is_the_exact_sum_of_its_items(self):
        second_product = ImportedProduct.objects.create(
            external_id=202,
            title="Batom matte",
            category="beauty",
            sku="BAT-202",
            source_price=Decimal("33.33"),
            last_synced_at=timezone.now(),
        )
        second_listing = Listing.objects.create(
            product=second_product,
            slug="batom-matte",
            title="Batom matte",
            price=Decimal("33.33"),
            stock_quantity=10,
            active=True,
        )
        payload = self.payload(quantity=3)
        payload["items"].append(
            {
                "listing_id": second_listing.id,
                "quantity": 7,
                "expected_unit_price": "33.33",
            }
        )

        response = self.client.post(self.url, payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        order = Order.objects.get(public_id=response.data["public_id"])
        # 3 x 99.90 + 7 x 33.33, to the cent.
        self.assertEqual(order.subtotal, Decimal("533.01"))
        self.assertEqual(order.total, order.subtotal)
        self.assertEqual(
            sum(item.subtotal for item in order.items.all()),
            order.subtotal,
        )
        self.assertEqual(response.data["subtotal"], "533.01")

    def test_database_rejects_total_different_from_breakdown(self):
        response = self.client.post(
            self.url,
            self.payload(quantity=1),
            format="json",
        )
        order = Order.objects.get(public_id=response.data["public_id"])

        with self.assertRaises(IntegrityError), transaction.atomic():
            Order.objects.filter(pk=order.pk).update(total=Decimal("1.00"))

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


class CheckoutPaymentMethodTests(CheckoutAPITests):
    def pix_payload(self, *, outcome="paid", quantity=2):
        payload = self.payload(quantity=quantity)
        payload["payment"] = {"method": "pix", "pix_outcome": outcome}
        return payload

    def test_paid_pix_applies_discount_and_reduces_stock(self):
        response = self.client.post(self.url, self.pix_payload(), format="json")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["payment_status"], "approved")
        self.assertEqual(response.data["payment_method"], "pix")
        self.assertEqual(response.data["payment_last_four"], "")
        self.assertEqual(response.data["subtotal"], "199.80")
        # (120.00 - 99.90) x 2 saved by the promotion.
        self.assertEqual(response.data["product_discount"], "40.20")
        self.assertEqual(response.data["pix_discount"], "19.98")
        # The free shipping minimum is checked against the products, before Pix.
        self.assertEqual(response.data["shipping_fee"], "0.00")
        self.assertEqual(response.data["shipping_saved"], "19.90")
        self.assertEqual(response.data["total"], "179.82")
        self.listing.refresh_from_db()
        self.assertEqual(self.listing.stock_quantity, 3)

    def test_expired_pix_is_declined_and_keeps_stock(self):
        response = self.client.post(
            self.url, self.pix_payload(outcome="expired"), format="json"
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["payment_status"], "declined")
        self.listing.refresh_from_db()
        self.assertEqual(self.listing.stock_quantity, 5)

    def test_card_order_below_minimum_pays_shipping_without_pix_discount(self):
        response = self.client.post(self.url, self.payload(quantity=1), format="json")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["payment_method"], "card")
        self.assertEqual(response.data["pix_discount"], "0.00")
        self.assertEqual(response.data["shipping_fee"], "19.90")
        self.assertEqual(response.data["shipping_saved"], "0.00")
        self.assertEqual(response.data["total"], "119.80")

    @override_settings(SHIPPING_FEE=Decimal("7.50"))
    def test_shipping_fee_follows_the_configured_value(self):
        response = self.client.post(self.url, self.payload(quantity=1), format="json")

        self.assertEqual(response.data["shipping_fee"], "7.50")
        self.assertEqual(response.data["total"], "107.40")

    def test_payment_fields_must_match_the_method(self):
        invalid_payments = (
            {"method": "pix", "pix_outcome": "paid", "card_last_four": "4242"},
            {"method": "pix"},
            {"method": "card"},
            {"method": "card", "card_last_four": "4242", "pix_outcome": "paid"},
            {"method": "boleto", "card_last_four": "4242"},
        )
        for payment in invalid_payments:
            with self.subTest(payment=payment):
                payload = self.payload()
                payload["payment"] = payment
                response = self.client.post(self.url, payload, format="json")
                self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(Order.objects.exists())

    def test_changing_the_payment_method_under_the_same_key_conflicts(self):
        key = uuid.uuid4()
        self.client.post(self.url, self.payload(key=key), format="json")
        payload = self.pix_payload()
        payload["idempotency_key"] = str(key)

        response = self.client.post(self.url, payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_409_CONFLICT)

    def test_database_rejects_pix_discount_on_card_orders(self):
        response = self.client.post(self.url, self.payload(), format="json")
        order = Order.objects.get(public_id=response.data["public_id"])

        with self.assertRaises(IntegrityError), transaction.atomic():
            Order.objects.filter(pk=order.pk).update(
                pix_discount=Decimal("1.00"), total=order.total - Decimal("1.00")
            )


class CheckoutConcurrencyTests(TransactionTestCase):
    reset_sequences = True

    def setUp(self):
        product = ImportedProduct.objects.create(
            external_id=901,
            title="Última unidade",
            category="teste",
            source_price=Decimal("49.90"),
            source_stock=1,
            last_synced_at=timezone.now(),
        )
        self.listing = Listing.objects.create(
            product=product,
            slug="ultima-unidade",
            title="Última unidade",
            price=Decimal("49.90"),
            stock_quantity=1,
            active=True,
        )
        self.url = reverse("orders:checkout")

    def _payload(self, suffix):
        return {
            "customer": {
                "name": f"Cliente {suffix}",
                "email": f"cliente-{suffix}@example.com",
            },
            "items": [
                {
                    "listing_id": self.listing.pk,
                    "quantity": 1,
                    "expected_unit_price": "49.90",
                }
            ],
            "payment": {"card_last_four": "4242"},
            "idempotency_key": str(uuid.uuid4()),
        }

    def test_only_one_concurrent_checkout_buys_the_last_unit(self):
        barrier = threading.Barrier(3)
        results = []
        errors = []

        def submit(suffix):
            close_old_connections()
            try:
                client = APIClient()
                barrier.wait(timeout=5)
                response = client.post(
                    self.url,
                    self._payload(suffix),
                    format="json",
                )
                results.append((response.status_code, response.data.get("code")))
            except Exception as exc:  # pragma: no cover - reported by assertion
                errors.append(exc)
            finally:
                connections.close_all()

        threads = [
            threading.Thread(target=submit, args=(suffix,))
            for suffix in ("a", "b")
        ]
        for thread in threads:
            thread.start()
        barrier.wait(timeout=5)
        for thread in threads:
            thread.join(timeout=10)

        self.assertFalse(errors)
        self.assertTrue(all(not thread.is_alive() for thread in threads))
        self.assertEqual(
            sorted(results),
            [
                (status.HTTP_201_CREATED, None),
                (status.HTTP_409_CONFLICT, "insufficient_stock"),
            ],
        )
        self.listing.refresh_from_db()
        self.assertEqual(self.listing.stock_quantity, 0)
        self.assertEqual(Order.objects.count(), 1)


class OrderCustomerNameBackfillTests(TransactionTestCase):
    """The snapshot column is added to a table that already holds orders."""

    migrate_from = ("orders", "0002_order_orders_order_total_matches_subtotal")
    migrate_to = ("orders", "0003_order_customer_name")

    def tearDown(self):
        # Leave the schema at the latest migration for the remaining tests.
        MigrationExecutor(connection).migrate([self.migrate_to])

    def test_backfill_copies_the_account_name_into_existing_orders(self):
        executor = MigrationExecutor(connection)
        executor.migrate([self.migrate_from])
        old_apps = executor.loader.project_state([self.migrate_from]).apps
        OldCustomer = old_apps.get_model("customers", "Customer")
        OldOrder = old_apps.get_model("orders", "Order")

        first = OldCustomer.objects.create(name="Ana Lima", email="ana@example.com")
        second = OldCustomer.objects.create(name="Bruno Lima", email="bruno@example.com")
        orders = {
            customer.email: OldOrder.objects.create(
                customer=customer,
                status=Order.Status.PAYMENT_APPROVED,
                payment_status=Order.PaymentStatus.APPROVED,
                subtotal=Decimal("12.50"),
                total=Decimal("12.50"),
                payment_last_four="4242",
                idempotency_key=uuid.uuid4(),
                idempotency_fingerprint="a" * 64,
            )
            for customer in (first, second)
        }

        executor = MigrationExecutor(connection)
        executor.loader.build_graph()
        executor.migrate([self.migrate_to])
        new_apps = executor.loader.project_state([self.migrate_to]).apps
        NewOrder = new_apps.get_model("orders", "Order")

        # Each order must receive its own customer's name, not the first one.
        self.assertEqual(
            NewOrder.objects.get(pk=orders["ana@example.com"].pk).customer_name,
            "Ana Lima",
        )
        self.assertEqual(
            NewOrder.objects.get(pk=orders["bruno@example.com"].pk).customer_name,
            "Bruno Lima",
        )
