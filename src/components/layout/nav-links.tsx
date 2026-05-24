"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export type NavItem = {
  label: string;
  href: string;
  group?: string;
  description?: string;
};

export function NavLinks({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  const grouped = items.reduce<Record<string, NavItem[]>>((acc, item) => {
    const key = item.group ?? "Other";
    (acc[key] ??= []).push(item);
    return acc;
  }, {});
  const groups = Object.entries(grouped);

  return (
    <nav className="space-y-4">
      {groups.map(([group, groupItems]) => (
        <div key={group} className="space-y-1">
          <p className="px-3 text-xs font-semibold uppercase tracking-wide text-slate-400">{group}</p>
          <div className="space-y-1">
            {groupItems.map((item) => {
              const active = pathname === item.href || Boolean(pathname?.startsWith(`${item.href}/`));
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "block rounded-lg px-3 py-2 text-sm transition",
                    active ? "bg-slate-900 text-white" : "hover:bg-slate-100"
                  )}
                >
                  <span className="block font-medium">{item.label}</span>
                  {item.description ? (
                    <span className={cn("mt-0.5 hidden text-xs lg:block", active ? "text-slate-200" : "text-slate-500")}>
                      {item.description}
                    </span>
                  ) : null}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}
