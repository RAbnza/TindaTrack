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

import { AuthPageLayout } from '../components/layout/AuthPageLayout'
import { Badge, Button } from '../components/ui'

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
    <AuthPageLayout>
      <div className="mb-6">
        <Badge variant="primary">Initial setup</Badge>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight">Set up your store</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Create the first owner account. You'll use this account to manage
          products, suppliers, staff, and store operations.
        </p>
      </div>

      <form className="space-y-5" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="owner-name" className="mb-2 block text-sm font-medium text-secondary-foreground">
            Owner name
          </label>
          <input
            id="owner-name"
            name="name"
            type="text"
            autoComplete="name"
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="min-h-12 w-full rounded-lg border border-input bg-card px-3 text-base text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-ring/20"
          />
        </div>
        <div>
          <label htmlFor="setup-email" className="mb-2 block text-sm font-medium text-secondary-foreground">
            Email
          </label>
          <input
            id="setup-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="min-h-12 w-full rounded-lg border border-input bg-card px-3 text-base text-foreground outline-none transition-colors placeholder:text-disabled-foreground focus:border-primary focus:ring-2 focus:ring-ring/20"
            placeholder="owner@example.com"
          />
        </div>
        <div>
          <label htmlFor="setup-password" className="mb-2 block text-sm font-medium text-secondary-foreground">
            Password
          </label>
          <input
            id="setup-password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            aria-describedby="password-hint"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="min-h-12 w-full rounded-lg border border-input bg-card px-3 text-base text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-ring/20"
          />
          <p id="password-hint" className="mt-2 text-xs text-muted-foreground">Use at least 8 characters.</p>
        </div>
        <div>
          <label htmlFor="confirm-password" className="mb-2 block text-sm font-medium text-secondary-foreground">
            Confirm password
          </label>
          <input
            id="confirm-password"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            className="min-h-12 w-full rounded-lg border border-input bg-card px-3 text-base text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-ring/20"
          />
        </div>
        {error && (
          <div role="alert" className="rounded-lg border border-destructive/20 bg-destructive-soft px-4 py-3 text-sm text-secondary-foreground">
            {error}
          </div>
        )}
        <Button type="submit" loading={isSubmitting} className="min-h-12 w-full rounded-lg">
          {isSubmitting ? 'Creating owner...' : 'Create Owner Account'}
        </Button>
      </form>
    </AuthPageLayout>
  )
}
