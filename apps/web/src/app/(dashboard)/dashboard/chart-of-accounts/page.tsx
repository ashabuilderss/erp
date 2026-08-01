"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { getApiErrorMessage } from "@/lib/api";
import { BookOpen, Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import {
  useChartOfAccounts,
  useCreateChartOfAccount,
  useUpdateChartOfAccount,
  useDeleteChartOfAccount,
} from "@/hooks/api";
import type { ChartOfAccount } from "@/hooks/api";

const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  ASSET: "Asset",
  LIABILITY: "Liability",
  EQUITY: "Equity",
  INCOME: "Income",
  EXPENSE: "Expense",
};

const ACCOUNT_TYPE_VARIANTS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  ASSET: "default",
  LIABILITY: "destructive",
  EQUITY: "secondary",
  INCOME: "outline",
  EXPENSE: "secondary",
};

export default function ChartOfAccountsPage() {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ code: "", name: "", type: "ASSET", parentId: "", description: "" });
  const [search, setSearch] = useState("");

  const { data, isLoading } = useChartOfAccounts({ search: search || undefined });
  const createMutation = useCreateChartOfAccount();
  const updateMutation = useUpdateChartOfAccount();
  const deleteMutation = useDeleteChartOfAccount();
  const { showToast } = useToast();

  const accounts = Array.isArray(data) ? data : (data as any)?.items ?? [];

  const resetForm = () => {
    setForm({ code: "", name: "", type: "ASSET", parentId: "", description: "" });
    setEditingId(null);
    setShowForm(false);
  };

  const handleSubmit = () => {
    if (!form.code || !form.name) {
      showToast("Code and name are required", "error");
      return;
    }
    const payload = { code: form.code, name: form.name, type: form.type as ChartOfAccount["type"], parentId: form.parentId || undefined, description: form.description || undefined };
    if (editingId) {
      updateMutation.mutate(
        { id: editingId, ...payload },
        { onSuccess: () => { showToast("Account updated"); resetForm(); }, onError: (err) => showToast(getApiErrorMessage(err, "Failed to update"), "error") },
      );
    } else {
      createMutation.mutate(
        payload,
        { onSuccess: () => { showToast("Account created"); resetForm(); }, onError: (err) => showToast(getApiErrorMessage(err, "Failed to create"), "error") },
      );
    }
  };

  const handleEdit = (account: ChartOfAccount) => {
    setForm({ code: account.code, name: account.name, type: account.type, parentId: account.parentId || "", description: account.description || "" });
    setEditingId(account.id);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id, {
      onSuccess: () => showToast("Account deleted"),
      onError: (err) => showToast(getApiErrorMessage(err, "Failed to delete"), "error"),
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">Chart of Accounts</h2>
          <p className="text-sm text-muted-foreground">Manage financial account codes and classifications</p>
        </div>
        <Button onClick={() => { resetForm(); setShowForm(!showForm); }}>
          <Plus className="h-4 w-4 mr-1" />{showForm ? "Cancel" : "Add Account"}
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader><CardTitle className="text-lg">{editingId ? "Edit Account" : "New Account"}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <div><label className="text-sm font-medium">Code *</label><Input value={form.code} onChange={(e) => setForm(p => ({ ...p, code: e.target.value }))} placeholder="e.g. 1000" /></div>
              <div><label className="text-sm font-medium">Name *</label><Input value={form.name} onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Cash - Petty" /></div>
              <div><label className="text-sm font-medium">Type</label>
                <Select value={form.type} onValueChange={(v) => setForm(p => ({ ...p, type: v || "ASSET" }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(ACCOUNT_TYPE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-sm font-medium">Parent Account</label>
                <Select value={form.parentId} onValueChange={(v) => setForm(p => ({ ...p, parentId: v || "" }))}>
                  <SelectTrigger><SelectValue placeholder="None (top-level)" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None (top-level)</SelectItem>
                    {accounts.filter((a: ChartOfAccount) => a.id !== editingId).map((a: ChartOfAccount) => (
                      <SelectItem key={a.id} value={a.id}>{a.code} — {a.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div><label className="text-sm font-medium">Description</label><Input value={form.description} onChange={(e) => setForm(p => ({ ...p, description: e.target.value }))} /></div>
            </div>
            <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}>
              {(createMutation.isPending || updateMutation.isPending) ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : null}
              {editingId ? "Update" : "Create"}
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="flex items-center gap-2">
        <Input placeholder="Search accounts by code or name..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm" />
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-14 bg-muted/50 rounded animate-pulse" />)}
        </div>
      ) : accounts.length === 0 ? (
        <Card><CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground"><BookOpen className="h-12 w-12 mb-3" /><p className="font-medium">No accounts</p><p className="text-sm">Create your first account to start building your chart of accounts</p></CardContent></Card>
      ) : (
        <div className="space-y-2">
          {accounts.map((a: ChartOfAccount) => (
            <Card key={a.id}>
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3 flex-1">
                  <span className="text-sm font-mono font-semibold text-muted-foreground w-16">{a.code}</span>
                  <div className="flex-1">
                    <p className="font-medium">{a.name}</p>
                    {a.description && <p className="text-xs text-muted-foreground">{a.description}</p>}
                  </div>
                  <Badge variant={ACCOUNT_TYPE_VARIANTS[a.type]}>{ACCOUNT_TYPE_LABELS[a.type]}</Badge>
                  {a.parent && <span className="text-xs text-muted-foreground">→ {a.parent.code}</span>}
                  {!a.isActive && <Badge variant="outline" className="text-xs">Inactive</Badge>}
                </div>
                <div className="flex items-center gap-1">
                  <Button size="sm" variant="ghost" onClick={() => handleEdit(a)}><Pencil className="h-4 w-4" /></Button>
                  <Button size="sm" variant="ghost" className="text-red-500" onClick={() => handleDelete(a.id)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
