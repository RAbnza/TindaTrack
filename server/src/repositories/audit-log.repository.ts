import { Prisma } from "../../generated/prisma/client.js";

import { prisma } from "../db/prisma.js";

type DbClient = Prisma.TransactionClient;

type CreateAuditLogInput = {
  actorId: number;
  action: string;
  entityType: string;
  entityId: number;
  metadata?: Prisma.InputJsonValue;
};

export function createAuditLog(
  db: DbClient,
  input: CreateAuditLogInput,
) {
  return db.auditLog.create({
    data: {
      actorId: input.actorId,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,

      ...(input.metadata !== undefined
        ? {
            metadata: input.metadata,
          }
        : {}),
    },
  });
}

export function listAuditLogs() {
  return prisma.auditLog.findMany({
    select: {
      id: true,
      action: true,
      entityType: true,
      entityId: true,
      metadata: true,
      createdAt: true,

      actor: {
        select: {
          id: true,
          name: true,
          role: true,
        },
      },
    },

    orderBy: [
      {
        createdAt: "desc",
      },
      {
        id: "desc",
      },
    ],
  });
}