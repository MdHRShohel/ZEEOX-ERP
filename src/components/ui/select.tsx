import { cn } from "@/lib/utils";
import type { SelectHTMLAttributes } from "react";

export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cn("h-10 w-full rounded-md border bg-white px-3 text-sm outline-none ring-offset-2 focus:ring-2 focus:ring-slate-900", className)} {...props} />;
}

