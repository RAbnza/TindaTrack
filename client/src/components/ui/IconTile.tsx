import { AppIcon, type AppIconName } from '../AppIcon'

export function IconTile({
  icon,
  tone = 'primary',
  className = '',
}: {
  icon: AppIconName
  tone?: 'primary' | 'neutral' | 'success' | 'warning' | 'danger' | 'info'
  className?: string
}) {
  return (
    <span
      aria-hidden="true"
      className={`icon-tile ${className}`}
      data-tone={tone}
    >
      <AppIcon name={icon} />
    </span>
  )
}
