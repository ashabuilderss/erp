"use client";

import { useState, useMemo } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Calculator, Star, RotateCcw, Eye, Trophy, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useCurrentUser } from "@/hooks/api";
import { usePerformanceScores, usePerformanceTrends, usePerformanceLeaderboard, useCalculateScore, useRateEmployee, useRecalculateScore } from "@/hooks/api";
import { useToast } from "@/components/ui/toast";
import { getApiErrorMessage } from "@/lib/api";
import { FieldError } from "@/components/shared/field-error";
import { validateForm, clearFieldError } from "@/components/shared/form-validation";
import { EmptyState } from "@/components/shared/empty-state";
import { PerformanceTrendsChart } from "@/components/charts/PerformanceTrendsChart";
import type { PerformanceScore, LeaderboardEntry, PerformanceTrendSnapshot, PerformancePeriod, TrendDirection } from "@/lib/types";
import { format } from "date-fns";

const trendIcons: Record<TrendDirection, React.ReactNode> = {
  IMPROVING: <TrendingUp className="h-4 w-4 text-green-600" />,
  STABLE: <Minus className="h-4 w-4 text-muted-foreground" />,
  DECLINING: <TrendingDown className="h-4 w-4 text-red-600" />,
};

const trendColors: Record<TrendDirection, string> = {
  IMPROVING: "bg-green-100 text-green-800",
  STABLE: "bg-gray-100 text-gray-800",
  DECLINING: "bg-red-100 text-red-800",
};

function getScoreColor(score: number): string {
  if (score >= 80) return "text-green-600";
  if (score >= 60) return "text-amber-600";
  return "text-red-600";
}

