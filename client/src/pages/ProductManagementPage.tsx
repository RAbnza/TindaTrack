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

const emptyForm:
  ProductFormState = {
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
    successMessage,
    setSuccessMessage,
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
    }, [products, search])

  function resetForm() {
    setFormMode(null)
    setEditingProductId(
      null,
    )
    setForm(emptyForm)
    setFormError(null)
  }

  function handleCreate() {
    setSuccessMessage(null)
    setFormError(null)
    setEditingProductId(
      null,
    )
    setForm(emptyForm)
    setFormMode('CREATE')
  }

  function handleEdit(
    product: Product,
  ) {
    setSuccessMessage(null)
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
    event: FormEvent<HTMLFormElement>,
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
    setSuccessMessage(null)
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

        setSuccessMessage(
          'Product created. Current stock: 0. Use Receive Stock or Adjust Stock to add inventory.',
        )

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

        setSuccessMessage(
          'Product updated.',
        )
      }
    } catch (error) {
      if (
        error instanceof ApiError
      ) {
        if (
          error.status === 403
        ) {
          setFormError(
            'You do not have permission to manage products.',
          )

          return
        }

        setFormError(
          error.message,
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

  async function handleStatusChange() {
    if (
      !editingProduct ||
      isChangingStatus
    ) {
      return
    }

    const nextActive =
      !editingProduct.active

    setFormError(null)
    setSuccessMessage(null)
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

      setSuccessMessage(
        nextActive
          ? 'Product reactivated.'
          : 'Product deactivated.',
      )
    } catch (error) {
      if (
        error instanceof ApiError
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

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            Products
          </h1>

          <p className="mt-1 text-sm text-secondary-foreground">
            Manage product master
            data.
          </p>
        </div>

        <button
          type="button"
          onClick={
            handleCreate
          }
          className="min-h-11 shrink-0 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary-hover"
        >
          Add Product
        </button>
      </div>

      {successMessage && (
        <div
          role="status"
          className="mt-5 rounded-lg border border-success/20 bg-success-soft p-4 text-sm text-secondary-foreground"
        >
          {successMessage}
        </div>
      )}

      {formMode && (
        <section className="mt-6 rounded-lg border border-border bg-card p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                {formMode ===
                'CREATE'
                  ? 'Add Product'
                  : 'Edit Product'}
              </h2>

              <p className="mt-1 text-sm text-muted-foreground">
                Inventory quantity
                is managed separately
                through stock
                movements.
              </p>
            </div>

            <button
              type="button"
              onClick={
                resetForm
              }
              className="min-h-10 rounded-lg px-3 text-sm font-medium text-secondary-foreground hover:bg-secondary"
            >
              Cancel
            </button>
          </div>

          <form
            className="mt-5 space-y-5"
            onSubmit={
              handleSubmit
            }
          >
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
                value={form.sku}
                onChange={(
                  event,
                ) =>
                  updateForm(
                    'sku',
                    event.target
                      .value,
                  )
                }
                className="min-h-12 w-full rounded-lg border border-input bg-card px-4 text-base text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-ring/20"
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
                    event.target
                      .value,
                  )
                }
                className="min-h-12 w-full rounded-lg border border-input bg-card px-4 text-base text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-ring/20"
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
                    event.target
                      .value,
                  )
                }
                placeholder="Optional"
                className="min-h-12 w-full rounded-lg border border-input bg-card px-4 text-base text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-ring/20"
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
                      event.target
                        .value,
                    )
                  }
                  placeholder="75.00"
                  className="min-h-12 w-full rounded-lg border border-input bg-card py-2 pl-9 pr-4 text-base text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-ring/20"
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
                    event.target
                      .value,
                  )
                }
                className="min-h-12 w-full rounded-lg border border-input bg-card px-4 text-base text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-ring/20"
              />
            </div>

            {formError && (
              <div
                role="alert"
                className="rounded-lg border border-destructive/20 bg-destructive-soft p-3 text-sm text-secondary-foreground"
              >
                {formError}
              </div>
            )}

            <button
              type="submit"
              disabled={
                isSubmitting
              }
              className="min-h-12 w-full rounded-lg bg-primary px-4 text-base font-medium text-primary-foreground hover:bg-primary-hover disabled:cursor-not-allowed disabled:bg-muted disabled:text-disabled-foreground"
            >
              {isSubmitting
                ? 'Saving product...'
                : formMode ===
                    'CREATE'
                  ? 'Create Product'
                  : 'Save Changes'}
            </button>
          </form>

          {formMode ===
            'EDIT' &&
            editingProduct && (
              <div className="mt-6 border-t border-border pt-5">
                <p className="font-semibold text-foreground">
                  Product status
                </p>

                <p className="mt-1 text-sm text-secondary-foreground">
                  {editingProduct.active
                    ? 'This product is currently active.'
                    : 'This product is currently inactive.'}
                </p>

                <button
                  type="button"
                  disabled={
                    isChangingStatus
                  }
                  onClick={() =>
                    void handleStatusChange()
                  }
                  className={[
                    'mt-4 min-h-11 rounded-lg border px-4 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50',
                    editingProduct.active
                      ? 'border-destructive/20 text-secondary-foreground hover:bg-destructive-soft'
                      : 'border-success/20 text-secondary-foreground hover:bg-accent',
                  ].join(' ')}
                >
                  {isChangingStatus
                    ? 'Updating status...'
                    : editingProduct.active
                      ? 'Deactivate product'
                      : 'Reactivate product'}
                </button>
              </div>
            )}
        </section>
      )}

      <section className="mt-7">
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
          onChange={(event) =>
            setSearch(
              event.target.value,
            )
          }
          placeholder="Search name or SKU"
          className="min-h-12 w-full rounded-lg border border-input bg-card px-4 text-base text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-ring/20"
        />
      </section>

      {isLoading && (
        <div className="py-12 text-center text-sm text-secondary-foreground">
          Loading products...
        </div>
      )}

      {!isLoading &&
        error && (
          <div className="mt-5 rounded-lg border border-destructive/20 bg-destructive-soft p-4">
            <p
              role="alert"
              className="text-sm text-secondary-foreground"
            >
              {error}
            </p>

            <button
              type="button"
              onClick={() =>
                void reload()
              }
              className="mt-4 min-h-11 rounded-lg bg-destructive px-4 text-sm font-medium text-primary-foreground"
            >
              Try again
            </button>
          </div>
        )}

      {!isLoading &&
        !error &&
        filteredProducts.length ===
          0 && (
          <div className="py-12 text-center">
            <p className="font-medium text-secondary-foreground">
              No products found
            </p>
          </div>
        )}

      {!isLoading &&
        !error &&
        filteredProducts.length >
          0 && (
          <div className="mt-5 space-y-3">
            {filteredProducts.map(
              (product) => (
                <article
                  key={
                    product.id
                  }
                  className={[
                    'rounded-lg border bg-card p-4',
                    product.active
                      ? 'border-border'
                      : 'border-border opacity-70',
                  ].join(' ')}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <h2 className="truncate font-semibold text-foreground">
                        {
                          product.name
                        }
                      </h2>

                      <p className="mt-1 text-sm text-muted-foreground">
                        {
                          product.sku
                        }
                      </p>
                    </div>

                    <span
                      className={[
                        'rounded-lg px-2.5 py-1 text-xs font-semibold',
                        product.active
                          ? 'bg-success-soft text-secondary-foreground'
                          : 'bg-muted text-secondary-foreground',
                      ].join(' ')}
                    >
                      {product.active
                        ? 'Active'
                        : 'Inactive'}
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-muted-foreground">
                        Selling price
                      </p>

                      <p className="mt-1 font-semibold text-foreground">
                        {pesoFormatter.format(
                          Number(
                            product.sellingPrice,
                          ),
                        )}
                      </p>
                    </div>

                    <div>
                      <p className="text-muted-foreground">
                        Reorder level
                      </p>

                      <p className="mt-1 font-semibold text-foreground">
                        {
                          product.reorderLevel
                        }
                      </p>
                    </div>

                    <div>
                      <p className="text-muted-foreground">
                        Category
                      </p>

                      <p className="mt-1 font-medium text-secondary-foreground">
                        {product.category ??
                          'None'}
                      </p>
                    </div>

                    <div>
                      <p className="text-muted-foreground">
                        Current stock
                      </p>

                      <p className="mt-1 font-semibold text-foreground">
                        {
                          product.currentStock
                        }
                      </p>

                      <p className="mt-1 text-xs text-muted-foreground">
                        Read-only
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      handleEdit(
                        product,
                      )
                    }
                    className="mt-4 min-h-11 rounded-lg border border-input px-4 text-sm font-medium text-secondary-foreground hover:bg-background"
                  >
                    Edit
                  </button>
                </article>
              ),
            )}
          </div>
        )}
    </main>
  )
}
