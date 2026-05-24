import { cn } from "@/lib/utils";
import type { TextareaHTMLAttributes } from "react";

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn("min-h-24 w-full rounded-md border bg-white px-3 py-2 text-sm outline-none ring-offset-2 focus:ring-2 focus:ring-slate-900", className)} {...props} />;
}

