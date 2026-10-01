import { useEffect, useId, useRef, type ReactNode } from 'react'
import { Button } from '../ui'

type PanelSheetProps = {
  open: boolean
  title: string
  side: 'left' | 'right'
  collapseAt: number
  onClose: () => void
  children: ReactNode
}

export function PanelSheet({ open, title, side, collapseAt, onClose, children }: PanelSheetProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const titleId = useId()

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  useEffect(() => {
    if (!open) return
    const breakpoint = window.matchMedia('(min-width: ' + collapseAt + 'px)')
    const closeOnDesktop = () => {
      if (breakpoint.matches) onClose()
    }
    closeOnDesktop()
    breakpoint.addEventListener('change', closeOnDesktop)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      breakpoint.removeEventListener('change', closeOnDesktop)
      document.body.style.overflow = previousOverflow
    }
  }, [open, collapseAt, onClose])

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      onCancel={(event) => { event.preventDefault(); onClose() }}
      onClick={(event) => { if (event.target === event.currentTarget) onClose() }}
      className={[
        'panel-sheet m-0 h-dvh max-h-dvh w-[min(22rem,calc(100%-2rem))] max-w-none border-border bg-card p-0 text-foreground backdrop:bg-foreground/30',
        side === 'left' ? 'mr-auto border-r' : 'ml-auto border-l',
      ].join(' ')}
    >
      <div className="flex h-full flex-col">
        <header className="flex min-h-14 shrink-0 items-center justify-between gap-3 border-b border-border px-4">
          <h2 id={titleId} className="text-section font-semibold">{title}</h2>
          <Button variant="ghost" aria-label={'Close ' + title.toLowerCase()} onClick={onClose} className="size-11 p-0">
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="size-5">
              <path d="m6 6 12 12M18 6 6 18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </Button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
      </div>
    </dialog>
  )
}
