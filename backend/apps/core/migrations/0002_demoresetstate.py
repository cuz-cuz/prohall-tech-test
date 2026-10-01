from django.db import migrations, models


def create_reset_state(apps, schema_editor):
    DemoResetState = apps.get_model("core", "DemoResetState")
    DemoResetState.objects.get_or_create(pk=1)


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="DemoResetState",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("locked_until", models.DateTimeField(blank=True, null=True)),
                ("last_reset_at", models.DateTimeField(blank=True, null=True)),
                ("last_reset_by", models.CharField(blank=True, max_length=150)),
                ("last_summary", models.JSONField(blank=True, default=dict)),
            ],
            options={
                "verbose_name": "estado da restauração de demonstração",
                "verbose_name_plural": "estado da restauração de demonstração",
                "constraints": [
                    models.CheckConstraint(
                        condition=models.Q(("id", 1)),
                        name="core_demoresetstate_is_singleton",
                    )
                ],
            },
        ),
        migrations.RunPython(create_reset_state, migrations.RunPython.noop),
    ]
