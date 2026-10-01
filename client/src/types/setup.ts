export type SetupStatus = {
  setupRequired: boolean
}

export type CreateInitialOwnerRequest = {
  name: string
  email: string
  password: string
}

export type CreatedInitialOwner = {
  id: number
  name: string
  email: string
  role: 'OWNER'
  active: true
}