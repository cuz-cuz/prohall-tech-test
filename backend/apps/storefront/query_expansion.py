"""Portuguese query expansion for an English catalog.

DummyJSON products are written in English while customers search in
Portuguese. A small dictionary of the store's niche maps Portuguese words to the
English terms the products actually use, and filler words ("pra", "algo") are
dropped. It is deliberately simple and deterministic: no model or external call
runs on each search.

Keys and values are already normalized (lowercase, no accents), the same form
produced by ``normalize_search_term``.
"""

STOPWORDS = frozenset(
    """
    a o as os um uma uns umas de da do das dos e em no na nos nas
    pra pro pras pros para por com sem que qual quais algo algum alguma
    alguns algumas quero procuro busco preciso me meu minha meus minhas
    seu sua mais muito muita bem bom boa
    """.split()
)

PT_TO_EN = {
    # Fragrances
    "perfume": ("perfume", "fragrance", "eau"),
    "fragrancia": ("fragrance", "perfume", "eau"),
    "colonia": ("fragrance", "eau"),
    "cheiroso": ("fragrance", "perfume"),
    # Makeup and beauty
    "maquiagem": ("makeup", "beauty", "mascara", "lipstick", "eyeshadow", "powder"),
    "make": ("makeup", "beauty", "mascara", "lipstick", "eyeshadow", "powder"),
    "beleza": ("beauty",),
    "batom": ("lipstick",),
    "rimel": ("mascara",),
    "cilios": ("lash", "mascara"),
    "sombra": ("eyeshadow",),
    "po": ("powder",),
    "esmalte": ("nail polish",),
    "unha": ("nail",),
    "pele": ("skin",),
    "hidratante": ("moisture", "lotion", "cream"),
    "sabonete": ("soap", "body wash"),
    "banho": ("body wash",),
    "mao": ("hand",),
    "corpo": ("body",),
    # Clothes
    "roupa": ("dress", "tops", "skirt", "frock", "gown", "suit"),
    "vestido": ("dress", "frock", "gown"),
    "saia": ("skirt",),
    "blusa": ("top",),
    "corpete": ("corset",),
    "espartilho": ("corset",),
    "conjunto": ("suit",),
    "terno": ("suit",),
    "festa": ("party", "gown"),
    "verao": ("summer",),
    # Bags
    "bolsa": ("bag", "handbag"),
    "mochila": ("backpack",),
    "couro": ("leather",),
    # Shoes
    "sapato": ("shoes", "heel", "slipper"),
    "calcado": ("shoes", "heel", "slipper"),
    "salto": ("heel",),
    "chinelo": ("slipper",),
    "pantufa": ("slipper",),
    "sandalia": ("shoes",),
    # Accessories
    "acessorio": ("sunglasses", "jewellery", "earring", "watch"),
    "oculos": ("glasses", "sunglasses"),
    "sol": ("sun",),
    "brinco": ("earring",),
    "joia": ("jewellery", "earring"),
    "bijuteria": ("jewellery", "earring"),
    "colar": ("necklace",),
    "anel": ("ring",),
    "cristal": ("crystal",),
    "relogio": ("watch",),
    "pulso": ("wrist",),
    "ouro": ("gold",),
    "dourado": ("gold", "golden"),
    "aco": ("steel",),
    "prata": ("silver",),
    "automatico": ("automatic",),
    # Colors
    "vermelho": ("red",),
    "preto": ("black",),
    "branco": ("white",),
    "azul": ("blue",),
    "verde": ("green",),
    "cinza": ("gray",),
    "marrom": ("brown",),
    "rosa": ("pink",),
    # People
    "feminino": ("women", "woman"),
    "mulher": ("women", "woman"),
    "menina": ("girl",),
}


def _lookup(word):
    """Find a word or its singular/masculine form in the dictionary."""

    candidates = [word]
    if word.endswith("oes"):
        candidates.append(word[:-3] + "ao")
    if word.endswith("es"):
        candidates.append(word[:-2])
    if word.endswith("s"):
        candidates.append(word[:-1])
    for candidate in list(candidates):
        if candidate.endswith("a"):
            candidates.append(candidate[:-1] + "o")
    for candidate in candidates:
        if candidate in PT_TO_EN:
            return PT_TO_EN[candidate]
    return ()


def expand_query(query):
    """Split a normalized query into concepts, each with its alternative terms.

    Returns a list of tuples. A product matching any term of a concept covers
    that concept; products covering more concepts rank first.
    """

    concepts = []
    for word in query.split():
        if word in STOPWORDS or len(word) < 2:
            continue
        terms = (word, *_lookup(word))
        concepts.append(tuple(dict.fromkeys(terms)))
    return concepts
