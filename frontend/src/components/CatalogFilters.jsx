import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { formatCurrency } from '../utils/formatters'
import { catalogParams, ORDERING_OPTIONS } from '../utils/catalogFilters'
import { SortDropdown } from './SortDropdown'

export function CatalogFilters({ pathname, searchParams, defaultOrdering = 'best_selling' }) {
  const navigate = useNavigate()
  const applied = catalogParams(searchParams, defaultOrdering)
  const [minimum, setMinimum] = useState(applied.min_price || '0')
  const [maximum, setMaximum] = useState(applied.max_price || '2000')
  const [ordering, setOrdering] = useState(applied.ordering)
  const [freeShipping, setFreeShipping] = useState(applied.free_shipping)

  function submit(event) {
    event.preventDefault()
    const params = new URLSearchParams()
    if (ordering !== defaultOrdering) params.set('ordering', ordering)
    if (Number(minimum) > 0) params.set('min_price', minimum)
    if (Number(maximum) < 2000) params.set('max_price', maximum)
    if (freeShipping) params.set('free_shipping', 'true')
    navigate(params.size ? `${pathname}?${params}` : pathname)
  }

  function reset() {
    setMinimum('0')
    setMaximum('2000')
    setOrdering(defaultOrdering)
    setFreeShipping(false)
    navigate(pathname)
  }

  return (
    <form className="catalog-filters" onSubmit={submit}>
      <div className="catalog-filters__heading">
        <div>
          <p className="page-context">Refine sua seleção</p>
          <h2>Filtros e ordenação</h2>
        </div>
        <button className="catalog-filters__reset" type="button" onClick={reset}>
          Limpar filtros
        </button>
      </div>
      <SortDropdown
        value={ordering}
        onChange={setOrdering}
        options={ORDERING_OPTIONS.filter(([value]) => defaultOrdering === 'featured' || value !== 'featured')}
      />
      <fieldset className="price-range">
        <legend>Faixa de preço</legend>
        <div className="price-range__values">
          <output>{formatCurrency(minimum)}</output>
          <span>até</span>
          <output>{formatCurrency(maximum)}</output>
        </div>
        <label>
          <span className="visually-hidden">Preço mínimo</span>
          <input type="range" min="0" max="2000" step="10" value={minimum} onChange={(event) => setMinimum(Math.min(Number(event.target.value), Number(maximum)).toString())} />
        </label>
        <label>
          <span className="visually-hidden">Preço máximo</span>
          <input type="range" min="0" max="2000" step="10" value={maximum} onChange={(event) => setMaximum(Math.max(Number(event.target.value), Number(minimum)).toString())} />
        </label>
      </fieldset>
      <label className="filter-check">
        <input type="checkbox" checked={freeShipping} onChange={(event) => setFreeShipping(event.target.checked)} />
        <span>Somente itens com frete grátis</span>
      </label>
      <button className="button button--primary" type="submit">Aplicar filtros</button>
    </form>
  )
}
