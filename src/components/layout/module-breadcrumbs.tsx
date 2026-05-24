"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const rootLabels: Record<string, string> = {
  dashboard: "Dashboard",
  company: "Company",
  inventory: "Inventory",
  production: "Production",
  sales: "Sales",
  courier: "Courier",
  expenses: "Expenses",
  reports: "Reports",
  audit: "Audit",
  users: "Users"
};

function humanize(segment: string) {
  if (/^[0-9a-f-]{6,}$/i.test(segment)) return "Details";
  if (segment === "invoice") return "Invoice";
  if (segment === "pdf") return "PDF";
  return segment.replace(/-/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

export function ModuleBreadcrumbs({ title }: { title: string }) {
  const pathname = usePathname();
  const segments = (pathname ?? "/").split("/").filter(Boolean);
  const root = segments[0] ? rootLabels[segments[0]] ?? humanize(segments[0]) : title;
  const current = segments.length > 1 && title && title !== root ? title : "";

  const rootHref = segments[0] ? `/${segments[0]}` : "/";
  const hasCurrent = Boolean(current);

  return (
    <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
      <Link href={rootHref} className="font-medium text-slate-700 hover:text-slate-950">
        {root}
      </Link>
      {hasCurrent ? <span>/</span> : null}
      {hasCurrent ? <span className="text-slate-500">{current}</span> : null}
    </nav>
  );
}
