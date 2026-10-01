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
          <h1 className="text-2xl font-bold text-slate-950">
            Suppliers
          </h1>

          <p className="mt-1 text-sm text-slate-600">
            Manage suppliers used
            for stock receiving.
          </p>
        </div>

        <button
          type="button"
          onClick={
            handleCreate
          }
          className="min-h-11 shrink-0 rounded-xl bg-emerald-700 px-4 text-sm font-semibold text-white hover:bg-emerald-800"
        >
          Add Supplier
        </button>
      </div>

      {successMessage && (
        <div
          role="status"
          className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"
        >
          {successMessage}
        </div>
      )}

      {formMode && (
        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex items-start justify-between gap-4">
            <h2 className="text-lg font-bold text-slate-950">
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
              className="min-h-10 rounded-lg px-3 text-sm font-semibold text-slate-600 hover:bg-slate-100"
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
                className="mb-2 block text-sm font-medium text-slate-800"
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
                className="min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-base text-slate-950 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
              />
            </div>

            <div>
              <label
                htmlFor="supplier-contact"
                className="mb-2 block text-sm font-medium text-slate-800"
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
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-950 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
              />
            </div>

            {formError && (
              <div
                role="alert"
                className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800"
              >
                {formError}
              </div>
            )}

            <button
              type="submit"
              disabled={
                isSubmitting
              }
              className="min-h-12 w-full rounded-xl bg-emerald-700 px-4 text-base font-semibold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
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
              <div className="mt-6 border-t border-slate-200 pt-5">
                <p className="font-semibold text-slate-900">
                  Supplier status
                </p>

                <p className="mt-1 text-sm text-slate-600">
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
                    'mt-4 min-h-11 rounded-xl border px-4 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50',
                    editingSupplier.active
                      ? 'border-red-200 text-red-700 hover:bg-red-50'
                      : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50',
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
        <div className="py-12 text-center text-sm text-slate-600">
          Loading suppliers...
        </div>
      )}

      {!isLoading &&
        error && (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4">
            <p
              role="alert"
              className="text-sm text-red-800"
            >
              {error}
            </p>

            <button
              type="button"
              onClick={() =>
                void reload()
              }
              className="mt-4 min-h-11 rounded-xl bg-red-700 px-4 text-sm font-semibold text-white"
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
            <p className="font-medium text-slate-800">
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
                    'rounded-2xl border bg-white p-4',
                    supplier.active
                      ? 'border-slate-200'
                      : 'border-slate-200 opacity-70',
                  ].join(' ')}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <h2 className="font-bold text-slate-950">
                        {
                          supplier.name
                        }
                      </h2>

                      <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">
                        {supplier.contactDetails ??
                          'No contact details'}
                      </p>
                    </div>

                    <span
                      className={[
                        'shrink-0 rounded-lg px-2.5 py-1 text-xs font-semibold',
                        supplier.active
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-200 text-slate-700',
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
                    className="mt-4 min-h-11 rounded-xl border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
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