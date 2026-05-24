import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export function hasDatabase() {
  return Boolean(process.env.DATABASE_URL);
}

export async function getCompanyOverview(filters?: { search?: string }) {
  if (!hasDatabase()) {
    return { companies: [], companyCount: 0, investorCount: 0, ownershipTotal: 0, profitShareTotal: 0 };
  }

  const search = filters?.search?.trim();
  const where: Prisma.CompanyWhereInput | undefined = search
    ? {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { investors: { some: { name: { contains: search, mode: "insensitive" } } } }
        ]
      }
    : undefined;

  const companies = await prisma.company.findMany({
    orderBy: { createdAt: "desc" },
    where,
    include: {
      investors: {
        orderBy: { createdAt: "asc" }
      }
    }
  });

  const investorCount = companies.reduce((sum, company) => sum + company.investors.length, 0);
  const ownershipTotal = companies.reduce((sum, company) => sum + company.investors.reduce((inner, investor) => inner + Number(investor.ownershipPercent), 0), 0);
  const profitShareTotal = companies.reduce((sum, company) => sum + company.investors.reduce((inner, investor) => inner + Number(investor.profitSharePercent), 0), 0);

  return {
    companies,
    companyCount: companies.length,
    investorCount,
    ownershipTotal,
    profitShareTotal
  };
}

export async function getCompanies() {
  if (!hasDatabase()) return [];
  return prisma.company.findMany({
    orderBy: { name: "asc" }
  });
}
