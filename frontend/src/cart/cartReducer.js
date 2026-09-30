import { currencyToCents } from '../utils/formatters'

export const CART_STORAGE_KEY = 'mosaico-cart-v1'
export const CART_STORAGE_VERSION = 1

export const initialCartState = Object.freeze({ items: [] })

function normalizeText(value) {
  return typeof value === 'string' ? value.trim() : ''
}

function normalizeMoney(value) {
  const text = String(value ?? '').trim()
  return currencyToCents(text) !== null ? text : null
}

export function snapshotCartProduct(product) {
  const id = Number(product?.id)
  const stockQuantity = Number(product?.stock_quantity)
  const effectivePrice = normalizeMoney(product?.effective_price)
  const price = normalizeMoney(product?.price)

  if (
    !Number.isInteger(id) ||
    id <= 0 ||
    !normalizeText(product?.slug) ||
    !normalizeText(product?.title) ||
    !Number.isInteger(stockQuantity) ||
    stockQuantity < 0 ||
    effectivePrice === null ||
    price === null ||
    currencyToCents(effectivePrice) <= 0 ||
    currencyToCents(price) <= 0
  ) {
    return null
  }

  const promotionalPrice = product?.promotional_price
    ? normalizeMoney(product.promotional_price)
    : null

  return {
    id,
    slug: normalizeText(product.slug),
    title: normalizeText(product.title),
    thumbnail_url: normalizeText(product.thumbnail_url),
    price,
    promotional_price: promotionalPrice,
    effective_price: effectivePrice,
    is_on_sale: Boolean(product.is_on_sale && promotionalPrice),
    stock_quantity: stockQuantity,
    is_available: Boolean(product.is_available && stockQuantity > 0),
  }
}

function addItem(items, product, requestedQuantity = 1) {
  const snapshot = snapshotCartProduct(product)
  if (!snapshot?.is_available) return items

  const numericQuantity = Number(requestedQuantity)
  const quantity = Number.isFinite(numericQuantity)
    ? Math.max(1, Math.trunc(numericQuantity))
    : 1
  const existingIndex = items.findIndex((item) => item.id === snapshot.id)
  if (existingIndex === -1) {
    return [...items, { ...snapshot, quantity: Math.min(quantity, snapshot.stock_quantity) }]
  }

  const existing = items[existingIndex]
  const nextQuantity = Math.min(
    existing.quantity + quantity,
    snapshot.stock_quantity,
  )
  const nextItem = { ...existing, ...snapshot, quantity: nextQuantity }
  if (
    nextQuantity === existing.quantity &&
    snapshot.stock_quantity === existing.stock_quantity
  ) {
    return items
  }

  return items.map((item, index) => (index === existingIndex ? nextItem : item))
}

export function cartReducer(state, action) {
  switch (action.type) {
    case 'ADD_ITEM': {
      const items = addItem(state.items, action.product)
      return items === state.items ? state : { items }
    }
    case 'INCREMENT_ITEM': {
      const item = state.items.find((candidate) => candidate.id === action.id)
      if (!item || !item.is_available || item.quantity >= item.stock_quantity) {
        return state
      }
      return {
        items: state.items.map((candidate) =>
          candidate.id === action.id
            ? { ...candidate, quantity: candidate.quantity + 1 }
            : candidate,
        ),
      }
    }
    case 'DECREMENT_ITEM': {
      const item = state.items.find((candidate) => candidate.id === action.id)
      if (!item || item.quantity <= 1) return state
      return {
        items: state.items.map((candidate) =>
          candidate.id === action.id
            ? { ...candidate, quantity: candidate.quantity - 1 }
            : candidate,
        ),
      }
    }
    case 'REMOVE_ITEM':
      return { items: state.items.filter((item) => item.id !== action.id) }
    case 'CLEAR_CART':
      return state.items.length ? { items: [] } : state
    default:
      return state
  }
}

export function restoreCart(serialized) {
  try {
    const stored = JSON.parse(serialized)
    if (
      stored?.version !== CART_STORAGE_VERSION ||
      !Array.isArray(stored.items)
    ) {
      return initialCartState
    }

    const items = stored.items.reduce(
      (restored, item) => addItem(restored, item, item?.quantity),
      [],
    )
    return { items }
  } catch {
    return initialCartState
  }
}

export function cartSubtotalCents(items) {
  return items.reduce((total, item) => {
    const unitPrice = currencyToCents(item.effective_price)
    return total + (unitPrice ?? 0) * item.quantity
  }, 0)
}
