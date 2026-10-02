import type {
  ReactNode,
} from 'react'

import {
  Card,
} from './Card'
import { IconTile } from './IconTile'

type EmptyStateProps = {
  title: string
  description?: string
  action?: ReactNode
}

export function EmptyState({
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <Card className="empty-state border-dashed px-6 py-10 text-center">
      <IconTile icon="empty" tone="neutral" className="mx-auto mb-4" />
      <h2 className="text-base font-semibold text-foreground">
        {title}
      </h2>

      {description && (
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
          {description}
        </p>
      )}

      {action && (
        <div className="mt-5 flex justify-center">
          {action}
        </div>
      )}
    </Card>
  )
}
