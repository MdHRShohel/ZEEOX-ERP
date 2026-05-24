import Link from "next/link";
import { cn } from "@/lib/utils";

export type SectionTab = {
  label: string;
  href: string;
  active?: boolean;
};

export function SectionTabs({ tabs }: { tabs: SectionTab[] }) {
  return (
    <div className="flex flex-wrap gap-2 rounded-2xl border bg-white p-2 print:hidden">
      {tabs.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          className={cn(
            "rounded-xl px-3 py-2 text-sm font-medium transition",
            tab.active ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
          )}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  );
}
