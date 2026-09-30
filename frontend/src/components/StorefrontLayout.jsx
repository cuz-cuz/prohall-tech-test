import { Link, NavLink, Outlet } from 'react-router-dom'

import { useApiResource } from '../hooks/useApiResource'
import { getStorefrontHome } from '../services/api'

export function StorefrontLayout() {
  const homeState = useApiResource(getStorefrontHome)
  const menus = homeState.data?.menus ?? []

  return (
    <div className="site-frame">
      <a className="skip-link" href="#conteudo-principal">
        Pular para o conteúdo
      </a>
      <header className="site-header">
        <div className="site-header__main page-container">
          <Link className="brand" to="/" aria-label="Mosaico — página inicial">
            <span className="brand__tiles" aria-hidden="true">
              <i />
              <i />
              <i />
            </span>
            Mosaico
          </Link>
          <p>Sua próxima descoberta</p>
        </div>
        <nav className="department-nav" aria-label="Departamentos">
          <div className="department-nav__track page-container">
            <NavLink to="/" end>
              Início
            </NavLink>
            {homeState.status === 'loading' ? (
              <span className="department-nav__loading">Carregando departamentos…</span>
            ) : null}
            {menus.map((menu) => (
              <NavLink key={menu.id} to={`/menu/${menu.slug}`}>
                {menu.name}
              </NavLink>
            ))}
          </div>
        </nav>
      </header>

      <Outlet context={{ homeState }} />

      <footer className="site-footer">
        <div className="page-container site-footer__content">
          <div>
            <strong>Mosaico</strong>
            <p>Variedade organizada para escolhas mais simples.</p>
          </div>
          <Link to="/">Voltar ao início</Link>
        </div>
      </footer>
    </div>
  )
}
