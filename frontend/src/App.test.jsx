import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import App from './App'
import { CART_STORAGE_KEY, CART_STORAGE_VERSION } from './cart/cartReducer'

const homePayload = {
  banners: [
    {
      id: 1,
      title: 'Casa com mais vida',
      image_url: 'https://example.com/banner.jpg',
      link_url: '/produto/cafeteira',
      alt_text: 'Sala iluminada com produtos para casa',
      display_order: 0,
    },
  ],
  menus: [{ id: 1, name: 'Novidades', slug: 'novidades', display_order: 0 }],
}

const product = {
  id: 1,
  slug: 'cafeteira',
  title: 'Cafeteira Espresso',
  description: 'Café prático para todos os dias.',
  brand: 'Mosaico',
  category: 'kitchen-accessories',
  sku: 'CAF-1',
  thumbnail_url: 'https://example.com/product.jpg',
  images: ['https://example.com/product.jpg'],
  price: '599.00',
  promotional_price: '429.00',
  effective_price: '429.00',
  is_on_sale: true,
  stock_quantity: 5,
  is_available: true,
}

const searchPayload = {
  count: 1,
  next: null,
  previous: null,
  results: [product],
}

function jsonResponse(data) {
  return Promise.resolve({ ok: true, json: () => Promise.resolve(data) })
}

function mockSuccessfulApi() {
  fetch.mockImplementation((url) => {
    if (url.includes('/storefront/home/')) return jsonResponse(homePayload)
    if (url.includes('/listings/search/')) return jsonResponse(searchPayload)
    if (url.includes('/menus/novidades/listings/')) return jsonResponse([product])
    if (url.includes('/listings/cafeteira/')) return jsonResponse(product)
    if (url.endsWith('/listings/')) return jsonResponse([product])
    return Promise.resolve({ ok: false })
  })
}

