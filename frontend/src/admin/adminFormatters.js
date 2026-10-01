const dateTimeFormatter = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'short',
  timeStyle: 'short',
  timeZone: 'America/Sao_Paulo',
})

export const orderStatusLabels = {
  payment_approved: 'Pagamento aprovado',
  payment_declined: 'Pagamento recusado',
  cancelled: 'Cancelado',
}

export function formatAdminDateTime(value) {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '—' : dateTimeFormatter.format(date)
}

export function shortOrderId(value = '') {
  return value.slice(0, 8).toUpperCase()
}
