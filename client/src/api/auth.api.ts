import { apiRequest } from './api'
import type {
  LoginRequest,
  LoginResponse,
} from '../types/auth'

export function login(
  credentials: LoginRequest,
): Promise<LoginResponse> {
  return apiRequest<LoginResponse>(
    '/api/auth/login',
    {
      method: 'POST',
      auth: false,
      body: credentials,
    },
  )
}