describe('Mosaico storefront', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
    window.localStorage.clear()
  })

  afterEach(() => {
    cleanup()
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('renders the configured home storefront', async () => {
    mockSuccessfulApi()

    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>,
    )

    expect(
      await screen.findByRole('heading', { name: /casa com mais vida/i }),
    ).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: /novidades/i })).toHaveLength(2)
    expect(
      await screen.findByRole('heading', {
        level: 3,
        name: /cafeteira espresso/i,
      }),
    ).toBeInTheDocument()
    expect(screen.getByText(/R\$\s*429,00/)).toBeInTheDocument()
  })

  it('shows a useful error state when the home API fails', async () => {
    fetch.mockImplementation((url) => {
      if (url.includes('/storefront/home/')) {
        return Promise.reject(new Error('offline'))
      }
      return jsonResponse([])
    })

    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>,
    )

    expect(
      await screen.findByRole('heading', { name: /a vitrine não carregou/i }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /tentar novamente/i }),
    ).toBeInTheDocument()
  })

  it('renders products assigned to a menu', async () => {
    mockSuccessfulApi()

    render(
      <MemoryRouter initialEntries={['/menu/novidades']}>
        <App />
      </MemoryRouter>,
    )

    expect(
      await screen.findByRole('heading', { name: 'Novidades' }),
    ).toBeInTheDocument()
    expect(
      await screen.findByRole('heading', {
        level: 3,
        name: /cafeteira espresso/i,
      }),
    ).toBeInTheDocument()
  })

  it('renders product price, stock and description on detail page', async () => {
    mockSuccessfulApi()

    render(
      <MemoryRouter initialEntries={['/produto/cafeteira']}>
        <App />
      </MemoryRouter>,
    )

    expect(
      await screen.findByRole('heading', {
        level: 1,
        name: /cafeteira espresso/i,
      }),
    ).toBeInTheDocument()
    expect(screen.getByText(/5 unidades em estoque/i)).toBeInTheDocument()
    expect(screen.getByText(/café prático para todos os dias/i)).toBeInTheDocument()
  })

  it('renders a not found page for unknown routes', async () => {
    mockSuccessfulApi()

    render(
      <MemoryRouter initialEntries={['/nao-existe']}>
        <App />
      </MemoryRouter>,
    )

    expect(
      screen.getByRole('heading', { name: /esta página não faz parte da vitrine/i }),
    ).toBeInTheDocument()
  })

  it('renders paginated search results from the URL', async () => {
    mockSuccessfulApi()

    render(
      <MemoryRouter initialEntries={['/busca?q=Cafeteira']}>
        <App />
      </MemoryRouter>,
    )

    expect(
      await screen.findByRole('heading', { name: /resultados para.*cafeteira/i }),
    ).toBeInTheDocument()
    expect(screen.getByText(/1 produto encontrado/i)).toBeInTheDocument()
    expect(
      await screen.findByRole('heading', {
        level: 3,
        name: /cafeteira espresso/i,
      }),
    ).toBeInTheDocument()
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/listings/search/?q=Cafeteira&page=1'),
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    )
  })

  it('shows an instructive empty search state', async () => {
    mockSuccessfulApi()
    fetch.mockImplementation((url) => {
      if (url.includes('/storefront/home/')) return jsonResponse(homePayload)
      if (url.includes('/listings/search/')) {
        return jsonResponse({ count: 0, next: null, previous: null, results: [] })
      }
      return jsonResponse([])
    })

    render(
      <MemoryRouter initialEntries={['/busca?q=inexistente']}>
        <App />
      </MemoryRouter>,
    )

    expect(
      await screen.findByRole('heading', { name: /nenhum produto encontrado/i }),
    ).toBeInTheDocument()
    expect(screen.getByText(/tente um termo mais curto/i)).toBeInTheDocument()
  })

  it('waits before searching while the customer types', async () => {
    vi.useFakeTimers()
    mockSuccessfulApi()

    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>,
    )

    fireEvent.change(screen.getByRole('searchbox', { name: /buscar produtos/i }), {
      target: { value: 'cafeteira' },
    })

    expect(
      fetch.mock.calls.some(([url]) => url.includes('/listings/search/')),
    ).toBe(false)

    await act(async () => {
      vi.advanceTimersByTime(350)
      await Promise.resolve()
      await Promise.resolve()
    })

    expect(
      fetch.mock.calls.some(([url]) =>
        url.includes('/listings/search/?q=cafeteira&page=1'),
      ),
    ).toBe(true)
  })

  it('adds a product to the cart and updates its header count', async () => {
    mockSuccessfulApi()

    render(
      <MemoryRouter initialEntries={['/produto/cafeteira']}>
        <App />
      </MemoryRouter>,
    )

    const addButton = await screen.findByRole('button', {
      name: /adicionar ao carrinho/i,
    })
    fireEvent.click(addButton)

    expect(
      screen.getByRole('link', { name: /carrinho com 1 item/i }),
    ).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent(/cafeteira espresso adicionado/i)
    expect(
      JSON.parse(window.localStorage.getItem(CART_STORAGE_KEY)).items[0].quantity,
    ).toBe(1)
  })

  it('restores, updates and removes a persisted cart item', async () => {
    window.localStorage.setItem(
      CART_STORAGE_KEY,
      JSON.stringify({
        version: CART_STORAGE_VERSION,
        items: [{ ...product, quantity: 1 }],
      }),
    )
    mockSuccessfulApi()

    render(
      <MemoryRouter initialEntries={['/carrinho']}>
        <App />
      </MemoryRouter>,
    )

    expect(
      screen.getByRole('heading', { name: /revise seus produtos/i }),
    ).toBeInTheDocument()
    expect(screen.getAllByText(/R\$\s*429,00/)).toHaveLength(3)

    fireEvent.click(
      screen.getByRole('button', { name: /aumentar quantidade de cafeteira/i }),
    )
    expect(screen.getByText(/2 itens selecionados/i)).toBeInTheDocument()
    expect(screen.getAllByText(/R\$\s*858,00/)).toHaveLength(2)

    fireEvent.click(screen.getByRole('button', { name: /^remover$/i }))
    expect(
      screen.getByRole('heading', { name: /seu carrinho está vazio/i }),
    ).toBeInTheDocument()
  })
})
