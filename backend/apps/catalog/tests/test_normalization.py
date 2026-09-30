from decimal import Decimal

from django.test import SimpleTestCase

from apps.catalog.services.importer import ProductImportError, normalize_product

from .factories import product_payload


class ProductNormalizationTests(SimpleTestCase):
    def test_normalizes_money_from_its_text_representation(self):
        normalized = normalize_product(
            product_payload(price=19.995, discountPercentage=5.555)
        )

        self.assertEqual(normalized["source_price"], Decimal("20.00"))
        self.assertEqual(
            normalized["source_discount_percentage"],
            Decimal("5.56"),
        )

    def test_accepts_missing_optional_brand_and_discount(self):
        normalized = normalize_product(
            product_payload(brand=None, discountPercentage=None)
        )

        self.assertEqual(normalized["brand"], "")
        self.assertIsNone(normalized["source_discount_percentage"])

    def test_rejects_negative_stock(self):
        with self.assertRaisesMessage(ProductImportError, "cannot be negative"):
            normalize_product(product_payload(stock=-1))

    def test_rejects_invalid_images(self):
        with self.assertRaisesMessage(ProductImportError, "list of strings"):
            normalize_product(product_payload(images="not-a-list"))

    def test_rejects_non_finite_money(self):
        with self.assertRaisesMessage(ProductImportError, "must be finite"):
            normalize_product(product_payload(price="NaN"))
