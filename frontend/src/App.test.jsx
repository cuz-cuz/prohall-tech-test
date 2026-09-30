import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import App from './App'

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

function jsonResponse(data) {
  return Promise.resolve({ ok: true, json: () => Promise.resolve(data) })
}

function mockSuccessfulApi() {
  fetch.mockImplementation((url) => {
    if (url.includes('/storefront/home/')) return jsonResponse(homePayload)
    if (url.includes('/menus/novidades/listings/')) return jsonResponse([product])
    if (url.includes('/listings/cafeteira/')) return jsonResponse(product)
    if (url.endsWith('/listings/')) return jsonResponse([product])
    return Promise.resolve({ ok: false })
  })
}

describe('Mosaico storefront', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    cleanup()
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
})
