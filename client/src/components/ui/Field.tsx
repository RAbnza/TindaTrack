import type { InputHTMLAttributes, SelectHTMLAttributes, ReactNode } from 'react'
export function Input({
  className = '',
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`field-control ${className}`} {...props} />
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
      {hint && <p className="mt-1 text-caption text-muted-foreground">{hint}</p>}
    </div>
  )
}
