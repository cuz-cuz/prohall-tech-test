from django.conf import settings as django_settings
from django.db import migrations, models
from django.db.models import Q


def mark_listings_that_already_showed_the_badge(apps, schema_editor):
    """Keep the storefront looking the same right after the migration.

    The badge used to be derived from the unit price against the store minimum.
    It is now an explicit field, so the listings that met the old rule start
    marked and the staff can change them from the panel afterwards.
    """

    Listing = apps.get_model("catalog", "Listing")
    Listing.objects.filter(
        Q(promotional_price__gte=django_settings.FREE_SHIPPING_MINIMUM)
        | Q(promotional_price__isnull=True, price__gte=django_settings.FREE_SHIPPING_MINIMUM)
    ).update(free_shipping=True)


class Migration(migrations.Migration):

    dependencies = [
        ('catalog', '0003_search_extensions_and_indexes'),
    ]

    operations = [
        migrations.AddField(
            model_name='listing',
            name='free_shipping',
            field=models.BooleanField(db_index=True, default=False),
        ),
        migrations.RunPython(
            mark_listings_that_already_showed_the_badge,
            migrations.RunPython.noop,
            elidable=True,
        ),
    ]
