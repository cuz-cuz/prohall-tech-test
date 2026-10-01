import { useState } from 'react'

export function ShareButton({ title, text, label = 'Compartilhar link' }) {
  const [feedback, setFeedback] = useState('')

  async function share() {
    const url = window.location.href
    try {
      if (navigator.share) await navigator.share({ title, text, url })
      else if (navigator.clipboard) await navigator.clipboard.writeText(url)
      else throw new Error('clipboard-unavailable')
      setFeedback(navigator.share ? 'Compartilhamento aberto.' : 'Link copiado.')
    } catch (error) {
      if (error?.name !== 'AbortError') setFeedback('Copie o endereço desta página no navegador.')
    }
  }

  return (
    <div className="share-action">
      <button className="button button--secondary" type="button" onClick={share}>{label}</button>
      {feedback ? <span role="status" aria-live="polite">{feedback}</span> : null}
    </div>
  )
}
