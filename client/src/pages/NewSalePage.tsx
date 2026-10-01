import {
  useMemo,
  useState,
} from 'react'

import { ApiError } from '../api/api'
import { createSale } from '../api/sales.api'

import { AvailableProductCard } from '../features/sales/AvailableProductCard'
import { SaleCartItem } from '../features/sales/SaleCartItem'

import type { Product } from '../types/product'
import type {
  CreatedSale,
  PaymentMethod,
} from '../types/sale'

type CartItem = {
  productId: number
  quantity: number
}

type NewSalePageProps = {
  products: Product[]
  isProductsLoading: boolean
  productsError: string | null
  reloadProducts: () => Promise<void>
}

const paymentMethods: PaymentMethod[] = [
  'CASH',
  'GCASH',
  'MAYA',
]

const pesoFormatter = new Intl.NumberFormat(
  'en-PH',
  {
    style: 'currency',
    currency: 'PHP',
  },
)

export function NewSalePage({
  products,
  isProductsLoading,
  productsError,
  reloadProducts,
}: NewSalePageProps) {
  const [search, setSearch] = useState('')

  const [cart, setCart] = useState<CartItem[]>(
    [],
  )

  const [
    paymentMethod,
    setPaymentMethod,
  ] = useState<PaymentMethod | null>(null)

  const [
    submissionError,
    setSubmissionError,
  ] = useState<string | null>(null)

  const [
    completedSale,
    setCompletedSale,
  ] = useState<CreatedSale | null>(null)

  const [
    isSubmitting,
    setIsSubmitting,
  ] = useState(false)

  const productsById = useMemo(
    () =>
      new Map(
        products.map((product) => [
          product.id,
          product,
        ]),
      ),
    [products],
  )

  const cartProductIds = useMemo(
    () =>
      new Set(
        cart.map(
          (item) => item.productId,
        ),
      ),
    [cart],
  )

  const filteredProducts = useMemo(() => {
    const normalizedSearch = search
      .trim()
      .toLowerCase()

    return products.filter((product) => {
      if (!product.active) {
        return false
      }

      if (normalizedSearch.length === 0) {
        return true
      }

      return (
        product.name
          .toLowerCase()
          .includes(normalizedSearch) ||
        product.sku
          .toLowerCase()
          .includes(normalizedSearch)
      )
    })
  }, [products, search])

  const displayedTotal = useMemo(() => {
    return cart.reduce(
      (total, item) => {
        const product =
          productsById.get(
            item.productId,
          )

        if (!product) {
          return total
        }

        return (
          total +
          Number(product.sellingPrice) *
            item.quantity
        )
      },
      0,
    )
  }, [cart, productsById])

  const cartHasInvalidStock =
    cart.some((item) => {
      const product =
        productsById.get(
          item.productId,
        )

      if (!product || !product.active) {
        return true
      }

      return (
        item.quantity < 1 ||
        item.quantity >
          product.currentStock
      )
    })

  const canSubmit =
    cart.length > 0 &&
    paymentMethod !== null &&
    !cartHasInvalidStock &&
    !isSubmitting &&
    !isProductsLoading

  function clearFeedback() {
    setSubmissionError(null)
    setCompletedSale(null)
  }

  function handleAddProduct(
    productId: number,
  ) {
    const product =
      productsById.get(productId)

    if (
      !product ||
      !product.active ||
      product.currentStock <= 0
    ) {
      return
    }

    setCart((currentCart) => {
      const alreadyExists =
        currentCart.some(
          (item) =>
            item.productId ===
            productId,
        )

      if (alreadyExists) {
        return currentCart
      }

      return [
        ...currentCart,
        {
          productId,
          quantity: 1,
        },
      ]
    })

    clearFeedback()
  }

  function handleDecrease(
    productId: number,
  ) {
    setCart((currentCart) =>
      currentCart.map((item) => {
        if (
          item.productId !==
          productId
        ) {
          return item
        }

        return {
          ...item,
          quantity: Math.max(
            1,
            item.quantity - 1,
          ),
        }
      }),
    )

    clearFeedback()
  }

  function handleIncrease(
    productId: number,
  ) {
    const product =
      productsById.get(productId)

    if (!product) {
      return
    }

    setCart((currentCart) =>
      currentCart.map((item) => {
        if (
          item.productId !==
          productId
        ) {
          return item
        }

        if (
          item.quantity >=
          product.currentStock
        ) {
          return item
        }

        return {
          ...item,
          quantity:
            item.quantity + 1,
        }
      }),
    )

    clearFeedback()
  }

  function handleRemove(
    productId: number,
  ) {
    setCart((currentCart) =>
      currentCart.filter(
        (item) =>
          item.productId !==
          productId,
      ),
    )

    clearFeedback()
  }

  function handlePaymentMethodChange(
    method: PaymentMethod,
  ) {
    setPaymentMethod(method)
    clearFeedback()
  }

  async function handleSubmit() {
    if (isSubmitting) {
      return
    }

    if (cart.length === 0) {
      setSubmissionError(
        'Add at least one product before completing the sale.',
      )

      return
    }

    if (!paymentMethod) {
      setSubmissionError(
        'Choose a payment method before completing the sale.',
      )

      return
    }

    if (cartHasInvalidStock) {
      setSubmissionError(
        'One or more cart quantities exceed the currently displayed stock. Adjust the cart before continuing.',
      )

      return
    }

    setSubmissionError(null)
    setCompletedSale(null)
    setIsSubmitting(true)

    try {
      const sale =
        await createSale({
          paymentMethod,
          items: cart.map(
            (item) => ({
              productId:
                item.productId,
              quantity:
                item.quantity,
            }),
          ),
        })

      /*
       * Only the server response is treated
       * as the completed sale result.
       */
      setCompletedSale(sale)

      setCart([])
      setPaymentMethod(null)
      setSearch('')

      await reloadProducts()
    } catch (error) {
      if (error instanceof ApiError) {
        setSubmissionError(
          error.message,
        )

        /*
         * A 400 may mean stock changed
         * since products were loaded.
         *
         * Keep the cart intact, but reload
         * authoritative stock information.
         */
        if (error.status === 400) {
          await reloadProducts()
        }

        return
      }

      setSubmissionError(
        'Unable to complete the sale. Please try again.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-5">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">
          New Sale
        </h1>

        <p className="mt-1 text-sm text-secondary-foreground">
          Add products, choose payment,
          then complete the sale.
        </p>
      </div>

      {completedSale && (
        <section
          role="status"
          className="mt-5 rounded-lg border border-success/20 bg-success-soft p-4"
        >
          <p className="font-semibold text-secondary-foreground">
            Sale completed
          </p>

          <p className="mt-1 text-sm text-secondary-foreground">
            Sale #{completedSale.id}
          </p>

          <p className="mt-3 text-sm text-secondary-foreground">
            Authoritative total
          </p>

          <p className="mt-1 text-2xl font-semibold text-secondary-foreground">
            {pesoFormatter.format(
              Number(
                completedSale.totalAmount,
              ),
            )}
          </p>

          <p className="mt-1 text-sm text-secondary-foreground">
            Paid with{' '}
            {completedSale.paymentMethod}
          </p>
        </section>
      )}

      {submissionError && (
        <div
          role="alert"
          className="mt-5 rounded-lg border border-destructive/20 bg-destructive-soft p-4 text-sm text-secondary-foreground"
        >
          {submissionError}
        </div>
      )}

      <section className="mt-6">
        <label
          htmlFor="sale-product-search"
          className="sr-only"
        >
          Search products
        </label>

        <input
          id="sale-product-search"
          type="search"
          value={search}
          onChange={(event) =>
            setSearch(
              event.target.value,
            )
          }
          placeholder="Search products..."
          className="min-h-12 w-full rounded-lg border border-input bg-card px-4 text-base text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-ring/20"
        />
      </section>

      <section className="mt-6">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold text-foreground">
            Available products
          </h2>

          {isProductsLoading && (
            <span className="text-sm text-muted-foreground">
              Refreshing...
            </span>
          )}
        </div>

        {productsError && (
          <div className="mt-3 rounded-lg border border-destructive/20 bg-destructive-soft p-4">
            <p
              role="alert"
              className="text-sm text-secondary-foreground"
            >
              {productsError}
            </p>

            <button
              type="button"
              onClick={() =>
                void reloadProducts()
              }
              className="mt-3 min-h-11 rounded-lg bg-destructive px-4 text-sm font-medium text-primary-foreground"
            >
              Try again
            </button>
          </div>
        )}

        {!productsError &&
          filteredProducts.length ===
            0 &&
          !isProductsLoading && (
            <div className="py-8 text-center">
              <p className="text-sm text-secondary-foreground">
                No products found.
              </p>
            </div>
          )}

        {!productsError &&
          filteredProducts.length >
            0 && (
            <div className="mt-3 space-y-3">
              {filteredProducts.map(
                (product) => (
                  <AvailableProductCard
                    key={product.id}
                    product={product}
                    isInCart={cartProductIds.has(
                      product.id,
                    )}
                    onAdd={
                      handleAddProduct
                    }
                  />
                ),
              )}
            </div>
          )}
      </section>

      <section className="mt-8 border-t border-border pt-6">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold text-foreground">
            Current sale
          </h2>

          <span className="text-sm text-muted-foreground">
            {cart.length}{' '}
            {cart.length === 1
              ? 'item'
              : 'items'}
          </span>
        </div>

        {cart.length === 0 ? (
          <div className="mt-3 rounded-lg border border-dashed border-input bg-card px-4 py-8 text-center">
            <p className="text-sm text-secondary-foreground">
              No products added yet.
            </p>
          </div>
        ) : (
          <div className="mt-3 space-y-3">
            {cart.map((item) => {
              const product =
                productsById.get(
                  item.productId,
                )

              if (!product) {
                return null
              }

              return (
                <SaleCartItem
                  key={item.productId}
                  product={product}
                  quantity={
                    item.quantity
                  }
                  onDecrease={() =>
                    handleDecrease(
                      item.productId,
                    )
                  }
                  onIncrease={() =>
                    handleIncrease(
                      item.productId,
                    )
                  }
                  onRemove={() =>
                    handleRemove(
                      item.productId,
                    )
                  }
                />
              )
            })}
          </div>
        )}
      </section>

      <section className="mt-8 border-t border-border pt-6">
        <fieldset>
          <legend className="text-lg font-semibold text-foreground">
            Payment
          </legend>

          <div className="mt-3 grid grid-cols-3 gap-2">
            {paymentMethods.map(
              (method) => {
                const isSelected =
                  paymentMethod ===
                  method

                return (
                  <button
                    key={method}
                    type="button"
                    aria-pressed={
                      isSelected
                    }
                    onClick={() =>
                      handlePaymentMethodChange(
                        method,
                      )
                    }
                    className={[
                      'min-h-12 rounded-lg border px-2 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-ring',
                      isSelected
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-input bg-card text-secondary-foreground',
                    ].join(' ')}
                  >
                    {method}
                  </button>
                )
              },
            )}
          </div>
        </fieldset>
      </section>

      <section className="mt-8 border-t border-border pt-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-secondary-foreground">
              Displayed total
            </p>

            <p className="mt-1 text-xs text-muted-foreground">
              Final total is calculated
              by the server.
            </p>
          </div>

          <p className="text-3xl font-semibold tabular-nums text-foreground">
            {pesoFormatter.format(
              displayedTotal,
            )}
          </p>
        </div>

        {cartHasInvalidStock && (
          <p
            role="alert"
            className="mt-4 text-sm font-medium text-destructive"
          >
            Adjust items that exceed
            current stock before
            completing the sale.
          </p>
        )}

        <button
          type="button"
          disabled={!canSubmit}
          onClick={() =>
            void handleSubmit()
          }
          className="mt-5 min-h-14 w-full rounded-lg bg-primary px-5 text-base font-medium text-primary-foreground transition hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-muted disabled:text-disabled-foreground"
        >
          {isSubmitting
            ? 'Completing sale...'
            : 'Complete sale'}
        </button>
      </section>
    </main>
  )
}
