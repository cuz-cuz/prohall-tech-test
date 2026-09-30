import { Link, Route, Routes } from 'react-router-dom'
import './App.css'

function HomePage() {
  return (
    <main className="shell">
      <p className="eyebrow">Mosaico</p>
      <h1>A base da sua próxima descoberta.</h1>
      <p className="intro">
        A estrutura inicial da loja está pronta. Produtos, busca e checkout serão
        adicionados nas próximas fases.
      </p>
      <div className="status" role="status">
        <span aria-hidden="true" />
        Frontend operacional
      </div>
    </main>
  )
}

function NotFoundPage() {
  return (
    <main className="shell">
      <p className="eyebrow">Erro 404</p>
      <h1>Página não encontrada.</h1>
      <Link to="/">Voltar para o início</Link>
    </main>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
