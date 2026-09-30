const configuredBaseUrl =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api'

export const API_BASE_URL = configuredBaseUrl.replace(/\/$/, '')

export class ApiError extends Error {
  constructor(message, { status, data } = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.data = data
  }
}

async function requestJson(path, { signal, method = 'GET', body } = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    signal,
    method,
    credentials: 'include',
    ...(body === undefined
      ? {}
      : {
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        }),
  })

  if (!response.ok) {
    let data = null
    try {
      data = await response.json()
    } catch {
      // Respostas sem JSON recebem a mensagem segura abaixo.
    }
    throw new ApiError(
      data?.message ?? 'Não foi possível concluir a solicitação.',
      { status: response.status, data },
    )
  }

  return response.json()
}

export function getHealth(options) {
  return requestJson('/health/', options)
}

export function getStorefrontHome(options) {
  return requestJson('/storefront/home/', options)
}

export function getListings(options) {
  return requestJson('/listings/', options)
}

export function getMenuListings(slug, options) {
  return requestJson(`/menus/${encodeURIComponent(slug)}/listings/`, options)
}

export function getListing(slug, options) {
  return requestJson(`/listings/${encodeURIComponent(slug)}/`, options)
}

export function searchListings(query, page = 1, options) {
  const params = new URLSearchParams({ q: query, page: String(page) })
  return requestJson(`/listings/search/?${params.toString()}`, options)
}

export function checkoutOrder(payload, options = {}) {
  return requestJson('/orders/checkout/', {
    ...options,
    method: 'POST',
    body: payload,
  })
}
