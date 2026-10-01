import { useId, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { formatCurrency } from '../utils/formatters'
import { catalogParams, ORDERING_OPTIONS } from '../utils/catalogFilters'
import { StoreModal } from './StoreModal'

const PRICE_CEILING = 2000

function draftFrom(applied) {
  return {
    minimum: applied.min_price || '0',
    maximum: applied.max_price || String(PRICE_CEILING),
    ordering: applied.ordering,
    freeShipping: applied.free_shipping,
  }
}

export function CatalogFilters({ pathname, searchParams, defaultOrdering = 'best_selling' }) {
  const navigate = useNavigate()
  const formId = useId()
  const applied = catalogParams(searchParams, defaultOrdering)
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState(() => draftFrom(applied))
  const orderingOptions = ORDERING_OPTIONS.filter(([value]) => defaultOrdering === 'featured' || value !== 'featured')
  const orderingLabel = orderingOptions.find(([value]) => value === applied.ordering)?.[1] ?? orderingOptions[0][1]
  const activeCount = [
    applied.ordering !== defaultOrdering,
    Boolean(applied.min_price) || Boolean(applied.max_price),
    applied.free_shipping,
  ].filter(Boolean).length

  function openFilters() {
    // Each opening starts from what is applied, so closing without saving discards edits.
    setDraft(draftFrom(applied))
    setOpen(true)
  }

  function update(field, value) {
    setDraft((current) => ({ ...current, [field]: value }))
  }

  function submit(event) {
    event.preventDefault()
    const params = new URLSearchParams()
    if (draft.ordering !== defaultOrdering) params.set('ordering', draft.ordering)
    if (Number(draft.minimum) > 0) params.set('min_price', draft.minimum)
    if (Number(draft.maximum) < PRICE_CEILING) params.set('max_price', draft.maximum)
    if (draft.freeShipping) params.set('free_shipping', 'true')
    setOpen(false)
    navigate(params.size ? `${pathname}?${params}` : pathname)
  }

  function reset() {
    setDraft(draftFrom(catalogParams(new URLSearchParams(), defaultOrdering)))
  }

  return (
    <div className="catalog-toolbar">
      <button className="catalog-toolbar__trigger" type="button" onClick={openFilters} aria-haspopup="dialog">
        <svg aria-hidden="true" viewBox="0 0 20 20" width="18" height="18"><path d="M3 5h14M6 10h8M8.5 15h3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" /></svg>
        Filtrar e ordenar
        {activeCount ? <span className="catalog-toolbar__count" aria-label={`${activeCount} ${activeCount === 1 ? 'filtro ativo' : 'filtros ativos'}`}>{activeCount}</span> : null}
      </button>
      <span className="catalog-toolbar__ordering">Ordenado por <strong>{orderingLabel}</strong></span>

      {open ? (
        <StoreModal
          title="Filtros e ordenação"
          onClose={() => setOpen(false)}
          footer={(
            <>
              <button className="button button--secondary" type="button" onClick={reset}>Limpar filtros</button>
              <button className="button button--primary" type="submit" form={formId}>Aplicar filtros</button>
            </>
          )}
        >
          <form id={formId} className="filter-sheet" onSubmit={submit}>
            <fieldset className="filter-sheet__orderings">
              <legend>Ordenar por</legend>
              <div>
                {orderingOptions.map(([value, label]) => (
                  <label key={value} className={value === draft.ordering ? 'is-selected' : ''}>
                    <input type="radio" name="ordering" value={value} checked={value === draft.ordering} onChange={() => update('ordering', value)} />
                    <span>{label}</span>
                  </label>
                ))}
              </div>
            </fieldset>
            <fieldset className="price-range">
              <legend>Faixa de preço</legend>
              <div className="price-range__values">
                <output>{formatCurrency(draft.minimum)}</output>
                <span>até</span>
                <output>{formatCurrency(draft.maximum)}</output>
              </div>
              <label>
                <span className="visually-hidden">Preço mínimo</span>
                <input type="range" min="0" max={PRICE_CEILING} step="10" value={draft.minimum} onChange={(event) => update('minimum', Math.min(Number(event.target.value), Number(draft.maximum)).toString())} />
              </label>
              <label>
                <span className="visually-hidden">Preço máximo</span>
                <input type="range" min="0" max={PRICE_CEILING} step="10" value={draft.maximum} onChange={(event) => update('maximum', Math.max(Number(event.target.value), Number(draft.minimum)).toString())} />
              </label>
            </fieldset>
            <label className="filter-check">
              <input type="checkbox" checked={draft.freeShipping} onChange={(event) => update('freeShipping', event.target.checked)} />
              <span>Somente itens com frete grátis</span>
            </label>
          </form>
        </StoreModal>
      ) : null}
    </div>
  )
}
