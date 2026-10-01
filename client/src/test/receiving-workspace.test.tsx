import { beforeEach, expect, it, vi } from 'vitest'
import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ReceiveStockPage } from '../pages/ReceiveStockPage'
import { renderWithRouter } from './test-utils'
import type { Product } from '../types/product'

const mocks = vi.hoisted(() => ({ createStockReceipt: vi.fn() }))
vi.mock('../api/stock-receipts.api', () => mocks)
vi.mock('../features/receiving/useSuppliers', () => ({
  useSuppliers: () => ({
    suppliers: [{ id: 7, name: 'Supplier' }],
    isLoading: false,
    error: null,
    reload: vi.fn(),
  }),
}))
const products: Product[] = Array.from({ length: 60 }, (_, i) => ({
  id: i + 1,
  sku: `P-${i + 1}`,
  name: `Product ${String(i + 1).padStart(3, '0')}`,
  category: 'Grocery',
  sellingPrice: '25',
  reorderLevel: 2,
  active: true,
  currentStock: 0,
  lowStock: true,
}))
beforeEach(() => mocks.createStockReceipt.mockReset())

it('receives a large selection, preserves off-page costs, and submits every item', async () => {
  const user = userEvent.setup()
  const reload = vi.fn().mockResolvedValue(undefined)
  mocks.createStockReceipt.mockResolvedValue({ id: 1 })
  renderWithRouter(<ReceiveStockPage products={products} reloadProducts={reload} />)
  await screen.findByText('Product 001')
  await user.selectOptions(screen.getByLabelText('Supplier'), '7')
  await user.selectOptions(screen.getByLabelText('Products rows per page'), '50')
  await screen.findByText('Product 050')
  const browser = screen.getByRole('region', { name: 'Product browser' })
  const addButtons = within(browser).getAllByRole('button', { name: 'Add' }).slice(0, 30)
  for (const button of addButtons) fireEvent.click(button)
  await user.click(screen.getByRole('button', { name: 'Selected items (30)' }))
  const selected = screen.getByRole('region', { name: 'Selected transaction items' })
  expect(within(selected).getAllByRole('article')).toHaveLength(10)
  for (let page = 1; page <= 3; page++) {
    for (const input of within(selected).getAllByLabelText('Unit cost'))
      fireEvent.change(input, { target: { value: '0' } })
    if (page < 3) {
      expect(screen.getByRole('button', { name: 'Record Receipt' })).toBeDisabled()
      await user.click(screen.getByRole('button', { name: 'Selected items next page' }))
    }
  }
  const lastPageCost = within(selected).getAllByLabelText('Unit cost')[0]
  fireEvent.change(lastPageCost, { target: { value: '12.345' } })
  await user.click(screen.getByRole('button', { name: 'Selected items previous page' }))
  expect(screen.getByRole('button', { name: 'Record Receipt' })).toBeDisabled()
  await user.click(screen.getByRole('button', { name: 'Selected items next page' }))
  expect(within(selected).getAllByLabelText('Unit cost')[0]).toHaveValue('12.345')
  fireEvent.change(within(selected).getAllByLabelText('Unit cost')[0], {
    target: { value: '52.50' },
  })
  fireEvent.change(within(selected).getByLabelText('Product 021 received quantity'), {
    target: { value: '25' },
  })
  await user.click(screen.getByRole('button', { name: 'Record Receipt' }))
  await waitFor(() => expect(mocks.createStockReceipt).toHaveBeenCalledTimes(1))
  const request = mocks.createStockReceipt.mock.calls[0][0]
  expect(request.items).toHaveLength(30)
  expect(request.items[20]).toEqual({ productId: 21, quantity: 25, unitCost: '52.50' })
  expect(request.items[0]).toEqual({ productId: 1, quantity: 1, unitCost: '0' })
  expect(reload).toHaveBeenCalledTimes(1)
}, 15000)
