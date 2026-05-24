import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "secondary" | "destructive";
  size?: "default" | "sm";
};

export function Button({ className, variant = "default", size = "default", ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-md text-sm font-medium transition",
        size === "default" && "px-4 py-2",
        size === "sm" && "px-3 py-1.5",
        variant === "default" && "bg-slate-900 text-white hover:bg-slate-700",
        variant === "secondary" && "bg-slate-100 text-slate-900 hover:bg-slate-200",
        variant === "destructive" && "bg-rose-600 text-white hover:bg-rose-500",
        className
      )}
      {...props}
    />
  );
}
