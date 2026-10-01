from django.db import migrations, models
from django.db.models import Max


def make_banner_orders_unique(apps, schema_editor):
    Banner = apps.get_model("catalog", "Banner")
    highest_order = Banner.objects.aggregate(value=Max("display_order"))["value"]
    next_order = (highest_order if highest_order is not None else -1) + 1
    used_orders = set()

    for banner in Banner.objects.order_by("display_order", "id"):
        if banner.display_order in used_orders:
            banner.display_order = next_order
            banner.save(update_fields=("display_order",))
            next_order += 1
        used_orders.add(banner.display_order)


class Migration(migrations.Migration):

    dependencies = [
        ("catalog", "0004_listing_free_shipping"),
    ]

    operations = [
        migrations.RunPython(make_banner_orders_unique, migrations.RunPython.noop),
        migrations.AddConstraint(
            model_name="banner",
            constraint=models.UniqueConstraint(
                fields=("display_order",),
                name="catalog_unique_banner_display_order",
            ),
        ),
    ]
