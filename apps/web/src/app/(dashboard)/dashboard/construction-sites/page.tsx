"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, Eye, Building2, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { useSites, useSite, useCreateSite, useUpdateSite, useDeleteSite, useCreatePhase, useUpdatePhase, useDeletePhase, useSitePhotos, useCreateProgressPhoto, useDeleteProgressPhoto } from "@/hooks/api";
import { useCurrentUser } from "@/hooks/api";
import { useToast } from "@/components/ui/toast";
import { ProgressPhotoGallery } from "./ProgressPhotoGallery";
import { TableSkeleton, CardSkeleton } from "@/components/ui/skeleton-variants";
import type { ConstructionSite, SitePhase, ProgressPhoto, CreateSiteDto, SiteStatus, SitePhaseStatus } from "@/lib/types";
import { format } from "date-fns";

const siteStatusColors: Record<string, string> = {
  PLANNING: "bg-gray-100 text-gray-800",
  IN_PROGRESS: "bg-blue-100 text-blue-800",
  COMPLETED: "bg-green-100 text-green-800",
  ON_HOLD: "bg-yellow-100 text-yellow-800",
};

const phaseStatusColors: Record<string, string> = {
  PENDING: "bg-gray-100 text-gray-800",
  IN_PROGRESS: "bg-blue-100 text-blue-800",
  COMPLETED: "bg-green-100 text-green-800",
};

const siteStatuses: { value: SiteStatus; label: string }[] = [
  { value: "PLANNING", label: "Planning" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "COMPLETED", label: "Completed" },
  { value: "ON_HOLD", label: "On Hold" },
];

const phaseStatuses: { value: SitePhaseStatus; label: string }[] = [
  { value: "PENDING", label: "Pending" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "COMPLETED", label: "Completed" },
];

