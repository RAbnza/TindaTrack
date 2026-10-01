import {
  Navigate,
  useLocation,
} from 'react-router-dom'

import {
  useAuth,
} from './useAuth'

import type {
  ReactNode,
} from 'react'

type RequireAuthProps = {
  children: ReactNode
}

export function RequireAuth({
  children,
}: RequireAuthProps) {
  const {
    isAuthenticated,
  } = useAuth()

  const location =
    useLocation()

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          from: location.pathname,
        }}
      />
    )
  }

  return children
}