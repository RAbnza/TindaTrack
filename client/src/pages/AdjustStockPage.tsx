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

import {
  PageContainer,
} from '../components/layout/PageContainer'

import {
  Badge,
  Button,
  Card,
  ConfirmationDialog,
  EmptyState,
  ErrorState,
  LoadingState,
  PageHeader,
  useToast,
} from '../components/ui'

import type {
  Product,
} from '../types/product'

import type {
  AdjustmentType,
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
  const {
    showToast,
  } = useToast()

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
    isSubmitting,
    setIsSubmitting,
  ] = useState(false)

  const [
    reductionDialogOpen,
    setReductionDialogOpen,
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
      const query =
        search
          .trim()
          .toLowerCase()

      return products.filter(
        (product) => {
          if (!product.active) {
            return false
          }

          if (!query) {
            return true
          }

          return (
            product.name
              .toLowerCase()
              .includes(query) ||
            product.sku
              .toLowerCase()
              .includes(query)
          )
        },
      )
    }, [
      products,
      search,
    ])

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

  function clearError() {
    setSubmissionError(null)
  }

  function handleAdjustmentTypeChange(
    type: AdjustmentType,
  ) {
    setAdjustmentType(type)
    setQuantity(1)
    setReductionDialogOpen(
      false,
    )
    clearError()
  }

  function handleSelectProduct(
    productId: number,
  ) {
    setSelectedProductId(
      productId,
    )

    setQuantity(1)
    setReductionDialogOpen(
      false,
    )
    clearError()
  }

  function handleDecrease() {
    setQuantity(
      (current) =>
        Math.max(
          1,
          current - 1,
        ),
    )

    clearError()
  }

  function handleIncrease() {
    setQuantity(
      (current) =>
        current + 1,
    )

    clearError()
  }

  function validateAdjustment(): boolean {
    if (!selectedProduct) {
      setSubmissionError(
        'Choose a product before recording an adjustment.',
      )

      return false
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

      return false
    }

    if (!trimmedReason) {
      setSubmissionError(
        'Enter a reason for this adjustment.',
      )

      return false
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

      return false
    }

    setSubmissionError(null)

    return true
  }

  function handleRecordClick() {
    if (!validateAdjustment()) {
      return
    }

    if (
      adjustmentType ===
      'REMOVE'
    ) {
      setReductionDialogOpen(
        true,
      )

      return
    }

    void recordAdjustment()
  }

  async function recordAdjustment() {
    if (
      isSubmitting ||
      !selectedProduct
    ) {
      return
    }

    if (!validateAdjustment()) {
      setReductionDialogOpen(
        false,
      )

      return
    }

    const quantityDelta =
      adjustmentType === 'ADD'
        ? quantity
        : -quantity

    setSubmissionError(null)
    setIsSubmitting(true)

    try {
      await createStockAdjustment({
        productId:
          selectedProduct.id,

        quantityDelta,

        reason:
          trimmedReason,
      })

      setReductionDialogOpen(
        false,
      )

      /*
       * Clear only after the server
       * confirms the adjustment.
       */
      setSelectedProductId(null)
      setQuantity(1)
      setReason('')
      setSearch('')
      setAdjustmentType('ADD')

      await reloadProducts()

      showToast({
        variant:
          'success',

        message:
          'Stock adjustment recorded.',
      })
    } catch (error) {
      /*
       * Preserve the current adjustment
       * when submission fails.
       */
      if (
        error instanceof
        ApiError
      ) {
        setSubmissionError(
          error.message,
        )

        /*
         * The displayed stock may now
         * be stale, especially for a
         * reduction rejected by the
         * server.
         */
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

  const hasSearch =
    search.trim().length > 0

  return (
    <PageContainer>
      <PageHeader
        title="Adjust Stock"
        description="Record a traceable inventory correction. Use this only when a receipt or sale does not represent the change."
      />

      {submissionError && (
        <div
          role="alert"
          className="mt-6 rounded-lg border border-destructive/20 bg-destructive-soft p-4 text-sm leading-6 text-secondary-foreground"
        >
          {submissionError}
        </div>
      )}

      <div className="mt-6 grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(20rem,0.85fr)]">
        {/* Product selection */}
        <Card className="min-w-0 p-4 sm:p-5">
          <div>
            <p className="text-caption font-medium text-muted-foreground">
              Step 1
            </p>

            <h2 className="mt-1 text-section font-semibold text-foreground">
              Choose product
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Only active products
              are shown.
            </p>
          </div>

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
            onChange={(
              event,
            ) =>
              setSearch(
                event.target.value,
              )
            }
            placeholder="Search name or SKU"
            className="mt-5 min-h-12 w-full rounded-lg border border-input bg-card px-4 text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-ring/20"
          />

          <div className="mt-5">
            {isProductsLoading &&
              products.length ===
                0 && (
                <LoadingState label="Loading products..." />
              )}

            {productsError && (
              <ErrorState
                title="Unable to load products"
                message={
                  productsError
                }
                onRetry={() =>
                  void reloadProducts()
                }
              />
            )}

            {!isProductsLoading &&
              !productsError &&
              filteredProducts
                .length ===
                0 && (
                <EmptyState
                  title={
                    hasSearch
                      ? 'No products found'
                      : 'No products available'
                  }
                  description={
                    hasSearch
                      ? 'Try another product name or SKU.'
                      : 'There are no active products available for adjustment.'
                  }
                />
              )}

            {!productsError &&
              filteredProducts
                .length > 0 && (
                <div className="space-y-2">
                  {filteredProducts.map(
                    (
                      product,
                    ) => {
                      const selected =
                        product.id ===
                        selectedProductId

                      return (
                        <button
                          key={
                            product.id
                          }
                          type="button"
                          aria-pressed={
                            selected
                          }
                          onClick={() =>
                            handleSelectProduct(
                              product.id,
                            )
                          }
                          className={[
                            'w-full rounded-lg border p-4 text-left transition-colors',
                            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                            selected
                              ? 'border-primary bg-accent'
                              : 'border-border bg-card hover:bg-secondary/50',
                          ].join(
                            ' ',
                          )}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-foreground">
                                {
                                  product.name
                                }
                              </p>

                              <p className="mt-1 text-xs text-muted-foreground">
                                SKU{' '}
                                {
                                  product.sku
                                }
                              </p>
                            </div>

                            <div className="shrink-0 text-right">
                              <p className="text-caption text-muted-foreground">
                                Stock
                              </p>

                              <p className="mt-0.5 text-lg font-semibold tabular-nums text-foreground">
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
          </div>
        </Card>

        {/* Adjustment */}
        <div className="min-w-0 space-y-4 lg:sticky lg:top-4 lg:self-start">
          <Card className="p-4 sm:p-5">
            <fieldset>
              <legend>
                <span className="text-caption font-medium text-muted-foreground">
                  Step 2
                </span>

                <span className="mt-1 block text-section font-semibold text-foreground">
                  Direction
                </span>
              </legend>

              <div className="mt-4 grid grid-cols-2 gap-2">
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
                    'min-h-12 rounded-lg border px-3 text-sm font-medium transition-colors',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    adjustmentType ===
                    'ADD'
                      ? 'border-primary bg-accent text-accent-foreground'
                      : 'border-border bg-card text-secondary-foreground hover:bg-secondary',
                  ].join(
                    ' ',
                  )}
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
                    'min-h-12 rounded-lg border px-3 text-sm font-medium transition-colors',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive',
                    adjustmentType ===
                    'REMOVE'
                      ? 'border-destructive/40 bg-destructive-soft text-destructive'
                      : 'border-border bg-card text-secondary-foreground hover:bg-secondary',
                  ].join(
                    ' ',
                  )}
                >
                  Remove Stock
                </button>
              </div>
            </fieldset>
          </Card>

          <Card className="p-4 sm:p-5">
            <div>
              <p className="text-caption font-medium text-muted-foreground">
                Step 3
              </p>

              <h2 className="mt-1 text-section font-semibold text-foreground">
                Adjustment details
              </h2>
            </div>

            {!selectedProduct ? (
              <div className="mt-5 rounded-lg border border-dashed border-border px-4 py-8 text-center">
                <p className="text-sm text-muted-foreground">
                  Choose a product
                  to continue.
                </p>
              </div>
            ) : (
              <>
                <div className="mt-5 flex items-start justify-between gap-4 rounded-lg bg-secondary/60 p-4">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {
                        selectedProduct.name
                      }
                    </p>

                    <p className="mt-1 text-xs text-muted-foreground">
                      {
                        selectedProduct.sku
                      }
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-caption text-muted-foreground">
                      Current stock
                    </p>

                    <p className="mt-1 text-metric font-semibold tabular-nums text-foreground">
                      {
                        selectedProduct.currentStock
                      }
                    </p>
                  </div>
                </div>

                <div className="mt-5">
                  <p className="text-sm font-medium text-secondary-foreground">
                    Quantity
                  </p>

                  <div className="mt-2 flex items-center gap-3">
                    <Button
                      variant="secondary"
                      aria-label="Decrease adjustment quantity"
                      disabled={
                        quantity <= 1
                      }
                      className="min-w-12 px-0 text-lg"
                      onClick={
                        handleDecrease
                      }
                    >
                      −
                    </Button>

                    <span
                      aria-label="Adjustment quantity"
                      className="min-w-14 text-center text-xl font-semibold tabular-nums text-foreground"
                    >
                      {quantity}
                    </span>

                    <Button
                      variant="secondary"
                      aria-label="Increase adjustment quantity"
                      disabled={
                        adjustmentType ===
                          'REMOVE' &&
                        quantity >=
                          selectedProduct.currentStock
                      }
                      className="min-w-12 px-0 text-lg"
                      onClick={
                        handleIncrease
                      }
                    >
                      +
                    </Button>
                  </div>

                  {exceedsDisplayedStock && (
                    <p
                      role="alert"
                      className="mt-2 text-sm text-destructive"
                    >
                      Remove quantity
                      cannot exceed
                      the currently
                      displayed stock
                      of{' '}
                      {
                        selectedProduct.currentStock
                      }
                      .
                    </p>
                  )}
                </div>

                <div className="mt-5">
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
                    onChange={(
                      event,
                    ) => {
                      setReason(
                        event.target
                          .value,
                      )

                      clearError()
                    }}
                    placeholder={
                      adjustmentType ===
                      'REMOVE'
                        ? 'e.g. Damaged items'
                        : 'e.g. Inventory count correction'
                    }
                    className="mt-2 w-full resize-none rounded-lg border border-input bg-card px-4 py-3 text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-ring/20"
                  />
                </div>
              </>
            )}
          </Card>

          <Card className="p-4 sm:p-5">
            <div>
              <p className="text-caption font-medium text-muted-foreground">
                Step 4
              </p>

              <h2 className="mt-1 text-section font-semibold text-foreground">
                Review intent
              </h2>
            </div>

            {selectedProduct ? (
              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm text-muted-foreground">
                    Product
                  </span>

                  <span className="max-w-[60%] truncate text-right text-sm font-medium text-foreground">
                    {
                      selectedProduct.name
                    }
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm text-muted-foreground">
                    Direction
                  </span>

                  <Badge
                    variant={
                      adjustmentType ===
                      'ADD'
                        ? 'success'
                        : 'danger'
                    }
                  >
                    {adjustmentType ===
                    'ADD'
                      ? 'Increase'
                      : 'Reduce'}
                  </Badge>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm text-muted-foreground">
                    Recorded change
                  </span>

                  <span
                    className={[
                      'text-lg font-semibold tabular-nums',
                      adjustmentType ===
                      'ADD'
                        ? 'text-success'
                        : 'text-destructive',
                    ].join(
                      ' ',
                    )}
                  >
                    {adjustmentType ===
                    'ADD'
                      ? '+'
                      : '-'}
                    {quantity}
                  </span>
                </div>

                <div className="border-t border-border pt-3">
                  <p className="text-xs text-muted-foreground">
                    Reason
                  </p>

                  <p className="mt-1 whitespace-pre-wrap break-words text-sm text-secondary-foreground">
                    {trimmedReason ||
                      'No reason entered yet.'}
                  </p>
                </div>
              </div>
            ) : (
              <p className="mt-4 text-sm text-muted-foreground">
                Choose a product
                before reviewing the
                adjustment.
              </p>
            )}

            <Button
              variant={
                adjustmentType ===
                'REMOVE'
                  ? 'danger'
                  : 'primary'
              }
              className="mt-5 min-h-14 w-full text-base"
              disabled={
                !canSubmit
              }
              loading={
                isSubmitting
              }
              onClick={
                handleRecordClick
              }
            >
              {isSubmitting
                ? 'Recording adjustment...'
                : 'Record Adjustment'}
            </Button>
          </Card>
        </div>
      </div>

      <ConfirmationDialog
        open={
          reductionDialogOpen
        }
        title="Confirm stock reduction?"
        description={
          selectedProduct
            ? `This will reduce recorded inventory for ${selectedProduct.name} by ${quantity} ${quantity === 1 ? 'unit' : 'units'}. Reason: ${trimmedReason}`
            : 'Confirm this stock reduction.'
        }
        confirmLabel="Record adjustment"
        cancelLabel="Cancel"
        variant="danger"
        loading={
          isSubmitting
        }
        onConfirm={() =>
          void recordAdjustment()
        }
        onCancel={() =>
          setReductionDialogOpen(
            false,
          )
        }
      />
    </PageContainer>
  )
}