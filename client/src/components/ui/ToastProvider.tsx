import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'

import {
  ToastContext,
  type ToastInput,
  type ToastVariant,
} from './toast-context'
import { AppIcon } from '../AppIcon'

type ToastProviderProps = {
  children: ReactNode
}

type ToastItem = {
  id: number
  message: string
  variant: ToastVariant
}

const variantClasses: Record<
  ToastVariant,
  string
> = {
  success:
    'border-success/20 bg-success-soft text-success',

  error:
    'border-destructive/20 bg-destructive-soft text-destructive',

  info:
    'border-info/20 bg-info-soft text-info',
}

export function ToastProvider({
  children,
}: ToastProviderProps) {
  const [
    toasts,
    setToasts,
  ] = useState<ToastItem[]>(
    [],
  )

  const nextIdRef =
    useRef(1)

  const timersRef =
    useRef(
      new Map<
        number,
        number
      >(),
    )

  const dismissToast =
    useCallback(
      (id: number) => {
        const timer =
          timersRef.current.get(
            id,
          )

        if (
          timer !== undefined
        ) {
          window.clearTimeout(
            timer,
          )

          timersRef.current.delete(
            id,
          )
        }

        setToasts(
          (current) =>
            current.filter(
              (toast) =>
                toast.id !== id,
            ),
        )
      },
      [],
    )

  const showToast =
    useCallback(
      ({
        message,
        variant = 'info',
        duration = 4000,
      }: ToastInput) => {
        const id =
          nextIdRef.current++

        setToasts(
          (current) => [
            ...current,
            {
              id,
              message,
              variant,
            },
          ],
        )

        const timer =
          window.setTimeout(
            () => {
              dismissToast(
                id,
              )
            },
            duration,
          )

        timersRef.current.set(
          id,
          timer,
        )
      },
      [dismissToast],
    )

  useEffect(() => {
    const timers =
      timersRef.current

    return () => {
      for (
        const timer of
        timers.values()
      ) {
        window.clearTimeout(
          timer,
        )
      }

      timers.clear()
    }
  }, [])

  return (
    <ToastContext.Provider
      value={{
        showToast,
      }}
    >
      {children}

      <div
        aria-live="polite"
        aria-relevant="additions"
        className="pointer-events-none fixed inset-x-4 bottom-4 z-50 flex flex-col items-end gap-2 sm:left-auto sm:right-6 sm:w-full sm:max-w-sm"
      >
        {toasts.map(
          (toast) => (
            <div
              key={
                toast.id
              }
              role={
                toast.variant ===
                'error'
                  ? 'alert'
                  : 'status'
              }
              className={[
                'ui-toast pointer-events-auto flex w-full items-start justify-between gap-3 rounded-xl border p-4',
                variantClasses[
                  toast.variant
                ],
              ].join(' ')}
            >
              <AppIcon name={toast.variant === 'error' ? 'warning' : toast.variant === 'success' ? 'check' : 'info'} className="mt-0.5" />
              <p className="min-w-0 text-sm leading-5">
                {
                  toast.message
                }
              </p>

              <button
                type="button"
                aria-label="Dismiss notification"
                onClick={() =>
                  dismissToast(
                    toast.id,
                  )
                }
                className="flex size-11 shrink-0 items-center justify-center rounded-xl text-xl leading-none opacity-70 transition hover:bg-black/5 hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current"
              >
                ×
              </button>
            </div>
          ),
        )}
      </div>
    </ToastContext.Provider>
  )
}
