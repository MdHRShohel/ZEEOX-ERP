import { requireSession, getPermissions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await requireSession();
  if (!getPermissions(session.role).canManageSettings) redirect("/403");

  const links = [
    { href: "/settings/uom", label: "Units of Measure", desc: "Define quantity units (pcs, kg, m, etc.)" },
    { href: "/settings/warehouses", label: "Warehouses", desc: "Manage storage locations" },
    { href: "/users", label: "Users", desc: "Manage user accounts and roles" },
  ];

  return (
    <AppShell>
      <div className="p-6">
        <PageHeader title="Settings" description="System configuration" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {links.map((l) => (
            <Link key={l.href} href={l.href}>
              <Card className="hover:border-slate-400 transition-colors cursor-pointer h-full">
                <CardHeader>
                  <CardTitle className="text-base">{l.label}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-500">{l.desc}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
