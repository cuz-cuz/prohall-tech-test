import {
  calculateSavingsCents,
  formatCurrency,
  formatCurrencyFromCents,
  splitInstallments,
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
  firstInstallment,
  unevenInstallments,
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
          {unevenInstallments ? <small>1ª parcela de {firstInstallment}</small> : null}
        </div>
      </li>
      <li className="payment-option payment-option--delivery">
        <span className="payment-option__mark" aria-hidden="true">Frete</span>
        <div>
          {detailed ? <small>Condição de entrega</small> : null}
          <strong>{freeShipping ? 'Frete grátis neste produto' : 'Frete grátis disponível'}</strong>
          <span>{`Compras a partir de ${formatCurrency(minimum)} têm frete grátis no pedido.`}</span>
        </div>
      </li>
    </ul>
  )
}

export function PaymentOptions({ product, amountCents, terms, compact = false }) {
  const installments = product?.installment_count ?? splitInstallments(amountCents, terms?.max_installments ?? 12).count
  const pixDiscount = Number(terms?.pix_discount_percentage ?? 10)
  const pix = product?.pix_price
    ? formatCurrency(product.pix_price)
    : formatCurrencyFromCents(Math.round(amountCents * (100 - pixDiscount) / 100))
  // The backend already split the product price; the cart repeats the split
  // locally so both screens show installments that add up to the total.
  const cartSplit = product ? null : splitInstallments(amountCents, installments)
  const installment = product
    ? formatCurrency(product.installment_value)
    : formatCurrencyFromCents(cartSplit.baseCents)
  const firstInstallment = product
    ? formatCurrency(product.first_installment_value)
    : formatCurrencyFromCents(cartSplit.firstCents)
  const unevenInstallments = firstInstallment !== installment
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
        <p className="payment-details__total">(total parcelado {formatCurrency(product.effective_price)}{unevenInstallments ? `, 1ª parcela de ${firstInstallment}` : ''})</p>
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
              firstInstallment={firstInstallment}
              unevenInstallments={unevenInstallments}
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
      <PaymentRows pixDiscount={pixDiscount} pix={pix} installments={installments} installment={installment} installmentTotal={formatCurrencyFromCents(amountCents)} firstInstallment={firstInstallment} unevenInstallments={unevenInstallments} freeShipping={freeShipping} minimum={minimum} />
      <small>Condições informativas da loja; o checkout confirma o total vigente.</small>
    </section>
  )
}
