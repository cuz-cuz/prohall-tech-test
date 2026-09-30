from decimal import Decimal

from django.contrib.auth import get_user_model
from django.contrib.admin.sites import AdminSite
from django.test import SimpleTestCase, TestCase, override_settings
from django.urls import reverse
from django.utils import timezone

from apps.catalog.admin import ImportedProductAdmin
from apps.catalog.models import ImportedProduct


class ImportedProductAdminTests(SimpleTestCase):
    def setUp(self):
        self.model_admin = ImportedProductAdmin(ImportedProduct, AdminSite())

    def test_external_products_cannot_be_created_edited_or_deleted(self):
        self.assertFalse(self.model_admin.has_add_permission(request=None))
        self.assertFalse(self.model_admin.has_change_permission(request=None))
        self.assertFalse(self.model_admin.has_delete_permission(request=None))


@override_settings(
    STORAGES={
        "default": {"BACKEND": "django.core.files.storage.FileSystemStorage"},
        "staticfiles": {
            "BACKEND": "django.contrib.staticfiles.storage.StaticFilesStorage"
        },
    }
)
class CatalogAdminIntegrationTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.admin_user = get_user_model().objects.create_superuser(
            username="admin-test",
            email="admin-test@example.com",
            password="test-password",
        )
        cls.product = ImportedProduct.objects.create(
            external_id=123,
            title="Produto para anúncio",
            description="Descrição importada",
            category="beauty",
            source_price=Decimal("49.90"),
            source_stock=4,
            last_synced_at=timezone.now(),
        )

    def setUp(self):
        self.client.force_login(self.admin_user)

    def test_catalog_admin_pages_render(self):
        admin_pages = (
            "admin:catalog_importedproduct_changelist",
            "admin:catalog_listing_changelist",
            "admin:catalog_menu_changelist",
            "admin:catalog_banner_changelist",
        )

        for page_name in admin_pages:
            with self.subTest(page_name=page_name):
                response = self.client.get(reverse(page_name))
                self.assertEqual(response.status_code, 200)

    def test_listing_form_opens_prefilled_from_imported_product(self):
        response = self.client.get(
            reverse("admin:catalog_listing_add"),
            {"product": self.product.pk},
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.context["adminform"].form.initial["title"], self.product.title)
        self.assertEqual(
            response.context["adminform"].form.initial["slug"],
            "produto-para-anuncio-123",
        )
