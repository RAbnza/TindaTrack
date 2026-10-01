import {
  useCallback,
  useEffect,
  useState,
} from 'react'

import {
  ApiError,
} from '../../api/api'

import {
  getSetupStatus,
} from '../../api/setup.api'

function getSetupStatusErrorMessage(
  error: unknown,
): string {
  if (
    error instanceof ApiError
  ) {
    return error.message
  }

  return 'Unable to check TindaTrack setup status. Please try again.'
}

export function useSetupStatus() {
  const [
    setupRequired,
    setSetupRequired,
  ] = useState<boolean | null>(
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
          await getSetupStatus()

        setSetupRequired(
          result.setupRequired,
        )
      } catch (error) {
        setError(
          getSetupStatusErrorMessage(
            error,
          ),
        )
      } finally {
        setIsLoading(false)
      }
    }, [])

  useEffect(() => {
    let cancelled = false

    async function loadInitialStatus() {
      try {
        const result =
          await getSetupStatus()

        if (cancelled) {
          return
        }

        setSetupRequired(
          result.setupRequired,
        )
      } catch (error) {
        if (cancelled) {
          return
        }

        setError(
          getSetupStatusErrorMessage(
            error,
          ),
        )
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    void loadInitialStatus()

    return () => {
      cancelled = true
    }
  }, [])

  return {
    setupRequired,
    isLoading,
    error,
    reload,
  }
}