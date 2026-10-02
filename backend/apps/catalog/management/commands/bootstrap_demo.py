from django.core.management import call_command
from django.core.management.base import BaseCommand

from apps.catalog.models import Listing


class Command(BaseCommand):
    help = (
        "Popula um banco recém-criado com produtos, vitrine e administrador de teste. "
        "Não faz nada se a loja já tiver anúncios, para preservar edições do painel."
    )

    def handle(self, *args, **options):
        if Listing.objects.exists():
            self.stdout.write("A loja já tem anúncios; bootstrap ignorado.")
            return

        call_command("import_products", stdout=self.stdout, stderr=self.stderr)
        call_command("seed_demo", stdout=self.stdout, stderr=self.stderr)
