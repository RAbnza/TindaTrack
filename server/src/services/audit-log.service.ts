import { listAuditLogs } from "../repositories/audit-log.repository.js";

export async function getAuditLogHistory() {
  const logs =
    await listAuditLogs();

  return logs.map(
    (log) => ({
      id: log.id,

      actor: {
        id: log.actor.id,
        name: log.actor.name,
        role: log.actor.role,
      },

      action:
        log.action,

      entityType:
        log.entityType,

      entityId:
        log.entityId,

      metadata:
        log.metadata,

      createdAt:
        log.createdAt.toISOString(),
    }),
  );
}