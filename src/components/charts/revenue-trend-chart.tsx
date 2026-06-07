"use client";

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";

interface DataPoint {
  period: string;
  revenue: number;
  profit: number;
}

export function RevenueTrendChart({ data }: { data: DataPoint[] }) {
  if (!data.length) {
    return <p className="text-sm text-slate-400 py-10 text-center">No data yet</p>;
  }
  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis dataKey="period" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip formatter={(v: number) => `$${v.toLocaleString()}`} />
        <Legend />
        <Line type="monotone" dataKey="revenue" name="Revenue" stroke="#0f172a" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="profit" name="Gross Profit" stroke="#64748b" strokeWidth={2} dot={false} strokeDasharray="4 4" />
      </LineChart>
    </ResponsiveContainer>
  );
}
