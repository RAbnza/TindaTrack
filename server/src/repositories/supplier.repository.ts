import { prisma } from "../db/prisma.js";

export function listActiveSuppliers() {
  return prisma.supplier.findMany({
    where: {
      active: true,
    },

    select: {
      id: true,
      name: true,
    },

    orderBy: {
      name: "asc",
    },
  });
}