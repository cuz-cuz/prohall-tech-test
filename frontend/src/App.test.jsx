import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react'
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
    {
      id: 2,
      title: 'Beleza para sua rotina',
      image_url: 'https://example.com/banner-2.jpg',
      link_url: '/produtos',
      alt_text: 'Produtos de beleza',
      display_order: 1,
    },
  ],
  menus: [{ id: 1, name: 'Novidades', slug: 'novidades', display_order: 0 }],
  commercial_terms: {
    pix_discount_percentage: '10.00',
    max_installments: 12,
    free_shipping_minimum: '199.00',
    shipping_fee: '19.90',
  },
}

const product = {
  id: 1,
  slug: 'cafeteira',
  title: 'Cafeteira Espresso',
  description: 'Café prático para todos os dias.',
  brand: 'Mosaico',
  category: 'kitchen-accessories',
  sku: 'CAF-1',
  thumbnail_url: 'https://example.com/product-thumbnail.jpg',
  images: [
    'https://example.com/product-high-resolution.jpg',
    'https://example.com/product-alternative.jpg',
  ],
  price: '599.00',
  promotional_price: '429.00',
  effective_price: '429.00',
  is_on_sale: true,
  stock_quantity: 5,
  is_available: true,
  sales_count: 3,
  discount_percentage: '28.38',
  pix_price: '386.10',
  installment_count: 12,
  installment_value: '35.75',
  first_installment_value: '35.75',
  free_shipping: true,
  created_at: '2026-09-30T12:00:00Z',
}

const searchPayload = {
  count: 1,
  next: null,
  previous: null,
  results: [product],
}

const catalogPayload = {
  ...searchPayload,
  count: 45,
  next: 'http://localhost:8000/api/listings/?page=2',
}

function jsonResponse(data) {
  return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(data) })
}

function mockSuccessfulApi(checkoutPayload, terms) {
  fetch.mockImplementation((url) => {
    if (url.includes('/storefront/home/')) {
      return jsonResponse(terms ? { ...homePayload, commercial_terms: { ...homePayload.commercial_terms, ...terms } } : homePayload)
    }
    if (url.includes('/customer/session/')) {
      return jsonResponse({ authenticated: false, customer: null, csrf_token: 'test-csrf-token' })
    }
    if (url.includes('/listings/search/')) return jsonResponse(searchPayload)
    if (url.includes('/menus/novidades/listings/')) return jsonResponse(catalogPayload)
    if (url.includes('/listings/cafeteira/')) return jsonResponse(product)
    if (url.includes('/listings/?')) return jsonResponse(catalogPayload)
    if (url.endsWith('/listings/')) return jsonResponse(catalogPayload)
    if (url.includes('/orders/checkout/') && checkoutPayload) {
      return jsonResponse(checkoutPayload)
    }
    return Promise.resolve({ ok: false, status: 404, json: () => Promise.resolve({}) })
  })
}

const approvedOrder = {
  public_id: 'f7a59439-d694-42de-b03f-4e86ec3ebd61',
  status: 'payment_approved',
  payment_status: 'approved',
  payment_method: 'card',
  subtotal: '429.00',
  product_discount: '170.00',
  pix_discount: '0.00',
  shipping_fee: '0.00',
  shipping_saved: '19.90',
  total: '429.00',
  payment_last_four: '4242',
  customer: { name: 'Ana Lima', email: 'ana@example.com' },
  items: [],
  created_at: '2026-09-30T12:00:00Z',
}

