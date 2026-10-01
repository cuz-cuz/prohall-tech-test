from datetime import timedelta
from decimal import Decimal
import uuid

from django.core.exceptions import ValidationError
from django.db import IntegrityError, transaction
from django.test import SimpleTestCase, TestCase
from django.urls import reverse
from django.utils import timezone
from rest_framework.test import APITestCase

from apps.catalog.models import Banner, ImportedProduct, Listing, Menu, MenuListing
from apps.customers.models import Customer
from apps.orders.models import Order, OrderItem

from .serializers import ListingSerializer


class ListingRulesTests(SimpleTestCase):
    def make_listing(self, **overrides):
        values = {
            "price": Decimal("100.00"),
            "promotional_price": None,
            "stock_quantity": 3,
            "active": True,
        }
        values.update(overrides)
        return Listing(**values)

    def test_effective_price_uses_promotional_price_when_present(self):
        listing = self.make_listing(promotional_price=Decimal("79.90"))

        self.assertEqual(listing.effective_price, Decimal("79.90"))
        self.assertTrue(listing.is_on_sale)

    def test_availability_requires_active_listing_and_stock(self):
        self.assertTrue(self.make_listing().is_available)
        self.assertFalse(self.make_listing(active=False).is_available)
        self.assertFalse(self.make_listing(stock_quantity=0).is_available)

    def test_serializer_exposes_commercial_and_source_fields(self):
        product = ImportedProduct(
            brand="Mosaico",
            category="beauty",
            sku="SKU-1",
            thumbnail_url="https://example.com/product-thumbnail.jpg",
            images=["https://example.com/product-high-resolution.jpg"],
        )
        listing = self.make_listing(
            product=product,
            slug="produto",
            title="Produto",
            description="Descrição",
        )

        data = ListingSerializer(listing).data

        self.assertEqual(data["brand"], "Mosaico")
        self.assertEqual(
            data["thumbnail_url"],
            "https://example.com/product-high-resolution.jpg",
        )
        self.assertEqual(data["effective_price"], "100.00")
        self.assertTrue(data["is_available"])
        self.assertEqual(data["pix_price"], "90.00")
        self.assertEqual(data["installment_count"], 12)
        self.assertEqual(data["installment_value"], "8.33")
        self.assertFalse(data["free_shipping"])


class BannerRulesTests(SimpleTestCase):
    def test_visibility_respects_active_state_and_period(self):
        moment = timezone.now()
        visible = Banner(
            active=True,
            starts_at=moment - timedelta(minutes=1),
            ends_at=moment + timedelta(minutes=1),
        )
        expired = Banner(active=True, ends_at=moment - timedelta(minutes=1))

        self.assertTrue(visible.is_visible(moment))
        self.assertFalse(expired.is_visible(moment))

    def test_link_accepts_internal_path_and_rejects_invalid_value(self):
        field = Banner._meta.get_field("link_url")
        field.run_validators("/produto/item")

        with self.assertRaises(ValidationError):
            field.run_validators("sem-protocolo")


