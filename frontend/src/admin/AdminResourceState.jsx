export function AdminTableSkeleton() {
  return (
    <div className="admin-table-skeleton" role="status" aria-label="Carregando dados" aria-busy="true">
      <span /><span /><span /><span />
    </div>
  )
}

export function AdminResourceError({ error, onRetry }) {
  return (
    <section className="admin-resource-state" role="alert">
      <span className="admin-mark" aria-hidden="true">M</span>
      <div>
        <h2>Os dados não carregaram</h2>
        <p>{error?.message ?? 'Tente novamente em alguns instantes.'}</p>
      </div>
      <button className="admin-button admin-button--secondary" type="button" onClick={onRetry}>Tentar novamente</button>
    </section>
  )
}
