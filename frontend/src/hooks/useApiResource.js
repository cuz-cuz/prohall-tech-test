import { useCallback, useEffect, useState } from 'react'

export function useApiResource(loader, { enabled = true } = {}) {
  const [attempt, setAttempt] = useState(0)
  const [state, setState] = useState({
    status: 'idle',
    data: null,
    error: null,
  })

  useEffect(() => {
    const controller = new AbortController()

    if (!enabled) {
      Promise.resolve().then(() => {
        if (!controller.signal.aborted) {
          setState({ status: 'idle', data: null, error: null })
        }
      })
      return () => controller.abort()
    }

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
        if (!controller.signal.aborted) {
          setState({ status: 'success', data, error: null })
        }
      })
      .catch((error) => {
        if (error.name !== 'AbortError') {
          setState({ status: 'error', data: null, error })
        }
      })

    return () => controller.abort()
  }, [attempt, enabled, loader])

  const retry = useCallback(() => setAttempt((value) => value + 1), [])

  return { ...state, retry }
}
