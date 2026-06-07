import { prisma } from "./prisma";

interface AuditParams {
  entityType: string;
  entityId: string;
  action: "create" | "update" | "delete" | "post";
  actorId?: string;
  actorName?: string;
  snapshot?: object;
}

export async function logAudit(params: AuditParams): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        entityType: params.entityType,
        entityId: params.entityId,
        action: params.action,
        actorId: params.actorId,
        actorName: params.actorName,
        snapshot: params.snapshot ?? undefined,
      },
    });
  } catch {
    // Audit failures must never break the main operation
  }
}
