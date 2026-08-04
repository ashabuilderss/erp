"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useCurrentCompany, useUpdateCompany, useCompanySettings, useUpdateCompanySettings } from "@/hooks/api/useCompanies";
import { useSession } from "next-auth/react";
import { api, getApiErrorMessage } from "@/lib/api";
import { ShieldCheck, ShieldOff, Copy, Check, KeyRound, AlertTriangle, Shield, Bug, Clock, Lock, Fingerprint, Gauge } from "lucide-react";

export default function SettingsPage() {
  const { data: session } = useSession();
  const role = session?.user?.role;
  const isAdmin = role === "OWNER" || role === "ADMIN";

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
  const [disableStep, setDisableStep] = useState<"idle" | "codes" | "password">("idle");
  const [disablePassword, setDisablePassword] = useState("");
  const [copied, setCopied] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordMsg, setPasswordMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordShow, setPasswordShow] = useState(false);
  const [draftSettings, setDraftSettings] = useState<Record<string, number>>({});

  const { data: settings, isLoading: settingsLoading } = useCompanySettings();
  const updateSettings = useUpdateCompanySettings();

  const handleToggleSetting = (key: string, value: boolean) => {
    updateSettings.mutate({ [key]: value });
  };

  const handleSetting = (key: string, value: number) => {
    updateSettings.mutate({ [key]: value });
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: "error", text: "Passwords do not match" });
      return;
    }
    if (newPassword.length < 8) {
      setPasswordMsg({ type: "error", text: "New password must be at least 8 characters" });
      return;
    }
    setPasswordLoading(true);
    try {
      await api.post("/auth/change-password", { currentPassword, newPassword });
      setPasswordMsg({ type: "success", text: "Password changed successfully" });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setPasswordMsg({ type: "error", text: getApiErrorMessage(err, "Failed to change password") });
    } finally {
      setPasswordLoading(false);
    }
  };

  useEffect(() => {
    api.get<{ user: { totpEnabled: boolean } }>("/auth/me")
      .then(data => setTotpEnabled(data.user.totpEnabled))
      .catch(() => {});
  }, []);

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <AlertTriangle className="h-12 w-12 text-yellow-500 mb-4" />
        <h2 className="text-2xl font-semibold mb-2">Access Denied</h2>
        <p className="text-muted-foreground">You don&apos;t have permission to access this page.</p>
      </div>
    );
  }

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
      setDisableStep("idle");
      setMsg({ type: "success", text: "2FA disabled" });
    } catch (err) {
      setMsg({ type: "error", text: getApiErrorMessage(err, "Failed to disable 2FA") });
    } finally {
      setTotpLoading(false);
    }
  };

  const handleDisableStart = async () => {
    setDisableStep("codes");
    setMsg(null);
    setTotpLoading(true);
    try {
      const data = await api.post<{ backupCodes: string[] }>("/auth/2fa/backup-codes");
      setBackupCodes(data.backupCodes);
    } catch (err) {
      setMsg({ type: "error", text: getApiErrorMessage(err, "Failed to generate backup codes") });
      setDisableStep("idle");
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
        <CardHeader><CardTitle>Change Password</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div>
            <label className="text-sm font-medium">Current Password</label>
            <Input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter current password"
            />
          </div>
          <div>
            <label className="text-sm font-medium">New Password</label>
            <Input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password (min 8 characters)"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Confirm New Password</label>
            <Input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
            />
          </div>
          {passwordMsg && (
            <p className={`text-sm ${passwordMsg.type === "success" ? "text-green-600" : "text-red-600"}`}>{passwordMsg.text}</p>
          )}
          <Button onClick={handleChangePassword} disabled={!currentPassword || !newPassword || !confirmPassword || passwordLoading}>
            {passwordLoading ? "Updating..." : "Change Password"}
          </Button>
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
                <Button variant="destructive" onClick={handleDisableStart} disabled={totpLoading}>
                  Disable 2FA
                </Button>
              </div>
            </div>
          )}

          {totpEnabled && showCodes && backupCodes && disableStep !== "password" && (
            <div className="space-y-3">
              <p className="text-sm font-medium">
                {disableStep === "codes"
                      ? "Save these backup codes before disabling 2FA. You’ll need them if you ever lose access to your authenticator app."
                  : "Save these backup codes in a secure place:"}
              </p>
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
                {disableStep === "codes" ? (
                  <>
                    <Button onClick={() => setDisableStep("password")}>
                      I&apos;ve saved these codes, continue
                    </Button>
                    <Button variant="outline" onClick={handleBackupCodes} disabled={totpLoading}>
                      Regenerate
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="outline" onClick={() => { setShowCodes(false); setBackupCodes(null); }}>
                      Done
                    </Button>
                    <Button variant="outline" onClick={handleBackupCodes} disabled={totpLoading}>
                      Regenerate
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}

          {totpEnabled && showCodes && disableStep === "password" && (
            <div className="space-y-3">
              <p className="text-sm text-destructive font-medium">Disable two-factor authentication</p>
              <p className="text-sm text-muted-foreground">Enter your password to confirm disabling 2FA</p>
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
              <Button variant="link" size="sm" onClick={() => { setShowCodes(false); setDisableStep("idle"); setBackupCodes(null); }}>
                Cancel
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security Center
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">System-wide security and logging preferences</p>

          <div className="space-y-4">
            <label className="flex items-center justify-between rounded-lg border p-3 cursor-pointer hover:bg-muted/50">
              <div className="flex items-start gap-3">
                <Bug className="h-5 w-5 mt-0.5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Debug Logging</p>
                  <p className="text-xs text-muted-foreground">Enable verbose logging for troubleshooting</p>
                </div>
              </div>
              <Button
                variant={settings?.debugLogging ? "default" : "outline"}
                size="sm"
                onClick={() => handleToggleSetting("debugLogging", !settings?.debugLogging)}
              >
                {settings?.debugLogging ? "Enabled" : "Disabled"}
              </Button>
            </label>

            <label className="flex items-center justify-between rounded-lg border p-3 cursor-pointer hover:bg-muted/50">
              <div className="flex items-start gap-3">
                <Lock className="h-5 w-5 mt-0.5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Encrypt Sensitive Fields</p>
                  <p className="text-xs text-muted-foreground">Encrypt sensitive company data at rest</p>
                </div>
              </div>
              <Button
                variant={settings?.encryptSensitiveFields ? "default" : "outline"}
                size="sm"
                onClick={() => handleToggleSetting("encryptSensitiveFields", !settings?.encryptSensitiveFields)}
              >
                {settings?.encryptSensitiveFields ? "Enabled" : "Disabled"}
              </Button>
            </label>

            <label className="flex items-center justify-between rounded-lg border p-3 cursor-pointer hover:bg-muted/50">
              <div className="flex items-start gap-3">
                <Fingerprint className="h-5 w-5 mt-0.5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Require MFA</p>
                  <p className="text-xs text-muted-foreground">Force all users to enable two-factor authentication</p>
                </div>
              </div>
              <Button
                variant={settings?.mfaRequired ? "default" : "outline"}
                size="sm"
                onClick={() => handleToggleSetting("mfaRequired", !settings?.mfaRequired)}
              >
                {settings?.mfaRequired ? "Required" : "Optional"}
              </Button>
            </label>

            <div className="rounded-lg border p-3">
              <div className="flex items-start gap-3 mb-2">
                <Clock className="h-5 w-5 mt-0.5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Session Timeout</p>
                  <p className="text-xs text-muted-foreground">Minutes before idle users are logged out</p>
                </div>
              </div>
              <div className="flex items-center gap-2 ml-8">
                <Input
                  type="number"
                  min={5}
                  max={1440}
                  value={settings?.sessionTimeoutMinutes ?? 60}
                  onChange={(e) => {
                    const v = parseInt(e.target.value) || 60;
                    setDraftSettings(prev => ({ ...prev, sessionTimeoutMinutes: Math.max(5, Math.min(1440, v)) }));
                  }}
                  className="w-24"
                />
                <span className="text-sm text-muted-foreground">minutes</span>
                {draftSettings.sessionTimeoutMinutes !== undefined && draftSettings.sessionTimeoutMinutes !== settings?.sessionTimeoutMinutes && (
                  <Button size="sm" onClick={() => handleSetting("sessionTimeoutMinutes", draftSettings.sessionTimeoutMinutes)}>Save</Button>
                )}
              </div>
            </div>

            <div className="rounded-lg border p-3">
              <div className="flex items-start gap-3 mb-2">
                <Gauge className="h-5 w-5 mt-0.5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Password Policy</p>
                  <p className="text-xs text-muted-foreground">Minimum length and complexity requirements</p>
                </div>
              </div>
              <div className="space-y-2 ml-8">
                <div className="flex items-center gap-2">
                  <span className="text-sm w-28">Min length</span>
                  <Input
                    type="number"
                    min={4}
                    max={128}
                    value={settings?.passwordMinLength ?? 8}
                    onChange={(e) => setDraftSettings(prev => ({ ...prev, passwordMinLength: parseInt(e.target.value) || 8 }))}
                    className="w-20"
                  />
                  <span className="text-sm text-muted-foreground">chars</span>
                </div>
                <label className="flex items-center justify-between rounded cursor-pointer hover:bg-muted/50 p-1.5">
                  <span className="text-sm">Require special character</span>
                  <Button
                    variant={settings?.passwordRequireSpecialChar ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleToggleSetting("passwordRequireSpecialChar", !settings?.passwordRequireSpecialChar)}
                  >
                    {settings?.passwordRequireSpecialChar ? "On" : "Off"}
                  </Button>
                </label>
              </div>
            </div>

            <div className="rounded-lg border p-3">
              <div className="flex items-start gap-3 mb-2">
                <Lock className="h-5 w-5 mt-0.5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Max Login Attempts</p>
                  <p className="text-xs text-muted-foreground">Account lockout threshold (1-100)</p>
                </div>
              </div>
              <div className="flex items-center gap-2 ml-8">
                <Input
                  type="number"
                  min={1}
                  max={100}
                  value={settings?.maxLoginAttempts ?? 5}
                  onChange={(e) => setDraftSettings(prev => ({ ...prev, maxLoginAttempts: parseInt(e.target.value) || 5 }))}
                  className="w-20"
                />
                <span className="text-sm text-muted-foreground">attempts</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Danger Zone</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-3">Irreversible actions</p>
          <Button variant="destructive" disabled>
            Reset All Data
          </Button>
          <p className="text-xs text-muted-foreground mt-2">This feature is not yet implemented.</p>
        </CardContent>
      </Card>
    </div>
  );
}
