import {
  Prisma,
} from "../../generated/prisma/client.js";

import {
  prisma,
} from "../db/prisma.js";

export type CreateSupplierRecordInput = {
  name: string;
  contactDetails?: string | null;
};

export type UpdateSupplierRecordInput = {
  name?: string;
  contactDetails?: string | null;
  active?: boolean;
};

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

export function listAllSuppliers() {
  return prisma.supplier.findMany({
    select: {
      id: true,
      name: true,
      contactDetails: true,
      active: true,
    },

    orderBy: {
      name: "asc",
    },
  });
}

export function createSupplierRecord(
  input: CreateSupplierRecordInput,
) {
  return prisma.supplier.create({
    data: {
      name: input.name,
      contactDetails:
        input.contactDetails ?? null,

      active: true,
    },

    select: {
      id: true,
      name: true,
      contactDetails: true,
      active: true,
    },
  });
}

export function updateSupplierRecord(
  supplierId: number,
  input: UpdateSupplierRecordInput,
) {
  return prisma.supplier.update({
    where: {
      id: supplierId,
    },

    data: {
      ...(input.name !== undefined
        ? {
            name: input.name,
          }
        : {}),

      ...(input.contactDetails !==
      undefined
        ? {
            contactDetails:
              input.contactDetails,
          }
        : {}),

      ...(input.active !== undefined
        ? {
            active: input.active,
          }
        : {}),
    },

    select: {
      id: true,
      name: true,
      contactDetails: true,
      active: true,
    },
  });
}

export function isSupplierRecordNotFoundError(
  error: unknown,
): boolean {
  return (
    error instanceof
      Prisma.PrismaClientKnownRequestError &&
    error.code === "P2025"
  );
}