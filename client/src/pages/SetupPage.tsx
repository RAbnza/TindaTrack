import {
  useState,
  type FormEvent,
} from 'react'

import {
  useNavigate,
} from 'react-router-dom'

import {
  ApiError,
} from '../api/api'

import {
  createInitialOwner,
} from '../api/setup.api'

export function SetupPage() {
  const navigate =
    useNavigate()

  const [
    name,
    setName,
  ] = useState('')

  const [
    email,
    setEmail,
  ] = useState('')

  const [
    password,
    setPassword,
  ] = useState('')

  const [
    confirmPassword,
    setConfirmPassword,
  ] = useState('')

  const [
    error,
    setError,
  ] = useState<string | null>(
    null,
  )

  const [
    isSubmitting,
    setIsSubmitting,
  ] = useState(false)

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    if (isSubmitting) {
      return
    }

    if (
      password !==
      confirmPassword
    ) {
      setError(
        'Passwords do not match.',
      )

      return
    }

    setError(null)
    setIsSubmitting(true)

    try {
      await createInitialOwner({
        name,
        email,
        password,
      })

      /*
       * Setup does not authenticate.
       *
       * The new OWNER signs in through
       * the normal login boundary.
       */
      navigate(
        '/login',
        {
          replace: true,
        },
      )
    } catch (error) {
      if (
        error instanceof ApiError
      ) {
        /*
         * Another bootstrap request may
         * have completed first.
         */
        if (
          error.status === 409
        ) {
          navigate(
            '/login',
            {
              replace: true,
            },
          )

          return
        }

        setError(
          error.message,
        )
      } else {
        setError(
          'Unable to set up TindaTrack. Please try again.',
        )
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="min-h-dvh bg-slate-50 px-4 py-8">
      <div className="mx-auto flex min-h-[calc(100dvh-4rem)] w-full max-w-sm items-center">
        <section className="w-full">
          <div className="mb-8">
            <p className="text-sm font-semibold text-emerald-700">
              TindaTrack
            </p>

            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
              Set up TindaTrack
            </h1>

            <p className="mt-2 text-base text-slate-600">
              Create the first owner
              account for this store.
            </p>
          </div>

          <form
            className="space-y-5"
            onSubmit={
              handleSubmit
            }
          >
            <div>
              <label
                htmlFor="owner-name"
                className="mb-2 block text-sm font-medium text-slate-800"
              >
                Owner name
              </label>

              <input
                id="owner-name"
                name="name"
                type="text"
                autoComplete="name"
                required
                value={name}
                onChange={(
                  event,
                ) =>
                  setName(
                    event.target
                      .value,
                  )
                }
                className="min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-base text-slate-950 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
              />
            </div>

            <div>
              <label
                htmlFor="setup-email"
                className="mb-2 block text-sm font-medium text-slate-800"
              >
                Email
              </label>

              <input
                id="setup-email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(
                  event,
                ) =>
                  setEmail(
                    event.target
                      .value,
                  )
                }
                className="min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-base text-slate-950 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                placeholder="owner@example.com"
              />
            </div>

            <div>
              <label
                htmlFor="setup-password"
                className="mb-2 block text-sm font-medium text-slate-800"
              >
                Password
              </label>

              <input
                id="setup-password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                value={password}
                onChange={(
                  event,
                ) =>
                  setPassword(
                    event.target
                      .value,
                  )
                }
                className="min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-base text-slate-950 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
              />

              <p className="mt-2 text-xs text-slate-500">
                Use at least 8
                characters.
              </p>
            </div>

            <div>
              <label
                htmlFor="confirm-password"
                className="mb-2 block text-sm font-medium text-slate-800"
              >
                Confirm password
              </label>

              <input
                id="confirm-password"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                value={
                  confirmPassword
                }
                onChange={(
                  event,
                ) =>
                  setConfirmPassword(
                    event.target
                      .value,
                  )
                }
                className="min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-base text-slate-950 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
              />
            </div>

            {error && (
              <div
                role="alert"
                className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={
                isSubmitting
              }
              className="min-h-12 w-full rounded-xl bg-emerald-700 px-4 text-base font-semibold text-white transition hover:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting
                ? 'Creating owner...'
                : 'Create Owner Account'}
            </button>
          </form>
        </section>
      </div>
    </main>
  )
}