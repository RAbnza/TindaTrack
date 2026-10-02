import { TransactionWorkspace } from '../components/workspace/TransactionWorkspace'
import { TransactionSummary } from '../components/workspace/TransactionSummary'
import { ProductBrowser } from '../components/workspace/ProductBrowser'
import { SelectedItems } from '../components/workspace/SelectedItems'
import {
  useTransactionCatalog,
  type TransactionProductsProps,
} from '../features/workspace/useTransactionCatalog'
import { FormField, Input, Select } from '../components/ui/Field'
import { useMemo, useState } from 'react'

import { ApiError } from '../api/api'

import { createStockReceipt } from '../api/stock-receipts.api'

import { PageContainer } from '../components/layout/PageContainer'

import { Button, Card, ErrorState, PageHeader, useToast } from '../components/ui'
import { AppIcon } from '../components/AppIcon'

import { ReceiptItemCard } from '../features/receiving/ReceiptItemCard'

import { useSuppliers } from '../features/receiving/useSuppliers'

type ReceiptItem = {
  productId: number
  quantity: number
  unitCost: string
}

const unitCostPattern = /^\d+(?:\.\d{1,2})?$/

function getUnitCostError(unitCost: string): string | null {
  const trimmed = unitCost.trim()

  if (!trimmed) {
    return 'Unit cost is required.'
  }

  if (!unitCostPattern.test(trimmed)) {
    return 'Enter a non-negative amount with up to 2 decimal places.'
  }

  return null
}

