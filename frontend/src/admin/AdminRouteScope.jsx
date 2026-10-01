import { Navigate, Outlet, useLocation } from 'react-router-dom'

import { AdminAuthProvider } from './AdminAuthContext'
import { useAdminAuth } from './useAdminAuth'

export function AdminRouteScope() {
  return (
    <AdminAuthProvider>
      <Outlet />
    </AdminAuthProvider>
  )
}

export function AdminProtectedRoute() {
  const auth = useAdminAuth()
  const location = useLocation()

  if (auth.status === 'loading') {
    return (
      <main className="admin-gate" aria-busy="true">
        <span className="admin-loader" aria-hidden="true" />
        <p>Verificando sessão administrativa…</p>
      </main>
    )
  }

  if (auth.status === 'error') {
    return (
      <main className="admin-gate">
        <div className="admin-gate__message" role="alert">
          <span className="admin-mark" aria-hidden="true">M</span>
          <h1>Não foi possível verificar sua sessão</h1>
          <p>{auth.error?.message ?? 'Confira a conexão com a API e tente novamente.'}</p>
          <button className="admin-button admin-button--primary" type="button" onClick={() => auth.refreshSession().catch(() => {})}>
            Tentar novamente
          </button>
        </div>
      </main>
    )
  }

  if (auth.status !== 'authenticated') {
    return <Navigate to="/admin/login" replace state={{ from: location }} />
  }

  return <Outlet />
}
