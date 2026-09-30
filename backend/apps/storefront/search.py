import re
import unicodedata
from difflib import SequenceMatcher

from django.contrib.postgres.search import TrigramWordSimilarity
from django.db import connection
from django.db.models import (
    Case,
    ExpressionWrapper,
    Exists,
    F,
    FloatField,
    Func,
    OuterRef,
    Prefetch,
    Q,
    Subquery,
    TextField,
    Value,
    When,
)
from django.db.models.functions import Coalesce

from apps.catalog.models import Listing, Menu


SEARCH_SIMILARITY_THRESHOLD = 0.18


class NormalizeSearchText(Func):
    function = "mosaico_normalize"
    arity = 1
    output_field = TextField()


def normalize_search_term(value: str) -> str:
    decomposed = unicodedata.normalize("NFKD", value.casefold())
    without_accents = "".join(
        character
        for character in decomposed
        if not unicodedata.combining(character)
    )
    return re.sub(r"[^a-z0-9]+", " ", without_accents).strip()


def _field_score(value: str, query: str, weight: float) -> float:
    normalized = normalize_search_term(value or "")
    if not normalized:
        return 0.0
    if normalized == query:
        return weight * 4
    if normalized.startswith(query):
        return weight * 3
    if query in normalized:
        return weight * 2
    if any(word.startswith(query) for word in normalized.split()):
        return weight * 1.6

    similarity = SequenceMatcher(None, query, normalized).ratio()
    return weight * similarity if similarity >= 0.45 else 0.0


def _portable_search(query: str):
    listings = (
        Listing.objects.filter(active=True)
        .select_related("product")
        .prefetch_related(
            Prefetch("menus", queryset=Menu.objects.filter(active=True))
        )
    )
    ranked = []
    for listing in listings:
        menu_names = " ".join(menu.name for menu in listing.menus.all())
        score = sum(
            (
                _field_score(listing.title, query, 4.0),
                _field_score(listing.product.brand, query, 3.0),
                _field_score(listing.product.category, query, 2.5),
                _field_score(menu_names, query, 2.0),
                _field_score(listing.description, query, 1.0),
            )
        )
        if score > 0:
            ranked.append((score, listing.title.casefold(), listing.id, listing))

    ranked.sort(key=lambda item: (-item[0], item[1], item[2]))
    return [item[3] for item in ranked]


def _postgres_search(query: str):
    query_value = Value(query, output_field=TextField())
    queryset = Listing.objects.filter(active=True).select_related("product")
    related_menus = Menu.objects.filter(active=True, listings=OuterRef("pk"))
    related_menus_with_similarity = related_menus.annotate(
        similarity=TrigramWordSimilarity(
            query_value,
            NormalizeSearchText("name"),
        )
    ).order_by("-similarity")
    related_menus_containing_query = related_menus.annotate(
        search_name=NormalizeSearchText("name")
    ).filter(search_name__contains=query)

    queryset = queryset.annotate(
        search_title=NormalizeSearchText("title"),
        search_description=NormalizeSearchText("description"),
        search_brand=NormalizeSearchText("product__brand"),
        search_category=NormalizeSearchText("product__category"),
        title_similarity=TrigramWordSimilarity(query_value, NormalizeSearchText("title")),
        description_similarity=TrigramWordSimilarity(
            query_value,
            NormalizeSearchText("description"),
        ),
        brand_similarity=TrigramWordSimilarity(
            query_value,
            NormalizeSearchText("product__brand"),
        ),
        category_similarity=TrigramWordSimilarity(
            query_value,
            NormalizeSearchText("product__category"),
        ),
        menu_similarity=Coalesce(
            Subquery(
                related_menus_with_similarity.values("similarity")[:1],
                output_field=FloatField(),
            ),
            Value(0.0),
        ),
        menu_contains=Exists(related_menus_containing_query),
    ).filter(
        Q(search_title__contains=query)
        | Q(search_description__contains=query)
        | Q(search_brand__contains=query)
        | Q(search_category__contains=query)
        | Q(menu_contains=True)
        | Q(title_similarity__gte=SEARCH_SIMILARITY_THRESHOLD)
        | Q(description_similarity__gte=SEARCH_SIMILARITY_THRESHOLD)
        | Q(brand_similarity__gte=SEARCH_SIMILARITY_THRESHOLD)
        | Q(category_similarity__gte=SEARCH_SIMILARITY_THRESHOLD)
        | Q(menu_similarity__gte=SEARCH_SIMILARITY_THRESHOLD)
    )

    direct_match_boost = (
        Case(
            When(search_title__startswith=query, then=Value(4.0)),
            When(search_title__contains=query, then=Value(2.0)),
            default=Value(0.0),
            output_field=FloatField(),
        )
        + Case(
            When(search_brand__startswith=query, then=Value(3.0)),
            When(search_brand__contains=query, then=Value(1.5)),
            default=Value(0.0),
            output_field=FloatField(),
        )
        + Case(
            When(search_category__startswith=query, then=Value(2.5)),
            When(search_category__contains=query, then=Value(1.25)),
            default=Value(0.0),
            output_field=FloatField(),
        )
        + Case(
            When(menu_contains=True, then=Value(1.5)),
            default=Value(0.0),
            output_field=FloatField(),
        )
    )
    similarity_score = (
        F("title_similarity") * Value(4.0)
        + F("brand_similarity") * Value(3.0)
        + F("category_similarity") * Value(2.5)
        + F("menu_similarity") * Value(2.0)
        + F("description_similarity")
    )

    return queryset.annotate(
        search_rank=ExpressionWrapper(
            direct_match_boost + similarity_score,
            output_field=FloatField(),
        )
    ).order_by("-search_rank", "title", "id")


def search_active_listings(term: str):
    query = normalize_search_term(term)
    if connection.vendor == "postgresql":
        return _postgres_search(query)
    return _portable_search(query)
