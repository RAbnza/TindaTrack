import {
  useCallback,
  useEffect,
  useState,
} from 'react'

import {
  ApiError,
} from '../../api/api'

import {
  getSuppliers,
} from '../../api/suppliers.api'

import type {
  Supplier,
} from '../../types/supplier'

function getSuppliersErrorMessage(
  error: unknown,
): string {
  if (
    error instanceof ApiError &&
    error.status === 401
  ) {
    return 'Your session has expired. Please sign in again.'
  }

  if (
    error instanceof ApiError
  ) {
    return error.message
  }

  return 'Unable to load suppliers. Please try again.'
}

export function useSuppliers() {
  const [
    suppliers,
    setSuppliers,
  ] = useState<Supplier[]>([])

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
          await getSuppliers()

        setSuppliers(result)
      } catch (error) {
        setError(
          getSuppliersErrorMessage(
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
          await getSuppliers()

        if (cancelled) {
          return
        }

        setSuppliers(result)
      } catch (error) {
        if (cancelled) {
          return
        }

        setError(
          getSuppliersErrorMessage(
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