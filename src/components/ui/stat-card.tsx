import { Card, CardContent } from "./card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  className?: string;
}

export function StatCard({ label, value, subtext, className }: StatCardProps) {
  return (
    <Card className={cn("", className)}>
      <CardContent className="pt-4">
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</p>
        <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
        {subtext && <p className="mt-1 text-xs text-slate-500">{subtext}</p>}
      </CardContent>
    </Card>
  );
}
