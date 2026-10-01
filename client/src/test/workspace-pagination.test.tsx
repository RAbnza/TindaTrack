import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { NewSalePage } from '../pages/NewSalePage'
import { AuditHistoryPage } from '../pages/AuditHistoryPage'
import { DailySalesPage } from '../pages/DailySalesPage'
import { ApiError } from '../api/api'
import { renderWithRouter } from './test-utils'
import type { Product } from '../types/product'
import type { CatalogQuery } from '../api/workspace.api'
import type { DailySalesReport } from '../types/report'

const mocks = vi.hoisted(() => ({
  browseProducts: vi.fn(),
  refreshSelection: vi.fn(),
  browseAudit: vi.fn(),
  browseMovements: vi.fn(),
  browseDailySales: vi.fn(),
  createSale: vi.fn(),
  getDailySales: vi.fn(),
}))
vi.mock('../api/workspace.api', () => mocks)
vi.mock('../api/sales.api', () => ({ createSale: mocks.createSale }))
vi.mock('../api/reports.api', () => ({ getDailySales: mocks.getDailySales }))

const products: Product[] = Array.from({ length: 120 }, (_, i) => ({
  id: i + 1,
  name: `Product ${String(i + 1).padStart(3, '0')}`,
  sku: `SKU-${i + 1}`,
  category: i % 2 ? 'Drinks' : 'Grocery',
  sellingPrice: '25',
  reorderLevel: 2,
  active: true,
  currentStock: 10,
  lowStock: false,
}))
const meta = (total: number, page = 1, pageSize = 25) => ({
  total,
  page,
  pageSize,
  totalPages: Math.max(1, Math.ceil(total / pageSize)),
})
const completeReport: DailySalesReport = {
  date: '2026-10-01',
  saleCount: 120,
  totalSalesAmount: '3000',
  sales: Array.from({ length: 120 }, (_, i) => ({
    id: i + 1,
    createdAt: '2026-10-01T01:00:00Z',
    recordedBy: { id: 1, name: 'Owner' },
    paymentMethod: 'CASH',
    totalAmount: '25',
    items: [
      {
        productId: 1,
        productName: 'Historical product',
        quantity: 1,
        unitPrice: '25',
        lineTotal: '25',
      },
    ],
  })),
}
beforeEach(() => {
  Object.values(mocks).forEach((mock) => mock.mockReset())
  mocks.browseProducts.mockImplementation(async (q: CatalogQuery) => {
    const matches = products.filter(
      (p) =>
        `${p.name} ${p.sku}`.toLowerCase().includes(q.search.toLowerCase()) &&
        (!q.category || p.category?.toLowerCase().includes(q.category.toLowerCase())),
    )
    return {
      items: matches.slice((q.page - 1) * q.pageSize, q.page * q.pageSize),
      pagination: meta(matches.length, q.page, q.pageSize),
    }
  })
  mocks.refreshSelection.mockImplementation(async (ids: number[]) =>
    products.filter((p) => ids.includes(p.id)),
  )
  mocks.createSale.mockResolvedValue({
    id: 200,
    recordedBy: 1,
    recordedByName: 'Server cashier',
    paymentMethod: 'CASH',
    totalAmount: '25',
    createdAt: '2026-10-01T01:00:00Z',
    items: [
      {
        productId: 1,
        productName: 'Server snapshot',
        quantity: 1,
        unitPrice: '25',
        lineTotal: '25',
      },
    ],
  })
  mocks.browseDailySales.mockImplementation(
    async (q: { page: number; pageSize: number }) => ({
      ...completeReport,
      sales: completeReport.sales.slice((q.page - 1) * q.pageSize, q.page * q.pageSize),
      pagination: meta(120, q.page, q.pageSize),
    }),
  )
  mocks.getDailySales.mockResolvedValue(completeReport)
})

