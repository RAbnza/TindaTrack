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
        <h1 className="text-2xl font-bold text-slate-950">
          Adjust Stock
        </h1>

        <p className="mt-1 text-sm text-slate-600">
          Record a traceable manual
          inventory correction.
        </p>
      </div>

      {completedAdjustment && (
        <section
          role="status"
          className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4"
        >
          <p className="font-semibold text-emerald-900">
            Stock adjustment recorded
          </p>

          <p className="mt-1 text-sm text-emerald-800">
            Adjustment #
            {
              completedAdjustment.id
            }
          </p>

          <p className="mt-2 text-sm text-emerald-800">
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
          className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
        >
          {submissionError}
        </div>
      )}

      <section className="mt-6">
        <fieldset>
          <legend className="text-lg font-bold text-slate-950">
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
                'min-h-12 rounded-xl border px-4 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-emerald-600',
                adjustmentType ===
                'ADD'
                  ? 'border-emerald-700 bg-emerald-700 text-white'
                  : 'border-slate-300 bg-white text-slate-700',
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
                'min-h-12 rounded-xl border px-4 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-red-600',
                adjustmentType ===
                'REMOVE'
                  ? 'border-red-700 bg-red-700 text-white'
                  : 'border-slate-300 bg-white text-slate-700',
              ].join(' ')}
            >
              Remove Stock
            </button>
          </div>
        </fieldset>
      </section>

      <section className="mt-7">
        <h2 className="text-lg font-bold text-slate-950">
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
          className="mt-3 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-base text-slate-950 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
        />

        {productsError && (
          <div className="mt-3 rounded-2xl border border-red-200 bg-red-50 p-4">
            <p
              role="alert"
              className="text-sm text-red-800"
            >
              {productsError}
            </p>

            <button
              type="button"
              onClick={() =>
                void reloadProducts()
              }
              className="mt-3 min-h-11 rounded-xl bg-red-700 px-4 text-sm font-semibold text-white"
            >
              Try again
            </button>
          </div>
        )}

        {isProductsLoading && (
          <p className="mt-4 text-sm text-slate-500">
            Loading products...
          </p>
        )}

        {!productsError &&
          !isProductsLoading &&
          filteredProducts.length ===
            0 && (
            <p className="mt-4 text-sm text-slate-600">
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
                        'w-full rounded-2xl border p-4 text-left transition focus:outline-none focus:ring-2 focus:ring-emerald-600',
                        isSelected
                          ? 'border-emerald-600 bg-emerald-50'
                          : 'border-slate-200 bg-white',
                      ].join(
                        ' ',
                      )}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-slate-950">
                            {
                              product.name
                            }
                          </p>

                          <p className="mt-1 text-sm text-slate-500">
                            SKU{' '}
                            {
                              product.sku
                            }
                          </p>
                        </div>

                        <div className="shrink-0 text-right">
                          <p className="text-xs uppercase tracking-wide text-slate-500">
                            Stock
                          </p>

                          <p className="text-xl font-bold tabular-nums text-slate-950">
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
        <section className="mt-8 border-t border-slate-200 pt-6">
          <div
            className={[
              'rounded-2xl border p-4',
              adjustmentType ===
              'REMOVE'
                ? 'border-red-200 bg-red-50'
                : 'border-emerald-200 bg-emerald-50',
            ].join(' ')}
          >
            <p className="text-lg font-bold text-slate-950">
              {
                selectedProduct.name
              }
            </p>

            <p className="mt-1 text-sm text-slate-600">
              Current stock
            </p>

            <p className="mt-1 text-4xl font-bold tabular-nums text-slate-950">
              {
                selectedProduct.currentStock
              }
            </p>
          </div>

          <div className="mt-6">
            <p className="text-sm font-medium text-slate-800">
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
                className="flex min-h-12 min-w-12 items-center justify-center rounded-xl border border-slate-300 bg-white text-xl font-semibold text-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
              >
                −
              </button>

              <span className="min-w-14 text-center text-2xl font-bold tabular-nums text-slate-950">
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
                className="flex min-h-12 min-w-12 items-center justify-center rounded-xl border border-slate-300 bg-white text-xl font-semibold text-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
              >
                +
              </button>
            </div>

            {adjustmentType ===
              'REMOVE' &&
              exceedsDisplayedStock && (
                <p
                  role="alert"
                  className="mt-2 text-sm font-medium text-red-700"
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
              className="block text-sm font-medium text-slate-800"
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
              className="mt-2 w-full resize-none rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-950 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
            />
          </div>

          <div className="mt-6 rounded-xl bg-slate-100 p-3">
            <p className="text-sm text-slate-600">
              Inventory change
            </p>

            <p
              className={[
                'mt-1 text-xl font-bold tabular-nums',
                adjustmentType ===
                'ADD'
                  ? 'text-emerald-700'
                  : 'text-red-700',
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
              'mt-6 min-h-14 w-full rounded-2xl px-5 text-base font-bold text-white transition focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-600',
              adjustmentType ===
              'REMOVE'
                ? 'bg-red-700 hover:bg-red-800 focus:ring-red-600'
                : 'bg-emerald-700 hover:bg-emerald-800 focus:ring-emerald-600',
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