import Link from "next/link";
import { cn } from "@/lib/utils";

interface PaginationBarProps {
  page: number;
  pages: number;
  total: number;
  buildHref: (page: number) => string;
}

export function PaginationBar({ page, pages, total, buildHref }: PaginationBarProps) {
  if (pages <= 1) return null;
  return (
    <div className="flex items-center justify-between mt-4 text-sm text-slate-600">
      <span>{total} result{total !== 1 ? "s" : ""}</span>
      <div className="flex items-center gap-1">
        <Link
          href={buildHref(page - 1)}
          className={cn(
            "px-3 py-1.5 rounded border text-sm",
            page <= 1 ? "pointer-events-none opacity-40 border-slate-200" : "border-slate-300 hover:bg-slate-50"
          )}
        >
          Prev
        </Link>
        <span className="px-3 py-1.5 text-slate-500">
          {page} / {pages}
        </span>
        <Link
          href={buildHref(page + 1)}
          className={cn(
            "px-3 py-1.5 rounded border text-sm",
            page >= pages ? "pointer-events-none opacity-40 border-slate-200" : "border-slate-300 hover:bg-slate-50"
          )}
        >
          Next
        </Link>
      </div>
    </div>
  );
}
