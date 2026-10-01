import { useCallback, useRef, useState } from 'react'
import { Link, useOutletContext } from 'react-router-dom'

import { ProductCard } from '../components/ProductCard'
import { SmartImage } from '../components/SmartImage'
import { ProductGridSkeleton, StatePanel } from '../components/StatePanel'
import { useApiResource } from '../hooks/useApiResource'
import { getListings } from '../services/api'

function BannerAction({ href }) {
  if (!href) return null
  if (href.startsWith('/')) return <Link className="button button--primary" to={href}>Ver destaque</Link>
  return <a className="button button--primary" href={href}>Ver destaque</a>
}

function Hero({ banners }) {
  const trackRef = useRef(null)
  const [activeBanner, setActiveBanner] = useState(0)

  function goToBanner(nextIndex) {
    const boundedIndex = Math.max(0, Math.min(nextIndex, banners.length - 1))
    const track = trackRef.current
    if (track?.scrollTo) track.scrollTo({ left: track.clientWidth * boundedIndex, behavior: 'smooth' })
    setActiveBanner(boundedIndex)
  }

  function trackPosition() {
    const track = trackRef.current
    if (track?.clientWidth) setActiveBanner(Math.round(track.scrollLeft / track.clientWidth))
  }

  if (!banners.length) {
    return (
      <section className="hero hero--empty">
        <div className="hero__copy"><h1>Descobertas para todos os momentos.</h1><p>Explore uma vitrine organizada com preço e disponibilidade sempre visíveis.</p></div>
        <div className="hero__mosaic" aria-hidden="true"><span /><span /><span /></div>
      </section>
    )
  }

  return (
    <div className="hero-carousel-shell">
      <section className="hero-carousel" aria-label="Destaques da loja" ref={trackRef} onScroll={trackPosition}>
        {banners.map((banner, index) => {
          const Heading = index === 0 ? 'h1' : 'h2'
          return (
            <article className="hero" key={banner.id} aria-roledescription="slide" aria-label={`${index + 1} de ${banners.length}`}>
              <div className="hero__copy">
                <p className="hero__context">Destaque da semana</p>
                <Heading>{banner.title}</Heading>
                <p>Uma seleção preparada para deixar suas escolhas mais simples.</p>
                <BannerAction href={banner.link_url} />
              </div>
              <SmartImage className="hero__image" src={banner.image_url} alt={banner.alt_text || banner.title} eager={index === 0} sizes="(min-width: 40rem) 50vw, 100vw" />
            </article>
          )
        })}
      </section>
      {banners.length > 1 ? (
        <div className="hero-carousel__controls">
          <button type="button" onClick={() => goToBanner(activeBanner - 1)} disabled={activeBanner === 0} aria-label="Destaque anterior">←</button>
          <span>{activeBanner + 1} / {banners.length}</span>
          <button type="button" onClick={() => goToBanner(activeBanner + 1)} disabled={activeBanner === banners.length - 1} aria-label="Próximo destaque">→</button>
        </div>
      ) : null}
    </div>
  )
}

function EditorialCallout() {
  return (
    <section className="editorial-callout" aria-labelledby="editorial-title">
      <p className="page-context">Curadoria Mosaico</p>
      <h2 id="editorial-title">Beleza, autocuidado e estilo em uma só seleção.</h2>
      <p>Descubra maquiagem, skincare, perfumes, acessórios e moda feminina escolhidos para diferentes rotinas e ocasiões.</p>
      <Link className="button button--secondary" to="/produtos">Explorar o catálogo</Link>
    </section>
  )
}

export function HomePage() {
  const { homeState } = useOutletContext()
  const loadFeatured = useCallback((options) => getListings({ ordering: 'best_selling', page_size: 8 }, options), [])
  const listingState = useApiResource(loadFeatured)
  const banners = homeState.data?.banners ?? []
  const products = listingState.data?.results ?? []
  const productCount = listingState.data?.count ?? 0

  return (
    <main id="conteudo-principal">
      <div className="page-container home-flow">
        {homeState.status === 'loading' ? <div className="hero hero-skeleton" aria-label="Carregando destaques" aria-busy="true"><div><span className="skeleton-block hero-skeleton__title" /><span className="skeleton-block hero-skeleton__text" /><span className="skeleton-block hero-skeleton__button" /></div><span className="skeleton-block hero-skeleton__image" /></div> : null}
        {homeState.status === 'error' ? <StatePanel title="A vitrine não carregou" message="Confira sua conexão e tente novamente. Seus dados continuam seguros." actionLabel="Tentar novamente" onAction={homeState.retry} /> : null}
        {homeState.status === 'success' ? <Hero banners={banners} /> : null}

        <EditorialCallout />

        <section className="store-section" aria-labelledby="featured-title">
          <div className="section-heading"><div><h2 id="featured-title">Mais procurados</h2></div>{products.length ? <span>{productCount} {productCount === 1 ? 'opção disponível' : 'opções disponíveis'}</span> : null}</div>
          {listingState.status === 'loading' ? <ProductGridSkeleton count={4} /> : null}
          {listingState.status === 'error' ? <StatePanel title="Não foi possível carregar os produtos" message="Tente novamente em alguns instantes." actionLabel="Recarregar produtos" onAction={listingState.retry} /> : null}
          {listingState.status === 'success' && !products.length ? <StatePanel title="A vitrine está sendo preparada" message="Ainda não há anúncios ativos. Volte em breve para conferir as novidades." /> : null}
          {products.length ? <><div className="product-row">{products.map((product) => <ProductCard key={product.id} product={product} />)}</div><Link className="button button--secondary section-cta" to="/produtos">Ver todos os produtos</Link></> : null}
        </section>
      </div>
    </main>
  )
}
