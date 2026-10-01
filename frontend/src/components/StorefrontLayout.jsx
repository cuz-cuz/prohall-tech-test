import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'

import { SearchForm } from './SearchForm'
import { useCart } from '../cart/useCart'
import { useApiResource } from '../hooks/useApiResource'
import { getStorefrontHome } from '../services/api'

export function StorefrontLayout() {
  const homeState = useApiResource(getStorefrontHome)
  const { totalItems } = useCart()
  const menus = homeState.data?.menus ?? []
  const location = useLocation()
  const currentQuery =
    location.pathname === '/busca'
      ? new URLSearchParams(location.search).get('q') ?? ''
      : ''

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
          <SearchForm key={`${location.pathname}:${currentQuery}`} initialQuery={currentQuery} />
          <NavLink
            className="cart-link"
            to="/carrinho"
            aria-label={
              totalItems === 1
                ? 'Carrinho com 1 item'
                : `Carrinho com ${totalItems} itens`
            }
          >
            Carrinho
            <span aria-hidden="true">{totalItems}</span>
          </NavLink>
        </div>
        <nav className="department-nav" aria-label="Departamentos">
          <div className="department-nav__track page-container">
            <NavLink to="/" end>
              Início
            </NavLink>
            <NavLink to="/produtos">Todos os produtos</NavLink>
            {homeState.status === 'loading' ? (
              <span className="department-nav__loading">Carregando departamentos…</span>
            ) : null}
            {menus.map((menu) => (
              <NavLink key={menu.id} to={`/menu/${menu.slug}`}>
                {menu.name}
              </NavLink>
            ))}
            <NavLink to="/meus-pedidos">Meus pedidos</NavLink>
          </div>
        </nav>
      </header>

      <Outlet context={{ homeState }} />

      <footer className="site-footer">
        <div className="page-container site-footer__content">
          <div className="site-footer__brand">
            <strong>Mosaico</strong>
            <p>Moda, beleza e autocuidado em uma curadoria feita para escolhas mais simples.</p>
          </div>
          <nav aria-label="Comprar">
            <strong>Comprar</strong>
            <Link to="/produtos">Todos os produtos</Link>
            <Link to="/menu/beleza">Beleza</Link>
            <Link to="/menu/perfumes">Perfumes</Link>
            <Link to="/menu/roupas">Roupas</Link>
          </nav>
          <nav aria-label="Sua conta">
            <strong>Sua conta</strong>
            <Link to="/carrinho">Carrinho</Link>
            <Link to="/meus-pedidos">Meus pedidos</Link>
            <Link to="/acesso">Acessar pedidos</Link>
          </nav>
          <div className="site-footer__about">
            <strong>Compra de demonstração</strong>
            <p>Pagamento simulado e estoque conferido pelo servidor antes de cada pedido.</p>
            <div className="payment-badges" aria-label="Formas de pagamento demonstradas"><span>Pix</span><span>Visa</span><span>Mastercard</span><span>Elo</span></div>
          </div>
        </div>
        <div className="page-container site-footer__legal"><span>© 2026 Mosaico</span><span>Projeto técnico · nenhum pagamento real é processado</span></div>
      </footer>
    </div>
  )
}
