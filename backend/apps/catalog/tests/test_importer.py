from django.test import TestCase

from apps.catalog.models import ImportedProduct
from apps.catalog.services.importer import ProductImportError, sync_products

from .factories import product_payload


class FakeClient:
    def __init__(self, products):
        self.products = products

    def fetch_all_products(self):
        return self.products


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
