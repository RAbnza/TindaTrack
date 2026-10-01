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
} from '@testing-library/react'

import userEvent
  from '@testing-library/user-event'

import {
  NewSalePage,
} from '../pages/NewSalePage'

import type {
  Product,
} from '../types/product'

import {
  renderWithRouter,
} from './test-utils'

const mocks =
  vi.hoisted(() => ({
    createSale:
      vi.fn(),
  }))

vi.mock(
  '../api/sales.api',
  () => ({
    createSale:
      mocks.createSale,
  }),
)

const product: Product = {
  id: 11,

  sku:
    'COLA-001',

  name:
    'Cola 1L',

  category:
    'Drinks',

  sellingPrice:
    '45.00',

  reorderLevel: 2,

  active: true,

  currentStock: 10,

  lowStock: false,
}

beforeEach(() => {
  mocks.createSale.mockReset()
})

describe(
  'NewSalePage',
  () => {
    it(
      'submits only productId, quantity and payment method, then renders the server receipt',
      async () => {
        const user =
          userEvent.setup()

        const reloadProducts =
          vi.fn()
            .mockResolvedValue(
              undefined,
            )

        mocks.createSale
          .mockResolvedValue({
            id: 91,

            recordedBy: 4,

            recordedByName:
              'Server Cashier',

            paymentMethod:
              'CASH',

            totalAmount:
              '99.99',

            createdAt:
              '2026-10-02T01:30:00.000Z',

            items: [
              {
                productId:
                  product.id,

                productName:
                  'Server Snapshot Cola',

                quantity: 1,

                unitPrice:
                  '99.99',

                lineTotal:
                  '99.99',
              },
            ],
          })

        renderWithRouter(
          <NewSalePage
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

        await user.click(
          screen.getByRole(
            'button',
            {
              name: 'Add',
            },
          ),
        )

        await user.click(
          screen.getByRole(
            'button',
            {
              name: 'CASH',
            },
          ),
        )

        await user.click(
          screen.getByRole(
            'button',
            {
              name:
                'Record Sale',
            },
          ),
        )

        await waitFor(
          () => {
            expect(
              mocks.createSale,
            ).toHaveBeenCalledTimes(
              1,
            )
          },
        )

        const request =
          mocks.createSale
            .mock.calls[0][0]

        expect(
          request,
        ).toEqual({
          paymentMethod:
            'CASH',

          items: [
            {
              productId:
                11,

              quantity: 1,
            },
          ],
        })

        expect(
          request,
        ).not.toHaveProperty(
          'totalAmount',
        )

        expect(
          request.items[0],
        ).not.toHaveProperty(
          'unitPrice',
        )

        expect(
          request.items[0],
        ).not.toHaveProperty(
          'lineTotal',
        )

        expect(
          await screen.findByText(
            'Sale Receipt',
          ),
        ).toBeInTheDocument()

        /*
         * Deliberately different from
         * the current Product name/price.
         * This proves the receipt uses
         * the returned server response.
         */
        expect(
          screen.getByText(
            'Server Snapshot Cola',
          ),
        ).toBeInTheDocument()

        expect(
          screen.getByText(
            'Server Cashier',
          ),
        ).toBeInTheDocument()

        expect(
          screen.getAllByText(
            '₱99.99',
          ).length,
        ).toBeGreaterThan(
          0,
        )
      },
    )

    it(
      'calls browser print from the completed sale receipt',
      async () => {
        const user =
          userEvent.setup()

        const printSpy =
          vi.spyOn(
            window,
            'print',
          ).mockImplementation(
            () => undefined,
          )

        mocks.createSale
          .mockResolvedValue({
            id: 92,

            recordedBy: 4,

            recordedByName:
              'Store Owner',

            paymentMethod:
              'CASH',

            totalAmount:
              '45',

            createdAt:
              '2026-10-02T01:30:00.000Z',

            items: [
              {
                productId:
                  product.id,

                productName:
                  product.name,

                quantity: 1,

                unitPrice:
                  '45',

                lineTotal:
                  '45',
              },
            ],
          })

        renderWithRouter(
          <NewSalePage
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

        await user.click(
          screen.getByRole(
            'button',
            {
              name: 'Add',
            },
          ),
        )

        await user.click(
          screen.getByRole(
            'button',
            {
              name: 'CASH',
            },
          ),
        )

        await user.click(
          screen.getByRole(
            'button',
            {
              name:
                'Record Sale',
            },
          ),
        )

        await user.click(
          await screen.findByRole(
            'button',
            {
              name:
                'Print receipt',
            },
          ),
        )

        expect(
          printSpy,
        ).toHaveBeenCalledTimes(
          1,
        )

        printSpy.mockRestore()
      },
    )
  },
)