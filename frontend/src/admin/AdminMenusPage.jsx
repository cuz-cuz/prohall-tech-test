import { useCallback, useState } from 'react'

import { useApiResource } from '../hooks/useApiResource'
import { createAdminMenu, getAdminListings, getAdminMenus, updateAdminMenu } from '../services/api'
import { AdminFeedback, FieldError } from './AdminFeedback'
import { apiFieldErrors, firstApiError } from './adminForms'
import { AdminPagination } from './AdminPagination'
import { AdminResourceError, AdminTableSkeleton } from './AdminResourceState'
import { AdminIcon } from './AdminIcon'

const emptyMenu = { name: '', slug: '', display_order: 0, active: true, listing_ids: [] }

export function AdminMenusPage() {
  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState({ q: '', active: '' })
  const [applied, setApplied] = useState(filters)
  const [editor, setEditor] = useState(null)
  const [form, setForm] = useState(emptyMenu)
  const [errors, setErrors] = useState({})
  const [feedback, setFeedback] = useState(null)
  const [saving, setSaving] = useState(false)
  const [confirming, setConfirming] = useState(null)
  const menus = useApiResource(useCallback((options) => getAdminMenus({ ...applied, page }, options), [applied, page]))
  const listings = useApiResource(useCallback((options) => getAdminListings({ page_size: 500 }, options), []))

  function openEditor(menu = null) {
    setEditor(menu ?? 'new')
    setForm(menu ? { name: menu.name, slug: menu.slug, display_order: menu.display_order, active: menu.active, listing_ids: menu.listings.map((listing) => listing.id) } : emptyMenu)
    setErrors({})
    setFeedback(null)
  }

  function toggleListing(id) {
    setForm((current) => ({ ...current, listing_ids: current.listing_ids.includes(id) ? current.listing_ids.filter((item) => item !== id) : [...current.listing_ids, id] }))
  }

  function moveListing(index, direction) {
    setForm((current) => {
      const next = [...current.listing_ids]
      const target = index + direction
      if (target < 0 || target >= next.length) return current
      ;[next[index], next[target]] = [next[target], next[index]]
      return { ...current, listing_ids: next }
    })
  }

  async function save(event) {
    event.preventDefault()
    setSaving(true)
    setErrors({})
    try {
      const payload = { ...form, slug: form.slug || undefined, display_order: Number(form.display_order) }
      if (editor === 'new') await createAdminMenu(payload)
      else await updateAdminMenu(editor.id, payload)
      setFeedback({ tone: 'success', message: editor === 'new' ? 'Menu criado.' : 'Menu atualizado.' })
      setEditor(null)
      menus.retry()
    } catch (error) {
      setErrors(apiFieldErrors(error))
      setFeedback({ tone: 'error', message: firstApiError(error) })
    } finally { setSaving(false) }
  }

  async function toggle(menu) {
    try {
      await updateAdminMenu(menu.id, { active: !menu.active })
      setFeedback({ tone: 'success', message: `Menu ${menu.active ? 'desativado' : 'ativado'}.` })
      setConfirming(null)
      menus.retry()
    } catch (error) { setFeedback({ tone: 'error', message: firstApiError(error) }) }
  }

  const selectedListings = form.listing_ids.map((id) => listings.data?.results.find((listing) => listing.id === id)).filter(Boolean)

  return (
    <div className="admin-page">
      <header className="admin-page__heading"><div><h1>Menus</h1><p>Organize as vitrines de navegação e a ordem dos anúncios.</p></div><button className="admin-button admin-button--primary" type="button" onClick={() => openEditor()}>Novo menu</button></header>
      <AdminFeedback tone={feedback?.tone} onDismiss={() => setFeedback(null)}>{feedback?.message}</AdminFeedback>
      <form className="admin-filters" onSubmit={(event) => { event.preventDefault(); setPage(1); setApplied(filters) }}><label><span>Buscar</span><input value={filters.q} onChange={(event) => setFilters({ ...filters, q: event.target.value })} placeholder="Nome ou slug" /></label><label><span>Status</span><select value={filters.active} onChange={(event) => setFilters({ ...filters, active: event.target.value })}><option value="">Todos</option><option value="true">Ativos</option><option value="false">Inativos</option></select></label><button className="admin-button admin-button--secondary" type="submit">Aplicar filtros</button></form>
      {editor ? <section className="admin-panel admin-editor"><header className="admin-panel__heading"><div><h2>{editor === 'new' ? 'Novo menu' : `Editar ${editor.name}`}</h2><p>Selecione e reordene os anúncios exibidos nesta vitrine.</p></div><button className="admin-text-button" type="button" onClick={() => setEditor(null)}>Fechar</button></header><form className="admin-form-grid" onSubmit={save}>
        <label className="admin-field"><span>Nome</span><input required maxLength="120" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /><FieldError errors={errors} name="name" /></label>
        <label className="admin-field"><span>Slug (opcional)</span><input maxLength="120" value={form.slug} onChange={(event) => setForm({ ...form, slug: event.target.value })} /><FieldError errors={errors} name="slug" /></label>
        <label className="admin-field"><span>Ordem do menu</span><input type="number" min="0" step="1" value={form.display_order} onChange={(event) => setForm({ ...form, display_order: event.target.value })} /></label>
        <label className="admin-check"><input type="checkbox" checked={form.active} onChange={(event) => setForm({ ...form, active: event.target.checked })} /><span>Menu ativo</span></label>
        <div className="admin-picker admin-field--wide"><div><strong>Anúncios disponíveis</strong><span>{form.listing_ids.length} selecionados</span></div><div className="admin-picker__options">{listings.data?.results.map((listing) => <label key={listing.id}><input type="checkbox" checked={form.listing_ids.includes(listing.id)} onChange={() => toggleListing(listing.id)} /><span>{listing.title}<small>{listing.sku || 'Sem SKU'} · {listing.active ? 'Ativo' : 'Inativo'}</small></span></label>)}</div><FieldError errors={errors} name="listing_ids" /></div>
        {selectedListings.length ? <ol className="admin-order-list admin-field--wide" aria-label="Ordem dos anúncios no menu">{selectedListings.map((listing, index) => <li key={listing.id}><span><b>{index + 1}</b>{listing.title}</span><div><button type="button" disabled={index === 0} onClick={() => moveListing(index, -1)} aria-label={`Subir ${listing.title}`}>↑</button><button type="button" disabled={index === selectedListings.length - 1} onClick={() => moveListing(index, 1)} aria-label={`Descer ${listing.title}`}>↓</button></div></li>)}</ol> : null}
        <div className="admin-form-actions admin-field--wide"><button className="admin-button admin-button--primary" type="submit" disabled={saving}>{saving ? 'Salvando…' : 'Salvar menu'}</button><button className="admin-button admin-button--secondary" type="button" onClick={() => setEditor(null)}>Cancelar</button></div>
      </form></section> : null}
      {menus.status === 'loading' && !menus.data ? <AdminTableSkeleton /> : null}{menus.status === 'error' ? <AdminResourceError error={menus.error} onRetry={menus.retry} /> : null}
      {menus.data ? <section className="admin-panel admin-list-panel"><div className="admin-table-wrap"><table className="admin-table" aria-label="Lista de menus"><thead><tr><th>Menu</th><th>Ordem</th><th>Anúncios</th><th>Status</th><th className="admin-actions-heading">Ações</th></tr></thead><tbody>{menus.data.results.map((menu) => <tr key={menu.id}><td><strong>{menu.name}</strong><small>/{menu.slug}</small></td><td>{menu.display_order}</td><td>{menu.listings.length}<small>{menu.listings.map((listing) => listing.title).join(' · ') || 'Nenhum anúncio'}</small></td><td><span className={`admin-status admin-status--${menu.active ? 'active' : 'inactive'}`}>{menu.active ? 'Ativo' : 'Inativo'}</span></td><td className="admin-actions-cell"><div className="admin-row-actions"><button className="admin-action-button admin-action-button--edit" type="button" onClick={() => openEditor(menu)} aria-label={`Editar ${menu.name}`} title="Editar"><AdminIcon name="edit" /></button><button className={`admin-action-button admin-action-button--${menu.active ? 'pause' : 'play'}`} type="button" onClick={() => setConfirming(menu)} aria-label={`${menu.active ? 'Desativar' : 'Ativar'} ${menu.name}`} title={menu.active ? 'Desativar' : 'Ativar'}><AdminIcon name={menu.active ? 'pause' : 'play'} /></button></div>{confirming?.id === menu.id ? <div className="admin-inline-confirm" role="alert"><span>Confirmar?</span><button type="button" onClick={() => toggle(menu)}>Sim</button><button type="button" onClick={() => setConfirming(null)}>Não</button></div> : null}</td></tr>)}</tbody></table></div>{!menus.data.results.length ? <p className="admin-empty">Nenhum menu corresponde aos filtros.</p> : null}<AdminPagination page={page} count={menus.data.count} onPageChange={setPage} /></section> : null}
    </div>
  )
}
