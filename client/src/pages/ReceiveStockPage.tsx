import {
  useMemo,
  useState,
} from 'react'

import {
  ApiError,
} from '../api/api'

import {
  createStockReceipt,
} from '../api/stock-receipts.api'

import {
  PageContainer,
} from '../components/layout/PageContainer'

import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  LoadingState,
  PageHeader,
  useToast,
} from '../components/ui'

import {
  AvailableProductCard,
} from '../features/receiving/AvailableProductCard'

import {
  ReceiptItemCard,
} from '../features/receiving/ReceiptItemCard'

import {
  useSuppliers,
} from '../features/receiving/useSuppliers'

import type {
  Product,
} from '../types/product'

type ReceiptItem = {
  productId: number
  quantity: number
  unitCost: string
}

type ReceiveStockPageProps = {
  products: Product[]
  isProductsLoading: boolean
  productsError: string | null
  reloadProducts: () => Promise<void>
}

const unitCostPattern =
  /^\d+(?:\.\d{1,2})?$/

function getUnitCostError(
  unitCost: string,
): string | null {
  const trimmed =
    unitCost.trim()

  if (!trimmed) {
    return 'Unit cost is required.'
  }

  if (
    !unitCostPattern.test(
      trimmed,
    )
  ) {
    return 'Enter a non-negative amount with up to 2 decimal places.'
  }

  return null
}

