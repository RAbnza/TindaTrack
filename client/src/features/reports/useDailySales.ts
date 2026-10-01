import {
  useEffect,
  useState,
} from 'react'

import {
  ApiError,
} from '../../api/api'

import {
  getDailySales,
} from '../../api/reports.api'

import type {
  DailySalesReport,
} from '../../types/report'

export function useDailySales(
  date: string,
) {
  const [
    report,
    setReport,
  ] =
    useState<DailySalesReport | null>(
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

  useEffect(() => {
    let cancelled = false

    async function loadReport() {
      setIsLoading(true)
      setError(null)

      try {
        const result =
          await getDailySales(
            date,
          )

        if (cancelled) {
          return
        }

        setReport(result)
      } catch (error) {
        if (cancelled) {
          return
        }

        setReport(null)

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
              'You do not have permission to view sales reports.',
            )

            return
          }

          setError(
            error.message,
          )

          return
        }

        setError(
          'Unable to load the daily sales report. Please try again.',
        )
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    void loadReport()

    return () => {
      cancelled = true
    }
  }, [date])

  return {
    report,
    isLoading,
    error,
  }
}