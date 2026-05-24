import { logoutAction } from "@/app/login/actions";
import { getSessionUser, getVisibleNavItems } from "@/lib/auth";
import { getAuditLogs } from "@/server/services/audit-service";
import { ShellBody } from "@/components/layout/shell-body";
import type { ReactNode } from "react";

export async function AppShell({ children }: { children: ReactNode }) {
  const user = await getSessionUser();
  const navItems = getVisibleNavItems(user?.role ?? "viewer");
  const recentAudit =
    user?.role === "admin"
      ? (await getAuditLogs({ limit: 3 })).map((entry) => ({
          id: entry.id,
          entity: entry.entity,
          action: entry.action,
          createdAt: entry.createdAt.toISOString()
        }))
      : []; 

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <ShellBody
        user={{
          displayName: user?.displayName ?? null,
          username: user?.username ?? null,
          role: user?.role ?? null
        }}
        navItems={navItems}
        recentAudit={recentAudit}
        onLogout={logoutAction}
        >
        {children}
      </ShellBody>
    </div>
  );
}
