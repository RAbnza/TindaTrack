import {
  useState,
  type FormEvent,
} from 'react'

import { ApiError } from '../api/api'
import { useAuth } from '../auth/useAuth'
import { AuthPageLayout } from '../components/layout/AuthPageLayout'
import { Button } from '../components/ui'

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
    <AuthPageLayout>
      <div className="mb-6">
        <p className="text-xs font-medium text-primary">Welcome back</p>
        <h1 className="mt-2 text-2xl font-semibold leading-tight tracking-tight">
          Store operations,<br />without the guesswork.
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">Sign in to continue.</p>
      </div>

      <form className="space-y-5" onSubmit={handleSubmit}>
        <div>
          <label className="mb-2 block text-sm font-medium text-secondary-foreground" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="min-h-12 w-full rounded-lg border border-input bg-card px-3 text-base text-foreground outline-none transition-colors placeholder:text-disabled-foreground focus:border-primary focus:ring-2 focus:ring-ring/20"
            placeholder="you@example.com"
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-secondary-foreground" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="min-h-12 w-full rounded-lg border border-input bg-card px-3 text-base text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-ring/20"
          />
        </div>
        {error && (
          <div role="alert" className="rounded-lg border border-destructive/20 bg-destructive-soft px-4 py-3 text-sm text-secondary-foreground">
            {error}
          </div>
        )}
        <Button type="submit" loading={isSubmitting} className="min-h-12 w-full rounded-lg">
          {isSubmitting ? 'Signing in...' : 'Sign in'}
        </Button>
      </form>
    </AuthPageLayout>
  )
}
