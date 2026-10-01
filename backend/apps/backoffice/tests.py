import uuid
from io import BytesIO
from decimal import Decimal
from unittest.mock import patch

from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import override_settings
from django.utils import timezone
from rest_framework import status
from rest_framework.reverse import reverse
from rest_framework.test import APIClient, APITestCase
from PIL import Image

from apps.catalog.models import Banner, ImportedProduct, Listing, Menu
from apps.catalog.services.dummyjson import DummyJSONTransportError
from apps.catalog.services.importer import ImportSummary, PreparedImport
from apps.core.models import StoreSettings
from apps.customers.models import Customer, CustomerAccessCode
from apps.orders.models import Order, OrderItem
from apps.backoffice.media import StoredImage


class BackofficeFixtures:
    """Users and commerce data shared by the panel test classes.

    It holds no tests, so inheriting it does not re-run another class's suite.
    """

    def setUp(self):
        user_model = get_user_model()
        self.staff = user_model.objects.create_user(
            username="gestora",
            password="senha-forte-local",
            first_name="Ana",
            is_staff=True,
        )
        self.regular_user = user_model.objects.create_user(
            username="cliente",
            password="senha-forte-local",
        )
        self.inactive_staff = user_model.objects.create_user(
            username="inativa",
            password="senha-forte-local",
            is_staff=True,
            is_active=False,
        )

    def authenticated_client(self, user=None):
        client = APIClient()
        client.force_authenticate(user=user or self.staff)
        return client

    def csrf_client(self):
        client = APIClient(enforce_csrf_checks=True)
        session_response = client.get(reverse("backoffice:session"))
        return client, session_response.data["csrf_token"]

    def create_commerce_data(self):
        synced_at = timezone.now()
        product = ImportedProduct.objects.create(
            external_id=42,
            title="Escova modeladora",
            description="Descrição importada",
            category="beleza",
            brand="Mosaico",
            sku="ESC-42",
            source_price=Decimal("129.90"),
            source_stock=9,
            availability_status="Em estoque",
            thumbnail_url="https://example.com/escova.jpg",
            raw_payload={"supplier_secret": "não expor"},
            last_synced_at=synced_at,
        )
        listing = Listing.objects.create(
            product=product,
            slug="escova-modeladora",
            title="Escova modeladora",
            price=Decimal("129.90"),
            promotional_price=Decimal("99.90"),
            stock_quantity=3,
            active=True,
        )
        customer = Customer.objects.create(
            name="Beatriz Costa",
            email="beatriz@example.com",
        )
        CustomerAccessCode.objects.create(
            customer=customer,
            code_hash="hash-que-nao-pode-sair",
            expires_at=timezone.now() + timezone.timedelta(minutes=10),
        )
        order = Order.objects.create(
            customer=customer,
            status=Order.Status.PAYMENT_APPROVED,
            payment_status=Order.PaymentStatus.APPROVED,
            subtotal=Decimal("99.90"),
            total=Decimal("99.90"),
            payment_last_four="4242",
            idempotency_key=uuid.uuid4(),
            idempotency_fingerprint="f" * 64,
        )
        OrderItem.objects.create(
            order=order,
            listing=listing,
            listing_title=listing.title,
            product_external_id=product.external_id,
            sku=product.sku,
            unit_price=Decimal("99.90"),
            quantity=1,
            subtotal=Decimal("99.90"),
        )
        return product, listing, customer, order


