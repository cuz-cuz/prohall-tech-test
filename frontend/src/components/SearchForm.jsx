import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

const SEARCH_DELAY_MS = 350

function searchTarget(value) {
  const query = value.trim()
  if (!query) return '/busca'
  return `/busca?q=${encodeURIComponent(query)}`
}

export function SearchForm({ initialQuery = '' }) {
  const navigate = useNavigate()
  const [value, setValue] = useState(initialQuery)
  const [hasChanged, setHasChanged] = useState(false)

  useEffect(() => {
    if (!hasChanged) return undefined

    const timeout = window.setTimeout(() => {
      navigate(searchTarget(value))
    }, SEARCH_DELAY_MS)

    return () => window.clearTimeout(timeout)
  }, [hasChanged, navigate, value])

  function handleSubmit(event) {
    event.preventDefault()
    navigate(searchTarget(value))
  }

  function handleClear() {
    setValue('')
    setHasChanged(true)
    navigate('/busca')
  }

  return (
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
        onChange={(event) => {
          setValue(event.target.value)
          setHasChanged(true)
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
      <button className="site-search__submit" type="submit">
        Buscar
      </button>
    </form>
  )
}
