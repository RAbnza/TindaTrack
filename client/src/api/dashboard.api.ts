import {
  apiRequest,
} from './api'

import type {
  DashboardResponse,
} from '../types/dashboard'

export function getDashboard(): Promise<
  DashboardResponse
> {
  return apiRequest<
    DashboardResponse
  >(
    '/api/dashboard',
  )
}