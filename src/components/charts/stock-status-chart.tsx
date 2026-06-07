"use client";

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface DataPoint {
  label: string;
  count: number;
  color: string;
}

export function StockStatusChart({ data }: { data: DataPoint[] }) {
  if (!data.length || data.every((d) => d.count === 0)) {
    return <p className="text-sm text-slate-400 py-10 text-center">No products yet</p>;
  }
  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie
          data={data}
          dataKey="count"
          nameKey="label"
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={100}
          paddingAngle={2}
        >
          {data.map((entry, i) => (
            <Cell key={i} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip formatter={(v: number) => `${v} products`} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
