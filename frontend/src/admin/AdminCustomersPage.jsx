import { useCallback, useState } from 'react'

import { useApiResource } from '../hooks/useApiResource'
import { getAdminCustomers } from '../services/api'
import { formatCurrency } from '../utils/formatters'
import { AdminPagination } from './AdminPagination'
import { AdminSelect } from './AdminSelect'
import { AdminResourceError, AdminTableSkeleton } from './AdminResourceState'
import { formatAdminDateTime } from './adminFormatters'

const statusOptions = [{ value: '', label: 'Todos' }, { value: 'true', label: 'Ativos' }, { value: 'false', label: 'Inativos' }]

export function AdminCustomersPage() {
  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState({ q: '', active: '' })
  const [applied, setApplied] = useState(filters)
  const loadCustomers = useCallback((options) => getAdminCustomers({ ...applied, page }, options), [applied, page])
  const state = useApiResource(loadCustomers)

  return (
    <div className="admin-page">
      <header className="admin-page__heading">
        <div><h1>Clientes</h1><p>Contas vinculadas ao checkout e ao histórico de pedidos.</p></div>
        {state.data ? <span className="admin-count">{state.data.count} clientes</span> : null}
      </header>
      <form className="admin-filters" onSubmit={(event) => { event.preventDefault(); setPage(1); setApplied(filters) }}><label><span>Buscar</span><input value={filters.q} onChange={(event) => setFilters({ ...filters, q: event.target.value })} placeholder="Nome ou e-mail" /></label><AdminSelect label="Status" value={filters.active} options={statusOptions} onChange={(value) => setFilters({ ...filters, active: value })} /><button className="admin-button admin-button--secondary" type="submit">Aplicar filtros</button></form>

      {state.status === 'loading' && !state.data ? <AdminTableSkeleton /> : null}
      {state.status === 'error' ? <AdminResourceError error={state.error} onRetry={state.retry} /> : null}

      {state.data ? (
        <section className="admin-panel admin-list-panel" aria-labelledby="customers-table-title">
          <h2 id="customers-table-title" className="visually-hidden">Lista de clientes</h2>
          {state.data.results.length ? (
            <div className="admin-table-wrap">
              <table className="admin-table" aria-label="Lista de clientes">
                <thead><tr><th>Cliente</th><th>Status</th><th>Pedidos</th><th>Total aprovado</th><th>Desde</th></tr></thead>
                <tbody>
                  {state.data.results.map((customer) => (
                    <tr key={customer.id}>
                      <td><strong>{customer.name}</strong><small>{customer.email}</small></td>
                      <td><span className={`admin-status admin-status--${customer.is_active ? 'active' : 'inactive'}`}>{customer.is_active ? 'Ativo' : 'Inativo'}</span></td>
                      <td>{customer.order_count}</td>
                      <td><strong>{formatCurrency(customer.approved_total)}</strong></td>
                      <td><time dateTime={customer.created_at}>{formatAdminDateTime(customer.created_at)}</time></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <p className="admin-empty">Nenhum cliente foi criado ainda.</p>}
          <AdminPagination page={page} count={state.data.count} onPageChange={setPage} />
        </section>
      ) : null}
    </div>
  )
}
