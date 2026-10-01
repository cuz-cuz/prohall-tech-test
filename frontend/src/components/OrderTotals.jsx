import { formatCurrencyFromCents } from '../utils/formatters'

function formatPercentage(value) {
  return `${Number(value).toLocaleString('pt-BR', { maximumFractionDigits: 2 })}%`
}

/** Price breakdown shared by the cart, the checkout and the payment result. */
export function OrderTotals({ breakdown, totalLabel = 'Total' }) {
  const {
    subtotalCents,
    productDiscountCents,
    pixDiscountCents,
    pixPercentage,
    shippingFeeCents,
    shippingSavedCents,
    totalCents,
  } = breakdown
  const savingsCents = productDiscountCents + pixDiscountCents + shippingSavedCents

  return (
    <div className="order-totals">
      <dl>
        <div>
          <dt>Produtos</dt>
          <dd>{formatCurrencyFromCents(subtotalCents + productDiscountCents)}</dd>
        </div>
        {productDiscountCents > 0 ? (
          <div className="order-totals__saving">
            <dt>Descontos em promoções</dt>
            <dd>−{formatCurrencyFromCents(productDiscountCents)}</dd>
          </div>
        ) : null}
        {pixDiscountCents > 0 ? (
          <div className="order-totals__saving">
            <dt>Desconto Pix ({formatPercentage(pixPercentage)})</dt>
            <dd>−{formatCurrencyFromCents(pixDiscountCents)}</dd>
          </div>
        ) : null}
        <div>
          <dt>Frete</dt>
          <dd>{shippingFeeCents > 0 ? formatCurrencyFromCents(shippingFeeCents) : <span className="order-totals__free">Grátis</span>}</dd>
        </div>
        {shippingSavedCents > 0 ? (
          <div className="order-totals__saving">
            <dt>Frete economizado</dt>
            <dd>{formatCurrencyFromCents(shippingSavedCents)}</dd>
          </div>
        ) : null}
        <div className="order-totals__total">
          <dt>{totalLabel}</dt>
          <dd>{formatCurrencyFromCents(totalCents)}</dd>
        </div>
      </dl>
      {savingsCents > 0 ? (
        <p className="order-totals__savings-total">
          Você economiza <strong>{formatCurrencyFromCents(savingsCents)}</strong> nesta compra
        </p>
      ) : null}
    </div>
  )
}
