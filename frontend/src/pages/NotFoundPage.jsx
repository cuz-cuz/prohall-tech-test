import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <main id="conteudo-principal" className="page-container not-found">
      <p className="error-code">Erro 404</p>
      <h1>Esta página não faz parte da vitrine.</h1>
      <p>O endereço pode ter mudado ou o conteúdo não está mais disponível.</p>
      <Link className="button button--primary" to="/">
        Voltar para o início
      </Link>
    </main>
  )
}
