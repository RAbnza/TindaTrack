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

  function resetForm() {
    setFormMode(null)
    setEditingSupplier(null)
    setForm(emptyForm)
    setFormError(null)

    setDeactivateDialogOpen(
      false,
    )
  }

  function handleCreate() {
    setFormError(null)
    setEditingSupplier(null)
    setForm(emptyForm)
    setFormMode('CREATE')
  }

  function handleEdit(
    supplier: ManagedSupplier,
  ) {
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
    event:
      FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    if (isSubmitting) {
      return
    }

    setFormError(null)
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

        showToast({
          variant:
            'success',

          message:
            'Supplier created.',
        })

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

        showToast({
          variant:
            'success',

          message:
            'Supplier updated.',
        })
      }
    } catch (error) {
      if (
        error instanceof
        ApiError
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

  async function changeSupplierStatus(
    nextActive: boolean,
  ) {
    if (
      !editingSupplier ||
      isChangingStatus
    ) {
      return
    }

    setFormError(null)
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

      setDeactivateDialogOpen(
        false,
      )

      showToast({
        variant:
          'success',

        message:
          nextActive
            ? 'Supplier reactivated.'
            : 'Supplier deactivated.',
      })
    } catch (error) {
      if (
        error instanceof
        ApiError
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
    <PageContainer>
      <PageHeader
        icon="suppliers"
        title="Suppliers"
        description="Manage the suppliers available for stock receiving."
        actions={
          <Button
            onClick={
              handleCreate
            }
          >
            Add Supplier
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
                  ? 'Add Supplier'
                  : 'Edit Supplier'}
              </h2>

              <p className="mt-1 text-sm text-muted-foreground">
                Store supplier
                details used during
                stock receiving.
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
                  htmlFor="supplier-name"
                  className="mb-2 block text-sm font-medium text-secondary-foreground"
                >
                  Name
                </label>

                <input
                  id="supplier-name"
                  type="text"
                  required
                  value={
                    form.name
                  }
                  onChange={(
                    event,
                  ) =>
                    setForm(
                      (
                        current,
                      ) => ({
                        ...current,

                        name:
                          event
                            .target
                            .value,
                      }),
                    )
                  }
                  className="min-h-12 w-full rounded-lg border border-input bg-card px-4 text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-ring/20"
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
                      (
                        current,
                      ) => ({
                        ...current,

                        contactDetails:
                          event
                            .target
                            .value,
                      }),
                    )
                  }
                  placeholder="Optional"
                  className="w-full rounded-lg border border-input bg-card px-4 py-3 text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-ring/20"
                />
              </div>
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
                  ? 'Create Supplier'
                  : 'Save Changes'}
              </Button>
            </div>
          </form>

          {formMode ===
            'EDIT' &&
            editingSupplier && (
              <div className="mt-6 border-t border-border pt-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-medium text-foreground">
                        Supplier
                        status
                      </h3>

                      <Badge
                        variant={
                          editingSupplier.active
                            ? 'success'
                            : 'neutral'
                        }
                      >
                        {editingSupplier.active
                          ? 'Active'
                          : 'Inactive'}
                      </Badge>
                    </div>

                    <p className="mt-1 text-sm text-muted-foreground">
                      {editingSupplier.active
                        ? 'This supplier is available when receiving stock.'
                        : 'This supplier is currently unavailable for new stock receipts.'}
                    </p>
                  </div>

                  {editingSupplier.active ? (
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
                        void changeSupplierStatus(
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

      <div className="mt-6">
        {isLoading && (
          <LoadingState label="Loading suppliers..." />
        )}

        {!isLoading &&
          error && (
            <ErrorState
              title="Unable to load suppliers"
              message={error}
              onRetry={() =>
                void reload()
              }
            />
          )}

        {!isLoading &&
          !error &&
          suppliers.length ===
            0 && (
            <EmptyState
              title="No suppliers yet"
              description="Add a supplier so it can be selected when receiving stock."
              action={
                <Button
                  onClick={
                    handleCreate
                  }
                >
                  Add Supplier
                </Button>
              }
            />
          )}

        {!isLoading &&
          !error &&
          suppliers.length >
            0 && (
            <div className="grid gap-3 sm:grid-cols-2">
              {suppliers.map(
                (
                  supplier,
                ) => (
                  <Card
                    key={
                      supplier.id
                    }
                    className={[
                      'p-4',
                      supplier.active
                        ? ''
                        : 'opacity-75',
                    ].join(
                      ' ',
                    )}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <h2 className="text-sm font-semibold text-foreground">
                          {
                            supplier.name
                          }
                        </h2>

                        <p className="mt-2 whitespace-pre-wrap wrap-break-words text-sm leading-6 text-secondary-foreground">
                          {supplier.contactDetails ??
                            'No contact details'}
                        </p>
                      </div>

                      <Badge
                        variant={
                          supplier.active
                            ? 'success'
                            : 'neutral'
                        }
                      >
                        {supplier.active
                          ? 'Active'
                          : 'Inactive'}
                      </Badge>
                    </div>

                    <div className="mt-4 flex justify-end border-t border-border pt-4">
                      <Button
                        variant="secondary"
                        onClick={() =>
                          handleEdit(
                            supplier,
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
        title="Deactivate supplier?"
        description="This supplier will no longer appear when receiving stock. Existing receipt history will remain available."
        confirmLabel="Deactivate"
        cancelLabel="Cancel"
        variant="danger"
        loading={
          isChangingStatus
        }
        onConfirm={() =>
          void changeSupplierStatus(
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
