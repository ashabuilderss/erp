"use client";

import { FunnelChart, Funnel, Tooltip, Legend, Cell, ResponsiveContainer } from "recharts";
import { Card, CardContent } from "@/components/ui/card";

const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff7300", "#ff0000", "#00ff00", "#0088ff"];

interface LeadFunnelChartProps {
  data: { stage: string; count: number }[];
}

export function LeadFunnelChart({ data }: LeadFunnelChartProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <h3 className="text-sm font-medium text-foreground mb-4">Lead Conversion Funnel</h3>
        <div className="h-64 min-h-64 w-full">
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={240}>
            <FunnelChart data={data}>
              <Tooltip
                contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
                formatter={(value, name) => [value ?? 0, String(name ?? "")]}
              />
              <Legend />
              <Funnel
                dataKey="count"
                nameKey="stage"
                strokeWidth={0}
                isAnimationActive={true}
                label={{ position: "inside", fill: "#fff", fontSize: 12, fontWeight: 600 }}
              >
                {data.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Funnel>
            </FunnelChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
