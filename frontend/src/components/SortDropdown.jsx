import { useEffect, useId, useRef } from 'react'

export function SortDropdown({ value, onChange, options }) {
  const detailsRef = useRef(null)
  const labelId = useId()
  const selectedLabel = options.find(([optionValue]) => optionValue === value)?.[1] ?? options[0]?.[1]

  useEffect(() => {
    function closeOnOutsideClick(event) {
      if (!detailsRef.current?.contains(event.target)) detailsRef.current?.removeAttribute('open')
    }

    function closeOnEscape(event) {
      if (event.key === 'Escape' && detailsRef.current?.open) {
        detailsRef.current.removeAttribute('open')
        detailsRef.current.querySelector('summary')?.focus()
      }
    }

    document.addEventListener('pointerdown', closeOnOutsideClick)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsideClick)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [])

  function selectOption(nextValue) {
    onChange(nextValue)
    detailsRef.current?.removeAttribute('open')
    detailsRef.current?.querySelector('summary')?.focus()
  }

  return (
    <div className="sort-dropdown">
      <span className="sort-dropdown__label" id={labelId}>Ordenar por</span>
      <details ref={detailsRef}>
        <summary aria-labelledby={labelId}>
          <span>{selectedLabel}</span>
          <i aria-hidden="true" />
        </summary>
        <div className="sort-dropdown__options" role="radiogroup" aria-labelledby={labelId}>
          {options.map(([optionValue, label]) => (
            <label className={optionValue === value ? 'is-selected' : ''} key={optionValue}>
              <input
                type="radio"
                name={`${labelId}-ordering`}
                value={optionValue}
                checked={optionValue === value}
                onChange={() => selectOption(optionValue)}
              />
              <span>{label}</span>
              <b aria-hidden="true">✓</b>
            </label>
          ))}
        </div>
      </details>
    </div>
  )
}
