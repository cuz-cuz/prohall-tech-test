import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'

import { useAdminAuth } from './useAdminAuth'

export function AdminLoginPage() {
  const auth = useAdminAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [credentials, setCredentials] = useState({ username: '', password: '' })
  const [error, setError] = useState('')

  const requestedPath = location.state?.from?.pathname
  const destination = requestedPath?.startsWith('/admin') && requestedPath !== '/admin/login'
    ? requestedPath
    : '/admin'

  if (auth.status === 'authenticated') {
    return <Navigate to={destination} replace />
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    try {
      await auth.signIn(credentials.username.trim(), credentials.password)
      navigate(destination, { replace: true })
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  return (
    <main className="admin-login">
      <section className="admin-login__context" aria-label="Mosaico Admin">
        <Link className="admin-brand" to="/" aria-label="Voltar para a loja Mosaico">
          <span className="brand__tiles" aria-hidden="true"><i /><i /><i /></span>
          <span>Mosaico <small>Admin</small></span>
        </Link>
        <div>
          <p>Operação da loja</p>
          <h1>Informação clara para cuidar de cada pedido.</h1>
          <p>Consulte catálogo, clientes, estoque e vendas em um único lugar protegido.</p>
        </div>
        <p className="admin-login__note">Acesso exclusivo para usuários ativos da equipe.</p>
      </section>

      <section className="admin-login__form-section">
        <form className="admin-login__form" onSubmit={handleSubmit}>
          <header>
            <span className="admin-mark" aria-hidden="true">M</span>
            <div>
              <h2>Entrar no painel</h2>
              <p>Use as credenciais administrativas do ambiente.</p>
            </div>
          </header>

          {auth.status === 'loading' ? <p className="admin-login__session" role="status">Preparando sessão segura…</p> : null}
          {auth.status === 'error' ? (
            <div className="admin-form-error" role="alert">
              <p>{auth.error?.message}</p>
              <button type="button" onClick={() => auth.refreshSession().catch(() => {})}>Tentar novamente</button>
            </div>
          ) : null}
          {error ? <p className="admin-form-error" role="alert">{error}</p> : null}

          <label htmlFor="admin-username">Usuário</label>
          <input
            id="admin-username"
            name="username"
            autoComplete="username"
            maxLength="150"
            required
            value={credentials.username}
            onChange={(event) => setCredentials((current) => ({ ...current, username: event.target.value }))}
          />

          <label htmlFor="admin-password">Senha</label>
          <input
            id="admin-password"
            name="password"
            type="password"
            autoComplete="current-password"
            maxLength="128"
            required
            value={credentials.password}
            onChange={(event) => setCredentials((current) => ({ ...current, password: event.target.value }))}
          />

          <button className="admin-button admin-button--primary" type="submit" disabled={auth.submitting || auth.status === 'loading' || auth.status === 'error'}>
            {auth.submitting ? 'Verificando…' : 'Entrar'}
          </button>
          <Link className="admin-login__back" to="/">Voltar para a loja</Link>
        </form>
      </section>
    </main>
  )
}
