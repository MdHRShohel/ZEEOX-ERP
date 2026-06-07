import { StatCard } from "@/components/ui/stat-card";

interface Stat {
  label: string;
  value: string | number;
  subtext?: string;
}

interface ModuleStatsProps {
  stats: Stat[];
}

export function ModuleStats({ stats }: ModuleStatsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      {stats.map((s) => (
        <StatCard key={s.label} label={s.label} value={s.value} subtext={s.subtext} />
      ))}
    </div>
  );
}
