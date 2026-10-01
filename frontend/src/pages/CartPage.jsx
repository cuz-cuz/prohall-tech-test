import { Link, useOutletContext } from 'react-router-dom'

import { useCart } from '../cart/useCart'
import { PaymentOptions } from '../components/PaymentOptions'
import { ShareButton } from '../components/ShareButton'
import { SmartImage } from '../components/SmartImage'
import {
  currencyToCents,
  formatCurrency,
  formatCurrencyFromCents,
} from '../utils/formatters'

function CartItem({ item }) {
  const { decrementItem, incrementItem, removeItem } = useCart()
  const atStockLimit = item.quantity >= item.stock_quantity

  return (
    <li className="cart-item">
      <Link className="cart-item__image" to={`/produto/${item.slug}`}>
        <SmartImage src={item.thumbnail_url} alt={item.title} sizes="7rem" />
      </Link>
      <div className="cart-item__content">
        <div>
          <h2>
            <Link to={`/produto/${item.slug}`}>{item.title}</Link>
          </h2>
          <p>
            {item.is_on_sale ? <del>{formatCurrency(item.price)}</del> : null}
            <strong>{formatCurrency(item.effective_price)}</strong> por unidade
          </p>
        </div>
        <div className="cart-item__actions">
          <div className="quantity-control" role="group" aria-label={`Quantidade de ${item.title}`}>
            <button
              type="button"
              onClick={() => decrementItem(item.id)}
              disabled={item.quantity <= 1}
              aria-label={`Diminuir quantidade de ${item.title}`}
            >
              −
            </button>
            <span aria-live="polite" aria-atomic="true">{item.quantity}</span>
            <button
              type="button"
              onClick={() => incrementItem(item.id)}
              disabled={atStockLimit || !item.is_available}
              aria-label={`Aumentar quantidade de ${item.title}`}
            >
              +
            </button>
          </div>
          <button
            className="cart-item__remove"
            type="button"
            onClick={() => removeItem(item.id)}
          >
            Remover
          </button>
        </div>
        {atStockLimit ? (
          <small>Quantidade máxima disponível no momento.</small>
        ) : <small>{item.stock_quantity} unidades disponíveis em estoque.</small>}
        {item.stock_quantity <= 5 ? <small className="stock-warning">Últimas unidades deste produto.</small> : null}
      </div>
      <strong className="cart-item__total">
        {formatCurrencyFromCents(
          (currencyToCents(item.effective_price) ?? 0) * item.quantity,
        )}
      </strong>
    </li>
  )
}

function FreeShippingNotice({ subtotalCents, minimum }) {
  const minimumCents = currencyToCents(minimum)
  if (minimumCents === null) return null

  const missingCents = minimumCents - subtotalCents
  if (missingCents <= 0) {
    return (
      <p className="cart-shipping cart-shipping--reached" role="status">
        <strong>Frete grátis conquistado!</strong>
        <span>Seu carrinho atingiu {formatCurrencyFromCents(minimumCents)}.</span>
      </p>
    )
  }

  return (
    <p className="cart-shipping" role="status">
      <strong>Adicione mais {formatCurrencyFromCents(missingCents)} em produtos e receba frete grátis.</strong>
      <span>O frete fica grátis em compras a partir de {formatCurrencyFromCents(minimumCents)}.</span>
    </p>
  )
}

export function CartPage() {
  const { items, totalItems, subtotalCents, clearCart } = useCart()
  const { homeState } = useOutletContext()
  const terms = homeState.data?.commercial_terms

  if (!items.length) {
    return (
      <main id="conteudo-principal" className="page-container cart-page cart-page--empty">
        <p className="page-context">Carrinho</p>
        <h1>Seu carrinho está vazio.</h1>
        <p>Explore a vitrine e adicione os produtos que deseja comparar.</p>
        <Link className="button button--primary" to="/">
          Explorar produtos
        </Link>
      </main>
    )
  }

  return (
    <main id="conteudo-principal" className="page-container cart-page">
      <header className="page-heading cart-heading">
        <p className="page-context">Carrinho</p>
        <h1>Revise seus produtos</h1>
        <p>
          {totalItems} {totalItems === 1 ? 'item selecionado' : 'itens selecionados'}
        </p>
      </header>

      <div className="cart-layout">
        <section aria-labelledby="cart-products-title">
          <div className="cart-section-heading">
            <h2 id="cart-products-title">Produtos</h2>
            <button type="button" onClick={clearCart}>Limpar carrinho</button>
          </div>
          <ul className="cart-list">
            {items.map((item) => <CartItem item={item} key={item.id} />)}
          </ul>
        </section>

        <aside className="cart-summary" aria-labelledby="cart-summary-title">
          <h2 id="cart-summary-title">Resumo estimado</h2>
          <div>
            <span>Subtotal</span>
            <strong>{formatCurrencyFromCents(subtotalCents)}</strong>
          </div>
          <FreeShippingNotice subtotalCents={subtotalCents} minimum={terms?.free_shipping_minimum} />
          <p>
            Preços, disponibilidade e estoque serão confirmados antes do pagamento.
          </p>
          <PaymentOptions amountCents={subtotalCents} terms={terms} compact />
          <Link className="button button--primary" to="/checkout">
            Ir para o checkout
          </Link>
          <ShareButton
            title="Minha seleção na Mosaico"
            text={`Separei ${totalItems} ${totalItems === 1 ? 'item' : 'itens'} na Mosaico.`}
            label="Compartilhar seleção"
          />
          <small>O compartilhamento envia esta página e um resumo; cada pessoa monta o próprio carrinho.</small>
          <Link className="button button--secondary" to="/">
            Continuar explorando
          </Link>
        </aside>
      </div>
    </main>
  )
}
