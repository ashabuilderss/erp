"use client";

import { useState, useCallback } from "react";
import { useDeviceRegistrations, useMyDevices, useCreateDeviceRegistration, useDeleteDeviceRegistration } from "@/hooks/api";
import { useCurrentUser } from "@/hooks/api";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { Smartphone, Plus, Trash2, HardHat } from "lucide-react";
import { ListSkeleton } from "@/components/ui/skeleton-variants";
import { EmptyState } from "@/components/shared/empty-state";

function EmployeeDevicesView() {
  const { showToast } = useToast();
  const { data: devices, isLoading } = useMyDevices();
  const createMutation = useCreateDeviceRegistration();
  const deleteMutation = useDeleteDeviceRegistration();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ deviceName: "", deviceId: "" });
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const detectCurrentDevice = useCallback(() => {
    const ua = navigator.userAgent;
    const screenRes = `${screen.width}x${screen.height}`;
    const lang = navigator.language;
    const raw = `${ua}|${screenRes}|${lang}`;
    let hash = 0;
    for (let i = 0; i < raw.length; i++) { const c = raw.charCodeAt(i); hash = ((hash << 5) - hash) + c; hash |= 0; }
    const deviceId = `DEV-${Math.abs(hash).toString(16).toUpperCase().slice(0, 8)}`;
    const isMobile = /Android|iPhone|iPad|iPod|webOS/i.test(ua);
    const os = isMobile ? "Mobile" : /Windows/i.test(ua) ? "Windows" : /Mac/i.test(ua) ? "macOS" : /Linux/i.test(ua) ? "Linux" : "Unknown";
    const browser = /Chrome/i.test(ua) ? "Chrome" : /Firefox/i.test(ua) ? "Firefox" : /Safari/i.test(ua) ? "Safari" : /Edge/i.test(ua) ? "Edge" : "Browser";
    setForm({ deviceName: `${os} - ${browser}`, deviceId });
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">My Devices</h2>
          <p className="text-sm text-muted-foreground">Manage your registered devices</p>
        </div>
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setForm({ deviceName: "", deviceId: "" }); }}>
          <DialogTrigger render={<Button />}><Plus className="h-4 w-4" /> Register Device</DialogTrigger>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader><DialogTitle>Register Device</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <Button variant="outline" size="sm" onClick={detectCurrentDevice} className="w-full">
                <Smartphone className="h-4 w-4 mr-2" /> Detect Current Device
              </Button>
              <div>
                <label className="text-sm font-medium">Device Name</label>
                <Input value={form.deviceName} onChange={(e) => setForm({ ...form, deviceName: e.target.value })} placeholder="e.g. Office Laptop" />
              </div>
              <div>
                <label className="text-sm font-medium">Device ID</label>
                <Input value={form.deviceId} onChange={(e) => setForm({ ...form, deviceId: e.target.value })} placeholder="e.g. MAC-ADDR-001" />
              </div>
            </div>
            <DialogFooter showCloseButton>
              <Button onClick={() => {
                if (!form.deviceName || !form.deviceId) return;
                createMutation.mutate(form, {
                  onSuccess: () => { showToast("Device registered"); setOpen(false); setForm({ deviceName: "", deviceId: "" }); },
                  onError: (err: Error) => showToast(err.message || "Failed", "error"),
                });
              }} disabled={createMutation.isPending}>Register</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <ListSkeleton rows={4} />
      ) : devices && devices.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {devices.map((d) => (
            <Card key={d.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Smartphone className="h-8 w-8 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{d.deviceName}</p>
                      <p className="text-xs text-muted-foreground">{d.deviceId}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon-sm" onClick={() => setConfirmDelete(d.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
                <div className="mt-3">
                  {d.isTrusted ? (
                    <Badge variant="outline" className="bg-green-100 text-green-800">Trusted</Badge>
                  ) : (
                    <Badge variant="outline" className="bg-gray-100 text-gray-800">Untrusted</Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState icon={<HardHat className="h-12 w-12" />} title="No devices registered yet" description="Register a device to get started" />
      )}

      <ConfirmDialog
        open={!!confirmDelete}
        onOpenChange={(o) => { if (!o) setConfirmDelete(null); }}
        title="Remove Device"
        variant="destructive"
        onConfirm={() => {
          if (confirmDelete) {
            deleteMutation.mutate(confirmDelete, {
              onSuccess: () => showToast("Device removed"),
              onError: (err: Error) => showToast(err.message || "Failed", "error"),
            });
          }
          setConfirmDelete(null);
        }}
        loading={deleteMutation.isPending}
      >
        Remove this device?
      </ConfirmDialog>
    </div>
  );
}

function AdminDevicesView() {
  const { showToast } = useToast();
  const { data, isLoading } = useDeviceRegistrations();
  const { data: currentUser } = useCurrentUser();
  const role = currentUser?.user?.role;

  if (role === "ADMIN" || role === "HR_MANAGER") {
    const devices = data?.data ?? [];
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold">Device Registrations</h2>
          <p className="text-sm text-muted-foreground">View all registered devices</p>
        </div>
        {isLoading ? (
          <ListSkeleton rows={4} />
        ) : devices.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {devices.map((d) => (
              <Card key={d.id}>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <Smartphone className="h-8 w-8 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{d.deviceName}</p>
                      <p className="text-xs text-muted-foreground">{d.deviceId}</p>
                    </div>
                  </div>
                  <div className="mt-2">
                    {d.isTrusted ? (
                      <Badge variant="outline" className="bg-green-100 text-green-800">Trusted</Badge>
                    ) : (
                      <Badge variant="outline" className="bg-gray-100 text-gray-800">Untrusted</Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card><CardContent className="py-8 text-center text-sm text-muted-foreground">No devices registered</CardContent></Card>
        )}
      </div>
    );
  }

  return <EmployeeDevicesView />;
}

export default function DevicesPage() {
  return <AdminDevicesView />;
}
