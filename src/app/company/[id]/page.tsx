import { ModulePage } from "@/components/layout/module-page";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

export default async function CompanyDetailPage({ params }: { params: { id: string } }) {
  const company = await prisma.company.findUnique({
    where: { id: params.id },
    include: {
      investors: { orderBy: { createdAt: "asc" } }
    }
  });

  if (!company) notFound();

  return (
    <ModulePage title={company.name} description="Company and investor detail view.">
      <Card>
        <CardHeader>
          <CardTitle>Investors</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3">
          {company.investors.map((investor) => (
            <div key={investor.id} className="rounded-xl border bg-slate-50 p-4 text-sm">
              <p className="font-medium">{investor.name}</p>
              <p className="text-slate-600">{Number(investor.investmentAmount).toLocaleString("en-US")}</p>
              <p className="text-slate-600">{Number(investor.ownershipPercent).toFixed(2)}% ownership · {Number(investor.profitSharePercent).toFixed(2)}% share</p>
              {investor.notes ? <p className="mt-1 text-slate-500">{investor.notes}</p> : null}
            </div>
          ))}
        </CardContent>
      </Card>
    </ModulePage>
  );
}
