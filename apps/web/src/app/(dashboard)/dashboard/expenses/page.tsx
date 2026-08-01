"use client";

import { useState } from "react";
import {
  useCurrentUser,
  useExpenseClaims,
  useMyExpenseClaims,
  useCreateExpenseClaim,
  useApproveExpenseClaim,
  useRejectExpenseClaim,
} from "@/hooks/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Receipt, Plus, CheckCircle, XCircle } from "lucide-react";

export default function ExpensesPage() {
  const { data: currentUser } = useCurrentUser();
  const role = currentUser?.user?.role;
  const isOwnerOrAdmin = role === "OWNER" || role === "ADMIN";
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ amount: "", category: "", description: "", expenseDate: "" });

  const allClaimsQuery = useExpenseClaims();
  const myClaimsQuery = useMyExpenseClaims();
  const claimsData = isOwnerOrAdmin ? allClaimsQuery.data : myClaimsQuery.data;
  const claims = Array.isArray(claimsData) ? claimsData : (claimsData as any)?.data;

  const createClaim = useCreateExpenseClaim();
  const approveMutation = useApproveExpenseClaim();
  const rejectMutation = useRejectExpenseClaim();

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">Expense Claims</h2>
          <p className="text-sm text-muted-foreground">{isOwnerOrAdmin ? "Manage and approve expense claims" : "Submit your expense claims"}</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="h-4 w-4 mr-1" />New Claim
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader><CardTitle className="text-lg">New Expense Claim</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-sm font-medium">Amount</label><Input type="number" value={form.amount} onChange={(e) => setForm(p => ({ ...p, amount: e.target.value }))} /></div>
              <div><label className="text-sm font-medium">Category</label>
                <Select value={form.category} onValueChange={(v) => setForm(p => ({ ...p, category: v || "" }))}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Travel">Travel</SelectItem>
                    <SelectItem value="Fuel">Fuel</SelectItem>
                    <SelectItem value="Food">Food</SelectItem>
                    <SelectItem value="Office Supplies">Office Supplies</SelectItem>
                    <SelectItem value="Utilities">Utilities</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div><label className="text-sm font-medium">Description</label><Input value={form.description} onChange={(e) => setForm(p => ({ ...p, description: e.target.value }))} /></div>
            <div><label className="text-sm font-medium">Date</label><Input type="date" value={form.expenseDate} onChange={(e) => setForm(p => ({ ...p, expenseDate: e.target.value }))} /></div>
            <Button
              onClick={() =>
                createClaim.mutate(
                  {
                    amount: parseFloat(form.amount),
                    category: form.category,
                    description: form.description || undefined,
                    expenseDate: form.expenseDate,
                  },
                  {
                    onSuccess: () => {
                      setShowForm(false);
                      setForm({ amount: "", category: "", description: "", expenseDate: "" });
                    },
                  }
                )
              }
              disabled={createClaim.isPending}
            >
              {createClaim.isPending ? "Submitting..." : "Submit Claim"}
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="space-y-2">
        {claims?.length === 0 ? (
          <Card><CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground"><Receipt className="h-12 w-12 mb-3" /><p className="font-medium">No expense claims</p></CardContent></Card>
        ) : (
          claims?.map((c: { id: string; amount: number; category: string; status: string; description?: string; expenseDate: string }) => (
            <Card key={c.id}>
              <CardContent className="flex items-start justify-between p-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">₹{Number(c.amount).toLocaleString()}</span>
                    <Badge variant="outline">{c.category}</Badge>
                    <Badge variant={c.status === "APPROVED" ? "default" : c.status === "REJECTED" ? "destructive" : "secondary"}>{c.status}</Badge>
                  </div>
                  {c.description && <p className="text-sm text-muted-foreground mt-1">{c.description}</p>}
                  <p className="text-xs text-muted-foreground mt-1">{new Date(c.expenseDate).toLocaleDateString()}</p>
                </div>
                {isOwnerOrAdmin && c.status === "PENDING" && (
                  <div className="flex items-center gap-2">
                    <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => approveMutation.mutate({ id: c.id })} disabled={approveMutation.isPending}>
                      <CheckCircle className="h-4 w-4 mr-1" />Approve
                    </Button>
                    <Button size="sm" variant="outline" className="text-red-600 border-red-200" onClick={() => rejectMutation.mutate({ id: c.id, status: "REJECTED" })} disabled={rejectMutation.isPending}>
                      <XCircle className="h-4 w-4 mr-1" />Reject
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
