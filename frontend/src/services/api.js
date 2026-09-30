const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api'

export const API_BASE_URL = configuredBaseUrl.replace(/\/$/, '')

export async function getHealth({ signal } = {}) {
  const response = await fetch(`${API_BASE_URL}/health/`, { signal })

  if (!response.ok) {
    throw new Error('Não foi possível consultar a API.')
  }

  return response.json()
}
