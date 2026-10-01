import re
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
    ("Cuidados pessoais", "cuidados-pessoais", 2),
    ("Perfumes", "perfumes", 3),
    ("Roupas", "roupas", 4),
    ("Bolsas", "bolsas", 5),
    ("Calçados", "calcados", 6),
    ("Acessórios", "acessorios", 7),
)

CATEGORY_GROUPS = {
    "beleza": {"beauty"},
    "cuidados-pessoais": {"skin-care"},
    "perfumes": {"fragrances"},
    "roupas": {"tops", "womens-dresses"},
    "bolsas": {"womens-bags"},
    "calcados": {"womens-shoes"},
    "acessorios": {"sunglasses", "womens-jewellery", "womens-watches"},
}

FEMALE_FASHION_CATEGORIES = frozenset().union(*CATEGORY_GROUPS.values())
MALE_TITLE_PATTERN = re.compile(r"\b(?:men|men's|mens|male)\b", re.IGNORECASE)
LEGACY_MENU_SLUGS = ("casa", "tecnologia")
BANNER_CATEGORIES = ("beauty", "fragrances", "womens-dresses")


class Command(BaseCommand):
    help = "Prepara uma vitrine feminina com todos os produtos compatíveis importados."

    @transaction.atomic
    def handle(self, *args, **options):
        imported_products = list(
            ImportedProduct.objects.filter(
                category__in=FEMALE_FASHION_CATEGORIES
            ).order_by("external_id")
        )
        products = [
            product
            for product in imported_products
            if not MALE_TITLE_PATTERN.search(product.title)
        ]
        if not ImportedProduct.objects.exists():
            raise CommandError(
                "Nenhum produto importado encontrado. Execute import_products primeiro."
            )
        if not products:
            raise CommandError(
                "Nenhum produto de moda feminina foi encontrado no catálogo importado."
            )

        selected_product_ids = [product.pk for product in products]
        deactivated_listings = Listing.objects.filter(active=True).exclude(
            product_id__in=selected_product_ids
        ).update(active=False)
        Menu.objects.filter(slug__in=LEGACY_MENU_SLUGS, active=True).update(
            active=False
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
        configured_promotions = 0
        for product in products:
            listing_slug = f"{slugify(product.title) or 'produto'}-{product.external_id}"
            generated_price = (
                product.source_price
                if product.source_price > 0
                else Decimal("1.00")
            )
            generated_promotion = self._promotional_price(product, generated_price)
            listing, created = Listing.objects.get_or_create(
                slug=listing_slug,
                defaults={
                    "product": product,
                    "title": product.title,
                    "description": product.description,
                    "price": generated_price,
                    "promotional_price": generated_promotion,
                    "stock_quantity": product.source_stock,
                    "active": True,
                },
            )
            if created and generated_promotion is not None:
                configured_promotions += 1
            elif (
                listing.promotional_price is None
                and generated_promotion is not None
                and listing.product_id == product.pk
                and listing.title == product.title
                and listing.description == product.description
                and listing.price == generated_price
            ):
                listing.promotional_price = generated_promotion
                listing.save(update_fields=("promotional_price", "updated_at"))
                configured_promotions += 1
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

        removed_links = 0
        selected_listing_ids = [listing.pk for listing in listings]
        removed_links += self._remove_stale_links(
            menus["novidades"], selected_listing_ids
        )
        for menu_slug, categories in CATEGORY_GROUPS.items():
            category_listing_ids = [
                listing.pk
                for product, listing in zip(products, listings, strict=True)
                if product.category in categories
            ]
            removed_links += self._remove_stale_links(
                menus[menu_slug], category_listing_ids
            )

        created_banners = 0
        listing_by_product_id = {
            listing.product_id: listing for listing in listings
        }
        banner_products = []
        for category in BANNER_CATEGORIES:
            product = next(
                (item for item in products if item.category == category),
                None,
            )
            if product:
                banner_products.append(product)

        for order, product in enumerate(banner_products):
            listing = listing_by_product_id[product.pk]
            if not product.primary_image_url:
                continue
            _, created = Banner.objects.get_or_create(
                title=f"Destaque: {listing.title}",
                defaults={
                    "image_url": product.primary_image_url,
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
                f"{len(products)} produtos femininos selecionados, "
                f"{created_listings} anúncios criados, "
                f"{configured_promotions} promoções de demonstração configuradas, "
                f"{deactivated_listings} anúncios genéricos desativados, "
                f"{created_menus} menus criados, "
                f"{created_links} vínculos criados, {removed_links} vínculos antigos "
                f"removidos e {created_banners} banners criados; "
                f"administrador {admin_status}."
            )
        )

    @staticmethod
    def _promotional_price(product, price):
        discount = product.source_discount_percentage
        if discount is None or discount <= 0 or discount >= 100:
            return None
        promotional_price = (
            price * (Decimal("100") - discount) / Decimal("100")
        ).quantize(Decimal("0.01"))
        return promotional_price if Decimal("0.00") < promotional_price < price else None

    @staticmethod
    def _add_to_menu(menu, listing, position):
        _, created = MenuListing.objects.update_or_create(
            menu=menu,
            listing=listing,
            defaults={"display_order": position},
        )
        return int(created)

    @staticmethod
    def _remove_stale_links(menu, allowed_listing_ids):
        deleted, _ = menu.listing_links.exclude(
            listing_id__in=allowed_listing_ids
        ).delete()
        return deleted

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
