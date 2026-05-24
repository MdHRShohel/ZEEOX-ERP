import { createOfficeExpense, deleteOfficeExpense, updateOfficeExpense } from "@/app/expenses/actions";
import { ModulePage } from "@/components/layout/module-page";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getExpenseOverview, hasOperationsDatabase } from "@/server/services/operations-service";
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

export default async function ExpensesPage({
  searchParams
}: {
  searchParams?: { q?: string; category?: string };
}) {
  const user = await getSessionUser();
  const permissions = getPermissions(user?.role ?? "viewer");
  const search = String(searchParams?.q ?? "");
  const category = String(searchParams?.category ?? "");
  const overview = await getExpenseOverview({ search, category });

  return (
    <ModulePage
      title="Office Expenses"
      description="Track operational costs separately from product production cost."
      stats={[
        { label: "Entries", value: overview.expenseCount, help: "Expense records" },
        { label: "Total Amount", value: overview.totalAmount.toLocaleString("en-US"), help: "Operating spend" },
        { label: "Categories", value: "Ready", help: "Expense breakdown" }
      ]}
      items={[
        { title: "Expense log", detail: "Date, category, description, and amount." },
        { title: "Dashboard impact", detail: "Roll up into KPI summaries without affecting COGS." },
        { title: "Future attachments", detail: "Ready for receipts and supporting files." }
      ]}
    >
      <Card>
        <CardContent className="flex flex-col gap-3 p-5 md:flex-row md:items-end md:justify-between">
          <form className="grid flex-1 gap-3 md:grid-cols-[1fr_180px_auto_auto]" action="/expenses" method="get">
            <div className="space-y-2">
              <Label htmlFor="q">Search expenses</Label>
              <Input id="q" name="q" defaultValue={search} placeholder="Category, description" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Input id="category" name="category" defaultValue={category} placeholder="Rent, salary, utility" />
            </div>
            <Button type="submit">Search</Button>
            {search || category ? (
              <Link href="/expenses" className="inline-flex items-center justify-center rounded-md bg-slate-100 px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-200">
                Reset
              </Link>
            ) : null}
          </form>
          <div className="text-sm text-slate-500">{overview.expenseCount} expenses</div>
        </CardContent>
      </Card>

      {!hasOperationsDatabase() ? (
        <Card>
          <CardContent className="p-5">
            <p className="text-sm font-medium text-slate-900">DATABASE_URL not configured</p>
            <p className="mt-1 text-sm text-slate-600">Add a PostgreSQL connection string to enable expense CRUD and reporting.</p>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-2">
        {permissions.canManageOperations ? (
          <FormSection title="Create office expense">
            <form action={createOfficeExpense} className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="expenseDate">Expense date</Label>
              <Input id="expenseDate" name="expenseDate" type="date" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Input id="category" name="category" placeholder="Rent / Salary / Utility" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input id="description" name="description" placeholder="Office rent for May" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <Input id="amount" name="amount" type="number" min="0" step="0.01" required />
            </div>
              <Button type="submit">Save expense</Button>
            </form>
          </FormSection>
        ) : (
          <Card>
            <CardContent className="p-5 text-sm text-slate-600">You have read-only access to expense records.</CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Expense entries</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {overview.expenses.length === 0 ? (
              <p className="text-sm text-slate-600">No expense entries configured yet.</p>
            ) : (
                overview.expenses.slice(0, 6).map((expense) => (
                  <div key={expense.id} className="rounded-xl border bg-slate-50 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium">{expense.category}</p>
                        <p className="text-sm text-slate-600">{expense.description}</p>
                      </div>
                      <Badge>{Number(expense.amount).toLocaleString("en-US")}</Badge>
                    </div>
                    <div className="mt-4 flex justify-end">
                      <Link href={`/expenses/${expense.id}`} className="inline-flex items-center justify-center rounded-md bg-slate-100 px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-200">
                        Details
                      </Link>
                    </div>
                    {permissions.canManageOperations ? (
                    <form action={updateOfficeExpense} className="mt-4 grid gap-3 border-t pt-4">
                      <input type="hidden" name="id" value={expense.id} />
                      <div className="space-y-2">
                        <Label htmlFor={`expenseDate-${expense.id}`}>Expense date</Label>
                        <Input id={`expenseDate-${expense.id}`} name="expenseDate" type="date" defaultValue={expense.expenseDate.toISOString().slice(0, 10)} required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`category-${expense.id}`}>Category</Label>
                        <Input id={`category-${expense.id}`} name="category" defaultValue={expense.category} required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`description-${expense.id}`}>Description</Label>
                        <Input id={`description-${expense.id}`} name="description" defaultValue={expense.description} required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`amount-${expense.id}`}>Amount</Label>
                        <Input id={`amount-${expense.id}`} name="amount" type="number" min="0" step="0.01" defaultValue={expense.amount.toString()} required />
                      </div>
                      <div className="flex gap-2">
                        <Button type="submit" size="sm">Update</Button>
                        <Button type="submit" formAction={deleteOfficeExpense} variant="destructive" size="sm">Delete</Button>
                      </div>
                    </form>
                    ) : null}
                  </div>
                ))
            )}
          </CardContent>
        </Card>
      </div>
    </ModulePage>
  );
}
