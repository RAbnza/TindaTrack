import {
  useMemo,
  useState,
  type FormEvent,
} from 'react'

import {
  ApiError,
} from '../api/api'

import {
  createProduct,
  updateProduct,
} from '../api/products.api'

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

type ProductManagementPageProps = {
  products: Product[]
  isLoading: boolean
  error: string | null
  reload: () => Promise<void>
}

type FormMode =
  | 'CREATE'
  | 'EDIT'
  | null

type ProductFormState = {
  sku: string
  name: string
  category: string
  sellingPrice: string
  reorderLevel: string
}

const emptyForm: ProductFormState = {
  sku: '',
  name: '',
  category: '',
  sellingPrice: '',
  reorderLevel: '0',
}

const pesoFormatter =
  new Intl.NumberFormat(
    'en-PH',
    {
      style: 'currency',
      currency: 'PHP',
    },
  )

export function ProductManagementPage({
  products,
  isLoading,
  error,
  reload,
}: ProductManagementPageProps) {
  const {
    showToast,
  } = useToast()

  const [
    formMode,
    setFormMode,
  ] = useState<FormMode>(
    null,
  )

  const [
    editingProductId,
    setEditingProductId,
  ] = useState<number | null>(
    null,
  )

  const [
    form,
    setForm,
  ] =
    useState<ProductFormState>(
      emptyForm,
    )

  const [
    search,
    setSearch,
  ] = useState('')

  const [
    formError,
    setFormError,
  ] = useState<string | null>(
    null,
  )

  const [
    isSubmitting,
    setIsSubmitting,
  ] = useState(false)

  const [
    isChangingStatus,
    setIsChangingStatus,
  ] = useState(false)

  const [
    deactivateDialogOpen,
    setDeactivateDialogOpen,
  ] = useState(false)

  const editingProduct =
    useMemo(
      () =>
        products.find(
          (product) =>
            product.id ===
            editingProductId,
        ) ?? null,
      [
        products,
        editingProductId,
      ],
    )

  const filteredProducts =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase()

      if (!query) {
        return products
      }

      return products.filter(
        (product) =>
          product.name
            .toLowerCase()
            .includes(query) ||
          product.sku
            .toLowerCase()
            .includes(query),
      )
    }, [
      products,
      search,
    ])

  function resetForm() {
    setFormMode(null)
    setEditingProductId(null)
    setForm(emptyForm)
    setFormError(null)
    setDeactivateDialogOpen(
      false,
    )
  }

  function handleCreate() {
    setFormError(null)
    setEditingProductId(null)
    setForm(emptyForm)
    setFormMode('CREATE')
  }

  function handleEdit(
    product: Product,
  ) {
    setFormError(null)

    setEditingProductId(
      product.id,
    )

    setForm({
      sku: product.sku,
      name: product.name,

      category:
        product.category ??
        '',

      sellingPrice:
        product.sellingPrice,

      reorderLevel:
        String(
          product.reorderLevel,
        ),
    })

    setFormMode('EDIT')
  }

  function updateForm(
    field:
      keyof ProductFormState,
    value: string,
  ) {
    setForm(
      (current) => ({
        ...current,
        [field]: value,
      }),
    )

    setFormError(null)
  }

  async function handleSubmit(
    event:
      FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    if (isSubmitting) {
      return
    }

    const reorderLevel =
      Number(
        form.reorderLevel,
      )

    if (
      !Number.isInteger(
        reorderLevel,
      ) ||
      reorderLevel < 0
    ) {
      setFormError(
        'Reorder level must be a whole number greater than or equal to 0.',
      )

      return
    }

    setFormError(null)
    setIsSubmitting(true)

    const category =
      form.category.trim()
        ? form.category.trim()
        : null

    try {
      if (
        formMode ===
        'CREATE'
      ) {
        await createProduct({
          sku: form.sku,
          name: form.name,
          category,

          sellingPrice:
            form.sellingPrice,

          reorderLevel,
        })

        await reload()

        resetForm()

        showToast({
          variant:
            'success',

          message:
            'Product created.',
        })

        return
      }

      if (
        formMode ===
          'EDIT' &&
        editingProduct
      ) {
        await updateProduct(
          editingProduct.id,
          {
            sku: form.sku,
            name: form.name,
            category,

            sellingPrice:
              form.sellingPrice,

            reorderLevel,
          },
        )

        await reload()

        resetForm()

        showToast({
          variant:
            'success',

          message:
            'Product updated.',
        })
      }
    } catch (error) {
      if (
        error instanceof
        ApiError
      ) {
        setFormError(
          error.status === 403
            ? 'You do not have permission to manage products.'
            : error.message,
        )

        return
      }

      setFormError(
        'Unable to save the product. Please try again.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  async function changeProductStatus(
    nextActive: boolean,
  ) {
    if (
      !editingProduct ||
      isChangingStatus
    ) {
      return
    }

    setFormError(null)
    setIsChangingStatus(true)

    try {
      await updateProduct(
        editingProduct.id,
        {
          active:
            nextActive,
        },
      )

      await reload()

      setDeactivateDialogOpen(
        false,
      )

      showToast({
        variant:
          'success',

        message:
          nextActive
            ? 'Product reactivated.'
            : 'Product deactivated.',
      })
    } catch (error) {
      if (
        error instanceof
        ApiError
      ) {
        setFormError(
          error.status === 403
            ? 'You do not have permission to manage products.'
            : error.message,
        )

        return
      }

      setFormError(
        'Unable to change product status. Please try again.',
      )
    } finally {
      setIsChangingStatus(
        false,
      )
    }
  }

  const hasSearch =
    search.trim().length > 0

  return (
    <PageContainer>
      <PageHeader
        icon="products"
        title="Products"
        description="Manage product details, selling prices, reorder levels, and availability."
        actions={
          <Button
            onClick={
              handleCreate
            }
          >
            Add Product
          </Button>
        }
      />

      {formMode && (
        <Card className="mt-6 p-4 sm:p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-section font-semibold text-foreground">
                {formMode ===
                'CREATE'
                  ? 'Add Product'
                  : 'Edit Product'}
              </h2>

              <p className="mt-1 max-w-xl text-sm leading-6 text-muted-foreground">
                Product details do
                not directly change
                inventory. Stock is
                controlled through
                receipts, sales, and
                adjustments.
              </p>
            </div>

            <Button
              variant="ghost"
              onClick={
                resetForm
              }
            >
              Cancel
            </Button>
          </div>

          <form
            className="mt-5"
            onSubmit={
              handleSubmit
            }
          >
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="product-sku"
                  className="mb-2 block text-sm font-medium text-secondary-foreground"
                >
                  SKU
                </label>

                <input
                  id="product-sku"
                  type="text"
                  required
                  value={
                    form.sku
                  }
                  onChange={(
                    event,
                  ) =>
                    updateForm(
                      'sku',
                      event
                        .target
                        .value,
                    )
                  }
                  className="min-h-12 w-full rounded-lg border border-input bg-card px-4 text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-ring/20"
                />
              </div>

              <div>
                <label
                  htmlFor="product-name"
                  className="mb-2 block text-sm font-medium text-secondary-foreground"
                >
                  Name
                </label>

                <input
                  id="product-name"
                  type="text"
                  required
                  value={
                    form.name
                  }
                  onChange={(
                    event,
                  ) =>
                    updateForm(
                      'name',
                      event
                        .target
                        .value,
                    )
                  }
                  className="min-h-12 w-full rounded-lg border border-input bg-card px-4 text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-ring/20"
                />
              </div>

              <div>
                <label
                  htmlFor="product-category"
                  className="mb-2 block text-sm font-medium text-secondary-foreground"
                >
                  Category
                </label>

                <input
                  id="product-category"
                  type="text"
                  value={
                    form.category
                  }
                  onChange={(
                    event,
                  ) =>
                    updateForm(
                      'category',
                      event
                        .target
                        .value,
                    )
                  }
                  placeholder="Optional"
                  className="min-h-12 w-full rounded-lg border border-input bg-card px-4 text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-ring/20"
                />
              </div>

              <div>
                <label
                  htmlFor="product-price"
                  className="mb-2 block text-sm font-medium text-secondary-foreground"
                >
                  Selling price
                </label>

                <div className="relative">
                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                    ₱
                  </span>

                  <input
                    id="product-price"
                    type="text"
                    inputMode="decimal"
                    required
                    value={
                      form.sellingPrice
                    }
                    onChange={(
                      event,
                    ) =>
                      updateForm(
                        'sellingPrice',
                        event
                          .target
                          .value,
                      )
                    }
                    placeholder="75.00"
                    className="min-h-12 w-full rounded-lg border border-input bg-card py-2 pl-9 pr-4 text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-ring/20"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="product-reorder-level"
                  className="mb-2 block text-sm font-medium text-secondary-foreground"
                >
                  Reorder level
                </label>

                <input
                  id="product-reorder-level"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  step={1}
                  required
                  value={
                    form.reorderLevel
                  }
                  onChange={(
                    event,
                  ) =>
                    updateForm(
                      'reorderLevel',
                      event
                        .target
                        .value,
                    )
                  }
                  className="min-h-12 w-full rounded-lg border border-input bg-card px-4 text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-ring/20"
                />
              </div>

              {formMode ===
                'EDIT' &&
                editingProduct && (
                  <div>
                    <p className="mb-2 text-sm font-medium text-secondary-foreground">
                      Current stock
                    </p>

                    <div className="flex min-h-12 items-center justify-between rounded-lg border border-border bg-secondary/40 px-4">
                      <span className="font-medium tabular-nums text-foreground">
                        {
                          editingProduct.currentStock
                        }
                      </span>

                      <span className="text-xs text-muted-foreground">
                        Read-only
                      </span>
                    </div>
                  </div>
                )}
            </div>

            {formError && (
              <div
                role="alert"
                className="mt-5 rounded-lg border border-destructive/20 bg-destructive-soft p-3 text-sm text-secondary-foreground"
              >
                {formError}
              </div>
            )}

            <div className="mt-5 flex justify-end">
              <Button
                type="submit"
                loading={
                  isSubmitting
                }
              >
                {formMode ===
                'CREATE'
                  ? 'Create Product'
                  : 'Save Changes'}
              </Button>
            </div>
          </form>

          {formMode ===
            'EDIT' &&
            editingProduct && (
              <div className="mt-6 border-t border-border pt-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-medium text-foreground">
                        Product
                        status
                      </h3>

                      <Badge
                        variant={
                          editingProduct.active
                            ? 'success'
                            : 'neutral'
                        }
                      >
                        {editingProduct.active
                          ? 'Active'
                          : 'Inactive'}
                      </Badge>
                    </div>

                    <p className="mt-1 text-sm text-muted-foreground">
                      {editingProduct.active
                        ? 'This product is available for normal store operations.'
                        : 'This product is currently unavailable for normal store operations.'}
                    </p>
                  </div>

                  {editingProduct.active ? (
                    <Button
                      variant="danger"
                      disabled={
                        isChangingStatus
                      }
                      onClick={() =>
                        setDeactivateDialogOpen(
                          true,
                        )
                      }
                    >
                      Deactivate
                    </Button>
                  ) : (
                    <Button
                      variant="secondary"
                      loading={
                        isChangingStatus
                      }
                      onClick={() =>
                        void changeProductStatus(
                          true,
                        )
                      }
                    >
                      Reactivate
                    </Button>
                  )}
                </div>
              </div>
            )}
        </Card>
      )}

      <Card className="mt-6 p-4 sm:p-5">
        <label
          htmlFor="product-management-search"
          className="sr-only"
        >
          Search products
        </label>

        <input
          id="product-management-search"
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
          className="min-h-12 w-full rounded-lg border border-input bg-card px-4 text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-ring/20"
        />
      </Card>

      <div className="mt-6">
        {isLoading && (
          <LoadingState label="Loading products..." />
        )}

        {!isLoading &&
          error && (
            <ErrorState
              title="Unable to load products"
              message={error}
              onRetry={() =>
                void reload()
              }
            />
          )}

        {!isLoading &&
          !error &&
          filteredProducts
            .length ===
            0 && (
            <EmptyState
              title={
                hasSearch
                  ? 'No products found'
                  : 'No products yet'
              }
              description={
                hasSearch
                  ? 'Try a different product name or SKU.'
                  : 'Add your first product to start managing your catalog.'
              }
              action={
                !hasSearch ? (
                  <Button
                    onClick={
                      handleCreate
                    }
                  >
                    Add Product
                  </Button>
                ) : undefined
              }
            />
          )}

        {!isLoading &&
          !error &&
          filteredProducts
            .length > 0 && (
            <div className="grid gap-3 sm:grid-cols-2">
              {filteredProducts.map(
                (product) => (
                  <Card
                    key={
                      product.id
                    }
                    className={[
                      'p-4',
                      product.active
                        ? ''
                        : 'opacity-75',
                    ].join(
                      ' ',
                    )}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <h2 className="truncate text-sm font-semibold text-foreground">
                          {
                            product.name
                          }
                        </h2>

                        <p className="mt-1 text-xs text-muted-foreground">
                          {
                            product.sku
                          }
                        </p>
                      </div>

                      <Badge
                        variant={
                          product.active
                            ? 'success'
                            : 'neutral'
                        }
                      >
                        {product.active
                          ? 'Active'
                          : 'Inactive'}
                      </Badge>
                    </div>

                    <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                      <div>
                        <dt className="text-xs text-muted-foreground">
                          Selling
                          price
                        </dt>

                        <dd className="mt-1 font-medium tabular-nums text-foreground">
                          {pesoFormatter.format(
                            Number(
                              product.sellingPrice,
                            ),
                          )}
                        </dd>
                      </div>

                      <div>
                        <dt className="text-xs text-muted-foreground">
                          Current
                          stock
                        </dt>

                        <dd className="mt-1 font-medium tabular-nums text-foreground">
                          {
                            product.currentStock
                          }
                        </dd>
                      </div>

                      <div>
                        <dt className="text-xs text-muted-foreground">
                          Reorder
                          level
                        </dt>

                        <dd className="mt-1 font-medium tabular-nums text-foreground">
                          {
                            product.reorderLevel
                          }
                        </dd>
                      </div>

                      <div>
                        <dt className="text-xs text-muted-foreground">
                          Category
                        </dt>

                        <dd className="mt-1 truncate text-secondary-foreground">
                          {product.category ??
                            'None'}
                        </dd>
                      </div>
                    </dl>

                    <div className="mt-4 flex items-center justify-between gap-3 border-t border-border pt-4">
                      {product.lowStock ? (
                        <Badge variant="warning">
                          Low stock
                        </Badge>
                      ) : (
                        <span />
                      )}

                      <Button
                        variant="secondary"
                        onClick={() =>
                          handleEdit(
                            product,
                          )
                        }
                      >
                        Edit
                      </Button>
                    </div>
                  </Card>
                ),
              )}
            </div>
          )}
      </div>

      <ConfirmationDialog
        open={
          deactivateDialogOpen
        }
        title="Deactivate product?"
        description="This product will no longer be available for normal store operations. Historical inventory and sales records will remain available."
        confirmLabel="Deactivate"
        cancelLabel="Cancel"
        variant="danger"
        loading={
          isChangingStatus
        }
        onConfirm={() =>
          void changeProductStatus(
            false,
          )
        }
        onCancel={() =>
          setDeactivateDialogOpen(
            false,
          )
        }
      />
    </PageContainer>
  )
}
