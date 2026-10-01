import { useCallback, useState } from 'react'

import { useApiResource } from '../hooks/useApiResource'
import { createAdminListing, getAdminListings, getAdminProducts, updateAdminListing } from '../services/api'
import { formatCurrency } from '../utils/formatters'
import { AdminFeedback, FieldError } from './AdminFeedback'
import { apiFieldErrors, firstApiError } from './adminForms'
import { AdminPagination } from './AdminPagination'
import { AdminResourceError, AdminTableSkeleton } from './AdminResourceState'
import { AdminIcon } from './AdminIcon'

const emptyListing = { product_id: '', title: '', description: '', price: '', promotional_price: '', stock_quantity: 0, active: true }

export function AdminListingsPage() {
  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState({ q: '', active: '', stock: '' })
  const [applied, setApplied] = useState(filters)
  const [editor, setEditor] = useState(null)
  const [form, setForm] = useState(emptyListing)
  const [errors, setErrors] = useState({})
  const [feedback, setFeedback] = useState(null)
  const [saving, setSaving] = useState(false)
  const [confirming, setConfirming] = useState(null)
  const loadListings = useCallback((options) => getAdminListings({ ...applied, page }, options), [applied, page])
  const loadProducts = useCallback((options) => getAdminProducts({ page_size: 500 }, options), [])
  const state = useApiResource(loadListings)
  const products = useApiResource(loadProducts)

  function openEditor(listing = null) {
    setEditor(listing ?? 'new')
    setForm(listing ? {
      product_id: listing.product_id,
      title: listing.title,
      description: listing.description,
      price: listing.price,
      promotional_price: listing.promotional_price ?? '',
      stock_quantity: listing.stock_quantity,
      active: listing.active,
    } : emptyListing)
    setErrors({})
    setFeedback(null)
  }

  async function save(event) {
    event.preventDefault()
    setSaving(true)
    setErrors({})
    try {
      const payload = { ...form, product_id: Number(form.product_id), promotional_price: form.promotional_price || null, stock_quantity: Number(form.stock_quantity) }
      if (editor === 'new') await createAdminListing(payload)
      else await updateAdminListing(editor.id, payload)
      setFeedback({ tone: 'success', message: editor === 'new' ? 'Anúncio criado.' : 'Anúncio atualizado.' })
      setEditor(null)
      state.retry()
      products.retry()
    } catch (error) {
      setErrors(apiFieldErrors(error))
      setFeedback({ tone: 'error', message: firstApiError(error) })
    } finally {
      setSaving(false)
    }
  }

  async function toggle(listing) {
    try {
      await updateAdminListing(listing.id, { active: !listing.active })
      setFeedback({ tone: 'success', message: `Anúncio ${listing.active ? 'desativado' : 'ativado'}.` })
      setConfirming(null)
      state.retry()
    } catch (error) {
      setFeedback({ tone: 'error', message: firstApiError(error) })
    }
  }

  return (
    <div className="admin-page">
      <header className="admin-page__heading"><div><h1>Anúncios</h1><p>Preço, promoção, estoque e disponibilidade usados pela loja.</p></div><button className="admin-button admin-button--primary" type="button" onClick={() => openEditor()}>Novo anúncio</button></header>
      <AdminFeedback tone={feedback?.tone} onDismiss={() => setFeedback(null)}>{feedback?.message}</AdminFeedback>
      <form className="admin-filters" onSubmit={(event) => { event.preventDefault(); setPage(1); setApplied(filters) }}>
        <label><span>Buscar</span><input value={filters.q} onChange={(event) => setFilters({ ...filters, q: event.target.value })} placeholder="Título, marca, categoria ou SKU" /></label>
        <label><span>Status</span><select value={filters.active} onChange={(event) => setFilters({ ...filters, active: event.target.value })}><option value="">Todos</option><option value="true">Ativos</option><option value="false">Inativos</option></select></label>
        <label><span>Estoque</span><select value={filters.stock} onChange={(event) => setFilters({ ...filters, stock: event.target.value })}><option value="">Todos</option><option value="out">Esgotado</option><option value="low">Baixo (1–5)</option><option value="in">Acima de 5</option></select></label>
        <button className="admin-button admin-button--secondary" type="submit">Aplicar filtros</button>
      </form>
      {editor ? (
        <section className="admin-panel admin-editor" aria-labelledby="listing-editor-title">
          <header className="admin-panel__heading"><div><h2 id="listing-editor-title">{editor === 'new' ? 'Novo anúncio' : `Editar ${editor.title}`}</h2><p>O produto importado é somente a origem; os dados comerciais ficam no anúncio.</p></div><button className="admin-text-button" type="button" onClick={() => setEditor(null)}>Fechar</button></header>
          <form className="admin-form-grid" onSubmit={save}>
            <label className="admin-field admin-field--wide"><span>Produto de origem</span><select required disabled={editor !== 'new'} value={form.product_id} onChange={(event) => setForm({ ...form, product_id: event.target.value })}><option value="">Selecione um produto</option>{products.data?.results.map((product) => <option key={product.id} value={product.id}>{product.title} · {product.sku || `ID ${product.external_id}`}</option>)}</select><FieldError errors={errors} name="product_id" /></label>
            <label className="admin-field admin-field--wide"><span>Título comercial</span><input required maxLength="255" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} /><FieldError errors={errors} name="title" /></label>
            <label className="admin-field"><span>Preço normal</span><input required type="number" min="0.01" step="0.01" value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} /><FieldError errors={errors} name="price" /></label>
            <label className="admin-field"><span>Preço promocional</span><input type="number" min="0.01" step="0.01" value={form.promotional_price} onChange={(event) => setForm({ ...form, promotional_price: event.target.value })} /><FieldError errors={errors} name="promotional_price" /></label>
            <label className="admin-field"><span>Estoque disponível</span><input required type="number" min="0" step="1" value={form.stock_quantity} onChange={(event) => setForm({ ...form, stock_quantity: event.target.value })} /><FieldError errors={errors} name="stock_quantity" /></label>
            <label className="admin-check"><input type="checkbox" checked={form.active} onChange={(event) => setForm({ ...form, active: event.target.checked })} /><span>Anúncio ativo na loja</span></label>
            <label className="admin-field admin-field--wide"><span>Descrição</span><textarea rows="4" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></label>
            <div className="admin-form-actions admin-field--wide"><button className="admin-button admin-button--primary" type="submit" disabled={saving}>{saving ? 'Salvando…' : 'Salvar anúncio'}</button><button className="admin-button admin-button--secondary" type="button" onClick={() => setEditor(null)}>Cancelar</button></div>
          </form>
        </section>
      ) : null}
      {state.status === 'loading' && !state.data ? <AdminTableSkeleton /> : null}
      {state.status === 'error' ? <AdminResourceError error={state.error} onRetry={state.retry} /> : null}
      {state.data ? <section className="admin-panel admin-list-panel"><div className="admin-table-wrap"><table className="admin-table" aria-label="Lista de anúncios"><thead><tr><th>Anúncio</th><th>Preço</th><th>Estoque</th><th>Status</th><th className="admin-actions-heading">Ações</th></tr></thead><tbody>{state.data.results.map((listing) => <tr key={listing.id}><td><div className="admin-product-cell">{listing.image_url ? <img src={listing.image_url} alt="" loading="lazy" /> : <span className="admin-product-cell__fallback" aria-hidden="true">M</span>}<span><strong>{listing.title}</strong><small>{listing.sku || 'Sem SKU'} · {listing.product_title}</small></span></div></td><td><strong>{formatCurrency(listing.promotional_price ?? listing.price)}</strong>{listing.promotional_price ? <small>Normal: {formatCurrency(listing.price)}</small> : null}</td><td>{listing.stock_quantity}</td><td><span className={`admin-status admin-status--${listing.active ? 'active' : 'inactive'}`}>{listing.active ? 'Ativo' : 'Inativo'}</span></td><td className="admin-actions-cell"><div className="admin-row-actions"><button className="admin-action-button admin-action-button--edit" type="button" onClick={() => openEditor(listing)} aria-label={`Editar ${listing.title}`} title="Editar"><AdminIcon name="edit" /></button><button className={`admin-action-button admin-action-button--${listing.active ? 'pause' : 'play'}`} type="button" onClick={() => setConfirming(listing)} aria-label={`${listing.active ? 'Desativar' : 'Ativar'} ${listing.title}`} title={listing.active ? 'Desativar' : 'Ativar'}><AdminIcon name={listing.active ? 'pause' : 'play'} /></button></div>{confirming?.id === listing.id ? <div className="admin-inline-confirm" role="alert"><span>Confirmar?</span><button type="button" onClick={() => toggle(listing)}>Sim</button><button type="button" onClick={() => setConfirming(null)}>Não</button></div> : null}</td></tr>)}</tbody></table></div>{!state.data.results.length ? <p className="admin-empty">Nenhum anúncio corresponde aos filtros.</p> : null}<AdminPagination page={page} count={state.data.count} onPageChange={setPage} /></section> : null}
    </div>
  )
}
