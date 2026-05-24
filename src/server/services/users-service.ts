import { prisma } from "@/lib/prisma";

export function hasUsersDatabase() {
  return Boolean(process.env.DATABASE_URL);
}

export async function getUsersOverview(filters?: { search?: string }) {
  if (!hasUsersDatabase()) {
    return { users: [], userCount: 0, activeCount: 0, adminCount: 0, staffCount: 0, viewerCount: 0 };
  }

  const search = filters?.search?.trim();
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    where: search
      ? {
          OR: [
            { username: { contains: search, mode: "insensitive" } },
            { displayName: { contains: search, mode: "insensitive" } },
            ...(search === "admin" ? [{ role: "admin" as const }] : []),
            ...(search === "staff" ? [{ role: "staff" as const }] : []),
            ...(search === "viewer" ? [{ role: "viewer" as const }] : [])
          ]
        }
      : undefined
  });

  return {
    users,
    userCount: users.length,
    activeCount: users.filter((user) => user.isActive).length,
    adminCount: users.filter((user) => user.role === "admin").length,
    staffCount: users.filter((user) => user.role === "staff").length,
    viewerCount: users.filter((user) => user.role === "viewer").length
  };
}
