from decimal import Decimal
from io import StringIO

from django.contrib.auth import get_user_model
from django.core.management import call_command
from django.core.management.base import CommandError
from django.test import TestCase, override_settings
from django.utils import timezone

from apps.catalog.models import Banner, ImportedProduct, Listing, Menu, MenuListing


class SeedDemoCommandTests(TestCase):
    def test_requires_imported_products(self):
        with self.assertRaisesMessage(CommandError, "import_products"):
            call_command("seed_demo")

    @override_settings(
        DEMO_ADMIN_USERNAME="demo-admin",
        DEMO_ADMIN_EMAIL="demo@example.com",
        DEMO_ADMIN_PASSWORD="local-test-password",
    )
    def test_is_idempotent_and_does_not_overwrite_listing(self):
        product = ImportedProduct.objects.create(
            external_id=1,
            title="Produto",
            description="Descrição",
            category="beauty",
            brand="Marca",
            sku="SKU-1",
            source_price=Decimal("99.90"),
            source_stock=5,
            thumbnail_url="https://example.com/product.jpg",
            last_synced_at=timezone.now(),
        )
        bag = ImportedProduct.objects.create(
            external_id=172,
            title="Bolsa feminina",
            category="womens-bags",
            source_price=Decimal("149.90"),
            source_discount_percentage=Decimal("20.00"),
            source_stock=3,
            last_synced_at=timezone.now(),
        )
        male_skin_care = ImportedProduct.objects.create(
            external_id=120,
            title="Vaseline Men Body and Face Lotion",
            category="skin-care",
            source_price=Decimal("19.90"),
            source_stock=4,
            last_synced_at=timezone.now(),
        )
        laptop = ImportedProduct.objects.create(
            external_id=70,
            title="Notebook genérico",
            category="laptops",
            source_price=Decimal("2999.90"),
            source_stock=2,
            last_synced_at=timezone.now(),
        )
        generic_listing = Listing.objects.create(
            product=laptop,
            slug="notebook-generico-70",
            title=laptop.title,
            price=laptop.source_price,
            stock_quantity=laptop.source_stock,
            active=True,
        )
        legacy_beauty_menu = Menu.objects.create(
            name="Beleza",
            slug="beleza",
            display_order=1,
        )
        MenuListing.objects.create(
            menu=legacy_beauty_menu,
            listing=generic_listing,
            display_order=0,
        )

        call_command("seed_demo", stdout=StringIO())
        listing = Listing.objects.get(product=product)
        bag_listing = Listing.objects.get(product=bag)
        self.assertEqual(bag_listing.promotional_price, Decimal("119.92"))
        bag_listing.promotional_price = Decimal("109.90")
        bag_listing.save(update_fields=("promotional_price", "updated_at"))
        listing.price = Decimal("79.90")
        listing.save(update_fields=("price", "updated_at"))
        call_command("seed_demo", stdout=StringIO())

        self.assertEqual(Listing.objects.count(), 3)
        self.assertEqual(Listing.objects.get(product=product).price, Decimal("79.90"))
        self.assertTrue(Listing.objects.get(product=bag).active)
        self.assertEqual(
            Listing.objects.get(product=bag).promotional_price,
            Decimal("109.90"),
        )
        self.assertFalse(Listing.objects.filter(product=male_skin_care).exists())
        generic_listing.refresh_from_db()
        self.assertFalse(generic_listing.active)
        self.assertEqual(Menu.objects.count(), 8)
        self.assertEqual(MenuListing.objects.count(), 4)
        self.assertEqual(Banner.objects.count(), 1)
        self.assertEqual(get_user_model().objects.filter(username="demo-admin").count(), 1)
        self.assertTrue(
            get_user_model().objects.get(username="demo-admin").check_password(
                "local-test-password"
            )
        )
