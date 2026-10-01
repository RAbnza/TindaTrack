import { TransactionWorkspace } from '../components/workspace/TransactionWorkspace'
import { TransactionSummary } from '../components/workspace/TransactionSummary'
import { ProductBrowser } from '../components/workspace/ProductBrowser'
import { SelectedItems } from '../components/workspace/SelectedItems'
import {
  useTransactionCatalog,
  type TransactionProductsProps,
} from '../features/workspace/useTransactionCatalog'
import { useMemo, useState } from 'react'

import { ApiError } from '../api/api'

import { createSale } from '../api/sales.api'

import { PageContainer } from '../components/layout/PageContainer'

import { Button, PageHeader, useToast } from '../components/ui'

import { SaleCartItem } from '../features/sales/SaleCartItem'

import { SaleReceipt } from '../features/sales/SaleReceipt'

import type { CreatedSale, PaymentMethod } from '../types/sale'

type CartItem = {
  productId: number
  quantity: number
}

const paymentMethods: PaymentMethod[] = ['CASH', 'GCASH', 'MAYA']

const pesoFormatter = new Intl.NumberFormat('en-PH', {
  style: 'currency',
  currency: 'PHP',
})

export function NewSalePage(supplied: TransactionProductsProps) {
  const { showToast } = useToast()

  const [cart, setCart] = useState<CartItem[]>([])

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null)

  const [completedSale, setCompletedSale] = useState<CreatedSale | null>(null)

  const [submissionError, setSubmissionError] = useState<string | null>(null)

  const [isSubmitting, setIsSubmitting] = useState(false)

  const catalog = useTransactionCatalog(
    supplied,
    cart.map((item) => item.productId),
  )
  const { products, isProductsLoading, productsError, reloadProducts } = catalog
  const setSearch = (search: string) => catalog.updateQuery({ search })

  const productsById = useMemo(
    () => new Map(products.map((product) => [product.id, product])),
    [products],
  )

  const cartProductIds = useMemo(
    () => new Set(cart.map((item) => item.productId)),
    [cart],
  )

  const cartEstimate = useMemo(
    () =>
      cart.reduce((total, item) => {
        const product = productsById.get(item.productId)

        if (!product) {
          return total
        }

        return total + Number(product.sellingPrice) * item.quantity
      }, 0),
    [cart, productsById],
  )

  const cartHasInvalidStock = cart.some((item) => {
    const product = productsById.get(item.productId)

    if (!product || !product.active) {
      return true
    }

    return (
      !Number.isInteger(item.quantity) ||
      item.quantity < 1 ||
      item.quantity > product.currentStock
    )
  })

  const canSubmit =
    cart.length > 0 &&
    paymentMethod !== null &&
    !cartHasInvalidStock &&
    !isSubmitting &&
    !isProductsLoading &&
    !productsError

  function clearError() {
    setSubmissionError(null)
  }

  function handleAddProduct(productId: number) {
    catalog.retainProduct(productId)
    const product = productsById.get(productId)

    if (!product || !product.active || product.currentStock <= 0) {
      return
    }

    setCart((current) => {
      const alreadyExists = current.some((item) => item.productId === productId)

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
    })

    clearError()
  }

  function handleDecrease(productId: number) {
    setCart((current) =>
      current.map((item) =>
        item.productId === productId
          ? {
              ...item,

              quantity: Math.max(1, item.quantity - 1),
            }
          : item,
      ),
    )

    clearError()
  }

  function handleIncrease(productId: number) {
    const product = productsById.get(productId)

    if (!product) {
      return
    }

    setCart((current) =>
      current.map((item) => {
        if (item.productId !== productId) {
          return item
        }

        if (item.quantity >= product.currentStock) {
          return item
        }

        return {
          ...item,

          quantity: item.quantity + 1,
        }
      }),
    )

    clearError()
  }

  function handleRemove(productId: number) {
    setCart((current) => current.filter((item) => item.productId !== productId))

    clearError()
  }

  async function handleSubmit() {
    if (isSubmitting) {
      return
    }

    if (cart.length === 0) {
      setSubmissionError('Add at least one product before recording the sale.')

      return
    }

    if (!paymentMethod) {
      setSubmissionError('Choose a payment method before recording the sale.')

      return
    }

    if (cartHasInvalidStock) {
      setSubmissionError(
        'One or more quantities exceed the currently available stock. Review the cart before continuing.',
      )

      return
    }

    setSubmissionError(null)

    setIsSubmitting(true)

    try {
      const sale = await createSale({
        paymentMethod,

        items: cart.map((item) => ({
          productId: item.productId,

          quantity: item.quantity,
        })),
      })

      /*
       * Preserve the authoritative
       * server response for receipt
       * display and printing.
       */
      setCompletedSale(sale)

      setCart([])
      setPaymentMethod(null)
      setSearch('')

      await reloadProducts()

      showToast({
        variant: 'success',

        message: 'Sale recorded successfully.',
      })
    } catch (error) {
      if (error instanceof ApiError) {
        setSubmissionError(error.message)

        if (error.status === 400) {
          await reloadProducts()
        }

        return
      }

      setSubmissionError('Unable to record the sale. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <PageContainer>
      <PageHeader
        title="New Sale"
        description="Build the order, review quantities, and record payment."
      />
      {completedSale && (
        <SaleReceipt sale={completedSale} onDismiss={() => setCompletedSale(null)} />
      )}
      <TransactionWorkspace
        busy={isSubmitting}
        count={cart.length}
        setup={
          <fieldset
            className="workflow-setup rounded-lg border border-border"
            disabled={isSubmitting}
          >
            <legend className="px-2 font-semibold">Payment method</legend>
            <div className="flex flex-wrap gap-2">
              {paymentMethods.map((method) => (
                <Button
                  key={method}
                  variant={paymentMethod === method ? 'primary' : 'secondary'}
                  aria-pressed={paymentMethod === method}
                  onClick={() => {
                    setPaymentMethod(method)
                    clearError()
                  }}
                >
                  {method}
                </Button>
              ))}
            </div>
            <p className="text-ui text-secondary-foreground">
              Choose how the customer will pay. The receipt uses the final server total.
            </p>
          </fieldset>
        }
        browser={
          <ProductBrowser
            catalog={catalog}
            selectedIds={cartProductIds}
            onAdd={handleAddProduct}
            mode="sale"
          />
        }
        items={
          <SelectedItems
            items={cart}
            renderItem={(item) => {
              const product = productsById.get(item.productId)
              return product ? (
                <SaleCartItem
                  key={item.productId}
                  product={product}
                  quantity={item.quantity}
                  onDecrease={() => handleDecrease(item.productId)}
                  onIncrease={() => handleIncrease(item.productId)}
                  onQuantityChange={(quantity) => {
                    setCart((current) =>
                      current.map((i) =>
                        i.productId === item.productId ? { ...i, quantity } : i,
                      ),
                    )
                    clearError()
                  }}
                  onRemove={() => handleRemove(item.productId)}
                />
              ) : (
                <p key={item.productId} role="alert">
                  Product #{item.productId} is unavailable.{' '}
                  <Button
                    variant="secondary"
                    onClick={() => handleRemove(item.productId)}
                  >
                    Remove
                  </Button>
                </p>
              )
            }}
          />
        }
        summary={
          <TransactionSummary
            title="Sale summary"
            count={cart.length}
            quantity={cart.reduce((n, i) => n + i.quantity, 0)}
            total={pesoFormatter.format(cartEstimate)}
            issues={
              <>
                {productsError && (
                  <p role="alert" className="text-destructive">
                    {productsError}
                  </p>
                )}
                {submissionError && (
                  <p role="alert" className="text-destructive">
                    {submissionError}
                  </p>
                )}
                {cartHasInvalidStock ? (
                  <p role="alert" className="text-destructive">
                    Review quantities in Selected items. Stock must be available.
                  </p>
                ) : !paymentMethod ? (
                  'Choose a payment method to continue.'
                ) : cart.length === 0 ? (
                  'Add products to start the sale.'
                ) : (
                  'Ready to record. The server verifies stock and calculates the final total.'
                )}
              </>
            }
            action={
              <Button
                className="w-full"
                disabled={!canSubmit}
                loading={isSubmitting}
                onClick={() => void handleSubmit()}
              >
                {isSubmitting ? 'Recording sale...' : 'Record Sale'}
              </Button>
            }
          >
            <dl className="summary-facts">
              <div>
                <dt>Payment</dt>
                <dd>{paymentMethod ?? 'Not selected'}</dd>
              </div>
            </dl>
            <p className="summary-help">
              Cart prices are estimates. The completed receipt preserves the server
              response.
            </p>
          </TransactionSummary>
        }
      />
    </PageContainer>
  )
}
