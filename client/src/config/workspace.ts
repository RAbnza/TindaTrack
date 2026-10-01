type WorkspaceGuide = {
  description: string
  guidance: string[]
  relatedRoutes: string[]
}

const guides: Record<string, WorkspaceGuide> = {
  '/dashboard': {
    description: 'A quick view of your store today.',
    guidance: ['Review stock that needs attention.', 'Record a sale or receive stock from quick actions.'],
    relatedRoutes: ['/sales/new', '/receiving', '/inventory'],
  },
  '/inventory': {
    description: 'Current quantities across your product catalog.',
    guidance: ['Search by product name or SKU.', 'Use the low-stock filter to plan replenishment.'],
    relatedRoutes: ['/receiving', '/adjustments', '/products'],
  },
  '/sales/new': {
    description: 'Record a customer purchase.',
    guidance: ['Choose products and review quantities in the cart.', 'Check the total before completing the sale.'],
    relatedRoutes: ['/inventory', '/reports'],
  },
  '/receiving': {
    description: 'Record stock arriving at the store.',
    guidance: ['Choose a supplier and add the received products.', 'Review quantities and unit costs before saving.'],
    relatedRoutes: ['/inventory', '/suppliers'],
  },
  '/adjustments': {
    description: 'Record a correction to a stock balance.',
    guidance: ['Select a product and the adjustment direction.', 'Provide a reason so the change can be traced.'],
    relatedRoutes: ['/inventory', '/movements', '/audit'],
  },
  '/products': {
    description: 'Manage your store’s product catalog.',
    guidance: ['Keep product names and SKUs easy to identify.', 'Set prices and reorder levels for each product.'],
    relatedRoutes: ['/inventory', '/receiving'],
  },
  '/suppliers': {
    description: 'Manage the suppliers who replenish your store.',
    guidance: ['Keep supplier contact information up to date.', 'Use active suppliers when receiving stock.'],
    relatedRoutes: ['/receiving', '/products'],
  },
  '/staff': {
    description: 'Manage staff access to store operations.',
    guidance: ['Create and maintain staff accounts.', 'Staff can record sales, receive stock, and view inventory.'],
    relatedRoutes: ['/dashboard', '/audit'],
  },
  '/reports': {
    description: 'Review sales for a selected day.',
    guidance: ['Choose a date to review that day’s sales.', 'Expand a transaction to review its items.'],
    relatedRoutes: ['/dashboard', '/sales/new'],
  },
  '/movements': {
    description: 'Trace how product quantities have changed.',
    guidance: ['Filter the stock history to find relevant records.', 'Stock balances come from recorded sales, receipts, and adjustments.'],
    relatedRoutes: ['/inventory', '/receiving', '/adjustments'],
  },
  '/audit': {
    description: 'Review the history of store actions.',
    guidance: ['Use filters to locate an action or record.', 'Review who made a change and when it happened.'],
    relatedRoutes: ['/movements', '/staff'],
  },
}

export function getWorkspaceGuide(pathname: string): WorkspaceGuide {
  return guides[pathname] ?? {
    description: 'Your store operations workspace.',
    guidance: ['Use the navigation to open a store workflow.'],
    relatedRoutes: ['/dashboard', '/inventory'],
  }
}
