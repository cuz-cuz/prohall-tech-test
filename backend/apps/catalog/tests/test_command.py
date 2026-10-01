from io import StringIO
from unittest.mock import patch

from django.core.management import CommandError, call_command
from django.test import TestCase

from apps.catalog.niche import NICHE_CATEGORIES
from apps.catalog.services.dummyjson import DummyJSONResponseError
from apps.catalog.services.importer import ImportSummary


class ImportProductsCommandTests(TestCase):
    @patch(
        "apps.catalog.management.commands.import_products.sync_products",
        return_value=ImportSummary(created=2, updated=3, skipped=4),
    )
    def test_prints_import_summary(self, sync_products):
        stdout = StringIO()

        call_command("import_products", stdout=stdout)

        self.assertIn("2 criado(s)", stdout.getvalue())
        self.assertIn("3 atualizado(s)", stdout.getvalue())
        self.assertIn("5 processado(s)", stdout.getvalue())
        self.assertIn("4 produto(s) fora do nicho foram ignorados", stdout.getvalue())
        self.assertEqual(
            sync_products.call_args.kwargs["categories"],
            NICHE_CATEGORIES,
        )

    @patch(
        "apps.catalog.management.commands.import_products.sync_products",
        return_value=ImportSummary(created=0, updated=0),
    )
    def test_all_categories_flag_lifts_the_niche_filter(self, sync_products):
        call_command("import_products", "--all-categories", stdout=StringIO())

        self.assertIsNone(sync_products.call_args.kwargs["categories"])

    @patch(
        "apps.catalog.management.commands.import_products.sync_products",
        side_effect=DummyJSONResponseError("Contrato externo inválido."),
    )
    def test_converts_expected_failures_to_command_error(self, _sync_products):
        with self.assertRaisesMessage(CommandError, "Contrato externo inválido"):
            call_command("import_products")

    @patch(
        "apps.catalog.management.commands.import_products.sync_products",
        return_value=ImportSummary(created=0, updated=0),
    )
    def test_prune_removes_only_products_without_listings(self, _sync_products):
        from decimal import Decimal

        from django.utils import timezone

        from apps.catalog.models import ImportedProduct, Listing

        def make(external_id, category):
            return ImportedProduct.objects.create(
                external_id=external_id,
                title=f"Produto {external_id}",
                category=category,
                source_price=Decimal("10.00"),
                last_synced_at=timezone.now(),
            )

        in_niche = make(1, "beauty")
        make(2, "mens-shirts")
        advertised = make(3, "laptops")
        off_niche_listing = Listing.objects.create(
            product=advertised,
            slug="notebook",
            title="Notebook",
            price=Decimal("10.00"),
            stock_quantity=1,
            active=True,
        )
        kept_listing = Listing.objects.create(
            product=in_niche,
            slug="serum",
            title="Sérum",
            price=Decimal("10.00"),
            stock_quantity=1,
            active=True,
        )
        stdout = StringIO()

        call_command("import_products", "--remover-fora-do-nicho", stdout=stdout)

        self.assertIn(
            "1 anúncio(s) fora do nicho desativado(s) e 1 produto(s) removido(s)",
            stdout.getvalue(),
        )
        self.assertIn("1 produto(s) fora do nicho foram preservados", stdout.getvalue())

        # The orphan is gone; the advertised one stays, out of the storefront.
        self.assertEqual(
            sorted(ImportedProduct.objects.values_list("external_id", flat=True)),
            [1, 3],
        )
        off_niche_listing.refresh_from_db()
        kept_listing.refresh_from_db()
        self.assertFalse(off_niche_listing.active)
        self.assertTrue(kept_listing.active)
