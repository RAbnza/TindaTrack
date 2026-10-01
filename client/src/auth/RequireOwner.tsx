import {
  Navigate,
} from 'react-router-dom'

import {
  useAuth,
} from './useAuth'

import type {
  ReactNode,
} from 'react'

type RequireOwnerProps = {
  children: ReactNode
}

export function RequireOwner({
  children,
}: RequireOwnerProps) {
  const {
    user,
  } = useAuth()

  if (
    !user ||
    user.role !== 'OWNER'
  ) {
    return (
      <Navigate
        to="/inventory"
        replace
      />
    )
  }

  return children
}