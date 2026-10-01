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

let csrfToken = ''

function csrfTokenFromCookie() {
  return document.cookie
    .split('; ')
    .find((cookie) => cookie.startsWith('csrftoken='))
    ?.slice('csrftoken='.length)
}

async function ensureCsrfToken(signal) {
  const availableToken = csrfToken || csrfTokenFromCookie()
  if (availableToken) return decodeURIComponent(availableToken)

  const response = await fetch(`${API_BASE_URL}/customer/session/`, {
    signal,
    credentials: 'include',
  })
  if (!response.ok) {
    throw new ApiError('Não foi possível iniciar uma sessão segura.', {
      status: response.status,
    })
  }
  const data = await response.json()
  csrfToken = data.csrf_token ?? csrfTokenFromCookie() ?? ''
  if (!csrfToken) throw new ApiError('Não foi possível iniciar uma sessão segura.')
  return decodeURIComponent(csrfToken)
}

async function requestJson(path, { signal, method = 'GET', body } = {}) {
  const headers = {}
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (!['GET', 'HEAD', 'OPTIONS'].includes(method.toUpperCase())) {
    headers['X-CSRFToken'] = await ensureCsrfToken(signal)
  }
  const response = await fetch(`${API_BASE_URL}${path}`, {
    signal,
    method,
    credentials: 'include',
    headers,
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
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

  if (response.status === 204) return null
  const data = await response.json()
  if (data?.csrf_token) csrfToken = data.csrf_token
  return data
}

export function getHealth(options) {
  return requestJson('/health/', options)
}

export function getStorefrontHome(options) {
  return requestJson('/storefront/home/', options)
}

function pathWithParams(path, params = {}) {
  const query = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== '' && value !== null && value !== undefined && value !== false) {
      query.set(key, String(value))
    }
  })
  const serialized = query.toString()
  return serialized ? `${path}?${serialized}` : path
}

export function getListings(params = {}, options = {}) {
  if ('signal' in params && !('signal' in options)) {
    return requestJson('/listings/', params)
  }
  return requestJson(pathWithParams('/listings/', params), options)
}

export function getMenuListings(slug, params = {}, options = {}) {
  if ('signal' in params && !('signal' in options)) {
    return requestJson(`/menus/${encodeURIComponent(slug)}/listings/`, params)
  }
  return requestJson(
    pathWithParams(`/menus/${encodeURIComponent(slug)}/listings/`, params),
    options,
  )
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

export function getCustomerSession(options) {
  return requestJson('/customer/session/', options)
}

export function requestCustomerAccessCode(email, options = {}) {
  return requestJson('/customer/access/request/', {
    ...options,
    method: 'POST',
    body: { email },
  })
}

export function verifyCustomerAccessCode(email, code, options = {}) {
  return requestJson('/customer/access/verify/', {
    ...options,
    method: 'POST',
    body: { email, code },
  })
}

export function logoutCustomer(options = {}) {
  return requestJson('/customer/logout/', { ...options, method: 'POST', body: {} })
}

export function getMyOrders(options) {
  return requestJson('/orders/mine/', options)
}

export function getMyOrder(publicId, options) {
  return requestJson(`/orders/mine/${encodeURIComponent(publicId)}/`, options)
}
