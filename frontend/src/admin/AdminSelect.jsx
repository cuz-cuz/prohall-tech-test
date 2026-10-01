import { useEffect, useId, useRef, useState } from 'react'

import { AdminIcon } from './AdminIcon'

/**
 * Listbox used everywhere the panel needs a dropdown.
 *
 * A native select cannot be styled into the reference layout, so this follows
 * the ARIA listbox pattern instead: focus stays on the trigger and the active
 * option is announced through aria-activedescendant.
 */
export function AdminSelect({ label, value, onChange, options, placeholder = 'Selecione', disabled = false, describedBy }) {
  const baseId = useId()
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const containerRef = useRef(null)
  const triggerRef = useRef(null)
  const listRef = useRef(null)

  const selectedIndex = options.findIndex((option) => String(option.value) === String(value))
  const selected = selectedIndex >= 0 ? options[selectedIndex] : null

  useEffect(() => {
    if (!open) return undefined
    function onPointerDown(event) {
      if (!containerRef.current?.contains(event.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [open])

  useEffect(() => {
    if (!open) return
    const active = listRef.current?.querySelector('[data-active="true"]')
    // Guarded: scrollIntoView is missing in jsdom and in some embedded views.
    active?.scrollIntoView?.({ block: 'nearest' })
  }, [open, activeIndex])

  function openList(startIndex = selectedIndex >= 0 ? selectedIndex : 0) {
    if (disabled) return
    setActiveIndex(options.length ? Math.min(Math.max(startIndex, 0), options.length - 1) : -1)
    setOpen(true)
  }

  function closeList({ refocus = true } = {}) {
    setOpen(false)
    setActiveIndex(-1)
    if (refocus) triggerRef.current?.focus()
  }

  function pick(option) {
    onChange(option.value)
    closeList()
  }

  function onKeyDown(event) {
    if (disabled) return
    const { key } = event

    if (!open) {
      if (key === 'ArrowDown' || key === 'ArrowUp' || key === 'Enter' || key === ' ') {
        event.preventDefault()
        openList(key === 'ArrowUp' ? options.length - 1 : undefined)
      }
      return
    }

    if (key === 'Escape') {
      event.preventDefault()
      closeList()
    } else if (key === 'Tab') {
      // Tab must keep moving through the form, so close without stealing focus.
      closeList({ refocus: false })
    } else if (key === 'ArrowDown') {
      event.preventDefault()
      setActiveIndex((index) => Math.min(index + 1, options.length - 1))
    } else if (key === 'ArrowUp') {
      event.preventDefault()
      setActiveIndex((index) => Math.max(index - 1, 0))
    } else if (key === 'Home') {
      event.preventDefault()
      setActiveIndex(0)
    } else if (key === 'End') {
      event.preventDefault()
      setActiveIndex(options.length - 1)
    } else if (key === 'Enter' || key === ' ') {
      event.preventDefault()
      if (options[activeIndex]) pick(options[activeIndex])
    }
  }

  return (
    <div className="admin-select" ref={containerRef}>
      <span className="admin-select__label" id={`${baseId}-label`}>{label}</span>
      <button
        type="button"
        ref={triggerRef}
        id={`${baseId}-trigger`}
        className="admin-select__trigger"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={`${baseId}-list`}
        aria-labelledby={`${baseId}-label ${baseId}-trigger`}
        aria-activedescendant={open && options[activeIndex] ? `${baseId}-option-${activeIndex}` : undefined}
        aria-describedby={describedBy}
        disabled={disabled}
        onClick={() => (open ? closeList() : openList())}
        onKeyDown={onKeyDown}
      >
        <span className={selected ? undefined : 'admin-select__placeholder'}>{selected ? selected.label : placeholder}</span>
        <AdminIcon name="chevron" />
      </button>
      {open ? (
        <ul className="admin-select__list" id={`${baseId}-list`} role="listbox" ref={listRef} aria-labelledby={`${baseId}-label`}>
          {options.map((option, index) => {
            const isSelected = index === selectedIndex
            return (
              <li
                key={option.value}
                id={`${baseId}-option-${index}`}
                role="option"
                aria-selected={isSelected}
                data-active={index === activeIndex}
                className={`admin-select__option${isSelected ? ' admin-select__option--selected' : ''}`}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => pick(option)}
              >
                <span>{option.label}</span>
                {isSelected ? <AdminIcon name="check" /> : null}
              </li>
            )
          })}
          {!options.length ? <li className="admin-select__empty">Nenhuma opção disponível.</li> : null}
        </ul>
      ) : null}
    </div>
  )
}
