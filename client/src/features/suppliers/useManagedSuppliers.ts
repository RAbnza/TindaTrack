import {
  useCallback,
  useEffect,
  useState,
} from 'react'

import {
  ApiError,
} from '../../api/api'

import {
  getManagedSuppliers,
} from '../../api/suppliers.api'

import type {
  ManagedSupplier,
} from '../../types/supplier'

function getErrorMessage(
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
      return 'You do not have permission to manage suppliers.'
    }

    return error.message
  }

  return 'Unable to load suppliers. Please try again.'
}

export function useManagedSuppliers() {
  const [
    suppliers,
    setSuppliers,
  ] =
    useState<ManagedSupplier[]>(
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
          await getManagedSuppliers()

        setSuppliers(result)
      } catch (error) {
        setError(
          getErrorMessage(
            error,
          ),
        )
      } finally {
        setIsLoading(false)
      }
    }, [])

  useEffect(() => {
    let cancelled = false

    async function loadInitialSuppliers() {
      try {
        const result =
          await getManagedSuppliers()

        if (cancelled) {
          return
        }

        setSuppliers(result)
      } catch (error) {
        if (cancelled) {
          return
        }

        setError(
          getErrorMessage(
            error,
          ),
        )
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    void loadInitialSuppliers()

    return () => {
      cancelled = true
    }
  }, [])

  return {
    suppliers,
    isLoading,
    error,
    reload,
  }
}