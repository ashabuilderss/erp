"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useActiveIncentives,
  useCreateIncentive,
  useCurrentUser,
  useIncentives,
  useUpdateIncentive,
  useLeaderboard,
} from "@/hooks/api";
import { Gift, Plus, Banknote, Trophy, Medal } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";

const MEDAL_EMOJIS = ["🥇", "🥈", "🥉"];

export default function IncentivesPage() {
  const { data: currentUser } = useCurrentUser();
  const role = currentUser?.user?.role;
  const canManage = role === "OWNER" || role === "ADMIN";
  const { data: managed } = useIncentives();
  const { data: active } = useActiveIncentives();
  const { data: leaderboard } = useLeaderboard();
  const createIncentive = useCreateIncentive();
  const updateIncentive = useUpdateIncentive();
  const [form, setForm] = useState({
    title: "",
    description: "",
    award: "",
    opportunityLabel: "",
  });

  const incentives = Array.isArray(canManage ? managed : active)
    ? (canManage ? managed : active)
    : [];

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Incentives & Leaderboard</h2>
          <p className="text-sm text-muted-foreground">
            Active announcements, winners, and performance rankings
          </p>
        </div>
      </div>

      <Tabs defaultValue="incentives">
        <TabsList>
          <TabsTrigger value="incentives">
            <Gift className="mr-1 h-4 w-4" />
            Incentives
          </TabsTrigger>
          <TabsTrigger value="leaderboard">
            <Trophy className="mr-1 h-4 w-4" />
            Leaderboard
          </TabsTrigger>
        </TabsList>

        <TabsContent value="incentives" className="space-y-6">
          {canManage && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">New Announcement</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3 md:grid-cols-2">
                <Input
                  placeholder="Title"
                  value={form.title}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, title: event.target.value }))
                  }
                />
                <Input
                  placeholder="Award"
                  value={form.award}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, award: event.target.value }))
                  }
                />
                <Input
                  placeholder="Opportunity label"
                  value={form.opportunityLabel}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      opportunityLabel: event.target.value,
                    }))
                  }
                />
                <Textarea
                  className="md:col-span-2"
                  placeholder="Description"
                  value={form.description}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      description: event.target.value,
                    }))
                  }
                />
                <Button
                  className="md:w-fit"
                  disabled={
                    createIncentive.isPending ||
                    !form.title ||
                    !form.description ||
                    !form.award
                  }
                  onClick={() =>
                    createIncentive.mutate({
                      ...form,
                      status: "ACTIVE",
                      opportunityType: "MANUAL",
                    })
                  }
                >
                  <Plus className="mr-1 h-4 w-4" />
                  Publish
                </Button>
              </CardContent>
            </Card>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            {incentives?.map((item) => (
              <Card key={item.id}>
                <CardContent className="space-y-3 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold">{item.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {item.description}
                      </p>
                    </div>
                    <Badge>{item.status}</Badge>
                  </div>
                  <div className="rounded-md bg-muted p-3 text-sm">
                    <div className="font-medium">{item.award}</div>
                    {item.opportunityLabel && (
                      <div className="text-muted-foreground">
                        {item.opportunityType}: {item.opportunityLabel}
                      </div>
                    )}
                    {item.winner && (
                      <div className="text-muted-foreground">
                        Winner: {item.winner.employeeCode}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <Badge variant="outline">{item.payoutStatus}</Badge>
                    {canManage && item.status === "ACTIVE" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          updateIncentive.mutate({
                            id: item.id,
                            dto: { status: "CLOSED" },
                          })
                        }
                      >
                        Close
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
            {incentives?.length === 0 && (
              <EmptyState icon={<Banknote className="h-12 w-12" />} title="No incentive announcements yet" description="Incentive announcements will appear here once published" />
            )}
          </div>
        </TabsContent>

        <TabsContent value="leaderboard" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Trophy className="h-5 w-5 text-amber-500" />
                Performance Rankings
              </CardTitle>
            </CardHeader>
            <CardContent>
              {leaderboard && leaderboard.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10">#</TableHead>
                      <TableHead>Employee</TableHead>
                      <TableHead className="text-right">Incentives</TableHead>
                      <TableHead className="text-right">Commissions</TableHead>
                      <TableHead className="text-right">Score</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leaderboard.map((entry, idx) => (
                      <TableRow key={entry.employeeId}>
                        <TableCell className="text-lg">
                          {idx < 3 ? MEDAL_EMOJIS[idx] : idx + 1}
                        </TableCell>
                        <TableCell>
                          <div>
                            <span className="font-medium">{entry.employeeName}</span>
                            <span className="ml-2 text-xs text-muted-foreground">
                              {entry.employeeCode}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="text-sm">{entry.incentivesWon} won</div>
                          <div className="text-xs text-muted-foreground">
                            ₹{entry.incentivesValue.toLocaleString()}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="text-sm">{entry.commissionsPaid} paid</div>
                          <div className="text-xs text-muted-foreground">
                            ₹{entry.commissionTotal.toLocaleString()}
                          </div>
                        </TableCell>
                        <TableCell className="text-right text-lg font-bold">
                          {entry.totalScore.toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <EmptyState
                  icon={<Medal className="h-12 w-12" />}
                  title="No rankings yet"
                  description="Scores appear when incentives are won or commissions are paid"
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
