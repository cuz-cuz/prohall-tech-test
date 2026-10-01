import { useState } from 'react'
import { Link } from 'react-router-dom'

import { useCart } from '../cart/useCart'
import {
  calculateSavingsCents,
  formatCategory,
  formatCurrency,
  formatCurrencyFromCents,
} from '../utils/formatters'
import { SmartImage } from './SmartImage'

function discountBadgeClass(percentage) {
  if (percentage >= 20) return 'product-badge--discount-super'
  if (percentage >= 10) return 'product-badge--discount-medium'
  return 'product-badge--discount-low'
}

export function ProductCard({ product, className = '' }) {
  const { addItem, items } = useCart()
  const [quantity, setQuantity] = useState(1)
  const [feedback, setFeedback] = useState('')
  const images = Array.from(new Set([...(product.images ?? []), product.thumbnail_url].filter(Boolean)))
  const image = images[0]
  const secondaryImage = images[1]
  const lowStock = product.is_available && product.stock_quantity <= 5
  const discountPercentage = Number(product.discount_percentage) || 0
  const savingsCents = product.is_on_sale
    ? calculateSavingsCents(product.price, product.effective_price)
    : null
  const cartItem = items.find((item) => item.id === product.id)
  const availableToAdd = Math.max(0, product.stock_quantity - (cartItem?.quantity ?? 0))
  const selectedQuantity = Math.min(quantity, Math.max(1, availableToAdd))

  function handleAdd() {
    if (!product.is_available || availableToAdd < 1) return
    addItem(product, selectedQuantity)
    setFeedback(`${selectedQuantity} ${selectedQuantity === 1 ? 'unidade adicionada' : 'unidades adicionadas'}.`)
    setQuantity(1)
  }

  return (
    <article className={`product-card ${className}`.trim()}>
      <Link className="product-card__image-link" to={`/produto/${product.slug}`}>
        <div className="product-card__badges">
          {discountPercentage > 0 ? (
            <span className={discountBadgeClass(discountPercentage)} aria-label={`Desconto de ${Math.round(discountPercentage)}%`}>
              -{Math.round(discountPercentage)}%
            </span>
          ) : null}
          {product.free_shipping ? <span className="product-badge--shipping">Frete grátis</span> : null}
        </div>
        <SmartImage
          className="product-card__image product-card__image--primary"
          src={image}
          alt={product.title}
          sizes="(min-width: 64rem) 18rem, (min-width: 40rem) 44vw, 78vw"
        />
        {secondaryImage ? (
          <SmartImage
            className="product-card__image product-card__image--secondary"
            src={secondaryImage}
            alt=""
            sizes="(min-width: 64rem) 18rem, (min-width: 40rem) 44vw, 78vw"
          />
        ) : null}
      </Link>
      <div className="product-card__content">
        <p className="product-card__meta">
          {formatCategory(product.category)}
        </p>
        <h3>
          <Link to={`/produto/${product.slug}`}>{product.title}</Link>
        </h3>
        <div className={`product-card__price ${product.is_on_sale ? 'is-on-sale' : ''}`} aria-label="Preço">
          {product.is_on_sale ? (
            <del>{formatCurrency(product.price)}</del>
          ) : null}
          <strong>{formatCurrency(product.effective_price)}</strong>
        </div>
        {savingsCents ? (
          <p className="product-card__savings">
            Você economiza <strong>{formatCurrencyFromCents(savingsCents)}</strong>
          </p>
        ) : null}
        {product.installment_count && product.installment_value ? (
          <p className="product-card__installment">
            ou {product.installment_count}x de {formatCurrency(product.installment_value)} sem juros
          </p>
        ) : null}
        <p
          className={`availability ${product.is_available ? '' : 'availability--unavailable'} ${lowStock ? 'availability--low' : ''}`}
        >
          <span aria-hidden="true" />
          {product.is_available
            ? lowStock
              ? `Últimas ${product.stock_quantity} unidade${product.stock_quantity === 1 ? '' : 's'}`
              : `${product.stock_quantity} unidades em estoque`
            : 'Indisponível'}
        </p>
        <Link className="product-card__action" to={`/produto/${product.slug}`}>
          Ver detalhes
        </Link>
        <div className="product-card__purchase">
          <div className="product-card__quantity" role="group" aria-label={`Quantidade de ${product.title}`}>
            <button type="button" onClick={() => setQuantity((value) => Math.max(1, value - 1))} disabled={selectedQuantity <= 1} aria-label={`Diminuir quantidade de ${product.title}`}>−</button>
            <span aria-live="polite">{selectedQuantity}</span>
            <button type="button" onClick={() => setQuantity((value) => Math.min(availableToAdd, value + 1))} disabled={!product.is_available || selectedQuantity >= availableToAdd} aria-label={`Aumentar quantidade de ${product.title}`}>+</button>
          </div>
          <button className="product-card__add" type="button" onClick={handleAdd} disabled={!product.is_available || availableToAdd < 1} aria-label={`Adicionar ${product.title} ao carrinho`}>
            {availableToAdd < 1 && product.is_available ? 'No limite' : 'Adicionar'}
          </button>
          {feedback ? <p className="product-card__feedback" role="status">{feedback}</p> : null}
        </div>
      </div>
    </article>
  )
}
