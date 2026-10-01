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

  const loadSuppliers =
    useCallback(async () => {
      setIsLoading(true)
      setError(null)

      try {
        const result =
          await getSuppliers()

        setSuppliers(result)
      } catch (error) {
        if (
          error instanceof ApiError &&
          error.status === 401
        ) {
          setError(
            'Your session has expired. Please sign in again.',
          )

          return
        }

        if (
          error instanceof ApiError
        ) {
          setError(
            error.message,
          )

          return
        }

        setError(
          'Unable to load suppliers. Please try again.',
        )
      } finally {
        setIsLoading(false)
      }
    }, [])

  useEffect(() => {
    void loadSuppliers()
  }, [loadSuppliers])

  return {
    suppliers,
    isLoading,
    error,
    reload: loadSuppliers,
  }
}