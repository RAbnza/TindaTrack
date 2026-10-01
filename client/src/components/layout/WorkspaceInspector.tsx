import { Link } from 'react-router-dom'
import { getVisibleNavigation } from '../../config/navigation'
import { getWorkspaceGuide } from '../../config/workspace'
import type { UserRole } from '../../types/auth'
import { AppIcon } from '../AppIcon'
import { Badge, Button } from '../ui'
import { useWorkspaceInspector } from './useWorkspaceInspector'

type WorkspaceInspectorProps = {
  pathname: string
  pageLabel: string
  role: UserRole
}

const pesoFormatter = new Intl.NumberFormat('en-PH', {
  style: 'currency',
  currency: 'PHP',
})

function PropertyField({ label, value, numeric = false }: {
  label: string
  value: string | number
  numeric?: boolean
}) {
  return (
    <div>
      <dt>{label}</dt>
      <dd className={numeric ? 'break-all tabular-nums' : 'break-all'}>{value}</dd>
    </div>
  )
}

export function WorkspaceInspector({ pathname, pageLabel, role }: WorkspaceInspectorProps) {
  const { selectedProduct, clearSelection } = useWorkspaceInspector()
  const guide = getWorkspaceGuide(pathname)
  const navigation = getVisibleNavigation(role).flatMap((section) => section.items)
  const relatedItems = navigation.filter((item) => guide.relatedRoutes.includes(item.to))
  const canSelectProduct = pathname === '/dashboard' || pathname === '/inventory'
  const product = canSelectProduct ? selectedProduct : null
  const stockStatus = product
    ? product.currentStock <= 0 ? 'Out of stock' : product.currentStock <= product.reorderLevel ? 'Low stock' : 'In stock'
    : null

  return (
    <div className="flex h-full flex-col">
      <header className="border-b border-border px-5 py-4">
        <p className="text-caption text-muted-foreground">{pageLabel} / Details</p>
        <h2 className="mt-2 text-section font-semibold">{product ? 'Product details' : 'Workspace details'}</h2>
      </header>

      <div className="flex-1 space-y-6 p-5">
        {product ? (
          <section aria-label="Selected product details">
            <div className="mb-4 flex items-start justify-between gap-2">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary">
                <AppIcon name="inventory" />
              </span>
              <Button variant="ghost" className="text-caption" onClick={clearSelection}>Clear selection</Button>
            </div>
            <h3 className="break-words text-section font-semibold">{product.name}</h3>
            <div className="mt-2">
              <Badge variant={stockStatus === 'Out of stock' ? 'danger' : stockStatus === 'Low stock' ? 'warning' : 'success'}>
                {stockStatus}
              </Badge>
            </div>
            <h4 className="mb-3 mt-5 text-caption font-medium text-muted-foreground">General</h4>
            <dl className="inspector-fields">
              <PropertyField label="SKU" value={product.sku} />
              {product.category !== undefined && (
                <PropertyField label="Category" value={product.category || 'Uncategorized'} />
              )}
              {pathname === '/inventory' && product.sellingPrice !== undefined && (
                <PropertyField label="Selling price" value={pesoFormatter.format(Number(product.sellingPrice))} numeric />
              )}
            </dl>
            <h4 className="mb-3 mt-5 border-t border-border pt-5 text-caption font-medium text-muted-foreground">Stock</h4>
            <dl className="inspector-fields">
              <PropertyField label="Current stock" value={product.currentStock} numeric />
              <PropertyField label="Reorder level" value={product.reorderLevel} numeric />
            </dl>
            <p className="mt-4 text-sm leading-6 text-secondary-foreground">
              Update quantities by recording a stock receipt{role === 'OWNER' ? ' or adjustment' : ''}.
            </p>
          </section>
        ) : (
          <>
            {canSelectProduct && (
              <section className="rounded-lg border border-dashed border-border bg-background p-4">
                <span className="mb-3 block text-muted-foreground"><AppIcon name="inventory" /></span>
                <h3 className="text-ui font-medium">No product selected</h3>
                <p className="mt-2 text-sm leading-6 text-secondary-foreground">
                  {pathname === '/dashboard' ? 'Select a stock item' : 'Choose View stock details on a product'} to see its SKU, quantity, and reorder level here.
                </p>
              </section>
            )}
            <section>
              <h3 className="text-ui font-medium">{pageLabel}</h3>
              <p className="mt-2 text-sm leading-6 text-secondary-foreground">{guide.description}</p>
              <ul className="mt-3 space-y-3 text-sm leading-6 text-secondary-foreground">
                {guide.guidance.map((text) => <li key={text} className="flex gap-2"><span aria-hidden="true">&middot;</span><span>{text}</span></li>)}
              </ul>
            </section>
          </>
        )}

        <section className="border-t border-border pt-5" aria-label="Related pages">
          <h3 className="mb-2 text-caption font-medium text-muted-foreground">Related pages</h3>
          <div className="space-y-1">
            {relatedItems.map((item) => (
              <Link key={item.to} to={item.to} className="flex min-h-11 items-center gap-3 rounded-lg px-2 text-ui text-secondary-foreground transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <span className="text-muted-foreground"><AppIcon name={item.icon} /></span>
                {item.label}
              </Link>
            ))}
          </div>
        </section>
      </div>

      <footer className="border-t border-border px-5 py-4">
        <p className="text-caption text-muted-foreground">{role === 'OWNER' ? 'Owner' : 'Staff'} access</p>
        <p className="mt-1 text-caption text-secondary-foreground">Details follow your current workspace.</p>
      </footer>
    </div>
  )
}
