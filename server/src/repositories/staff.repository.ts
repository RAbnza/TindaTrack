import {
  UserRole,
} from "../../generated/prisma/client.js";

import {
  prisma,
} from "../db/prisma.js";

export type CreateStaffRecordInput = {
  name: string;
  email: string;
  passwordHash: string;
};

export type UpdateStaffRecordInput = {
  name?: string;
  email?: string;
  active?: boolean;
};

const staffSelect = {
  id: true,
  name: true,
  email: true,
  active: true,
  createdAt: true,
} as const;

export function listStaffRecords() {
  return prisma.user.findMany({
    where: {
      role: UserRole.STAFF,
    },

    select: staffSelect,

    orderBy: [
      {
        name: "asc",
      },
      {
        id: "asc",
      },
    ],
  });
}

export function findStaffById(
  staffId: number,
) {
  return prisma.user.findFirst({
    where: {
      id: staffId,
      role: UserRole.STAFF,
    },

    select: {
      id: true,
    },
  });
}

export function createStaffRecord(
  input: CreateStaffRecordInput,
) {
  return prisma.user.create({
    data: {
      name: input.name,
      email: input.email,

      passwordHash:
        input.passwordHash,

      /*
       * These are authorization decisions,
       * so they never come from HTTP input.
       */
      role: UserRole.STAFF,
      active: true,
    },

    select: staffSelect,
  });
}

export function updateStaffRecord(
  staffId: number,
  input: UpdateStaffRecordInput,
) {
  return prisma.user.update({
    where: {
      id: staffId,
    },

    data: {
      ...(input.name !== undefined
        ? {
            name: input.name,
          }
        : {}),

      ...(input.email !== undefined
        ? {
            email: input.email,
          }
        : {}),

      ...(input.active !== undefined
        ? {
            active: input.active,
          }
        : {}),
    },

    select: staffSelect,
  });
}