import { prisma } from "@/lib/prisma";

export async function logAuditEvent(input: { entity: string; action: string; payload?: unknown }) {
  return prisma.auditLog.create({
    data: {
      entity: input.entity,
      action: input.action,
      payload: input.payload as never
    }
  });
}

export async function getAuditLogs(filters?: { search?: string; entity?: string; action?: string; limit?: number }) {
  const search = filters?.search?.trim();
  return prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: filters?.limit ?? 50,
    where: {
      ...(filters?.entity ? { entity: { contains: filters.entity, mode: "insensitive" } } : {}),
      ...(filters?.action ? { action: { contains: filters.action, mode: "insensitive" } } : {}),
      ...(search
        ? {
            OR: [
              { entity: { contains: search, mode: "insensitive" } },
              { action: { contains: search, mode: "insensitive" } }
            ]
          }
        : {})
    }
  });
}
