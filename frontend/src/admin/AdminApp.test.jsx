import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import App from '../App'

const staffSession = {
  authenticated: true,
  user: { username: 'admin', display_name: 'Ana Gestora' },
  csrf_token: 'admin-csrf-token',
}

const dashboardPayload = {
  metrics: {
    imported_product_count: 100,
    active_listing_count: 24,
    order_count: 8,
    customer_count: 6,
    approved_revenue: '1299.80',
    low_stock_count: 1,
  },
  latest_orders: [
    {
      public_id: 'f7a59439-d694-42de-b03f-4e86ec3ebd61',
      customer_name: 'Beatriz Costa',
      customer_email: 'beatriz@example.com',
      status: 'payment_approved',
      payment_status: 'approved',
      total: '99.90',
      item_count: 1,
      created_at: '2026-09-30T12:00:00Z',
    },
  ],
  low_stock: [
    { id: 1, title: 'Escova modeladora', sku: 'ESC-42', stock_quantity: 3, active: true },
  ],
  last_import: { completed_at: '2026-09-30T11:00:00Z', product_count: 100 },
}

const productsPayload = {
  count: 1,
  next: null,
  previous: null,
  results: [
    {
      id: 1,
      external_id: 42,
      title: 'Escova modeladora',
      brand: 'Mosaico',
      category: 'beauty',
      sku: 'ESC-42',
      image_url: 'https://example.com/escova.jpg',
      source_price: '129.90',
      source_stock: 9,
      availability_status: 'Em estoque',
      last_synced_at: '2026-09-30T11:00:00Z',
      listing_count: 1,
    },
  ],
}

const ordersPayload = {
  count: 1,
  next: null,
  previous: null,
  results: dashboardPayload.latest_orders,
}

const customersPayload = {
  count: 1,
  next: null,
  previous: null,
  results: [
    {
      id: 1,
      name: 'Beatriz Costa',
      email: 'beatriz@example.com',
      is_active: true,
      order_count: 1,
      approved_total: '99.90',
      created_at: '2026-09-29T12:00:00Z',
    },
  ],
}

const listingsPayload = {
  count: 2,
  next: null,
  previous: null,
  results: [
    { id: 1, product_id: 1, product_title: 'Escova modeladora', title: 'Escova modeladora', description: 'Descrição', slug: 'escova-modeladora', sku: 'ESC-42', image_url: 'https://example.com/escova.jpg', price: '129.90', promotional_price: '99.90', stock_quantity: 3, active: true },
    { id: 2, product_id: 1, product_title: 'Escova modeladora', title: 'Kit profissional', description: '', slug: 'kit-profissional', sku: 'ESC-42', image_url: 'https://example.com/kit.jpg', price: '199.90', promotional_price: null, stock_quantity: 8, active: true },
  ],
}

const menusPayload = {
  count: 1, next: null, previous: null,
  results: [{ id: 1, name: 'Destaques', slug: 'destaques', display_order: 0, active: true, listings: [listingsPayload.results[0]] }],
}

const bannersPayload = {
  count: 1, next: null, previous: null,
  results: [{ id: 1, title: 'Semana da beleza', image_url: 'https://example.com/banner.jpg', link_url: '/produtos', alt_text: 'Ofertas', display_order: 0, active: true, starts_at: null, ends_at: null }],
}

function jsonResponse(data, status = 200) {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(data),
  })
}

