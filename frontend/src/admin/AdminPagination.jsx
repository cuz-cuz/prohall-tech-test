export function AdminPagination({ page, count, pageSize = 20, onPageChange }) {
  const totalPages = Math.max(1, Math.ceil(count / pageSize))
  if (totalPages <= 1) return null

  const firstPage = Math.max(1, Math.min(page - 1, totalPages - 2))
  const visiblePages = Array.from(
    { length: Math.min(3, totalPages) },
    (_, index) => firstPage + index,
  )
  const firstItem = (page - 1) * pageSize + 1
  const lastItem = Math.min(page * pageSize, count)

  return (
    <nav className="admin-pagination" aria-label="Paginação da tabela">
      <p>Mostrando {firstItem}–{lastItem} de {count}</p>
      <div>
        <button type="button" disabled={page <= 1} onClick={() => onPageChange(page - 1)} aria-label="Página anterior">‹</button>
        {visiblePages.map((pageNumber) => <button key={pageNumber} type="button" className={pageNumber === page ? 'is-current' : ''} aria-current={pageNumber === page ? 'page' : undefined} onClick={() => onPageChange(pageNumber)}>{pageNumber}</button>)}
        <button type="button" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)} aria-label="Próxima página">›</button>
      </div>
    </nav>
  )
}
