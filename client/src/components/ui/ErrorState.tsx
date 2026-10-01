import {
  Button,
} from './Button'

type ErrorStateProps = {
  title?: string
  message: string
  onRetry?: () => void
  retryLabel?: string
}

export function ErrorState({
  title = 'Something went wrong',
  message,
  onRetry,
  retryLabel = 'Try again',
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className="rounded-2xl border border-destructive/20 bg-destructive-soft p-5"
    >
      <h2 className="text-base font-semibold text-destructive">
        {title}
      </h2>

      <p className="mt-1 text-sm leading-6 text-destructive">
        {message}
      </p>

      {onRetry && (
        <div className="mt-4">
          <Button
            variant="danger"
            onClick={
              onRetry
            }
          >
            {retryLabel}
          </Button>
        </div>
      )}
    </div>
  )
}