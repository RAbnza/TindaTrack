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

function getAuditErrorMessage(
  error: unknown,
): string {
  if (
    error instanceof ApiError
  ) {
    if (
      error.status === 401
    ) {
      return 'Your session has expired. Please sign in again.'
    }

    if (
      error.status === 403
    ) {
      return 'You do not have permission to view audit history.'
    }

    return error.message
  }

  return 'Unable to load audit history. Please try again.'
}

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

  const reload =
    useCallback(async () => {
      setIsLoading(true)
      setError(null)

      try {
        const result =
          await getAuditLogs()

        setLogs(result)
      } catch (error) {
        setLogs([])

        setError(
          getAuditErrorMessage(
            error,
          ),
        )
      } finally {
        setIsLoading(false)
      }
    }, [])

  useEffect(() => {
    let cancelled = false

    async function loadInitialAuditLogs() {
      try {
        const result =
          await getAuditLogs()

        if (cancelled) {
          return
        }

        setLogs(result)
      } catch (error) {
        if (cancelled) {
          return
        }

        setLogs([])

        setError(
          getAuditErrorMessage(
            error,
          ),
        )
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    void loadInitialAuditLogs()

    return () => {
      cancelled = true
    }
  }, [])

  return {
    logs,
    isLoading,
    error,
    reload,
  }
}