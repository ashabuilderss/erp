"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Card, CardContent } from "@/components/ui/card";

interface SiteVisitsByEmployeeChartProps {
  data: { name: string; scheduled: number; completed: number }[];
}

export function SiteVisitsByEmployeeChart({ data }: SiteVisitsByEmployeeChartProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <h3 className="text-sm font-medium text-foreground mb-4">Site Visits by Employee</h3>
        <div className="h-64 min-h-64 w-full">
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={240}>
            <BarChart data={data} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis type="number" tickLine={false} axisLine={false} />
              <YAxis type="category" dataKey="name" tickLine={false} axisLine={false} width={100} />
              <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
              <Legend />
              <Bar dataKey="scheduled" fill="#f59e0b" radius={[0, 4, 4, 0]} name="Scheduled" />
              <Bar dataKey="completed" fill="#22c55e" radius={[0, 4, 4, 0]} name="Completed" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
