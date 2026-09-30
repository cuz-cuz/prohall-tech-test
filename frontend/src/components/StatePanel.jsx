export function StatePanel({ title, message, actionLabel, onAction }) {
  return (
    <section className="state-panel" role="status" aria-live="polite">
      <span className="state-panel__mark" aria-hidden="true">
        M
      </span>
      <div>
        <h2>{title}</h2>
        <p>{message}</p>
      </div>
      {onAction ? (
        <button className="button button--secondary" type="button" onClick={onAction}>
          {actionLabel}
        </button>
      ) : null}
    </section>
  )
}

export function ProductGridSkeleton({ count = 4 }) {
  return (
    <div className="product-grid" aria-label="Carregando produtos" aria-busy="true">
      {Array.from({ length: count }, (_, index) => (
        <div className="product-skeleton" key={index}>
          <span className="skeleton-block product-skeleton__image" />
          <span className="skeleton-block product-skeleton__line" />
          <span className="skeleton-block product-skeleton__line product-skeleton__line--short" />
        </div>
      ))}
    </div>
  )
}
