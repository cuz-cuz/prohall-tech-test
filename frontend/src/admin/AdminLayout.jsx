import { useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'

import { API_BASE_URL } from '../services/api'
import { AdminIcon } from './AdminIcon'
import { useAdminAuth } from './useAdminAuth'

const navigation = [
  { to: '/admin', label: 'Visão geral', icon: 'dashboard', end: true },
  { to: '/admin/produtos', label: 'Produtos', icon: 'products' },
  { to: '/admin/anuncios', label: 'Anúncios', icon: 'listings' },
  { to: '/admin/menus', label: 'Menus', icon: 'menus' },
  { to: '/admin/banners', label: 'Banners', icon: 'banners' },
  { to: '/admin/importacao', label: 'Importação', icon: 'import' },
  { to: '/admin/pedidos', label: 'Pedidos', icon: 'orders' },
  { to: '/admin/clientes', label: 'Clientes', icon: 'customers' },
  { to: '/admin/configuracoes', label: 'Configurações', icon: 'settings' },
]

const pageTitles = {
  '/admin': 'Visão geral',
  '/admin/produtos': 'Produtos importados',
  '/admin/anuncios': 'Anúncios comerciais',
  '/admin/menus': 'Menus da loja',
  '/admin/banners': 'Banners',
  '/admin/importacao': 'Importação de produtos',
  '/admin/pedidos': 'Pedidos',
  '/admin/clientes': 'Clientes',
  '/admin/configuracoes': 'Configurações da loja',
}

export function AdminLayout() {
  const auth = useAdminAuth()
  const location = useLocation()
  const [logoutError, setLogoutError] = useState('')
  const djangoAdminUrl = `${API_BASE_URL.replace(/\/api$/, '')}/admin/`

  async function handleLogout() {
    setLogoutError('')
    try {
      await auth.signOut()
    } catch (error) {
      setLogoutError(error.message)
    }
  }

  return (
    <div className="admin-shell">
      <a className="skip-link" href="#admin-content">Pular para o conteúdo</a>
      <aside className="admin-sidebar">
        <div className="admin-sidebar__brand-row">
          <Link className="admin-brand" to="/admin" aria-label="Mosaico Admin — visão geral">
            <span className="brand__tiles" aria-hidden="true"><i /><i /><i /></span>
            <span>Mosaico <small>Admin</small></span>
          </Link>
          <div className="admin-sidebar__mobile-actions">
            <Link className="admin-sidebar__store-link admin-sidebar__store-link--compact" to="/" aria-label="Abrir loja">
              <AdminIcon name="store" />
            </Link>
            <button className="admin-logout admin-logout--compact" type="button" onClick={handleLogout} disabled={auth.submitting} aria-label="Sair do painel">
              <AdminIcon name="logout" />
            </button>
          </div>
        </div>

        <nav className="admin-nav" aria-label="Navegação administrativa">
          {navigation.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end}>
              <AdminIcon name={item.icon} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="admin-sidebar__footer">
          <a className="admin-sidebar__store-link" href={djangoAdminUrl}>
            <AdminIcon name="store" />
            <span>Django Admin</span>
          </a>
          <div className="admin-user">
            <span className="admin-user__avatar" aria-hidden="true">
              {auth.user?.display_name?.charAt(0).toLocaleUpperCase('pt-BR') ?? 'A'}
            </span>
            <span><strong>{auth.user?.display_name}</strong><small>@{auth.user?.username}</small></span>
          </div>
          <button className="admin-logout" type="button" onClick={handleLogout} disabled={auth.submitting}>
            <AdminIcon name="logout" />
            <span>{auth.submitting ? 'Saindo…' : 'Sair do painel'}</span>
          </button>
        </div>
      </aside>

      <div className="admin-workspace">
        <header className="admin-topbar">
          <div>
            <p>Painel administrativo</p>
            <strong>{pageTitles[location.pathname] ?? 'Mosaico'}</strong>
            {logoutError ? <span className="admin-topbar__error" role="alert">{logoutError}</span> : null}
          </div>
          <Link to="/">Ver loja</Link>
        </header>
        <main id="admin-content" className="admin-content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