export default function PerformancePage() {
  const { data: currentUser } = useCurrentUser();
  const isEmployee = currentUser?.user?.role === "EMPLOYEE";

  const [activeTab, setActiveTab] = useState("scores");
  const [query, setQuery] = useState({ page: 1, limit: 10, search: "" });
  const [periodFilter, setPeriodFilter] = useState<PerformancePeriod | "">("");
  const [leaderboardPeriod, setLeaderboardPeriod] = useState(format(new Date(), "yyyy-MM"));
  const [leaderboardPeriodType, setLeaderboardPeriodType] = useState<PerformancePeriod>("MONTHLY");

  const { data: scoresData, isLoading: scoresLoading } = usePerformanceScores({
    page: query.page,
    limit: query.limit,
    periodType: periodFilter || undefined,
  });

  const { data: trendsData, isLoading: trendsLoading } = usePerformanceTrends({ limit: 12 });

  const { data: leaderboardData, isLoading: leaderboardLoading } = usePerformanceLeaderboard({
    period: leaderboardPeriod,
    periodType: leaderboardPeriodType,
    limit: 20,
  });

  const calculateMutation = useCalculateScore();
  const rateMutation = useRateEmployee();
  const recalculateMutation = useRecalculateScore();
  const { showToast } = useToast();

  const [calculateOpen, setCalculateOpen] = useState(false);
  const [rateItem, setRateItem] = useState<PerformanceScore | null>(null);
  const [detailItem, setDetailItem] = useState<PerformanceScore | null>(null);

  const [calcForm, setCalcForm] = useState({ employeeId: "", period: "", periodType: "MONTHLY" as PerformancePeriod });
  const [rateForm, setRateForm] = useState({ score: "", comment: "" });
  const [calcErrors, setCalcErrors] = useState<Partial<Record<string, string>>>({});
  const [rateErrors, setRateErrors] = useState<Partial<Record<string, string>>>({});

  const handleCalculate = () => {
    const rules = { employeeId: { required: "Employee ID is required" }, period: { required: "Period is required" } };
    const errs = validateForm(calcForm, rules);
    setCalcErrors(errs);
    if (Object.keys(errs).length > 0) return;
    calculateMutation.mutate(
      { employeeId: calcForm.employeeId, period: calcForm.period, periodType: calcForm.periodType },
      {
        onSuccess: () => { showToast("Score calculated"); setCalculateOpen(false); setCalcForm({ employeeId: "", period: "", periodType: "MONTHLY" }); },
        onError: (err) => showToast(getApiErrorMessage(err, "Failed to calculate score"), "error"),
      },
    );
  };

  const handleRate = () => {
    if (!rateItem) return;
    const scoreNum = Number(rateForm.score);
    if (!scoreNum || scoreNum < 1 || scoreNum > 10) {
      setRateErrors({ score: "Score must be between 1 and 10" });
      return;
    }
    setRateErrors({});
    rateMutation.mutate(
      { performanceScoreId: rateItem.id, ratedById: currentUser?.user?.id || "", score: scoreNum, comment: rateForm.comment || undefined },
      {
        onSuccess: () => { showToast("Rating submitted"); setRateItem(null); setRateForm({ score: "", comment: "" }); },
        onError: (err) => showToast(getApiErrorMessage(err, "Failed to submit rating"), "error"),
      },
    );
  };

  const scoreColumns: ColumnDef<PerformanceScore>[] = [
    {
      accessorKey: "employees",
      header: "Employee",
      cell: ({ row }) => {
        const emp = row.original.employees;
        return <span className="font-medium">{emp?.users?.firstName} {emp?.users?.lastName}</span>;
      },
    },
    {
      accessorKey: "period",
      header: "Period",
      cell: ({ row }) => <span className="text-sm">{row.original.period} ({row.original.periodType})</span>,
    },
    {
      accessorKey: "compositeScore",
      header: "Composite",
      cell: ({ row }) => <span className={`font-semibold ${getScoreColor(row.original.compositeScore)}`}>{row.original.compositeScore.toFixed(1)}</span>,
    },
    {
      accessorKey: "taskScore",
      header: "Task",
      cell: ({ row }) => <span className="text-sm">{row.original.taskScore.toFixed(1)}</span>,
    },
    {
      accessorKey: "attendanceScore",
      header: "Attendance",
      cell: ({ row }) => <span className="text-sm">{row.original.attendanceScore.toFixed(1)}</span>,
    },
    {
      accessorKey: "managerScore",
      header: "Manager",
      cell: ({ row }) => <span className="text-sm">{row.original.managerScore.toFixed(1)}</span>,
    },
    {
      accessorKey: "trend",
      header: "Trend",
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          {trendIcons[row.original.trend]}
          <Badge variant="outline" className={trendColors[row.original.trend]}>{row.original.trend}</Badge>
        </div>
      ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const item = row.original;
        return (
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon-sm" onClick={() => setDetailItem(item)}><Eye className="h-4 w-4" /></Button>
            {!isEmployee && (
              <>
                <Button variant="ghost" size="icon-sm" onClick={() => setRateItem(item)}><Star className="h-4 w-4 text-amber-500" /></Button>
                <Button variant="ghost" size="icon-sm" onClick={() => {
                  setCalcForm({ employeeId: item.employeeId, period: item.period, periodType: item.periodType });
                  setCalculateOpen(true);
                }}><RotateCcw className="h-4 w-4 text-muted-foreground" /></Button>
              </>
            )}
          </div>
        );
      },
    },
  ];

  if (isEmployee) {
    return (
      <div className="space-y-4">
        <div><h2 className="text-2xl font-semibold">Performance</h2><p className="text-sm text-muted-foreground">Your performance trends and leaderboard</p></div>

        <Tabs defaultValue="leaderboard">
          <TabsList>
            <TabsTrigger value="leaderboard"><Trophy className="h-4 w-4 mr-1" />Leaderboard</TabsTrigger>
            <TabsTrigger value="trends"><TrendingUp className="h-4 w-4 mr-1" />Trends</TabsTrigger>
          </TabsList>

          <TabsContent value="leaderboard" className="space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Leaderboard</CardTitle>
                  <div className="flex items-center gap-2">
                    <Input type="month" value={leaderboardPeriod} onChange={(e) => setLeaderboardPeriod(e.target.value)} className="w-40" />
                    <Select value={leaderboardPeriodType} onValueChange={(v) => setLeaderboardPeriodType(v as PerformancePeriod)}>
                      <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="WEEKLY">Weekly</SelectItem>
                        <SelectItem value="MONTHLY">Monthly</SelectItem>
                        <SelectItem value="QUARTERLY">Quarterly</SelectItem>
                        <SelectItem value="YEARLY">Yearly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {leaderboardLoading ? (
                  <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-12 animate-pulse rounded bg-muted" />)}</div>
                ) : !leaderboardData || leaderboardData.length === 0 ? (
                  <EmptyState icon={<Trophy className="h-8 w-8" />} title="No leaderboard data" description="No performance data available for this period." />
                ) : (
                  <div className="space-y-2">
                    {leaderboardData.map((entry) => (
                      <div key={entry.employeeId} className="flex items-center justify-between rounded-lg border p-3">
                        <div className="flex items-center gap-3">
                          <span className={`text-lg font-bold ${entry.rank <= 3 ? "text-amber-600" : "text-muted-foreground"}`}>#{entry.rank}</span>
                          <div><p className="font-medium">{entry.employeeName}</p><p className="text-xs text-muted-foreground">{entry.department} {entry.designation && `- ${entry.designation}`}</p></div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`font-semibold ${getScoreColor(entry.compositeScore)}`}>{entry.compositeScore.toFixed(1)}</span>
                          {trendIcons[entry.trend]}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="trends" className="space-y-4">
            {trendsLoading ? (
              <Card><CardContent className="p-4"><div className="h-64 animate-pulse rounded bg-muted" /></CardContent></Card>
            ) : !trendsData || trendsData.length === 0 ? (
              <EmptyState icon={<TrendingUp className="h-8 w-8" />} title="No trend data" description="No performance trends available yet." />
            ) : (
              <PerformanceTrendsChart data={trendsData} />
            )}
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div><h2 className="text-2xl font-semibold">Performance Scores</h2><p className="text-sm text-muted-foreground">Manage employee performance scores</p></div>
        <Button onClick={() => setCalculateOpen(true)}><Calculator className="h-4 w-4 mr-1" />Calculate Score</Button>
      </div>

      <Tabs defaultValue="scores" value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="scores">Scores</TabsTrigger>
          <TabsTrigger value="leaderboard"><Trophy className="h-4 w-4 mr-1" />Leaderboard</TabsTrigger>
          <TabsTrigger value="trends"><TrendingUp className="h-4 w-4 mr-1" />Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="scores" className="space-y-4">
          <div className="flex items-center gap-2">
            <Select value={periodFilter} onValueChange={(v) => setPeriodFilter(v as PerformancePeriod | "")}>
              <SelectTrigger className="w-40"><SelectValue placeholder="All Periods" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="WEEKLY">Weekly</SelectItem>
                <SelectItem value="MONTHLY">Monthly</SelectItem>
                <SelectItem value="QUARTERLY">Quarterly</SelectItem>
                <SelectItem value="YEARLY">Yearly</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DataTable
            columns={scoreColumns}
            data={scoresData?.data || []}
            isLoading={scoresLoading}
            searchKey="performance scores"
            onSearchChange={(s) => setQuery((prev) => ({ ...prev, search: s, page: 1 }))}
            pageCount={scoresData?.meta?.totalPages}
            totalRecords={scoresData?.meta?.total}
            onPaginationChange={(pageIndex, pageSize) => setQuery((prev) => ({ ...prev, page: pageIndex + 1, limit: pageSize }))}
          />
        </TabsContent>

        <TabsContent value="leaderboard" className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Leaderboard</CardTitle>
                <div className="flex items-center gap-2">
                  <Input type="month" value={leaderboardPeriod} onChange={(e) => setLeaderboardPeriod(e.target.value)} className="w-40" />
                  <Select value={leaderboardPeriodType} onValueChange={(v) => setLeaderboardPeriodType(v as PerformancePeriod)}>
                    <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="WEEKLY">Weekly</SelectItem>
                      <SelectItem value="MONTHLY">Monthly</SelectItem>
                      <SelectItem value="QUARTERLY">Quarterly</SelectItem>
                      <SelectItem value="YEARLY">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {leaderboardLoading ? (
                <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-12 animate-pulse rounded bg-muted" />)}</div>
              ) : !leaderboardData || leaderboardData.length === 0 ? (
                <EmptyState icon={<Trophy className="h-8 w-8" />} title="No leaderboard data" description="No performance data available for this period." />
              ) : (
                <div className="space-y-2">
                  {leaderboardData.map((entry) => (
                    <div key={entry.employeeId} className="flex items-center justify-between rounded-lg border p-3">
                      <div className="flex items-center gap-3">
                        <span className={`text-lg font-bold ${entry.rank <= 3 ? "text-amber-600" : "text-muted-foreground"}`}>#{entry.rank}</span>
                        <div><p className="font-medium">{entry.employeeName}</p><p className="text-xs text-muted-foreground">{entry.department} {entry.designation && `- ${entry.designation}`}</p></div>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <span className="text-muted-foreground">Task: {entry.taskScore.toFixed(1)}</span>
                        <span className="text-muted-foreground">Att: {entry.attendanceScore.toFixed(1)}</span>
                        <span className="text-muted-foreground">Mgr: {entry.managerScore.toFixed(1)}</span>
                        <span className={`font-semibold ${getScoreColor(entry.compositeScore)}`}>{entry.compositeScore.toFixed(1)}</span>
                        {trendIcons[entry.trend]}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          {trendsLoading ? (
            <Card><CardContent className="p-4"><div className="h-64 animate-pulse rounded bg-muted" /></CardContent></Card>
          ) : !trendsData || trendsData.length === 0 ? (
            <EmptyState icon={<TrendingUp className="h-8 w-8" />} title="No trend data" description="No performance trends available yet." />
          ) : (
            <PerformanceTrendsChart data={trendsData} />
          )}
        </TabsContent>
      </Tabs>

      {/* Calculate Score Dialog */}
      <Dialog open={calculateOpen} onOpenChange={(o) => { setCalculateOpen(o); if (!o) { setCalcForm({ employeeId: "", period: "", periodType: "MONTHLY" }); setCalcErrors({}); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Calculate Score</DialogTitle></DialogHeader>
          <div className="grid gap-3">
            <div><Label>Employee ID</Label><Input value={calcForm.employeeId} onChange={(e) => { setCalcForm({ ...calcForm, employeeId: e.target.value }); clearFieldError("employeeId", setCalcErrors); }} className={calcErrors.employeeId ? "border-red-500" : ""} /><FieldError error={calcErrors.employeeId} /></div>
            <div><Label>Period (e.g. 2026-07)</Label><Input value={calcForm.period} onChange={(e) => { setCalcForm({ ...calcForm, period: e.target.value }); clearFieldError("period", setCalcErrors); }} className={calcErrors.period ? "border-red-500" : ""} /><FieldError error={calcErrors.period} /></div>
            <div><Label>Period Type</Label><Select value={calcForm.periodType} onValueChange={(v) => setCalcForm({ ...calcForm, periodType: v as PerformancePeriod })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="WEEKLY">Weekly</SelectItem><SelectItem value="MONTHLY">Monthly</SelectItem><SelectItem value="QUARTERLY">Quarterly</SelectItem><SelectItem value="YEARLY">Yearly</SelectItem></SelectContent></Select></div>
          </div>
          <DialogFooter><Button onClick={handleCalculate} disabled={calculateMutation.isPending}>Calculate</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rate Employee Dialog */}
      <Dialog open={!!rateItem} onOpenChange={(o) => { if (!o) { setRateItem(null); setRateForm({ score: "", comment: "" }); setRateErrors({}); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Rate {rateItem?.employees?.users?.firstName} {rateItem?.employees?.users?.lastName}</DialogTitle></DialogHeader>
          <div className="grid gap-3">
            <div><Label>Score (1-10)</Label><Input type="number" min={1} max={10} value={rateForm.score} onChange={(e) => { setRateForm({ ...rateForm, score: e.target.value }); clearFieldError("score", setRateErrors); }} className={rateErrors.score ? "border-red-500" : ""} /><FieldError error={rateErrors.score} /></div>
            <div><Label>Comment (optional)</Label><Textarea value={rateForm.comment} onChange={(e) => setRateForm({ ...rateForm, comment: e.target.value })} rows={3} /></div>
          </div>
          <DialogFooter><Button onClick={handleRate} disabled={rateMutation.isPending}>Submit Rating</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Score Detail Dialog */}
      <Dialog open={!!detailItem} onOpenChange={(o) => { if (!o) setDetailItem(null); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>Score Details</DialogTitle></DialogHeader>
          {detailItem && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div><p className="font-medium">{detailItem.employees?.users?.firstName} {detailItem.employees?.users?.lastName}</p><p className="text-sm text-muted-foreground">{detailItem.employees?.departments?.name}</p></div>
                <div className="text-right"><p className={`text-2xl font-bold ${getScoreColor(detailItem.compositeScore)}`}>{detailItem.compositeScore.toFixed(1)}</p><div className="flex items-center gap-1 justify-end">{trendIcons[detailItem.trend]}<Badge variant="outline" className={trendColors[detailItem.trend]}>{detailItem.trend}</Badge></div></div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-lg border p-3"><p className="text-muted-foreground">Task Score</p><p className="text-lg font-semibold">{detailItem.taskScore.toFixed(1)}</p></div>
                <div className="rounded-lg border p-3"><p className="text-muted-foreground">Attendance Score</p><p className="text-lg font-semibold">{detailItem.attendanceScore.toFixed(1)}</p></div>
                <div className="rounded-lg border p-3"><p className="text-muted-foreground">EOD Score</p><p className="text-lg font-semibold">{detailItem.eodScore.toFixed(1)}</p></div>
                <div className="rounded-lg border p-3"><p className="text-muted-foreground">Manager Score</p><p className="text-lg font-semibold">{detailItem.managerScore.toFixed(1)}</p></div>
              </div>
              <div className="text-sm text-muted-foreground"><p>Period: {detailItem.period} ({detailItem.periodType})</p><p>Calculated: {format(new Date(detailItem.calculatedAt), "MMM d, yyyy HH:mm")}</p></div>
              {detailItem.managerRatings && detailItem.managerRatings.length > 0 && (
                <div className="space-y-2"><h4 className="text-sm font-medium">Manager Ratings</h4>
                  {detailItem.managerRatings.map((r) => <div key={r.id} className="flex items-center justify-between text-sm rounded border p-2"><span>{r.employees?.users?.firstName} {r.employees?.users?.lastName}: {r.score}/10</span>{r.comment && <span className="text-muted-foreground">{r.comment}</span>}</div>)}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
