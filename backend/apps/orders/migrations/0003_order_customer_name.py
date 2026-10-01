from django.db import migrations, models
from django.db.models import OuterRef, Subquery


def copy_customer_name_into_orders(apps, schema_editor):
    """Seed the snapshot of existing orders with the current customer name.

    It is the only name these orders ever had available, so it is also the best
    approximation of the name used at the time of each purchase.
    """

    Order = apps.get_model("orders", "Order")
    Customer = apps.get_model("customers", "Customer")
    Order.objects.filter(customer_name="").update(
        customer_name=Subquery(
            Customer.objects.filter(pk=OuterRef("customer_id")).values("name")[:1]
        )
    )


class Migration(migrations.Migration):

    dependencies = [
        ('customers', '0002_customeraccesscode'),
        ('orders', '0002_order_orders_order_total_matches_subtotal'),
    ]

    operations = [
        migrations.AddField(
            model_name='order',
            name='customer_name',
            field=models.CharField(default='', max_length=150),
            preserve_default=False,
        ),
        migrations.RunPython(
            copy_customer_name_into_orders,
            migrations.RunPython.noop,
            elidable=True,
        ),
    ]
