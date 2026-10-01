import { useState } from 'react'

export function SmartImage({
  src,
  alt,
  className = '',
  eager = false,
  sizes = '100vw',
}) {
  const [failedSrc, setFailedSrc] = useState(null)
  const failed = failedSrc === src

  if (!src || failed) {
    return (
      <span
        className={`image-fallback ${className}`.trim()}
        role="img"
        aria-label={alt || 'Imagem indisponível'}
      >
        <span aria-hidden="true">M</span>
        <small>Imagem indisponível</small>
      </span>
    )
  }

  return (
    <img
      className={className}
      src={src}
      alt={alt}
      loading={eager ? 'eager' : 'lazy'}
      fetchPriority={eager ? 'high' : 'auto'}
      decoding="async"
      sizes={sizes}
      onError={() => setFailedSrc(src)}
    />
  )
}
