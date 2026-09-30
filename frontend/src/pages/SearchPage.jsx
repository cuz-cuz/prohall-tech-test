import { useCallback } from 'react'
import { Link, useSearchParams } from 'react-router-dom'

import { ProductCard } from '../components/ProductCard'
import { ProductGridSkeleton, StatePanel } from '../components/StatePanel'
import { useApiResource } from '../hooks/useApiResource'
import { searchListings } from '../services/api'

function normalizedPage(value) {
  const page = Number.parseInt(value, 10)
  return Number.isInteger(page) && page > 0 ? page : 1
}

function pageTarget(query, page) {
  const params = new URLSearchParams({ q: query })
  if (page > 1) params.set('page', String(page))
  return `/busca?${params.toString()}`
}

export function SearchPage() {
  const [searchParams] = useSearchParams()
  const query = searchParams.get('q')?.trim() ?? ''
  const page = normalizedPage(searchParams.get('page'))
  const canSearch = query.length >= 2
  const loadResults = useCallback(
    (options) => searchListings(query, page, options),
    [page, query],
  )
  const state = useApiResource(loadResults, { enabled: canSearch })
  const result = state.data
  const products = result?.results ?? []
  const count = result?.count ?? 0

  return (
    <main id="conteudo-principal" className="page-container search-page">
      <header className="page-heading search-heading">
        <p className="page-context">Busca</p>
        <h1>{canSearch ? `Resultados para “${query}”` : 'Encontre seu próximo produto'}</h1>
        {state.status === 'success' ? (
          <p aria-live="polite">
            {count} {count === 1 ? 'produto encontrado' : 'produtos encontrados'}
          </p>
        ) : (
          <p>Digite ao menos dois caracteres para buscar na vitrine.</p>
        )}
      </header>

      {!canSearch ? (
        <StatePanel
          title="Comece pela busca acima"
          message="Você pode procurar por nome, descrição, marca, categoria ou departamento."
        />
      ) : null}

      {canSearch && state.status === 'loading' ? <ProductGridSkeleton count={8} /> : null}

      {canSearch && state.status === 'error' ? (
        <StatePanel
          title="A busca não pôde ser concluída"
          message="Confira sua conexão e tente novamente."
          actionLabel="Tentar novamente"
          onAction={state.retry}
        />
      ) : null}

      {state.status === 'success' && !products.length ? (
        <StatePanel
          title="Nenhum produto encontrado"
          message={`Não encontramos resultados para “${query}”. Tente um termo mais curto ou outra categoria.`}
        />
      ) : null}

      {products.length ? (
        <>
          <div className="product-grid search-results">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
          {result.previous || result.next ? (
            <nav className="pagination" aria-label="Páginas dos resultados">
              {result.previous ? (
                <Link className="button button--secondary" to={pageTarget(query, page - 1)}>
                  Página anterior
                </Link>
              ) : (
                <span />
              )}
              <span aria-current="page">Página {page}</span>
              {result.next ? (
                <Link className="button button--secondary" to={pageTarget(query, page + 1)}>
                  Próxima página
                </Link>
              ) : (
                <span />
              )}
            </nav>
          ) : null}
        </>
      ) : null}
    </main>
  )
}
