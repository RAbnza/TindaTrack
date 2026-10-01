import {
  prisma,
} from "../db/prisma.js";

export async function findSalesInRange(
  start: Date,
  end: Date,
) {
  return prisma.sale.findMany({
    where: {
      createdAt: {
        gte: start,
        lt: end,
      },
    },

    include: {
      recordedByUser: {
        select: {
          id: true,
          name: true,
        },
      },

      saleItems: {
        orderBy: {
          id: "asc",
        },

        include: {
          product: {
            select: {
              id: true,
              sku: true,
              name: true,
            },
          },
        },
      },
    },

    orderBy: [
      {
        createdAt: "asc",
      },
      {
        id: "asc",
      },
    ],
  });
}