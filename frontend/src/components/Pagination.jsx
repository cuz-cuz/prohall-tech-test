import { Link } from 'react-router-dom'

function pageTarget(pathname, searchParams, page) {
  const params = new URLSearchParams(searchParams)
  if (page > 1) params.set('page', String(page))
  else params.delete('page')
  const query = params.toString()
  return query ? `${pathname}?${query}` : pathname
}

function visiblePages(currentPage, totalPages) {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, index) => index + 1)

  const candidates = new Set([1, totalPages, currentPage - 1, currentPage, currentPage + 1])
  const pages = [...candidates]
    .filter((page) => page >= 1 && page <= totalPages)
    .sort((first, second) => first - second)
  const items = []

  pages.forEach((page, index) => {
    const previousPage = pages[index - 1]
    if (previousPage && page - previousPage === 2) items.push(previousPage + 1)
    else if (previousPage && page - previousPage > 2) items.push(`ellipsis-${previousPage}`)
    items.push(page)
  })
  return items
}

export function Pagination({ pathname, searchParams, page, count = 0 }) {
  if (count < 1) return null

  const requestedPageSize = Number.parseInt(searchParams.get('page_size') ?? '', 10)
  const pageSize = Number.isInteger(requestedPageSize) && requestedPageSize > 0
    ? Math.min(requestedPageSize, 24)
    : 12
  const totalPages = Math.max(1, Math.ceil(count / pageSize))
  const currentPage = Math.min(Math.max(1, page), totalPages)
  const firstItem = (currentPage - 1) * pageSize + 1
  const lastItem = Math.min(currentPage * pageSize, count)
  const pages = visiblePages(currentPage, totalPages)

  return (
    <nav className="pagination" aria-label="Paginação dos produtos">
      <div className="pagination__summary" aria-live="polite">
        <strong>Página {currentPage} de {totalPages}</strong>
        <span>Mostrando {firstItem}–{lastItem} de {count} {count === 1 ? 'produto' : 'produtos'}</span>
      </div>
      <div className="pagination__controls">
        {currentPage > 1 ? (
          <Link className="pagination__arrow" to={pageTarget(pathname, searchParams, currentPage - 1)} aria-label="Página anterior">‹</Link>
        ) : <span className="pagination__arrow is-disabled" aria-hidden="true">‹</span>}

        {pages.map((item) => typeof item === 'number' ? (
          <Link
            className={`pagination__page ${item === currentPage ? 'is-current' : ''}`}
            to={pageTarget(pathname, searchParams, item)}
            aria-current={item === currentPage ? 'page' : undefined}
            aria-label={`Página ${item} de ${totalPages}`}
            key={item}
          >
            {item}
          </Link>
        ) : <span className="pagination__ellipsis" aria-hidden="true" key={item}>…</span>)}

        {currentPage < totalPages ? (
          <Link className="pagination__arrow" to={pageTarget(pathname, searchParams, currentPage + 1)} aria-label="Próxima página">›</Link>
        ) : <span className="pagination__arrow is-disabled" aria-hidden="true">›</span>}
      </div>
    </nav>
  )
}
