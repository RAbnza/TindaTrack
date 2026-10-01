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
    setEditingStaff(null)
    setForm(emptyForm)
    setFormError(null)
  }

  function handleCreate() {
    setSuccessMessage(null)
    setEditingStaff(null)
    setForm(emptyForm)
    setFormError(null)
    setFormMode('CREATE')
  }

  function handleEdit(
    member: StaffMember,
  ) {
    setSuccessMessage(null)
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
    event: FormEvent<HTMLFormElement>,
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
    setSuccessMessage(null)
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

        setSuccessMessage(
          'Staff account created. Give the employee their login credentials directly.',
        )

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

        setSuccessMessage(
          'Staff account updated.',
        )
      }
    } catch (error) {
      if (
        error instanceof ApiError
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

  async function handleStatusChange() {
    if (
      !editingStaff ||
      isChangingStatus
    ) {
      return
    }

    const nextActive =
      !editingStaff.active

    setFormError(null)
    setSuccessMessage(null)
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

      setSuccessMessage(
        nextActive
          ? 'Staff account reactivated.'
          : 'Staff account deactivated.',
      )
    } catch (error) {
      if (
        error instanceof ApiError
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
    <main className="mx-auto w-full max-w-2xl px-4 py-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-950">
            Staff
          </h1>

          <p className="mt-1 text-sm text-slate-600">
            Manage employee login
            accounts.
          </p>
        </div>

        <button
          type="button"
          onClick={
            handleCreate
          }
          className="min-h-11 shrink-0 rounded-xl bg-emerald-700 px-4 text-sm font-semibold text-white hover:bg-emerald-800"
        >
          Add Staff
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
                ? 'Add Staff'
                : 'Edit Staff'}
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
                htmlFor="staff-name"
                className="mb-2 block text-sm font-medium text-slate-800"
              >
                Name
              </label>

              <input
                id="staff-name"
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
                htmlFor="staff-email"
                className="mb-2 block text-sm font-medium text-slate-800"
              >
                Email
              </label>

              <input
                id="staff-email"
                type="email"
                required
                value={form.email}
                onChange={(
                  event,
                ) =>
                  setForm(
                    (current) => ({
                      ...current,
                      email:
                        event.target
                          .value,
                    }),
                  )
                }
                className="min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-base text-slate-950 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
              />
            </div>

            {formMode ===
              'CREATE' && (
              <>
                <div>
                  <label
                    htmlFor="staff-password"
                    className="mb-2 block text-sm font-medium text-slate-800"
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
                    className="min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-base text-slate-950 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                  />

                  <p className="mt-2 text-xs text-slate-500">
                    At least 8
                    characters. Give
                    this password to
                    the employee
                    directly.
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="staff-confirm-password"
                    className="mb-2 block text-sm font-medium text-slate-800"
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
                    className="min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-base text-slate-950 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                  />
                </div>
              </>
            )}

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
                ? 'Saving staff...'
                : formMode ===
                    'CREATE'
                  ? 'Create Staff Account'
                  : 'Save Changes'}
            </button>
          </form>

          {formMode ===
            'EDIT' &&
            editingStaff && (
              <div className="mt-6 border-t border-slate-200 pt-5">
                <p className="font-semibold text-slate-900">
                  Staff status
                </p>

                <p className="mt-1 text-sm text-slate-600">
                  {editingStaff.active
                    ? 'This staff account is currently active.'
                    : 'This staff account is currently inactive.'}
                </p>

                <p className="mt-2 text-sm text-slate-500">
                  Deactivated staff
                  can no longer access
                  TindaTrack.
                  Historical sales and
                  stock actions remain
                  recorded.
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

                    editingStaff.active
                      ? 'border-red-200 text-red-700 hover:bg-red-50'
                      : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50',
                  ].join(' ')}
                >
                  {isChangingStatus
                    ? 'Updating status...'
                    : editingStaff.active
                      ? 'Deactivate staff account'
                      : 'Reactivate staff account'}
                </button>
              </div>
            )}
        </section>
      )}

      {isLoading && (
        <div className="py-12 text-center text-sm text-slate-600">
          Loading staff...
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
        staff.length === 0 && (
          <div className="py-12 text-center">
            <p className="font-medium text-slate-800">
              No staff accounts yet
            </p>
          </div>
        )}

      {!isLoading &&
        !error &&
        staff.length > 0 && (
          <div className="mt-6 space-y-3">
            {staff.map(
              (member) => (
                <article
                  key={
                    member.id
                  }
                  className={[
                    'rounded-2xl border bg-white p-4',

                    member.active
                      ? 'border-slate-200'
                      : 'border-slate-200 opacity-70',
                  ].join(' ')}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <h2 className="font-bold text-slate-950">
                        {
                          member.name
                        }
                      </h2>

                      <p className="mt-1 break-all text-sm text-slate-600">
                        {
                          member.email
                        }
                      </p>
                    </div>

                    <span
                      className={[
                        'shrink-0 rounded-lg px-2.5 py-1 text-xs font-semibold',

                        member.active
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-200 text-slate-700',
                      ].join(' ')}
                    >
                      {member.active
                        ? 'Active'
                        : 'Inactive'}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      handleEdit(
                        member,
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