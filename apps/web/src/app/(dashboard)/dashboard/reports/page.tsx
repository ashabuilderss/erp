"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQueryClient } from "@tanstack/react-query";
import {
  useAnalyticsDashboard,
  useConversionFunnel,
  useCreateReportExport,
  useReportCatalog,
  useReportExports,
} from "@/hooks/api";
import { CardSkeleton, ListSkeleton } from "@/components/ui/skeleton-variants";
import { Download } from "lucide-react";
import { useToast } from "@/components/ui/toast";

export default function ReportsPage() {
  const queryClient = useQueryClient();
  const { data: analytics, isLoading: analyticsLoading } = useAnalyticsDashboard();
  const { data: funnel } = useConversionFunnel();
  const { data: catalog } = useReportCatalog();
  const { data: exports } = useReportExports();
  const createExport = useCreateReportExport();
  const { showToast } = useToast();

  if (analyticsLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <div className="h-8 w-24 bg-muted rounded animate-pulse" />
          <div className="h-4 w-48 bg-muted rounded animate-pulse" />
        </div>
        <CardSkeleton count={5} />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <ListSkeleton rows={3} />
        </div>
      </div>
    );
  }

  const statCards = [
    {
      label: "Active Employees",
      value: analytics?.employees?.active ?? 0,
    },
    {
      label: "Total Leads",
      value: analytics?.leads?.total ?? 0,
      sub: `${analytics?.leads?.converted ?? 0} converted`,
    },
    {
      label: "Properties",
      value: analytics?.properties?.total ?? 0,
    },
    {
      label: "Bookings",
      value: analytics?.bookings?.total ?? 0,
    },
    { label: "Site Visits", value: analytics?.siteVisits?.total ?? 0 },
  ];

  const funnelData = funnel
    ? funnel.leads.map((l: { status: string; count: number }) => ({
        stage: l.status,
        count: l.count,
      }))
    : [];

  const handleExport = async (reportKey: string) => {
    try {
      const res = await fetch("/api/proxy/reports/exports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportKey, format: "CSV" }),
      });
      const data = await res.json();
      if (data.csvData) {
        const byteCharacters = atob(data.csvData);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${reportKey}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        queryClient.invalidateQueries({ queryKey: ["report-exports"] });
      } else {
        showToast(data.message || "Export failed", "error");
      }
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Export failed", "error");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Reports</h2>
        <p className="text-sm text-muted-foreground">
          Key metrics and analytics
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
        {statCards.map((s) => (
          <Card key={s.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {s.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{s.value}</div>
              {s.sub && (
                <p className="text-xs text-muted-foreground mt-1">{s.sub}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Conversion Funnel</CardTitle>
          </CardHeader>
          <CardContent>
            {funnelData.length > 0 ? (
              <div className="space-y-3">
                {funnelData.map((f, i) => (
                  <div key={f.stage}>
                    <div className="flex justify-between text-sm mb-1">
                      <span>{f.stage}</span>
                      <span className="font-medium">{f.count}</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2.5">
                      <div
                        className="bg-primary h-2.5 rounded-full"
                        style={{
                          width: `${funnelData[0].count > 0 ? (f.count / funnelData[0].count) * 100 : 0}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
                <p className="pt-2 text-xs text-muted-foreground">
                  Lead stages breakdown by count
                </p>
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">No data available</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Export Catalog</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {catalog?.items.map((report) => (
              <div
                key={report.key}
                className="flex items-start justify-between gap-3 rounded-md border p-3"
              >
                <div>
                  <div className="font-medium">{report.title}</div>
                  <p className="text-sm text-muted-foreground">
                    {report.description}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleExport(report.key)}
                  disabled={createExport.isPending}
                >
                  <Download className="mr-1 h-4 w-4" />
                  Export
                </Button>
              </div>
            )) ?? (
              <p className="text-sm text-muted-foreground">
                Loading catalog...
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Exports</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {exports?.data && exports.data.length > 0 ? (
            exports.data.slice(0, 6).map((item) => (
              <div key={item.id} className="rounded-md border p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium">{item.title}</span>
                  <Badge variant="secondary">{item.status}</Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {item.summary}
                </p>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">
              No exports prepared yet
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
