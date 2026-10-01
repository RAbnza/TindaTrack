import {
  createContext,
} from 'react'

export type ToastVariant =
  | 'success'
  | 'error'
  | 'info'

export type ToastInput = {
  message: string
  variant?: ToastVariant
  duration?: number
}

export type ToastContextValue = {
  showToast: (
    toast: ToastInput,
  ) => void
}

export const ToastContext =
  createContext<ToastContextValue | null>(
    null,
  )