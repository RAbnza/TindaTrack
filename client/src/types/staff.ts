export type StaffMember = {
  id: number
  name: string
  email: string
  active: boolean
  createdAt: string
}

export type CreateStaffRequest = {
  name: string
  email: string
  password: string
}

export type UpdateStaffRequest = {
  name?: string
  email?: string
  active?: boolean
}