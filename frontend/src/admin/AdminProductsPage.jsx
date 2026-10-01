import { useCallback, useState } from 'react'

import { useApiResource } from '../hooks/useApiResource'
import { getAdminProducts } from '../services/api'
import { formatCategory, formatCurrency } from '../utils/formatters'
import { AdminPagination } from './AdminPagination'
import { AdminResourceError, AdminTableSkeleton } from './AdminResourceState'
import { formatAdminDateTime } from './adminFormatters'

export function AdminProductsPage() {
  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState({ q: '', has_listing: '' })
  const [applied, setApplied] = useState(filters)
  const loadProducts = useCallback((options) => getAdminProducts({ ...applied, page }, options), [applied, page])
  const state = useApiResource(loadProducts)

  function changePage(nextPage) {
    setPage(nextPage)
    document.getElementById('admin-content')?.scrollTo?.({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="admin-page">
      <header className="admin-page__heading">
        <div><h1>Produtos importados</h1><p>Dados de origem sincronizados com o DummyJSON. Esta consulta não altera anúncios.</p></div>
        {state.data ? <span className="admin-count">{state.data.count} produtos</span> : null}
      </header>
      <form className="admin-filters" onSubmit={(event) => { event.preventDefault(); setPage(1); setApplied(filters) }}>
        <label><span>Buscar</span><input value={filters.q} onChange={(event) => setFilters({ ...filters, q: event.target.value })} placeholder="Título, marca, categoria ou SKU" /></label>
        <label><span>Anúncios</span><select value={filters.has_listing} onChange={(event) => setFilters({ ...filters, has_listing: event.target.value })}><option value="">Todos</option><option value="true">Com anúncio</option><option value="false">Sem anúncio</option></select></label>
        <button className="admin-button admin-button--secondary" type="submit">Aplicar filtros</button>
      </form>

      {state.status === 'loading' && !state.data ? <AdminTableSkeleton /> : null}
      {state.status === 'error' ? <AdminResourceError error={state.error} onRetry={state.retry} /> : null}

      {state.data ? (
        <section className="admin-panel admin-list-panel" aria-labelledby="products-table-title">
          <h2 id="products-table-title" className="visually-hidden">Lista de produtos importados</h2>
          {state.data.results.length ? (
            <div className="admin-table-wrap">
              <table className="admin-table" aria-label="Lista de produtos importados">
                <thead><tr><th>Produto</th><th>Categoria</th><th>Preço de origem</th><th>Estoque de origem</th><th>Anúncios</th><th>Sincronizado</th></tr></thead>
                <tbody>
                  {state.data.results.map((product) => (
                    <tr key={product.id}>
                      <td><div className="admin-product-cell">{product.image_url ? <img src={product.image_url} alt="" loading="lazy" /> : <span className="admin-product-cell__fallback" aria-hidden="true">M</span>}<span><strong>{product.title}</strong><small>{product.brand || 'Sem marca'} · ID {product.external_id}{product.sku ? ` · ${product.sku}` : ''}</small></span></div></td>
                      <td>{formatCategory(product.category)}</td>
                      <td>{formatCurrency(product.source_price)}</td>
                      <td><strong>{product.source_stock}</strong><small>{product.availability_status || 'Status não informado'}</small></td>
                      <td>{product.listing_count}</td>
                      <td><time dateTime={product.last_synced_at}>{formatAdminDateTime(product.last_synced_at)}</time></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <p className="admin-empty">Nenhum produto corresponde aos filtros. Use a área de importação para sincronizar o catálogo.</p>}
          <AdminPagination page={page} count={state.data.count} onPageChange={changePage} />
        </section>
      ) : null}
    </div>
  )
}
