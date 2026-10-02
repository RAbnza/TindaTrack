import { useState } from 'react'
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import { AuthContext } from '../auth/auth-context'
import { AppShell } from '../components/AppShell'
import { NewSalePage } from '../pages/NewSalePage'
import { usePagedQuery } from '../features/workspace/usePagedQuery'
import { renderWithRouter } from './test-utils'

it('ignores a late response after a newer search finishes', async () => {
  const pending = new Map<string, (value: string) => void>()
  const read = vi.fn<(query: string, signal: AbortSignal) => Promise<string>>(
    (query) => new Promise<string>((resolve) => pending.set(query, resolve)),
  )
  function Harness() {
    const [query, setQuery] = useState('first')
    const { data, isLoading } = usePagedQuery(read, query)
    return (
      <>
        <input
          aria-label="Query"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <p>{isLoading ? 'Loading' : data}</p>
      </>
    )
  }
  render(<Harness />)
  await waitFor(() => expect(read).toHaveBeenCalledTimes(1))
  const firstSignal = read.mock.calls[0][1]
  fireEvent.change(screen.getByLabelText('Query'), {
    target: { value: 'second' },
  })
  expect(firstSignal.aborted).toBe(true)
  await waitFor(() => expect(read).toHaveBeenCalledTimes(2))
  await act(async () => pending.get('second')!('New results'))
  expect(screen.getByText('New results')).toBeInTheDocument()
  await act(async () => pending.get('first')!('Old results'))
  expect(screen.queryByText('Old results')).not.toBeInTheDocument()
})

it('moves the single transaction summary between desktop inspector and inline workspace', async () => {
  let desktop = true
  const listeners = new Set<() => void>()
  const media = vi.spyOn(window, 'matchMedia').mockImplementation((query) => ({
    matches: desktop,
    media: query,
    onchange: null,
    addEventListener: (
      _event: string,
      listener: EventListenerOrEventListenerObject,
    ) => listeners.add(listener as () => void),
    removeEventListener: (
      _event: string,
      listener: EventListenerOrEventListenerObject,
    ) => listeners.delete(listener as () => void),
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => true,
  }))
  renderWithRouter(
    <AuthContext.Provider
      value={{
        user: {
          id: 1,
          name: 'Owner',
          email: 'owner@test.local',
          role: 'OWNER',
        },
        isAuthenticated: true,
        login: async () => {},
        logout: () => {},
      }}
    >
      <AppShell>
        <NewSalePage products={[]} />
      </AppShell>
    </AuthContext.Provider>,
    '/sales/new',
  )
  const panel = screen.getByRole('complementary', {
    name: 'Transaction summary panel',
  })
  await waitFor(() =>
    expect(
      within(panel).getByRole('button', { name: 'Record Sale' }),
    ).toBeInTheDocument(),
  )
  expect(screen.getAllByRole('button', { name: 'Record Sale' })).toHaveLength(1)
  const payment = within(panel).getByRole('group', { name: 'Payment method' })
  expect(screen.getAllByRole('group', { name: 'Payment method' })).toHaveLength(
    1,
  )
  expect(
    within(payment)
      .getAllByRole('button')
      .map((button) => button.textContent),
  ).toEqual(['CASH', 'GCASH', 'MAYA'])
  fireEvent.click(within(payment).getByRole('button', { name: 'GCASH' }))
  expect(
    within(payment).getByRole('button', { name: 'GCASH' }),
  ).toHaveAttribute('aria-pressed', 'true')
  expect(document.querySelector('.transaction-summary-inline')).toBeNull()
  act(() => {
    desktop = false
    listeners.forEach((listener) => listener())
  })
  expect(
    document.querySelector('.transaction-summary-inline'),
  ).toContainElement(screen.getByRole('button', { name: 'Record Sale' }))
  expect(
    within(panel).queryByRole('button', { name: 'Record Sale' }),
  ).not.toBeInTheDocument()
  expect(screen.getAllByRole('button', { name: 'Record Sale' })).toHaveLength(1)
  expect(
    document.querySelector('.transaction-summary-inline'),
  ).toContainElement(screen.getByRole('group', { name: 'Payment method' }))
  expect(
    within(panel).queryByRole('group', { name: 'Payment method' }),
  ).not.toBeInTheDocument()
  expect(screen.getAllByRole('group', { name: 'Payment method' })).toHaveLength(
    1,
  )
  expect(screen.getByRole('button', { name: 'GCASH' })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  media.mockRestore()
})
