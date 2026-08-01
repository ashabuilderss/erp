"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type { DashboardKpiSnapshot } from "@/lib/types";

interface AttendanceAreaChartProps {
  data: DashboardKpiSnapshot[];
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return `${d.getDate()} ${d.toLocaleString("en", { month: "short" })}`;
}

export function AttendanceAreaChart({ data }: AttendanceAreaChartProps) {
  const chartData = data.map((d) => ({
    date: formatDate(d.snapshotDate),
    present: d.presentEmployees,
    absent: d.absentEmployees,
    late: d.lateEmployees,
    onLeave: d.onLeaveToday,
  }));

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%" minWidth={0}>
        <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
          <defs>
            <linearGradient id="presentGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#4ade80" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#4ade80" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="absentGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f87171" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#f87171" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="lateGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#fb923c" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#fb923c" stopOpacity={0} />
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
          />
          <Legend
            wrapperStyle={{ fontSize: "11px", color: "rgba(255,255,255,0.5)" }}
          />
          <Area
            type="monotone"
            dataKey="present"
            stroke="#4ade80"
            strokeWidth={2}
            fill="url(#presentGrad)"
            dot={false}
            activeDot={{ r: 4, fill: "#4ade80", stroke: "#fff", strokeWidth: 1 }}
            name="Present"
          />
          <Area
            type="monotone"
            dataKey="late"
            stroke="#fb923c"
            strokeWidth={2}
            fill="url(#lateGrad)"
            dot={false}
            activeDot={{ r: 4, fill: "#fb923c", stroke: "#fff", strokeWidth: 1 }}
            name="Late"
          />
          <Area
            type="monotone"
            dataKey="absent"
            stroke="#f87171"
            strokeWidth={2}
            fill="url(#absentGrad)"
            dot={false}
            activeDot={{ r: 4, fill: "#f87171", stroke: "#fff", strokeWidth: 1 }}
            name="Absent"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
