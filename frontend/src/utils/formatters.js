const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

export function formatCurrency(value) {
  const numericValue = Number(value)
  return Number.isFinite(numericValue) ? currencyFormatter.format(numericValue) : '—'
}

export function formatCategory(value = '') {
  return value
    .split('-')
    .filter(Boolean)
    .map((word) => word.charAt(0).toLocaleUpperCase('pt-BR') + word.slice(1))
    .join(' ')
}
