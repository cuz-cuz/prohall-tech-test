"""Categories the store sells.

Mosaico is a women's niche shop, so the catalog is deliberately narrower than
the DummyJSON source. This is the single place that decides which categories
are imported and how they are grouped into storefront menus; the importer, the
seed command and the admin panel all read from here.

Every slug below exists in the DummyJSON category list. Adding one that does
not will make the import fail loudly instead of silently importing nothing.
"""

CATEGORY_GROUPS = {
    "beleza": {"beauty"},
    "cuidados-pessoais": {"skin-care"},
    "perfumes": {"fragrances"},
    "roupas": {"tops", "womens-dresses"},
    "bolsas": {"womens-bags"},
    "calcados": {"womens-shoes"},
    "acessorios": {"sunglasses", "womens-jewellery", "womens-watches"},
}

NICHE_CATEGORIES = frozenset().union(*CATEGORY_GROUPS.values())