function SiteForm({ form, setForm }: { form: Partial<CreateSiteDto>; setForm: (f: Partial<CreateSiteDto>) => void }) {
  return (
    <div className="space-y-3">
      <div>
        <label className="text-sm font-medium">Name</label>
        <Input value={form.name || ""} onChange={(e) => setForm({ ...form, name: e.target.value })} />
      </div>
      <div>
        <label className="text-sm font-medium">Location</label>
        <Input value={form.location || ""} onChange={(e) => setForm({ ...form, location: e.target.value })} />
      </div>
      <div>
        <label className="text-sm font-medium">Status</label>
        <Select value={form.status || "PLANNING"} onValueChange={(v) => setForm({ ...form, status: v as SiteStatus })}>
          <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
          <SelectContent>
            {siteStatuses.map((s) => (
              <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium">Start Date</label>
          <Input type="date" value={form.startDate || ""} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
        </div>
        <div>
          <label className="text-sm font-medium">End Date</label>
          <Input type="date" value={form.endDate || ""} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
        </div>
      </div>
      <div>
        <label className="text-sm font-medium">Budget</label>
        <Input type="number" value={form.budget ?? ""} onChange={(e) => setForm({ ...form, budget: e.target.value ? Number(e.target.value) : undefined })} />
      </div>
      <div>
        <label className="text-sm font-medium">Description</label>
        <Input value={form.description || ""} onChange={(e) => setForm({ ...form, description: e.target.value })} />
      </div>
    </div>
  );
}

function PhaseForm({ form, setForm }: { form: { name: string; startDate: string; endDate: string; status: string; sortOrder: number }; setForm: React.Dispatch<React.SetStateAction<{ name: string; startDate: string; endDate: string; status: string; sortOrder: number }>> }) {
  return (
    <div className="space-y-3">
      <div>
        <label className="text-sm font-medium">Phase Name</label>
        <Input value={form.name || ""} onChange={(e) => setForm({ ...form, name: e.target.value })} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium">Start Date</label>
          <Input type="date" value={form.startDate || ""} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
        </div>
        <div>
          <label className="text-sm font-medium">End Date</label>
          <Input type="date" value={form.endDate || ""} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
        </div>
      </div>
      <div>
        <label className="text-sm font-medium">Status</label>
        <Select value={form.status || "PENDING"} onValueChange={(v) => setForm({ ...form, status: v as SitePhaseStatus })}>
          <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
          <SelectContent>
            {phaseStatuses.map((s) => (
              <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <label className="text-sm font-medium">Sort Order</label>
        <Input type="number" value={form.sortOrder ?? ""} onChange={(e) => setForm({ ...form, sortOrder: e.target.value ? Number(e.target.value) : 0 })} />
      </div>
    </div>
  );
}

function SiteDetails({ site, onClose, canManage }: { site: ConstructionSite; onClose: () => void; canManage?: boolean }) {
  const { showToast } = useToast();
  const { data: siteWithDetails } = useSite(site.id);
  const { data: photos } = useSitePhotos(site.id);
  const createPhase = useCreatePhase();
  const updatePhase = useUpdatePhase();
  const deletePhase = useDeletePhase();
  const createPhoto = useCreateProgressPhoto();
  const deletePhoto = useDeleteProgressPhoto();
  const [addPhaseOpen, setAddPhaseOpen] = useState(false);
  const [editPhase, setEditPhase] = useState<SitePhase | null>(null);
  const [phaseForm, setPhaseForm] = useState<{ name: string; startDate: string; endDate: string; status: string; sortOrder: number }>({ name: "", startDate: "", endDate: "", status: "PENDING", sortOrder: 1 });
  const [photoUrl, setPhotoUrl] = useState("");
  const [photoCaption, setPhotoCaption] = useState("");
  const [confirmPhaseDelete, setConfirmPhaseDelete] = useState<string | null>(null);
  const [confirmPhotoDelete, setConfirmPhotoDelete] = useState<string | null>(null);
  const phases = siteWithDetails?.phases || site.phases || [];
  const progressPhotos = photos || site.progressPhotos || [];

  const resetPhaseForm = () => setPhaseForm({ name: "", startDate: "", endDate: "", status: "PENDING", sortOrder: 1 });

  const handleAddPhase = () => {
    if (!phaseForm.name) return;
    createPhase.mutate({ siteId: site.id, dto: phaseForm }, {
      onSuccess: () => { showToast("Phase added"); setAddPhaseOpen(false); resetPhaseForm(); },
      onError: (err: Error) => showToast(err.message || "Failed to add phase", "error"),
    });
  };

  const handleUpdatePhase = () => {
    if (!editPhase) return;
    updatePhase.mutate({ id: editPhase.id, dto: phaseForm }, {
      onSuccess: () => { showToast("Phase updated"); setEditPhase(null); resetPhaseForm(); },
      onError: (err: Error) => showToast(err.message || "Failed to update phase", "error"),
    });
  };

  const handleDeletePhase = (id: string) => {
    setConfirmPhaseDelete(id);
  };

  const handleAddPhoto = () => {
    if (!photoUrl) return;
    createPhoto.mutate({ siteId: site.id, photoUrl, caption: photoCaption || undefined } as Parameters<typeof createPhoto.mutate>[0], {
      onSuccess: () => { showToast("Photo added"); setPhotoUrl(""); setPhotoCaption(""); },
      onError: (err: Error) => showToast(err.message || "Failed to add photo", "error"),
    });
  };

  const handleDeletePhoto = (id: string) => {
    setConfirmPhotoDelete(id);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">{site.name}</h3>
          <p className="text-sm text-muted-foreground flex items-center gap-1">
            <MapPin className="h-3 w-3" /> {site.location}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={onClose}>Close</Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Phases</CardTitle>
            {canManage && (
            <Dialog open={addPhaseOpen} onOpenChange={(o) => { setAddPhaseOpen(o); if (!o) resetPhaseForm(); }}>
              <DialogTrigger render={<Button size="sm" />}><Plus className="h-4 w-4" /> Add Phase</DialogTrigger>
              <DialogContent className="sm:max-w-sm">
                <DialogHeader><DialogTitle>Add Phase</DialogTitle></DialogHeader>
                <PhaseForm form={phaseForm} setForm={setPhaseForm} />
                <DialogFooter showCloseButton>
                  <Button onClick={handleAddPhase} disabled={createPhase.isPending}>Save</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {phases.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No phases yet</p>
          ) : (
            <div className="space-y-2">
              {[...phases].sort((a, b) => a.sortOrder - b.sortOrder).map((phase) => (
                <div key={phase.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{phase.name}</p>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      {phase.startDate && <span>{format(new Date(phase.startDate), "MMM dd, yyyy")}</span>}
                      {phase.endDate && <span>- {format(new Date(phase.endDate), "MMM dd, yyyy")}</span>}
                      <Badge variant="outline" className={phaseStatusColors[phase.status]}>{phase.status}</Badge>
                    </div>
                  </div>
                  {canManage && (
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon-sm" onClick={() => {
                      setEditPhase(phase);
                      setPhaseForm({ name: phase.name, startDate: phase.startDate || "", endDate: phase.endDate || "", status: phase.status, sortOrder: phase.sortOrder });
                    }}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon-sm" onClick={() => handleDeletePhase(phase.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!editPhase} onOpenChange={(o) => { if (!o) { setEditPhase(null); resetPhaseForm(); } }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Edit Phase</DialogTitle></DialogHeader>
          <PhaseForm form={phaseForm} setForm={setPhaseForm} />
          <DialogFooter showCloseButton>
            <Button onClick={handleUpdatePhase} disabled={updatePhase.isPending}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader><CardTitle>Progress Photos</CardTitle></CardHeader>
        <CardContent className="space-y-6">
          {/* Upload form */}
          {canManage && (
          <div className="flex gap-2">
            <Input placeholder="Photo URL" value={photoUrl} onChange={(e) => setPhotoUrl(e.target.value)} className="flex-1" />
            <Input placeholder="Caption (optional)" value={photoCaption} onChange={(e) => setPhotoCaption(e.target.value)} className="flex-1" />
            <Button onClick={handleAddPhoto} disabled={!photoUrl || createPhoto.isPending}><Plus className="h-4 w-4" /></Button>
          </div>
          )}

          {/* Photo gallery with lightbox, timeline, phase filter, and grid/timeline toggle */}
          <ProgressPhotoGallery
            photos={progressPhotos}
            onDelete={canManage ? handleDeletePhoto : undefined}
          />
        </CardContent>
      </Card>

      <ConfirmDialog
        open={!!confirmPhaseDelete}
        onOpenChange={(o) => { if (!o) setConfirmPhaseDelete(null); }}
        title="Delete Phase"
        variant="destructive"
        onConfirm={() => {
          if (confirmPhaseDelete) {
            deletePhase.mutate(confirmPhaseDelete, {
              onSuccess: () => showToast("Phase deleted"),
              onError: (err: Error) => showToast(err.message || "Failed to delete phase", "error"),
            });
          }
          setConfirmPhaseDelete(null);
        }}
        loading={deletePhase.isPending}
      >
        Delete this phase?
      </ConfirmDialog>

      <ConfirmDialog
        open={!!confirmPhotoDelete}
        onOpenChange={(o) => { if (!o) setConfirmPhotoDelete(null); }}
        title="Delete Photo"
        variant="destructive"
        onConfirm={() => {
          if (confirmPhotoDelete) {
            deletePhoto.mutate(confirmPhotoDelete, {
              onSuccess: () => showToast("Photo deleted"),
              onError: (err: Error) => showToast(err.message || "Failed to delete photo", "error"),
            });
          }
          setConfirmPhotoDelete(null);
        }}
        loading={deletePhoto.isPending}
      >
        Delete this photo?
      </ConfirmDialog>
    </div>
  );
}

function EmployeeConstructionSitesView() {
  const { showToast } = useToast();
  const { data, isLoading } = useSites();
  const [selectedSite, setSelectedSite] = useState<ConstructionSite | null>(null);
  const sites = data?.data || [];

  if (selectedSite) {
    return <SiteDetails site={selectedSite} onClose={() => setSelectedSite(null)} canManage={false} />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Construction Sites</h2>
        <p className="text-sm text-muted-foreground">View construction sites and progress</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          <CardSkeleton count={3} />
        ) : sites.length === 0 ? (
          <p className="text-sm text-muted-foreground col-span-full text-center py-8">No construction sites available</p>
        ) : (
          sites.map((site) => (
            <Card key={site.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelectedSite(site)}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-sm">{site.name}</CardTitle>
                  <Badge variant="outline" className={siteStatusColors[site.status]}>{site.status}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p className="flex items-center gap-1 text-muted-foreground"><MapPin className="h-3 w-3" /> {site.location}</p>
                {site.budget != null && <p className="text-muted-foreground">Budget: ₹{site.budget.toLocaleString()}</p>}
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  {site.startDate && <span>{format(new Date(site.startDate), "MMM dd, yyyy")}</span>}
                  {site.endDate && <span>- {format(new Date(site.endDate), "MMM dd, yyyy")}</span>}
                </div>
                {site._count && (
                  <p className="text-xs text-muted-foreground">{site._count.phases || 0} phases &middot; {site._count.progressPhotos || 0} photos</p>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

function AdminConstructionSitesView() {
  const { showToast } = useToast();
  const { data, isLoading } = useSites();
  const { data: currentUser } = useCurrentUser();
  const createMutation = useCreateSite();
  const updateMutation = useUpdateSite();
  const deleteMutation = useDeleteSite();
  const [createOpen, setCreateOpen] = useState(false);
  const [editItem, setEditItem] = useState<ConstructionSite | null>(null);
  const [selectedSite, setSelectedSite] = useState<ConstructionSite | null>(null);
  const [form, setForm] = useState<Partial<CreateSiteDto>>({});
  const [confirmSiteDelete, setConfirmSiteDelete] = useState<string | null>(null);
  const sites = data?.data || [];
  const canManage = currentUser?.user?.role === "OWNER" || currentUser?.user?.role === "ADMIN";

  const resetForm = () => setForm({ name: "", location: "", status: "PLANNING", startDate: "", endDate: "", budget: undefined, description: "" });

  const handleDelete = (id: string) => {
    setConfirmSiteDelete(id);
  };

  if (selectedSite) {
    return <SiteDetails site={selectedSite} onClose={() => setSelectedSite(null)} canManage={canManage} />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Construction Sites</h2>
          <p className="text-sm text-muted-foreground">Manage construction sites, phases, and progress</p>
        </div>
        {canManage && (
          <Dialog open={createOpen} onOpenChange={(o) => { setCreateOpen(o); if (!o) resetForm(); }}>
            <DialogTrigger render={<Button />}><Plus className="h-4 w-4" /> Add Site</DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader><DialogTitle>Add Construction Site</DialogTitle></DialogHeader>
            <SiteForm form={form} setForm={setForm} />
            <DialogFooter showCloseButton>
              <Button onClick={() => {
                if (!form.name || !form.location) return;
                const dto: CreateSiteDto = {
                  name: form.name,
                  location: form.location,
                  status: form.status || "PLANNING",
                  description: form.description || undefined,
                  startDate: form.startDate || undefined,
                  endDate: form.endDate || undefined,
                  budget: form.budget != null ? Number(form.budget) || undefined : undefined,
                };
                createMutation.mutate(dto, {
                  onSuccess: () => { showToast("Site created"); setCreateOpen(false); resetForm(); },
                  onError: (err: Error) => showToast(err.message || "Failed to create site", "error"),
                });
              }} disabled={createMutation.isPending}>Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        )}
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <TableSkeleton rows={5} columns={7} />
          ) : sites.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No construction sites found</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="p-3 font-medium">Name</th>
                    <th className="p-3 font-medium">Location</th>
                    <th className="p-3 font-medium">Status</th>
                    <th className="p-3 font-medium">Dates</th>
                    <th className="p-3 font-medium">Budget</th>
                    <th className="p-3 font-medium">Phases</th>
                    <th className="p-3 font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {sites.map((site) => (
                    <tr key={site.id} className="border-b last:border-0 hover:bg-muted/50">
                      <td className="p-3 font-medium">{site.name}</td>
                      <td className="p-3 text-muted-foreground">
                        <span className="flex items-center gap-1"><MapPin className="h-3 w-3 shrink-0" /> {site.location}</span>
                      </td>
                      <td className="p-3"><Badge variant="outline" className={siteStatusColors[site.status]}>{site.status}</Badge></td>
                      <td className="p-3 text-xs text-muted-foreground">
                        {site.startDate && format(new Date(site.startDate), "MMM dd, yyyy")}
                        {site.startDate && site.endDate && " - "}
                        {site.endDate && format(new Date(site.endDate), "MMM dd, yyyy")}
                        {!site.startDate && !site.endDate && "-"}
                      </td>
                      <td className="p-3">{site.budget != null ? `₹${site.budget.toLocaleString()}` : "-"}</td>
                      <td className="p-3 text-xs text-muted-foreground">{site._count?.phases ?? 0}</td>
                      <td className="p-3">
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon-sm" onClick={() => setSelectedSite(site)}><Eye className="h-4 w-4" /></Button>
                          {canManage && (
                            <>
                              <Button variant="ghost" size="icon-sm" onClick={() => {
                                setEditItem(site);
                                setForm({ name: site.name, location: site.location, status: site.status, startDate: site.startDate || "", endDate: site.endDate || "", budget: site.budget ?? undefined, description: site.description || "" });
                              }}><Pencil className="h-4 w-4" /></Button>
                              <Button variant="ghost" size="icon-sm" onClick={() => handleDelete(site.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!editItem} onOpenChange={(o) => { if (!o) setEditItem(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Edit Construction Site</DialogTitle></DialogHeader>
          <SiteForm form={form} setForm={setForm} />
          <DialogFooter showCloseButton>
            <Button onClick={() => {
              if (editItem) {
                const dto: Partial<CreateSiteDto> = {
                  name: form.name,
                  location: form.location,
                  status: form.status,
                  description: form.description || undefined,
                  startDate: form.startDate || undefined,
                  endDate: form.endDate || undefined,
                  budget: form.budget != null ? Number(form.budget) || undefined : undefined,
                };
                updateMutation.mutate({ id: editItem.id, dto }, {
                  onSuccess: () => { showToast("Site updated"); setEditItem(null); },
                  onError: (err: Error) => showToast(err.message || "Failed to update site", "error"),
                });
              }
            }} disabled={updateMutation.isPending}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!confirmSiteDelete}
        onOpenChange={(o) => { if (!o) setConfirmSiteDelete(null); }}
        title="Delete Construction Site"
        variant="destructive"
        onConfirm={() => {
          if (confirmSiteDelete) {
            deleteMutation.mutate(confirmSiteDelete, {
              onSuccess: () => showToast("Site deleted"),
              onError: (err: Error) => showToast(err.message || "Failed to delete site", "error"),
            });
          }
          setConfirmSiteDelete(null);
        }}
        loading={deleteMutation.isPending}
      >
        Delete this construction site?
      </ConfirmDialog>
    </div>
  );
}

export default function ConstructionSitesPage() {
  const { data: currentUser } = useCurrentUser();
  const role = currentUser?.user?.role;

  if (role === "EMPLOYEE") return <EmployeeConstructionSitesView />;

  return <AdminConstructionSitesView />;
}
