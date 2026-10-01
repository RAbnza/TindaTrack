import {
  useCallback,
  useEffect,
  useState,
} from 'react'

import {
  ApiError,
} from '../../api/api'

import {
  getDashboard,
} from '../../api/dashboard.api'

import type {
  DashboardResponse,
} from '../../types/dashboard'

function getDashboardErrorMessage(
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

    return error.message
  }

  return 'Unable to load dashboard. Please try again.'
}

export function useDashboard() {
  const [
    dashboard,
    setDashboard,
  ] =
    useState<DashboardResponse | null>(
      null,
    )

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
          await getDashboard()

        setDashboard(result)
      } catch (error) {
        setError(
          getDashboardErrorMessage(
            error,
          ),
        )
      } finally {
        setIsLoading(false)
      }
    }, [])

  useEffect(() => {
    let cancelled = false

    async function loadInitialDashboard() {
      try {
        const result =
          await getDashboard()

        if (cancelled) {
          return
        }

        setDashboard(
          result,
        )
      } catch (error) {
        if (cancelled) {
          return
        }

        setError(
          getDashboardErrorMessage(
            error,
          ),
        )
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    void loadInitialDashboard()

    return () => {
      cancelled = true
    }
  }, [])

  return {
    dashboard,
    isLoading,
    error,
    reload,
  }
}