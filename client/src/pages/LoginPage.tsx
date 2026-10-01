import {
  useState,
  type FormEvent,
} from 'react'

import { ApiError } from '../api/api'
import { useAuth } from '../auth/useAuth'

export function LoginPage() {
  const { login } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(
    null,
  )
  const [isSubmitting, setIsSubmitting] =
    useState(false)

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    if (isSubmitting) {
      return
    }

    setError(null)
    setIsSubmitting(true)

    try {
      await login({
        email,
        password,
      })
    } catch (error) {
      if (error instanceof ApiError) {
        setError(error.message)
      } else {
        setError(
          'Unable to connect to TindaTrack. Please try again.',
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
              Sign in
            </h1>

            <p className="mt-2 text-base text-slate-600">
              Inventory and sales for your store.
            </p>
          </div>

          <form
            className="space-y-5"
            onSubmit={handleSubmit}
          >
            <div>
              <label
                className="mb-2 block text-sm font-medium text-slate-800"
                htmlFor="email"
              >
                Email
              </label>

              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) =>
                  setEmail(event.target.value)
                }
                className="min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-base text-slate-950 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label
                className="mb-2 block text-sm font-medium text-slate-800"
                htmlFor="password"
              >
                Password
              </label>

              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) =>
                  setPassword(event.target.value)
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
              disabled={isSubmitting}
              className="min-h-12 w-full rounded-xl bg-emerald-700 px-4 text-base font-semibold text-white transition hover:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting
                ? 'Signing in...'
                : 'Sign in'}
            </button>
          </form>
        </section>
      </div>
    </main>
  )
}