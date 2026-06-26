"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useCurrentCompany, useUpdateCompany } from "@/hooks/api/useCompanies";
import { useSession } from "next-auth/react";
import { api, getApiErrorMessage } from "@/lib/api";
import { ShieldCheck, ShieldOff, Copy, Check } from "lucide-react";

export default function SettingsPage() {
  const { data: session } = useSession();
  const { data: company, isLoading } = useCurrentCompany();
  const updateCompany = useUpdateCompany();
  const [draftName, setDraftName] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const name = draftName ?? company?.name ?? "";

  const [totpEnabled, setTotpEnabled] = useState(false);
  const [totpLoading, setTotpLoading] = useState(false);
  const [setupData, setSetupData] = useState<{ secret: string; qrCodeUrl: string; otpauthUrl: string } | null>(null);
  const [verifyCode, setVerifyCode] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[] | null>(null);
  const [showCodes, setShowCodes] = useState(false);
  const [disablePassword, setDisablePassword] = useState("");
  const [copied, setCopied] = useState(false);

  async function fetchTotpStatus() {
    try {
      const data = await api.get<{ user: { totpEnabled: boolean } }>("/auth/me");
      setTotpEnabled(data.user.totpEnabled);
    } catch {
      /* ignore */
    }
  }

  useEffect(() => { fetchTotpStatus(); }, []);

  const handleSetup = async () => {
    setTotpLoading(true);
    try {
      const data = await api.post<{ secret: string; qrCodeUrl: string; otpauthUrl: string }>("/auth/2fa/setup");
      setSetupData(data);
      setMsg(null);
    } catch (err) {
      setMsg({ type: "error", text: getApiErrorMessage(err, "Failed to setup 2FA") });
    } finally {
      setTotpLoading(false);
    }
  };

  const handleVerify = async () => {
    setTotpLoading(true);
    try {
      await api.post("/auth/2fa/verify", { token: verifyCode });
      setTotpEnabled(true);
      setSetupData(null);
      setVerifyCode("");
      setMsg({ type: "success", text: "2FA enabled successfully" });
    } catch (err) {
      setMsg({ type: "error", text: getApiErrorMessage(err, "Invalid verification code") });
    } finally {
      setTotpLoading(false);
    }
  };

  const handleDisable = async () => {
    setTotpLoading(true);
    try {
      await api.post("/auth/2fa/disable", { password: disablePassword });
      setTotpEnabled(false);
      setDisablePassword("");
      setMsg({ type: "success", text: "2FA disabled" });
    } catch (err) {
      setMsg({ type: "error", text: getApiErrorMessage(err, "Failed to disable 2FA") });
    } finally {
      setTotpLoading(false);
    }
  };

  const handleBackupCodes = async () => {
    setTotpLoading(true);
    try {
      const data = await api.post<{ backupCodes: string[] }>("/auth/2fa/backup-codes");
      setBackupCodes(data.backupCodes);
      setShowCodes(true);
      setMsg(null);
    } catch (err) {
      setMsg({ type: "error", text: getApiErrorMessage(err, "Failed to generate backup codes") });
    } finally {
      setTotpLoading(false);
    }
  };

  const copyBackupCodes = async () => {
    if (!backupCodes) return;
    await navigator.clipboard.writeText(backupCodes.join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {totpEnabled ? <ShieldCheck className="h-5 w-5 text-green-600" /> : <ShieldOff className="h-5 w-5 text-muted-foreground" />}
            Two-Factor Authentication
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {msg && (
            <p className={`text-sm ${msg.type === "success" ? "text-green-600" : "text-red-600"}`}>{msg.text}</p>
          )}

          {!setupData && !totpEnabled && (
            <div>
              <p className="text-sm text-muted-foreground mb-3">Add an extra layer of security to your account</p>
              <Button onClick={handleSetup} disabled={totpLoading}>
                {totpLoading ? "Setting up..." : "Enable Two-Factor Authentication"}
              </Button>
            </div>
          )}

          {setupData && (
            <div className="space-y-4">
              <p className="text-sm font-medium">Scan this QR code with your authenticator app:</p>
              <div className="flex justify-center">
                <img src={setupData.qrCodeUrl} alt="TOTP QR Code" className="w-48 h-48 border rounded" />
              </div>
              <div>
                <p className="text-sm font-medium mb-1">Or enter this secret key manually:</p>
                <code className="block p-2 bg-muted rounded text-xs break-all">{setupData.secret}</code>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Verify by entering a code from your authenticator app:</label>
                <div className="flex gap-2">
                  <Input
                    value={verifyCode}
                    onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="000000"
                    maxLength={6}
                    className="w-32 text-center text-lg tracking-widest"
                  />
                  <Button onClick={handleVerify} disabled={verifyCode.length !== 6 || totpLoading}>
                    {totpLoading ? "Verifying..." : "Verify"}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {totpEnabled && !showCodes && (
            <div className="space-y-3">
              <p className="text-sm text-green-600 font-medium">Two-factor authentication is enabled</p>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleBackupCodes} disabled={totpLoading}>
                  Generate Backup Codes
                </Button>
                <Button variant="destructive" onClick={() => setShowCodes(true)} disabled={totpLoading}>
                  Disable 2FA
                </Button>
              </div>
            </div>
          )}

          {totpEnabled && showCodes && backupCodes && (
            <div className="space-y-3">
              <p className="text-sm font-medium">Save these backup codes in a secure place:</p>
              <div className="relative">
                <code className="block p-3 bg-muted rounded text-xs font-mono whitespace-pre leading-relaxed">
                  {backupCodes.join("\n")}
                </code>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={copyBackupCodes}
                >
                  {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => { setShowCodes(false); setBackupCodes(null); }}>
                  Done
                </Button>
                <Button variant="outline" onClick={handleBackupCodes} disabled={totpLoading}>
                  Regenerate
                </Button>
              </div>
            </div>
          )}

          {totpEnabled && showCodes && !backupCodes && !setupData && (
            <div className="space-y-3">
              <p className="text-sm text-destructive font-medium">Disable two-factor authentication</p>
              <p className="text-sm text-muted-foreground">Enter your password to disable 2FA</p>
              <div className="flex gap-2">
                <Input
                  type="password"
                  value={disablePassword}
                  onChange={(e) => setDisablePassword(e.target.value)}
                  placeholder="Enter your password"
                />
                <Button variant="destructive" onClick={handleDisable} disabled={!disablePassword || totpLoading}>
                  Disable
                </Button>
              </div>
              <Button variant="link" size="sm" onClick={() => setShowCodes(false)}>
                Cancel
              </Button>
            </div>
          )}
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
