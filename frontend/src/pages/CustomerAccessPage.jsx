import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { getCustomerSession, requestCustomerAccessCode, verifyCustomerAccessCode } from '../services/api'

export function CustomerAccessPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [developmentCode, setDevelopmentCode] = useState('')
  const [codeRequested, setCodeRequested] = useState(false)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const codeInputRef = useRef(null)
  const errorRef = useRef(null)

  useEffect(() => {
    if (codeRequested) codeInputRef.current?.focus()
  }, [codeRequested])

  useEffect(() => {
    if (error) errorRef.current?.focus()
  }, [error])

  async function handleRequest(event) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      await getCustomerSession()
      const response = await requestCustomerAccessCode(email)
      setDevelopmentCode(response.development_code ?? '')
      setCodeRequested(true)
      setMessage(response.message)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setBusy(false)
    }
  }

  async function handleVerify(event) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      await getCustomerSession()
      await verifyCustomerAccessCode(email, code)
      navigate('/meus-pedidos', { replace: true })
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <main id="conteudo-principal" className="page-container customer-access-page">
      <header className="page-heading">
        <p className="page-context">Área do cliente</p>
        <h1>Acesse seus pedidos</h1>
        <p>Informe o e-mail usado na compra para receber um código temporário.</p>
      </header>

      {!codeRequested ? (
        <form className="customer-access-form" onSubmit={handleRequest} aria-busy={busy}>
          <label className="form-field" htmlFor="access-email">
            <span>Seu e-mail</span>
            <input id="access-email" type="email" autoComplete="email" maxLength="254" value={email} onChange={(event) => setEmail(event.target.value)} aria-invalid={Boolean(error)} aria-describedby={error ? 'access-error' : undefined} required />
          </label>
          <button className="button button--primary" disabled={busy} type="submit">
            {busy ? 'Enviando…' : 'Enviar código'}
          </button>
        </form>
      ) : (
        <form className="customer-access-form" onSubmit={handleVerify} aria-busy={busy}>
          <p role="status">{message}</p>
          {developmentCode ? <p className="customer-access-code">Código local de demonstração: <strong>{developmentCode}</strong></p> : null}
          <label className="form-field" htmlFor="access-code">
            <span>Código de 6 dígitos</span>
            <input ref={codeInputRef} id="access-code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength="6" value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))} aria-invalid={Boolean(error)} aria-describedby={error ? 'access-error' : undefined} required />
          </label>
          <button className="button button--primary" disabled={busy} type="submit">
            {busy ? 'Conferindo…' : 'Acessar pedidos'}
          </button>
          <button className="customer-access-form__resend" type="button" disabled={busy} onClick={() => { setCodeRequested(false); setCode(''); setDevelopmentCode('') }}>
            Usar outro e-mail
          </button>
        </form>
      )}

      {error ? <p id="access-error" className="form-error" role="alert" ref={errorRef} tabIndex="-1">{error}</p> : null}
      <Link className="customer-access-page__back" to="/">Voltar à loja</Link>
    </main>
  )
}
