import { ModulePage } from "@/components/layout/module-page";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getPermissions, getSessionUser } from "@/lib/auth";
import { uploadAttachment } from "@/app/attachments/actions";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

export default async function ExpenseDetailPage({ params }: { params: { id: string } }) {
  const user = await getSessionUser();
  const permissions = getPermissions(user?.role ?? "viewer");
  const expense = await prisma.officeExpense.findUnique({
    where: { id: params.id }
  });

  if (!expense) notFound();
  const attachments = await prisma.attachment.findMany({
    where: { entityType: "officeExpense", entityId: expense.id },
    orderBy: { createdAt: "desc" }
  });

  return (
    <ModulePage title={expense.category} description="Office expense detail view.">
      <Card>
        <CardHeader>
          <CardTitle>Expense summary</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm">
          <p>Date: {expense.expenseDate.toLocaleDateString()}</p>
          <p>Description: {expense.description}</p>
          <p>Amount: {Number(expense.amount).toLocaleString("en-US")}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Attachments</CardTitle></CardHeader>
        <CardContent className="grid gap-3">
          {attachments.length === 0 ? <p className="text-sm text-slate-600">No attachments yet.</p> : attachments.map((attachment) => (
            <a key={attachment.id} href={attachment.fileUrl} className="rounded-xl border bg-slate-50 p-4 text-sm hover:bg-slate-100" target="_blank" rel="noreferrer">
              {attachment.originalName}
            </a>
          ))}
          {permissions.canManageOperations ? (
            <form action={uploadAttachment} encType="multipart/form-data" className="grid gap-3 border-t pt-4">
              <input type="hidden" name="entityType" value="officeExpense" />
              <input type="hidden" name="entityId" value={expense.id} />
              <div className="space-y-2">
                <Label htmlFor="file">Upload receipt</Label>
                <Input id="file" name="file" type="file" />
              </div>
              <Button type="submit">Upload</Button>
            </form>
          ) : null}
        </CardContent>
      </Card>
    </ModulePage>
  );
}
