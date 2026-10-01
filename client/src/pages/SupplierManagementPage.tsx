import {
  useState,
  type FormEvent,
} from 'react'

import {
  ApiError,
} from '../api/api'

import {
  createSupplier,
  updateSupplier,
} from '../api/suppliers.api'

import {
  useManagedSuppliers,
} from '../features/suppliers/useManagedSuppliers'

import type {
  ManagedSupplier,
} from '../types/supplier'

type FormMode =
  | 'CREATE'
  | 'EDIT'
  | null

type SupplierFormState = {
  name: string
  contactDetails: string
}

const emptyForm:
  SupplierFormState = {
    name: '',
    contactDetails: '',
  }

export function SupplierManagementPage() {
  const {
    suppliers,
    isLoading,
    error,
    reload,
  } = useManagedSuppliers()

  const [
    formMode,
    setFormMode,
  ] = useState<FormMode>(
    null,
  )

  const [
    editingSupplier,
    setEditingSupplier,
  ] =
    useState<ManagedSupplier | null>(
      null,
    )

  const [
    form,
    setForm,
  ] =
    useState<SupplierFormState>(
      emptyForm,
    )

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

  function resetForm() {
    setFormMode(null)
    setEditingSupplier(
      null,
    )
    setForm(emptyForm)
    setFormError(null)
  }

  function handleCreate() {
    setSuccessMessage(null)
    setFormError(null)
    setEditingSupplier(
      null,
    )
    setForm(emptyForm)
    setFormMode('CREATE')
  }

  function handleEdit(
    supplier: ManagedSupplier,
  ) {
    setSuccessMessage(null)
    setFormError(null)

    setEditingSupplier(
      supplier,
    )

    setForm({
      name: supplier.name,
      contactDetails:
        supplier.contactDetails ??
        '',
    })

    setFormMode('EDIT')
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    if (isSubmitting) {
      return
    }

    setFormError(null)
    setSuccessMessage(null)
    setIsSubmitting(true)

    const contactDetails =
      form.contactDetails.trim()
        ? form.contactDetails.trim()
        : null

    try {
      if (
        formMode ===
        'CREATE'
      ) {
        await createSupplier({
          name: form.name,
          contactDetails,
        })

        await reload()

        resetForm()

        setSuccessMessage(
          'Supplier created.',
        )

        return
      }

      if (
        formMode ===
          'EDIT' &&
        editingSupplier
      ) {
        await updateSupplier(
          editingSupplier.id,
          {
            name: form.name,
            contactDetails,
          },
        )

        await reload()

        resetForm()

        setSuccessMessage(
          'Supplier updated.',
        )
      }
    } catch (error) {
      if (
        error instanceof ApiError
      ) {
        setFormError(
          error.status === 403
            ? 'You do not have permission to manage suppliers.'
            : error.message,
        )

        return
      }

      setFormError(
        'Unable to save supplier. Please try again.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleStatusChange() {
    if (
      !editingSupplier ||
      isChangingStatus
    ) {
      return
    }

    const nextActive =
      !editingSupplier.active

    setFormError(null)
    setSuccessMessage(null)
    setIsChangingStatus(true)

    try {
      await updateSupplier(
        editingSupplier.id,
        {
          active:
            nextActive,
        },
      )

      await reload()

      setEditingSupplier(
        (current) =>
          current
            ? {
                ...current,
                active:
                  nextActive,
              }
            : current,
      )

      setSuccessMessage(
        nextActive
          ? 'Supplier reactivated.'
          : 'Supplier deactivated.',
      )
    } catch (error) {
      if (
        error instanceof ApiError
      ) {
        setFormError(
          error.status === 403
            ? 'You do not have permission to manage suppliers.'
            : error.message,
        )

        return
      }

      setFormError(
        'Unable to change supplier status. Please try again.',
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
            Suppliers
          </h1>

          <p className="mt-1 text-sm text-secondary-foreground">
            Manage suppliers used
            for stock receiving.
          </p>
        </div>

        <button
          type="button"
          onClick={
            handleCreate
          }
          className="min-h-11 shrink-0 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary-hover"
        >
          Add Supplier
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
            <h2 className="text-lg font-semibold text-foreground">
              {formMode ===
              'CREATE'
                ? 'Add Supplier'
                : 'Edit Supplier'}
            </h2>

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
                htmlFor="supplier-name"
                className="mb-2 block text-sm font-medium text-secondary-foreground"
              >
                Name
              </label>

              <input
                id="supplier-name"
                type="text"
                required
                value={form.name}
                onChange={(
                  event,
                ) =>
                  setForm(
                    (current) => ({
                      ...current,
                      name:
                        event.target
                          .value,
                    }),
                  )
                }
                className="min-h-12 w-full rounded-lg border border-input bg-card px-4 text-base text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-ring/20"
              />
            </div>

            <div>
              <label
                htmlFor="supplier-contact"
                className="mb-2 block text-sm font-medium text-secondary-foreground"
              >
                Contact details
              </label>

              <textarea
                id="supplier-contact"
                rows={3}
                value={
                  form.contactDetails
                }
                onChange={(
                  event,
                ) =>
                  setForm(
                    (current) => ({
                      ...current,
                      contactDetails:
                        event.target
                          .value,
                    }),
                  )
                }
                placeholder="Optional"
                className="w-full rounded-lg border border-input bg-card px-4 py-3 text-base text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-ring/20"
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
              className="min-h-12 w-full rounded-lg bg-primary px-4 text-base font-medium text-primary-foreground hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting
                ? 'Saving supplier...'
                : formMode ===
                    'CREATE'
                  ? 'Create Supplier'
                  : 'Save Changes'}
            </button>
          </form>

          {formMode ===
            'EDIT' &&
            editingSupplier && (
              <div className="mt-6 border-t border-border pt-5">
                <p className="font-semibold text-foreground">
                  Supplier status
                </p>

                <p className="mt-1 text-sm text-secondary-foreground">
                  {editingSupplier.active
                    ? 'This supplier is currently active.'
                    : 'This supplier is currently inactive.'}
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
                    editingSupplier.active
                      ? 'border-destructive/20 text-secondary-foreground hover:bg-destructive-soft'
                      : 'border-success/20 text-secondary-foreground hover:bg-accent',
                  ].join(' ')}
                >
                  {isChangingStatus
                    ? 'Updating status...'
                    : editingSupplier.active
                      ? 'Deactivate supplier'
                      : 'Reactivate supplier'}
                </button>
              </div>
            )}
        </section>
      )}

      {isLoading && (
        <div className="py-12 text-center text-sm text-secondary-foreground">
          Loading suppliers...
        </div>
      )}

      {!isLoading &&
        error && (
          <div className="mt-6 rounded-lg border border-destructive/20 bg-destructive-soft p-4">
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
        suppliers.length ===
          0 && (
          <div className="py-12 text-center">
            <p className="font-medium text-secondary-foreground">
              No suppliers yet
            </p>
          </div>
        )}

      {!isLoading &&
        !error &&
        suppliers.length >
          0 && (
          <div className="mt-6 space-y-3">
            {suppliers.map(
              (supplier) => (
                <article
                  key={
                    supplier.id
                  }
                  className={[
                    'rounded-lg border bg-card p-4',
                    supplier.active
                      ? 'border-border'
                      : 'border-border opacity-70',
                  ].join(' ')}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <h2 className="font-semibold text-foreground">
                        {
                          supplier.name
                        }
                      </h2>

                      <p className="mt-2 whitespace-pre-wrap text-sm text-secondary-foreground">
                        {supplier.contactDetails ??
                          'No contact details'}
                      </p>
                    </div>

                    <span
                      className={[
                        'shrink-0 rounded-lg px-2.5 py-1 text-xs font-semibold',
                        supplier.active
                          ? 'bg-success-soft text-secondary-foreground'
                          : 'bg-muted text-secondary-foreground',
                      ].join(' ')}
                    >
                      {supplier.active
                        ? 'Active'
                        : 'Inactive'}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      handleEdit(
                        supplier,
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
