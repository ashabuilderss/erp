"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Card, CardContent } from "@/components/ui/card";

interface AttendanceTrendChartProps {
  data: { date: string; present: number; absent: number; onLeave: number }[];
}

export function AttendanceTrendChart({ data }: AttendanceTrendChartProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <h3 className="text-sm font-medium text-foreground mb-4">Attendance Trend (Last 30 Days)</h3>
        <div className="h-64 min-h-64 w-full">
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={240}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tickLine={false} axisLine={false} tickFormatter={(v) => v.split("-").slice(1).join("-")} />
              <YAxis tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
              <Legend />
              <Line type="monotone" dataKey="present" stroke="#22c55e" strokeWidth={2} dot={false} name="Present" />
              <Line type="monotone" dataKey="absent" stroke="#ef4444" strokeWidth={2} dot={false} name="Absent" />
              <Line type="monotone" dataKey="onLeave" stroke="#f59e0b" strokeWidth={2} dot={false} name="On Leave" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