export function ReceiveStockPage({
  products,
  isProductsLoading,
  productsError,
  reloadProducts,
}: ReceiveStockPageProps) {
  const {
    suppliers,
    isLoading:
      isSuppliersLoading,
    error: suppliersError,
    reload: reloadSuppliers,
  } = useSuppliers()

  const {
    showToast,
  } = useToast()

  const [
    supplierId,
    setSupplierId,
  ] = useState<number | null>(
    null,
  )

  const [
    referenceNo,
    setReferenceNo,
  ] = useState('')

  const [
    search,
    setSearch,
  ] = useState('')

  const [
    receiptItems,
    setReceiptItems,
  ] = useState<ReceiptItem[]>(
    [],
  )

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

  const productsById =
    useMemo(
      () =>
        new Map(
          products.map(
            (product) => [
              product.id,
              product,
            ],
          ),
        ),
      [products],
    )

  const receiptProductIds =
    useMemo(
      () =>
        new Set(
          receiptItems.map(
            (item) =>
              item.productId,
          ),
        ),
      [receiptItems],
    )

  const selectedSupplier =
    useMemo(
      () =>
        suppliers.find(
          (supplier) =>
            supplier.id ===
            supplierId,
        ) ?? null,
      [
        suppliers,
        supplierId,
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

  const hasInvalidUnitCost =
    receiptItems.some(
      (item) =>
        getUnitCostError(
          item.unitCost,
        ) !== null,
    )

  const canSubmit =
    supplierId !== null &&
    receiptItems.length > 0 &&
    !hasInvalidUnitCost &&
    !isSubmitting &&
    !isProductsLoading &&
    !isSuppliersLoading

  function clearError() {
    setSubmissionError(null)
  }

  function handleAddProduct(
    productId: number,
  ) {
    const product =
      productsById.get(
        productId,
      )

    if (
      !product ||
      !product.active
    ) {
      return
    }

    setReceiptItems(
      (current) => {
        if (
          current.some(
            (item) =>
              item.productId ===
              productId,
          )
        ) {
          return current
        }

        return [
          ...current,
          {
            productId,
            quantity: 1,
            unitCost: '',
          },
        ]
      },
    )

    clearError()
  }

  function handleDecrease(
    productId: number,
  ) {
    setReceiptItems(
      (current) =>
        current.map(
          (item) =>
            item.productId ===
            productId
              ? {
                  ...item,

                  quantity:
                    Math.max(
                      1,
                      item.quantity -
                        1,
                    ),
                }
              : item,
        ),
    )

    clearError()
  }

  function handleIncrease(
    productId: number,
  ) {
    setReceiptItems(
      (current) =>
        current.map(
          (item) =>
            item.productId ===
            productId
              ? {
                  ...item,

                  quantity:
                    item.quantity +
                    1,
                }
              : item,
        ),
    )

    clearError()
  }

  function handleUnitCostChange(
    productId: number,
    value: string,
  ) {
    setReceiptItems(
      (current) =>
        current.map(
          (item) =>
            item.productId ===
            productId
              ? {
                  ...item,
                  unitCost: value,
                }
              : item,
        ),
    )

    clearError()
  }

  function handleRemove(
    productId: number,
  ) {
    setReceiptItems(
      (current) =>
        current.filter(
          (item) =>
            item.productId !==
            productId,
        ),
    )

    clearError()
  }

  async function handleSubmit() {
    if (isSubmitting) {
      return
    }

    if (supplierId === null) {
      setSubmissionError(
        'Choose a supplier before recording the receipt.',
      )

      return
    }

    if (
      receiptItems.length === 0
    ) {
      setSubmissionError(
        'Add at least one product before recording the receipt.',
      )

      return
    }

    if (hasInvalidUnitCost) {
      setSubmissionError(
        'Correct the unit cost for each receipt item before continuing.',
      )

      return
    }

    setSubmissionError(null)
    setIsSubmitting(true)

    try {
      const trimmedReference =
        referenceNo.trim()

      await createStockReceipt({
        supplierId,

        referenceNo:
          trimmedReference
            ? trimmedReference
            : null,

        items:
          receiptItems.map(
            (item) => ({
              productId:
                item.productId,

              quantity:
                item.quantity,

              unitCost:
                item.unitCost.trim(),
            }),
          ),
      })

      setSupplierId(null)
      setReferenceNo('')
      setSearch('')
      setReceiptItems([])

      await reloadProducts()

      showToast({
        variant:
          'success',

        message:
          'Stock receipt recorded.',
      })
    } catch (error) {
      /*
       * Preserve supplier, reference
       * number and line items on failure.
       */
      if (
        error instanceof
        ApiError
      ) {
        setSubmissionError(
          error.message,
        )

        return
      }

      setSubmissionError(
        'Unable to record the stock receipt. Please try again.',
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
        title="Receive Stock"
        description="Record inventory received from an active supplier."
      />

      {submissionError && (
        <div
          role="alert"
          className="mt-6 rounded-lg border border-destructive/20 bg-destructive-soft p-4 text-sm leading-6 text-secondary-foreground"
        >
          {submissionError}
        </div>
      )}

      <Card className="mt-6 p-4 sm:p-5">
        <div>
          <p className="text-caption font-medium text-muted-foreground">
            Step 1
          </p>

          <h2 className="mt-1 text-section font-semibold text-foreground">
            Receipt details
          </h2>
        </div>

        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <div>
            <label
              htmlFor="supplier"
              className="mb-2 block text-sm font-medium text-secondary-foreground"
            >
              Supplier
            </label>

            <select
              id="supplier"
              value={
                supplierId ?? ''
              }
              disabled={
                isSuppliersLoading
              }
              onChange={(
                event,
              ) => {
                const value =
                  event.target
                    .value

                setSupplierId(
                  value
                    ? Number(
                        value,
                      )
                    : null,
                )

                clearError()
              }}
              className="min-h-12 w-full rounded-lg border border-input bg-card px-4 text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-ring/20 disabled:bg-secondary"
            >
              <option value="">
                {isSuppliersLoading
                  ? 'Loading suppliers...'
                  : 'Choose supplier'}
              </option>

              {suppliers.map(
                (supplier) => (
                  <option
                    key={
                      supplier.id
                    }
                    value={
                      supplier.id
                    }
                  >
                    {
                      supplier.name
                    }
                  </option>
                ),
              )}
            </select>
          </div>

          <div>
            <label
              htmlFor="reference-no"
              className="mb-2 block text-sm font-medium text-secondary-foreground"
            >
              Reference number
            </label>

            <input
              id="reference-no"
              type="text"
              value={
                referenceNo
              }
              onChange={(
                event,
              ) => {
                setReferenceNo(
                  event.target
                    .value,
                )

                clearError()
              }}
              placeholder="Invoice / DR number (optional)"
              className="min-h-12 w-full rounded-lg border border-input bg-card px-4 text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-ring/20"
            />
          </div>
        </div>

        {suppliersError && (
          <div className="mt-5">
            <ErrorState
              title="Unable to load suppliers"
              message={
                suppliersError
              }
              onRetry={() =>
                void reloadSuppliers()
              }
            />
          </div>
        )}

        {!isSuppliersLoading &&
          !suppliersError &&
          suppliers.length ===
            0 && (
            <div className="mt-5 rounded-lg border border-warning/20 bg-warning-soft p-3">
              <p className="text-sm text-secondary-foreground">
                No active
                suppliers are
                currently
                available.
              </p>
            </div>
          )}
      </Card>

      <div className="mt-6 grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(20rem,0.9fr)]">
        {/* Products */}
        <Card className="min-w-0 p-4 sm:p-5">
          <div>
            <p className="text-caption font-medium text-muted-foreground">
              Step 2
            </p>

            <h2 className="mt-1 text-section font-semibold text-foreground">
              Add products
            </h2>
          </div>

          <label
            htmlFor="receive-product-search"
            className="sr-only"
          >
            Search products
          </label>

          <input
            id="receive-product-search"
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
                      : 'There are no active products available to receive.'
                  }
                />
              )}

            {!productsError &&
              filteredProducts
                .length > 0 && (
                <div className="space-y-3">
                  {filteredProducts.map(
                    (
                      product,
                    ) => (
                      <AvailableProductCard
                        key={
                          product.id
                        }
                        product={
                          product
                        }
                        isInReceipt={receiptProductIds.has(
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
          </div>
        </Card>

        {/* Receipt */}
        <div className="min-w-0 space-y-4 lg:sticky lg:top-4 lg:self-start">
          <Card className="p-4 sm:p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-caption font-medium text-muted-foreground">
                  Step 3
                </p>

                <h2 className="mt-1 text-section font-semibold text-foreground">
                  Receipt items
                </h2>
              </div>

              <span className="text-sm tabular-nums text-muted-foreground">
                {
                  receiptItems.length
                }{' '}
                {receiptItems.length ===
                1
                  ? 'item'
                  : 'items'}
              </span>
            </div>

            {receiptItems.length ===
            0 ? (
              <div className="mt-5 rounded-lg border border-dashed border-border px-4 py-8 text-center">
                <p className="text-sm text-muted-foreground">
                  Add products to
                  build this stock
                  receipt.
                </p>
              </div>
            ) : (
              <div className="mt-5 space-y-3">
                {receiptItems.map(
                  (item) => {
                    const product =
                      productsById.get(
                        item.productId,
                      )

                    if (!product) {
                      return null
                    }

                    return (
                      <ReceiptItemCard
                        key={
                          item.productId
                        }
                        product={
                          product
                        }
                        quantity={
                          item.quantity
                        }
                        unitCost={
                          item.unitCost
                        }
                        unitCostError={getUnitCostError(
                          item.unitCost,
                        )}
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
                        onUnitCostChange={(
                          value,
                        ) =>
                          handleUnitCostChange(
                            item.productId,
                            value,
                          )
                        }
                        onRemove={() =>
                          handleRemove(
                            item.productId,
                          )
                        }
                      />
                    )
                  },
                )}
              </div>
            )}
          </Card>

          <Card className="p-4 sm:p-5">
            <div>
              <p className="text-caption font-medium text-muted-foreground">
                Step 4
              </p>

              <h2 className="mt-1 text-section font-semibold text-foreground">
                Review receipt
              </h2>
            </div>

            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex items-start justify-between gap-4">
                <dt className="text-muted-foreground">
                  Supplier
                </dt>

                <dd className="text-right font-medium text-foreground">
                  {selectedSupplier
                    ?.name ??
                    'Not selected'}
                </dd>
              </div>

              <div className="flex items-start justify-between gap-4">
                <dt className="text-muted-foreground">
                  Reference
                </dt>

                <dd className="max-w-[60%] break-words text-right text-secondary-foreground">
                  {referenceNo.trim() ||
                    'None'}
                </dd>
              </div>

              <div className="flex items-start justify-between gap-4">
                <dt className="text-muted-foreground">
                  Products
                </dt>

                <dd className="font-medium tabular-nums text-foreground">
                  {
                    receiptItems.length
                  }
                </dd>
              </div>

              <div className="flex items-start justify-between gap-4">
                <dt className="text-muted-foreground">
                  Total units
                </dt>

                <dd className="font-medium tabular-nums text-foreground">
                  {receiptItems.reduce(
                    (
                      total,
                      item,
                    ) =>
                      total +
                      item.quantity,
                    0,
                  )}
                </dd>
              </div>
            </dl>

            {hasInvalidUnitCost && (
              <div
                role="alert"
                className="mt-4 rounded-lg border border-destructive/20 bg-destructive-soft p-3 text-sm text-secondary-foreground"
              >
                Correct the unit
                cost for each
                receipt item before
                recording.
              </div>
            )}

            <div className="mt-5 border-t border-border pt-5">
              <p className="text-caption font-medium text-muted-foreground">
                Step 5
              </p>

              <Button
                className="mt-2 min-h-14 w-full text-base"
                disabled={
                  !canSubmit
                }
                loading={
                  isSubmitting
                }
                onClick={() =>
                  void handleSubmit()
                }
              >
                {isSubmitting
                  ? 'Recording receipt...'
                  : 'Record Receipt'}
              </Button>
            </div>
          </Card>

          {selectedSupplier && (
            <div className="flex">
              <Badge variant="info">
                Receiving from{' '}
                {
                  selectedSupplier.name
                }
              </Badge>
            </div>
          )}
        </div>
      </div>
    </PageContainer>
  )
}