import { Link } from 'react-router-dom'

import { formatCategory, formatCurrency } from '../utils/formatters'
import { SmartImage } from './SmartImage'

export function ProductCard({ product, className = '' }) {
  const image = product.thumbnail_url || product.images?.[0]

  return (
    <article className={`product-card ${className}`.trim()}>
      <Link className="product-card__image-link" to={`/produto/${product.slug}`}>
        <SmartImage
          className="product-card__image"
          src={image}
          alt={product.title}
        />
      </Link>
      <div className="product-card__content">
        <p className="product-card__meta">
          {[product.brand, formatCategory(product.category)]
            .filter(Boolean)
            .join(' · ')}
        </p>
        <h3>
          <Link to={`/produto/${product.slug}`}>{product.title}</Link>
        </h3>
        <div className="product-card__price" aria-label="Preço">
          {product.is_on_sale ? (
            <del>{formatCurrency(product.price)}</del>
          ) : null}
          <strong>{formatCurrency(product.effective_price)}</strong>
        </div>
        <p
          className={`availability ${product.is_available ? '' : 'availability--unavailable'}`}
        >
          <span aria-hidden="true" />
          {product.is_available ? 'Em estoque' : 'Indisponível'}
        </p>
        <Link className="product-card__action" to={`/produto/${product.slug}`}>
          Ver detalhes
        </Link>
      </div>
    </article>
  )
}
