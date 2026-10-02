import type {
  InputHTMLAttributes,
  SelectHTMLAttributes,
  ReactNode,
} from 'react'
import { AppIcon, type AppIconName } from '../AppIcon'
export function Input({
  className = '',
  icon,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { icon?: AppIconName }) {
  const fieldIcon = icon ?? (props.type === 'search' ? 'search' : undefined)
  const control = (
    <input
      className={`field-control ${fieldIcon ? 'field-with-icon' : ''} ${className}`}
      {...props}
    />
  )
  return fieldIcon ? (
    <div className="input-frame">
      <AppIcon name={fieldIcon} />
      {control}
    </div>
  ) : (
    control
  )
}
export function Select({
  className = '',
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={`field-control ${className}`} {...props}>
      {children}
    </select>
  )
}
export function FormField({
  label,
  id,
  children,
  hint,
}: {
  label: string
  id: string
  children: ReactNode
  hint?: string
}) {
  return (
    <div className="min-w-0">
      <label className="mb-2 block text-ui font-medium" htmlFor={id}>
        {label}
      </label>
      {children}
      {hint && (
        <p className="mt-1 text-caption text-muted-foreground">{hint}</p>
      )}
    </div>
  )
}
