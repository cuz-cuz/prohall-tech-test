import { useState } from 'react'

import { runAdminProductImport } from '../services/api'
import { AdminFeedback } from './AdminFeedback'
import { firstApiError } from './adminForms'
import { formatAdminDateTime } from './adminFormatters'

export function AdminImportPage() {
  const [confirmed, setConfirmed] = useState(false)
  const [running, setRunning] = useState(false)
  const [summary, setSummary] = useState(null)
  const [error, setError] = useState('')

  async function runImport() {
    setRunning(true)
    setError('')
    try {
      setSummary(await runAdminProductImport())
      setConfirmed(false)
    } catch (requestError) {
      setError(firstApiError(requestError))
    } finally { setRunning(false) }
  }

  return <div className="admin-page admin-import-page">
    <header className="admin-page__heading"><div><h1>Importação</h1><p>Atualize os produtos de origem pelo DummyJSON sem sobrescrever anúncios comerciais.</p></div></header>
    <AdminFeedback tone="error" onDismiss={() => setError('')}>{error}</AdminFeedback>
    {summary ? <section className="admin-import-result" aria-live="polite"><div><span>{summary.total}</span><strong>produtos processados</strong></div><dl><div><dt>Novos</dt><dd>{summary.created}</dd></div><div><dt>Atualizados</dt><dd>{summary.updated}</dd></div>{summary.skipped ? <div><dt>Fora do nicho</dt><dd>{summary.skipped}</dd></div> : null}<div><dt>Concluída</dt><dd>{formatAdminDateTime(summary.completed_at)}</dd></div></dl></section> : null}
    <section className="admin-panel admin-import-action"><div><p className="admin-eyebrow">Sincronização segura</p><h2>Buscar os produtos do nicho</h2><p>A operação é paginada e idempotente. Títulos, preços e estoque dos anúncios já publicados não serão alterados.</p><ul><li>Somente as categorias femininas da loja são lidas: beleza, cuidados pessoais, perfumes, roupas, bolsas, calçados, joias, relógios e óculos.</li><li>Produtos existentes serão atualizados pela identificação externa.</li><li>Produtos novos ficarão disponíveis para criar anúncios.</li><li>Falhas externas não deixam uma importação parcial.</li></ul></div><div className="admin-import-action__control">{confirmed ? <div className="admin-confirm-box" role="alert"><strong>Executar a importação agora?</strong><p>O processo pode levar alguns instantes.</p><div><button className="admin-button admin-button--primary" type="button" onClick={runImport} disabled={running}>{running ? 'Importando…' : 'Sim, importar'}</button><button className="admin-button admin-button--secondary" type="button" onClick={() => setConfirmed(false)} disabled={running}>Cancelar</button></div></div> : <button className="admin-button admin-button--primary" type="button" onClick={() => setConfirmed(true)}>Reimportar produtos</button>}</div></section>
  </div>
}
