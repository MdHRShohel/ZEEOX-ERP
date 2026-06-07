"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { getNavItems, AuthRole } from "@/lib/auth-edge";
import { cn } from "@/lib/utils";

interface SidebarProps {
  role: AuthRole;
  displayName: string;
}

export function Sidebar({ role, displayName }: SidebarProps) {
  const pathname = usePathname();
  const groups = getNavItems(role);

  return (
    <aside className="flex flex-col w-60 min-h-screen bg-slate-900 text-white shrink-0">
      <div className="px-4 py-5 border-b border-slate-800">
        <p className="text-base font-bold tracking-tight">ZEEOX ERP</p>
        <p className="text-xs text-slate-400 mt-0.5 truncate">{displayName}</p>
      </div>
      <nav className="flex-1 overflow-y-auto py-4">
        {groups.map((group) => (
          <div key={group.group} className="mb-5">
            <p className="px-4 mb-1 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {group.group}
            </p>
            {group.items.map((item) => {
              const active = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2.5 px-4 py-2 text-sm transition-colors",
                    active
                      ? "bg-slate-800 text-white font-medium"
                      : "text-slate-400 hover:text-white hover:bg-slate-800"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>
      <div className="px-4 py-3 border-t border-slate-800">
        <Link
          href="/logout"
          className="text-xs text-slate-400 hover:text-white transition-colors"
        >
          Sign out
        </Link>
      </div>
    </aside>
  );
}
