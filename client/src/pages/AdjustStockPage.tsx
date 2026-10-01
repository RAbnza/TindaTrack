import { TransactionWorkspace } from '../components/workspace/TransactionWorkspace'
import { TransactionSummary } from '../components/workspace/TransactionSummary'
import { ProductBrowser } from '../components/workspace/ProductBrowser'
import { SelectedItems } from '../components/workspace/SelectedItems'
import {
  useTransactionCatalog,
  type TransactionProductsProps,
} from '../features/workspace/useTransactionCatalog'
import { FormField } from '../components/ui/Field'
import { QuantityControl } from '../components/ui/QuantityControl'
import { useMemo, useState } from 'react'

import { ApiError } from '../api/api'

import { createStockAdjustment } from '../api/stock-adjustments.api'

import { PageContainer } from '../components/layout/PageContainer'

import { Button, Card, ConfirmationDialog, PageHeader, useToast } from '../components/ui'

import type { AdjustmentType } from '../types/stock-adjustment'

export function AdjustStockPage(supplied: TransactionProductsProps) {
  const { showToast } = useToast()

  const [adjustmentType, setAdjustmentType] = useState<AdjustmentType>('ADD')

  const [selectedProductId, setSelectedProductId] = useState<number | null>(null)

  const [quantity, setQuantity] = useState(1)

  const [reason, setReason] = useState('')

  const [submissionError, setSubmissionError] = useState<string | null>(null)

  const [isSubmitting, setIsSubmitting] = useState(false)

  const [reductionDialogOpen, setReductionDialogOpen] = useState(false)

  const catalog = useTransactionCatalog(
    supplied,
    selectedProductId === null ? [] : [selectedProductId],
  )
  const { products, isProductsLoading, productsError, reloadProducts } = catalog
  const setSearch = (search: string) => catalog.updateQuery({ search })

  const selectedProduct = useMemo(
    () => products.find((product) => product.id === selectedProductId) ?? null,
    [products, selectedProductId],
  )

  const trimmedReason = reason.trim()

  const exceedsDisplayedStock =
    adjustmentType === 'REMOVE' &&
    selectedProduct !== null &&
    quantity > selectedProduct.currentStock

  const canSubmit =
    selectedProduct !== null &&
    quantity >= 1 &&
    Number.isInteger(quantity) &&
    trimmedReason.length > 0 &&
    !exceedsDisplayedStock &&
    !isProductsLoading &&
    !productsError &&
    !isSubmitting

  function clearError() {
    setSubmissionError(null)
  }

  function handleAdjustmentTypeChange(type: AdjustmentType) {
    setAdjustmentType(type)
    setQuantity(1)
    setReductionDialogOpen(false)
    clearError()
  }

  function handleSelectProduct(productId: number) {
    catalog.retainProduct(productId)
    setSelectedProductId(productId)

    setQuantity(1)
    setReductionDialogOpen(false)
    clearError()
  }

  function handleDecrease() {
    setQuantity((current) => Math.max(1, current - 1))

    clearError()
  }

  function handleIncrease() {
    setQuantity((current) => current + 1)

    clearError()
  }

  function validateAdjustment(): boolean {
    if (!selectedProduct || !selectedProduct.active) {
      setSubmissionError('Choose a product before recording an adjustment.')

      return false
    }

    if (!Number.isInteger(quantity) || quantity < 1) {
      setSubmissionError('Quantity must be at least 1.')

      return false
    }

    if (!trimmedReason) {
      setSubmissionError('Enter a reason for this adjustment.')

      return false
    }

    if (adjustmentType === 'REMOVE' && quantity > selectedProduct.currentStock) {
      setSubmissionError('Remove quantity cannot exceed the currently displayed stock.')

      return false
    }

    setSubmissionError(null)

    return true
  }

  function handleRecordClick() {
    if (!validateAdjustment()) {
      return
    }

    if (adjustmentType === 'REMOVE') {
      setReductionDialogOpen(true)

      return
    }

    void recordAdjustment()
  }

  async function recordAdjustment() {
    if (isSubmitting || !selectedProduct) {
      return
    }

    if (!validateAdjustment()) {
      setReductionDialogOpen(false)

      return
    }

    const quantityDelta = adjustmentType === 'ADD' ? quantity : -quantity

    setSubmissionError(null)
    setIsSubmitting(true)

    try {
      await createStockAdjustment({
        productId: selectedProduct.id,

        quantityDelta,

        reason: trimmedReason,
      })

      setReductionDialogOpen(false)

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
        variant: 'success',

        message: 'Stock adjustment recorded.',
      })
    } catch (error) {
      /*
       * Preserve the current adjustment
       * when submission fails.
       */
      if (error instanceof ApiError) {
        setSubmissionError(error.message)

        /*
         * The displayed stock may now
         * be stale, especially for a
         * reduction rejected by the
         * server.
         */
        if (error.status === 400) {
          await reloadProducts()
        }

        return
      }

      setSubmissionError('Unable to record the stock adjustment. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <PageContainer>
      <PageHeader
        title="Adjust Stock"
        description="Record a traceable correction for one product. Use receiving or sales for normal transactions."
      />
      <TransactionWorkspace
        busy={isSubmitting}
        count={selectedProduct ? 1 : 0}
        setup={
          <Card className="workflow-setup">
            <div>
              <p className="mb-2 text-ui font-medium">Direction</p>
              <div className="flex gap-2">
                <Button
                  variant={adjustmentType === 'ADD' ? 'primary' : 'secondary'}
                  aria-pressed={adjustmentType === 'ADD'}
                  onClick={() => handleAdjustmentTypeChange('ADD')}
                >
                  Add Stock
                </Button>
                <Button
                  variant={adjustmentType === 'REMOVE' ? 'danger' : 'secondary'}
                  aria-pressed={adjustmentType === 'REMOVE'}
                  onClick={() => handleAdjustmentTypeChange('REMOVE')}
                >
                  Remove Stock
                </Button>
              </div>
            </div>
            <FormField id="adjustment-reason" label="Reason">
              <textarea
                id="adjustment-reason"
                rows={2}
                className="field-control resize-y"
                value={reason}
                onChange={(e) => {
                  setReason(e.target.value)
                  clearError()
                }}
                placeholder="Inventory count correction, damaged items..."
              />
            </FormField>
          </Card>
        }
        browser={
          <ProductBrowser
            catalog={catalog}
            selectedIds={new Set(selectedProductId === null ? [] : [selectedProductId])}
            onAdd={handleSelectProduct}
            mode="adjustment"
          />
        }
        items={
          <SelectedItems
            items={selectedProduct ? [selectedProduct] : []}
            renderItem={(product) => (
              <article className="selected-item-row" key={product.id}>
                <h3 className="font-semibold">{product.name}</h3>
                <p className="text-caption text-muted-foreground">
                  {product.sku} · {product.currentStock} currently in stock
                </p>
                <div className="selected-item-fields">
                  <QuantityControl
                    label="adjustment quantity"
                    value={quantity}
                    onDecrease={handleDecrease}
                    onIncrease={handleIncrease}
                    max={adjustmentType === 'REMOVE' ? product.currentStock : undefined}
                    onChange={(value) => {
                      setQuantity(value)
                      clearError()
                    }}
                  />
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setSelectedProductId(null)
                      clearError()
                    }}
                  >
                    Remove
                  </Button>
                </div>
                {(!Number.isInteger(quantity) ||
                  quantity < 1 ||
                  exceedsDisplayedStock) && (
                  <p role="alert" className="mt-2 text-destructive">
                    Enter a positive whole quantity within available stock.
                  </p>
                )}
              </article>
            )}
          />
        }
        summary={
          <TransactionSummary
            title="Adjustment summary"
            count={selectedProduct ? 1 : 0}
            quantity={selectedProduct ? quantity : 0}
            total={
              selectedProduct
                ? `${adjustmentType === 'ADD' ? '+' : '−'}${quantity} units`
                : undefined
            }
            totalLabel="Inventory change"
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
                {!selectedProduct
                  ? 'Choose a product to continue.'
                  : !trimmedReason
                    ? 'Enter a reason for this correction.'
                    : !Number.isInteger(quantity) || quantity < 1
                      ? 'Enter a positive whole quantity in Selected items.'
                      : exceedsDisplayedStock
                        ? 'Remove quantity exceeds available stock.'
                        : adjustmentType === 'REMOVE'
                          ? 'Stock reductions require confirmation.'
                          : 'Ready to record this correction.'}
              </>
            }
            action={
              <Button
                variant={adjustmentType === 'REMOVE' ? 'danger' : 'primary'}
                className="w-full"
                disabled={!canSubmit}
                loading={isSubmitting}
                onClick={handleRecordClick}
              >
                {isSubmitting ? 'Recording adjustment...' : 'Record Adjustment'}
              </Button>
            }
          >
            <dl className="summary-facts">
              <div>
                <dt>Product</dt>
                <dd>{selectedProduct?.name ?? 'Not selected'}</dd>
              </div>
              <div>
                <dt>Resulting stock</dt>
                <dd>
                  {selectedProduct
                    ? selectedProduct.currentStock +
                      (adjustmentType === 'ADD' ? quantity : -quantity)
                    : '—'}
                </dd>
              </div>
              <div>
                <dt>Reason</dt>
                <dd>{trimmedReason || 'Not entered'}</dd>
              </div>
            </dl>
          </TransactionSummary>
        }
      />
      <ConfirmationDialog
        open={reductionDialogOpen}
        title="Confirm stock reduction?"
        description={
          selectedProduct
            ? `This will reduce recorded inventory for ${selectedProduct.name} by ${quantity} ${quantity === 1 ? 'unit' : 'units'}. Reason: ${trimmedReason}`
            : 'Confirm this stock reduction.'
        }
        confirmLabel="Record adjustment"
        cancelLabel="Cancel"
        variant="danger"
        loading={isSubmitting}
        onConfirm={() => void recordAdjustment()}
        onCancel={() => setReductionDialogOpen(false)}
      />
    </PageContainer>
  )
}
