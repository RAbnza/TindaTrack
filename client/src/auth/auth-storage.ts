import type { AuthSession } from '../types/auth'

const AUTH_STORAGE_KEY = 'tindatrack.auth'

export const AUTH_SESSION_CLEARED_EVENT =
  'tindatrack:auth-session-cleared'

export function getStoredAuthSession(): AuthSession | null {
  const storedSession = sessionStorage.getItem(AUTH_STORAGE_KEY)

  if (!storedSession) {
    return null
  }

  try {
    const parsedSession = JSON.parse(storedSession) as AuthSession

    if (
      !parsedSession.token ||
      !parsedSession.user ||
      !parsedSession.user.id ||
      !parsedSession.user.role
    ) {
      clearStoredAuthSession()
      return null
    }

    return parsedSession
  } catch {
    clearStoredAuthSession()
    return null
  }
}

export function storeAuthSession(session: AuthSession): void {
  sessionStorage.setItem(
    AUTH_STORAGE_KEY,
    JSON.stringify(session),
  )
}

export function clearStoredAuthSession(): void {
  sessionStorage.removeItem(AUTH_STORAGE_KEY)

  window.dispatchEvent(
    new Event(AUTH_SESSION_CLEARED_EVENT),
  )
}