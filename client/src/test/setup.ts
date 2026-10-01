import '@testing-library/jest-dom/vitest'

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