export function AdminFeedback({ tone = 'success', children, onDismiss }) {
  if (!children) return null
  return (
    <div className={`admin-feedback admin-feedback--${tone}`} role={tone === 'error' ? 'alert' : 'status'}>
      <span>{children}</span>
      {onDismiss ? <button type="button" onClick={onDismiss} aria-label="Fechar mensagem">×</button> : null}
    </div>
  )
}

export function FieldError({ errors, name }) {
  return errors[name] ? <span className="admin-field-error" id={`${name}-error`}>{errors[name]}</span> : null
}
