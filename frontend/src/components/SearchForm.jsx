import { useEffect, useId, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { searchListings } from '../services/api'
import { formatCurrency } from '../utils/formatters'

const SUGGESTION_DELAY_MS = 300
const SUGGESTION_LIMIT = 5

function searchTarget(value) {
  const query = value.trim()
  if (!query) return '/busca'
  return `/busca?q=${encodeURIComponent(query)}`
}

/**
 * Typing only previews up to five products under the field; the results page
 * opens when the customer submits with the magnifier button or Enter.
 */
export function SearchForm({ initialQuery = '' }) {
  const navigate = useNavigate()
  const listboxId = useId()
  const wrapperRef = useRef(null)
  const [value, setValue] = useState(initialQuery)
  const [hasTyped, setHasTyped] = useState(false)
  const [suggestions, setSuggestions] = useState({ query: '', items: [] })
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)

  const query = value.trim()
  const canSuggest = hasTyped && query.length >= 2
  const items = canSuggest && suggestions.query === query ? suggestions.items : []
  const showList = open && canSuggest && suggestions.query === query

  useEffect(() => {
    if (!canSuggest) return undefined

    const controller = new AbortController()
    const timeout = window.setTimeout(() => {
      searchListings(query, 1, { signal: controller.signal, pageSize: SUGGESTION_LIMIT })
        .then((data) => setSuggestions({ query, items: data.results.slice(0, SUGGESTION_LIMIT) }))
        .catch((error) => {
          if (error?.name !== 'AbortError') setSuggestions({ query, items: [] })
        })
    }, SUGGESTION_DELAY_MS)

    return () => {
      window.clearTimeout(timeout)
      controller.abort()
    }
  }, [canSuggest, query])

  useEffect(() => {
    function closeOnOutsideClick(event) {
      if (!wrapperRef.current?.contains(event.target)) setOpen(false)
    }
    document.addEventListener('pointerdown', closeOnOutsideClick)
    return () => document.removeEventListener('pointerdown', closeOnOutsideClick)
  }, [])

  function closeSuggestions() {
    setOpen(false)
    setActiveIndex(-1)
  }

  function openProduct(item) {
    closeSuggestions()
    navigate(`/produto/${item.slug}`)
  }

  function handleSubmit(event) {
    event.preventDefault()
    if (activeIndex >= 0 && items[activeIndex]) {
      openProduct(items[activeIndex])
      return
    }
    closeSuggestions()
    navigate(searchTarget(value))
  }

  function handleKeyDown(event) {
    if (event.key === 'Escape') {
      closeSuggestions()
      return
    }
    if (!showList || !items.length) return
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActiveIndex((index) => (index + 1) % items.length)
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveIndex((index) => (index <= 0 ? items.length - 1 : index - 1))
    }
  }

  function handleClear() {
    setValue('')
    closeSuggestions()
  }

  return (
    <div className="site-search-wrap" ref={wrapperRef}>
      <form className="site-search" role="search" onSubmit={handleSubmit}>
        <label className="visually-hidden" htmlFor="store-search">
          Buscar produtos
        </label>
        <input
          id="store-search"
          type="search"
          name="q"
          value={value}
          placeholder="Buscar por produto, marca ou categoria"
          autoComplete="off"
          maxLength={100}
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={showList}
          aria-controls={listboxId}
          aria-activedescendant={showList && activeIndex >= 0 ? `${listboxId}-${activeIndex}` : undefined}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          onChange={(event) => {
            setValue(event.target.value)
            setHasTyped(true)
            setOpen(true)
            setActiveIndex(-1)
          }}
        />
        {value ? (
          <button
            className="site-search__clear"
            type="button"
            onClick={handleClear}
            aria-label="Limpar busca"
          >
            Limpar
          </button>
        ) : null}
        <button className="site-search__submit" type="submit" aria-label="Buscar">
          <svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20">
            <circle cx="10.5" cy="10.5" r="6.5" fill="none" stroke="currentColor" strokeWidth="2.25" />
            <path d="M15.5 15.5 20 20" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" />
          </svg>
        </button>
      </form>

      <ul
        className="search-suggestions"
        id={listboxId}
        role="listbox"
        aria-label="Sugestões de produtos"
        hidden={!showList}
      >
        {items.map((item, index) => (
          <li
            key={item.id}
            id={`${listboxId}-${index}`}
            role="option"
            aria-selected={index === activeIndex}
            className={index === activeIndex ? 'is-active' : ''}
            onPointerDown={(event) => event.preventDefault()}
            onClick={() => openProduct(item)}
          >
            {item.thumbnail_url ? <img src={item.thumbnail_url} alt="" width="40" height="40" loading="lazy" /> : <span className="search-suggestions__placeholder" aria-hidden="true" />}
            <span className="search-suggestions__title">{item.title}</span>
            <strong>{formatCurrency(item.effective_price)}</strong>
          </li>
        ))}
        {showList && !items.length ? <li className="search-suggestions__empty" role="presentation">Nenhuma sugestão para “{query}”</li> : null}
        {showList && items.length ? (
          <li className="search-suggestions__all" role="presentation">
            <button type="button" onPointerDown={(event) => event.preventDefault()} onClick={() => { closeSuggestions(); navigate(searchTarget(value)) }}>
              Ver todos os resultados
            </button>
          </li>
        ) : null}
      </ul>
    </div>
  )
}
