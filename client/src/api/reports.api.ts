import {
  apiRequest,
} from './api'

import type {
  DailySalesReport,
} from '../types/report'

export function getDailySales(
  date: string,
): Promise<DailySalesReport> {
  return apiRequest<DailySalesReport>(
    `/api/reports/daily-sales?date=${encodeURIComponent(
      date,
    )}`,
  )
}