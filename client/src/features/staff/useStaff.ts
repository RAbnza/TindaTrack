import {
  useCallback,
  useEffect,
  useState,
} from 'react'

import {
  ApiError,
} from '../../api/api'

import {
  getStaff,
} from '../../api/staff.api'

import type {
  StaffMember,
} from '../../types/staff'

function getStaffErrorMessage(
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
      return 'You do not have permission to manage staff.'
    }

    return error.message
  }

  return 'Unable to load staff. Please try again.'
}

export function useStaff() {
  const [
    staff,
    setStaff,
  ] = useState<StaffMember[]>(
    [],
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
          await getStaff()

        setStaff(result)
      } catch (error) {
        setError(
          getStaffErrorMessage(
            error,
          ),
        )
      } finally {
        setIsLoading(false)
      }
    }, [])

  useEffect(() => {
    let cancelled = false

    async function loadInitialStaff() {
      try {
        const result =
          await getStaff()

        if (cancelled) {
          return
        }

        setStaff(result)
      } catch (error) {
        if (cancelled) {
          return
        }

        setError(
          getStaffErrorMessage(
            error,
          ),
        )
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    void loadInitialStaff()

    return () => {
      cancelled = true
    }
  }, [])

  return {
    staff,
    isLoading,
    error,
    reload,
  }
}