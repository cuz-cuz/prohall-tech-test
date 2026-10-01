import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { useCart } from '../cart/useCart'
import { checkoutOrder } from '../services/api'
import { currencyToCents, formatCurrencyFromCents } from '../utils/formatters'
import { createIdempotencyKey } from '../utils/idempotency'

function checkoutErrorMessage(error) {
  const messages = {
    price_changed:
      'O preço de um produto mudou. Volte ao carrinho e revise os valores.',
    insufficient_stock:
      'A quantidade de um produto não está mais disponível. Ajuste o carrinho.',
    listing_unavailable:
      'Um produto não está mais disponível. Remova-o do carrinho para continuar.',
    idempotency_conflict:
      'Este checkout foi alterado durante o envio. Volte ao carrinho e tente novamente.',
  }
  const code = error?.data?.code
  if (code === 'insufficient_stock' && Number.isInteger(error?.data?.available)) {
    return `A quantidade pedida não está mais disponível. Restam ${error.data.available} unidade${error.data.available === 1 ? '' : 's'} desse produto.`
  }
  if (code === 'price_changed' && error?.data?.current_price) {
    return `O preço de um produto mudou para ${formatCurrencyFromCents(currencyToCents(error.data.current_price))}. Revise o carrinho antes de continuar.`
  }
  return messages[code] ?? error?.message ?? 'Não foi possível concluir o pedido.'
}

export function CheckoutPage() {
  const { items, subtotalCents, clearCart } = useCart()
  const navigate = useNavigate()
  const [idempotencyKey] = useState(createIdempotencyKey)
  const [form, setForm] = useState({ name: '', email: '', cardLastFour: '' })
  const [status, setStatus] = useState('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [errorCode, setErrorCode] = useState('')
  const submittingRef = useRef(false)
  const errorRef = useRef(null)

  useEffect(() => {
    if (errorMessage) errorRef.current?.focus()
  }, [errorMessage])

  if (!items.length) {
    return (
      <main id="conteudo-principal" className="page-container cart-page cart-page--empty">
        <p className="page-context">Checkout</p>
        <h1>Seu carrinho precisa de produtos.</h1>
        <p>Adicione ao menos um item antes de preencher os dados do pedido.</p>
        <Link className="button button--primary" to="/">
          Explorar produtos
        </Link>
      </main>
    )
  }

  function updateField(event) {
    const { name, value } = event.target
    setForm((current) => ({
      ...current,
      [name]:
        name === 'cardLastFour' ? value.replace(/\D/g, '').slice(0, 4) : value,
    }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (submittingRef.current) return
    submittingRef.current = true
    setStatus('submitting')
    setErrorMessage('')
    setErrorCode('')

    try {
      const order = await checkoutOrder({
        customer: { name: form.name, email: form.email },
        items: items.map((item) => ({
          listing_id: item.id,
          quantity: item.quantity,
          expected_unit_price: item.effective_price,
        })),
        payment: { card_last_four: form.cardLastFour },
        idempotency_key: idempotencyKey,
      })
      if (order.payment_status === 'approved') clearCart()
      navigate('/checkout/resultado', { replace: true, state: { order } })
    } catch (error) {
      setErrorMessage(checkoutErrorMessage(error))
      setErrorCode(error?.data?.code ?? '')
      setStatus('error')
      submittingRef.current = false
    }
  }

  const isSubmitting = status === 'submitting'

  return (
    <main id="conteudo-principal" className="page-container checkout-page">
      <header className="page-heading checkout-heading">
        <p className="page-context">Checkout</p>
        <h1>Finalize seu pedido</h1>
        <p>Confirme seus dados e use a simulação de pagamento para concluir.</p>
      </header>

      <div className="checkout-layout">
        <form className="checkout-form" onSubmit={handleSubmit} aria-busy={isSubmitting}>
          <fieldset disabled={isSubmitting}>
            <legend>Seus dados</legend>
            <label className="form-field" htmlFor="checkout-name">
              <span>Nome completo</span>
              <input
                id="checkout-name"
                name="name"
                type="text"
                autoComplete="name"
                minLength="2"
                maxLength="150"
                value={form.name}
                onChange={updateField}
                required
              />
            </label>
            <label className="form-field" htmlFor="checkout-email">
              <span>E-mail</span>
              <input
                id="checkout-email"
                name="email"
                type="email"
                autoComplete="email"
                maxLength="254"
                value={form.email}
                onChange={updateField}
                required
              />
            </label>
          </fieldset>

          <fieldset disabled={isSubmitting}>
            <legend>Pagamento simulado</legend>
            <p className="checkout-form__note">
              Este ambiente não recebe dados reais de cartão. Informe somente
              quatro dígitos fictícios.
            </p>
            <label className="form-field" htmlFor="checkout-card-last-four">
              <span>Final fictício do cartão (4 dígitos)</span>
              <input
                id="checkout-card-last-four"
                name="cardLastFour"
                type="text"
                inputMode="numeric"
                autoComplete="off"
                pattern="[0-9]{4}"
                maxLength="4"
                value={form.cardLastFour}
                onChange={updateField}
                aria-describedby="payment-simulation-help"
                required
              />
            </label>
            <div id="payment-simulation-help" className="simulation-help">
              <span>Use 4242 para aprovar ou 0000 para recusar.</span>
              <div>
                <button
                  type="button"
                  onClick={() => setForm((current) => ({ ...current, cardLastFour: '4242' }))}
                >
                  Preencher aprovação
                </button>
                <button
                  type="button"
                  onClick={() => setForm((current) => ({ ...current, cardLastFour: '0000' }))}
                >
                  Preencher recusa
                </button>
              </div>
            </div>
          </fieldset>

          {errorMessage ? (
            <div className="checkout-error" role="alert" ref={errorRef} tabIndex="-1">
              <strong>Revise o pedido</strong>
              <span>{errorMessage}</span>
              {['price_changed', 'insufficient_stock', 'listing_unavailable', 'idempotency_conflict'].includes(errorCode) ? (
                <Link to="/carrinho">Revisar carrinho agora</Link>
              ) : null}
            </div>
          ) : null}

          <button
            className="button button--primary checkout-submit"
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Processando pedido…' : 'Confirmar pedido'}
          </button>
        </form>

        <aside
          className="checkout-summary"
          aria-labelledby="checkout-summary-title"
        >
          <h2 id="checkout-summary-title">Resumo do pedido</h2>
          <ul>
            {items.map((item) => (
              <li key={item.id}>
                <span>{item.quantity} × {item.title}</span>
                <strong>
                  {formatCurrencyFromCents(
                    currencyToCents(item.effective_price) * item.quantity,
                  )}
                </strong>
              </li>
            ))}
          </ul>
          <div className="checkout-summary__total">
            <span>Total</span>
            <strong>{formatCurrencyFromCents(subtotalCents)}</strong>
          </div>
          <p>O backend confirmará preços e estoque antes de registrar o pedido.</p>
          <Link to="/carrinho">Voltar ao carrinho</Link>
        </aside>
      </div>
    </main>
  )
}
