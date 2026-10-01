import {
  useCallback,
  useEffect,
  useState,
} from 'react'

import { ApiError } from '../../api/api'
import { getProducts } from '../../api/products.api'
import type { Product } from '../../types/product'

export function useProducts() {
  const [products, setProducts] = useState<Product[]>(
    [],
  )

  const [isLoading, setIsLoading] = useState(true)

  const [error, setError] = useState<string | null>(
    null,
  )

  const loadProducts = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await getProducts()
      setProducts(result)
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

      if (error instanceof ApiError) {
        setError(error.message)
        return
      }

      setError(
        'Unable to load inventory. Please try again.',
      )
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadProducts()
  }, [loadProducts])

  return {
    products,
    isLoading,
    error,
    reload: loadProducts,
  }
}