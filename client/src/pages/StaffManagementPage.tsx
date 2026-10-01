import {
  useState,
  type FormEvent,
} from 'react'

import {
  ApiError,
} from '../api/api'

import {
  createStaff,
  updateStaff,
} from '../api/staff.api'

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
  useStaff,
} from '../features/staff/useStaff'

import type {
  StaffMember,
} from '../types/staff'

type FormMode =
  | 'CREATE'
  | 'EDIT'
  | null

type StaffFormState = {
  name: string
  email: string
  password: string
  confirmPassword: string
}

const emptyForm:
  StaffFormState = {
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  }

export function StaffManagementPage() {
  const {
    staff,
    isLoading,
    error,
    reload,
  } = useStaff()

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
    editingStaff,
    setEditingStaff,
  ] =
    useState<StaffMember | null>(
      null,
    )

  const [
    form,
    setForm,
  ] =
    useState<StaffFormState>(
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
    setEditingStaff(null)
    setForm(emptyForm)
    setFormError(null)

    setDeactivateDialogOpen(
      false,
    )
  }

  function handleCreate() {
    setEditingStaff(null)
    setForm(emptyForm)
    setFormError(null)
    setFormMode('CREATE')
  }

  function handleEdit(
    member: StaffMember,
  ) {
    setFormError(null)

    setEditingStaff(
      member,
    )

    setForm({
      name: member.name,
      email: member.email,
      password: '',
      confirmPassword: '',
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

    if (
      formMode ===
        'CREATE' &&
      form.password !==
        form.confirmPassword
    ) {
      setFormError(
        'Passwords do not match.',
      )

      return
    }

    setFormError(null)
    setIsSubmitting(true)

    try {
      if (
        formMode ===
        'CREATE'
      ) {
        await createStaff({
          name: form.name,
          email: form.email,

          password:
            form.password,
        })

        await reload()
        resetForm()

        showToast({
          variant:
            'success',

          message:
            'Staff account created. Share the login credentials with the employee.',
        })

        return
      }

      if (
        formMode ===
          'EDIT' &&
        editingStaff
      ) {
        await updateStaff(
          editingStaff.id,
          {
            name: form.name,
            email: form.email,
          },
        )

        await reload()
        resetForm()

        showToast({
          variant:
            'success',

          message:
            'Staff account updated.',
        })
      }
    } catch (error) {
      if (
        error instanceof
        ApiError
      ) {
        setFormError(
          error.status === 403
            ? 'You do not have permission to manage staff.'
            : error.message,
        )

        return
      }

      setFormError(
        'Unable to save staff account. Please try again.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  async function changeStaffStatus(
    nextActive: boolean,
  ) {
    if (
      !editingStaff ||
      isChangingStatus
    ) {
      return
    }

    setFormError(null)
    setIsChangingStatus(true)

    try {
      await updateStaff(
        editingStaff.id,
        {
          active:
            nextActive,
        },
      )

      await reload()

      setEditingStaff(
        (current) =>
          current
            ? {
                ...current,
                active:
                  nextActive,
              }
            : null,
      )

      setDeactivateDialogOpen(
        false,
      )

      showToast({
        variant:
          'success',

        message:
          nextActive
            ? 'Staff account reactivated.'
            : 'Staff account deactivated.',
      })
    } catch (error) {
      if (
        error instanceof
        ApiError
      ) {
        setFormError(
          error.status === 403
            ? 'You do not have permission to manage staff.'
            : error.message,
        )

        return
      }

      setFormError(
        'Unable to change staff account status. Please try again.',
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
        title="Staff"
        description="Manage employee accounts and access to TindaTrack."
        actions={
          <Button
            onClick={
              handleCreate
            }
          >
            Add Staff
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
                  ? 'Add Staff'
                  : 'Edit Staff'}
              </h2>

              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                {formMode ===
                'CREATE'
                  ? 'Create credentials for a staff member who needs access to store operations.'
                  : 'Update this staff member’s account details.'}
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
                  htmlFor="staff-name"
                  className="mb-2 block text-sm font-medium text-secondary-foreground"
                >
                  Name
                </label>

                <input
                  id="staff-name"
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
                  htmlFor="staff-email"
                  className="mb-2 block text-sm font-medium text-secondary-foreground"
                >
                  Email
                </label>

                <input
                  id="staff-email"
                  type="email"
                  required
                  value={
                    form.email
                  }
                  onChange={(
                    event,
                  ) =>
                    setForm(
                      (
                        current,
                      ) => ({
                        ...current,

                        email:
                          event
                            .target
                            .value,
                      }),
                    )
                  }
                  className="min-h-12 w-full rounded-lg border border-input bg-card px-4 text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-ring/20"
                />
              </div>

              {formMode ===
                'CREATE' && (
                <>
                  <div>
                    <label
                      htmlFor="staff-password"
                      className="mb-2 block text-sm font-medium text-secondary-foreground"
                    >
                      Temporary
                      password
                    </label>

                    <input
                      id="staff-password"
                      type="password"
                      autoComplete="new-password"
                      minLength={8}
                      required
                      value={
                        form.password
                      }
                      onChange={(
                        event,
                      ) =>
                        setForm(
                          (
                            current,
                          ) => ({
                            ...current,

                            password:
                              event
                                .target
                                .value,
                          }),
                        )
                      }
                      className="min-h-12 w-full rounded-lg border border-input bg-card px-4 text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-ring/20"
                    />

                    <p className="mt-2 text-xs leading-5 text-muted-foreground">
                      Use at least 8
                      characters and
                      share the
                      credentials with
                      the employee
                      directly.
                    </p>
                  </div>

                  <div>
                    <label
                      htmlFor="staff-confirm-password"
                      className="mb-2 block text-sm font-medium text-secondary-foreground"
                    >
                      Confirm password
                    </label>

                    <input
                      id="staff-confirm-password"
                      type="password"
                      autoComplete="new-password"
                      minLength={8}
                      required
                      value={
                        form.confirmPassword
                      }
                      onChange={(
                        event,
                      ) =>
                        setForm(
                          (
                            current,
                          ) => ({
                            ...current,

                            confirmPassword:
                              event
                                .target
                                .value,
                          }),
                        )
                      }
                      className="min-h-12 w-full rounded-lg border border-input bg-card px-4 text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-ring/20"
                    />
                  </div>
                </>
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
                  ? 'Create Staff Account'
                  : 'Save Changes'}
              </Button>
            </div>
          </form>

          {formMode ===
            'EDIT' &&
            editingStaff && (
              <div className="mt-6 border-t border-border pt-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-medium text-foreground">
                        Staff status
                      </h3>

                      <Badge
                        variant={
                          editingStaff.active
                            ? 'success'
                            : 'neutral'
                        }
                      >
                        {editingStaff.active
                          ? 'Active'
                          : 'Inactive'}
                      </Badge>
                    </div>

                    <p className="mt-1 max-w-xl text-sm leading-6 text-muted-foreground">
                      {editingStaff.active
                        ? 'This staff member can currently access TindaTrack.'
                        : 'This staff account is inactive and cannot access TindaTrack.'}
                    </p>
                  </div>

                  {editingStaff.active ? (
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
                        void changeStaffStatus(
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
          <LoadingState label="Loading staff..." />
        )}

        {!isLoading &&
          error && (
            <ErrorState
              title="Unable to load staff"
              message={error}
              onRetry={() =>
                void reload()
              }
            />
          )}

        {!isLoading &&
          !error &&
          staff.length ===
            0 && (
            <EmptyState
              title="No staff accounts yet"
              description="Create an account when another employee needs access to TindaTrack."
              action={
                <Button
                  onClick={
                    handleCreate
                  }
                >
                  Add Staff
                </Button>
              }
            />
          )}

        {!isLoading &&
          !error &&
          staff.length >
            0 && (
            <div className="grid gap-3 sm:grid-cols-2">
              {staff.map(
                (member) => (
                  <Card
                    key={
                      member.id
                    }
                    className={[
                      'p-4',
                      member.active
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
                            member.name
                          }
                        </h2>

                        <p className="mt-1 break-all text-sm text-secondary-foreground">
                          {
                            member.email
                          }
                        </p>
                      </div>

                      <Badge
                        variant={
                          member.active
                            ? 'success'
                            : 'neutral'
                        }
                      >
                        {member.active
                          ? 'Active'
                          : 'Inactive'}
                      </Badge>
                    </div>

                    <div className="mt-4 flex justify-end border-t border-border pt-4">
                      <Button
                        variant="secondary"
                        onClick={() =>
                          handleEdit(
                            member,
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
        title="Deactivate staff account?"
        description="This staff member will immediately lose access to TindaTrack. Historical actions will remain recorded."
        confirmLabel="Deactivate"
        cancelLabel="Cancel"
        variant="danger"
        loading={
          isChangingStatus
        }
        onConfirm={() =>
          void changeStaffStatus(
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