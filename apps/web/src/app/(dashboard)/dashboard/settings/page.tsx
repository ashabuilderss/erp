"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useCurrentCompany, useUpdateCompany } from "@/hooks/api/useCompanies";
import { useSession } from "next-auth/react";

export default function SettingsPage() {
  const { data: session } = useSession();
  const { data: company, isLoading } = useCurrentCompany();
  const updateCompany = useUpdateCompany();
  const [draftName, setDraftName] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const name = draftName ?? company?.name ?? "";

  const handleSave = async () => {
    try {
      await updateCompany.mutateAsync({ name });
      setMsg({ type: "success", text: "Company updated" });
    } catch {
      setMsg({ type: "error", text: "Failed to update company" });
    }
    setTimeout(() => setMsg(null), 3000);
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div><h2 className="text-2xl font-semibold">Settings</h2><p className="text-sm text-muted-foreground">Manage your application settings</p></div>

      <Card>
        <CardHeader><CardTitle>Company Information</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div>
            <label className="text-sm font-medium">Company Name</label>
            <Input value={name} onChange={(e) => setDraftName(e.target.value)} disabled={isLoading} />
          </div>
          <div>
            <label className="text-sm font-medium">Slug</label>
            <Input value={company?.slug || ""} disabled />
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={handleSave} disabled={updateCompany.isPending}>
              {updateCompany.isPending ? "Saving..." : "Save Changes"}
            </Button>
            {msg && <span className={`text-sm ${msg.type === "success" ? "text-green-600" : "text-red-600"}`}>{msg.text}</span>}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Account</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm">Signed in as <span className="font-medium">{session?.user?.email}</span></p>
          <p className="text-sm text-muted-foreground">Role: <span className="font-medium capitalize">{String(session?.user?.role || "N/A").toLowerCase().replace("_", " ")}</span></p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Danger Zone</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-3">Irreversible actions</p>
          <Button variant="destructive">Reset All Data</Button>
        </CardContent>
      </Card>
    </div>
  );
}