export function ReceiveStockPage(supplied: TransactionProductsProps) {
  const {
    suppliers,
    isLoading: isSuppliersLoading,
    error: suppliersError,
    reload: reloadSuppliers,
  } = useSuppliers()

  const { showToast } = useToast()

  const [supplierId, setSupplierId] = useState<number | null>(null)

  const [referenceNo, setReferenceNo] = useState('')

  const [receiptItems, setReceiptItems] = useState<ReceiptItem[]>([])

  const [submissionError, setSubmissionError] = useState<string | null>(null)

  const [isSubmitting, setIsSubmitting] = useState(false)

  const catalog = useTransactionCatalog(
    supplied,
    receiptItems.map((item) => item.productId),
  )
  const { products, isProductsLoading, productsError, reloadProducts } = catalog
  const setSearch = (search: string) => catalog.updateQuery({ search })

  const productsById = useMemo(
    () => new Map(products.map((product) => [product.id, product])),
    [products],
  )

  const receiptProductIds = useMemo(
    () => new Set(receiptItems.map((item) => item.productId)),
    [receiptItems],
  )

  const selectedSupplier = useMemo(
    () => suppliers.find((supplier) => supplier.id === supplierId) ?? null,
    [suppliers, supplierId],
  )

  const hasInvalidUnitCost = receiptItems.some(
    (item) => getUnitCostError(item.unitCost) !== null,
  )

  const hasInvalidItems = receiptItems.some(
    (item) =>
      !Number.isInteger(item.quantity) ||
      item.quantity < 1 ||
      !productsById.get(item.productId)?.active,
  )

  const canSubmit =
    supplierId !== null &&
    selectedSupplier !== null &&
    receiptItems.length > 0 &&
    !hasInvalidUnitCost &&
    !hasInvalidItems &&
    !productsError &&
    !suppliersError &&
    !isSubmitting &&
    !isProductsLoading &&
    !isSuppliersLoading

  function clearError() {
    setSubmissionError(null)
  }

  function handleAddProduct(productId: number) {
    catalog.retainProduct(productId)
    const product = productsById.get(productId)

    if (!product || !product.active) {
      return
    }

    setReceiptItems((current) => {
      if (current.some((item) => item.productId === productId)) {
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
    })

    clearError()
  }

  function handleDecrease(productId: number) {
    setReceiptItems((current) =>
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
    setReceiptItems((current) =>
      current.map((item) =>
        item.productId === productId
          ? {
              ...item,

              quantity: item.quantity + 1,
            }
          : item,
      ),
    )

    clearError()
  }

  function handleUnitCostChange(productId: number, value: string) {
    setReceiptItems((current) =>
      current.map((item) =>
        item.productId === productId
          ? {
              ...item,
              unitCost: value,
            }
          : item,
      ),
    )

    clearError()
  }

  function handleRemove(productId: number) {
    setReceiptItems((current) => current.filter((item) => item.productId !== productId))

    clearError()
  }

  async function handleSubmit() {
    if (isSubmitting) {
      return
    }

    if (supplierId === null) {
      setSubmissionError('Choose a supplier before recording the receipt.')

      return
    }

    if (receiptItems.length === 0) {
      setSubmissionError('Add at least one product before recording the receipt.')

      return
    }

    if (hasInvalidUnitCost || hasInvalidItems) {
      setSubmissionError('Correct the unit cost for each receipt item before continuing.')

      return
    }

    setSubmissionError(null)
    setIsSubmitting(true)

    try {
      const trimmedReference = referenceNo.trim()

      await createStockReceipt({
        supplierId,

        referenceNo: trimmedReference ? trimmedReference : null,

        items: receiptItems.map((item) => ({
          productId: item.productId,

          quantity: item.quantity,

          unitCost: item.unitCost.trim(),
        })),
      })

      setSupplierId(null)
      setReferenceNo('')
      setSearch('')
      setReceiptItems([])

      await reloadProducts()

      showToast({
        variant: 'success',

        message: 'Stock receipt recorded.',
      })
    } catch (error) {
      /*
       * Preserve supplier, reference
       * number and line items on failure.
       */
      if (error instanceof ApiError) {
        setSubmissionError(error.message)

        return
      }

      setSubmissionError('Unable to record the stock receipt. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const quantityTotal = receiptItems.reduce((n, i) => n + i.quantity, 0)
  const costTotal = receiptItems.reduce(
    (n, i) => n + (getUnitCostError(i.unitCost) ? 0 : Number(i.unitCost) * i.quantity),
    0,
  )
  return (
    <PageContainer>
      <PageHeader
        icon="receiving"
        title="Receive Stock"
        description="Choose a supplier, add received products, and review delivery costs."
      />
      <TransactionWorkspace
        busy={isSubmitting}
        count={receiptItems.length}
        setup={
          <Card className="workflow-setup">
            <FormField id="supplier" label="Supplier">
              <Select
                id="supplier"
                value={supplierId ?? ''}
                disabled={isSuppliersLoading || isSubmitting}
                onChange={(e) => {
                  setSupplierId(e.target.value ? Number(e.target.value) : null)
                  clearError()
                }}
              >
                <option value="">
                  {isSuppliersLoading ? 'Loading suppliers...' : 'Choose supplier'}
                </option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField
              id="reference-no"
              label="Reference number"
              hint="Optional invoice or delivery reference"
            >
              <Input
                id="reference-no"
                value={referenceNo}
                disabled={isSubmitting}
                onChange={(e) => {
                  setReferenceNo(e.target.value)
                  clearError()
                }}
              />
            </FormField>
            {suppliersError && (
              <ErrorState
                title="Unable to load suppliers"
                message={suppliersError}
                onRetry={() => void reloadSuppliers()}
              />
            )}
            {!isSuppliersLoading && !suppliersError && suppliers.length === 0 && (
              <p role="status" className="text-warning">
                No active suppliers are available.
              </p>
            )}
          </Card>
        }
        browser={
          <ProductBrowser
            catalog={catalog}
            selectedIds={receiptProductIds}
            onAdd={handleAddProduct}
            mode="receipt"
          />
        }
        items={
          <SelectedItems
            items={receiptItems}
            renderItem={(item) => {
              const product = productsById.get(item.productId)
              return product ? (
                <ReceiptItemCard
                  key={item.productId}
                  product={product}
                  quantity={item.quantity}
                  unitCost={item.unitCost}
                  unitCostError={getUnitCostError(item.unitCost)}
                  onDecrease={() => handleDecrease(item.productId)}
                  onIncrease={() => handleIncrease(item.productId)}
                  onQuantityChange={(quantity) => {
                    setReceiptItems((current) =>
                      current.map((i) =>
                        i.productId === item.productId ? { ...i, quantity } : i,
                      ),
                    )
                    clearError()
                  }}
                  onUnitCostChange={(value) =>
                    handleUnitCostChange(item.productId, value)
                  }
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
            title="Receipt summary"
            count={receiptItems.length}
            quantity={quantityTotal}
            total={new Intl.NumberFormat('en-PH', {
              style: 'currency',
              currency: 'PHP',
            }).format(costTotal)}
            totalLabel="Delivery cost estimate"
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
                {hasInvalidUnitCost || hasInvalidItems
                  ? 'Review quantities and unit costs in Selected items.'
                  : !supplierId
                    ? 'Choose a supplier to continue.'
                    : receiptItems.length === 0
                      ? 'Add received products to continue.'
                      : 'Ready to record this delivery.'}
              </>
            }
            action={
              <Button
                className="w-full"
                disabled={!canSubmit}
                loading={isSubmitting}
                onClick={() => void handleSubmit()}
              >
                {!isSubmitting && <AppIcon name="receiving" />}
                {isSubmitting ? 'Recording receipt...' : 'Record Receipt'}
              </Button>
            }
          >
            <dl className="summary-facts">
              <div>
                <dt>Supplier</dt>
                <dd>{selectedSupplier?.name ?? 'Not selected'}</dd>
              </div>
              <div>
                <dt>Reference</dt>
                <dd>{referenceNo.trim() || 'None'}</dd>
              </div>
            </dl>
            <p className="summary-help">
              Enter every unit cost. Incomplete costs are excluded from this estimate.
            </p>
          </TransactionSummary>
        }
      />
    </PageContainer>
  )
}
