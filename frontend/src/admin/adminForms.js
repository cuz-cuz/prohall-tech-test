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

export function toLocalDateTime(value) {
  if (!value) return ''
  const date = new Date(value)
  const offset = date.getTimezoneOffset() * 60_000
  return new Date(date.getTime() - offset).toISOString().slice(0, 16)
}

export function toApiDateTime(value) {
  return value ? new Date(value).toISOString() : null
}
