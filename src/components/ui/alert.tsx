import { cn } from "@/lib/utils";

const variants = {
  info: "bg-blue-50 border-blue-200 text-blue-800",
  success: "bg-green-50 border-green-200 text-green-800",
  warning: "bg-amber-50 border-amber-200 text-amber-800",
  error: "bg-red-50 border-red-200 text-red-800",
};

interface AlertProps {
  variant?: keyof typeof variants;
  className?: string;
  children: React.ReactNode;
}

export function Alert({ variant = "info", className, children }: AlertProps) {
  return (
    <div className={cn("rounded-md border p-3 text-sm", variants[variant], className)}>
      {children}
    </div>
  );
}
