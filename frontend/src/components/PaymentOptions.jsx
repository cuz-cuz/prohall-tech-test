import {
  calculateSavingsCents,
  formatCurrency,
  formatCurrencyFromCents,
} from '../utils/formatters'

function priceParts(value) {
  const numericValue = Number(value)
  if (!Number.isFinite(numericValue)) return { whole: '—', fraction: '' }
  const [whole, fraction] = numericValue.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).split(',')
  return { whole, fraction }
}

function PaymentRows({
  pixDiscount,
  pix,
  installments,
  installment,
  installmentTotal,
  freeShipping,
  minimum,
  detailed = false,
}) {
  return (
    <ul className={detailed ? 'payment-methods' : undefined}>
      <li className="payment-option payment-option--pix">
        <span className="payment-option__mark" aria-hidden="true">Pix</span>
        <div>
          {detailed ? <small>Pagamento à vista</small> : null}
          <strong>{detailed ? pix : `${pixDiscount}% de desconto no Pix`}</strong>
          <span>{detailed ? `${pixDiscount}% de desconto no Pix` : <><b>{pix}</b> à vista</>}</span>
        </div>
      </li>
      <li className="payment-option payment-option--card">
        <span className="payment-option__mark" aria-hidden="true">{installments}x</span>
        <div>
          {detailed ? <small>Cartão sem juros</small> : null}
          <strong>{detailed ? `${installments}x de ${installment}` : 'Cartão sem juros'}</strong>
          <span>{detailed ? `Total parcelado de ${installmentTotal}` : <b>{installments}x de {installment}</b>}</span>
        </div>
      </li>
      <li className="payment-option payment-option--delivery">
        <span className="payment-option__mark" aria-hidden="true">Frete</span>
        <div>
          {detailed ? <small>Condição de entrega</small> : null}
          <strong>{freeShipping ? 'Frete grátis' : 'Frete grátis disponível'}</strong>
          <span>{freeShipping ? 'Este produto já atingiu o valor mínimo.' : `Em compras a partir de ${formatCurrency(minimum)}.`}</span>
        </div>
      </li>
    </ul>
  )
}

export function PaymentOptions({ product, amountCents, terms, compact = false }) {
  const installments = product?.installment_count ?? terms?.max_installments ?? 12
  const pixDiscount = Number(terms?.pix_discount_percentage ?? 10)
  const pix = product?.pix_price
    ? formatCurrency(product.pix_price)
    : formatCurrencyFromCents(Math.round(amountCents * (100 - pixDiscount) / 100))
  const installment = product?.installment_value
    ? formatCurrency(product.installment_value)
    : formatCurrencyFromCents(Math.round(amountCents / installments))
  const minimum = terms?.free_shipping_minimum ?? 199
  const freeShipping = product?.free_shipping
    ?? amountCents >= Math.round(Number(minimum) * 100)

  if (product) {
    const parts = priceParts(product.effective_price)
    const discount = Math.round(Number(product.discount_percentage) || 0)
    const savingsCents = product.is_on_sale
      ? calculateSavingsCents(product.price, product.effective_price)
      : null

    return (
      <section className="payment-details" aria-label="Formas de pagamento">
        <h2 className="visually-hidden">Preço e formas de pagamento</h2>
        <div className="payment-details__price-line">
          {discount > 0 ? <span className="payment-details__discount">-{discount}%</span> : null}
          <span className="payment-details__currency">R$</span>
          <strong>{parts.whole}<sup>{parts.fraction}</sup></strong>
        </div>
        {product.is_on_sale ? (
          <p className="payment-details__previous">
            De: <del>{formatCurrency(product.price)}</del>
            <span
              className="payment-details__price-info"
              aria-label="Preço anterior do produto"
              title="Preço anterior do produto"
            >
              i
            </span>
          </p>
        ) : null}
        {savingsCents ? (
          <p className="payment-details__savings">
            Você economiza <strong>{formatCurrencyFromCents(savingsCents)}</strong> nesta oferta
          </p>
        ) : null}
        <p className="payment-details__installment">Em até <strong>{installments}x de {installment} sem juros</strong></p>
        <p className="payment-details__total">(total parcelado {formatCurrency(product.effective_price)})</p>
        <details className="payment-details__disclosure">
          <summary>Ver opções de pagamento <i aria-hidden="true" /></summary>
          <div className="payment-details__expanded">
            <header>
              <span>Formas de pagamento</span>
              <h3>Compare as condições</h3>
            </header>
            <PaymentRows
              pixDiscount={pixDiscount}
              pix={pix}
              installments={installments}
              installment={installment}
              installmentTotal={formatCurrency(product.effective_price)}
              freeShipping={freeShipping}
              minimum={minimum}
              detailed
            />
            <small className="payment-details__notice">
              Valores informativos. O checkout confirma preço, estoque e condições vigentes.
            </small>
          </div>
        </details>
      </section>
    )
  }

  return (
    <section className={`payment-options ${compact ? 'payment-options--compact' : ''}`} aria-label="Formas de pagamento">
      <h2>Formas de pagamento</h2>
      <PaymentRows pixDiscount={pixDiscount} pix={pix} installments={installments} installment={installment} installmentTotal={formatCurrencyFromCents(amountCents)} freeShipping={freeShipping} minimum={minimum} />
      <small>Condições informativas da loja; o checkout confirma o total vigente.</small>
    </section>
  )
}
