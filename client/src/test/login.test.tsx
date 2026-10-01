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
  ApiError,
} from '../api/api'

import {
  LoginPage,
} from '../pages/LoginPage'

import {
  renderWithRouter,
} from './test-utils'

const mocks =
  vi.hoisted(() => ({
    login:
      vi.fn(),
  }))

vi.mock(
  '../auth/useAuth',
  () => ({
    useAuth: () => ({
      user: null,

      isAuthenticated:
        false,

      login:
        mocks.login,

      logout:
        vi.fn(),
    }),
  }),
)

beforeEach(() => {
  mocks.login.mockReset()
})

describe(
  'LoginPage',
  () => {
    it(
      'submits credentials through the auth boundary and shows loading while pending',
      async () => {
        const user =
          userEvent.setup()

        let resolveLogin:
          (() => void) |
          undefined

        mocks.login.mockImplementation(
          () =>
            new Promise<void>(
              (resolve) => {
                resolveLogin =
                  resolve
              },
            ),
        )

        renderWithRouter(
          <LoginPage />,
          '/login',
        )

        await user.type(
          screen.getByLabelText(
            'Email',
          ),
          'staff@test.local',
        )

        await user.type(
          screen.getByLabelText(
            'Password',
          ),
          'Password123!',
        )

        await user.click(
          screen.getByRole(
            'button',
            {
              name:
                /^sign in$/i,
            },
          ),
        )

        await waitFor(
          () => {
            expect(
              mocks.login,
            ).toHaveBeenCalledWith(
              {
                email:
                  'staff@test.local',

                password:
                  'Password123!',
              },
            )
          },
        )

        const loadingButton =
          screen.getByRole(
            'button',
            {
              name:
                /signing in/i,
            },
          )

        expect(
          loadingButton,
        ).toBeDisabled()

        resolveLogin?.()

        await waitFor(
          () => {
            expect(
              screen.getByRole(
                'button',
                {
                  name:
                    /^sign in$/i,
                },
              ),
            ).not.toBeDisabled()
          },
        )
      },
    )

    it(
      'keeps a failed login error visible inline',
      async () => {
        const user =
          userEvent.setup()

        mocks.login.mockRejectedValue(
          new ApiError(
            'Invalid email or password.',
            401,
          ),
        )

        renderWithRouter(
          <LoginPage />,
          '/login',
        )

        await user.type(
          screen.getByLabelText(
            'Email',
          ),
          'wrong@test.local',
        )

        await user.type(
          screen.getByLabelText(
            'Password',
          ),
          'wrong-password',
        )

        await user.click(
          screen.getByRole(
            'button',
            {
              name:
                /^sign in$/i,
            },
          ),
        )

        const alert =
          await screen.findByRole(
            'alert',
          )

        expect(
          alert,
        ).toHaveTextContent(
          'Invalid email or password.',
        )
      },
    )
  },
)