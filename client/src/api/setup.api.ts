import {
  apiRequest,
} from './api'

import type {
  CreatedInitialOwner,
  CreateInitialOwnerRequest,
  SetupStatus,
} from '../types/setup'

export function getSetupStatus(): Promise<
  SetupStatus
> {
  return apiRequest<SetupStatus>(
    '/api/setup/status',
    {
      auth: false,
    },
  )
}

export function createInitialOwner(
  input: CreateInitialOwnerRequest,
): Promise<CreatedInitialOwner> {
  return apiRequest<CreatedInitialOwner>(
    '/api/setup',
    {
      method: 'POST',
      auth: false,
      body: input,
    },
  )
}