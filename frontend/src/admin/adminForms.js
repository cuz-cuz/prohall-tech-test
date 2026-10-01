export function apiFieldErrors(error) {
  const data = error?.data
  if (!data || typeof data !== 'object' || Array.isArray(data)) return {}
  return Object.fromEntries(
    Object.entries(data).map(([field, value]) => [
      field,
      Array.isArray(value) ? value.join(' ') : String(value),
    ]),
  )
}

export function firstApiError(error) {
  const fields = apiFieldErrors(error)
  return fields.non_field_errors ?? fields.detail ?? error?.message ?? 'Não foi possível salvar.'
}

const STORE_TIME_ZONE = 'America/Sao_Paulo'

const storeParts = new Intl.DateTimeFormat('en-CA', {
  timeZone: STORE_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false,
})

function partsOf(date) {
  return Object.fromEntries(
    storeParts.formatToParts(date)
      .filter((part) => part.type !== 'literal')
      .map((part) => [part.type, part.value]),
  )
}

/** Offset of the store time zone at that instant, in milliseconds. */
function storeOffset(date) {
  const p = partsOf(date)
  const asUtc = Date.UTC(
    Number(p.year),
    Number(p.month) - 1,
    Number(p.day),
    Number(p.hour === '24' ? '0' : p.hour),
    Number(p.minute),
    Number(p.second),
  )
  return asUtc - Math.floor(date.getTime() / 1000) * 1000
}

/**
 * Both directions use the store time zone, never the operator's machine, so a
 * banner scheduled for 09:00 is 09:00 in Brasília wherever it was typed.
 */
export function toLocalDateTime(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const p = partsOf(date)
  return `${p.year}-${p.month}-${p.day}T${p.hour === '24' ? '00' : p.hour}:${p.minute}`
}

export function toApiDateTime(value) {
  if (!value) return null
  const guess = new Date(`${value}:00Z`)
  if (Number.isNaN(guess.getTime())) return null
  // Subtract the offset twice-checked: the first guess may land on the other
  // side of a DST change, so recompute the offset at the corrected instant.
  const once = new Date(guess.getTime() - storeOffset(guess))
  const twice = new Date(guess.getTime() - storeOffset(once))
  return twice.toISOString()
}
