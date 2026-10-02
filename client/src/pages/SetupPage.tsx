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
import { Input } from '../components/ui/Field'
import { AppIcon } from '../components/AppIcon'
import { IconTile } from '../components/ui/IconTile'

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
        <div className="mb-4 flex items-center justify-between gap-3"><IconTile icon="shield" /><Badge variant="primary">Initial setup</Badge></div>
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
          <Input
            icon="user"
            id="owner-name"
            name="name"
            type="text"
            autoComplete="name"
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </div>
        <div>
          <label htmlFor="setup-email" className="mb-2 block text-sm font-medium text-secondary-foreground">
            Email
          </label>
          <Input
            icon="mail"
            id="setup-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="owner@example.com"
          />
        </div>
        <div>
          <label htmlFor="setup-password" className="mb-2 block text-sm font-medium text-secondary-foreground">
            Password
          </label>
          <Input
            icon="lock"
            id="setup-password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            aria-describedby="password-hint"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          <p id="password-hint" className="mt-2 text-xs text-muted-foreground">Use at least 8 characters.</p>
        </div>
        <div>
          <label htmlFor="confirm-password" className="mb-2 block text-sm font-medium text-secondary-foreground">
            Confirm password
          </label>
          <Input
            icon="lock"
            id="confirm-password"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
          />
        </div>
        {error && (
          <div role="alert" className="rounded-lg border border-destructive/20 bg-destructive-soft px-4 py-3 text-sm text-secondary-foreground">
            {error}
          </div>
        )}
        <Button type="submit" loading={isSubmitting} className="min-h-12 w-full rounded-lg">
          {!isSubmitting && <AppIcon name="user" />}
          {isSubmitting ? 'Creating owner...' : 'Create Owner Account'}
        </Button>
      </form>
      <p className="auth-assurance"><AppIcon name="shield" />Once created, sign in with your owner account.</p>
    </AuthPageLayout>
  )
}
