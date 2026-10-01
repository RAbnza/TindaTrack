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

import type {
  CreatedStockReceipt,
} from '../types/stock-receipt'

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
    completedReceipt,
    setCompletedReceipt,
  ] =
    useState<CreatedStockReceipt | null>(
      null,
    )

  const [
    isSubmitting,
    setIsSubmitting,
  ] = useState(false)

  const productsById = useMemo(
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

  function clearFeedback() {
    setSubmissionError(null)
    setCompletedReceipt(null)
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
      (currentItems) => {
        const alreadyExists =
          currentItems.some(
            (item) =>
              item.productId ===
              productId,
          )

        if (alreadyExists) {
          return currentItems
        }

        return [
          ...currentItems,
          {
            productId,
            quantity: 1,
            unitCost: '',
          },
        ]
      },
    )

    clearFeedback()
  }

  function handleDecrease(
    productId: number,
  ) {
    setReceiptItems(
      (currentItems) =>
        currentItems.map(
          (item) => {
            if (
              item.productId !==
              productId
            ) {
              return item
            }

            return {
              ...item,
              quantity:
                Math.max(
                  1,
                  item.quantity -
                    1,
                ),
            }
          },
        ),
    )

    clearFeedback()
  }

  function handleIncrease(
    productId: number,
  ) {
    setReceiptItems(
      (currentItems) =>
        currentItems.map(
          (item) => {
            if (
              item.productId !==
              productId
            ) {
              return item
            }

            return {
              ...item,
              quantity:
                item.quantity +
                1,
            }
          },
        ),
    )

    clearFeedback()
  }

  function handleUnitCostChange(
    productId: number,
    value: string,
  ) {
    setReceiptItems(
      (currentItems) =>
        currentItems.map(
          (item) =>
            item.productId ===
            productId
              ? {
                  ...item,
                  unitCost:
                    value,
                }
              : item,
        ),
    )

    clearFeedback()
  }

  function handleRemove(
    productId: number,
  ) {
    setReceiptItems(
      (currentItems) =>
        currentItems.filter(
          (item) =>
            item.productId !==
            productId,
        ),
    )

    clearFeedback()
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
    setCompletedReceipt(null)
    setIsSubmitting(true)

    try {
      const trimmedReferenceNo =
        referenceNo.trim()

      const receipt =
        await createStockReceipt(
          {
            supplierId,

            referenceNo:
              trimmedReferenceNo
                ? trimmedReferenceNo
                : null,

            items:
              receiptItems.map(
                (item) => ({
                  productId:
                    item.productId,

                  quantity:
                    item.quantity,

                  /*
                   * Keep unitCost as
                   * a decimal string.
                   */
                  unitCost:
                    item.unitCost.trim(),
                }),
              ),
          },
        )

      setCompletedReceipt(
        receipt,
      )

      /*
       * Only clear the form after
       * the server confirms success.
       */
      setSupplierId(null)
      setReferenceNo('')
      setSearch('')
      setReceiptItems([])

      await reloadProducts()
    } catch (error) {
      /*
       * Deliberately preserve:
       *
       * supplier
       * reference number
       * items
       * quantities
       * unit costs
       *
       * when submission fails.
       */
      if (
        error instanceof ApiError
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

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-5">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">
          Receive Stock
        </h1>

        <p className="mt-1 text-sm text-secondary-foreground">
          Record products received
          from a supplier.
        </p>
      </div>

      {completedReceipt && (
        <section
          role="status"
          className="mt-5 rounded-lg border border-success/20 bg-success-soft p-4"
        >
          <p className="font-semibold text-secondary-foreground">
            Stock receipt recorded
          </p>

          <p className="mt-1 text-sm text-secondary-foreground">
            Receipt #
            {completedReceipt.id}
          </p>

          {completedReceipt.referenceNo && (
            <p className="mt-1 text-sm text-secondary-foreground">
              Reference:{' '}
              {
                completedReceipt.referenceNo
              }
            </p>
          )}
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

      <section className="mt-6 space-y-5">
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
            onChange={(event) => {
              const value =
                event.target.value

              setSupplierId(
                value
                  ? Number(value)
                  : null,
              )

              clearFeedback()
            }}
            className="min-h-12 w-full rounded-lg border border-input bg-card px-4 text-base text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-ring/20 disabled:bg-secondary"
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

          {suppliersError && (
            <div className="mt-3 rounded-lg border border-destructive/20 bg-destructive-soft p-3">
              <p className="text-sm text-secondary-foreground">
                {suppliersError}
              </p>

              <button
                type="button"
                onClick={() =>
                  void reloadSuppliers()
                }
                className="mt-2 min-h-10 rounded-lg bg-destructive px-3 text-sm font-medium text-primary-foreground"
              >
                Try again
              </button>
            </div>
          )}

          {!isSuppliersLoading &&
            !suppliersError &&
            suppliers.length ===
              0 && (
              <p className="mt-2 text-sm text-warning">
                No active suppliers
                are available.
              </p>
            )}
        </div>

        <div>
          <label
            htmlFor="reference-no"
            className="mb-2 block text-sm font-medium text-secondary-foreground"
          >
            Reference no.
          </label>

          <input
            id="reference-no"
            type="text"
            value={referenceNo}
            onChange={(event) => {
              setReferenceNo(
                event.target.value,
              )

              clearFeedback()
            }}
            placeholder="Invoice / DR number (optional)"
            className="min-h-12 w-full rounded-lg border border-input bg-card px-4 text-base text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-ring/20"
          />
        </div>
      </section>

      <section className="mt-7">
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
          !isProductsLoading &&
          filteredProducts.length ===
            0 && (
            <div className="py-8 text-center text-sm text-secondary-foreground">
              No products found.
            </div>
          )}

        {!productsError &&
          filteredProducts.length >
            0 && (
            <div className="mt-3 space-y-3">
              {filteredProducts.map(
                (product) => (
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
      </section>

      <section className="mt-8 border-t border-border pt-6">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold text-foreground">
            Receipt items
          </h2>

          <span className="text-sm text-muted-foreground">
            {receiptItems.length}{' '}
            {receiptItems.length ===
            1
              ? 'item'
              : 'items'}
          </span>
        </div>

        {receiptItems.length ===
        0 ? (
          <div className="mt-3 rounded-lg border border-dashed border-input bg-card px-4 py-8 text-center">
            <p className="text-sm text-secondary-foreground">
              No products added yet.
            </p>
          </div>
        ) : (
          <div className="mt-3 space-y-3">
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
      </section>

      <section className="mt-8 border-t border-border pt-6">
        <button
          type="button"
          disabled={!canSubmit}
          onClick={() =>
            void handleSubmit()
          }
          className="min-h-14 w-full rounded-lg bg-primary px-5 text-base font-medium text-primary-foreground transition hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-muted disabled:text-disabled-foreground"
        >
          {isSubmitting
            ? 'Recording receipt...'
            : 'Record Stock Receipt'}
        </button>
      </section>
    </main>
  )
}
