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

        call_command("seed_demo", stdout=StringIO())
        listing = Listing.objects.get(product=product)
        listing.price = Decimal("79.90")
        listing.save(update_fields=("price", "updated_at"))
        call_command("seed_demo", stdout=StringIO())

        self.assertEqual(Listing.objects.count(), 1)
        self.assertEqual(Listing.objects.get().price, Decimal("79.90"))
        self.assertEqual(Menu.objects.count(), 4)
        self.assertEqual(MenuListing.objects.count(), 2)
        self.assertEqual(Banner.objects.count(), 1)
        self.assertEqual(get_user_model().objects.filter(username="demo-admin").count(), 1)
        self.assertTrue(
            get_user_model().objects.get(username="demo-admin").check_password(
                "local-test-password"
            )
        )
