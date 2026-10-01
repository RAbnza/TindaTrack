export type DashboardLowStockProduct = {
  id: number
  sku: string
  name: string
  currentStock: number
  reorderLevel: number
}

export type OwnerDashboard = {
  role: 'OWNER'
  date: string

  metrics: {
    salesCount: number
    totalSalesAmount: string
    lowStockCount: number
    outOfStockCount: number
    activeProductCount: number
    activeStaffCount: number
  }

  lowStockProducts:
    DashboardLowStockProduct[]
}

export type StaffDashboard = {
  role: 'STAFF'
  date: string

  metrics: {
    mySalesCount: number
    lowStockCount: number
    outOfStockCount: number
    activeProductCount: number
  }

  lowStockProducts:
    DashboardLowStockProduct[]
}

export type DashboardResponse =
  | OwnerDashboard
  | StaffDashboard