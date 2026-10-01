export type UserRole = 'OWNER' | 'STAFF'

export type AuthUser = {
  id: number
  name: string
  email: string
  role: UserRole
}

export type LoginRequest = {
  email: string
  password: string
}

export type LoginResponse = {
  token: string
  user: AuthUser
}

export type AuthSession = LoginResponse