from django.test import TestCase

from apps.catalog.models import ImportedProduct
from apps.catalog.niche import NICHE_CATEGORIES
from apps.catalog.services.importer import ProductImportError, sync_products

from .factories import product_payload


class FakeClient:
    """Stands in for DummyJSONClient and records how it was asked to read."""

    def __init__(self, products):
        self.products = products
        self.requested_categories = None
        self.fetched_everything = False

    def fetch_all_products(self):
        self.fetched_everything = True
        return self.products

    def fetch_products_in_categories(self, categories):
        self.requested_categories = list(categories)
        selected = set(self.requested_categories)
        return [item for item in self.products if item["category"] in selected]


class ProductImportTests(TestCase):
    def test_reimport_updates_without_creating_duplicates(self):
        first_summary = sync_products(client=FakeClient([product_payload(1)]))
        second_summary = sync_products(
            client=FakeClient([product_payload(1, title="Produto atualizado")])
        )

        self.assertEqual(first_summary.created, 1)
        self.assertEqual(second_summary.updated, 1)
        self.assertEqual(ImportedProduct.objects.count(), 1)
        self.assertEqual(
            ImportedProduct.objects.get(external_id=1).title,
            "Produto atualizado",
        )

    def test_invalid_batch_is_rejected_before_any_write(self):
        products = [product_payload(1), product_payload(2, stock=-1)]

        with self.assertRaises(ProductImportError):
            sync_products(client=FakeClient(products))

        self.assertEqual(ImportedProduct.objects.count(), 0)

    def test_import_asks_only_for_the_store_categories(self):
        client = FakeClient(
            [
                product_payload(1, category="beauty"),
                product_payload(2, category="womens-bags"),
                product_payload(3, category="mens-shirts"),
                product_payload(4, category="laptops"),
            ]
        )

        summary = sync_products(client=client)

        self.assertEqual(client.requested_categories, sorted(NICHE_CATEGORIES))
        self.assertFalse(client.fetched_everything)
        self.assertEqual(summary.created, 2)
        self.assertEqual(
            sorted(ImportedProduct.objects.values_list("category", flat=True)),
            ["beauty", "womens-bags"],
        )

    def test_products_outside_the_niche_are_dropped_and_counted(self):
        # The category endpoints already narrow the request, so this only
        # happens if the source returns something the store does not sell.
        class LooseClient(FakeClient):
            def fetch_products_in_categories(self, categories):
                self.requested_categories = list(categories)
                return self.products

        client = LooseClient(
            [product_payload(1, category="beauty"), product_payload(2, category="laptops")]
        )

        summary = sync_products(client=client)

        self.assertEqual(summary.created, 1)
        self.assertEqual(summary.skipped, 1)
        self.assertEqual(summary.total, 1)
        self.assertFalse(ImportedProduct.objects.filter(category="laptops").exists())

    def test_categories_none_imports_the_whole_source(self):
        client = FakeClient(
            [product_payload(1, category="beauty"), product_payload(2, category="laptops")]
        )

        summary = sync_products(client=client, categories=None)

        self.assertTrue(client.fetched_everything)
        self.assertIsNone(client.requested_categories)
        self.assertEqual(summary.created, 2)
        self.assertEqual(summary.skipped, 0)
