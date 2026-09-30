from django.core.management.base import BaseCommand, CommandError

from apps.catalog.services.dummyjson import DummyJSONError
from apps.catalog.services.importer import ProductImportError, sync_products


class Command(BaseCommand):
    help = "Importa ou atualiza produtos da API pública DummyJSON."

    def handle(self, *args, **options):
        self.stdout.write("Importando produtos do DummyJSON...")
        try:
            summary = sync_products()
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
