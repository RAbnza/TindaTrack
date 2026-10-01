import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest'

import {
  screen,
  within,
} from '@testing-library/react'

import userEvent
  from '@testing-library/user-event'

import {
  StaffManagementPage,
} from '../pages/StaffManagementPage'

import {
  renderWithRouter,
} from './test-utils'

const mocks =
  vi.hoisted(() => ({
    updateStaff:
      vi.fn(),

    createStaff:
      vi.fn(),

    reload:
      vi.fn(),
  }))

vi.mock(
  '../features/staff/useStaff',
  () => ({
    useStaff: () => ({
      staff: [
        {
          id: 8,

          name:
            'Juan Staff',

          email:
            'juan@test.local',

          active: true,

          createdAt:
            '2026-10-01T00:00:00.000Z',
        },
      ],

      isLoading:
        false,

      error:
        null,

      reload:
        mocks.reload,
    }),
  }),
)

vi.mock(
  '../api/staff.api',
  () => ({
    updateStaff:
      mocks.updateStaff,

    createStaff:
      mocks.createStaff,
  }),
)

beforeEach(() => {
  mocks.updateStaff
    .mockReset()

  mocks.createStaff
    .mockReset()

  mocks.reload
    .mockReset()
})

describe(
  'StaffManagementPage',
  () => {
    it(
      'does not deactivate staff when the confirmation is cancelled',
      async () => {
        const user =
          userEvent.setup()

        renderWithRouter(
          <StaffManagementPage />,
        )

        await user.click(
          screen.getByRole(
            'button',
            {
              name: 'Edit',
            },
          ),
        )

        await user.click(
          screen.getByRole(
            'button',
            {
              name:
                'Deactivate',
            },
          ),
        )

        const dialog =
          screen.getByRole(
            'dialog',
          )

        expect(
          within(
            dialog,
          ).getByText(
            'Deactivate staff account?',
          ),
        ).toBeInTheDocument()

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

        /*
         * Cancelling the destructive
         * confirmation must never send
         * a staff-status update.
         */
        expect(
          mocks.updateStaff,
        ).not.toHaveBeenCalled()

        /*
         * The account remains active,
         * so the edit UI should still
         * offer Deactivate rather than
         * Reactivate.
         */
        expect(
          screen.getByRole(
            'button',
            {
              name:
                'Deactivate',
            },
          ),
        ).toBeInTheDocument()
      },
    )
  },
)