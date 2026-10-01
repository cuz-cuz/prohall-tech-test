export const ORDERING_OPTIONS = [
  ['featured', 'Destaques'],
  ['best_selling', 'Mais vendidos'],
  ['least_selling', 'Menos vendidos'],
  ['price_asc', 'Menor preço'],
  ['price_desc', 'Maior preço'],
  ['newest', 'Mais recentes'],
  ['oldest', 'Mais antigos'],
  ['discount_desc', 'Maior desconto'],
]

export function catalogParams(searchParams, defaultOrdering = 'best_selling') {
  return {
    ordering: searchParams.get('ordering') || defaultOrdering,
    min_price: searchParams.get('min_price') || '',
    max_price: searchParams.get('max_price') || '',
    free_shipping: searchParams.get('free_shipping') === 'true',
    page: Math.max(1, Number.parseInt(searchParams.get('page') || '1', 10) || 1),
  }
}
