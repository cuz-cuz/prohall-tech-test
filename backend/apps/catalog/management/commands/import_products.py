from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from apps.catalog.models import ImportedProduct
from apps.catalog.niche import NICHE_CATEGORIES
from apps.catalog.services.dummyjson import DummyJSONError
from apps.catalog.services.importer import ProductImportError, sync_products


class Command(BaseCommand):
    help = (
        "Importa ou atualiza os produtos do nicho feminino da API pública DummyJSON."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--all-categories",
            action="store_true",
            help=(
                "Importa o catálogo inteiro do DummyJSON, inclusive categorias "
                "fora do nicho da loja."
            ),
        )
        parser.add_argument(
            "--remover-fora-do-nicho",
            action="store_true",
            dest="prune",
            help=(
                "Apaga produtos importados fora do nicho que não tenham nenhum "
                "anúncio. Produtos com anúncio são preservados e relatados."
            ),
        )

    def handle(self, *args, **options):
        categories = None if options["all_categories"] else NICHE_CATEGORIES
        if categories is None:
            self.stdout.write("Importando o catálogo completo do DummyJSON...")
        else:
            self.stdout.write(
                f"Importando {len(categories)} categorias do nicho do DummyJSON..."
            )

        try:
            summary = sync_products(categories=categories)
        except (DummyJSONError, ProductImportError) as exc:
            raise CommandError(str(exc)) from exc

        self.stdout.write(
            self.style.SUCCESS(
                "Importação concluída: "
                f"{summary.created} criado(s), "
                f"{summary.updated} atualizado(s), "
                f"{summary.total} processado(s)."
            )
        )
        if summary.skipped:
            self.stdout.write(
                f"{summary.skipped} produto(s) fora do nicho foram ignorados."
            )

        outside_niche = ImportedProduct.objects.exclude(category__in=NICHE_CATEGORIES)
        if options["prune"]:
            self._prune(outside_niche)
            return

        remaining = outside_niche.count()
        if remaining:
            self.stdout.write(
                self.style.WARNING(
                    f"Atenção: {remaining} produto(s) fora do nicho continuam no "
                    "banco, importados antes deste filtro. Esta importação não "
                    "remove nada; use --remover-fora-do-nicho para limpá-los."
                )
            )

    def _prune(self, outside_niche):
        """Delete only what no listing depends on; Listing.product is PROTECT."""

        with transaction.atomic():
            removable = outside_niche.filter(listings__isnull=True)
            removed, _ = removable.delete()
            kept = outside_niche.count()

        self.stdout.write(
            self.style.SUCCESS(f"{removed} produto(s) fora do nicho removido(s).")
        )
        if kept:
            self.stdout.write(
                self.style.WARNING(
                    f"{kept} produto(s) fora do nicho foram preservados porque "
                    "ainda têm anúncio. Desative e remova o anúncio antes."
                )
            )
