from io import StringIO
from unittest.mock import patch

from django.core.management import CommandError, call_command
from django.test import SimpleTestCase

from apps.catalog.services.dummyjson import DummyJSONResponseError
from apps.catalog.services.importer import ImportSummary


class ImportProductsCommandTests(SimpleTestCase):
    @patch(
        "apps.catalog.management.commands.import_products.sync_products",
        return_value=ImportSummary(created=2, updated=3),
    )
    def test_prints_import_summary(self, _sync_products):
        stdout = StringIO()

        call_command("import_products", stdout=stdout)

        self.assertIn("2 criado(s)", stdout.getvalue())
        self.assertIn("3 atualizado(s)", stdout.getvalue())
        self.assertIn("5 processado(s)", stdout.getvalue())

    @patch(
        "apps.catalog.management.commands.import_products.sync_products",
        side_effect=DummyJSONResponseError("Contrato externo inválido."),
    )
    def test_converts_expected_failures_to_command_error(self, _sync_products):
        with self.assertRaisesMessage(CommandError, "Contrato externo inválido"):
            call_command("import_products")
