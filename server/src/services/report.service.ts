import { Prisma } from "../../generated/prisma/client.js";

import { findSalesInRange } from "../repositories/report.repository.js";

const MANILA_UTC_OFFSET_HOURS = 8;

function getManilaDayRange(
  date: string,
): {
  start: Date;
  end: Date;
} {
  const [yearText, monthText, dayText] =
    date.split("-");

  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);

  /*
   * Asia/Manila is UTC+8.
   *
   * 2026-10-01 00:00 +08:00
   * = 2026-09-30 16:00 UTC
   *
   * Date.UTC accepts an hour outside the normal
   * range and normalizes it correctly.
   */
  const start = new Date(
    Date.UTC(
      year,
      month - 1,
      day,
      -MANILA_UTC_OFFSET_HOURS,
    ),
  );

  const end = new Date(
    Date.UTC(
      year,
      month - 1,
      day + 1,
      -MANILA_UTC_OFFSET_HOURS,
    ),
  );

  return {
    start,
    end,
  };
}

export async function getDailySalesReport(
  date: string,
) {
  const { start, end } =
    getManilaDayRange(date);

  const sales = await findSalesInRange(
    start,
    end,
  );

  let totalSalesAmount =
    new Prisma.Decimal(0);

  for (const sale of sales) {
    totalSalesAmount =
      totalSalesAmount.add(
        sale.totalAmount,
      );
  }

  return {
    date,
    saleCount: sales.length,
    totalSalesAmount:
      totalSalesAmount.toString(),

    sales: sales.map((sale) => ({
      id: sale.id,
      createdAt:
        sale.createdAt.toISOString(),

      paymentMethod:
        sale.paymentMethod,

      recordedBy: {
        id:
          sale.recordedByUser.id,
        name:
          sale.recordedByUser.name,
      },

      totalAmount:
        sale.totalAmount.toString(),

      items: sale.saleItems.map(
        (item) => ({
          productId:
            item.productId,

          productName:
            item.product.name,

          quantity:
            item.quantity,

          /*
           * Historical values from SaleItem.
           * Do NOT read Product.sellingPrice.
           */
          unitPrice:
            item.unitPrice.toString(),

          lineTotal:
            item.lineTotal.toString(),
        }),
      ),
    })),
  };
}