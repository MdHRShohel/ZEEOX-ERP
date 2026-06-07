"use client";

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";

interface DataPoint {
  period: string;
  purchased: number;
  sold: number;
}

export function PurchaseVsSalesChart({ data }: { data: DataPoint[] }) {
  if (!data.length) {
    return <p className="text-sm text-slate-400 py-10 text-center">No data yet</p>;
  }
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis dataKey="period" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip />
        <Legend />
        <Bar dataKey="purchased" name="Purchased (units)" fill="#475569" radius={[3, 3, 0, 0]} />
        <Bar dataKey="sold" name="Sold (units)" fill="#0f172a" radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
