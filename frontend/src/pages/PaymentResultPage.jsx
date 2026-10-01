import { Link, useLocation } from 'react-router-dom'

import { formatCurrency } from '../utils/formatters'

export function PaymentResultPage() {
  const { state } = useLocation()
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
          <dt>Total</dt>
          <dd>{formatCurrency(order.total)}</dd>
        </div>
        <div>
          <dt>Referência do pagamento</dt>
          <dd>final {order.payment_last_four}</dd>
        </div>
      </dl>

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