function mockAdminApi(session = staffSession) {
  fetch.mockImplementation((url, options = {}) => {
    if (url.includes('/admin/session/')) return jsonResponse(session)
    if (url.includes('/admin/login/')) return jsonResponse(staffSession)
    if (url.includes('/admin/logout/')) {
      return Promise.resolve({ ok: true, status: 204, json: () => Promise.reject(new Error('empty')) })
    }
    if (url.includes('/admin/dashboard/')) return jsonResponse(dashboardPayload)
    if (url.includes('/admin/products/import/')) return jsonResponse({ created: 3, updated: 97, total: 100, completed_at: '2026-10-01T12:00:00Z' })
    if (url.includes('/admin/listings/')) {
      if (options.method === 'POST') return jsonResponse({ ...listingsPayload.results[0], id: 3 }, 201)
      if (options.method === 'PATCH') return jsonResponse({ ...listingsPayload.results[0], ...JSON.parse(options.body) })
      return jsonResponse(listingsPayload)
    }
    if (url.includes('/admin/menus/')) {
      if (options.method === 'POST') return jsonResponse({ ...menusPayload.results[0], id: 2 }, 201)
      if (options.method === 'PATCH') return jsonResponse({ ...menusPayload.results[0], ...JSON.parse(options.body) })
      return jsonResponse(menusPayload)
    }
    if (url.includes('/admin/banners/')) {
      if (options.method === 'POST') return jsonResponse({ ...bannersPayload.results[0], id: 2 }, 201)
      if (options.method === 'PATCH') return jsonResponse({ ...bannersPayload.results[0], ...JSON.parse(options.body) })
      return jsonResponse(bannersPayload)
    }
    if (url.includes('/admin/products/')) return jsonResponse(productsPayload)
    if (url.includes('/admin/orders/')) return jsonResponse(ordersPayload)
    if (url.includes('/admin/customers/')) return jsonResponse(customersPayload)
    return jsonResponse({ message: `Rota inesperada: ${url} (${options.method ?? 'GET'})` }, 404)
  })
}

