import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { AppShell } from "@/components/layout/app-shell";
import { ModuleBreadcrumbs } from "@/components/layout/module-breadcrumbs";
import { PageToolbar } from "@/components/layout/page-toolbar";
import { SectionTabs, type SectionTab } from "@/components/layout/section-tabs";
import type { ReactNode } from "react";

type Stat = { label: string; value: string | number; help?: string };
type Item = { title: string; detail: string; tag?: string };

export function ModulePage({
  title,
  description,
  stats,
  items,
  sections,
  toolbar,
  children
}: {
  title: string;
  description: string;
  stats?: Stat[];
  items?: Item[];
  sections?: SectionTab[];
  toolbar?: ReactNode | null;
  children?: ReactNode;
}) {
  return (
    <AppShell>
      <section className="rounded-2xl border bg-white p-6 print:border-0 print:p-0">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <ModuleBreadcrumbs title={title} />
            <h2 className="mt-1 text-2xl font-semibold">{title}</h2>
            <p className="mt-2 max-w-3xl text-sm text-slate-600">{description}</p>
          </div>
          {toolbar === null ? null : toolbar ?? <PageToolbar />}
        </div>
        {sections?.length ? (
          <div className="mt-6">
            <SectionTabs tabs={sections} />
          </div>
        ) : null}
      </section>

      {stats?.length ? (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4 print:grid-cols-2">
          {stats.map((stat) => (
            <Card key={stat.label}>
              <CardContent className="p-5">
                <p className="text-sm text-slate-500">{stat.label}</p>
                <p className="mt-2 text-2xl font-semibold">{stat.value}</p>
                {stat.help ? <p className="mt-1 text-xs text-slate-500">{stat.help}</p> : null}
              </CardContent>
            </Card>
          ))}
        </section>
      ) : null}

      {items?.length ? (
        <details className="rounded-2xl border bg-white">
          <summary className="cursor-pointer list-none px-5 py-4 text-sm font-medium text-slate-900">
            Page notes
          </summary>
          <div className="grid gap-3 border-t p-5 md:grid-cols-2 xl:grid-cols-3">
            {items.map((item) => (
              <div key={item.title} className="rounded-xl bg-slate-50 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{item.title}</p>
                    <p className="mt-1 text-sm text-slate-600">{item.detail}</p>
                  </div>
                  {item.tag ? <Badge>{item.tag}</Badge> : null}
                </div>
              </div>
            ))}
          </div>
        </details>
      ) : null}

      {children}
    </AppShell>
  );
}
