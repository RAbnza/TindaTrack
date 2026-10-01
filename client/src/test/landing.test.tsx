import {
  describe,
  expect,
  it,
} from 'vitest'

import {
  screen,
} from '@testing-library/react'

import {
  LandingPage,
} from '../pages/LandingPage'

import {
  renderWithRouter,
} from './test-utils'

describe(
  'LandingPage',
  () => {
    it(
      'renders the TindaTrack overview and links sign-in actions to /login',
      () => {
        renderWithRouter(
          <LandingPage />,
        )

        expect(
          screen.getByRole(
            'heading',
            {
              name:
                /keep inventory accurate/i,
            },
          ),
        ).toBeInTheDocument()

        const signInLinks =
          screen.getAllByRole(
            'link',
            {
              name:
                /^sign in$/i,
            },
          )

        expect(
          signInLinks.length,
        ).toBeGreaterThan(
          0,
        )

        for (
          const link of
          signInLinks
        ) {
          expect(
            link,
          ).toHaveAttribute(
            'href',
            '/login',
          )
        }
      },
    )
  },
)