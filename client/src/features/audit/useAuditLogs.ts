import {
  useCallback,
  useEffect,
  useState,
} from 'react'

import {
  ApiError,
} from '../../api/api'

import {
  getAuditLogs,
} from '../../api/audit-logs.api'

import type {
  AuditLog,
} from '../../types/audit-log'

export function useAuditLogs() {
  const [
    logs,
    setLogs,
  ] = useState<AuditLog[]>([])

  const [
    isLoading,
    setIsLoading,
  ] = useState(true)

  const [
    error,
    setError,
  ] = useState<string | null>(
    null,
  )

  const loadAuditLogs =
    useCallback(async () => {
      setIsLoading(true)
      setError(null)

      try {
        const result =
          await getAuditLogs()

        setLogs(result)
      } catch (error) {
        setLogs([])

        if (
          error instanceof ApiError
        ) {
          if (
            error.status === 401
          ) {
            setError(
              'Your session has expired. Please sign in again.',
            )

            return
          }

          if (
            error.status === 403
          ) {
            setError(
              'You do not have permission to view audit history.',
            )

            return
          }

          setError(
            error.message,
          )

          return
        }

        setError(
          'Unable to load audit history. Please try again.',
        )
      } finally {
        setIsLoading(false)
      }
    }, [])

  useEffect(() => {
    void loadAuditLogs()
  }, [loadAuditLogs])

  return {
    logs,
    isLoading,
    error,
    reload: loadAuditLogs,
  }
}