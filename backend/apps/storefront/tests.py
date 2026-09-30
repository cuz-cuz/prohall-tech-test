from datetime import timedelta
from decimal import Decimal

from django.core.exceptions import ValidationError
from django.db import IntegrityError, transaction
from django.test import SimpleTestCase, TestCase
from django.urls import reverse
from django.utils import timezone
from rest_framework.test import APITestCase

from apps.catalog.models import Banner, ImportedProduct, Listing, Menu, MenuListing

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
            thumbnail_url="https://example.com/product.jpg",
            images=["https://example.com/product.jpg"],
        )
        listing = self.make_listing(
            product=product,
            slug="produto",
            title="Produto",
            description="Descrição",
        )

        data = ListingSerializer(listing).data

        self.assertEqual(data["brand"], "Mosaico")
        self.assertEqual(data["effective_price"], "100.00")
        self.assertTrue(data["is_available"])


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
        self.assertEqual([item["slug"] for item in response.data], ["produto-1"])

    def test_inactive_listing_has_no_public_detail(self):
        self.listing.active = False
        self.listing.save(update_fields=("active", "updated_at"))

        response = self.client.get(
            reverse("storefront:listing-detail", kwargs={"slug": self.listing.slug})
        )

        self.assertEqual(response.status_code, 404)


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