class BackofficeAPITests(BackofficeFixtures, APITestCase):
    def test_session_is_anonymous_and_sets_csrf_token(self):
        response = self.client.get(reverse("backoffice:session"))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data["authenticated"])
        self.assertIsNone(response.data["user"])
        self.assertTrue(response.data["csrf_token"])
        self.assertIn("csrftoken", response.cookies)

    def test_login_requires_csrf_and_accepts_only_active_staff(self):
        client = APIClient(enforce_csrf_checks=True)
        without_csrf = client.post(
            reverse("backoffice:login"),
            {"username": "gestora", "password": "senha-forte-local"},
            format="json",
        )
        self.assertEqual(without_csrf.status_code, status.HTTP_403_FORBIDDEN)

        client, csrf_token = self.csrf_client()
        regular = client.post(
            reverse("backoffice:login"),
            {"username": "cliente", "password": "senha-forte-local"},
            format="json",
            HTTP_X_CSRFTOKEN=csrf_token,
        )
        self.assertEqual(regular.status_code, status.HTTP_403_FORBIDDEN)

        staff = client.post(
            reverse("backoffice:login"),
            {"username": "gestora", "password": "senha-forte-local"},
            format="json",
            HTTP_X_CSRFTOKEN=csrf_token,
        )
        self.assertEqual(staff.status_code, status.HTTP_200_OK)
        self.assertTrue(staff.data["authenticated"])
        self.assertEqual(
            staff.data["user"],
            {"username": "gestora", "display_name": "Ana", "is_superuser": False},
        )
        self.assertNotIn("password", staff.data)

    def test_logout_is_csrf_protected_and_ends_staff_session(self):
        client, csrf_token = self.csrf_client()
        login_response = client.post(
            reverse("backoffice:login"),
            {"username": "gestora", "password": "senha-forte-local"},
            format="json",
            HTTP_X_CSRFTOKEN=csrf_token,
        )
        rotated_token = login_response.data["csrf_token"]

        rejected = client.post(reverse("backoffice:logout"), format="json")
        self.assertEqual(rejected.status_code, status.HTTP_403_FORBIDDEN)

        response = client.post(
            reverse("backoffice:logout"),
            {},
            format="json",
            HTTP_X_CSRFTOKEN=rotated_token,
        )
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(client.get(reverse("backoffice:session")).data["authenticated"])

    def test_admin_resources_reject_anonymous_regular_and_inactive_users(self):
        protected_urls = (
            reverse("backoffice:dashboard"),
            reverse("backoffice:products"),
            reverse("backoffice:orders"),
            reverse("backoffice:customers"),
            reverse("backoffice:listings"),
            reverse("backoffice:menus"),
            reverse("backoffice:banners"),
        )
        for url in protected_urls:
            with self.subTest(url=url, user="anonymous"):
                self.assertEqual(self.client.get(url).status_code, status.HTTP_403_FORBIDDEN)
            with self.subTest(url=url, user="regular"):
                self.assertEqual(
                    self.authenticated_client(self.regular_user).get(url).status_code,
                    status.HTTP_403_FORBIDDEN,
                )
            with self.subTest(url=url, user="inactive"):
                self.assertEqual(
                    self.authenticated_client(self.inactive_staff).get(url).status_code,
                    status.HTTP_403_FORBIDDEN,
                )

    def test_dashboard_returns_operational_summary_for_staff(self):
        _, listing, _, order = self.create_commerce_data()

        response = self.authenticated_client().get(reverse("backoffice:dashboard"))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            response.data["metrics"],
            {
                "imported_product_count": 1,
                "active_listing_count": 1,
                "order_count": 1,
                "customer_count": 1,
                "approved_revenue": "99.90",
                "low_stock_count": 1,
            },
        )
        self.assertEqual(response.data["latest_orders"][0]["public_id"], str(order.public_id))
        self.assertEqual(response.data["low_stock"][0]["id"], listing.id)
        self.assertEqual(response.data["last_import"]["product_count"], 1)

        serialized = str(response.data)
        self.assertNotIn("4242", serialized)
        self.assertNotIn("idempotency", serialized)
        self.assertNotIn("hash-que-nao-pode-sair", serialized)

    def test_read_only_lists_are_paginated_and_omit_sensitive_fields(self):
        product, _, customer, order = self.create_commerce_data()
        client = self.authenticated_client()

        products = client.get(reverse("backoffice:products"))
        orders = client.get(reverse("backoffice:orders"))
        customers = client.get(reverse("backoffice:customers"))

        self.assertEqual(products.status_code, status.HTTP_200_OK)
        self.assertEqual(products.data["count"], 1)
        self.assertEqual(products.data["results"][0]["external_id"], product.external_id)
        self.assertEqual(products.data["results"][0]["image_url"], "https://example.com/escova.jpg")
        self.assertNotIn("raw_payload", products.data["results"][0])

        self.assertEqual(orders.data["results"][0]["public_id"], str(order.public_id))
        self.assertNotIn("payment_last_four", orders.data["results"][0])
        self.assertNotIn("idempotency_key", orders.data["results"][0])

        self.assertEqual(customers.data["results"][0]["id"], customer.id)
        self.assertEqual(customers.data["results"][0]["approved_total"], "99.90")
        self.assertNotIn("access_codes", customers.data["results"][0])

        for url in (
            reverse("backoffice:products"),
            reverse("backoffice:orders"),
            reverse("backoffice:customers"),
        ):
            with self.subTest(url=url):
                self.assertEqual(client.post(url, {}, format="json").status_code, status.HTTP_405_METHOD_NOT_ALLOWED)

    def test_listing_crud_validates_prices_stock_and_immutable_source(self):
        product, _, _, _ = self.create_commerce_data()
        client = self.authenticated_client()
        create_response = client.post(
            reverse("backoffice:listings"),
            {
                "product_id": product.id,
                "title": "Oferta de salão",
                "description": "Anúncio comercial",
                "price": "159.90",
                "promotional_price": "119.90",
                "stock_quantity": 8,
                "active": False,
            },
            format="json",
        )
        self.assertEqual(create_response.status_code, status.HTTP_201_CREATED)
        created = Listing.objects.get(pk=create_response.data["id"])
        self.assertEqual(created.slug, "oferta-de-salao")
        self.assertFalse(created.active)

        invalid_promotion = client.patch(
            reverse("backoffice:listing-detail", args=(created.id,)),
            {"price": "100.00", "promotional_price": "100.00"},
            format="json",
        )
        self.assertEqual(invalid_promotion.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("promotional_price", invalid_promotion.data)

        invalid_stock = client.patch(
            reverse("backoffice:listing-detail", args=(created.id,)),
            {"stock_quantity": -1},
            format="json",
        )
        self.assertEqual(invalid_stock.status_code, status.HTTP_400_BAD_REQUEST)

        other_product = ImportedProduct.objects.create(
            external_id=77,
            title="Outro produto",
            category="beleza",
            source_price=Decimal("10.00"),
            source_stock=1,
            last_synced_at=timezone.now(),
        )
        changed_source = client.patch(
            reverse("backoffice:listing-detail", args=(created.id,)),
            {"product_id": other_product.id},
            format="json",
        )
        self.assertEqual(changed_source.status_code, status.HTTP_400_BAD_REQUEST)

        activated = client.patch(
            reverse("backoffice:listing-detail", args=(created.id,)),
            {"active": True},
            format="json",
        )
        self.assertEqual(activated.status_code, status.HTTP_200_OK)
        self.assertTrue(activated.data["active"])
        self.assertEqual(
            client.delete(reverse("backoffice:listing-detail", args=(created.id,))).status_code,
            status.HTTP_405_METHOD_NOT_ALLOWED,
        )

    def test_menu_crud_preserves_selected_listing_order(self):
        product, first_listing, _, _ = self.create_commerce_data()
        second_listing = Listing.objects.create(
            product=product,
            slug="segunda-oferta",
            title="Segunda oferta",
            price=Decimal("89.90"),
            stock_quantity=2,
            active=True,
        )
        client = self.authenticated_client()
        response = client.post(
            reverse("backoffice:menus"),
            {
                "name": "Destaques",
                "display_order": 2,
                "active": True,
                "listing_ids": [second_listing.id, first_listing.id],
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["slug"], "destaques")
        self.assertEqual([item["id"] for item in response.data["listings"]], [second_listing.id, first_listing.id])

        menu = Menu.objects.get(pk=response.data["id"])
        updated = client.patch(
            reverse("backoffice:menu-detail", args=(menu.id,)),
            {"listing_ids": [first_listing.id], "active": False},
            format="json",
        )
        self.assertEqual(updated.status_code, status.HTTP_200_OK)
        self.assertEqual([item["id"] for item in updated.data["listings"]], [first_listing.id])
        self.assertFalse(updated.data["active"])

        duplicate = client.patch(
            reverse("backoffice:menu-detail", args=(menu.id,)),
            {"listing_ids": [first_listing.id, first_listing.id]},
            format="json",
        )
        self.assertEqual(duplicate.status_code, status.HTTP_400_BAD_REQUEST)

    def test_banner_crud_validates_schedule_and_activation(self):
        client = self.authenticated_client()
        starts_at = timezone.now() + timezone.timedelta(days=1)
        banner_payload = {
            "title": "Semana da beleza",
            "image_url": "https://example.com/banner.jpg",
            "link_url": "/produtos",
            "alt_text": "Produtos em destaque",
            "display_order": 0,
            "active": True,
            "starts_at": starts_at.isoformat(),
            "ends_at": (starts_at - timezone.timedelta(hours=1)).isoformat(),
        }
        invalid = client.post(
            reverse("backoffice:banners"),
            banner_payload,
            format="json",
        )
        self.assertEqual(invalid.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("ends_at", invalid.data)

        valid_payload = banner_payload.copy()
        valid_payload["ends_at"] = (starts_at + timezone.timedelta(days=2)).isoformat()
        created = client.post(reverse("backoffice:banners"), valid_payload, format="json")
        self.assertEqual(created.status_code, status.HTTP_201_CREATED)
        banner = Banner.objects.get(pk=created.data["id"])
        deactivated = client.patch(
            reverse("backoffice:banner-detail", args=(banner.id,)),
            {"active": False},
            format="json",
        )
        self.assertEqual(deactivated.status_code, status.HTTP_200_OK)
        self.assertFalse(deactivated.data["active"])

        duplicate_order_payload = valid_payload.copy()
        duplicate_order_payload["title"] = "Outro banner"
        duplicate_order = client.post(
            reverse("backoffice:banners"),
            duplicate_order_payload,
            format="json",
        )
        self.assertEqual(duplicate_order.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(
            duplicate_order.data["display_order"],
            ["Esta ordem já está sendo usada por outro banner."],
        )

        same_order_on_own_update = client.patch(
            reverse("backoffice:banner-detail", args=(banner.id,)),
            {"title": "Semana da beleza atualizada", "display_order": 0},
            format="json",
        )
        self.assertEqual(same_order_on_own_update.status_code, status.HTTP_200_OK)

    @staticmethod
    def banner_upload():
        content = BytesIO()
        Image.new("RGB", (1600, 500), color="#6d4aff").save(content, format="WEBP")
        return SimpleUploadedFile(
            "banner.webp",
            content.getvalue(),
            content_type="image/webp",
        )

    @patch("apps.backoffice.views.upload_image")
    def test_staff_can_upload_valid_banner_image_without_exposing_r2_credentials(self, upload_mock):
        upload_mock.return_value = StoredImage(
            url="https://media.example.com/banners/2026/10/banner.webp",
            width=1600,
            height=500,
        )
        url = reverse("backoffice:image-upload")

        anonymous = self.client.post(
            url,
            {"image": self.banner_upload()},
            format="multipart",
        )
        self.assertEqual(anonymous.status_code, status.HTTP_403_FORBIDDEN)

        invalid = self.authenticated_client().post(
            url,
            {
                "image": SimpleUploadedFile(
                    "banner.svg",
                    b"<svg xmlns='http://www.w3.org/2000/svg'></svg>",
                    content_type="image/svg+xml",
                )
            },
            format="multipart",
        )
        self.assertEqual(invalid.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("image", invalid.data)

        response = self.authenticated_client().post(
            url,
            {"image": self.banner_upload()},
            format="multipart",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(
            response.data,
            {
                "url": "https://media.example.com/banners/2026/10/banner.webp",
                "width": 1600,
                "height": 500,
            },
        )
        upload_mock.assert_called_once()

    @patch("apps.backoffice.views.sync_products")
    def test_product_import_returns_safe_summary(self, sync_mock):
        sync_mock.return_value = ImportSummary(created=3, updated=7)
        response = self.authenticated_client().post(
            reverse("backoffice:product-import"), {}, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["created"], 3)
        self.assertEqual(response.data["updated"], 7)
        self.assertEqual(response.data["total"], 10)
        self.assertIn("completed_at", response.data)

        sync_mock.side_effect = DummyJSONTransportError("internal detail")
        failed = self.authenticated_client().post(
            reverse("backoffice:product-import"), {}, format="json"
        )
        self.assertEqual(failed.status_code, status.HTTP_502_BAD_GATEWAY)
        self.assertNotIn("internal detail", str(failed.data))

    def test_filters_and_pagination_apply_to_admin_resources(self):
        self.create_commerce_data()
        client = self.authenticated_client()
        products = client.get(reverse("backoffice:products"), {"q": "ESC-42", "has_listing": "true"})
        listings = client.get(reverse("backoffice:listings"), {"q": "modeladora", "active": "true", "stock": "low"})
        orders = client.get(reverse("backoffice:orders"), {"q": "beatriz", "status": Order.Status.PAYMENT_APPROVED})
        customers = client.get(reverse("backoffice:customers"), {"q": "example.com", "active": "true"})
        for response in (products, listings, orders, customers):
            self.assertEqual(response.status_code, status.HTTP_200_OK)
            self.assertEqual(response.data["count"], 1)


class AdminStoreSettingsTests(BackofficeFixtures, APITestCase):
    def test_settings_start_from_the_environment_default(self):
        response = self.authenticated_client().get(reverse("backoffice:settings"))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            Decimal(response.data["free_shipping_minimum"]),
            settings.FREE_SHIPPING_MINIMUM,
        )

    def test_staff_updates_the_minimum_and_the_storefront_follows(self):
        response = self.authenticated_client().patch(
            reverse("backoffice:settings"),
            {"free_shipping_minimum": "250.00"},
            format="json",
        )
        home = self.client.get(reverse("storefront:home"))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            home.data["commercial_terms"]["free_shipping_minimum"],
            "250.00",
        )
        # Editing must not create a second row.
        self.assertEqual(StoreSettings.objects.count(), 1)

    def test_minimum_must_be_positive(self):
        client = self.authenticated_client()

        for invalid in ("0.00", "-10.00"):
            with self.subTest(invalid=invalid):
                response = client.patch(
                    reverse("backoffice:settings"),
                    {"free_shipping_minimum": invalid},
                    format="json",
                )
                self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_settings_are_closed_to_anonymous_and_to_regular_users(self):
        anonymous = APIClient().get(reverse("backoffice:settings"))
        regular = self.authenticated_client(self.regular_user).patch(
            reverse("backoffice:settings"),
            {"free_shipping_minimum": "10.00"},
            format="json",
        )

        self.assertEqual(anonymous.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(regular.status_code, status.HTTP_403_FORBIDDEN)

    def test_listing_free_shipping_flag_round_trips(self):
        self.create_commerce_data()
        client = self.authenticated_client()
        listing_id = client.get(reverse("backoffice:listings")).data["results"][0]["id"]

        updated = client.patch(
            reverse("backoffice:listing-detail", kwargs={"pk": listing_id}),
            {"free_shipping": True},
            format="json",
        )

        self.assertEqual(updated.status_code, status.HTTP_200_OK)
        self.assertTrue(updated.data["free_shipping"])
        self.assertTrue(Listing.objects.get(pk=listing_id).free_shipping)

    @override_settings(DEMO_RESET_ENABLED=False)
    def test_demo_reset_is_available_only_to_superusers(self):
        url = reverse("backoffice:demo-reset")
        self.assertEqual(
            self.authenticated_client().get(url).status_code,
            status.HTTP_403_FORBIDDEN,
        )

        self.staff.is_superuser = True
        self.staff.save(update_fields=("is_superuser",))
        response = self.authenticated_client().get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data["enabled"])
        disabled = self.authenticated_client().post(
            url,
            {"confirmation": "RESTAURAR DEMONSTRAÇÃO"},
            format="json",
        )
        self.assertEqual(disabled.status_code, status.HTTP_403_FORBIDDEN)

    @override_settings(DEMO_RESET_ENABLED=True, DEMO_RESET_COOLDOWN_SECONDS=0)
    def test_demo_reset_rebuilds_business_data_and_preserves_admin_users(self):
        _, _, _, old_order = self.create_commerce_data()
        self.staff.is_superuser = True
        self.staff.save(update_fields=("is_superuser",))
        prepared = PreparedImport(
            products=(
                {
                    "external_id": 501,
                    "title": "Perfume floral",
                    "description": "Fragrância de demonstração",
                    "category": "fragrances",
                    "brand": "Mosaico",
                    "sku": "PERF-501",
                    "source_price": Decimal("149.90"),
                    "source_discount_percentage": Decimal("10.00"),
                    "source_stock": 8,
                    "availability_status": "In Stock",
                    "thumbnail_url": "https://example.com/perfume.jpg",
                    "images": ["https://example.com/perfume.jpg"],
                    "raw_payload": {"id": 501},
                },
            ),
            skipped=0,
            synced_at=timezone.now(),
        )

        with patch(
            "apps.backoffice.demo_reset.prepare_products",
            return_value=prepared,
        ):
            response = self.authenticated_client().post(
                reverse("backoffice:demo-reset"),
                {"confirmation": "RESTAURAR DEMONSTRAÇÃO"},
                format="json",
            )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(Order.objects.filter(pk=old_order.pk).exists())
        self.assertEqual(Customer.objects.count(), 0)
        self.assertEqual(ImportedProduct.objects.count(), 1)
        self.assertEqual(Listing.objects.count(), 1)
        self.assertEqual(Menu.objects.count(), 8)
        self.assertTrue(get_user_model().objects.filter(pk=self.staff.pk).exists())
        self.assertEqual(response.data["products_imported"], 1)
        self.assertEqual(response.data["listings_created"], 1)

    @override_settings(DEMO_RESET_ENABLED=True, DEMO_RESET_COOLDOWN_SECONDS=0)
    def test_demo_reset_keeps_data_when_the_source_fails(self):
        _, _, _, order = self.create_commerce_data()
        self.staff.is_superuser = True
        self.staff.save(update_fields=("is_superuser",))

        with patch(
            "apps.backoffice.demo_reset.prepare_products",
            side_effect=DummyJSONTransportError("source unavailable"),
        ):
            response = self.authenticated_client().post(
                reverse("backoffice:demo-reset"),
                {"confirmation": "RESTAURAR DEMONSTRAÇÃO"},
                format="json",
            )

        self.assertEqual(response.status_code, status.HTTP_502_BAD_GATEWAY)
        self.assertTrue(Order.objects.filter(pk=order.pk).exists())
        self.assertEqual(ImportedProduct.objects.count(), 1)

    @override_settings(DEMO_RESET_ENABLED=True, DEMO_RESET_COOLDOWN_SECONDS=600)
    def test_demo_reset_requires_exact_confirmation_and_honors_cooldown(self):
        self.staff.is_superuser = True
        self.staff.save(update_fields=("is_superuser",))
        client = self.authenticated_client()
        url = reverse("backoffice:demo-reset")

        invalid = client.post(url, {"confirmation": "restaurar"}, format="json")
        self.assertEqual(invalid.status_code, status.HTTP_400_BAD_REQUEST)

        from apps.core.models import DemoResetState

        DemoResetState.objects.filter(pk=1).update(
            locked_until=timezone.now() + timezone.timedelta(minutes=1)
        )
        in_progress = client.post(
            url,
            {"confirmation": "RESTAURAR DEMONSTRAÇÃO"},
            format="json",
        )
        self.assertEqual(in_progress.status_code, status.HTTP_409_CONFLICT)

        DemoResetState.objects.filter(pk=1).update(
            locked_until=None,
            last_reset_at=timezone.now(),
        )
        limited = client.post(
            url,
            {"confirmation": "RESTAURAR DEMONSTRAÇÃO"},
            format="json",
        )
        self.assertEqual(limited.status_code, status.HTTP_429_TOO_MANY_REQUESTS)
        self.assertGreater(limited.data["retry_after"], 0)


class AdminProductNicheTests(BackofficeFixtures, APITestCase):
    def setUp(self):
        super().setUp()
        for external_id, category in ((10, "beauty"), (11, "womens-bags"), (12, "laptops")):
            ImportedProduct.objects.create(
                external_id=external_id,
                title=f"Produto {external_id}",
                category=category,
                source_price=Decimal("10.00"),
                last_synced_at=timezone.now(),
            )

    def by_external_id(self, response):
        return {item["external_id"]: item["in_niche"] for item in response.data["results"]}

    def test_products_report_whether_they_belong_to_the_niche(self):
        response = self.authenticated_client().get(reverse("backoffice:products"))

        self.assertEqual(
            self.by_external_id(response),
            {10: True, 11: True, 12: False},
        )

    def test_niche_filter_separates_stored_products(self):
        client = self.authenticated_client()
        url = reverse("backoffice:products")

        inside = client.get(url, {"niche": "true"})
        outside = client.get(url, {"niche": "false"})

        self.assertEqual(sorted(self.by_external_id(inside)), [10, 11])
        self.assertEqual(sorted(self.by_external_id(outside)), [12])
