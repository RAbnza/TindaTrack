import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest'

import {
  screen,
  waitFor,
  within,
} from '@testing-library/react'

import userEvent
  from '@testing-library/user-event'

import {
  ReceiveStockPage,
} from '../pages/ReceiveStockPage'

import type {
  Product,
} from '../types/product'

import {
  renderWithRouter,
} from './test-utils'

const mocks =
  vi.hoisted(() => ({
    createStockReceipt:
      vi.fn(),

    reloadSuppliers:
      vi.fn(),
  }))

vi.mock(
  '../api/stock-receipts.api',
  () => ({
    createStockReceipt:
      mocks.createStockReceipt,
  }),
)

vi.mock(
  '../features/receiving/useSuppliers',
  () => ({
    useSuppliers: () => ({
      suppliers: [
        {
          id: 7,

          name:
            'Test Supplier',
        },
      ],

      isLoading:
        false,

      error:
        null,

      reload:
        mocks.reloadSuppliers,
    }),
  }),
)

const product: Product = {
  id: 21,

  sku:
    'RICE-001',

  name:
    'Rice 1kg',

  category:
    'Grocery',

  sellingPrice:
    '65.00',

  reorderLevel: 5,

  active: true,

  currentStock: 8,

  lowStock: false,
}

async function getProductAddButton(
  productName: string,
) {
  const productCard =
    (await screen.findByText(productName))
      .closest(
        'article',
      )

  expect(
    productCard,
  ).not.toBeNull()

  return within(
    productCard!,
  ).getByRole(
    'button',
    {
      name: 'Add',
    },
  )
}

beforeEach(() => {
  mocks.createStockReceipt
    .mockReset()

  mocks.reloadSuppliers
    .mockReset()
})

describe(
  'ReceiveStockPage',
  () => {
    it(
      'submits supplier, reference and receipt item values',
      async () => {
        const user =
          userEvent.setup()

        mocks.createStockReceipt
          .mockResolvedValue({
            id: 51,

            supplierId: 7,

            receivedBy: 1,

            referenceNo:
              'DR-1001',

            receivedAt:
              '2026-10-02T02:00:00.000Z',
          })

        const reloadProducts =
          vi.fn()
            .mockResolvedValue(
              undefined,
            )

        renderWithRouter(
          <ReceiveStockPage
            products={[
              product,
            ]}
            isProductsLoading={
              false
            }
            productsError={
              null
            }
            reloadProducts={
              reloadProducts
            }
          />,
        )

        await user.selectOptions(
          screen.getByLabelText(
            'Supplier',
          ),
          '7',
        )

        await user.type(
          screen.getByLabelText(
            'Reference number',
          ),
          'DR-1001',
        )

        await user.click(
          await getProductAddButton(
            'Rice 1kg',
          ),
        )

        await user.click(screen.getByRole('button', { name: 'Selected items (1)' }))

        await user.click(
          screen.getByRole(
            'button',
            {
              name:
                /increase rice 1kg received quantity/i,
            },
          ),
        )

        await user.type(
          screen.getByLabelText(
            'Unit cost',
          ),
          '52.50',
        )

        await user.click(
          screen.getByRole(
            'button',
            {
              name:
                'Record Receipt',
            },
          ),
        )

        await waitFor(
          () => {
            expect(
              mocks.createStockReceipt,
            ).toHaveBeenCalledWith(
              {
                supplierId: 7,

                referenceNo:
                  'DR-1001',

                items: [
                  {
                    productId:
                      21,

                    quantity: 2,

                    unitCost:
                      '52.50',
                  },
                ],
              },
            )
          },
        )

        expect(
          reloadProducts,
        ).toHaveBeenCalledTimes(
          1,
        )
      },
    )

    it(
      'shows invalid unit cost and does not submit the receipt',
      async () => {
        const user =
          userEvent.setup()

        renderWithRouter(
          <ReceiveStockPage
            products={[
              product,
            ]}
            isProductsLoading={
              false
            }
            productsError={
              null
            }
            reloadProducts={
              vi.fn()
                .mockResolvedValue(
                  undefined,
                )
            }
          />,
        )

        await user.selectOptions(
          screen.getByLabelText(
            'Supplier',
          ),
          '7',
        )

        await user.click(
          await getProductAddButton(
            'Rice 1kg',
          ),
        )

        await user.click(screen.getByRole('button', { name: 'Selected items (1)' }))

        await user.type(
          screen.getByLabelText(
            'Unit cost',
          ),
          '12.345',
        )

        expect(
          screen.getByText(
            'Enter a non-negative amount with up to 2 decimal places.',
          ),
        ).toBeInTheDocument()

        expect(
          screen.getByRole(
            'button',
            {
              name:
                'Record Receipt',
            },
          ),
        ).toBeDisabled()

        expect(
          mocks.createStockReceipt,
        ).not.toHaveBeenCalled()
      },
    )
  },
)
