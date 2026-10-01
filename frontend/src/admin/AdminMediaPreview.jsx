import { useState } from 'react'

import { formatCategory, formatCurrency } from '../utils/formatters'
import { formatAdminDateTime } from './adminFormatters'

/**
 * Source data of the product being priced, shown next to the listing form so
 * the operator can see what they are configuring without leaving the editor.
 */
export function AdminProductSummary({ product }) {
  if (!product) {
    return <p className="admin-source-card admin-source-card--empty">Selecione um produto para ver os dados de origem.</p>
  }

  return (
    <section className="admin-source-card" aria-label={`Dados de origem de ${product.title}`}>
      <AdminImagePreview src={product.image_url} alt={product.title} />
      <div className="admin-source-card__body">
        <strong>{product.title}</strong>
        <small>{product.brand || 'Sem marca'} · {formatCategory(product.category)} · ID {product.external_id}{product.sku ? ` · ${product.sku}` : ''}</small>
        <dl>
          <div><dt>Preço de origem</dt><dd>{formatCurrency(product.source_price)}</dd></div>
          <div><dt>Estoque de origem</dt><dd>{product.source_stock}</dd></div>
          <div><dt>Disponibilidade</dt><dd>{product.availability_status || 'Não informada'}</dd></div>
          <div><dt>Sincronizado</dt><dd>{formatAdminDateTime(product.last_synced_at)}</dd></div>
        </dl>
        <p className="admin-source-card__note">Estes são os dados do DummyJSON. Preço e estoque vendidos na loja são os do anúncio.</p>
      </div>
    </section>
  )
}

/**
 * Shows the image an URL actually resolves to, so a typo or a dead link is
 * visible while configuring instead of only on the storefront.
 */
export function AdminImagePreview({ src, alt = '', ratio }) {
  const [status, setStatus] = useState(src ? 'loading' : 'empty')
  const [lastSrc, setLastSrc] = useState(src)

  if (src !== lastSrc) {
    // A new URL starts loading again; adjusted during render, not in an effect.
    setLastSrc(src)
    setStatus(src ? 'loading' : 'empty')
  }

  return (
    <div className={`admin-image-preview${ratio ? ` admin-image-preview--${ratio}` : ''}`} data-status={status}>
      {src ? (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          onLoad={() => setStatus('loaded')}
          onError={() => setStatus('error')}
        />
      ) : null}
      {status === 'empty' ? <span>Sem imagem</span> : null}
      {status === 'error' ? <span>A imagem não carregou</span> : null}
    </div>
  )
}
