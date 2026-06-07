"use client";

import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";

interface DataPoint {
  date: string;
  inflow: number;
  outflow: number;
}

export function StockMovementChart({ data }: { data: DataPoint[] }) {
  if (!data.length) {
    return <p className="text-sm text-slate-400 py-10 text-center">No movements yet</p>;
  }
  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <defs>
          <linearGradient id="inflow" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="outflow" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis dataKey="date" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip />
        <Legend />
        <Area type="monotone" dataKey="inflow" name="Inflow" stroke="#22c55e" fill="url(#inflow)" strokeWidth={2} />
        <Area type="monotone" dataKey="outflow" name="Outflow" stroke="#ef4444" fill="url(#outflow)" strokeWidth={2} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
