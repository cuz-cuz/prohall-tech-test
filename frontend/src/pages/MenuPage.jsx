import { useCallback, useMemo } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'

import { CatalogFilters } from '../components/CatalogFilters'
import { Pagination } from '../components/Pagination'
import { ProductCard } from '../components/ProductCard'
import { ProductGridSkeleton, StatePanel } from '../components/StatePanel'
import { useApiResource } from '../hooks/useApiResource'
import { getMenuListings } from '../services/api'
import { formatCategory } from '../utils/formatters'
import { catalogParams } from '../utils/catalogFilters'

export function MenuPage() {
  const { slug } = useParams()
  const [searchParams] = useSearchParams()
  const serialized = searchParams.toString()
  const filters = useMemo(
    () => catalogParams(new URLSearchParams(serialized), 'featured'),
    [serialized],
  )
  const loadListings = useCallback(
    (options) => getMenuListings(slug, filters, options),
    [filters, slug],
  )
  const state = useApiResource(loadListings)
  const result = state.data
  const products = result?.results ?? []
  const title = formatCategory(slug)

  return (
    <main id="conteudo-principal" className="page-container catalog-page">
      <nav className="breadcrumb" aria-label="Navegação estrutural">
        <Link to="/">Início</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">{title}</span>
      </nav>
      <header className="page-heading">
        <p className="page-context">Departamento</p>
        <h1>{title}</h1>
        <p>Uma seleção organizada pela equipe da Mosaico.</p>
      </header>

      <CatalogFilters
        key={serialized || 'default'}
        pathname={`/menu/${slug}`}
        searchParams={searchParams}
        defaultOrdering="featured"
      />

      {state.status === 'loading' ? <ProductGridSkeleton count={8} /> : null}
      {state.status === 'error' ? (
        <StatePanel
          title="Este departamento não carregou"
          message="Ele pode estar temporariamente indisponível. Tente novamente."
          actionLabel="Tentar novamente"
          onAction={state.retry}
        />
      ) : null}
      {state.status === 'success' && !products.length ? (
        <div className="empty-state-with-action">
          <StatePanel
            title="Este menu ainda está vazio"
            message="Explore outro departamento enquanto a equipe prepara esta seleção."
          />
          <Link className="button button--secondary" to="/">
            Voltar ao início
          </Link>
        </div>
      ) : null}
      {products.length ? (
        <div className="product-grid">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : null}
      <Pagination
        pathname={`/menu/${slug}`}
        searchParams={searchParams}
        page={filters.page}
        count={result?.count}
      />
    </main>
  )
}
