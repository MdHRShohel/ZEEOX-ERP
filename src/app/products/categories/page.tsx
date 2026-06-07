import { requireSession, getPermissions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Table, Thead, Tbody, Tr, Th, Td } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { getCategoriesWithCount } from "@/server/services/product-service";
import { createCategory, deleteCategory } from "../actions";

export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
  const session = await requireSession();
  if (!getPermissions(session.role).canManageProducts) redirect("/403");

  const categories = await getCategoriesWithCount();

  return (
    <AppShell>
      <div className="p-6">
        <div className="mb-4">
          <Link href="/products" className="text-sm text-slate-500 hover:text-slate-700">← Products</Link>
        </div>
        <PageHeader title="Product Categories" />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardContent className="pt-4">
              {categories.length === 0 ? (
                <EmptyState title="No categories yet" description="Add your first category" />
              ) : (
                <Table>
                  <Thead>
                    <Tr><Th>Name</Th><Th>Description</Th><Th>Products</Th><Th></Th></Tr>
                  </Thead>
                  <Tbody>
                    {categories.map((c) => (
                      <Tr key={c.id}>
                        <Td className="font-medium">{c.name}</Td>
                        <Td>{c.description ?? "—"}</Td>
                        <Td>{c._count.variants}</Td>
                        <Td>
                          <form action={deleteCategory} className="inline">
                            <input type="hidden" name="id" value={c.id} />
                            <Button type="submit" variant="ghost" size="sm" className="text-red-600">Delete</Button>
                          </form>
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <p className="text-sm font-semibold text-slate-700 mb-3">Add Category</p>
              <form action={createCategory} className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-slate-600">Name *</label>
                  <input name="name" required placeholder="e.g. Electronics" className="mt-1 flex h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900" />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600">Description</label>
                  <input name="description" placeholder="Optional description" className="mt-1 flex h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900" />
                </div>
                <Button type="submit" className="w-full">Add Category</Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
