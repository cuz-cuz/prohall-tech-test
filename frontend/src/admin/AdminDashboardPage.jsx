import { useCallback, useState } from 'react'
import { Link } from 'react-router-dom'

import { useApiResource } from '../hooks/useApiResource'
import { getAdminDashboard } from '../services/api'
import { formatCurrency } from '../utils/formatters'
import { AdminIcon } from './AdminIcon'
import { AdminResourceError, AdminTableSkeleton } from './AdminResourceState'
import { formatAdminDateTime, orderStatusLabels, shortOrderId } from './adminFormatters'

const metricDefinitions = [
  ['imported_product_count', 'Produtos importados'],
  ['active_listing_count', 'Anúncios ativos'],
  ['order_count', 'Pedidos'],
  ['customer_count', 'Clientes'],
]

export function AdminDashboardPage() {
  const [renderedAt] = useState(() => new Date())
  const loadDashboard = useCallback((options) => getAdminDashboard(options), [])
  const state = useApiResource(loadDashboard)
  const data = state.data

  return (
    <div className="admin-page">
      <header className="admin-page__heading">
        <div>
          <h1>Visão geral</h1>
          <p>Acompanhe o estado operacional da Mosaico sem alterar dados da loja.</p>
        </div>
        <time dateTime={renderedAt.toISOString()}>Hoje, {new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long', timeZone: 'America/Sao_Paulo' }).format(renderedAt)}</time>
      </header>

      {state.status === 'loading' && !data ? <AdminTableSkeleton /> : null}
      {state.status === 'error' ? <AdminResourceError error={state.error} onRetry={state.retry} /> : null}

      {data ? (
        <>
          <section className="admin-metrics" aria-label="Indicadores da loja">
            {metricDefinitions.map(([key, label]) => (
              <div key={key}><span>{label}</span><strong>{data.metrics[key]}</strong></div>
            ))}
            <div className="admin-metrics__revenue"><span>Receita aprovada</span><strong>{formatCurrency(data.metrics.approved_revenue)}</strong></div>
            <div className={data.metrics.low_stock_count ? 'admin-metrics__attention' : ''}><span>Estoque baixo</span><strong>{data.metrics.low_stock_count}</strong></div>
          </section>

          <div className="admin-dashboard-grid">
            <section className="admin-panel admin-panel--orders">
              <header className="admin-panel__heading">
                <div><h2>Pedidos recentes</h2><p>As cinco movimentações mais novas.</p></div>
                <Link to="/admin/pedidos">Ver todos</Link>
              </header>
              {data.latest_orders.length ? (
                <div className="admin-table-wrap">
                  <table className="admin-table">
                    <thead><tr><th>Pedido</th><th>Cliente</th><th>Status</th><th>Total</th><th>Data</th></tr></thead>
                    <tbody>
                      {data.latest_orders.map((order) => (
                        <tr key={order.public_id}>
                          <td><code>#{shortOrderId(order.public_id)}</code><small>{order.item_count} {order.item_count === 1 ? 'item' : 'itens'}</small></td>
                          <td><strong>{order.customer_name}</strong><small>{order.customer_email}</small></td>
                          <td><span className={`admin-status admin-status--${order.payment_status}`}>{orderStatusLabels[order.status] ?? order.status}</span></td>
                          <td>{formatCurrency(order.total)}</td>
                          <td><time dateTime={order.created_at}>{formatAdminDateTime(order.created_at)}</time></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : <p className="admin-empty">Nenhum pedido registrado ainda.</p>}
            </section>

            <div className="admin-dashboard-side">
              <section className="admin-panel">
                <header className="admin-panel__heading">
                  <div><h2>Estoque baixo</h2><p>Anúncios ativos com até 5 unidades.</p></div>
                  <AdminIcon name="alert" />
                </header>
                {data.low_stock.length ? (
                  <ul className="admin-stock-list">
                    {data.low_stock.map((listing) => (
                      <li key={listing.id}>
                        <span><strong>{listing.title}</strong><small>{listing.sku ? `SKU ${listing.sku}` : 'Sem SKU'}</small></span>
                        <b>{listing.stock_quantity} un.</b>
                      </li>
                    ))}
                  </ul>
                ) : <p className="admin-empty">Nenhum anúncio ativo com estoque baixo.</p>}
              </section>

              <section className="admin-panel admin-import-status">
                <header className="admin-panel__heading">
                  <div><h2>Última importação</h2><p>Sincronização mais recente do DummyJSON.</p></div>
                  <AdminIcon name="clock" />
                </header>
                {data.last_import ? (
                  <div><strong>{formatAdminDateTime(data.last_import.completed_at)}</strong><span>{data.last_import.product_count} produtos sincronizados nessa execução</span></div>
                ) : <p className="admin-empty">Nenhuma importação registrada.</p>}
              </section>
            </div>
          </div>
        </>
      ) : null}
    </div>
  )
}
