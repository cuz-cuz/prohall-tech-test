const defaultBaseUrl = import.meta.env.DEV ? 'http://localhost:8000/api' : '/api'
const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL ?? defaultBaseUrl

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

export function searchListings(query, page = 1, { pageSize, ...options } = {}) {
  const params = new URLSearchParams({ q: query, page: String(page) })
  if (pageSize) params.set('page_size', String(pageSize))
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

export function getAdminSession(options) {
  return requestJson('/admin/session/', options)
}

export function loginAdmin(username, password, options = {}) {
  return requestJson('/admin/login/', {
    ...options,
    method: 'POST',
    body: { username, password },
  })
}

export function logoutAdmin(options = {}) {
  return requestJson('/admin/logout/', {
    ...options,
    method: 'POST',
    body: {},
  })
}

export function getAdminDashboard(options) {
  return requestJson('/admin/dashboard/', options)
}

function adminList(path, params = {}, options) {
  if (typeof params === 'number') return requestJson(pathWithParams(path, { page: params }), options)
  return requestJson(pathWithParams(path, params), options)
}

export function getAdminProducts(params = {}, options) {
  return adminList('/admin/products/', params, options)
}

export function getAdminOrders(params = {}, options) {
  return adminList('/admin/orders/', params, options)
}

export function getAdminCustomers(params = {}, options) {
  return adminList('/admin/customers/', params, options)
}

export function getAdminListings(params = {}, options) {
  return adminList('/admin/listings/', params, options)
}

export function createAdminListing(payload, options = {}) {
  return requestJson('/admin/listings/', { ...options, method: 'POST', body: payload })
}

export function updateAdminListing(id, payload, options = {}) {
  return requestJson(`/admin/listings/${id}/`, { ...options, method: 'PATCH', body: payload })
}

export function getAdminMenus(params = {}, options) {
  return adminList('/admin/menus/', params, options)
}

export function createAdminMenu(payload, options = {}) {
  return requestJson('/admin/menus/', { ...options, method: 'POST', body: payload })
}

export function updateAdminMenu(id, payload, options = {}) {
  return requestJson(`/admin/menus/${id}/`, { ...options, method: 'PATCH', body: payload })
}

export function getAdminBanners(params = {}, options) {
  return adminList('/admin/banners/', params, options)
}

export function createAdminBanner(payload, options = {}) {
  return requestJson('/admin/banners/', { ...options, method: 'POST', body: payload })
}

export function updateAdminBanner(id, payload, options = {}) {
  return requestJson(`/admin/banners/${id}/`, { ...options, method: 'PATCH', body: payload })
}

export async function uploadAdminImage(file, { signal } = {}) {
  const body = new FormData()
  body.append('image', file)
  const response = await fetch(`${API_BASE_URL}/admin/media/images/`, {
    signal,
    method: 'POST',
    credentials: 'include',
    headers: { 'X-CSRFToken': await ensureCsrfToken(signal) },
    body,
  })

  if (!response.ok) {
    let data = null
    try {
      data = await response.json()
    } catch {
      // Respostas sem JSON recebem a mensagem segura abaixo.
    }
    throw new ApiError(
      data?.message ?? 'Não foi possível enviar a imagem.',
      { status: response.status, data },
    )
  }
  return response.json()
}

export function runAdminProductImport(options = {}) {
  return requestJson('/admin/products/import/', { ...options, method: 'POST', body: {} })
}

export function getAdminStoreSettings(options) {
  return requestJson('/admin/settings/', options)
}

export function updateAdminStoreSettings(payload, options = {}) {
  return requestJson('/admin/settings/', { ...options, method: 'PATCH', body: payload })
}

export function getAdminDemoReset(options) {
  return requestJson('/admin/settings/demo-reset/', options)
}

export function restoreAdminDemo(confirmation, options = {}) {
  return requestJson('/admin/settings/demo-reset/', {
    ...options,
    method: 'POST',
    body: { confirmation },
  })
}
