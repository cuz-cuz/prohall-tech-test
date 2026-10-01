import { currencyToCents } from './formatters'

const DEFAULT_SHIPPING_FEE = '19.90'
const DEFAULT_FREE_SHIPPING_MINIMUM = '199.00'
const DEFAULT_PIX_DISCOUNT = '10.00'

/**
 * Mirrors apps.orders.services.order_pricing so the cart and the checkout show
 * the same values the server will charge. The server stays the authority.
 */
export function calculateOrderBreakdown(items, { method = null, terms } = {}) {
  let subtotalCents = 0
  let productDiscountCents = 0
  for (const item of items) {
    const unitCents = currencyToCents(item.effective_price) ?? 0
    const listCents = currencyToCents(item.price) ?? unitCents
    subtotalCents += unitCents * item.quantity
    productDiscountCents += Math.max(listCents - unitCents, 0) * item.quantity
  }

  const pixPercentage = Number(terms?.pix_discount_percentage ?? DEFAULT_PIX_DISCOUNT)
  const pixDiscountCents = method === 'pix' ? Math.round(subtotalCents * pixPercentage / 100) : 0
  const feeCents = currencyToCents(terms?.shipping_fee ?? DEFAULT_SHIPPING_FEE) ?? 0
  const minimumCents = currencyToCents(terms?.free_shipping_minimum ?? DEFAULT_FREE_SHIPPING_MINIMUM) ?? 0
  const freeShipping = subtotalCents >= minimumCents

  return {
    subtotalCents,
    productDiscountCents,
    pixDiscountCents,
    pixPercentage,
    shippingFeeCents: freeShipping ? 0 : feeCents,
    shippingSavedCents: freeShipping ? feeCents : 0,
    totalCents: subtotalCents - pixDiscountCents + (freeShipping ? 0 : feeCents),
  }
}

/** Same shape, read from the values the server stored on an order. */
export function orderBreakdownFromOrder(order, terms) {
  const cents = (value) => currencyToCents(value) ?? 0
  return {
    subtotalCents: cents(order.subtotal),
    productDiscountCents: cents(order.product_discount),
    pixDiscountCents: cents(order.pix_discount),
    pixPercentage: Number(terms?.pix_discount_percentage ?? DEFAULT_PIX_DISCOUNT),
    shippingFeeCents: cents(order.shipping_fee),
    shippingSavedCents: cents(order.shipping_saved),
    totalCents: cents(order.total),
  }
}
