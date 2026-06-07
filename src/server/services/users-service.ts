import { prisma } from "@/lib/prisma";

export async function getUsersOverview() {
  const users = await prisma.user.findMany({ orderBy: { createdAt: "asc" } });
  const byRole = users.reduce(
    (acc, u) => {
      acc[u.role] = (acc[u.role] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );
  return { users, total: users.length, byRole };
}
