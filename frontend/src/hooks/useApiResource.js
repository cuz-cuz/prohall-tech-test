import { useCallback, useEffect, useState } from 'react'

export function useApiResource(loader) {
  const [attempt, setAttempt] = useState(0)
  const [state, setState] = useState({
    status: 'idle',
    data: null,
    error: null,
  })

  useEffect(() => {
    const controller = new AbortController()

    Promise.resolve().then(() => {
      if (!controller.signal.aborted) {
        setState((current) => ({
          status: 'loading',
          data: current.data,
          error: null,
        }))
      }
    })

    loader({ signal: controller.signal })
      .then((data) => {
        setState({ status: 'success', data, error: null })
      })
      .catch((error) => {
        if (error.name !== 'AbortError') {
          setState({ status: 'error', data: null, error })
        }
      })

    return () => controller.abort()
  }, [attempt, loader])

  const retry = useCallback(() => setAttempt((value) => value + 1), [])

  return { ...state, retry }
}
