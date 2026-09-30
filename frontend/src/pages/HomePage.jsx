import { Link, useOutletContext } from 'react-router-dom'

import { ProductCard } from '../components/ProductCard'
import { SmartImage } from '../components/SmartImage'
import { ProductGridSkeleton, StatePanel } from '../components/StatePanel'
import { useApiResource } from '../hooks/useApiResource'
import { getListings } from '../services/api'

function BannerAction({ href }) {
  if (!href) return null

  const label = 'Ver destaque'
  if (href.startsWith('/')) {
    return (
      <Link className="button button--primary" to={href}>
        {label}
      </Link>
    )
  }

  return (
    <a className="button button--primary" href={href}>
      {label}
    </a>
  )
}

function Hero({ banners }) {
  if (!banners.length) {
    return (
      <section className="hero hero--empty">
        <div className="hero__copy">
          <h1>Descobertas para todos os momentos.</h1>
          <p>
            Explore uma vitrine organizada com preço e disponibilidade sempre
            visíveis.
          </p>
        </div>
        <div className="hero__mosaic" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
      </section>
    )
  }

  return (
    <section className="hero-carousel" aria-label="Destaques da loja">
      {banners.map((banner, index) => {
        const Heading = index === 0 ? 'h1' : 'h2'

        return (
          <article className="hero" key={banner.id}>
            <div className="hero__copy">
              <p className="hero__context">Destaque da semana</p>
              <Heading>{banner.title}</Heading>
              <p>Uma seleção preparada para deixar suas escolhas mais simples.</p>
              <BannerAction href={banner.link_url} />
            </div>
            <SmartImage
              className="hero__image"
              src={banner.image_url}
              alt={banner.alt_text || banner.title}
              eager={index === 0}
            />
          </article>
        )
      })}
    </section>
  )
}

function StoreBenefits() {
  const benefits = [
    ['Preço transparente', 'Valor normal e promocional lado a lado.'],
    ['Estoque visível', 'Disponibilidade informada antes de avançar.'],
    ['Variedade organizada', 'Menus definidos pela equipe da loja.'],
  ]

  return (
    <section className="benefit-strip" aria-label="Como a Mosaico ajuda você">
      {benefits.map(([title, description]) => (
        <div key={title}>
          <span aria-hidden="true" />
          <p>
            <strong>{title}</strong>
            {description}
          </p>
        </div>
      ))}
    </section>
  )
}

export function HomePage() {
  const { homeState } = useOutletContext()
  const listingState = useApiResource(getListings)
  const banners = homeState.data?.banners ?? []
  const menus = homeState.data?.menus ?? []
  const products = listingState.data ?? []

  return (
    <main id="conteudo-principal">
      <div className="page-container home-flow">
        {homeState.status === 'loading' ? (
          <div className="hero hero-skeleton" aria-label="Carregando destaques" aria-busy="true">
            <div>
              <span className="skeleton-block hero-skeleton__title" />
              <span className="skeleton-block hero-skeleton__text" />
              <span className="skeleton-block hero-skeleton__button" />
            </div>
            <span className="skeleton-block hero-skeleton__image" />
          </div>
        ) : null}

        {homeState.status === 'error' ? (
          <StatePanel
            title="A vitrine não carregou"
            message="Confira sua conexão e tente novamente. Seus dados continuam seguros."
            actionLabel="Tentar novamente"
            onAction={homeState.retry}
          />
        ) : null}

        {homeState.status === 'success' ? <Hero banners={banners} /> : null}

        <StoreBenefits />

        <section className="store-section" aria-labelledby="featured-title">
          <div className="section-heading">
            <div>
              <h2 id="featured-title">Mais procurados</h2>
            </div>
            {products.length ? (
              <span>
                {products.length} {products.length === 1 ? 'opção disponível' : 'opções disponíveis'}
              </span>
            ) : null}
          </div>

          {listingState.status === 'loading' ? <ProductGridSkeleton count={4} /> : null}
          {listingState.status === 'error' ? (
            <StatePanel
              title="Não foi possível carregar os produtos"
              message="Tente novamente em alguns instantes."
              actionLabel="Recarregar produtos"
              onAction={listingState.retry}
            />
          ) : null}
          {listingState.status === 'success' && !products.length ? (
            <StatePanel
              title="A vitrine está sendo preparada"
              message="Ainda não há anúncios ativos. Volte em breve para conferir as novidades."
            />
          ) : null}
          {products.length ? (
            <div className="product-row">
              {products.slice(0, 8).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : null}
        </section>

        <section className="store-section" aria-labelledby="menu-title">
          <div className="section-heading">
            <div>
              <h2 id="menu-title">Compre por categoria</h2>
            </div>
          </div>
          {homeState.status === 'success' && menus.length ? (
            <div className="menu-list">
              {menus.map((menu, index) => (
                <Link className="menu-tile" to={`/menu/${menu.slug}`} key={menu.id}>
                  <span aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
                  <strong>{menu.name}</strong>
                  <small>Ver produtos</small>
                </Link>
              ))}
            </div>
          ) : null}
          {homeState.status === 'success' && !menus.length ? (
            <StatePanel
              title="Nenhum menu disponível"
              message="A equipe da loja ainda está organizando os departamentos."
            />
          ) : null}
        </section>
      </div>
    </main>
  )
}
