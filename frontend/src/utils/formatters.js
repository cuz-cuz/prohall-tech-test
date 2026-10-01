const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

export function formatCurrency(value) {
  const numericValue = Number(value)
  return Number.isFinite(numericValue) ? currencyFormatter.format(numericValue) : '—'
}

export function currencyToCents(value) {
  const match = String(value ?? '')
    .trim()
    .match(/^(\d+)(?:\.(\d{1,2}))?$/)
  if (!match) return null

  const major = Number(match[1])
  const minor = Number((match[2] ?? '').padEnd(2, '0'))
  const cents = major * 100 + minor
  return Number.isSafeInteger(cents) ? cents : null
}

export function formatCurrencyFromCents(cents) {
  return Number.isSafeInteger(cents) ? currencyFormatter.format(cents / 100) : '—'
}

export function calculateSavingsCents(originalPrice, effectivePrice) {
  const originalCents = currencyToCents(originalPrice)
  const effectiveCents = currencyToCents(effectivePrice)

  if (originalCents === null || effectiveCents === null) return null

  const savingsCents = originalCents - effectiveCents
  return savingsCents > 0 ? savingsCents : null
}

export function formatCategory(value = '') {
  return value
    .split('-')
    .filter(Boolean)
    .map((word) => word.charAt(0).toLocaleUpperCase('pt-BR') + word.slice(1))
    .join(' ')
}
