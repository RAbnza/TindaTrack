type LoadingStateProps = {
  label?: string
}

export function LoadingState({
  label = 'Loading...',
}: LoadingStateProps) {
  return (
    <div
      role="status"
      className="flex min-h-40 items-center justify-center"
    >
      <div className="flex items-center gap-3 text-muted-foreground">
        <span
          aria-hidden="true"
          className="size-5 animate-spin rounded-full border-2 border-current border-r-transparent"
        />

        <span className="text-sm">
          {label}
        </span>
      </div>
    </div>
  )
}