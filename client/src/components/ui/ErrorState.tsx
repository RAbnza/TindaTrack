import {
  Button,
} from './Button'
import { AppIcon } from '../AppIcon'

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
      className="ui-alert rounded-xl border border-destructive/20 bg-destructive-soft p-5"
    >
      <h2 className="flex items-center gap-2 text-section font-semibold text-destructive">
        <AppIcon name="warning" />
        {title}
      </h2>

      <p className="mt-1 text-sm leading-6 text-secondary-foreground">
        {message}
      </p>

      {onRetry && (
        <div className="mt-4">
          <Button
            variant="secondary"
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