describe('scalable transaction workspace', () => {
  it('retains selections and quantities across catalog pages and search', async () => {
    const user = userEvent.setup()
    renderWithRouter(<NewSalePage />)
    const browser = screen.getByRole('region', { name: 'Product browser' })
    await within(browser).findByText('Product 001')
    expect(within(browser).getAllByRole('article')).toHaveLength(10)
    await user.click(within(browser).getAllByRole('button', { name: 'Add' })[0])
    await user.click(screen.getByRole('button', { name: 'Products next page' }))
    await within(browser).findByText('Product 011')
    await user.click(within(browser).getAllByRole('button', { name: 'Add' })[0])
    await user.type(screen.getByLabelText('Search products'), 'Product 120')
    await within(browser).findByText('Product 120')
    expect(within(browser).getAllByRole('article')).toHaveLength(1)
    await user.click(within(browser).getByRole('button', { name: 'Add' }))
    await user.click(screen.getByRole('button', { name: 'Selected items (3)' }))
    const selected = screen.getByRole('region', { name: 'Selected transaction items' })
    expect(within(selected).getByText('Product 001')).toBeInTheDocument()
    const quantity = within(selected).getByLabelText('Product 001 quantity')
    await user.clear(quantity)
    await user.type(quantity, '4')
    await user.click(screen.getByRole('button', { name: 'CASH' }))
    await user.click(screen.getByRole('button', { name: 'Record Sale' }))
    await waitFor(() =>
      expect(mocks.createSale).toHaveBeenCalledWith({
        paymentMethod: 'CASH',
        items: [
          { productId: 1, quantity: 4 },
          { productId: 11, quantity: 1 },
          { productId: 120, quantity: 1 },
        ],
      }),
    )
  })
  it('handles 50 selected products with bounded item pages and keeps off-page validation', async () => {
    const user = userEvent.setup()
    renderWithRouter(<NewSalePage />)
    await screen.findByText('Product 001')
    await user.selectOptions(screen.getByLabelText('Products rows per page'), '50')
    await screen.findByText('Product 050')
    const browser = screen.getByRole('region', { name: 'Product browser' })
    const addButtons = within(browser).getAllByRole('button', { name: 'Add' })
    for (const button of addButtons) await user.click(button)
    await user.click(screen.getByRole('button', { name: 'Selected items (50)' }))
    const selected = screen.getByRole('region', { name: 'Selected transaction items' })
    expect(within(selected).getAllByRole('article')).toHaveLength(10)
    await user.click(screen.getByRole('button', { name: 'Selected items next page' }))
    expect(within(selected).getByText('Product 011')).toBeInTheDocument()
    const quantity = within(selected).getByLabelText('Product 011 quantity')
    await user.clear(quantity)
    await user.type(quantity, '11')
    await user.click(screen.getByRole('button', { name: 'Selected items previous page' }))
    await user.click(screen.getByRole('button', { name: 'CASH' }))
    expect(screen.getByRole('button', { name: 'Record Sale' })).toBeDisabled()
    expect(
      screen.getByText('Review quantities in Selected items. Stock must be available.'),
    ).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Selected items next page' }))
    await user.clear(within(selected).getByLabelText('Product 011 quantity'))
    await user.type(within(selected).getByLabelText('Product 011 quantity'), '3')
    await user.click(screen.getByRole('button', { name: 'Record Sale' }))
    await waitFor(() => expect(mocks.createSale).toHaveBeenCalledTimes(1))
    expect(mocks.createSale.mock.calls[0][0].items).toHaveLength(50)
    expect(mocks.createSale.mock.calls[0][0].items[10]).toEqual({
      productId: 11,
      quantity: 3,
    })
  }, 15000)
  it('refreshes selected stock after a rejected sale and prevents a second invalid submission', async () => {
    const user = userEvent.setup()
    mocks.createSale.mockRejectedValue(new ApiError('Stock changed. Please review.', 400))
    mocks.refreshSelection.mockResolvedValue([
      { ...products[0], currentStock: 0, lowStock: true },
    ])
    renderWithRouter(<NewSalePage />)
    await user.click((await screen.findAllByRole('button', { name: 'Add' }))[0])
    await user.click(screen.getByRole('button', { name: 'CASH' }))
    await user.click(screen.getByRole('button', { name: 'Record Sale' }))
    await waitFor(() => expect(mocks.refreshSelection).toHaveBeenCalledWith([1]))
    await user.click(screen.getByRole('button', { name: 'Selected items (1)' }))
    await screen.findByText('Stock changed. Please review.')
    expect(screen.getByRole('button', { name: 'Record Sale' })).toBeDisabled()
  })
})

describe('paginated history and full-day export', () => {
  it('sends page and filter changes to audit queries and retains unknown evidence', async () => {
    const user = userEvent.setup()
    mocks.browseAudit.mockImplementation(
      async (q: { page: number; pageSize: number; search: string }) => ({
        items: [
          {
            id: q.page,
            action: 'FUTURE_ACTION',
            createdAt: '2026-10-01T01:00:00Z',
            entityType: 'Product',
            entityId: 9,
            actor: { id: 1, name: `Actor page ${q.page}`, role: 'OWNER' },
            metadata: { customValue: 'Preserved evidence' },
          },
        ],
        pagination: meta(120, q.page, q.pageSize),
      }),
    )
    renderWithRouter(<AuditHistoryPage />)
    await screen.findByText('Actor page 1')
    await user.click(screen.getByRole('button', { name: 'Audit history next page' }))
    await screen.findByText('Actor page 2')
    await user.type(screen.getByLabelText('Search actor, action, or entity'), 'Owner')
    await waitFor(() =>
      expect(mocks.browseAudit).toHaveBeenLastCalledWith(
        expect.objectContaining({ page: 1, search: 'Owner' }),
        expect.any(AbortSignal),
      ),
    )
    await screen.findByText('Actor page 1')
    await user.click(screen.getByText('View evidence'))
    expect(screen.getByText('Preserved evidence')).toBeVisible()
  })
  it('prints and exports the complete report while screen rows remain paginated', async () => {
    const user = userEvent.setup()
    const print = vi.spyOn(window, 'print').mockImplementation(() => {
      expect(document.querySelectorAll('.daily-sales-print-sale')).toHaveLength(120)
      expect(
        document.querySelector('.daily-sales-print-document')?.textContent,
      ).toContain('Historical product')
    })
    const createUrl = vi.fn().mockReturnValue('blob:test')
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      value: createUrl,
    })
    Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: vi.fn() })
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => {})
    renderWithRouter(<DailySalesPage />)
    await screen.findByText('Sale #1')
    expect(screen.getByText('₱3,000.00')).toBeInTheDocument()
    expect(screen.queryByText('Sale #26')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Daily sales next page' }))
    await screen.findByText('Sale #26')
    await user.click(screen.getByRole('button', { name: 'Print / Save PDF' }))
    await waitFor(() => expect(print).toHaveBeenCalledTimes(1))
    await user.click(screen.getByRole('button', { name: 'Export CSV' }))
    await waitFor(() => expect(createUrl).toHaveBeenCalledTimes(1))
    const csv = await new Promise<string>((resolve) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result))
      reader.readAsText(createUrl.mock.calls[0][0] as Blob)
    })
    expect(csv.split('\r\n')).toHaveLength(121)
    expect(csv).toContain(
      '120,2026-10-01T01:00:00Z,CASH,Owner,Historical product,1,25,25,25',
    )
    expect(mocks.getDailySales).toHaveBeenCalledTimes(2)
    print.mockRestore()
    click.mockRestore()
  })
})
