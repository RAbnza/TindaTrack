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
  AdjustStockPage,
} from '../pages/AdjustStockPage'

import type {
  Product,
} from '../types/product'

import {
  renderWithRouter,
} from './test-utils'

const mocks =
  vi.hoisted(() => ({
    createStockAdjustment:
      vi.fn(),
  }))

vi.mock(
  '../api/stock-adjustments.api',
  () => ({
    createStockAdjustment:
      mocks.createStockAdjustment,
  }),
)

const product: Product = {
  id: 31,

  sku:
    'SOAP-001',

  name:
    'Bath Soap',

  category:
    'Household',

  sellingPrice:
    '30.00',

  reorderLevel: 3,

  active: true,

  currentStock: 10,

  lowStock: false,
}

function renderPage() {
  return renderWithRouter(
    <AdjustStockPage
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
}

beforeEach(() => {
  mocks.createStockAdjustment
    .mockReset()
})

describe(
  'AdjustStockPage',
  () => {
    it(
      'submits an ADD adjustment directly',
      async () => {
        const user =
          userEvent.setup()

        mocks.createStockAdjustment
          .mockResolvedValue({
            id: 71,

            productId:
              product.id,

            quantityDelta: 1,

            reason:
              'Count correction',

            adjustedBy: 1,

            createdAt:
              '2026-10-02T02:00:00.000Z',
          })

        renderPage()

        await user.click(
          screen.getByRole(
            'button',
            {
              name:
                /bath soap/i,
            },
          ),
        )

        await user.type(
          screen.getByLabelText(
            'Reason',
          ),
          'Count correction',
        )

        await user.click(
          screen.getByRole(
            'button',
            {
              name:
                'Record Adjustment',
            },
          ),
        )

        await waitFor(
          () => {
            expect(
              mocks.createStockAdjustment,
            ).toHaveBeenCalledWith(
              {
                productId:
                  31,

                quantityDelta:
                  1,

                reason:
                  'Count correction',
              },
            )
          },
        )
      },
    )

    it(
      'requires confirmation before submitting a REMOVE adjustment',
      async () => {
        const user =
          userEvent.setup()

        mocks.createStockAdjustment
          .mockResolvedValue({
            id: 72,

            productId:
              product.id,

            quantityDelta:
              -1,

            reason:
              'Damaged item',

            adjustedBy: 1,

            createdAt:
              '2026-10-02T02:00:00.000Z',
          })

        renderPage()

        await user.click(
          screen.getByRole(
            'button',
            {
              name:
                'Remove Stock',
            },
          ),
        )

        await user.click(
          screen.getByRole(
            'button',
            {
              name:
                /bath soap/i,
            },
          ),
        )

        await user.type(
          screen.getByLabelText(
            'Reason',
          ),
          'Damaged item',
        )

        await user.click(
          screen.getByRole(
            'button',
            {
              name:
                'Record Adjustment',
            },
          ),
        )

        let dialog =
          screen.getByRole(
            'dialog',
          )

        expect(
          within(
            dialog,
          ).getByText(
            'Confirm stock reduction?',
          ),
        ).toBeInTheDocument()

        expect(
          mocks.createStockAdjustment,
        ).not.toHaveBeenCalled()

        await user.click(
          within(
            dialog,
          ).getByRole(
            'button',
            {
              name:
                'Cancel',
            },
          ),
        )

        expect(
          mocks.createStockAdjustment,
        ).not.toHaveBeenCalled()

        await user.click(
          screen.getByRole(
            'button',
            {
              name:
                'Record Adjustment',
            },
          ),
        )

        dialog =
          screen.getByRole(
            'dialog',
          )

        await user.click(
          within(
            dialog,
          ).getByRole(
            'button',
            {
              name:
                'Record adjustment',
            },
          ),
        )

        await waitFor(
          () => {
            expect(
              mocks.createStockAdjustment,
            ).toHaveBeenCalledWith(
              {
                productId:
                  31,

                quantityDelta:
                  -1,

                reason:
                  'Damaged item',
              },
            )
          },
        )
      },
    )
  },
)