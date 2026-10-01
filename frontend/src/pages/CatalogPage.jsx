import { useCallback, useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'

import { CatalogFilters } from '../components/CatalogFilters'
import { Pagination } from '../components/Pagination'
import { ProductCard } from '../components/ProductCard'
import { ProductGridSkeleton, StatePanel } from '../components/StatePanel'
import { useApiResource } from '../hooks/useApiResource'
import { getListings } from '../services/api'
import { catalogParams } from '../utils/catalogFilters'

export function CatalogPage() {
  const [searchParams] = useSearchParams()
  const serialized = searchParams.toString()
  const filters = useMemo(() => catalogParams(new URLSearchParams(serialized)), [serialized])
  const load = useCallback((options) => getListings(filters, options), [filters])
  const state = useApiResource(load)
  const result = state.data
  const products = result?.results ?? []

  return (
    <main id="conteudo-principal" className="page-container catalog-page">
      <nav className="breadcrumb" aria-label="Navegação estrutural"><Link to="/">Início</Link><span aria-hidden="true">/</span><span aria-current="page">Produtos</span></nav>
      <header className="page-heading"><p className="page-context">Catálogo</p><h1>Todos os produtos</h1><p>{result ? `${result.count} opções para você explorar.` : 'Explore a seleção feminina da Mosaico.'}</p></header>
      <CatalogFilters key={serialized || 'default'} pathname="/produtos" searchParams={searchParams} />
      {state.status === 'loading' ? <ProductGridSkeleton count={8} /> : null}
      {state.status === 'error' ? <StatePanel title="O catálogo não carregou" message="Tente novamente em alguns instantes." actionLabel="Tentar novamente" onAction={state.retry} /> : null}
      {state.status === 'success' && !products.length ? <StatePanel title="Nenhum produto nesta faixa" message="Altere ou limpe os filtros para ver outras opções." /> : null}
      {products.length ? <div className="product-grid">{products.map((product) => <ProductCard key={product.id} product={product} />)}</div> : null}
      <Pagination pathname="/produtos" searchParams={searchParams} page={filters.page} count={result?.count} />
    </main>
  )
}
