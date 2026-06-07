import { cn } from "@/lib/utils";

const variants = {
  default: "bg-slate-100 text-slate-800",
  success: "bg-green-100 text-green-800",
  warning: "bg-amber-100 text-amber-800",
  danger: "bg-red-100 text-red-800",
  info: "bg-blue-100 text-blue-800",
  muted: "bg-slate-50 text-slate-500",
};

interface BadgeProps {
  variant?: keyof typeof variants;
  className?: string;
  children: React.ReactNode;
}

export function Badge({ variant = "default", className, children }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

export function statusVariant(status: string): keyof typeof variants {
  switch (status) {
    case "draft": return "muted";
    case "confirmed": return "info";
    case "partial": return "warning";
    case "received": return "success";
    case "posted": return "success";
    case "paid": return "success";
    case "cancelled": return "danger";
    case "unpaid": return "warning";
    case "invoiced": return "info";
    case "admin": return "danger";
    case "staff": return "info";
    case "viewer": return "muted";
    default: return "default";
  }
}