class StorefrontAPITests(APITestCase):
    @classmethod
    def setUpTestData(cls):
        cls.product = ImportedProduct.objects.create(
            external_id=1,
            title="Produto importado",
            description="Descrição",
            category="beauty",
            brand="Marca",
            sku="SKU-1",
            source_price=Decimal("100.00"),
            source_stock=5,
            thumbnail_url="https://example.com/product.jpg",
            images=["https://example.com/product.jpg"],
            last_synced_at=timezone.now(),
        )
        cls.listing = Listing.objects.create(
            product=cls.product,
            slug="produto-1",
            title="Produto 1",
            description="Descrição comercial",
            price=Decimal("99.90"),
            stock_quantity=5,
            active=True,
        )
        cls.menu = Menu.objects.create(
            name="Novidades",
            slug="novidades",
            display_order=0,
            active=True,
        )
        MenuListing.objects.create(
            menu=cls.menu,
            listing=cls.listing,
            display_order=0,
        )

    def create_listing(
        self,
        *,
        external_id,
        slug,
        title,
        description="",
        brand="",
        category="general",
        active=True,
        price=Decimal("49.90"),
        promotional_price=None,
        stock_quantity=5,
        free_shipping=False,
    ):
        product = ImportedProduct.objects.create(
            external_id=external_id,
            title=title,
            description=description,
            category=category,
            brand=brand,
            source_price=Decimal("50.00"),
            source_stock=5,
            last_synced_at=timezone.now(),
        )
        return Listing.objects.create(
            product=product,
            slug=slug,
            title=title,
            description=description,
            price=price,
            promotional_price=promotional_price,
            stock_quantity=stock_quantity,
            active=active,
            free_shipping=free_shipping,
        )

    def test_home_returns_only_visible_banners_and_active_menus(self):
        now = timezone.now()
        Banner.objects.create(
            title="Visível",
            image_url="https://example.com/visible.jpg",
            active=True,
        )
        Banner.objects.create(
            title="Futuro",
            image_url="https://example.com/future.jpg",
            active=True,
            starts_at=now + timedelta(days=1),
        )
        Menu.objects.create(name="Oculto", slug="oculto", active=False)

        response = self.client.get(reverse("storefront:home"))

        self.assertEqual(response.status_code, 200)
        self.assertEqual([item["title"] for item in response.data["banners"]], ["Visível"])
        self.assertEqual([item["slug"] for item in response.data["menus"]], ["novidades"])

    def test_menu_listings_hides_inactive_listings(self):
        inactive_product = ImportedProduct.objects.create(
            external_id=2,
            title="Oculto",
            category="beauty",
            source_price=Decimal("20.00"),
            last_synced_at=timezone.now(),
        )
        inactive_listing = Listing.objects.create(
            product=inactive_product,
            slug="oculto",
            title="Oculto",
            price=Decimal("20.00"),
            active=False,
        )
        MenuListing.objects.create(
            menu=self.menu,
            listing=inactive_listing,
            display_order=1,
        )

        response = self.client.get(
            reverse("storefront:menu-listings", kwargs={"slug": self.menu.slug})
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["count"], 1)
        self.assertEqual(
            [item["slug"] for item in response.data["results"]],
            ["produto-1"],
        )

    def test_listing_catalog_filters_and_orders_with_backend_values(self):
        featured = self.create_listing(
            external_id=30,
            slug="kit-premium",
            title="Kit premium",
            price=Decimal("250.00"),
            promotional_price=Decimal("200.00"),
            free_shipping=True,
        )
        inexpensive = self.create_listing(
            external_id=31,
            slug="item-economico",
            title="Item econômico",
            price=Decimal("20.00"),
        )
        customer = Customer.objects.create(name="Ana", email="ana@example.com")
        approved_order = Order.objects.create(
            customer=customer,
            status=Order.Status.PAYMENT_APPROVED,
            payment_status=Order.PaymentStatus.APPROVED,
            subtotal=Decimal("600.00"),
            total=Decimal("600.00"),
            payment_last_four="4242",
            idempotency_key=uuid.uuid4(),
            idempotency_fingerprint="a" * 64,
        )
        OrderItem.objects.create(
            order=approved_order,
            listing=featured,
            listing_title=featured.title,
            product_external_id=featured.product.external_id,
            unit_price=Decimal("200.00"),
            quantity=3,
            subtotal=Decimal("600.00"),
        )
        declined_order = Order.objects.create(
            customer=customer,
            status=Order.Status.PAYMENT_DECLINED,
            payment_status=Order.PaymentStatus.DECLINED,
            subtotal=Decimal("200.00"),
            total=Decimal("200.00"),
            payment_last_four="0000",
            idempotency_key=uuid.uuid4(),
            idempotency_fingerprint="b" * 64,
        )
        OrderItem.objects.create(
            order=declined_order,
            listing=inexpensive,
            listing_title=inexpensive.title,
            product_external_id=inexpensive.product.external_id,
            unit_price=Decimal("20.00"),
            quantity=10,
            subtotal=Decimal("200.00"),
        )
        url = reverse("storefront:listing-list")

        best_selling = self.client.get(url, {"ordering": "best_selling"})
        price_range = self.client.get(
            url,
            {"min_price": "150.00", "max_price": "210.00"},
        )
        free_shipping = self.client.get(url, {"free_shipping": "true"})

        self.assertEqual(best_selling.data["results"][0]["slug"], featured.slug)
        self.assertEqual(best_selling.data["results"][0]["sales_count"], 3)
        self.assertEqual(
            [item["slug"] for item in price_range.data["results"]],
            [featured.slug],
        )
        self.assertEqual(
            [item["slug"] for item in free_shipping.data["results"]],
            [featured.slug],
        )

    def test_listing_catalog_rejects_an_inverted_price_range(self):
        response = self.client.get(
            reverse("storefront:listing-list"),
            {"min_price": "200.00", "max_price": "100.00"},
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("max_price", response.data)

    def test_listing_catalog_is_paginated(self):
        for index in range(40, 52):
            self.create_listing(
                external_id=index,
                slug=f"produto-{index}",
                title=f"Produto {index}",
            )

        url = reverse("storefront:listing-list")
        first_page = self.client.get(url)
        second_page = self.client.get(url, {"page": 2})

        self.assertEqual(first_page.data["count"], 13)
        self.assertEqual(len(first_page.data["results"]), 12)
        self.assertIsNotNone(first_page.data["next"])
        self.assertEqual(len(second_page.data["results"]), 1)
        self.assertIsNotNone(second_page.data["previous"])

    def test_inactive_listing_has_no_public_detail(self):
        self.listing.active = False
        self.listing.save(update_fields=("active", "updated_at"))

        response = self.client.get(
            reverse("storefront:listing-detail", kwargs={"slug": self.listing.slug})
        )

        self.assertEqual(response.status_code, 404)

    def test_search_requires_a_term_with_at_least_two_characters(self):
        url = reverse("storefront:listing-search")

        self.assertEqual(self.client.get(url).status_code, 400)
        self.assertEqual(self.client.get(url, {"q": "a"}).status_code, 400)
        self.assertEqual(self.client.get(url, {"q": "--"}).status_code, 400)

    def test_search_ignores_accents_and_case_and_accepts_incomplete_terms(self):
        listing = self.create_listing(
            external_id=20,
            slug="mascara-nutritiva",
            title="Máscara Nutritiva",
            description="Hidratação profunda para cabelos.",
            brand="Prohall",
            category="hair-care",
        )
        url = reverse("storefront:listing-search")

        accent_response = self.client.get(url, {"q": "MASCARA"})
        partial_response = self.client.get(url, {"q": "nutri"})

        self.assertEqual(accent_response.status_code, 200)
        self.assertEqual(accent_response.data["results"][0]["slug"], listing.slug)
        self.assertEqual(partial_response.data["results"][0]["slug"], listing.slug)

    def test_search_considers_brand_category_and_active_menu_name(self):
        listing = self.create_listing(
            external_id=21,
            slug="produto-capilar",
            title="Tratamento Essencial",
            brand="Prohall Select",
            category="hair-care",
        )
        menu = Menu.objects.create(name="Cabelos Cacheados", slug="cacheados")
        MenuListing.objects.create(menu=menu, listing=listing)
        url = reverse("storefront:listing-search")

        for term in ("prohall", "hair ca", "cachead"):
            with self.subTest(term=term):
                response = self.client.get(url, {"q": term})
                self.assertEqual(response.status_code, 200)
                self.assertIn(
                    listing.slug,
                    [item["slug"] for item in response.data["results"]],
                )

    def test_search_excludes_inactive_listings(self):
        self.create_listing(
            external_id=22,
            slug="segredo-inativo",
            title="Segredo Inativo",
            active=False,
        )

        response = self.client.get(
            reverse("storefront:listing-search"),
            {"q": "segredo"},
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["count"], 0)

    def test_search_ranks_title_above_description(self):
        title_match = self.create_listing(
            external_id=23,
            slug="cafeteira-pratica",
            title="Cafeteira Prática",
        )
        self.create_listing(
            external_id=24,
            slug="item-cozinha",
            title="Item para Cozinha",
            description="Compatível com cafeteira doméstica.",
        )

        response = self.client.get(
            reverse("storefront:listing-search"),
            {"q": "cafeteira"},
        )

        self.assertEqual(response.data["results"][0]["slug"], title_match.slug)

    def test_search_results_are_paginated(self):
        for position in range(13):
            self.create_listing(
                external_id=100 + position,
                slug=f"colecao-{position}",
                title=f"Coleção {position}",
            )

        response = self.client.get(
            reverse("storefront:listing-search"),
            {"q": "colecao"},
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["count"], 13)
        self.assertEqual(len(response.data["results"]), 12)
        self.assertIsNotNone(response.data["next"])

    def test_search_does_not_include_unrelated_description_similarity(self):
        response = self.client.get(
            reverse("storefront:listing-search"),
            {"q": "colecao"},
        )

        self.assertEqual(response.status_code, 200)
        self.assertNotIn(
            self.listing.slug,
            [item["slug"] for item in response.data["results"]],
        )


class CatalogConstraintsTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.product = ImportedProduct.objects.create(
            external_id=10,
            title="Produto para constraints",
            category="beauty",
            source_price=Decimal("100.00"),
            last_synced_at=timezone.now(),
        )

    def test_promotional_price_must_be_lower_than_regular_price(self):
        with self.assertRaises(IntegrityError), transaction.atomic():
            Listing.objects.create(
                product=self.product,
                slug="promocao-invalida",
                title="Promoção inválida",
                price=Decimal("100.00"),
                promotional_price=Decimal("100.00"),
            )

    def test_menu_cannot_contain_same_listing_twice(self):
        listing = Listing.objects.create(
            product=self.product,
            slug="produto-constraint",
            title="Produto",
            price=Decimal("100.00"),
        )
        menu = Menu.objects.create(name="Menu", slug="menu")
        MenuListing.objects.create(menu=menu, listing=listing)

        with self.assertRaises(IntegrityError), transaction.atomic():
            MenuListing.objects.create(menu=menu, listing=listing)

    def test_banner_visible_queryset_excludes_expired_records(self):
        now = timezone.now()
        Banner.objects.create(
            title="Ativo",
            image_url="https://example.com/active.jpg",
            active=True,
        )
        Banner.objects.create(
            title="Expirado",
            image_url="https://example.com/expired.jpg",
            active=True,
            ends_at=now - timedelta(minutes=1),
        )

        self.assertEqual(list(Banner.objects.visible(now).values_list("title", flat=True)), ["Ativo"])
