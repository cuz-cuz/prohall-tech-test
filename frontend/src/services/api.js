const configuredBaseUrl =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api'

export const API_BASE_URL = configuredBaseUrl.replace(/\/$/, '')

async function requestJson(path, { signal } = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, { signal })

  if (!response.ok) {
    throw new Error('Não foi possível carregar os dados da loja.')
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
