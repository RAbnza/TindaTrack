import {
  useCallback,
  useEffect,
  useState,
  type ReactNode,
} from 'react'

import {
  login as loginRequest,
} from '../api/auth.api'

import {
  AUTH_SESSION_CLEARED_EVENT,
  clearStoredAuthSession,
  getStoredAuthSession,
  storeAuthSession,
} from './auth-storage'

import {
  AuthContext,
} from './auth-context'

import type {
  AuthUser,
  LoginRequest,
} from '../types/auth'

type AuthProviderProps = {
  children: ReactNode
}

export function AuthProvider({
  children,
}: AuthProviderProps) {
  const [
    user,
    setUser,
  ] = useState<AuthUser | null>(
    () =>
      getStoredAuthSession()
        ?.user ?? null,
  )

  useEffect(() => {
    function handleSessionCleared() {
      setUser(null)
    }

    window.addEventListener(
      AUTH_SESSION_CLEARED_EVENT,
      handleSessionCleared,
    )

    return () => {
      window.removeEventListener(
        AUTH_SESSION_CLEARED_EVENT,
        handleSessionCleared,
      )
    }
  }, [])

  const login = useCallback(
    async (
      credentials: LoginRequest,
    ) => {
      const session =
        await loginRequest(
          credentials,
        )

      storeAuthSession(session)
      setUser(session.user)
    },
    [],
  )

  const logout = useCallback(
    () => {
      clearStoredAuthSession()
      setUser(null)
    },
    [],
  )

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated:
          user !== null,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}