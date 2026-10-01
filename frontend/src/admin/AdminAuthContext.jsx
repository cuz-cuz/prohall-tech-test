import { useCallback, useEffect, useMemo, useState } from 'react'

import { getAdminSession, loginAdmin, logoutAdmin } from '../services/api'
import { AdminAuthContext } from './AdminAuthState'

export function AdminAuthProvider({ children }) {
  const [state, setState] = useState({
    status: 'loading',
    user: null,
    error: null,
  })
  const [submitting, setSubmitting] = useState(false)

  const refreshSession = useCallback(async ({ signal } = {}) => {
    setState((current) => ({ ...current, status: 'loading', error: null }))
    try {
      const session = await getAdminSession({ signal })
      setState({
        status: session.authenticated ? 'authenticated' : 'anonymous',
        user: session.user,
        error: null,
      })
      return session
    } catch (error) {
      if (error.name !== 'AbortError') {
        setState({ status: 'error', user: null, error })
      }
      throw error
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    getAdminSession({ signal: controller.signal })
      .then((session) => {
        setState({
          status: session.authenticated ? 'authenticated' : 'anonymous',
          user: session.user,
          error: null,
        })
      })
      .catch((error) => {
        if (error.name !== 'AbortError') {
          setState({ status: 'error', user: null, error })
        }
      })
    return () => controller.abort()
  }, [])

  const signIn = useCallback(async (username, password) => {
    setSubmitting(true)
    try {
      const session = await loginAdmin(username, password)
      setState({ status: 'authenticated', user: session.user, error: null })
      return session
    } finally {
      setSubmitting(false)
    }
  }, [])

  const signOut = useCallback(async () => {
    setSubmitting(true)
    try {
      await logoutAdmin()
      setState({ status: 'anonymous', user: null, error: null })
    } finally {
      setSubmitting(false)
    }
  }, [])

  const value = useMemo(
    () => ({ ...state, submitting, refreshSession, signIn, signOut }),
    [state, submitting, refreshSession, signIn, signOut],
  )

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>
}
