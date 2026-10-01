import { useCallback, useState } from 'react'

import { useApiResource } from '../hooks/useApiResource'
import { createAdminListing, getAdminListings, getAdminProducts, updateAdminListing } from '../services/api'
import { formatCurrency } from '../utils/formatters'
import { AdminFeedback, FieldError } from './AdminFeedback'
import { apiFieldErrors, firstApiError } from './adminForms'
import { AdminModal, AdminConfirmModal } from './AdminModal'
import { AdminPagination } from './AdminPagination'
import { AdminResourceError, AdminTableSkeleton } from './AdminResourceState'
import { AdminSelect } from './AdminSelect'
import { AdminIcon } from './AdminIcon'

const emptyListing = { product_id: '', title: '', description: '', price: '', promotional_price: '', stock_quantity: 0, active: true }
const statusOptions = [{ value: '', label: 'Todos' }, { value: 'true', label: 'Ativos' }, { value: 'false', label: 'Inativos' }]
const stockOptions = [{ value: '', label: 'Todos' }, { value: 'out', label: 'Esgotado' }, { value: 'low', label: 'Baixo (1–5)' }, { value: 'in', label: 'Acima de 5' }]

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
  const [toggling, setToggling] = useState(false)
  const loadListings = useCallback((options) => getAdminListings({ ...applied, page }, options), [applied, page])
  const loadProducts = useCallback((options) => getAdminProducts({ page_size: 500 }, options), [])
  const state = useApiResource(loadListings)
  const products = useApiResource(loadProducts)
  const productOptions = (products.data?.results ?? []).map((product) => ({ value: product.id, label: `${product.title} · ${product.sku || `ID ${product.external_id}`}` }))

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
    // The listbox replaces a required select, so the empty case is checked here.
    if (!form.product_id) {
      setErrors({ product_id: 'Selecione o produto de origem.' })
      return
    }
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
    setToggling(true)
    try {
      await updateAdminListing(listing.id, { active: !listing.active })
      setFeedback({ tone: 'success', message: `Anúncio ${listing.active ? 'desativado' : 'ativado'}.` })
      setConfirming(null)
    } catch (error) {
      setFeedback({ tone: 'error', message: firstApiError(error) })
      setConfirming(null)
    } finally {
      setToggling(false)
      state.retry()
    }
  }

  return (
    <div className="admin-page">
      <header className="admin-page__heading"><div><h1>Anúncios</h1><p>Preço, promoção, estoque e disponibilidade usados pela loja.</p></div><button className="admin-button admin-button--primary" type="button" onClick={() => openEditor()}>Novo anúncio</button></header>
      <AdminFeedback tone={feedback?.tone} onDismiss={() => setFeedback(null)}>{feedback?.message}</AdminFeedback>
      <form className="admin-filters" onSubmit={(event) => { event.preventDefault(); setPage(1); setApplied(filters) }}>
        <label><span>Buscar</span><input value={filters.q} onChange={(event) => setFilters({ ...filters, q: event.target.value })} placeholder="Título, marca, categoria ou SKU" /></label>
        <AdminSelect label="Status" value={filters.active} options={statusOptions} onChange={(value) => setFilters({ ...filters, active: value })} />
        <AdminSelect label="Estoque" value={filters.stock} options={stockOptions} onChange={(value) => setFilters({ ...filters, stock: value })} />
        <button className="admin-button admin-button--secondary" type="submit">Aplicar filtros</button>
      </form>
      {editor ? (
        <AdminModal title={editor === 'new' ? 'Novo anúncio' : `Editar ${editor.title}`} description="O produto importado é somente a origem; os dados comerciais ficam no anúncio." onClose={() => setEditor(null)}>
          <form className="admin-form-grid" onSubmit={save}>
            <div className="admin-field admin-field--wide"><AdminSelect label="Produto de origem" value={form.product_id} options={productOptions} placeholder="Selecione um produto" disabled={editor !== 'new'} describedBy={errors.product_id ? 'product_id-error' : undefined} onChange={(value) => setForm({ ...form, product_id: value })} /><FieldError errors={errors} name="product_id" /></div>
            <label className="admin-field admin-field--wide"><span>Título comercial</span><input required maxLength="255" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} /><FieldError errors={errors} name="title" /></label>
            <label className="admin-field"><span>Preço normal</span><input required type="number" min="0.01" step="0.01" value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} /><FieldError errors={errors} name="price" /></label>
            <label className="admin-field"><span>Preço promocional</span><input type="number" min="0.01" step="0.01" value={form.promotional_price} onChange={(event) => setForm({ ...form, promotional_price: event.target.value })} /><FieldError errors={errors} name="promotional_price" /></label>
            <label className="admin-field"><span>Estoque disponível</span><input required type="number" min="0" step="1" value={form.stock_quantity} onChange={(event) => setForm({ ...form, stock_quantity: event.target.value })} /><FieldError errors={errors} name="stock_quantity" /></label>
            <label className="admin-check"><input type="checkbox" checked={form.active} onChange={(event) => setForm({ ...form, active: event.target.checked })} /><span>Anúncio ativo na loja</span></label>
            <label className="admin-field admin-field--wide"><span>Descrição</span><textarea rows="4" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></label>
            <div className="admin-form-actions admin-field--wide"><button className="admin-button admin-button--primary" type="submit" disabled={saving}>{saving ? 'Salvando…' : 'Salvar anúncio'}</button><button className="admin-button admin-button--secondary" type="button" onClick={() => setEditor(null)}>Cancelar</button></div>
          </form>
        </AdminModal>
      ) : null}
      {confirming ? (
        <AdminConfirmModal
          title={`${confirming.active ? 'Desativar' : 'Ativar'} anúncio`}
          description={confirming.active ? `“${confirming.title}” deixa de aparecer na loja e não pode ser vendido. A operação é reversível.` : `“${confirming.title}” volta a aparecer na loja e pode ser vendido enquanto houver estoque.`}
          confirmLabel={confirming.active ? 'Desativar anúncio' : 'Ativar anúncio'}
          tone={confirming.active ? 'danger' : 'primary'}
          busy={toggling}
          onConfirm={() => toggle(confirming)}
          onClose={() => setConfirming(null)}
        />
      ) : null}
      {state.status === 'loading' && !state.data ? <AdminTableSkeleton /> : null}
      {state.status === 'error' ? <AdminResourceError error={state.error} onRetry={state.retry} /> : null}
      {state.data ? <section className="admin-panel admin-list-panel"><div className="admin-table-wrap"><table className="admin-table" aria-label="Lista de anúncios"><thead><tr><th>Anúncio</th><th>Preço</th><th>Estoque</th><th>Status</th><th className="admin-actions-heading">Ações</th></tr></thead><tbody>{state.data.results.map((listing) => <tr key={listing.id}><td><div className="admin-product-cell">{listing.image_url ? <img src={listing.image_url} alt="" loading="lazy" /> : <span className="admin-product-cell__fallback" aria-hidden="true">M</span>}<span><strong>{listing.title}</strong><small>{listing.sku || 'Sem SKU'} · {listing.product_title}</small></span></div></td><td><strong>{formatCurrency(listing.promotional_price ?? listing.price)}</strong>{listing.promotional_price ? <small>Normal: {formatCurrency(listing.price)}</small> : null}</td><td>{listing.stock_quantity}</td><td><span className={`admin-status admin-status--${listing.active ? 'active' : 'inactive'}`}>{listing.active ? 'Ativo' : 'Inativo'}</span></td><td className="admin-actions-cell"><div className="admin-row-actions"><button className="admin-action-button admin-action-button--edit" type="button" onClick={() => openEditor(listing)} aria-label={`Editar ${listing.title}`} title="Editar"><AdminIcon name="edit" /></button><button className={`admin-action-button admin-action-button--${listing.active ? 'pause' : 'play'}`} type="button" onClick={() => setConfirming(listing)} aria-label={`${listing.active ? 'Desativar' : 'Ativar'} ${listing.title}`} title={listing.active ? 'Desativar' : 'Ativar'}><AdminIcon name={listing.active ? 'pause' : 'play'} /></button></div></td></tr>)}</tbody></table></div>{!state.data.results.length ? <p className="admin-empty">Nenhum anúncio corresponde aos filtros.</p> : null}<AdminPagination page={page} count={state.data.count} onPageChange={setPage} /></section> : null}
    </div>
  )
}
