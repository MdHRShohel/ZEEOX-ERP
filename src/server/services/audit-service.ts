import { prisma } from "@/lib/prisma";

export async function getAuditLogs(filters?: {
  entityType?: string;
  from?: string;
  to?: string;
  page?: number;
}) {
  const { entityType, from, to, page = 1 } = filters ?? {};
  const take = 50;
  const skip = (page - 1) * take;

  const where = {
    ...(entityType ? { entityType } : {}),
    ...(from || to
      ? {
          createdAt: {
            ...(from ? { gte: new Date(from) } : {}),
            ...(to ? { lte: new Date(to) } : {}),
          },
        }
      : {}),
  };

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take,
      skip,
    }),
    prisma.auditLog.count({ where }),
  ]);

  return { logs, total, page, pages: Math.ceil(total / take) };
}
