import {
  UserRole,
} from "../../generated/prisma/client.js";

import {
  prisma,
} from "../db/prisma.js";

export async function getOwnerSalesForRange(
  start: Date,
  end: Date,
) {
  const [
    count,
    aggregate,
  ] =
    await Promise.all([
      prisma.sale.count({
        where: {
          createdAt: {
            gte: start,
            lt: end,
          },
        },
      }),

      prisma.sale.aggregate({
        where: {
          createdAt: {
            gte: start,
            lt: end,
          },
        },

        _sum: {
          totalAmount: true,
        },
      }),
    ]);

  return {
    count,

    totalAmount:
      aggregate._sum
        .totalAmount,
  };
}

export function getStaffSalesCountForRange(
  staffId: number,
  start: Date,
  end: Date,
) {
  return prisma.sale.count({
    where: {
      recordedBy:
        staffId,

      createdAt: {
        gte: start,
        lt: end,
      },
    },
  });
}

export function countActiveStaff() {
  return prisma.user.count({
    where: {
      role:
        UserRole.STAFF,

      active: true,
    },
  });
}