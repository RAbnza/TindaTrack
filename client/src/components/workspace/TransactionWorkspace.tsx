import { useContext, useState, useSyncExternalStore, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { WorkspaceContext } from '../layout/workspace-context'
import { Button, Card } from '../ui'

function subscribe(callback: () => void) {
  const media = window.matchMedia('(min-width: 1280px)')
  media.addEventListener('change', callback)
  return () => media.removeEventListener('change', callback)
}
export function TransactionWorkspace({
  setup,
  browser,
  items,
  summary,
  count,
  busy = false,
}: {
  setup?: ReactNode
  browser: ReactNode
  items: ReactNode
  summary: ReactNode
  count: number
  busy?: boolean
}) {
  const [view, setView] = useState<'browse' | 'items'>('browse')
  const workspace = useContext(WorkspaceContext)
  const desktop = useSyncExternalStore(
    subscribe,
    () => window.matchMedia('(min-width: 1280px)').matches,
    () => false,
  )
  const target = desktop ? workspace?.summaryTarget : null
  return (
    <div className="transaction-workspace mt-5 space-y-4">
      <fieldset className="min-w-0" disabled={busy}>
        {setup}
      </fieldset>
      {target ? (
        createPortal(<div className="transaction-summary p-5">{summary}</div>, target)
      ) : (
        <Card
          surface="tint"
          className="transaction-summary transaction-summary-inline p-4"
        >
          {summary}
        </Card>
      )}
      <fieldset className="min-w-0" disabled={busy}>
        <Card className="overflow-hidden">
          <div className="workspace-switcher" aria-label="Transaction workspace views">
            <Button
              variant={view === 'browse' ? 'primary' : 'ghost'}
              aria-pressed={view === 'browse'}
              onClick={() => setView('browse')}
            >
              Browse products
            </Button>
            <Button
              variant={view === 'items' ? 'primary' : 'ghost'}
              aria-pressed={view === 'items'}
              onClick={() => setView('items')}
            >
              Selected items ({count})
            </Button>
            <span className="ml-auto hidden text-caption text-secondary-foreground sm:block">
              {view === 'browse' ? 'Find & add' : 'Edit & review'}
            </span>
          </div>
          <div hidden={view !== 'browse'}>{browser}</div>
          <div hidden={view !== 'items'}>{items}</div>
        </Card>
      </fieldset>
    </div>
  )
}
