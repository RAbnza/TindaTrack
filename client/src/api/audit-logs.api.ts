import {
  apiRequest,
} from './api'

import type {
  AuditLog,
} from '../types/audit-log'

export function getAuditLogs(): Promise<
  AuditLog[]
> {
  return apiRequest<AuditLog[]>(
    '/api/audit-logs',
  )
}