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

interface LeadTrendChartProps {
  data: DashboardKpiSnapshot[];
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return `${d.getDate()} ${d.toLocaleString("en", { month: "short" })}`;
}

export function LeadTrendChart({ data }: LeadTrendChartProps) {
  const chartData = data.map((d) => ({
    date: formatDate(d.snapshotDate),
    totalLeads: d.totalLeads,
    newLeads: d.newLeads,
    converted: d.convertedLeads,
    siteVisits: d.totalSiteVisits,
  }));

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%" minWidth={0}>
        <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
          <defs>
            <linearGradient id="leadsGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#34d399" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="newLeadsGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#60a5fa" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="convertedGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#fbbf24" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#fbbf24" stopOpacity={0} />
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
            dataKey="totalLeads"
            stroke="#34d399"
            strokeWidth={2}
            fill="url(#leadsGradient)"
            dot={false}
            activeDot={{ r: 4, fill: "#34d399", stroke: "#fff", strokeWidth: 1 }}
            name="Total Leads"
          />
          <Area
            type="monotone"
            dataKey="newLeads"
            stroke="#60a5fa"
            strokeWidth={2}
            fill="url(#newLeadsGradient)"
            dot={false}
            activeDot={{ r: 4, fill: "#60a5fa", stroke: "#fff", strokeWidth: 1 }}
            name="New Leads"
          />
          <Area
            type="monotone"
            dataKey="converted"
            stroke="#fbbf24"
            strokeWidth={2}
            fill="url(#convertedGradient)"
            dot={false}
            activeDot={{ r: 4, fill: "#fbbf24", stroke: "#fff", strokeWidth: 1 }}
            name="Converted"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
