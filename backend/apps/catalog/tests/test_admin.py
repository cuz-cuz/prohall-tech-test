from django.contrib.admin.sites import AdminSite
from django.test import SimpleTestCase

from apps.catalog.admin import ImportedProductAdmin
from apps.catalog.models import ImportedProduct


class ImportedProductAdminTests(SimpleTestCase):
    def setUp(self):
        self.model_admin = ImportedProductAdmin(ImportedProduct, AdminSite())

    def test_external_products_cannot_be_created_edited_or_deleted(self):
        self.assertFalse(self.model_admin.has_add_permission(request=None))
        self.assertFalse(self.model_admin.has_change_permission(request=None))
        self.assertFalse(self.model_admin.has_delete_permission(request=None))
