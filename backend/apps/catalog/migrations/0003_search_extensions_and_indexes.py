from django.db import migrations


INDEX_NAMES = (
    "cat_lst_title_trgm",
    "cat_lst_desc_trgm",
    "cat_prod_brand_trgm",
    "cat_prod_cat_trgm",
    "cat_menu_name_trgm",
)


def create_postgres_search_support(apps, schema_editor):
    if schema_editor.connection.vendor != "postgresql":
        return

    statements = (
        "CREATE EXTENSION IF NOT EXISTS unaccent",
        "CREATE EXTENSION IF NOT EXISTS pg_trgm",
        """
        CREATE OR REPLACE FUNCTION mosaico_normalize(text)
        RETURNS text
        LANGUAGE sql
        IMMUTABLE
        PARALLEL SAFE
        STRICT
        AS $function$
            SELECT trim(
                regexp_replace(
                    lower(public.unaccent('public.unaccent'::regdictionary, $1)),
                    '[^[:alnum:]]+',
                    ' ',
                    'g'
                )
            )
        $function$
        """,
        """
        CREATE INDEX cat_lst_title_trgm
        ON catalog_listing
        USING gin (mosaico_normalize(title) gin_trgm_ops)
        WHERE active
        """,
        """
        CREATE INDEX cat_lst_desc_trgm
        ON catalog_listing
        USING gin (mosaico_normalize(description) gin_trgm_ops)
        WHERE active
        """,
        """
        CREATE INDEX cat_prod_brand_trgm
        ON catalog_importedproduct
        USING gin (mosaico_normalize(brand) gin_trgm_ops)
        """,
        """
        CREATE INDEX cat_prod_cat_trgm
        ON catalog_importedproduct
        USING gin (mosaico_normalize(category) gin_trgm_ops)
        """,
        """
        CREATE INDEX cat_menu_name_trgm
        ON catalog_menu
        USING gin (mosaico_normalize(name) gin_trgm_ops)
        WHERE active
        """,
    )
    for statement in statements:
        schema_editor.execute(statement)


def remove_postgres_search_support(apps, schema_editor):
    if schema_editor.connection.vendor != "postgresql":
        return

    for index_name in INDEX_NAMES:
        schema_editor.execute(f"DROP INDEX IF EXISTS {index_name}")
    schema_editor.execute("DROP FUNCTION IF EXISTS mosaico_normalize(text)")


class Migration(migrations.Migration):
    dependencies = [
        ("catalog", "0002_menu_banner_listing_menulisting_menu_listings_and_more"),
    ]

    operations = [
        migrations.RunPython(
            create_postgres_search_support,
            remove_postgres_search_support,
        ),
    ]
