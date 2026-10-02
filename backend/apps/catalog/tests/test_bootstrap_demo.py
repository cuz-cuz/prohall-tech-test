from decimal import Decimal
from io import StringIO
from unittest.mock import patch

from django.core.management import call_command
from django.test import TestCase
from django.utils import timezone

from apps.catalog.models import ImportedProduct, Listing


class BootstrapDemoCommandTests(TestCase):
    @patch("apps.catalog.management.commands.bootstrap_demo.call_command")
    def test_empty_store_is_imported_and_seeded(self, nested_call):
        call_command("bootstrap_demo", stdout=StringIO())

        self.assertEqual(
            [call.args[0] for call in nested_call.call_args_list],
            ["import_products", "seed_demo"],
        )

    @patch("apps.catalog.management.commands.bootstrap_demo.call_command")
    def test_store_with_listings_is_left_untouched(self, nested_call):
        product = ImportedProduct.objects.create(
            external_id=1, title="Batom", category="beauty",
            source_price=Decimal("10.00"), last_synced_at=timezone.now(),
        )
        Listing.objects.create(product=product, slug="batom", title="Batom", price=Decimal("10.00"))
        stdout = StringIO()

        call_command("bootstrap_demo", stdout=stdout)

        nested_call.assert_not_called()
        self.assertIn("ignorado", stdout.getvalue())
