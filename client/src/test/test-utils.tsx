import {
  render,
} from '@testing-library/react'

import {
  MemoryRouter,
} from 'react-router-dom'

import type {
  ReactElement,
} from 'react'

import {
  ToastProvider,
} from '../components/ui/ToastProvider'

export function renderWithRouter(
  ui: ReactElement,
  route = '/',
) {
  return render(
    <MemoryRouter
      initialEntries={[
        route,
      ]}
    >
      <ToastProvider>
        {ui}
      </ToastProvider>
    </MemoryRouter>,
  )
}