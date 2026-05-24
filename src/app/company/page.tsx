import { ModulePage } from "@/components/layout/module-page";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createCompany, createInvestor, deleteCompany, deleteInvestor, updateCompany, updateInvestor } from "@/app/company/actions";
import { getCompanyOverview, hasDatabase } from "@/server/services/company-service";
import { getPermissions, getSessionUser } from "@/lib/auth";
import Link from "next/link";
import type { ReactNode } from "react";

export const dynamic = "force-dynamic";

function FormSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

export default async function CompanyPage({
  searchParams
}: {
  searchParams?: { q?: string };
}) {
  const user = await getSessionUser();
  const permissions = getPermissions(user?.role ?? "viewer");
  const search = String(searchParams?.q ?? "");
  const overview = await getCompanyOverview({ search });

  return (
    <ModulePage
      title="Company & Investors"
      description="Track the business entity, investor contributions, ownership percentages, and profit-share rules."
      sections={[
        { label: "Overview", href: "#overview" },
        { label: "Manage", href: "#manage" },
        { label: "Investors", href: "#investors" }
      ]}
      stats={[
        { label: "Companies", value: overview.companyCount, help: "Configured entities" },
        { label: "Investors", value: overview.investorCount, help: "Configured shareholders" },
        { label: "Ownership", value: `${overview.ownershipTotal.toFixed(2)}%`, help: "Should reconcile to 100%" },
        { label: "Profit Share", value: `${overview.profitShareTotal.toFixed(2)}%`, help: "Should reconcile to 100%" }
      ]}
      items={[
        { title: "Investor profile", detail: "Name, investment amount, ownership percent, and notes." },
        { title: "Share validation", detail: "Prevent invalid ownership or profit-share totals." },
        { title: "Distribution report", detail: "Summarize profit share for each investor." }
      ]}
    >
      <Card id="overview">
        <CardContent className="flex flex-col gap-3 p-5 md:flex-row md:items-end md:justify-between">
          <form className="flex flex-1 flex-col gap-3 md:flex-row" action="/company" method="get">
            <div className="space-y-2 md:flex-1">
              <Label htmlFor="q">Search companies or investors</Label>
              <Input id="q" name="q" defaultValue={search} placeholder="Company name, investor, notes" />
            </div>
            <Button type="submit">Search</Button>
            {search ? (
              <Link href="/company" className="inline-flex items-center justify-center rounded-md bg-slate-100 px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-200">
                Reset
              </Link>
            ) : null}
          </form>
          <div className="text-sm text-slate-500">{overview.companyCount} companies</div>
        </CardContent>
      </Card>

      {!hasDatabase() ? (
        <Card>
          <CardContent className="p-5">
            <p className="text-sm font-medium text-slate-900">DATABASE_URL not configured</p>
            <p className="mt-1 text-sm text-slate-600">Add a PostgreSQL connection string to enable real CRUD for companies and investors.</p>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-2" id="manage">
        {permissions.canManageCompany ? (
          <>
            <FormSection title="Create company">
              <form action={createCompany} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Company name</Label>
                  <Input id="name" name="name" placeholder="ZEEOX Leather Business" required />
                </div>
                <Button type="submit">Save company</Button>
              </form>
            </FormSection>

            <FormSection title="Create investor">
              <form action={createInvestor} className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="companyId">Company ID</Label>
                  <Input id="companyId" name="companyId" placeholder="paste company id" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Investor name</Label>
                  <Input id="name" name="name" placeholder="Md Rabiul Islam" required />
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="investmentAmount">Investment</Label>
                    <Input id="investmentAmount" name="investmentAmount" type="number" step="0.01" min="0" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ownershipPercent">Ownership %</Label>
                    <Input id="ownershipPercent" name="ownershipPercent" type="number" step="0.01" min="0" max="100" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="profitSharePercent">Profit share %</Label>
                    <Input id="profitSharePercent" name="profitSharePercent" type="number" step="0.01" min="0" max="100" required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea id="notes" name="notes" placeholder="Optional remarks" />
                </div>
                <Button type="submit">Save investor</Button>
              </form>
            </FormSection>
          </>
        ) : (
          <Card>
            <CardContent className="p-5 text-sm text-slate-600">You have read-only access to company records.</CardContent>
          </Card>
        )}
      </div>

      <Card id="investors">
        <CardHeader>
          <CardTitle>Companies and investors</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {overview.companies.length === 0 ? (
            <p className="text-sm text-slate-600">No companies configured yet.</p>
          ) : (
            overview.companies.map((company) => (
              <div key={company.id} className="rounded-xl border bg-slate-50 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-semibold">{company.name}</p>
                    <p className="text-xs text-slate-500">ID: {company.id}</p>
                  </div>
                    <div className="flex items-center gap-2">
                      <Badge>{company.investors.length} investors</Badge>
                      <Link href={`/company/${company.id}`} className="inline-flex items-center justify-center rounded-md bg-slate-100 px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-200">
                        Details
                      </Link>
                      {permissions.canManageCompany ? (
                        <form action={deleteCompany}>
                          <input type="hidden" name="id" value={company.id} />
                          <Button type="submit" variant="secondary">Delete</Button>
                        </form>
                      ) : null}
                    </div>
                  </div>
                {permissions.canManageCompany ? (
                  <form action={updateCompany} className="mt-4 flex gap-2">
                    <input type="hidden" name="id" value={company.id} />
                    <Input name="name" defaultValue={company.name} className="max-w-sm" />
                    <Button type="submit">Update company</Button>
                  </form>
                ) : null}
                <div className="mt-4 grid gap-3">
                  {company.investors.map((investor) => (
                    <div key={investor.id} className="rounded-lg bg-white p-4 text-sm">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="grid gap-2">
                          <p className="font-medium">{investor.name}</p>
                          <p className="text-slate-500">{Number(investor.investmentAmount).toLocaleString("en-US")}</p>
                          <p className="text-slate-600">
                            Ownership {Number(investor.ownershipPercent).toFixed(2)}% · Profit share {Number(investor.profitSharePercent).toFixed(2)}%
                          </p>
                          {investor.notes ? <p className="text-slate-500">{investor.notes}</p> : null}
                        </div>
                        <form action={deleteInvestor}>
                          <input type="hidden" name="id" value={investor.id} />
                          <Button type="submit" variant="secondary">Delete</Button>
                        </form>
                      </div>
                      <form action={updateInvestor} className="mt-4 grid gap-2 md:grid-cols-5">
                        <input type="hidden" name="id" value={investor.id} />
                        <input type="hidden" name="companyId" value={company.id} />
                        <Input name="name" defaultValue={investor.name} />
                        <Input name="investmentAmount" type="number" step="0.01" min="0" defaultValue={Number(investor.investmentAmount)} />
                        <Input name="ownershipPercent" type="number" step="0.01" min="0" max="100" defaultValue={Number(investor.ownershipPercent)} />
                        <Input name="profitSharePercent" type="number" step="0.01" min="0" max="100" defaultValue={Number(investor.profitSharePercent)} />
                        <Input name="notes" defaultValue={investor.notes ?? ""} placeholder="Notes" />
                        <Button type="submit" className="md:col-span-5">Update investor</Button>
                      </form>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </ModulePage>
  );
}
