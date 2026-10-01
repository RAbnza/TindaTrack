import {
  Prisma,
} from "../../generated/prisma/client.js";

import {
  findSalesInRange,
} from "../repositories/report.repository.js";

import {
  getManilaDayRange,
} from "../utils/manila-business-day.js";

export async function getDailySalesReport(
  date: string,
) {
  const {
    start,
    end,
  } =
    getManilaDayRange(
      date,
    );

  const sales =
    await findSalesInRange(
      start,
      end,
    );

  let totalSalesAmount =
    new Prisma.Decimal(0);

  for (
    const sale of sales
  ) {
    totalSalesAmount =
      totalSalesAmount.add(
        sale.totalAmount,
      );
  }

  return {
    date,

    saleCount:
      sales.length,

    totalSalesAmount:
      totalSalesAmount.toString(),

    sales:
      sales.map(
        (sale) => ({
          id:
            sale.id,

          createdAt:
            sale.createdAt.toISOString(),

          paymentMethod:
            sale.paymentMethod,

          recordedBy: {
            id:
              sale
                .recordedByUser
                .id,

            name:
              sale
                .recordedByUser
                .name,
          },

          totalAmount:
            sale.totalAmount.toString(),

          items:
            sale.saleItems.map(
              (item) => ({
                productId:
                  item.productId,

                productName:
                  item.product.name,

                productSku:
                  item.product.sku,

                quantity:
                  item.quantity,

                /*
                 * Historical values come
                 * directly from SaleItem.
                 */
                unitPrice:
                  item.unitPrice.toString(),

                lineTotal:
                  item.lineTotal.toString(),
              }),
            ),
        }),
      ),
  };
}