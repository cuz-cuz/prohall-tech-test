import { useCallback, useState } from 'react'

import { useApiResource } from '../hooks/useApiResource'
import { getAdminStoreSettings, updateAdminStoreSettings } from '../services/api'
import { formatCurrency } from '../utils/formatters'
import { AdminFeedback, FieldError } from './AdminFeedback'
import { apiFieldErrors, firstApiError } from './adminForms'
import { AdminResourceError, AdminTableSkeleton } from './AdminResourceState'
import { formatAdminDateTime } from './adminFormatters'

export function AdminSettingsPage() {
  const [minimum, setMinimum] = useState(null)
  const [errors, setErrors] = useState({})
  const [feedback, setFeedback] = useState(null)
  const [saving, setSaving] = useState(false)
  const state = useApiResource(useCallback((options) => getAdminStoreSettings(options), []))

  // Null until the staff types: the loaded value is the source of truth.
  const value = minimum ?? state.data?.free_shipping_minimum ?? ''

  async function save(event) {
    event.preventDefault()
    setSaving(true)
    setErrors({})
    try {
      await updateAdminStoreSettings({ free_shipping_minimum: value })
      setFeedback({ tone: 'success', message: 'Valor mínimo atualizado. A loja já usa o novo valor.' })
      setMinimum(null)
      state.retry()
    } catch (error) {
      setErrors(apiFieldErrors(error))
      setFeedback({ tone: 'error', message: firstApiError(error) })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="admin-page">
      <header className="admin-page__heading"><div><h1>Configurações</h1><p>Parâmetros comerciais usados pela loja, alteráveis sem novo deploy.</p></div></header>
      <AdminFeedback tone={feedback?.tone} onDismiss={() => setFeedback(null)}>{feedback?.message}</AdminFeedback>
      {state.status === 'loading' && !state.data ? <AdminTableSkeleton /> : null}
      {state.status === 'error' ? <AdminResourceError error={state.error} onRetry={state.retry} /> : null}
      {state.data ? (
        <section className="admin-panel admin-settings-panel" aria-labelledby="shipping-settings-title">
          <header className="admin-panel__heading">
            <div>
              <h2 id="shipping-settings-title">Frete grátis</h2>
              <p>O pedido tem frete grátis quando o subtotal do carrinho atinge este valor. O carrinho informa ao cliente quanto falta.</p>
            </div>
          </header>
          <form className="admin-form-grid" onSubmit={save}>
            <label className="admin-field">
              <span>Valor mínimo da compra</span>
              <input required type="number" min="0.01" step="0.01" value={value} onChange={(event) => setMinimum(event.target.value)} />
              <FieldError errors={errors} name="free_shipping_minimum" />
            </label>
            <p className="admin-settings-hint admin-field">
              Em vigor: <strong>{formatCurrency(state.data.free_shipping_minimum)}</strong>
              <small>Atualizado em {formatAdminDateTime(state.data.updated_at)}</small>
              <small>O destaque de frete grátis por anúncio é apenas informativo e não dispensa este mínimo.</small>
            </p>
            <div className="admin-form-actions admin-field--wide">
              <button className="admin-button admin-button--primary" type="submit" disabled={saving}>{saving ? 'Salvando…' : 'Salvar configurações'}</button>
            </div>
          </form>
        </section>
      ) : null}
    </div>
  )
}