function persistProductInCart() {
  window.localStorage.setItem(
    CART_STORAGE_KEY,
    JSON.stringify({
      version: CART_STORAGE_VERSION,
      items: [{ ...product, quantity: 1 }],
    }),
  )
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
    expect(screen.getAllByRole('link', { name: /novidades/i })).toHaveLength(1)
    fireEvent.click(screen.getByRole('button', { name: /próximo destaque/i }))
    expect(screen.getByText('2 / 2')).toBeInTheDocument()
    expect(
      await screen.findByRole('heading', {
        level: 3,
        name: /cafeteira espresso/i,
      }),
    ).toBeInTheDocument()
    expect(screen.getByText(/R\$\s*429,00/)).toBeInTheDocument()
    expect(screen.getByText(/você economiza/i)).toHaveTextContent('R$ 170,00')
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
    expect(screen.getByAltText(/cafeteira espresso/i)).toHaveAttribute(
      'src',
      'https://example.com/product-high-resolution.jpg',
    )
    const paymentOptions = screen.getByLabelText(/^formas de pagamento$/i)
    expect(within(paymentOptions).getByText('-28%')).toHaveClass('payment-details__discount')
    expect(within(paymentOptions).getByText('429')).toBeInTheDocument()
    expect(within(paymentOptions).getByText('00')).toBeInTheDocument()
    expect(within(paymentOptions).getByLabelText(/preço anterior do produto/i)).toBeInTheDocument()
    expect(within(paymentOptions).getByText(/você economiza/i)).toHaveTextContent('R$ 170,00')
    expect(within(paymentOptions).getByText(/12x de R\$ 35,75 sem juros/i)).toBeInTheDocument()
    expect(within(paymentOptions).getByText(/total parcelado R\$ 429,00/i)).toBeInTheDocument()
    expect(within(paymentOptions).getByText(/ver opções de pagamento/i)).toBeInTheDocument()
    fireEvent.click(within(paymentOptions).getByText(/ver opções de pagamento/i))
    expect(within(paymentOptions).getByRole('heading', { name: /compare as condições/i })).toBeInTheDocument()
    expect(within(paymentOptions).getByText(/10% de desconto no pix/i).closest('li')).toHaveClass('payment-option--pix')
    expect(within(paymentOptions).getByText(/cartão sem juros/i).closest('li')).toHaveClass('payment-option--card')
    expect(within(paymentOptions).getByText(/^frete grátis neste produto$/i).closest('li')).toHaveClass('payment-option--delivery')
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

  it('selects a quantity and adds a product directly from its card', async () => {
    mockSuccessfulApi()

    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>,
    )

    const heading = await screen.findByRole('heading', {
      level: 3,
      name: /cafeteira espresso/i,
    })
    const card = heading.closest('article')
    expect(within(card).getByLabelText(/desconto de 28%/i)).toHaveClass('product-badge--discount-super')
    expect(within(card).getByText(/frete grátis/i)).toHaveClass('product-badge--shipping')

    fireEvent.click(within(card).getByRole('button', { name: /aumentar quantidade/i }))
    fireEvent.click(within(card).getByRole('button', { name: /adicionar cafeteira espresso/i }))

    expect(screen.getByRole('link', { name: /carrinho com 2 itens/i })).toBeInTheDocument()
    expect(within(card).getByRole('status')).toHaveTextContent(/2 unidades adicionadas/i)
    expect(JSON.parse(window.localStorage.getItem(CART_STORAGE_KEY)).items[0].quantity).toBe(2)
  })

  it('adds the quantity selected on the product page', async () => {
    mockSuccessfulApi()

    render(
      <MemoryRouter initialEntries={['/produto/cafeteira']}>
        <App />
      </MemoryRouter>,
    )

    await screen.findByRole('heading', { level: 1, name: /cafeteira espresso/i })
    fireEvent.click(screen.getByRole('button', { name: /aumentar quantidade/i }))
    fireEvent.click(screen.getByRole('button', { name: /aumentar quantidade/i }))
    fireEvent.click(screen.getByRole('button', { name: /adicionar ao carrinho/i }))

    expect(screen.getByRole('link', { name: /carrinho com 3 itens/i })).toBeInTheDocument()
    expect(JSON.parse(window.localStorage.getItem(CART_STORAGE_KEY)).items[0].quantity).toBe(3)
  })

  it('applies ordering and free-shipping filters to the catalog request', async () => {
    mockSuccessfulApi()

    render(
      <MemoryRouter initialEntries={['/produtos']}>
        <App />
      </MemoryRouter>,
    )

    await screen.findByRole('heading', { level: 1, name: /todos os produtos/i })
    fireEvent.click(screen.getByRole('button', { name: /filtrar e ordenar/i }))
    fireEvent.click(screen.getByLabelText(/maior preço/i))
    fireEvent.click(screen.getByRole('checkbox', { name: /frete grátis/i }))
    fireEvent.click(screen.getByRole('button', { name: /aplicar filtros/i }))

    expect(await screen.findByText(/45 opções para você explorar/i)).toBeInTheDocument()
    expect(screen.getByText(/página 1 de 4/i)).toBeInTheDocument()
    expect(screen.getByText(/mostrando 1–12 de 45 produtos/i)).toBeInTheDocument()
    expect(fetch.mock.calls.some(([url]) =>
      url.includes('/listings/?ordering=price_desc') && url.includes('free_shipping=true'),
    )).toBe(true)
  })

  it('restores, updates and removes a persisted cart item', async () => {
    persistProductInCart()
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

  it('shows the order date in Brasilia time, not the browser time zone', async () => {
    persistProductInCart()
    mockSuccessfulApi()
    fetch.mockImplementation((url) => {
      if (url.includes('/customer/session/')) {
        return jsonResponse({ authenticated: true, customer: { name: 'Ana Lima', email: 'ana@example.com' }, csrf_token: 'test-csrf-token' })
      }
      if (url.includes('/orders/mine/')) return jsonResponse([approvedOrder])
      if (url.includes('/storefront/home/')) return jsonResponse(homePayload)
      return Promise.resolve({ ok: false, status: 404, json: () => Promise.resolve({}) })
    })

    render(
      <MemoryRouter initialEntries={['/meus-pedidos']}>
        <App />
      </MemoryRouter>,
    )

    // 2026-09-30T12:00:00Z is 09:00 in Sao Paulo (UTC-3), 12:00 in UTC.
    const when = await screen.findByText(/30 de set\. de 2026/)
    expect(when).toHaveTextContent('09:00')
    expect(when).not.toHaveTextContent('12:00')
  })

  it('tells the shopper how much is missing for free shipping', async () => {
    persistProductInCart()
    // The cart holds a single R$ 429,00 item, so R$ 71,00 are still missing.
    mockSuccessfulApi(undefined, { free_shipping_minimum: '500.00' })

    render(
      <MemoryRouter initialEntries={['/carrinho']}>
        <App />
      </MemoryRouter>,
    )

    expect(
      await screen.findByText(/adicione mais R\$\s*71,00 em produtos e receba frete grátis/i),
    ).toBeInTheDocument()

    fireEvent.click(
      screen.getByRole('button', { name: /aumentar quantidade de cafeteira/i }),
    )

    expect(screen.getByText(/frete grátis conquistado/i)).toBeInTheDocument()
    expect(screen.queryByText(/adicione mais/i)).toBeNull()
  })

  it('submits only the simulated final digits and clears an approved cart', async () => {
    persistProductInCart()
    mockSuccessfulApi(approvedOrder)

    render(
      <MemoryRouter initialEntries={['/checkout']}>
        <App />
      </MemoryRouter>,
    )

    fireEvent.change(screen.getByLabelText(/nome completo/i), {
      target: { value: 'Ana Lima' },
    })
    fireEvent.change(screen.getByLabelText(/e-mail/i), {
      target: { value: 'ana@example.com' },
    })
    fireEvent.click(screen.getByRole('button', { name: /preencher aprovação/i }))
    fireEvent.click(screen.getByRole('button', { name: /confirmar pedido/i }))

    expect(
      await screen.findByRole('heading', { name: /pagamento aprovado/i }),
    ).toBeInTheDocument()
    const receipt = screen.getByRole('region', { name: /resumo do pedido/i })
    expect(within(receipt).getByText('Total').closest('div')).toHaveTextContent(/R\$\s*429,00/)
    expect(screen.getByText(/cartão final 4242/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /carrinho com 0 itens/i })).toBeInTheDocument()

    const checkoutCall = fetch.mock.calls.find(([url]) => url.includes('/orders/checkout/'))
    const submitted = JSON.parse(checkoutCall[1].body)
    expect(checkoutCall[1].headers['X-CSRFToken']).toBe('test-csrf-token')
    expect(submitted.payment).toEqual({ method: 'card', card_last_four: '4242' })
    expect(submitted).not.toHaveProperty('card_number')
    expect(submitted.items).toEqual([
      { listing_id: 1, quantity: 1, expected_unit_price: '429.00' },
    ])
    expect(submitted.idempotency_key).toMatch(/^[0-9a-f-]{36}$/i)
  })

  it('opens filters in a dialog and discards edits closed without applying', async () => {
    mockSuccessfulApi()

    render(
      <MemoryRouter initialEntries={['/produtos']}>
        <App />
      </MemoryRouter>,
    )

    await screen.findByRole('heading', { level: 1, name: /todos os produtos/i })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByText(/ordenado por/i)).toHaveTextContent(/mais vendidos/i)

    fireEvent.click(screen.getByRole('button', { name: /filtrar e ordenar/i }))
    const dialog = screen.getByRole('dialog', { name: /filtros e ordenação/i })
    fireEvent.click(within(dialog).getByLabelText(/menor preço/i))
    fireEvent.keyDown(dialog, { key: 'Escape' })

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /filtrar e ordenar/i }))
    expect(within(screen.getByRole('dialog')).getByLabelText(/mais vendidos/i)).toBeChecked()
    expect(fetch.mock.calls.some(([url]) => url.includes('ordering=price_asc'))).toBe(false)
  })

  it('scrolls to the top when opening a product page', async () => {
    mockSuccessfulApi()

    render(
      <MemoryRouter initialEntries={['/produtos']}>
        <App />
      </MemoryRouter>,
    )

    await screen.findByRole('heading', { level: 1, name: /todos os produtos/i })
    window.scrollTo.mockClear()
    fireEvent.click((await screen.findAllByRole('link', { name: /cafeteira espresso/i }))[0])

    expect(await screen.findByRole('heading', { level: 1, name: /cafeteira espresso/i })).toBeInTheDocument()
    expect(window.scrollTo).toHaveBeenCalledWith(expect.objectContaining({ top: 0 }))
  })

  it('breaks the checkout summary into discounts and saved shipping', async () => {
    persistProductInCart()
    mockSuccessfulApi()

    render(
      <MemoryRouter initialEntries={['/checkout']}>
        <App />
      </MemoryRouter>,
    )

    const summary = await screen.findByRole('complementary', { name: /resumo do pedido/i })
    await within(summary).findByText('Frete economizado')
    const row = (label) => within(summary).getByText(label).closest('div')
    expect(row('Produtos')).toHaveTextContent(/R\$\s*599,00/)
    expect(row('Descontos em promoções')).toHaveTextContent(/R\$\s*170,00/)
    expect(row('Frete')).toHaveTextContent(/grátis/i)
    expect(row('Frete economizado')).toHaveTextContent(/R\$\s*19,90/)
    expect(row('Total')).toHaveTextContent(/R\$\s*429,00/)
    expect(within(summary).getByText(/você economiza/i)).toHaveTextContent(/R\$\s*189,90/)
  })

  it('charges the configured shipping fee below the free shipping minimum', async () => {
    persistProductInCart()
    mockSuccessfulApi(undefined, { free_shipping_minimum: '500.00' })

    render(
      <MemoryRouter initialEntries={['/checkout']}>
        <App />
      </MemoryRouter>,
    )

    const summary = await screen.findByRole('complementary', { name: /resumo do pedido/i })
    await within(summary).findByText(/R\$\s*448,90/)
    expect(within(summary).getByText('Frete').closest('div')).toHaveTextContent(/R\$\s*19,90/)
    expect(within(summary).queryByText('Frete economizado')).not.toBeInTheDocument()
  })

  it('simulates a paid Pix with the advertised discount', async () => {
    persistProductInCart()
    mockSuccessfulApi({
      ...approvedOrder,
      payment_method: 'pix',
      payment_last_four: '',
      pix_discount: '42.90',
      total: '386.10',
    })

    render(
      <MemoryRouter initialEntries={['/checkout']}>
        <App />
      </MemoryRouter>,
    )

    fireEvent.change(screen.getByLabelText(/nome completo/i), { target: { value: 'Ana Lima' } })
    fireEvent.change(screen.getByLabelText(/e-mail/i), { target: { value: 'ana@example.com' } })
    fireEvent.click(screen.getByRole('radio', { name: /pix/i }))

    expect(screen.queryByLabelText(/final fictício do cartão/i)).not.toBeInTheDocument()
    expect(screen.getByRole('img', { name: /qr code ilustrativo/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/pix copia e cola/i).value).toMatch(/^MOSAICO-PIX-SIMULADO-/)
    const summary = screen.getByRole('complementary', { name: /resumo do pedido/i })
    expect(within(summary).getByText(/desconto pix \(10%\)/i).closest('div')).toHaveTextContent(/R\$\s*42,90/)
    expect(within(summary).getByText('Total no Pix').closest('div')).toHaveTextContent(/R\$\s*386,10/)

    fireEvent.click(screen.getByRole('button', { name: /simular pix pago/i }))

    expect(await screen.findByRole('heading', { name: /pagamento aprovado/i })).toBeInTheDocument()
    expect(screen.getByText('Pix', { selector: 'dd' })).toBeInTheDocument()
    const checkoutCall = fetch.mock.calls.find(([url]) => url.includes('/orders/checkout/'))
    expect(JSON.parse(checkoutCall[1].body).payment).toEqual({ method: 'pix', pix_outcome: 'paid' })
  })

  it('simulates an expired Pix as a declined payment', async () => {
    persistProductInCart()
    mockSuccessfulApi({
      ...approvedOrder,
      status: 'payment_declined',
      payment_status: 'declined',
      payment_method: 'pix',
      payment_last_four: '',
      pix_discount: '42.90',
      total: '386.10',
    })

    render(
      <MemoryRouter initialEntries={['/checkout']}>
        <App />
      </MemoryRouter>,
    )

    fireEvent.change(screen.getByLabelText(/nome completo/i), { target: { value: 'Ana Lima' } })
    fireEvent.change(screen.getByLabelText(/e-mail/i), { target: { value: 'ana@example.com' } })
    fireEvent.click(screen.getByRole('radio', { name: /pix/i }))
    fireEvent.click(screen.getByRole('button', { name: /simular pix expirado/i }))

    expect(await screen.findByRole('heading', { name: /pagamento recusado/i })).toBeInTheDocument()
    const checkoutCall = fetch.mock.calls.find(([url]) => url.includes('/orders/checkout/'))
    expect(JSON.parse(checkoutCall[1].body).payment).toEqual({ method: 'pix', pix_outcome: 'expired' })
  })

  it('keeps the cart available after a declined payment', async () => {
    persistProductInCart()
    mockSuccessfulApi({
      ...approvedOrder,
      status: 'payment_declined',
      payment_status: 'declined',
      payment_last_four: '0000',
    })

    render(
      <MemoryRouter initialEntries={['/checkout']}>
        <App />
      </MemoryRouter>,
    )

    fireEvent.change(screen.getByLabelText(/nome completo/i), {
      target: { value: 'Ana Lima' },
    })
    fireEvent.change(screen.getByLabelText(/e-mail/i), {
      target: { value: 'ana@example.com' },
    })
    fireEvent.click(screen.getByRole('button', { name: /preencher recusa/i }))
    fireEvent.click(screen.getByRole('button', { name: /confirmar pedido/i }))

    expect(
      await screen.findByRole('heading', { name: /pagamento recusado/i }),
    ).toBeInTheDocument()
    expect(screen.getByText(/nenhum item foi retirado do estoque/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /carrinho com 1 item/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /tentar novamente/i })).toBeInTheDocument()
  })

  it('shows a useful checkout conflict and preserves the cart', async () => {
    persistProductInCart()
    fetch.mockImplementation((url) => {
      if (url.includes('/storefront/home/')) return jsonResponse(homePayload)
      if (url.includes('/customer/session/')) {
        return jsonResponse({ authenticated: false, customer: null, csrf_token: 'test-csrf-token' })
      }
      if (url.includes('/orders/checkout/')) {
        return Promise.resolve({
          ok: false,
          status: 409,
          json: () => Promise.resolve({ code: 'price_changed', message: 'changed' }),
        })
      }
      return jsonResponse([])
    })

    render(
      <MemoryRouter initialEntries={['/checkout']}>
        <App />
      </MemoryRouter>,
    )

    fireEvent.change(screen.getByLabelText(/nome completo/i), {
      target: { value: 'Ana Lima' },
    })
    fireEvent.change(screen.getByLabelText(/e-mail/i), {
      target: { value: 'ana@example.com' },
    })
    fireEvent.click(screen.getByRole('button', { name: /preencher aprovação/i }))
    fireEvent.click(screen.getByRole('button', { name: /confirmar pedido/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/preço de um produto mudou/i)
    expect(screen.getByRole('link', { name: /revisar carrinho agora/i })).toHaveAttribute('href', '/carrinho')
    expect(screen.getByRole('link', { name: /carrinho com 1 item/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /confirmar pedido/i })).toBeEnabled()
  })

  it('explains the available stock when checkout detects a conflict', async () => {
    persistProductInCart()
    fetch.mockImplementation((url) => {
      if (url.includes('/storefront/home/')) return jsonResponse(homePayload)
      if (url.includes('/customer/session/')) {
        return jsonResponse({ authenticated: false, customer: null, csrf_token: 'test-csrf-token' })
      }
      if (url.includes('/orders/checkout/')) {
        return Promise.resolve({
          ok: false,
          status: 409,
          json: () => Promise.resolve({
            code: 'insufficient_stock',
            message: 'unavailable',
            available: 2,
          }),
        })
      }
      return jsonResponse([])
    })

    render(
      <MemoryRouter initialEntries={['/checkout']}>
        <App />
      </MemoryRouter>,
    )

    fireEvent.change(screen.getByLabelText(/nome completo/i), {
      target: { value: 'Ana Lima' },
    })
    fireEvent.change(screen.getByLabelText(/e-mail/i), {
      target: { value: 'ana@example.com' },
    })
    fireEvent.click(screen.getByRole('button', { name: /preencher aprovação/i }))
    fireEvent.click(screen.getByRole('button', { name: /confirmar pedido/i }))

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent(/restam 2 unidades/i)
    expect(alert).toHaveFocus()
  })

  it('handles direct access to the result route without exposing stale data', () => {
    mockSuccessfulApi()

    render(
      <MemoryRouter initialEntries={['/checkout/resultado']}>
        <App />
      </MemoryRouter>,
    )

    expect(
      screen.getByRole('heading', { name: /nenhum pedido recente nesta tela/i }),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /ir para o carrinho/i })).toBeInTheDocument()
  })

  it('requests a temporary code and shows only the signed-in customer orders', async () => {
    fetch.mockImplementation((url) => {
      if (url.includes('/storefront/home/')) return jsonResponse(homePayload)
      if (url.includes('/customer/session/')) {
        return jsonResponse({ authenticated: false, customer: null, csrf_token: 'test-csrf-token' })
      }
      if (url.includes('/customer/access/request/')) {
        return jsonResponse({
          message: 'Enviamos um código para esse e-mail.',
          development_code: '123456',
        })
      }
      if (url.includes('/customer/access/verify/')) {
        return jsonResponse({ authenticated: true })
      }
      if (url.includes('/customer/logout/')) {
        return Promise.resolve({
          ok: true,
          status: 204,
          json: () => Promise.reject(new Error('204 has no body')),
        })
      }
      if (url.includes('/orders/mine/')) return jsonResponse([approvedOrder])
      return jsonResponse([])
    })

    render(
      <MemoryRouter initialEntries={['/acesso']}>
        <App />
      </MemoryRouter>,
    )

    fireEvent.change(screen.getByLabelText(/seu e-mail/i), {
      target: { value: 'ana@example.com' },
    })
    fireEvent.click(screen.getByRole('button', { name: /enviar código/i }))
    expect(await screen.findByText(/código local de demonstração/i)).toHaveTextContent('123456')
    expect(screen.getByLabelText(/código de 6 dígitos/i)).toHaveFocus()

    fireEvent.change(screen.getByLabelText(/código de 6 dígitos/i), {
      target: { value: '123456' },
    })
    fireEvent.click(screen.getByRole('button', { name: /acessar pedidos/i }))

    expect(await screen.findByRole('heading', { name: /meus pedidos/i })).toBeInTheDocument()
    expect(await screen.findByText(approvedOrder.public_id)).toBeInTheDocument()
    expect(screen.getByText(/pagamento aprovado/i)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /sair da conta/i }))
    expect(await screen.findByRole('heading', { name: /entre para ver seus pedidos/i })).toBeInTheDocument()
  })
})
