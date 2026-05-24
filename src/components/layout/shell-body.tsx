"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { NavLinks, type NavItem } from "@/components/layout/nav-links";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";
import { Menu, X } from "lucide-react";

type AuditEntry = {
  id: string;
  entity: string;
  action: string;
  createdAt: string;
};

export function ShellBody({
  user,
  navItems,
  recentAudit,
  onLogout,
  children
}: {
  user: { displayName?: string | null; username?: string | null; role?: string | null };
  navItems: NavItem[];
  recentAudit: AuditEntry[];
  onLogout: () => Promise<void>;
  children: ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const pathname = usePathname();
  const currentModule = navItems.find((item) => pathname === item.href || pathname?.startsWith(`${item.href}/`))?.label ?? "Modules";
  const accessLabel = user.role === "admin" || user.role === "staff" ? "Manage access" : "Read only";

  useEffect(() => {
    const stored = window.localStorage.getItem("zeeox-sidebar-open");
    if (stored !== null) {
      setSidebarOpen(stored === "true");
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem("zeeox-sidebar-open", String(sidebarOpen));
  }, [sidebarOpen]);

  return (
    <>
      <div className="mx-auto max-w-7xl px-6 py-6">
        <div className="mb-4 flex items-center gap-3 print:hidden">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => setSidebarOpen((current) => !current)}
            aria-pressed={sidebarOpen}
            aria-label={sidebarOpen ? "Hide sidebar" : "Show sidebar"}
            className="h-10 shrink-0 rounded-full px-4 shadow-sm"
          >
            {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            <span className="ml-2">{sidebarOpen ? "Hide modules" : "Open modules"}</span>
          </Button>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Navigation</p>
            <p className="text-sm font-medium text-slate-900">{currentModule}</p>
            <p className="text-xs text-slate-500">Use the sidebar to switch modules and the page toolbar to export.</p>
          </div>
        </div>

        <div className={cn("grid gap-6", sidebarOpen ? "lg:grid-cols-[280px_1fr]" : "lg:grid-cols-1")}>
          {sidebarOpen ? (
            <aside className="sticky top-6 h-fit rounded-2xl border bg-white p-4 shadow-sm print:hidden">
              <div className="mb-4 rounded-xl bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Signed in as</p>
                <p className="mt-1 font-medium">{user.displayName ?? user.username ?? "Guest"}</p>
                <p className="text-sm text-slate-500">{user.role ?? "guest"}</p>
                <div className="mt-3">
                  <Badge className="bg-white text-slate-700">{accessLabel}</Badge>
                </div>
                <form action={onLogout} className="mt-3">
                  <Button type="submit" variant="secondary" size="sm" className="w-full">
                    Logout
                  </Button>
                </form>
              </div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Modules</p>
              <NavLinks items={navItems} />
            </aside>
          ) : null}

          <main className={cn("space-y-6", !sidebarOpen && "min-w-0")}>{children}</main>
        </div>
      </div>

      {recentAudit.length ? (
        <div className="mx-auto max-w-7xl px-6 pb-8 print:hidden">
          <details className="rounded-2xl border bg-white shadow-sm">
            <summary className="cursor-pointer list-none px-6 py-4 text-sm font-medium text-slate-900">
              Recent activity
            </summary>
            <div className="grid gap-3 border-t p-6 md:grid-cols-3">
              {recentAudit.map((entry) => (
                <div key={entry.id} className="rounded-xl bg-slate-50 p-4 text-sm">
                  <p className="font-medium">{entry.entity}</p>
                  <p className="text-slate-600">{entry.action}</p>
                  <p className="text-xs text-slate-500">{new Date(entry.createdAt).toLocaleString()}</p>
                </div>
              ))}
            </div>
          </details>
        </div>
      ) : null}
    </>
  );
}
