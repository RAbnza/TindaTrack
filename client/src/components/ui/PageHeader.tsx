import type { ReactNode } from 'react'
import { type AppIconName } from '../AppIcon'
import { IconTile } from './IconTile'

type PageHeaderProps = {
  title: string
  description?: string
  actions?: ReactNode
  icon?: AppIconName
}

export function PageHeader({
  title,
  description,
  actions,
  icon,
}: PageHeaderProps) {
  return (
    <header className="page-heading flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex min-w-0 items-start gap-3">
        {icon && <IconTile icon={icon} className="page-heading-icon" />}
        <div className="min-w-0">
          <h1 className="text-page font-semibold tracking-tight text-foreground">
            {title}
          </h1>

          {description && (
            <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
              {description}
            </p>
          )}
        </div>
      </div>

      {actions && (
        <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>
      )}
    </header>
  )
}
