"use client";

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

interface DataPoint {
  name: string;
  revenue: number;
}

export function TopProductsChart({ data }: { data: DataPoint[] }) {
  if (!data.length) {
    return <p className="text-sm text-slate-400 py-10 text-center">No sales yet</p>;
  }
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart layout="vertical" data={data} margin={{ top: 5, right: 20, left: 80, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
        <XAxis type="number" tick={{ fontSize: 11 }} />
        <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={80} />
        <Tooltip formatter={(v: number) => `$${v.toLocaleString()}`} />
        <Bar dataKey="revenue" fill="#0f172a" radius={[0, 3, 3, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
