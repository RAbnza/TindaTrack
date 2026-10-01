import {
  useEffect,
  useId,
  useRef,
  type MouseEvent,
} from 'react'

import {
  Button,
} from './Button'

type ConfirmationDialogVariant =
  | 'primary'
  | 'danger'

type ConfirmationDialogProps = {
  open: boolean
  title: string
  description: string

  confirmLabel?: string
  cancelLabel?: string

  variant?:
    ConfirmationDialogVariant

  loading?: boolean

  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmationDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmationDialogProps) {
  const dialogRef =
    useRef<HTMLDialogElement>(
      null,
    )

  const cancelButtonRef =
    useRef<HTMLButtonElement>(
      null,
    )

  const titleId =
    useId()

  const descriptionId =
    useId()

  useEffect(() => {
    const dialog =
      dialogRef.current

    if (!dialog) {
      return
    }

    if (
      open &&
      !dialog.open
    ) {
      dialog.showModal()

      requestAnimationFrame(
        () => {
          cancelButtonRef.current
            ?.focus()
        },
      )

      return
    }

    if (
      !open &&
      dialog.open
    ) {
      dialog.close()
    }
  }, [open])

  function handleBackdropClick(
    event:
      MouseEvent<HTMLDialogElement>,
  ) {
    if (
      event.target ===
        event.currentTarget &&
      !loading
    ) {
      onCancel()
    }
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={
        titleId
      }
      aria-describedby={
        descriptionId
      }
      onClick={
        handleBackdropClick
      }
      onCancel={(
        event,
      ) => {
        event.preventDefault()

        if (!loading) {
          onCancel()
        }
      }}
      className="m-auto w-[calc(100%-2rem)] max-w-md rounded-lg border border-border bg-card p-0 text-card-foreground shadow-xl backdrop:bg-foreground/30"
    >
      <div className="p-5 sm:p-6">
        <h2
          id={titleId}
          className="text-lg font-semibold tracking-tight text-foreground"
        >
          {title}
        </h2>

        <p
          id={
            descriptionId
          }
          className="mt-2 text-sm leading-6 text-muted-foreground"
        >
          {description}
        </p>

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            ref={
              cancelButtonRef
            }
            variant="secondary"
            disabled={loading}
            onClick={
              onCancel
            }
          >
            {cancelLabel}
          </Button>

          <Button
            variant={
              variant ===
              'danger'
                ? 'danger'
                : 'primary'
            }
            loading={loading}
            onClick={
              onConfirm
            }
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </dialog>
  )
}
