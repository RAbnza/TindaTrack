import {
  apiRequest,
} from './api'

import type {
  CreateStaffRequest,
  StaffMember,
  UpdateStaffRequest,
} from '../types/staff'

export function getStaff(): Promise<
  StaffMember[]
> {
  return apiRequest<
    StaffMember[]
  >('/api/staff')
}

export function createStaff(
  input: CreateStaffRequest,
): Promise<StaffMember> {
  return apiRequest<StaffMember>(
    '/api/staff',
    {
      method: 'POST',
      body: input,
    },
  )
}

export function updateStaff(
  staffId: number,
  input: UpdateStaffRequest,
): Promise<StaffMember> {
  return apiRequest<StaffMember>(
    `/api/staff/${staffId}`,
    {
      method: 'PATCH',
      body: input,
    },
  )
}