import {
  useMemo,
  useState,
} from 'react'

import {
  ApiError,
} from '../api/api'

import {
  createSale,
} from '../api/sales.api'

import {
  PageContainer,
} from '../components/layout/PageContainer'

import {
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
} from '../features/sales/AvailableProductCard'

import {
  SaleCartItem,
} from '../features/sales/SaleCartItem'

import type {
  Product,
} from '../types/product'

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

const paymentMethods:
  PaymentMethod[] = [
    'CASH',
    'GCASH',
    'MAYA',
  ]

const pesoFormatter =
  new Intl.NumberFormat(
    'en-PH',
    {
      style: 'currency',
      currency: 'PHP',
    },
  )

function formatSaleDateTime(
  value: string,
): string {
  return new Intl.DateTimeFormat(
    'en-PH',
    {
      timeZone:
        'Asia/Manila',

      year: 'numeric',
      month: 'long',
      day: 'numeric',

      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    },
  ).format(
    new Date(value),
  )
}

export function NewSalePage({
  products,
  isProductsLoading,
  productsError,
  reloadProducts,
}: NewSalePageProps) {
  const {
    showToast,
  } = useToast()

  const [
    search,
    setSearch,
  ] = useState('')

  const [
    cart,
    setCart,
  ] = useState<CartItem[]>(
    [],
  )

  const [
    paymentMethod,
    setPaymentMethod,
  ] =
    useState<PaymentMethod | null>(
      null,
    )

  const [
    completedSale,
    setCompletedSale,
  ] =
    useState<CreatedSale | null>(
      null,
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

  const cartProductIds =
    useMemo(
      () =>
        new Set(
          cart.map(
            (item) =>
              item.productId,
          ),
        ),
      [cart],
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

  /*
   * This is only a checkout estimate.
   *
   * It is never submitted to the API.
   * The backend recalculates the real
   * transaction total from Product prices.
   */
  const cartEstimate =
    useMemo(
      () =>
        cart.reduce(
          (
            total,
            item,
          ) => {
            const product =
              productsById.get(
                item.productId,
              )

            if (!product) {
              return total
            }

            return (
              total +
              Number(
                product.sellingPrice,
              ) *
                item.quantity
            )
          },
          0,
        ),
      [
        cart,
        productsById,
      ],
    )

  const cartHasInvalidStock =
    cart.some(
      (item) => {
        const product =
          productsById.get(
            item.productId,
          )

        if (
          !product ||
          !product.active
        ) {
          return true
        }

        return (
          item.quantity < 1 ||
          item.quantity >
            product.currentStock
        )
      },
    )

  const canSubmit =
    cart.length > 0 &&
    paymentMethod !== null &&
    !cartHasInvalidStock &&
    !isSubmitting &&
    !isProductsLoading

  function clearError() {
    setSubmissionError(
      null,
    )
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
      !product.active ||
      product.currentStock <= 0
    ) {
      return
    }

    setCart(
      (current) => {
        const alreadyExists =
          current.some(
            (item) =>
              item.productId ===
              productId,
          )

        if (alreadyExists) {
          return current
        }

        return [
          ...current,
          {
            productId,
            quantity: 1,
          },
        ]
      },
    )

    clearError()
  }

  function handleDecrease(
    productId: number,
  ) {
    setCart(
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
    const product =
      productsById.get(
        productId,
      )

    if (!product) {
      return
    }

    setCart(
      (current) =>
        current.map(
          (item) => {
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
                item.quantity +
                1,
            }
          },
        ),
    )

    clearError()
  }

  function handleRemove(
    productId: number,
  ) {
    setCart(
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

    if (
      cart.length === 0
    ) {
      setSubmissionError(
        'Add at least one product before recording the sale.',
      )

      return
    }

    if (!paymentMethod) {
      setSubmissionError(
        'Choose a payment method before recording the sale.',
      )

      return
    }

    if (
      cartHasInvalidStock
    ) {
      setSubmissionError(
        'One or more quantities exceed the currently available stock. Review the cart before continuing.',
      )

      return
    }

    setSubmissionError(
      null,
    )

    setIsSubmitting(
      true,
    )

    try {
      /*
       * No client total, unit price or
       * line total is submitted.
       */
      const sale =
        await createSale({
          paymentMethod,

          items:
            cart.map(
              (item) => ({
                productId:
                  item.productId,

                quantity:
                  item.quantity,
              }),
            ),
        })

      /*
       * Preserve the authoritative
       * server response for printing.
       */
      setCompletedSale(
        sale,
      )

      /*
       * Reset the checkout only after
       * the transaction succeeds.
       */
      setCart([])
      setPaymentMethod(null)
      setSearch('')

      await reloadProducts()

      showToast({
        variant:
          'success',

        message:
          'Sale recorded successfully.',
      })
    } catch (error) {
      if (
        error instanceof
        ApiError
      ) {
        setSubmissionError(
          error.message,
        )

        /*
         * A 400 can mean stock changed
         * on another device.
         */
        if (
          error.status === 400
        ) {
          await reloadProducts()
        }

        return
      }

      setSubmissionError(
        'Unable to record the sale. Please try again.',
      )
    } finally {
      setIsSubmitting(
        false,
      )
    }
  }

  const hasSearch =
    search.trim().length > 0

  return (
    <PageContainer>
      <PageHeader
        title="New Sale"
        description="Add products, review the order, choose payment, then record the sale."
      />

      {completedSale && (
        <Card className="print-document mt-6 overflow-hidden">
          <div className="no-print flex flex-col gap-3 border-b border-success/20 bg-success-soft p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold text-foreground">
                Sale recorded
              </p>

              <p className="mt-1 text-sm text-secondary-foreground">
                Sale #
                {
                  completedSale.id
                }{' '}
                is ready to print.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                variant="secondary"
                onClick={() =>
                  window.print()
                }
              >
                Print receipt
              </Button>

              <Button
                variant="ghost"
                onClick={() =>
                  setCompletedSale(
                    null,
                  )
                }
              >
                Dismiss
              </Button>
            </div>
          </div>

          <div className="receipt-print-body p-5 sm:p-6">
            <header className="text-center">
              <h2 className="text-lg font-semibold tracking-tight text-foreground">
                TindaTrack
              </h2>

              <p className="mt-1 text-sm text-muted-foreground">
                Sale Receipt
              </p>
            </header>

            <dl className="mt-6 space-y-2 border-y border-border py-4 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">
                  Transaction
                </dt>

                <dd className="font-medium text-foreground">
                  #
                  {
                    completedSale.id
                  }
                </dd>
              </div>

              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">
                  Date & time
                </dt>

                <dd className="text-right font-medium text-foreground">
                  {formatSaleDateTime(
                    completedSale.createdAt,
                  )}
                </dd>
              </div>

              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">
                  Recorded by
                </dt>

                <dd className="text-right font-medium text-foreground">
                  {
                    completedSale.recordedByName
                  }
                </dd>
              </div>

              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">
                  Payment
                </dt>

                <dd className="font-medium text-foreground">
                  {
                    completedSale.paymentMethod
                  }
                </dd>
              </div>
            </dl>

            <section className="mt-5">
              <h3 className="text-sm font-semibold text-foreground">
                Items
              </h3>

              <div className="mt-3 divide-y divide-border">
                {completedSale.items.map(
                  (item) => (
                    <div
                      key={
                        item.productId
                      }
                      className="flex items-start justify-between gap-4 py-3"
                    >
                      <div className="min-w-0">
                        <p className="font-medium text-foreground">
                          {
                            item.productName
                          }
                        </p>

                        <p className="mt-1 text-sm text-muted-foreground">
                          {
                            item.quantity
                          }{' '}
                          ×{' '}
                          {pesoFormatter.format(
                            Number(
                              item.unitPrice,
                            ),
                          )}
                        </p>
                      </div>

                      <p className="shrink-0 font-medium tabular-nums text-foreground">
                        {pesoFormatter.format(
                          Number(
                            item.lineTotal,
                          ),
                        )}
                      </p>
                    </div>
                  ),
                )}
              </div>
            </section>

            <div className="mt-5 flex items-end justify-between gap-4 border-t border-border pt-4">
              <p className="font-semibold text-foreground">
                Total
              </p>

              <p className="text-xl font-semibold tabular-nums text-foreground">
                {pesoFormatter.format(
                  Number(
                    completedSale.totalAmount,
                  ),
                )}
              </p>
            </div>
          </div>
        </Card>
      )}

      {submissionError && (
        <div
          role="alert"
          className="mt-6 rounded-lg border border-destructive/20 bg-destructive-soft p-4 text-sm leading-6 text-secondary-foreground"
        >
          {submissionError}
        </div>
      )}

      <div className="mt-6 grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(19rem,0.85fr)]">
        <Card className="min-w-0 p-4 sm:p-5">
          <div>
            <p className="text-caption font-medium text-muted-foreground">
              Step 1
            </p>

            <h2 className="mt-1 text-section font-semibold text-foreground">
              Find products
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Choose active
              products that are
              currently in stock.
            </p>
          </div>

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
                      : 'There are no active products available for sale.'
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

            {isProductsLoading &&
              products.length >
                0 && (
                <p
                  role="status"
                  className="mt-3 text-xs text-muted-foreground"
                >
                  Refreshing stock...
                </p>
              )}
          </div>
        </Card>

        <div className="min-w-0 space-y-4 lg:sticky lg:top-4 lg:self-start">
          <Card className="p-4 sm:p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-caption font-medium text-muted-foreground">
                  Step 2
                </p>

                <h2 className="mt-1 text-section font-semibold text-foreground">
                  Review cart
                </h2>
              </div>

              <span className="text-sm tabular-nums text-muted-foreground">
                {cart.length}{' '}
                {cart.length ===
                1
                  ? 'item'
                  : 'items'}
              </span>
            </div>

            {cart.length ===
            0 ? (
              <div className="mt-5 rounded-lg border border-dashed border-border px-4 py-8 text-center">
                <p className="text-sm text-muted-foreground">
                  Add products from
                  the list to begin
                  this sale.
                </p>
              </div>
            ) : (
              <div className="mt-5 space-y-3">
                {cart.map(
                  (item) => {
                    const product =
                      productsById.get(
                        item.productId,
                      )

                    if (!product) {
                      return null
                    }

                    return (
                      <SaleCartItem
                        key={
                          item.productId
                        }
                        product={
                          product
                        }
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
                  },
                )}
              </div>
            )}
          </Card>

          <Card className="p-4 sm:p-5">
            <fieldset>
              <legend>
                <span className="text-caption font-medium text-muted-foreground">
                  Step 3
                </span>

                <span className="mt-1 block text-section font-semibold text-foreground">
                  Payment method
                </span>
              </legend>

              <div className="mt-4 grid grid-cols-3 gap-2">
                {paymentMethods.map(
                  (method) => {
                    const selected =
                      paymentMethod ===
                      method

                    return (
                      <button
                        key={
                          method
                        }
                        type="button"
                        aria-pressed={
                          selected
                        }
                        onClick={() => {
                          setPaymentMethod(
                            method,
                          )

                          clearError()
                        }}
                        className={[
                          'min-h-11 rounded-lg border px-2 text-sm font-medium transition-colors',
                          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                          selected
                            ? 'border-primary bg-accent text-accent-foreground'
                            : 'border-border bg-card text-secondary-foreground hover:bg-secondary',
                        ].join(
                          ' ',
                        )}
                      >
                        {method}
                      </button>
                    )
                  },
                )}
              </div>
            </fieldset>
          </Card>

          <Card className="p-4 sm:p-5">
            <div>
              <p className="text-caption font-medium text-muted-foreground">
                Step 4
              </p>

              <div className="mt-1 flex items-end justify-between gap-4">
                <div>
                  <h2 className="text-section font-semibold text-foreground">
                    Review total
                  </h2>

                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    Cart estimate only.
                    The server
                    recalculates the
                    final sale total
                    when recorded.
                  </p>
                </div>

                <p className="shrink-0 text-metric-primary font-semibold tabular-nums text-foreground">
                  {pesoFormatter.format(
                    cartEstimate,
                  )}
                </p>
              </div>
            </div>

            {cartHasInvalidStock && (
              <div
                role="alert"
                className="mt-4 rounded-lg border border-destructive/20 bg-destructive-soft p-3 text-sm text-secondary-foreground"
              >
                One or more cart
                quantities exceed
                the latest displayed
                stock.
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
                  ? 'Recording sale...'
                  : 'Record Sale'}
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </PageContainer>
  )
}