describe('Mosaico Admin', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    cleanup()
    vi.unstubAllGlobals()
  })

  it('redirects an anonymous visitor to the administrative login', async () => {
    mockAdminApi({ authenticated: false, user: null, csrf_token: 'admin-csrf-token' })

    render(<MemoryRouter initialEntries={['/admin/pedidos']}><App /></MemoryRouter>)

    expect(await screen.findByRole('heading', { name: /entrar no painel/i })).toBeInTheDocument()
    expect(screen.getByText(/acesso exclusivo para usuários ativos/i)).toBeInTheDocument()
  })

  it('logs staff in with CSRF and opens the requested protected page', async () => {
    mockAdminApi({ authenticated: false, user: null, csrf_token: 'admin-csrf-token' })

    render(<MemoryRouter initialEntries={['/admin']}><App /></MemoryRouter>)

    const username = await screen.findByLabelText(/usuário/i)
    fireEvent.change(username, { target: { value: 'admin' } })
    fireEvent.change(screen.getByLabelText(/senha/i), { target: { value: 'segredo-local' } })
    fireEvent.click(screen.getByRole('button', { name: /^entrar$/i }))

    expect(await screen.findByRole('heading', { name: /visão geral/i })).toBeInTheDocument()
    const loginCall = fetch.mock.calls.find(([url]) => url.includes('/admin/login/'))
    expect(loginCall[1].headers['X-CSRFToken']).toBe('admin-csrf-token')
    expect(JSON.parse(loginCall[1].body)).toEqual({ username: 'admin', password: 'segredo-local' })
  })

  it('renders the operational dashboard without exposing write actions', async () => {
    mockAdminApi()

    render(<MemoryRouter initialEntries={['/admin']}><App /></MemoryRouter>)

    expect(await screen.findByRole('heading', { name: /visão geral/i })).toBeInTheDocument()
    expect(await screen.findByText(/R\$\s*1\.299,80/)).toBeInTheDocument()
    expect(screen.getByText('Escova modeladora')).toBeInTheDocument()
    expect(screen.getByText(/100 produtos sincronizados/i)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /editar|salvar|excluir/i })).not.toBeInTheDocument()
  })

  it('navigates across the read-only product, order and customer lists', async () => {
    mockAdminApi()

    render(<MemoryRouter initialEntries={['/admin/produtos']}><App /></MemoryRouter>)

    const productsTable = await screen.findByRole('table', { name: /lista de produtos importados/i })
    expect(within(productsTable).getByText('Escova modeladora')).toBeInTheDocument()
    expect(within(productsTable).getByText(/R\$\s*129,90/)).toBeInTheDocument()
    expect(productsTable.querySelector('img')).toHaveAttribute('src', 'https://example.com/escova.jpg')

    fireEvent.click(screen.getByRole('link', { name: /pedidos/i }))
    const ordersTable = await screen.findByRole('table', { name: /lista de pedidos/i })
    expect(within(ordersTable).getByText('Beatriz Costa')).toBeInTheDocument()
    expect(within(ordersTable).getByText(/pagamento aprovado/i)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('link', { name: /clientes/i }))
    const customersTable = await screen.findByRole('table', { name: /lista de clientes/i })
    expect(within(customersTable).getByText('beatriz@example.com')).toBeInTheDocument()
    expect(within(customersTable).getByText('Ativo')).toBeInTheDocument()
  })

  it('ends the administrative session from the layout', async () => {
    mockAdminApi()
    render(<MemoryRouter initialEntries={['/admin']}><App /></MemoryRouter>)

    await screen.findByRole('heading', { name: /visão geral/i })
    fireEvent.click(screen.getAllByRole('button', { name: /sair do painel/i })[0])

    expect(await screen.findByRole('heading', { name: /entrar no painel/i })).toBeInTheDocument()
    await waitFor(() => expect(fetch.mock.calls.some(([url]) => url.includes('/admin/logout/'))).toBe(true))
  })

  it('creates a commercial listing with decimal values and CSRF', async () => {
    mockAdminApi()
    render(<MemoryRouter initialEntries={['/admin/anuncios']}><App /></MemoryRouter>)

    const listingsTable = await screen.findByRole('table', { name: /lista de anúncios/i })
    expect(within(listingsTable).getByRole('button', { name: /editar escova modeladora/i }).querySelector('svg')).not.toBeNull()
    fireEvent.click(screen.getByRole('button', { name: /novo anúncio/i }))
    const editor = await screen.findByRole('dialog', { name: /novo anúncio/i })
    fireEvent.click(within(editor).getByRole('combobox', { name: /produto de origem/i }))
    fireEvent.click(within(editor).getByRole('option', { name: /escova modeladora/i }))
    fireEvent.change(screen.getByLabelText(/título comercial/i), { target: { value: 'Oferta especial' } })
    fireEvent.change(screen.getByLabelText(/preço normal/i), { target: { value: '150.00' } })
    fireEvent.change(screen.getByLabelText(/preço promocional/i), { target: { value: '120.00' } })
    fireEvent.change(screen.getByLabelText(/estoque disponível/i), { target: { value: '6' } })
    fireEvent.click(screen.getByRole('button', { name: /salvar anúncio/i }))

    await screen.findByText(/anúncio criado/i)
    const call = fetch.mock.calls.find(([url, options]) => url.endsWith('/admin/listings/') && options.method === 'POST')
    expect(call[1].headers['X-CSRFToken']).toBe('admin-csrf-token')
    expect(JSON.parse(call[1].body)).toMatchObject({ product_id: 1, title: 'Oferta especial', price: '150.00', promotional_price: '120.00', stock_quantity: 6 })
  })

  it('selects and reorders listings while creating a menu', async () => {
    mockAdminApi()
    render(<MemoryRouter initialEntries={['/admin/menus']}><App /></MemoryRouter>)

    await screen.findByRole('table', { name: /lista de menus/i })
    fireEvent.click(screen.getByRole('button', { name: /novo menu/i }))
    fireEvent.change(screen.getByLabelText(/^nome$/i), { target: { value: 'Ofertas' } })
    fireEvent.click(screen.getByRole('checkbox', { name: /escova modeladora/i }))
    fireEvent.click(screen.getByRole('checkbox', { name: /kit profissional/i }))
    fireEvent.click(screen.getByRole('button', { name: /subir kit profissional/i }))
    fireEvent.click(screen.getByRole('button', { name: /salvar menu/i }))

    await screen.findByText(/menu criado/i)
    const call = fetch.mock.calls.find(([url, options]) => url.endsWith('/admin/menus/') && options.method === 'POST')
    expect(JSON.parse(call[1].body).listing_ids).toEqual([2, 1])
  })

  it('requires confirmation and displays the product import summary', async () => {
    mockAdminApi()
    render(<MemoryRouter initialEntries={['/admin/importacao']}><App /></MemoryRouter>)

    fireEvent.click(await screen.findByRole('button', { name: /reimportar produtos/i }))
    expect(screen.getByText(/executar a importação agora/i)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /sim, importar/i }))

    expect(await screen.findByText('100')).toBeInTheDocument()
    expect(screen.getByText(/produtos processados/i)).toBeInTheDocument()
    expect(fetch.mock.calls.some(([url, options]) => url.includes('/admin/products/import/') && options.method === 'POST')).toBe(true)
  })

  it('creates a scheduled banner with its commercial fields', async () => {
    mockAdminApi()
    render(<MemoryRouter initialEntries={['/admin/banners']}><App /></MemoryRouter>)

    await screen.findByRole('table', { name: /lista de banners/i })
    fireEvent.click(screen.getByRole('button', { name: /novo banner/i }))
    fireEvent.change(screen.getByLabelText(/título interno/i), { target: { value: 'Lançamentos' } })
    fireEvent.change(screen.getByLabelText(/url da imagem/i), { target: { value: 'https://example.com/lancamentos.jpg' } })
    fireEvent.change(screen.getByLabelText(/link de destino/i), { target: { value: '/produtos' } })
    fireEvent.change(screen.getByLabelText(/início/i), { target: { value: '2026-10-02T09:00' } })
    fireEvent.change(screen.getByLabelText(/fim/i), { target: { value: '2026-10-03T18:00' } })
    fireEvent.click(screen.getByRole('button', { name: /salvar banner/i }))

    await screen.findByText(/banner criado/i)
    const call = fetch.mock.calls.find(([url, options]) => url.endsWith('/admin/banners/') && options.method === 'POST')
    const payload = JSON.parse(call[1].body)
    expect(payload).toMatchObject({ title: 'Lançamentos', image_url: 'https://example.com/lancamentos.jpg', link_url: '/produtos' })
    expect(payload.starts_at).toContain('2026-10-02')
    expect(payload.ends_at).toContain('2026-10-03')
  })

  it('filters with the keyboard through the custom dropdown', async () => {
    mockAdminApi()
    render(<MemoryRouter initialEntries={['/admin/anuncios']}><App /></MemoryRouter>)

    await screen.findByRole('table', { name: /lista de anúncios/i })
    const trigger = screen.getByRole('combobox', { name: /status/i })
    expect(trigger).toHaveAttribute('aria-expanded', 'false')

    // Opening lands on the current value, so two more steps reach "Inativos".
    fireEvent.keyDown(trigger, { key: 'ArrowDown' })
    expect(trigger).toHaveAttribute('aria-expanded', 'true')
    fireEvent.keyDown(trigger, { key: 'ArrowDown' })
    fireEvent.keyDown(trigger, { key: 'ArrowDown' })
    fireEvent.keyDown(trigger, { key: 'Enter' })

    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    expect(trigger).toHaveTextContent('Inativos')

    fireEvent.click(screen.getByRole('button', { name: /aplicar filtros/i }))
    await waitFor(() => expect(
      fetch.mock.calls.some(([url]) => url.includes('/admin/listings/') && url.includes('active=false')),
    ).toBe(true))
  })

  it('closes the dropdown on Escape without changing the value', async () => {
    mockAdminApi()
    render(<MemoryRouter initialEntries={['/admin/anuncios']}><App /></MemoryRouter>)

    await screen.findByRole('table', { name: /lista de anúncios/i })
    const trigger = screen.getByRole('combobox', { name: /status/i })

    fireEvent.keyDown(trigger, { key: 'ArrowDown' })
    fireEvent.keyDown(trigger, { key: 'ArrowDown' })
    fireEvent.keyDown(trigger, { key: 'Escape' })

    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    expect(trigger).toHaveTextContent('Todos')
  })

  it('asks for confirmation in a modal before deactivating a listing', async () => {
    mockAdminApi()
    render(<MemoryRouter initialEntries={['/admin/anuncios']}><App /></MemoryRouter>)

    const table = await screen.findByRole('table', { name: /lista de anúncios/i })
    fireEvent.click(within(table).getByRole('button', { name: /desativar escova modeladora/i }))

    const dialog = await screen.findByRole('dialog', { name: /desativar anúncio/i })
    expect(dialog).toHaveAttribute('aria-modal', 'true')

    // Closing must not have sent anything.
    fireEvent.click(within(dialog).getByRole('button', { name: /cancelar/i }))
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    expect(fetch.mock.calls.some(([, options]) => options?.method === 'PATCH')).toBe(false)

    fireEvent.click(within(table).getByRole('button', { name: /desativar escova modeladora/i }))
    const reopened = await screen.findByRole('dialog', { name: /desativar anúncio/i })
    fireEvent.click(within(reopened).getByRole('button', { name: /desativar anúncio/i }))

    await screen.findByText(/anúncio desativado/i)
    const call = fetch.mock.calls.find(([url, options]) => url.includes('/admin/listings/') && options?.method === 'PATCH')
    expect(JSON.parse(call[1].body)).toEqual({ active: false })
  })
})
