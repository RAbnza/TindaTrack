import {
  clearStoredAuthSession,
  getStoredAuthSession,
} from '../auth/auth-storage'

type ApiErrorBody = {
  error?: string
  details?: unknown
}

export class ApiError extends Error {
  readonly status: number
  readonly details?: unknown

  constructor(
    message: string,
    status: number,
    details?: unknown,
  ) {
    super(message)

    this.name = 'ApiError'
    this.status = status
    this.details = details
  }
}

type ApiRequestOptions =
  Omit<
    RequestInit,
    'body'
  > & {
    body?: unknown
    auth?: boolean
  }

const rawApiBaseUrl =
  import.meta.env
    .VITE_API_BASE_URL
    ?.trim() ?? ''

if (
  import.meta.env.PROD &&
  !rawApiBaseUrl
) {
  throw new Error(
    'VITE_API_BASE_URL is required for production builds.',
  )
}

const apiBaseUrl =
  rawApiBaseUrl.replace(
    /\/+$/,
    '',
  )

function getApiUrl(
  path: string,
) {
  if (
    !path.startsWith(
      '/',
    )
  ) {
    throw new Error(
      `API path must start with "/": ${path}`,
    )
  }

  return `${apiBaseUrl}${path}`
}

export async function apiRequest<T>(
  path: string,
  options:
    ApiRequestOptions = {},
): Promise<T> {
  const {
    body,
    auth = true,
    headers,
    ...requestOptions
  } = options

  const requestHeaders =
    new Headers(
      headers,
    )

  requestHeaders.set(
    'Accept',
    'application/json',
  )

  if (
    body !== undefined
  ) {
    requestHeaders.set(
      'Content-Type',
      'application/json',
    )
  }

  if (auth) {
    const session =
      getStoredAuthSession()

    if (
      session?.token
    ) {
      requestHeaders.set(
        'Authorization',
        `Bearer ${session.token}`,
      )
    }
  }

  const response =
    await fetch(
      getApiUrl(
        path,
      ),
      {
        ...requestOptions,

        headers:
          requestHeaders,

        body:
          body === undefined
            ? undefined
            : JSON.stringify(
                body,
              ),
      },
    )

  if (
    response.status ===
    401
  ) {
    clearStoredAuthSession()
  }

  const contentType =
    response.headers.get(
      'content-type',
    )

  const hasJsonBody =
    contentType
      ?.includes(
        'application/json',
      ) ?? false

  const responseBody =
    hasJsonBody
      ? ((await response.json()) as unknown)
      : null

  if (!response.ok) {
    const apiError =
      responseBody as
        | ApiErrorBody
        | null

    throw new ApiError(
      apiError?.error ??
        'Request failed.',

      response.status,

      apiError?.details,
    )
  }

  return responseBody as T
}