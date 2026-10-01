import {
  useMemo,
  useState,
} from 'react'

import {
  ApiError,
} from '../api/api'

import {
  createStockAdjustment,
} from '../api/stock-adjustments.api'

import type {
  Product,
} from '../types/product'

import type {
  AdjustmentType,
  CreatedStockAdjustment,
} from '../types/stock-adjustment'

type AdjustStockPageProps = {
  products: Product[]
  isProductsLoading: boolean
  productsError: string | null
  reloadProducts: () => Promise<void>
}

export function AdjustStockPage({
  products,
  isProductsLoading,
  productsError,
  reloadProducts,
}: AdjustStockPageProps) {
  const [
    adjustmentType,
    setAdjustmentType,
  ] =
    useState<AdjustmentType>(
      'ADD',
    )

  const [
    selectedProductId,
    setSelectedProductId,
  ] = useState<number | null>(
    null,
  )

  const [
    quantity,
    setQuantity,
  ] = useState(1)

  const [
    reason,
    setReason,
  ] = useState('')

  const [
    search,
    setSearch,
  ] = useState('')

  const [
    submissionError,
    setSubmissionError,
  ] = useState<string | null>(
    null,
  )

  const [
    completedAdjustment,
    setCompletedAdjustment,
  ] =
    useState<CreatedStockAdjustment | null>(
      null,
    )

  const [
    isSubmitting,
    setIsSubmitting,
  ] = useState(false)

  const selectedProduct =
    useMemo(
      () =>
        products.find(
          (product) =>
            product.id ===
            selectedProductId,
        ) ?? null,
      [
        products,
        selectedProductId,
      ],
    )

  const filteredProducts =
    useMemo(() => {
      const normalizedSearch =
        search
          .trim()
          .toLowerCase()

      return products.filter(
        (product) => {
          if (!product.active) {
            return false
          }

          if (
            normalizedSearch
              .length === 0
          ) {
            return true
          }

          return (
            product.name
              .toLowerCase()
              .includes(
                normalizedSearch,
              ) ||
            product.sku
              .toLowerCase()
              .includes(
                normalizedSearch,
              )
          )
        },
      )
    }, [products, search])

  const trimmedReason =
    reason.trim()

  const exceedsDisplayedStock =
    adjustmentType ===
      'REMOVE' &&
    selectedProduct !== null &&
    quantity >
      selectedProduct.currentStock

  const canSubmit =
    selectedProduct !== null &&
    quantity >= 1 &&
    Number.isInteger(quantity) &&
    trimmedReason.length > 0 &&
    !exceedsDisplayedStock &&
    !isProductsLoading &&
    !isSubmitting

  function clearFeedback() {
    setSubmissionError(null)
    setCompletedAdjustment(null)
  }

  function handleAdjustmentTypeChange(
    type: AdjustmentType,
  ) {
    setAdjustmentType(type)
    setQuantity(1)
    clearFeedback()
  }

  function handleSelectProduct(
    productId: number,
  ) {
    setSelectedProductId(
      productId,
    )

    setQuantity(1)
    clearFeedback()
  }

  function handleDecrease() {
    setQuantity(
      (current) =>
        Math.max(
          1,
          current - 1,
        ),
    )

    clearFeedback()
  }

  function handleIncrease() {
    setQuantity(
      (current) =>
        current + 1,
    )

    clearFeedback()
  }

  async function handleSubmit() {
    if (isSubmitting) {
      return
    }

    if (!selectedProduct) {
      setSubmissionError(
        'Choose a product before recording an adjustment.',
      )

      return
    }

    if (
      !Number.isInteger(
        quantity,
      ) ||
      quantity < 1
    ) {
      setSubmissionError(
        'Quantity must be at least 1.',
      )

      return
    }

    if (!trimmedReason) {
      setSubmissionError(
        'Enter a reason for this adjustment.',
      )

      return
    }

    if (
      adjustmentType ===
        'REMOVE' &&
      quantity >
        selectedProduct.currentStock
    ) {
      setSubmissionError(
        'Remove quantity cannot exceed the currently displayed stock.',
      )

      return
    }

    const quantityDelta =
      adjustmentType === 'ADD'
        ? quantity
        : -quantity

    setSubmissionError(null)
    setCompletedAdjustment(null)
    setIsSubmitting(true)

    try {
      const adjustment =
        await createStockAdjustment(
          {
            productId:
              selectedProduct.id,

            quantityDelta,

            reason:
              trimmedReason,
          },
        )

      setCompletedAdjustment(
        adjustment,
      )

      /*
       * Only clear the form after
       * the server confirms success.
       */
      setSelectedProductId(
        null,
      )
      setQuantity(1)
      setReason('')
      setSearch('')
      setAdjustmentType(
        'ADD',
      )

      await reloadProducts()
    } catch (error) {
      /*
       * Preserve the form on failure.
       *
       * A 400 may mean stock changed
       * on another device, so refresh
       * the product read model.
       */
      if (
        error instanceof ApiError
      ) {
        setSubmissionError(
          error.message,
        )

        if (
          error.status === 400
        ) {
          await reloadProducts()
        }

        return
      }

      setSubmissionError(
        'Unable to record the stock adjustment. Please try again.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-5">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">
          Adjust Stock
        </h1>

        <p className="mt-1 text-sm text-secondary-foreground">
          Record a traceable manual
          inventory correction.
        </p>
      </div>

      {completedAdjustment && (
        <section
          role="status"
          className="mt-5 rounded-lg border border-success/20 bg-success-soft p-4"
        >
          <p className="font-semibold text-secondary-foreground">
            Stock adjustment recorded
          </p>

          <p className="mt-1 text-sm text-secondary-foreground">
            Adjustment #
            {
              completedAdjustment.id
            }
          </p>

          <p className="mt-2 text-sm text-secondary-foreground">
            Inventory change:{' '}
            <span className="font-semibold">
              {completedAdjustment.quantityDelta >
              0
                ? '+'
                : ''}
              {
                completedAdjustment.quantityDelta
              }
            </span>
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
        <fieldset>
          <legend className="text-lg font-semibold text-foreground">
            Adjustment type
          </legend>

          <div className="mt-3 grid grid-cols-2 gap-3">
            <button
              type="button"
              aria-pressed={
                adjustmentType ===
                'ADD'
              }
              onClick={() =>
                handleAdjustmentTypeChange(
                  'ADD',
                )
              }
              className={[
                'min-h-12 rounded-lg border px-4 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-ring',
                adjustmentType ===
                'ADD'
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-input bg-card text-secondary-foreground',
              ].join(' ')}
            >
              Add Stock
            </button>

            <button
              type="button"
              aria-pressed={
                adjustmentType ===
                'REMOVE'
              }
              onClick={() =>
                handleAdjustmentTypeChange(
                  'REMOVE',
                )
              }
              className={[
                'min-h-12 rounded-lg border px-4 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-destructive',
                adjustmentType ===
                'REMOVE'
                  ? 'border-destructive bg-destructive text-primary-foreground'
                  : 'border-input bg-card text-secondary-foreground',
              ].join(' ')}
            >
              Remove Stock
            </button>
          </div>
        </fieldset>
      </section>

      <section className="mt-7">
        <h2 className="text-lg font-semibold text-foreground">
          Product
        </h2>

        <label
          htmlFor="adjustment-product-search"
          className="sr-only"
        >
          Search products
        </label>

        <input
          id="adjustment-product-search"
          type="search"
          value={search}
          onChange={(event) =>
            setSearch(
              event.target.value,
            )
          }
          placeholder="Search name or SKU"
          className="mt-3 min-h-12 w-full rounded-lg border border-input bg-card px-4 text-base text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-ring/20"
        />

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

        {isProductsLoading && (
          <p className="mt-4 text-sm text-muted-foreground">
            Loading products...
          </p>
        )}

        {!productsError &&
          !isProductsLoading &&
          filteredProducts.length ===
            0 && (
            <p className="mt-4 text-sm text-secondary-foreground">
              No products found.
            </p>
          )}

        {!productsError &&
          filteredProducts.length >
            0 && (
            <div className="mt-3 space-y-3">
              {filteredProducts.map(
                (product) => {
                  const isSelected =
                    product.id ===
                    selectedProductId

                  return (
                    <button
                      key={
                        product.id
                      }
                      type="button"
                      onClick={() =>
                        handleSelectProduct(
                          product.id,
                        )
                      }
                      className={[
                        'w-full rounded-lg border p-4 text-left transition focus:outline-none focus:ring-2 focus:ring-ring',
                        isSelected
                          ? 'border-primary bg-accent'
                          : 'border-border bg-card',
                      ].join(
                        ' ',
                      )}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-foreground">
                            {
                              product.name
                            }
                          </p>

                          <p className="mt-1 text-sm text-muted-foreground">
                            SKU{' '}
                            {
                              product.sku
                            }
                          </p>
                        </div>

                        <div className="shrink-0 text-right">
                          <p className="text-xs uppercase tracking-wide text-muted-foreground">
                            Stock
                          </p>

                          <p className="text-xl font-semibold tabular-nums text-foreground">
                            {
                              product.currentStock
                            }
                          </p>
                        </div>
                      </div>
                    </button>
                  )
                },
              )}
            </div>
          )}
      </section>

      {selectedProduct && (
        <section className="mt-8 border-t border-border pt-6">
          <div
            className={[
              'rounded-lg border p-4',
              adjustmentType ===
              'REMOVE'
                ? 'border-destructive/20 bg-destructive-soft'
                : 'border-primary/20 bg-accent',
            ].join(' ')}
          >
            <p className="text-lg font-semibold text-foreground">
              {
                selectedProduct.name
              }
            </p>

            <p className="mt-1 text-sm text-secondary-foreground">
              Current stock
            </p>

            <p className="mt-1 text-4xl font-semibold tabular-nums text-foreground">
              {
                selectedProduct.currentStock
              }
            </p>
          </div>

          <div className="mt-6">
            <p className="text-sm font-medium text-secondary-foreground">
              {adjustmentType ===
              'ADD'
                ? 'Add quantity'
                : 'Remove quantity'}
            </p>

            <div className="mt-2 flex items-center gap-3">
              <button
                type="button"
                aria-label="Decrease adjustment quantity"
                disabled={
                  quantity <= 1
                }
                onClick={
                  handleDecrease
                }
                className="flex min-h-12 min-w-12 items-center justify-center rounded-lg border border-input bg-card text-xl font-medium text-secondary-foreground disabled:cursor-not-allowed disabled:opacity-40"
              >
                −
              </button>

              <span className="min-w-14 text-center text-2xl font-semibold tabular-nums text-foreground">
                {quantity}
              </span>

              <button
                type="button"
                aria-label="Increase adjustment quantity"
                disabled={
                  adjustmentType ===
                    'REMOVE' &&
                  quantity >=
                    selectedProduct.currentStock
                }
                onClick={
                  handleIncrease
                }
                className="flex min-h-12 min-w-12 items-center justify-center rounded-lg border border-input bg-card text-xl font-medium text-secondary-foreground disabled:cursor-not-allowed disabled:opacity-40"
              >
                +
              </button>
            </div>

            {adjustmentType ===
              'REMOVE' &&
              exceedsDisplayedStock && (
                <p
                  role="alert"
                  className="mt-2 text-sm font-medium text-destructive"
                >
                  Remove quantity
                  cannot exceed the
                  displayed stock of{' '}
                  {
                    selectedProduct.currentStock
                  }
                  .
                </p>
              )}
          </div>

          <div className="mt-6">
            <label
              htmlFor="adjustment-reason"
              className="block text-sm font-medium text-secondary-foreground"
            >
              Reason
            </label>

            <textarea
              id="adjustment-reason"
              rows={3}
              value={reason}
              onChange={(event) => {
                setReason(
                  event.target.value,
                )

                clearFeedback()
              }}
              placeholder={
                adjustmentType ===
                'REMOVE'
                  ? 'e.g. Damaged bottles'
                  : 'e.g. Inventory count correction'
              }
              className="mt-2 w-full resize-none rounded-lg border border-input bg-card px-4 py-3 text-base text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-ring/20"
            />
          </div>

          <div className="mt-6 rounded-lg bg-secondary p-3">
            <p className="text-sm text-secondary-foreground">
              Inventory change
            </p>

            <p
              className={[
                'mt-1 text-xl font-semibold tabular-nums',
                adjustmentType ===
                'ADD'
                  ? 'text-success'
                  : 'text-destructive',
              ].join(' ')}
            >
              {adjustmentType ===
              'ADD'
                ? '+'
                : '-'}
              {quantity}
            </p>
          </div>

          <button
            type="button"
            disabled={!canSubmit}
            onClick={() =>
              void handleSubmit()
            }
            className={[
              'mt-6 min-h-14 w-full rounded-lg px-5 text-base font-medium text-primary-foreground transition focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-muted disabled:text-disabled-foreground',
              adjustmentType ===
              'REMOVE'
                ? 'bg-destructive hover:bg-destructive/90 focus:ring-destructive'
                : 'bg-primary hover:bg-primary-hover focus:ring-ring',
            ].join(' ')}
          >
            {isSubmitting
              ? 'Recording adjustment...'
              : 'Record Adjustment'}
          </button>
        </section>
      )}
    </main>
  )
}
