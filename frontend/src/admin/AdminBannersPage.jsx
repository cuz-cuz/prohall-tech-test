import { useCallback, useState } from 'react'

import { useApiResource } from '../hooks/useApiResource'
import { createAdminBanner, getAdminBanners, updateAdminBanner } from '../services/api'
import { AdminFeedback, FieldError } from './AdminFeedback'
import { apiFieldErrors, firstApiError, toApiDateTime, toLocalDateTime } from './adminForms'
import { formatAdminDateTime } from './adminFormatters'
import { AdminPagination } from './AdminPagination'
import { AdminResourceError, AdminTableSkeleton } from './AdminResourceState'
import { AdminIcon } from './AdminIcon'

const emptyBanner = { title: '', image_url: '', link_url: '', alt_text: '', display_order: 0, active: true, starts_at: '', ends_at: '' }

export function AdminBannersPage() {
  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState({ q: '', active: '' })
  const [applied, setApplied] = useState(filters)
  const [editor, setEditor] = useState(null)
  const [form, setForm] = useState(emptyBanner)
  const [errors, setErrors] = useState({})
  const [feedback, setFeedback] = useState(null)
  const [saving, setSaving] = useState(false)
  const [confirming, setConfirming] = useState(null)
  const banners = useApiResource(useCallback((options) => getAdminBanners({ ...applied, page }, options), [applied, page]))

  function openEditor(banner = null) {
    setEditor(banner ?? 'new')
    setForm(banner ? { ...banner, starts_at: toLocalDateTime(banner.starts_at), ends_at: toLocalDateTime(banner.ends_at) } : emptyBanner)
    setErrors({})
    setFeedback(null)
  }

  async function save(event) {
    event.preventDefault()
    setSaving(true)
    setErrors({})
    try {
      const payload = { title: form.title, image_url: form.image_url, link_url: form.link_url, alt_text: form.alt_text, display_order: Number(form.display_order), active: form.active, starts_at: toApiDateTime(form.starts_at), ends_at: toApiDateTime(form.ends_at) }
      if (editor === 'new') await createAdminBanner(payload)
      else await updateAdminBanner(editor.id, payload)
      setFeedback({ tone: 'success', message: editor === 'new' ? 'Banner criado.' : 'Banner atualizado.' })
      setEditor(null)
      banners.retry()
    } catch (error) {
      setErrors(apiFieldErrors(error))
      setFeedback({ tone: 'error', message: firstApiError(error) })
    } finally { setSaving(false) }
  }

  async function toggle(banner) {
    try {
      await updateAdminBanner(banner.id, { active: !banner.active })
      setFeedback({ tone: 'success', message: `Banner ${banner.active ? 'desativado' : 'ativado'}.` })
      setConfirming(null)
      banners.retry()
    } catch (error) { setFeedback({ tone: 'error', message: firstApiError(error) }) }
  }

  return <div className="admin-page">
    <header className="admin-page__heading"><div><h1>Banners</h1><p>Controle a imagem, o destino, a ordem e o período de exibição.</p></div><button className="admin-button admin-button--primary" type="button" onClick={() => openEditor()}>Novo banner</button></header>
    <AdminFeedback tone={feedback?.tone} onDismiss={() => setFeedback(null)}>{feedback?.message}</AdminFeedback>
    <form className="admin-filters" onSubmit={(event) => { event.preventDefault(); setPage(1); setApplied(filters) }}><label><span>Buscar</span><input value={filters.q} onChange={(event) => setFilters({ ...filters, q: event.target.value })} placeholder="Título, texto alternativo ou link" /></label><label><span>Status</span><select value={filters.active} onChange={(event) => setFilters({ ...filters, active: event.target.value })}><option value="">Todos</option><option value="true">Ativos</option><option value="false">Inativos</option></select></label><button className="admin-button admin-button--secondary" type="submit">Aplicar filtros</button></form>
    {editor ? <section className="admin-panel admin-editor"><header className="admin-panel__heading"><div><h2>{editor === 'new' ? 'Novo banner' : `Editar ${editor.title}`}</h2><p>Horários são exibidos no fuso de São Paulo e persistidos em UTC.</p></div><button className="admin-text-button" type="button" onClick={() => setEditor(null)}>Fechar</button></header><form className="admin-form-grid" onSubmit={save}>
      <label className="admin-field"><span>Título interno</span><input required maxLength="160" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} /><FieldError errors={errors} name="title" /></label><label className="admin-field"><span>Ordem</span><input type="number" min="0" step="1" value={form.display_order} onChange={(event) => setForm({ ...form, display_order: event.target.value })} /></label>
      <label className="admin-field admin-field--wide"><span>URL da imagem</span><input required type="url" value={form.image_url} onChange={(event) => setForm({ ...form, image_url: event.target.value })} /><FieldError errors={errors} name="image_url" /></label>
      <label className="admin-field"><span>Link de destino</span><input placeholder="/produtos ou https://…" value={form.link_url} onChange={(event) => setForm({ ...form, link_url: event.target.value })} /><FieldError errors={errors} name="link_url" /></label><label className="admin-field"><span>Texto alternativo</span><input maxLength="255" value={form.alt_text} onChange={(event) => setForm({ ...form, alt_text: event.target.value })} /></label>
      <label className="admin-field"><span>Início (opcional)</span><input type="datetime-local" value={form.starts_at} onChange={(event) => setForm({ ...form, starts_at: event.target.value })} /></label><label className="admin-field"><span>Fim (opcional)</span><input type="datetime-local" value={form.ends_at} onChange={(event) => setForm({ ...form, ends_at: event.target.value })} /><FieldError errors={errors} name="ends_at" /></label>
      <label className="admin-check admin-field--wide"><input type="checkbox" checked={form.active} onChange={(event) => setForm({ ...form, active: event.target.checked })} /><span>Banner ativo</span></label>
      <div className="admin-form-actions admin-field--wide"><button className="admin-button admin-button--primary" type="submit" disabled={saving}>{saving ? 'Salvando…' : 'Salvar banner'}</button><button className="admin-button admin-button--secondary" type="button" onClick={() => setEditor(null)}>Cancelar</button></div>
    </form></section> : null}
    {banners.status === 'loading' && !banners.data ? <AdminTableSkeleton /> : null}{banners.status === 'error' ? <AdminResourceError error={banners.error} onRetry={banners.retry} /> : null}
    {banners.data ? <section className="admin-panel admin-list-panel"><div className="admin-table-wrap"><table className="admin-table" aria-label="Lista de banners"><thead><tr><th>Banner</th><th>Ordem</th><th>Período</th><th>Status</th><th className="admin-actions-heading">Ações</th></tr></thead><tbody>{banners.data.results.map((banner) => <tr key={banner.id}><td><strong>{banner.title}</strong><small>{banner.link_url || 'Sem link'}</small></td><td>{banner.display_order}</td><td><small>{banner.starts_at ? `De ${formatAdminDateTime(banner.starts_at)}` : 'Início imediato'}</small><small>{banner.ends_at ? `Até ${formatAdminDateTime(banner.ends_at)}` : 'Sem data final'}</small></td><td><span className={`admin-status admin-status--${banner.active ? 'active' : 'inactive'}`}>{banner.active ? 'Ativo' : 'Inativo'}</span></td><td className="admin-actions-cell"><div className="admin-row-actions"><button className="admin-action-button admin-action-button--edit" type="button" onClick={() => openEditor(banner)} aria-label={`Editar ${banner.title}`} title="Editar"><AdminIcon name="edit" /></button><button className={`admin-action-button admin-action-button--${banner.active ? 'pause' : 'play'}`} type="button" onClick={() => setConfirming(banner)} aria-label={`${banner.active ? 'Desativar' : 'Ativar'} ${banner.title}`} title={banner.active ? 'Desativar' : 'Ativar'}><AdminIcon name={banner.active ? 'pause' : 'play'} /></button></div>{confirming?.id === banner.id ? <div className="admin-inline-confirm" role="alert"><span>Confirmar?</span><button type="button" onClick={() => toggle(banner)}>Sim</button><button type="button" onClick={() => setConfirming(null)}>Não</button></div> : null}</td></tr>)}</tbody></table></div>{!banners.data.results.length ? <p className="admin-empty">Nenhum banner corresponde aos filtros.</p> : null}<AdminPagination page={page} count={banners.data.count} onPageChange={setPage} /></section> : null}
  </div>
}
