import { useEffect, useId, useRef } from 'react'

import { AdminIcon } from './AdminIcon'

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

/**
 * Dialog used by every table action, so editing and confirming happen in the
 * same place the action was clicked instead of elsewhere on the page.
 */
export function AdminModal({ title, description, onClose, children, size = 'regular' }) {
  const baseId = useId()
  const dialogRef = useRef(null)
  const previouslyFocused = useRef(null)

  useEffect(() => {
    previouslyFocused.current = document.activeElement
    const dialog = dialogRef.current
    const firstField = dialog?.querySelector(FOCUSABLE)
    firstField?.focus()

    const { overflow } = document.body.style
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = overflow
      // Returning focus keeps the keyboard where the action was triggered.
      if (previouslyFocused.current instanceof HTMLElement) previouslyFocused.current.focus()
    }
  }, [])

  function onKeyDown(event) {
    if (event.key === 'Escape') {
      event.stopPropagation()
      onClose()
      return
    }
    if (event.key !== 'Tab') return

    const focusable = Array.from(dialogRef.current?.querySelectorAll(FOCUSABLE) ?? [])
    if (!focusable.length) return
    const first = focusable[0]
    const last = focusable[focusable.length - 1]

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first.focus()
    }
  }

  return (
    <div className="admin-modal-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <div
        className={`admin-modal admin-modal--${size}`}
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${baseId}-title`}
        aria-describedby={description ? `${baseId}-description` : undefined}
        onKeyDown={onKeyDown}
      >
        <header className="admin-modal__heading">
          <div>
            <h2 id={`${baseId}-title`}>{title}</h2>
            {description ? <p id={`${baseId}-description`}>{description}</p> : null}
          </div>
          <button className="admin-modal__close" type="button" onClick={onClose} aria-label="Fechar">
            <AdminIcon name="close" />
          </button>
        </header>
        {children}
      </div>
    </div>
  )
}

export function AdminConfirmModal({ title, description, confirmLabel, tone = 'primary', busy = false, onConfirm, onClose }) {
  return (
    <AdminModal title={title} description={description} onClose={onClose} size="compact">
      <div className="admin-modal__actions">
        <button className={`admin-button admin-button--${tone}`} type="button" onClick={onConfirm} disabled={busy}>
          {busy ? 'Aplicando…' : confirmLabel}
        </button>
        <button className="admin-button admin-button--secondary" type="button" onClick={onClose} disabled={busy}>Cancelar</button>
      </div>
    </AdminModal>
  )
}
