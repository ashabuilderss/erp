"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import type { PerformanceTrendSnapshot } from "@/lib/types";

interface PerformanceTrendsChartProps {
  data: PerformanceTrendSnapshot[];
}

export function PerformanceTrendsChart({ data }: PerformanceTrendsChartProps) {
  const chartData = data
    .slice()
    .reverse()
    .map((d) => ({
      period: d.period,
      composite: d.compositeScore,
      task: d.taskScore,
      attendance: d.attendanceScore,
      eod: d.eodScore,
      manager: d.managerScore,
    }));

  return (
    <Card>
      <CardContent className="p-4">
        <h3 className="text-sm font-medium text-foreground mb-4">Performance Trends</h3>
        <div className="h-64 min-h-64 w-full">
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={240}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="period" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} domain={[0, 100]} />
              <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
              <Legend />
              <Line type="monotone" dataKey="composite" stroke="#3b82f6" strokeWidth={2} dot={false} name="Composite" />
              <Line type="monotone" dataKey="task" stroke="#22c55e" strokeWidth={1.5} dot={false} name="Task" />
              <Line type="monotone" dataKey="attendance" stroke="#f59e0b" strokeWidth={1.5} dot={false} name="Attendance" />
              <Line type="monotone" dataKey="eod" stroke="#8b5cf6" strokeWidth={1.5} dot={false} name="EOD" />
              <Line type="monotone" dataKey="manager" stroke="#ef4444" strokeWidth={1.5} dot={false} name="Manager" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
