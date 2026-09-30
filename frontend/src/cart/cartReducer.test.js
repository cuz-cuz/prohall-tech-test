import { describe, expect, it } from 'vitest'

import {
  CART_STORAGE_VERSION,
  cartReducer,
  cartSubtotalCents,
  initialCartState,
  restoreCart,
} from './cartReducer'

const product = {
  id: 1,
  slug: 'mascara-capilar',
  title: 'Máscara Capilar',
  thumbnail_url: 'https://example.com/product.jpg',
  price: '10.90',
  promotional_price: '9.90',
  effective_price: '9.90',
  is_on_sale: true,
  stock_quantity: 2,
  is_available: true,
}

describe('cartReducer', () => {
  it('adds, deduplicates and caps an item at known stock', () => {
    const withOne = cartReducer(initialCartState, {
      type: 'ADD_ITEM',
      product,
    })
    const withTwo = cartReducer(withOne, { type: 'ADD_ITEM', product })
    const capped = cartReducer(withTwo, { type: 'ADD_ITEM', product })

    expect(withTwo.items).toHaveLength(1)
    expect(withTwo.items[0].quantity).toBe(2)
    expect(capped).toBe(withTwo)
  })

  it('increments, decrements, removes and clears items', () => {
    const added = cartReducer(initialCartState, { type: 'ADD_ITEM', product })
    const incremented = cartReducer(added, { type: 'INCREMENT_ITEM', id: product.id })
    const decremented = cartReducer(incremented, { type: 'DECREMENT_ITEM', id: product.id })
    const removed = cartReducer(decremented, { type: 'REMOVE_ITEM', id: product.id })

    expect(incremented.items[0].quantity).toBe(2)
    expect(decremented.items[0].quantity).toBe(1)
    expect(removed.items).toEqual([])
    expect(cartReducer(incremented, { type: 'CLEAR_CART' }).items).toEqual([])
  })

  it('ignores unavailable and malformed products', () => {
    const unavailable = { ...product, is_available: false }
    const malformed = { ...product, effective_price: 'valor inválido' }
    const free = { ...product, effective_price: '0.00' }

    expect(
      cartReducer(initialCartState, { type: 'ADD_ITEM', product: unavailable }),
    ).toBe(initialCartState)
    expect(
      cartReducer(initialCartState, { type: 'ADD_ITEM', product: malformed }),
    ).toBe(initialCartState)
    expect(
      cartReducer(initialCartState, { type: 'ADD_ITEM', product: free }),
    ).toBe(initialCartState)
  })

  it('restores valid persisted data and rejects invalid payloads', () => {
    const serialized = JSON.stringify({
      version: CART_STORAGE_VERSION,
      items: [{ ...product, quantity: 9 }],
    })

    expect(restoreCart(serialized).items[0].quantity).toBe(2)
    expect(restoreCart('{invalid').items).toEqual([])
    expect(restoreCart(JSON.stringify({ version: 99, items: [] })).items).toEqual([])
  })

  it('calculates subtotal using integer cents', () => {
    const items = [
      { ...product, effective_price: '0.10', quantity: 3 },
      { ...product, id: 2, effective_price: '0.20', quantity: 1 },
    ]

    expect(cartSubtotalCents(items)).toBe(50)
  })
})
