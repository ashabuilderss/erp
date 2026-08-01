"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { DashboardKpiSnapshot } from "@/lib/types";

interface RevenueTrendChartProps {
  data: DashboardKpiSnapshot[];
}

function formatCurrency(value: number) {
  if (value >= 10000000) return `₹${(value / 10000000).toFixed(1)}Cr`;
  if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
  if (value >= 1000) return `₹${(value / 1000).toFixed(1)}K`;
  return `₹${value}`;
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return `${d.getDate()} ${d.toLocaleString("en", { month: "short" })}`;
}

export function RevenueTrendChart({ data }: RevenueTrendChartProps) {
  const chartData = data.map((d) => ({
    date: formatDate(d.snapshotDate),
    revenue: d.totalRevenue,
    bookings: d.totalBookings,
  }));

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%" minWidth={0}>
        <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
          <defs>
            <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#a78bfa" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
          <XAxis
            dataKey="date"
            tickLine={false}
            axisLine={false}
            tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tickFormatter={formatCurrency}
            tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "rgba(15,15,25,0.95)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "8px",
              color: "#fff",
              fontSize: "12px",
            }}
            formatter={(value) => [formatCurrency(Number(value)), "Revenue"]}
          />
          <Area
            type="monotone"
            dataKey="revenue"
            stroke="#a78bfa"
            strokeWidth={2}
            fill="url(#revenueGradient)"
            dot={false}
            activeDot={{ r: 4, fill: "#a78bfa", stroke: "#fff", strokeWidth: 1 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
