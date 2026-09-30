import { useCallback, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import { SmartImage } from '../components/SmartImage'
import { StatePanel } from '../components/StatePanel'
import { useApiResource } from '../hooks/useApiResource'
import { getListing } from '../services/api'
import { formatCurrency, formatCategory } from '../utils/formatters'

function ProductGallery({ product }) {
  const images = Array.from(
    new Set([product.thumbnail_url, ...(product.images ?? [])].filter(Boolean)),
  )
  const [selectedImage, setSelectedImage] = useState(images[0])

  return (
    <div className="product-gallery">
      <SmartImage
        className="product-gallery__main"
        src={selectedImage}
        alt={product.title}
        eager
      />
      {images.length > 1 ? (
        <div className="product-gallery__thumbnails" aria-label="Imagens do produto">
          {images.slice(0, 5).map((image, index) => (
            <button
              type="button"
              className={image === selectedImage ? 'is-selected' : ''}
              onClick={() => setSelectedImage(image)}
              aria-label={`Ver imagem ${index + 1} de ${product.title}`}
              aria-pressed={image === selectedImage}
              key={image}
            >
              <SmartImage src={image} alt="" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}

export function ProductDetailPage() {
  const { slug } = useParams()
  const loadListing = useCallback((options) => getListing(slug, options), [slug])
  const state = useApiResource(loadListing)
  const product = state.data

  return (
    <main id="conteudo-principal" className="page-container product-page">
      {state.status === 'loading' ? (
        <div className="detail-skeleton" aria-label="Carregando produto" aria-busy="true">
          <span className="skeleton-block" />
          <div>
            <span className="skeleton-block" />
            <span className="skeleton-block" />
            <span className="skeleton-block" />
          </div>
        </div>
      ) : null}

      {state.status === 'error' ? (
        <StatePanel
          title="Produto não encontrado"
          message="O anúncio pode ter sido removido ou está temporariamente indisponível."
          actionLabel="Tentar novamente"
          onAction={state.retry}
        />
      ) : null}

      {state.status === 'success' && product ? (
        <>
          <nav className="breadcrumb" aria-label="Navegação estrutural">
            <Link to="/">Início</Link>
            <span aria-hidden="true">/</span>
            <span aria-current="page">{product.title}</span>
          </nav>
          <article className="product-detail">
            <ProductGallery key={product.id} product={product} />
            <div className="product-detail__content">
              <p className="product-detail__category">
                {[product.brand, formatCategory(product.category)]
                  .filter(Boolean)
                  .join(' · ')}
              </p>
              <h1>{product.title}</h1>
              <p className="product-detail__sku">SKU {product.sku || 'não informado'}</p>
              <div className="product-detail__price">
                {product.is_on_sale ? (
                  <p>
                    De <del>{formatCurrency(product.price)}</del>
                  </p>
                ) : null}
                <strong>{formatCurrency(product.effective_price)}</strong>
                {product.is_on_sale ? <span>Preço promocional</span> : null}
              </div>
              <div
                className={`stock-panel ${product.is_available ? '' : 'stock-panel--unavailable'}`}
              >
                <strong>{product.is_available ? 'Disponível' : 'Indisponível'}</strong>
                <span>
                  {product.is_available
                    ? `${product.stock_quantity} unidade${product.stock_quantity === 1 ? '' : 's'} em estoque`
                    : 'Este item não pode ser comprado no momento.'}
                </span>
              </div>
              <div className="product-detail__description">
                <h2>Sobre o produto</h2>
                <p>{product.description || 'Descrição não informada.'}</p>
              </div>
              <Link className="button button--secondary" to="/">
                Continuar explorando
              </Link>
            </div>
          </article>
        </>
      ) : null}
    </main>
  )
}
