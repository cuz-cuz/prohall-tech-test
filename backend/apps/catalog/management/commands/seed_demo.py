from decimal import Decimal

from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.utils.text import slugify

from apps.catalog.models import Banner, ImportedProduct, Listing, Menu, MenuListing


MENU_DEFINITIONS = (
    ("Novidades", "novidades", 0),
    ("Beleza", "beleza", 1),
    ("Casa", "casa", 2),
    ("Tecnologia", "tecnologia", 3),
)

CATEGORY_GROUPS = {
    "beleza": {"beauty", "fragrances", "skin-care"},
    "casa": {"furniture", "groceries", "home-decoration", "kitchen-accessories"},
    "tecnologia": {"laptops", "mobile-accessories", "smartphones", "tablets"},
}


class Command(BaseCommand):
    help = "Cria anúncios, menus e banners de demonstração sem sobrescrever dados locais."

    @transaction.atomic
    def handle(self, *args, **options):
        products = list(ImportedProduct.objects.order_by("external_id")[:24])
        if not products:
            raise CommandError(
                "Nenhum produto importado encontrado. Execute import_products primeiro."
            )

        menus = {}
        created_menus = 0
        for name, slug, order in MENU_DEFINITIONS:
            menu, created = Menu.objects.get_or_create(
                slug=slug,
                defaults={
                    "name": name,
                    "display_order": order,
                    "active": True,
                },
            )
            menus[slug] = menu
            created_menus += int(created)

        listings = []
        created_listings = 0
        for product in products:
            listing_slug = f"{slugify(product.title) or 'produto'}-{product.external_id}"
            listing, created = Listing.objects.get_or_create(
                slug=listing_slug,
                defaults={
                    "product": product,
                    "title": product.title,
                    "description": product.description,
                    "price": product.source_price
                    if product.source_price > 0
                    else Decimal("1.00"),
                    "stock_quantity": product.source_stock,
                    "active": True,
                },
            )
            listings.append(listing)
            created_listings += int(created)

        created_links = 0
        for position, (product, listing) in enumerate(zip(products, listings, strict=True)):
            created_links += self._add_to_menu(menus["novidades"], listing, position)
            for menu_slug, categories in CATEGORY_GROUPS.items():
                if product.category in categories:
                    created_links += self._add_to_menu(
                        menus[menu_slug],
                        listing,
                        position,
                    )

        created_banners = 0
        for order, (product, listing) in enumerate(
            zip(products[:2], listings[:2], strict=True)
        ):
            if not product.thumbnail_url:
                continue
            _, created = Banner.objects.get_or_create(
                title=f"Destaque: {listing.title}",
                defaults={
                    "image_url": product.thumbnail_url,
                    "link_url": f"/produto/{listing.slug}",
                    "alt_text": f"Conheça {listing.title}",
                    "display_order": order,
                    "active": True,
                },
            )
            created_banners += int(created)

        admin_status = self._ensure_demo_admin()

        self.stdout.write(
            self.style.SUCCESS(
                "Dados de demonstração preparados: "
                f"{created_listings} anúncios, {created_menus} menus, "
                f"{created_links} vínculos e {created_banners} banners criados; "
                f"administrador {admin_status}."
            )
        )

    @staticmethod
    def _add_to_menu(menu, listing, position):
        _, created = MenuListing.objects.get_or_create(
            menu=menu,
            listing=listing,
            defaults={"display_order": position},
        )
        return int(created)

    @staticmethod
    def _ensure_demo_admin():
        password = settings.DEMO_ADMIN_PASSWORD
        if not password:
            return "ignorado (DEMO_ADMIN_PASSWORD não definida)"

        user_model = get_user_model()
        user, created = user_model.objects.get_or_create(
            username=settings.DEMO_ADMIN_USERNAME,
            defaults={"email": settings.DEMO_ADMIN_EMAIL},
        )
        user.email = settings.DEMO_ADMIN_EMAIL
        user.is_staff = True
        user.is_superuser = True
        user.is_active = True
        user.set_password(password)
        user.save()
        return "criado" if created else "atualizado"
