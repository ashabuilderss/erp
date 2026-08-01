"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DataTable } from "@/components/ui/data-table";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  useAnalyticsDashboard,
  useConversionFunnel,
  useReportCatalog,
  useExportHistory,
  useCreateExport,
  useCurrentUser,
} from "@/hooks/api";
import { queryKeys } from "@/lib/query-keys";
import { CardSkeleton, ListSkeleton } from "@/components/ui/skeleton-variants";
import { Download, FileSpreadsheet, FileText, FileImage, Send } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import type { ReportExport, ExportFormat, ReportExportStatus } from "@/lib/types";
import type { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";

const FORMAT_OPTIONS: { value: ExportFormat; label: string; icon: React.ReactNode }[] = [
  { value: "CSV", label: "CSV", icon: <FileText className="h-4 w-4" /> },
  { value: "EXCEL", label: "Excel", icon: <FileSpreadsheet className="h-4 w-4" /> },
  { value: "PDF", label: "PDF", icon: <FileImage className="h-4 w-4" /> },
  { value: "SHEET", label: "Google Sheets", icon: <Send className="h-4 w-4" /> },
];

const STATUS_COLORS: Record<ReportExportStatus, string> = {
  REQUESTED: "text-yellow-600 bg-yellow-50",
  PROCESSING: "text-blue-600 bg-blue-50",
  COMPLETED: "text-green-600 bg-green-50",
  FAILED: "text-red-600 bg-red-50",
};

const REPORT_KEYS = [
  { value: "leads", label: "Leads Report" },
  { value: "properties", label: "Properties Report" },
  { value: "bookings", label: "Bookings Report" },
  { value: "employees", label: "Employees Report" },
  { value: "attendance", label: "Attendance Report" },
  { value: "payroll", label: "Payroll Report" },
  { value: "site-visits", label: "Site Visits Report" },
  { value: "expenses", label: "Expenses Report" },
  { value: "commissions", label: "Commissions Report" },
];

export default function ReportsPage() {
  const { data: analytics, isLoading: analyticsLoading } = useAnalyticsDashboard();
  const { data: funnel } = useConversionFunnel();
  const { data: catalog } = useReportCatalog();
  const { data: historyData, isLoading: historyLoading } = useExportHistory({ page: 1, limit: 20 });
  const createExport = useCreateExport();
  const { showToast } = useToast();
  const { data: currentUser } = useCurrentUser();
  const canExport = currentUser?.user?.role && ["OWNER", "ADMIN", "HR_MANAGER", "ACCOUNTS"].includes(currentUser.user.role);

  const [exportOpen, setExportOpen] = useState(false);
  const [selectedKey, setSelectedKey] = useState("");
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>("CSV");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

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
    { label: "Active Employees", value: analytics?.employees?.active ?? 0 },
    { label: "Total Leads", value: analytics?.leads?.total ?? 0, sub: `${analytics?.leads?.converted ?? 0} converted` },
    { label: "Properties", value: analytics?.properties?.total ?? 0 },
    { label: "Bookings", value: analytics?.bookings?.total ?? 0 },
    { label: "Site Visits", value: analytics?.siteVisits?.total ?? 0 },
  ];

  const funnelData = funnel
    ? funnel.leads.map((l: { status: string; count: number }) => ({ stage: l.status, count: l.count }))
    : [];

  const handleQuickExport = async (reportKey: string) => {
    try {
      await createExport.mutateAsync({ reportKey, format: "CSV" });
      showToast("Export started", "success");
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Export failed", "error");
    }
  };

  const handleFormExport = async () => {
    if (!selectedKey) {
      showToast("Select a dataset", "error");
      return;
    }
    try {
      await createExport.mutateAsync({
        reportKey: selectedKey,
        format: selectedFormat,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      });
      showToast("Export started", "success");
      setExportOpen(false);
      setSelectedKey("");
      setSelectedFormat("CSV");
      setDateFrom("");
      setDateTo("");
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Export failed", "error");
    }
  };

  const handleDownload = (item: ReportExport) => {
    if (item.fileUrl) {
      window.open(item.fileUrl, "_blank");
    } else {
      showToast("File not available yet", "error");
    }
  };

  const historyColumns: ColumnDef<ReportExport>[] = [
    {
      accessorKey: "id",
      header: "Export ID",
      cell: ({ row }) => (
        <span className="font-mono text-xs">{row.original.id.slice(0, 8)}</span>
      ),
    },
    {
      accessorKey: "reportKey",
      header: "Dataset",
      cell: ({ row }) => (
        <span className="font-medium">{row.original.reportKey}</span>
      ),
    },
    {
      accessorKey: "format",
      header: "Format",
      cell: ({ row }) => (
        <Badge variant="secondary">{row.original.format}</Badge>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge variant="outline" className={STATUS_COLORS[row.original.status]}>
          {row.original.status}
        </Badge>
      ),
    },
    {
      accessorKey: "createdAt",
      header: "Requested",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {format(new Date(row.original.createdAt), "MMM d, HH:mm")}
        </span>
      ),
    },
    {
      accessorKey: "generatedAt",
      header: "Completed",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.original.generatedAt
            ? format(new Date(row.original.generatedAt), "MMM d, HH:mm")
            : "—"}
        </span>
      ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleDownload(row.original)}
          disabled={row.original.status !== "COMPLETED"}
        >
          <Download className="h-4 w-4" />
        </Button>
      ),
    },
  ];

  const recentExports = historyData?.data?.slice(0, 6) ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Reports</h2>
          <p className="text-sm text-muted-foreground">
            Key metrics, analytics, and data exports
          </p>
        </div>
        {canExport && (
        <Dialog open={exportOpen} onOpenChange={setExportOpen}>
          <DialogTrigger
            render={
              <Button onClick={() => setExportOpen(true)}>
                <Download className="mr-2 h-4 w-4" />
                New Export
              </Button>
            }
          />
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Export</DialogTitle>
              <DialogDescription>
                Select a dataset and format to export.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Dataset</Label>
                <Select value={selectedKey} onValueChange={(v) => setSelectedKey(v ?? "")}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select dataset" />
                  </SelectTrigger>
                  <SelectContent>
                    {REPORT_KEYS.map((r) => (
                      <SelectItem key={r.value} value={r.value}>
                        {r.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Format</Label>
                <div className="grid grid-cols-2 gap-2">
                  {FORMAT_OPTIONS.map((f) => (
                    <Button
                      key={f.value}
                      variant={selectedFormat === f.value ? "default" : "outline"}
                      className="justify-start gap-2"
                      onClick={() => setSelectedFormat(f.value)}
                    >
                      {f.icon}
                      {f.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Date From</Label>
                  <Input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Date To</Label>
                  <Input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setExportOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleFormExport} disabled={createExport.isPending}>
                {createExport.isPending ? "Exporting..." : "Export"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
        {statCards.map((s) => (
          <Card key={s.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{s.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{s.value}</div>
              {s.sub && <p className="text-xs text-muted-foreground mt-1">{s.sub}</p>}
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
                {funnelData.map((f) => (
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
                <p className="pt-2 text-xs text-muted-foreground">Lead stages breakdown by count</p>
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">No data available</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Export</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {catalog?.items.map((report) => (
              <div key={report.key} className="flex items-start justify-between gap-3 rounded-md border p-3">
                <div>
                  <div className="font-medium">{report.title}</div>
                  <p className="text-sm text-muted-foreground">{report.description}</p>
                </div>
                {canExport && (
                <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleQuickExport(report.key)}
                    disabled={createExport.isPending}
                  >
                    <Download className="mr-1 h-4 w-4" />
                    Export
                  </Button>
                )}
                </div>
            )) ?? (
              <p className="text-sm text-muted-foreground">Loading catalog...</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Export History</CardTitle>
        </CardHeader>
        <CardContent>
          {historyLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-12 bg-muted rounded animate-pulse" />
              ))}
            </div>
          ) : recentExports.length > 0 ? (
            <div className="rounded-md border">
              <DataTable
                columns={historyColumns}
                data={historyData?.data ?? []}
              />
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No exports yet</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
