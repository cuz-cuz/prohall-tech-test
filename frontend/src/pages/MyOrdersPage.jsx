import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { OrderTotals } from '../components/OrderTotals'
import { ApiError, getMyOrders, logoutCustomer } from '../services/api'
import { formatCurrency } from '../utils/formatters'
import { orderBreakdownFromOrder } from '../utils/orderBreakdown'

const orderStatusLabels = {
  payment_approved: 'Pagamento aprovado',
  payment_declined: 'Pagamento recusado',
  cancelled: 'Cancelado',
}

const saoPauloDate = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: 'America/Sao_Paulo',
})

export function MyOrdersPage() {
  const [state, setState] = useState({ status: 'loading', orders: [], error: '' })

  useEffect(() => {
    const controller = new AbortController()
    getMyOrders({ signal: controller.signal })
      .then((orders) => setState({ status: orders.length ? 'success' : 'empty', orders, error: '' }))
      .catch((error) => {
        if (error.name === 'AbortError') return
        setState({
          status: error instanceof ApiError && error.status === 401 ? 'anonymous' : 'error',
          orders: [],
          error: error.message,
        })
      })
    return () => controller.abort()
  }, [])

  async function handleLogout() {
    try {
      await logoutCustomer()
      setState({ status: 'anonymous', orders: [], error: '' })
    } catch (error) {
      setState((current) => ({ ...current, error: error.message }))
    }
  }

  if (state.status === 'loading') {
    return (
      <main id="conteudo-principal" className="page-container orders-page">
        <div className="orders-skeleton" role="status" aria-label="Carregando seus pedidos" aria-busy="true">
          <span className="skeleton-block orders-skeleton__title" />
          <span className="skeleton-block orders-skeleton__card" />
          <span className="visually-hidden">Carregando seus pedidos…</span>
        </div>
      </main>
    )
  }

  if (state.status === 'anonymous') {
    return (
      <main id="conteudo-principal" className="page-container orders-page orders-page--empty">
        <p className="page-context">Área do cliente</p>
        <h1>Entre para ver seus pedidos</h1>
        <p>Enviaremos um código temporário para o e-mail usado no checkout.</p>
        <Link className="button button--primary" to="/acesso">Acessar minha conta</Link>
      </main>
    )
  }

  if (state.status === 'error') {
    return (
      <main id="conteudo-principal" className="page-container orders-page">
        <p className="page-context">Área do cliente</p>
        <h1>Não foi possível carregar seus pedidos</h1>
        <p role="alert">{state.error}</p>
        <button className="button button--primary" onClick={() => window.location.reload()}>Tentar novamente</button>
      </main>
    )
  }

  return (
    <main id="conteudo-principal" className="page-container orders-page">
      <header className="page-heading orders-page__heading">
        <div>
          <p className="page-context">Área do cliente</p>
          <h1>Meus pedidos</h1>
          <p>Confira os pagamentos e os itens registrados em cada compra.</p>
        </div>
        <button className="button button--secondary" onClick={handleLogout}>Sair da conta</button>
      </header>

      {state.error ? <p className="form-error" role="alert">{state.error}</p> : null}

      {state.status === 'empty' ? (
        <section className="orders-empty">
          <h2>Você ainda não tem pedidos</h2>
          <p>Quando concluir uma compra, ela aparecerá nesta página.</p>
          <Link className="button button--primary" to="/">Explorar produtos</Link>
        </section>
      ) : (
        <div className="orders-list">
          {state.orders.map((order) => (
            <article className="order-card" key={order.public_id}>
              <header className="order-card__header">
                <div>
                  <p>Pedido <span>{order.public_id}</span></p>
                  <time dateTime={order.created_at}>{saoPauloDate.format(new Date(order.created_at))}</time>
                </div>
                <strong className={`order-status order-status--${order.payment_status}`}>
                  {orderStatusLabels[order.status] ?? order.status}
                </strong>
              </header>
              <ul className="order-card__items">
                {order.items.map((item) => (
                  <li key={`${order.public_id}-${item.product_external_id}-${item.sku}`}>
                    {item.image_url ? <img src={item.image_url} alt="" loading="lazy" decoding="async" width="56" height="56" /> : null}
                    <div>
                      <strong>{item.listing_title}</strong>
                      {item.sku ? <span>SKU {item.sku}</span> : null}
                      <span>{item.quantity} × {formatCurrency(item.unit_price)}</span>
                    </div>
                    <b>{formatCurrency(item.subtotal)}</b>
                  </li>
                ))}
              </ul>
              <footer className="order-card__totals">
                <span className="order-card__method">Pago com {order.payment_method === 'pix' ? 'Pix' : 'cartão'}</span>
                <OrderTotals breakdown={orderBreakdownFromOrder(order)} totalLabel="Total pago" />
              </footer>
            </article>
          ))}
        </div>
      )}
    </main>
  )
}
