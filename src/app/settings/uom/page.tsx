import { requireSession, getPermissions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Table, Thead, Tbody, Tr, Th, Td } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { createUom, updateUom, deleteUom } from "./actions";

export const dynamic = "force-dynamic";

export default async function UomPage() {
  const session = await requireSession();
  if (!getPermissions(session.role).canManageSettings) redirect("/403");

  const uoms = await prisma.unitOfMeasure.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { variants: true } } },
  });

  return (
    <AppShell>
      <div className="p-6">
        <PageHeader title="Units of Measure" description="Define measurement units for products" />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardContent className="pt-4">
              {uoms.length === 0 ? (
                <EmptyState title="No units yet" description="Add your first unit of measure below" />
              ) : (
                <Table>
                  <Thead>
                    <Tr>
                      <Th>Name</Th>
                      <Th>Abbreviation</Th>
                      <Th>Type</Th>
                      <Th>Products</Th>
                      <Th></Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {uoms.map((uom) => (
                      <Tr key={uom.id}>
                        <Td className="font-medium">{uom.name}</Td>
                        <Td><Badge>{uom.abbreviation}</Badge></Td>
                        <Td className="capitalize">{uom.type}</Td>
                        <Td>{uom._count.variants}</Td>
                        <Td>
                          <form action={deleteUom} className="inline">
                            <input type="hidden" name="id" value={uom.id} />
                            <Button type="submit" variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                              Delete
                            </Button>
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
              <p className="text-sm font-semibold text-slate-700 mb-3">Add Unit of Measure</p>
              <form action={createUom} className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-slate-600">Name</label>
                  <input name="name" required placeholder="e.g. Piece" className="mt-1 flex h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900" />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600">Abbreviation</label>
                  <input name="abbreviation" required placeholder="e.g. pcs" maxLength={10} className="mt-1 flex h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900" />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600">Type</label>
                  <select name="type" className="mt-1 flex h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900">
                    <option value="count">Count</option>
                    <option value="weight">Weight</option>
                    <option value="length">Length</option>
                    <option value="volume">Volume</option>
                  </select>
                </div>
                <Button type="submit" className="w-full">Add Unit</Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
