import type {
  PaymentMethod,
} from './sale'

export type DailySalesReportItem = {
  productId: number
  productName: string
  productSku: string
  quantity: number
  unitPrice: string
  lineTotal: string
}

export type DailySalesReportSale = {
  id: number
  createdAt: string
  paymentMethod: PaymentMethod

  recordedBy: {
    id: number
    name: string
  }

  totalAmount: string
  items: DailySalesReportItem[]
}

export type DailySalesReport = {
  date: string
  saleCount: number
  totalSalesAmount: string
  sales: DailySalesReportSale[]
}