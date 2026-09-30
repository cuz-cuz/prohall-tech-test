import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import App from './App'


describe('App', () => {
  it('renders the bootstrap home page', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>,
    )

    expect(
      screen.getByRole('heading', { name: /a base da sua próxima descoberta/i }),
    ).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent(/frontend operacional/i)
  })

  it('renders a not found page for unknown routes', () => {
    render(
      <MemoryRouter initialEntries={['/nao-existe']}>
        <App />
      </MemoryRouter>,
    )

    expect(
      screen.getByRole('heading', { name: /página não encontrada/i }),
    ).toBeInTheDocument()
  })
})
