"use client";

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Card, CardContent } from "@/components/ui/card";

const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff7300", "#8dd1e1", "#d084d0", "#f87d7d"];

interface DepartmentPieChartProps {
  data: { name: string; value: number }[];
}

export function DepartmentPieChart({ data }: DepartmentPieChartProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <h3 className="text-sm font-medium text-foreground mb-4">Department Distribution</h3>
        <div className="h-64 min-h-64 w-full">
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={240}>
            <PieChart>
              <Tooltip
                contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
                formatter={(value, name) => [typeof value === "number" ? value : 0, String(name ?? "")]}
              />
              <Legend />
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="value"
                nameKey="name"
                label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {data.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
