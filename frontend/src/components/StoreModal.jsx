import { useEffect, useId, useRef } from 'react'

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

/**
 * Storefront dialog: a bottom sheet on phones and a centered panel on larger
 * screens. Follows the same focus rules as the admin modal.
 */
export function StoreModal({ title, onClose, children, footer }) {
  const baseId = useId()
  const dialogRef = useRef(null)
  const previouslyFocused = useRef(null)

  useEffect(() => {
    previouslyFocused.current = document.activeElement
    dialogRef.current?.querySelector(FOCUSABLE)?.focus()

    const { overflow } = document.body.style
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = overflow
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
    <div className="store-modal-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <div
        className="store-modal"
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${baseId}-title`}
        onKeyDown={onKeyDown}
      >
        <header className="store-modal__heading">
          <h2 id={`${baseId}-title`}>{title}</h2>
          <button className="store-modal__close" type="button" onClick={onClose} aria-label="Fechar">
            <span aria-hidden="true">×</span>
          </button>
        </header>
        <div className="store-modal__body">{children}</div>
        {footer ? <footer className="store-modal__footer">{footer}</footer> : null}
      </div>
    </div>
  )
}
