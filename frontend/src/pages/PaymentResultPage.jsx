import { Link, useLocation, useOutletContext } from 'react-router-dom'

import { OrderTotals } from '../components/OrderTotals'
import { orderBreakdownFromOrder } from '../utils/orderBreakdown'

export function PaymentResultPage() {
  const { state } = useLocation()
  const { homeState } = useOutletContext()
  const order = state?.order

  if (!order) {
    return (
      <main
        id="conteudo-principal"
        className="page-container result-page result-page--missing"
      >
        <p className="page-context">Resultado do pagamento</p>
        <h1>Nenhum pedido recente nesta tela.</h1>
        <p>O resultado aparece aqui logo após a tentativa de pagamento.</p>
        <Link className="button button--primary" to="/carrinho">
          Ir para o carrinho
        </Link>
      </main>
    )
  }

  const approved = order.payment_status === 'approved'

  return (
    <main
      id="conteudo-principal"
      className={`page-container result-page result-page--${approved ? 'approved' : 'declined'}`}
    >
      <p className="page-context">Resultado do pagamento</p>
      <span className="result-page__mark" aria-hidden="true">
        {approved ? '✓' : '!'}
      </span>
      <h1>{approved ? 'Pagamento aprovado' : 'Pagamento recusado'}</h1>
      <p>
        {approved
          ? 'Seu pedido foi registrado e o estoque foi atualizado.'
          : 'Nenhum item foi retirado do estoque. Você pode revisar os dados e tentar novamente.'}
      </p>

      <dl className="order-receipt">
        <div>
          <dt>Pedido</dt>
          <dd>{order.public_id}</dd>
        </div>
        <div>
          <dt>Forma de pagamento</dt>
          <dd>{order.payment_method === 'pix' ? 'Pix' : `Cartão final ${order.payment_last_four}`}</dd>
        </div>
      </dl>

      <section className="result-page__totals" aria-label="Resumo do pedido">
        <OrderTotals breakdown={orderBreakdownFromOrder(order, homeState.data?.commercial_terms)} />
      </section>

      <div className="result-page__actions">
        {approved ? (
          <>
            <Link className="button button--primary" to="/meus-pedidos">
              Ver meus pedidos
            </Link>
            <Link className="button button--secondary" to="/">
              Continuar explorando
            </Link>
          </>
        ) : (
          <>
            <Link className="button button--primary" to="/checkout">
              Tentar novamente
            </Link>
            <Link className="button button--secondary" to="/carrinho">
              Revisar carrinho
            </Link>
          </>
        )}
      </div>
    </main>
  )
}
