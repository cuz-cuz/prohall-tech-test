import { useCallback, useState } from 'react'

import { useCart } from '../cart/useCart'
import { useApiResource } from '../hooks/useApiResource'
import {
  getAdminDemoReset,
  getAdminStoreSettings,
  restoreAdminDemo,
  updateAdminStoreSettings,
} from '../services/api'
import { formatCurrency } from '../utils/formatters'
import { AdminFeedback, FieldError } from './AdminFeedback'
import { AdminIcon } from './AdminIcon'
import { AdminModal } from './AdminModal'
import { apiFieldErrors, firstApiError } from './adminForms'
import { AdminResourceError, AdminTableSkeleton } from './AdminResourceState'
import { formatAdminDateTime } from './adminFormatters'

export function AdminSettingsPage() {
  const { clearCart } = useCart()
  const [minimum, setMinimum] = useState(null)
  const [errors, setErrors] = useState({})
  const [feedback, setFeedback] = useState(null)
  const [saving, setSaving] = useState(false)
  const [resetOpen, setResetOpen] = useState(false)
  const [confirmation, setConfirmation] = useState('')
  const [resetting, setResetting] = useState(false)
  const state = useApiResource(useCallback((options) => getAdminStoreSettings(options), []))
  // The backend is the permission authority. A regular staff user receives
  // 403 and the destructive section stays hidden; superusers receive status.
  const resetState = useApiResource(useCallback((options) => getAdminDemoReset(options), []))

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

  function closeReset() {
    if (resetting) return
    setResetOpen(false)
    setConfirmation('')
  }

  async function resetDemo(event) {
    event.preventDefault()
    setResetting(true)
    try {
      const summary = await restoreAdminDemo(confirmation)
      clearCart()
      setFeedback({
        tone: 'success',
        message: `Demonstração restaurada: ${summary.products_imported} produtos e ${summary.listings_created} anúncios preparados.`,
      })
      setResetOpen(false)
      setConfirmation('')
      state.retry()
      resetState.retry()
    } catch (error) {
      setFeedback({ tone: 'error', message: firstApiError(error) })
    } finally {
      setResetting(false)
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
      {resetState.data ? (
        <section className="admin-panel admin-demo-reset" aria-labelledby="demo-reset-title">
          <div className="admin-demo-reset__icon" aria-hidden="true"><AdminIcon name="reset" /></div>
          <div className="admin-demo-reset__content">
            <p className="admin-eyebrow">Ferramenta de demonstração</p>
            <h2 id="demo-reset-title">Voltar a loja ao cenário inicial</h2>
            <p className="admin-demo-reset__description">Limpe os testes realizados e recrie automaticamente o catálogo, os anúncios, os menus e os banners padrão.</p>
            <ul className="admin-demo-reset__assurances" aria-label="Garantias da restauração">
              <li><AdminIcon name="shield" /><span><strong>Acesso preservado</strong>Usuários administrativos não são removidos.</span></li>
              <li><AdminIcon name="check" /><span><strong>Reconstrução segura</strong>O catálogo é validado antes da limpeza.</span></li>
            </ul>
            <div className="admin-demo-reset__history">
              <AdminIcon name="clock" />
              {resetState.data.last_reset_at ? (
                <span>Última restauração por <strong>{resetState.data.last_reset_by}</strong> em {formatAdminDateTime(resetState.data.last_reset_at)}.</span>
              ) : <span>Nenhuma restauração executada por este painel.</span>}
            </div>
          </div>
          <div className="admin-demo-reset__action">
            <span className={`admin-demo-reset__availability${resetState.data.can_reset ? ' is-ready' : ''}`}>
              {resetState.data.can_reset ? 'Disponível' : resetState.data.running ? 'Em andamento' : 'Temporariamente indisponível'}
            </span>
            <button
              className="admin-button admin-button--danger"
              type="button"
              disabled={!resetState.data.can_reset}
              onClick={() => setResetOpen(true)}
            >
              <AdminIcon name="reset" />
              Restaurar demonstração
            </button>
            {!resetState.data.enabled ? <small>Recurso desativado neste ambiente.</small> : null}
            {resetState.data.retry_after ? <small>Aguarde {resetState.data.retry_after} segundos para executar novamente.</small> : null}
            {resetState.data.can_reset ? <small>Exige confirmação antes de iniciar.</small> : null}
          </div>
        </section>
      ) : null}
      {resetOpen ? (
        <AdminModal
          title="Restaurar demonstração"
          description="Retorne a loja a um estado limpo e pronto para novos testes."
          onClose={closeReset}
          size="reset"
        >
          <form className="admin-reset-form" onSubmit={resetDemo}>
            <div className="admin-reset-form__warning">
              <span aria-hidden="true"><AdminIcon name="alert" /></span>
              <div><strong>Esta ação não pode ser desfeita</strong><p>Pedidos, clientes e todas as alterações comerciais feitas durante os testes serão removidos.</p></div>
            </div>
            <div className="admin-reset-form__scope">
              <p className="admin-reset-form__label">O que acontece em seguida</p>
              <ul>
                <li><span>1</span><p><strong>Validar</strong>O catálogo completo é conferido no DummyJSON.</p></li>
                <li><span>2</span><p><strong>Limpar</strong>Pedidos, clientes e configuração comercial são removidos.</p></li>
                <li><span>3</span><p><strong>Recriar</strong>A vitrine padrão volta pronta para novos testes.</p></li>
              </ul>
            </div>
            <div className="admin-reset-form__preserved"><AdminIcon name="shield" /><span><strong>Seu acesso administrativo será preservado.</strong> Você continuará conectado após a restauração.</span></div>
            <div className="admin-reset-form__confirmation">
              <label className="admin-field">
                <span>Para confirmar, digite exatamente:</span>
                <code>{resetState.data.confirmation_phrase}</code>
                <input
                  value={confirmation}
                  onChange={(event) => setConfirmation(event.target.value)}
                  autoComplete="off"
                  disabled={resetting}
                  aria-label="Frase de confirmação"
                  required
                />
              </label>
            </div>
            <div className="admin-modal__actions admin-reset-form__actions">
              <button className="admin-button admin-button--secondary" type="button" onClick={closeReset} disabled={resetting}>Cancelar</button>
              <button
                className="admin-button admin-button--danger"
                type="submit"
                disabled={resetting || confirmation !== resetState.data.confirmation_phrase}
              >
                <AdminIcon name="reset" />
                {resetting ? 'Restaurando…' : 'Sim, restaurar demonstração'}
              </button>
            </div>
          </form>
        </AdminModal>
      ) : null}
    </div>
  )
}
