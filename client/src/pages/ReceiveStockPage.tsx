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
        <h1 className="text-2xl font-bold text-slate-950">
          Receive Stock
        </h1>

        <p className="mt-1 text-sm text-slate-600">
          Record products received
          from a supplier.
        </p>
      </div>

      {completedReceipt && (
        <section
          role="status"
          className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4"
        >
          <p className="font-semibold text-emerald-900">
            Stock receipt recorded
          </p>

          <p className="mt-1 text-sm text-emerald-800">
            Receipt #
            {completedReceipt.id}
          </p>

          {completedReceipt.referenceNo && (
            <p className="mt-1 text-sm text-emerald-800">
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
          className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
        >
          {submissionError}
        </div>
      )}

      <section className="mt-6 space-y-5">
        <div>
          <label
            htmlFor="supplier"
            className="mb-2 block text-sm font-medium text-slate-800"
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
            className="min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-base text-slate-950 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 disabled:bg-slate-100"
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
            <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3">
              <p className="text-sm text-red-800">
                {suppliersError}
              </p>

              <button
                type="button"
                onClick={() =>
                  void reloadSuppliers()
                }
                className="mt-2 min-h-10 rounded-lg bg-red-700 px-3 text-sm font-semibold text-white"
              >
                Try again
              </button>
            </div>
          )}

          {!isSuppliersLoading &&
            !suppliersError &&
            suppliers.length ===
              0 && (
              <p className="mt-2 text-sm text-amber-700">
                No active suppliers
                are available.
              </p>
            )}
        </div>

        <div>
          <label
            htmlFor="reference-no"
            className="mb-2 block text-sm font-medium text-slate-800"
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
            className="min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-base text-slate-950 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
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
          className="min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-base text-slate-950 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
        />
      </section>

      <section className="mt-6">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-bold text-slate-950">
            Available products
          </h2>

          {isProductsLoading && (
            <span className="text-sm text-slate-500">
              Refreshing...
            </span>
          )}
        </div>

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

        {!productsError &&
          !isProductsLoading &&
          filteredProducts.length ===
            0 && (
            <div className="py-8 text-center text-sm text-slate-600">
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

      <section className="mt-8 border-t border-slate-200 pt-6">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-bold text-slate-950">
            Receipt items
          </h2>

          <span className="text-sm text-slate-500">
            {receiptItems.length}{' '}
            {receiptItems.length ===
            1
              ? 'item'
              : 'items'}
          </span>
        </div>

        {receiptItems.length ===
        0 ? (
          <div className="mt-3 rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-8 text-center">
            <p className="text-sm text-slate-600">
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

      <section className="mt-8 border-t border-slate-200 pt-6">
        <button
          type="button"
          disabled={!canSubmit}
          onClick={() =>
            void handleSubmit()
          }
          className="min-h-14 w-full rounded-2xl bg-emerald-700 px-5 text-base font-bold text-white transition hover:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-600"
        >
          {isSubmitting
            ? 'Recording receipt...'
            : 'Record Stock Receipt'}
        </button>
      </section>
    </main>
  )
}