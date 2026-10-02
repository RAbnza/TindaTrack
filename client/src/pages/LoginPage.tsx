import {
  useState,
  type FormEvent,
} from 'react'

import {
  Link,
} from 'react-router-dom'

import {
  ApiError,
} from '../api/api'

import {
  useAuth,
} from '../auth/useAuth'

import {
  AuthPageLayout,
} from '../components/layout/AuthPageLayout'

import {
  Button,
} from '../components/ui'
import { Input } from '../components/ui/Field'
import { AppIcon } from '../components/AppIcon'
import { IconTile } from '../components/ui/IconTile'

export function LoginPage() {
  const {
    login,
  } = useAuth()

  const [
    email,
    setEmail,
  ] = useState('')

  const [
    password,
    setPassword,
  ] = useState('')

  const [
    error,
    setError,
  ] =
    useState<string | null>(
      null,
    )

  const [
    isSubmitting,
    setIsSubmitting,
  ] = useState(false)

  async function handleSubmit(
    event:
      FormEvent<HTMLFormElement>,
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
      if (
        error instanceof
        ApiError
      ) {
        setError(
          error.message,
        )
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
    <AuthPageLayout>
      <div className="mb-6">
        <Link
          to="/"
          className="inline-flex min-h-11 items-center gap-2 rounded-lg text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            className="size-4"
          >
            <path
              d="m15 18-6-6 6-6"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>

          Back to TindaTrack
        </Link>
        <IconTile icon="lock" className="mt-4" />

        <p className="mt-4 text-xs font-medium text-primary">
          Welcome back
        </p>

        <h1 className="mt-2 text-2xl font-semibold leading-tight tracking-tight">
          Store operations,
          <br />
          without the guesswork.
        </h1>

        <p className="mt-3 text-sm text-muted-foreground">
          Welcome back. Continue to your TindaTrack workspace.
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
            className="mb-2 block text-sm font-medium text-secondary-foreground"
            htmlFor="email"
          >
            Email
          </label>

          <Input
            icon="mail"
            id="email"
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
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label
            className="mb-2 block text-sm font-medium text-secondary-foreground"
            htmlFor="password"
          >
            Password
          </label>

          <Input
            icon="lock"
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            value={
              password
            }
            onChange={(
              event,
            ) =>
              setPassword(
                event.target
                  .value,
              )
            }
          />
        </div>

        {error && (
          <div
            role="alert"
            className="rounded-lg border border-destructive/20 bg-destructive-soft px-4 py-3 text-sm text-secondary-foreground"
          >
            {error}
          </div>
        )}

        <Button
          type="submit"
          loading={
            isSubmitting
          }
          className="min-h-12 w-full rounded-lg"
        >
          {!isSubmitting && <AppIcon name="arrow-right" />}
          {isSubmitting
            ? 'Signing in...'
            : 'Sign in'}
        </Button>
      </form>
      <p className="auth-assurance"><AppIcon name="shield" />Your account determines access to store operations.</p>

      <div className="mt-6 border-t border-border pt-5 text-center">
        <p className="text-sm text-muted-foreground">
          Want to learn more about
          TindaTrack?
        </p>

        <Link
          to="/"
          className="mt-2 inline-flex min-h-11 items-center justify-center rounded-lg px-3 text-sm font-medium text-primary transition-colors hover:text-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          View the public overview
        </Link>
      </div>
    </AuthPageLayout>
  )
}
