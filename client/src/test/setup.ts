import '@testing-library/jest-dom/vitest'

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({ matches: false, media: query, onchange: null,
    addEventListener: () => {}, removeEventListener: () => {}, dispatchEvent: () => false,
  }),
})

import {
  cleanup,
} from '@testing-library/react'

import {
  afterEach,
} from 'vitest'

afterEach(() => {
  cleanup()
})

if (
  !HTMLDialogElement.prototype
    .showModal
) {
  Object.defineProperty(
    HTMLDialogElement.prototype,
    'showModal',
    {
      configurable: true,

      value:
        function showModal(
          this:
            HTMLDialogElement,
        ) {
          this.setAttribute(
            'open',
            '',
          )
        },
    },
  )
}

if (
  !HTMLDialogElement.prototype
    .close
) {
  Object.defineProperty(
    HTMLDialogElement.prototype,
    'close',
    {
      configurable: true,

      value:
        function close(
          this:
            HTMLDialogElement,
        ) {
          this.removeAttribute(
            'open',
          )
        },
    },
  )
}
