import { cn } from "@/lib/utils";
import type { ComponentPropsWithoutRef } from "react";

export function Card({ className, ...props }: ComponentPropsWithoutRef<"div">) {
  return <div className={cn("rounded-2xl border bg-white", className)} {...props} />;
}

export function CardHeader({ className, ...props }: ComponentPropsWithoutRef<"div">) {
  return <div className={cn("border-b px-5 py-4", className)} {...props} />;
}

export function CardTitle({ className, ...props }: ComponentPropsWithoutRef<"h3">) {
  return <h3 className={cn("text-base font-semibold", className)} {...props} />;
}

export function CardContent({ className, ...props }: ComponentPropsWithoutRef<"div">) {
  return <div className={cn("px-5 py-4", className)} {...props} />;
}
