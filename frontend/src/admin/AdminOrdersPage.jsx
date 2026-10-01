import { useCallback, useState } from 'react'

import { useApiResource } from '../hooks/useApiResource'
import { getAdminOrders } from '../services/api'
import { formatCurrency } from '../utils/formatters'
import { AdminPagination } from './AdminPagination'
import { AdminSelect } from './AdminSelect'
import { AdminResourceError, AdminTableSkeleton } from './AdminResourceState'
import { formatAdminDateTime, orderStatusLabels, shortOrderId } from './adminFormatters'

const statusOptions = [
  { value: '', label: 'Todos' },
  { value: 'payment_approved', label: 'Pagamento aprovado' },
  { value: 'payment_declined', label: 'Pagamento recusado' },
  { value: 'cancelled', label: 'Cancelado' },
]

export function AdminOrdersPage() {
  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState({ q: '', status: '' })
  const [applied, setApplied] = useState(filters)
  const loadOrders = useCallback((options) => getAdminOrders({ ...applied, page }, options), [applied, page])
  const state = useApiResource(loadOrders)

  return (
    <div className="admin-page">
      <header className="admin-page__heading">
        <div><h1>Pedidos</h1><p>Valores e status preservados como registro da compra.</p></div>
        {state.data ? <span className="admin-count">{state.data.count} pedidos</span> : null}
      </header>
      <form className="admin-filters" onSubmit={(event) => { event.preventDefault(); setPage(1); setApplied(filters) }}><label><span>Buscar cliente</span><input value={filters.q} onChange={(event) => setFilters({ ...filters, q: event.target.value })} placeholder="Nome ou e-mail" /></label><AdminSelect label="Status" value={filters.status} options={statusOptions} onChange={(value) => setFilters({ ...filters, status: value })} /><button className="admin-button admin-button--secondary" type="submit">Aplicar filtros</button></form>

      {state.status === 'loading' && !state.data ? <AdminTableSkeleton /> : null}
      {state.status === 'error' ? <AdminResourceError error={state.error} onRetry={state.retry} /> : null}

      {state.data ? (
        <section className="admin-panel admin-list-panel" aria-labelledby="orders-table-title">
          <h2 id="orders-table-title" className="visually-hidden">Lista de pedidos</h2>
          {state.data.results.length ? (
            <div className="admin-table-wrap">
              <table className="admin-table" aria-label="Lista de pedidos">
                <thead><tr><th>Pedido</th><th>Cliente</th><th>Status</th><th>Itens</th><th>Total</th><th>Data</th></tr></thead>
                <tbody>
                  {state.data.results.map((order) => (
                    <tr key={order.public_id}>
                      <td><code>#{shortOrderId(order.public_id)}</code><small title={order.public_id}>{order.public_id}</small></td>
                      <td><strong>{order.customer_name}</strong><small>{order.customer_email}</small></td>
                      <td><span className={`admin-status admin-status--${order.payment_status}`}>{orderStatusLabels[order.status] ?? order.status}</span></td>
                      <td>{order.item_count}</td>
                      <td><strong>{formatCurrency(order.total)}</strong></td>
                      <td><time dateTime={order.created_at}>{formatAdminDateTime(order.created_at)}</time></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <p className="admin-empty">Nenhum pedido foi registrado ainda.</p>}
          <AdminPagination page={page} count={state.data.count} onPageChange={setPage} />
        </section>
      ) : null}
    </div>
  )
}
