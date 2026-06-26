"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useCurrentCompany, useUpdateCompany } from "@/hooks/api/useCompanies";
import { Building2, Globe, Mail, Phone } from "lucide-react";

export default function CompanySettingsPage() {
  const { data: company, isLoading } = useCurrentCompany();
  const updateCompany = useUpdateCompany();
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const currentSettings = (company?.settings as Record<string, string>) || {};

  const handleSave = async () => {
    try {
      await updateCompany.mutateAsync({ settings });
      setMsg({ type: "success", text: "Company settings saved" });
    } catch {
      setMsg({ type: "error", text: "Failed to save settings" });
    }
    setTimeout(() => setMsg(null), 3000);
  };

  const getVal = (key: string) => settings[key] ?? currentSettings[key] ?? "";

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-2xl font-semibold text-foreground">Company Settings</h2>
        <p className="text-sm text-muted-foreground">Manage company-wide configuration</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Company Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">Company Name</label>
            <Input value={company?.name || ""} disabled />
          </div>
          <div>
            <label className="text-sm font-medium">Slug</label>
            <Input value={company?.slug || ""} disabled />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Contact Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              Phone
            </label>
            <Input
              value={getVal("phone")}
              onChange={(e) => setSettings(prev => ({ ...prev, phone: e.target.value }))}
              placeholder="+1 (555) 123-4567"
            />
          </div>
          <div>
            <label className="text-sm font-medium flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              Email
            </label>
            <Input
              value={getVal("email")}
              onChange={(e) => setSettings(prev => ({ ...prev, email: e.target.value }))}
              placeholder="company@example.com"
            />
          </div>
          <div>
            <label className="text-sm font-medium flex items-center gap-2">
              <Globe className="h-4 w-4 text-muted-foreground" />
              Address
            </label>
            <Textarea
              value={getVal("address")}
              onChange={(e) => setSettings(prev => ({ ...prev, address: e.target.value }))}
              placeholder="123 Business St, City, State"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center gap-3">
        <Button onClick={handleSave} disabled={updateCompany.isPending}>
          {updateCompany.isPending ? "Saving..." : "Save Changes"}
        </Button>
        {msg && (
          <span className={`text-sm ${msg.type === "success" ? "text-green-600" : "text-red-600"}`}>
            {msg.text}
          </span>
        )}
      </div>
    </div>
  );
}
