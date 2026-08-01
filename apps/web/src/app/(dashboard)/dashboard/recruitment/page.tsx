"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import { Briefcase, Users, Plus, Trash2, Pencil, Calendar } from "lucide-react";
import { format } from "date-fns";

import {
  useJobPostings,
  useCreateJobPosting,
  useUpdateJobPosting,
  useDeleteJobPosting,
  useCandidates,
  useCreateCandidate,
  useUpdateCandidate,
  useScheduleInterview,
} from "@/hooks/api";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { useToast } from "@/components/ui/toast";
import { getApiErrorMessage } from "@/lib/api";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { FieldError } from "@/components/shared/field-error";
import {
  validateForm,
  clearFieldError,
} from "@/components/shared/form-validation";
import type { ValidationRules } from "@/components/shared/form-validation";
import type {
  JobPosting,
  Candidate,
  JobPostingStatus,
  CandidateStatus,
} from "@/lib/types";

const jpStatusColor: Record<string, string> = {
  OPEN: "bg-blue-100 text-blue-800",
  CLOSED: "bg-red-100 text-red-800",
  ON_HOLD: "bg-yellow-100 text-yellow-800",
};

const candidateStatusColor: Record<string, string> = {
  APPLIED: "bg-blue-100 text-blue-800",
  SCREENING: "bg-yellow-100 text-yellow-800",
  INTERVIEW: "bg-purple-100 text-purple-800",
  OFFERED: "bg-green-100 text-green-800",
  HIRED: "bg-green-100 text-green-800",
  REJECTED: "bg-red-100 text-red-800",
};

type JobPostingForm = {
  title: string;
  departmentId: string;
  description: string;
  status: JobPostingStatus;
};

type CandidateForm = {
  jobPostingId: string;
  name: string;
  email: string;
  phone: string;
  resumeUrl: string;
  notes: string;
  status: CandidateStatus;
};

type InterviewForm = {
  interviewerId: string;
  scheduledAt: string;
};

export default function RecruitmentPage() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState("jobs");

  const [jpSearch, setJpSearch] = useState("");
  const [jpPage, setJpPage] = useState(1);
  const [jpStatusFilter, setJpStatusFilter] = useState<string>("ALL");
  const [jpCreateOpen, setJpCreateOpen] = useState(false);
  const [jpEditItem, setJpEditItem] = useState<JobPosting | null>(null);
  const [jpDeleteId, setJpDeleteId] = useState<string | null>(null);
  const [jpForm, setJpForm] = useState<JobPostingForm>({
    title: "",
    departmentId: "",
    description: "",
    status: "OPEN",
  });
  const [jpErrors, setJpErrors] = useState<
    Partial<Record<keyof JobPostingForm, string>>
  >({});

  const [cSearch, setCSearch] = useState("");
  const [cPage, setCPage] = useState(1);
  const [cStatusFilter, setCStatusFilter] = useState<string>("ALL");
  const [cJobPostingFilter, setCJobPostingFilter] = useState<string>("ALL");
  const [cCreateOpen, setCCreateOpen] = useState(false);
  const [cEditItem, setCEditItem] = useState<Candidate | null>(null);
  const [cDeleteId, setCDeleteId] = useState<string | null>(null);
  const [cScheduleCandidate, setCScheduleCandidate] =
    useState<Candidate | null>(null);
  const [cForm, setCForm] = useState<CandidateForm>({
    jobPostingId: "",
    name: "",
    email: "",
    phone: "",
    resumeUrl: "",
    notes: "",
    status: "APPLIED",
  });
  const [cErrors, setCErrors] = useState<
    Partial<Record<keyof CandidateForm, string>>
  >({});
  const [cInterviewForm, setCInterviewForm] = useState<InterviewForm>({
    interviewerId: "",
    scheduledAt: "",
  });

  const { data: jpData, isLoading: jpLoading, isError: jpError } = useJobPostings({
    page: jpPage,
    limit: 10,
    search: jpSearch || undefined,
    status: jpStatusFilter !== "ALL" ? jpStatusFilter : undefined,
  });
  const { data: cData, isLoading: cLoading, isError: cError } = useCandidates({
    page: cPage,
    limit: 10,
    status: cStatusFilter !== "ALL" ? cStatusFilter : undefined,
    jobPostingId: cJobPostingFilter !== "ALL" ? cJobPostingFilter : undefined,
  });
  const { data: allJobs } = useJobPostings({ limit: 100 });

  const createJpMutation = useCreateJobPosting();
  const updateJpMutation = useUpdateJobPosting();
  const deleteJpMutation = useDeleteJobPosting();
  const createCandidateMutation = useCreateCandidate();
  const updateCandidateMutation = useUpdateCandidate();
  const scheduleInterviewMutation = useScheduleInterview();

  const jpList = jpData?.data ?? [];
  const jpTotalPages = jpData?.meta?.totalPages ?? 0;
  const jpTotal = jpData?.meta?.total ?? 0;

  const cList = cData?.data ?? [];
  const cTotalPages = cData?.meta?.totalPages ?? 0;
  const cTotal = cData?.meta?.total ?? 0;

  const allJobPostings = allJobs?.data ?? [];

  const resetJpForm = () => {
    setJpForm({ title: "", departmentId: "", description: "", status: "OPEN" });
    setJpErrors({});
  };

  const resetCForm = () => {
    setCForm({
      jobPostingId: "",
      name: "",
      email: "",
      phone: "",
      resumeUrl: "",
      notes: "",
      status: "APPLIED",
    });
    setCErrors({});
  };

  const handleCreateJp = () => {
    const rules: ValidationRules<JobPostingForm> = {
      title: { required: "Title is required" },
    };
    const errs = validateForm(jpForm, rules);
    setJpErrors(errs);
    if (Object.keys(errs).length > 0) return;

    createJpMutation.mutate(
      {
        title: jpForm.title,
        departmentId: jpForm.departmentId || undefined,
        description: jpForm.description || undefined,
      },
      {
        onSuccess: () => {
          showToast("Job posting created");
          setJpCreateOpen(false);
          resetJpForm();
          queryClient.invalidateQueries({ queryKey: ["job-postings"] });
        },
        onError: (err) => {
          showToast(getApiErrorMessage(err, "Failed to create job posting"), "error");
        },
      }
    );
  };

  const handleEditJp = () => {
    if (!jpEditItem) return;
    const rules: ValidationRules<JobPostingForm> = {
      title: { required: "Title is required" },
    };
    const errs = validateForm(jpForm, rules);
    setJpErrors(errs);
    if (Object.keys(errs).length > 0) return;

    updateJpMutation.mutate(
      {
        id: jpEditItem.id,
        dto: {
          title: jpForm.title,
          departmentId: jpForm.departmentId || undefined,
          description: jpForm.description || undefined,
          status: jpForm.status,
        },
      },
      {
        onSuccess: () => {
          showToast("Job posting updated");
          setJpEditItem(null);
          resetJpForm();
          queryClient.invalidateQueries({ queryKey: ["job-postings"] });
        },
        onError: (err) => {
          showToast(getApiErrorMessage(err, "Failed to update job posting"), "error");
        },
      }
    );
  };

  const handleDeleteJp = () => {
    if (!jpDeleteId) return;
    deleteJpMutation.mutate(jpDeleteId, {
      onSuccess: () => {
        showToast("Job posting deleted");
        setJpDeleteId(null);
        queryClient.invalidateQueries({ queryKey: ["job-postings"] });
      },
      onError: (err) => {
        showToast(getApiErrorMessage(err, "Failed to delete job posting"), "error");
      },
    });
  };

  const handleCreateCandidate = () => {
    const rules: ValidationRules<CandidateForm> = {
      jobPostingId: { required: "Job posting is required" },
      name: { required: "Name is required" },
    };
    const errs = validateForm(cForm, rules);
    setCErrors(errs);
    if (Object.keys(errs).length > 0) return;

    createCandidateMutation.mutate(
      {
        jobPostingId: cForm.jobPostingId,
        name: cForm.name,
        email: cForm.email || undefined,
        phone: cForm.phone || undefined,
        resumeUrl: cForm.resumeUrl || undefined,
      },
      {
        onSuccess: () => {
          showToast("Candidate created");
          setCCreateOpen(false);
          resetCForm();
          queryClient.invalidateQueries({ queryKey: ["candidates"] });
        },
        onError: (err) => {
          showToast(getApiErrorMessage(err, "Failed to create candidate"), "error");
        },
      }
    );
  };

  const handleEditCandidate = () => {
    if (!cEditItem) return;
    const rules: ValidationRules<CandidateForm> = {
      name: { required: "Name is required" },
    };
    const errs = validateForm(cForm, rules);
    setCErrors(errs);
    if (Object.keys(errs).length > 0) return;

    updateCandidateMutation.mutate(
      {
        id: cEditItem.id,
        dto: {
          name: cForm.name,
          email: cForm.email || undefined,
          phone: cForm.phone || undefined,
          resumeUrl: cForm.resumeUrl || undefined,
          status: cForm.status,
          notes: cForm.notes || undefined,
        },
      },
      {
        onSuccess: () => {
          showToast("Candidate updated");
          setCEditItem(null);
          resetCForm();
          queryClient.invalidateQueries({ queryKey: ["candidates"] });
        },
        onError: (err) => {
          showToast(getApiErrorMessage(err, "Failed to update candidate"), "error");
        },
      }
    );
  };

  const handleDeleteCandidate = () => {
    if (!cDeleteId) return;
    updateCandidateMutation.mutate(
      { id: cDeleteId, dto: { status: "REJECTED" } },
      {
        onSuccess: () => {
          showToast("Candidate rejected");
          setCDeleteId(null);
          queryClient.invalidateQueries({ queryKey: ["candidates"] });
        },
        onError: (err) => {
          showToast(getApiErrorMessage(err, "Failed to reject candidate"), "error");
        },
      }
    );
  };

  const handleScheduleInterview = () => {
    if (!cScheduleCandidate) return;
    if (!cInterviewForm.scheduledAt) {
      showToast("Scheduled date is required", "error");
      return;
    }

    scheduleInterviewMutation.mutate(
      {
        candidateId: cScheduleCandidate.id,
        dto: {
          interviewerId: cInterviewForm.interviewerId || undefined,
          scheduledAt: new Date(cInterviewForm.scheduledAt).toISOString(),
        },
      },
      {
        onSuccess: () => {
          showToast("Interview scheduled");
          setCScheduleCandidate(null);
          setCInterviewForm({ interviewerId: "", scheduledAt: "" });
          updateCandidateMutation.mutate({
            id: cScheduleCandidate.id,
            dto: { status: "INTERVIEW" },
          });
          queryClient.invalidateQueries({ queryKey: ["candidates"] });
        },
        onError: (err) => {
          showToast(getApiErrorMessage(err, "Failed to schedule interview"), "error");
        },
      }
    );
  };

  const jpColumns: ColumnDef<JobPosting>[] = [
    {
      accessorKey: "title",
      header: "Title",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Briefcase className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="font-medium">{row.original.title}</span>
        </div>
      ),
    },
    {
      accessorKey: "departmentId",
      header: "Department",
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {row.original.department?.name || row.original.departmentId || "\u2014"}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge className={jpStatusColor[row.original.status] || ""}>
          {row.original.status}
        </Badge>
      ),
    },
    {
      accessorKey: "createdAt",
      header: "Created At",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {format(new Date(row.original.createdAt), "MMM d, yyyy")}
        </span>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const jp = row.original;
        return (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setJpForm({
                  title: jp.title,
                  departmentId: jp.departmentId || "",
                  description: jp.description || "",
                  status: jp.status,
                });
                setJpEditItem(jp);
              }}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setJpDeleteId(jp.id)}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        );
      },
    },
  ];

  const cColumns: ColumnDef<Candidate>[] = [
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="font-medium">{row.original.name}</span>
        </div>
      ),
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {row.original.email || "\u2014"}
        </span>
      ),
    },
    {
      accessorKey: "phone",
      header: "Phone",
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {row.original.phone || "\u2014"}
        </span>
      ),
    },
    {
      accessorKey: "jobPostingId",
      header: "Job Posting",
      cell: ({ row }) => {
        const job = allJobPostings.find(
          (j) => j.id === row.original.jobPostingId
        );
        return (
          <span className="text-muted-foreground">
            {job?.title || "\u2014"}
          </span>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge
          className={candidateStatusColor[row.original.status] || ""}
        >
          {row.original.status}
        </Badge>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const c = row.original;
        return (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCScheduleCandidate(c)}
              title="Schedule Interview"
            >
              <Calendar className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setCForm({
                  jobPostingId: c.jobPostingId,
                  name: c.name,
                  email: c.email || "",
                  phone: c.phone || "",
                  resumeUrl: c.resumeUrl || "",
                  notes: c.notes || "",
                  status: c.status,
                });
                setCEditItem(c);
              }}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCDeleteId(c.id)}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">
          Recruitment Pipeline
        </h2>
        <p className="text-muted-foreground">
          Manage job postings, track candidates, and schedule interviews.
        </p>
      </div>

      <Tabs
        defaultValue="jobs"
        value={activeTab}
        onValueChange={setActiveTab}
      >
        <TabsList>
          <TabsTrigger value="jobs">
            <Briefcase className="mr-1 h-4 w-4" />
            Job Postings
          </TabsTrigger>
          <TabsTrigger value="candidates">
            <Users className="mr-1 h-4 w-4" />
            Candidates
          </TabsTrigger>
        </TabsList>

        <TabsContent value="jobs" className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Select
                value={jpStatusFilter}
                onValueChange={(v) => {
                  if (v === null) return;
                  setJpStatusFilter(v);
                  setJpPage(1);
                }}
              >
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Statuses</SelectItem>
                  <SelectItem value="OPEN">Open</SelectItem>
                  <SelectItem value="CLOSED">Closed</SelectItem>
                  <SelectItem value="ON_HOLD">On Hold</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={() => {
                resetJpForm();
                setJpCreateOpen(true);
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Job Posting
            </Button>
          </div>

          {jpError ? (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-center">
              <p className="text-sm text-destructive">Failed to load job postings. Please try again later.</p>
            </div>
          ) : jpLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-12 bg-muted animate-pulse rounded-md" />
              ))}
            </div>
          ) : jpList.length === 0 ? (
            <EmptyState
              icon={<Briefcase />}
              title="No job postings found"
              description="Create your first job posting to start recruiting."
              action={
                <Button onClick={() => setJpCreateOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Job Posting
                </Button>
              }
            />
          ) : (
            <DataTable
              columns={jpColumns}
              data={jpList}
              searchKey="job postings"
              onSearchChange={(value) => {
                setJpSearch(value);
                setJpPage(1);
              }}
              pageCount={jpTotalPages}
              totalRecords={jpTotal}
              onPaginationChange={(pageIndex) => setJpPage(pageIndex + 1)}
            />
          )}
        </TabsContent>

        <TabsContent value="candidates" className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Select
                value={cStatusFilter}
                onValueChange={(v) => {
                  if (v === null) return;
                  setCStatusFilter(v);
                  setCPage(1);
                }}
              >
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Statuses</SelectItem>
                  <SelectItem value="APPLIED">Applied</SelectItem>
                  <SelectItem value="SCREENING">Screening</SelectItem>
                  <SelectItem value="INTERVIEW">Interview</SelectItem>
                  <SelectItem value="OFFERED">Offered</SelectItem>
                  <SelectItem value="HIRED">Hired</SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={cJobPostingFilter}
                onValueChange={(v) => {
                  if (v === null) return;
                  setCJobPostingFilter(v);
                  setCPage(1);
                }}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="All Job Postings" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Job Postings</SelectItem>
                  {allJobPostings.map((job) => (
                    <SelectItem key={job.id} value={job.id}>
                      {job.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={() => {
                resetCForm();
                setCCreateOpen(true);
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Candidate
            </Button>
          </div>

          {cError ? (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-center">
              <p className="text-sm text-destructive">Failed to load candidates. Please try again later.</p>
            </div>
          ) : cLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-12 bg-muted animate-pulse rounded-md" />
              ))}
            </div>
          ) : cList.length === 0 ? (
            <EmptyState
              icon={<Users />}
              title="No candidates found"
              description="Add candidates to track them through the recruitment pipeline."
              action={
                <Button onClick={() => setCCreateOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Candidate
                </Button>
              }
            />
          ) : (
            <DataTable
              columns={cColumns}
              data={cList}
              searchKey="candidates"
              onSearchChange={(value) => {
                setCSearch(value);
                setCPage(1);
              }}
              pageCount={cTotalPages}
              totalRecords={cTotal}
              onPaginationChange={(pageIndex) => setCPage(pageIndex + 1)}
            />
          )}
        </TabsContent>
      </Tabs>

      <Dialog
        open={jpCreateOpen}
        onOpenChange={(open) => {
          setJpCreateOpen(open);
          if (!open) resetJpForm();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Job Posting</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input
                placeholder="e.g. Senior Developer"
                value={jpForm.title}
                onChange={(e) => {
                  setJpForm({ ...jpForm, title: e.target.value });
                  clearFieldError("title", setJpErrors);
                }}
                className={jpErrors.title ? "border-red-500" : ""}
              />
              <FieldError error={jpErrors.title} />
            </div>
            <div className="space-y-2">
              <Label>Department ID</Label>
              <Input
                placeholder="e.g. engineering"
                value={jpForm.departmentId}
                onChange={(e) => {
                  setJpForm({ ...jpForm, departmentId: e.target.value });
                  clearFieldError("departmentId", setJpErrors);
                }}
                className={jpErrors.departmentId ? "border-red-500" : ""}
              />
              <FieldError error={jpErrors.departmentId} />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                placeholder="Describe the role, responsibilities, and requirements..."
                value={jpForm.description}
                onChange={(e) => {
                  setJpForm({ ...jpForm, description: e.target.value });
                  clearFieldError("description", setJpErrors);
                }}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setJpCreateOpen(false);
                resetJpForm();
              }}
              disabled={createJpMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateJp}
              disabled={createJpMutation.isPending}
            >
              {createJpMutation.isPending ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!jpEditItem}
        onOpenChange={(open) => {
          if (!open) {
            setJpEditItem(null);
            resetJpForm();
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Job Posting</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input
                placeholder="e.g. Senior Developer"
                value={jpForm.title}
                onChange={(e) => {
                  setJpForm({ ...jpForm, title: e.target.value });
                  clearFieldError("title", setJpErrors);
                }}
                className={jpErrors.title ? "border-red-500" : ""}
              />
              <FieldError error={jpErrors.title} />
            </div>
            <div className="space-y-2">
              <Label>Department ID</Label>
              <Input
                placeholder="e.g. engineering"
                value={jpForm.departmentId}
                onChange={(e) => {
                  setJpForm({ ...jpForm, departmentId: e.target.value });
                  clearFieldError("departmentId", setJpErrors);
                }}
                className={jpErrors.departmentId ? "border-red-500" : ""}
              />
              <FieldError error={jpErrors.departmentId} />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                placeholder="Describe the role, responsibilities, and requirements..."
                value={jpForm.description}
                onChange={(e) => {
                  setJpForm({ ...jpForm, description: e.target.value });
                  clearFieldError("description", setJpErrors);
                }}
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={jpForm.status}
                onValueChange={(v) =>
                  setJpForm({ ...jpForm, status: v as JobPostingStatus })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="OPEN">Open</SelectItem>
                  <SelectItem value="CLOSED">Closed</SelectItem>
                  <SelectItem value="ON_HOLD">On Hold</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setJpEditItem(null);
                resetJpForm();
              }}
              disabled={updateJpMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleEditJp}
              disabled={updateJpMutation.isPending}
            >
              {updateJpMutation.isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!jpDeleteId}
        onOpenChange={() => setJpDeleteId(null)}
        title="Delete Job Posting"
        confirmLabel="Delete"
        variant="destructive"
        loading={deleteJpMutation.isPending}
        onConfirm={handleDeleteJp}
      >
        Are you sure you want to delete this job posting? This action cannot be
        undone.
      </ConfirmDialog>

      <Dialog
        open={cCreateOpen}
        onOpenChange={(open) => {
          setCCreateOpen(open);
          if (!open) resetCForm();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Candidate</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Job Posting *</Label>
              <Select
                value={cForm.jobPostingId}
                onValueChange={(v) => {
                  if (v === null) return;
                  setCForm({ ...cForm, jobPostingId: v });
                  clearFieldError("jobPostingId", setCErrors);
                }}
              >
                <SelectTrigger
                  className={cErrors.jobPostingId ? "border-red-500" : ""}
                >
                  <SelectValue placeholder="Select job posting" />
                </SelectTrigger>
                <SelectContent>
                  {allJobPostings.map((job) => (
                    <SelectItem key={job.id} value={job.id}>
                      {job.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldError error={cErrors.jobPostingId} />
            </div>
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input
                placeholder="e.g. John Doe"
                value={cForm.name}
                onChange={(e) => {
                  setCForm({ ...cForm, name: e.target.value });
                  clearFieldError("name", setCErrors);
                }}
                className={cErrors.name ? "border-red-500" : ""}
              />
              <FieldError error={cErrors.name} />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                placeholder="e.g. john@example.com"
                value={cForm.email}
                onChange={(e) =>
                  setCForm({ ...cForm, email: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input
                placeholder="e.g. +1 234 567 890"
                value={cForm.phone}
                onChange={(e) =>
                  setCForm({ ...cForm, phone: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Resume URL</Label>
              <Input
                placeholder="https://example.com/resume.pdf"
                value={cForm.resumeUrl}
                onChange={(e) =>
                  setCForm({ ...cForm, resumeUrl: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                placeholder="Any additional notes about the candidate..."
                value={cForm.notes}
                onChange={(e) =>
                  setCForm({ ...cForm, notes: e.target.value })
                }
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setCCreateOpen(false);
                resetCForm();
              }}
              disabled={createCandidateMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateCandidate}
              disabled={createCandidateMutation.isPending}
            >
              {createCandidateMutation.isPending ? "Adding..." : "Add Candidate"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!cEditItem}
        onOpenChange={(open) => {
          if (!open) {
            setCEditItem(null);
            resetCForm();
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Candidate</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input
                placeholder="e.g. John Doe"
                value={cForm.name}
                onChange={(e) => {
                  setCForm({ ...cForm, name: e.target.value });
                  clearFieldError("name", setCErrors);
                }}
                className={cErrors.name ? "border-red-500" : ""}
              />
              <FieldError error={cErrors.name} />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                placeholder="e.g. john@example.com"
                value={cForm.email}
                onChange={(e) =>
                  setCForm({ ...cForm, email: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input
                placeholder="e.g. +1 234 567 890"
                value={cForm.phone}
                onChange={(e) =>
                  setCForm({ ...cForm, phone: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Resume URL</Label>
              <Input
                placeholder="https://example.com/resume.pdf"
                value={cForm.resumeUrl}
                onChange={(e) =>
                  setCForm({ ...cForm, resumeUrl: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={cForm.status}
                onValueChange={(v) =>
                  setCForm({ ...cForm, status: v as CandidateStatus })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="APPLIED">Applied</SelectItem>
                  <SelectItem value="SCREENING">Screening</SelectItem>
                  <SelectItem value="INTERVIEW">Interview</SelectItem>
                  <SelectItem value="OFFERED">Offered</SelectItem>
                  <SelectItem value="HIRED">Hired</SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                placeholder="Any additional notes about the candidate..."
                value={cForm.notes}
                onChange={(e) =>
                  setCForm({ ...cForm, notes: e.target.value })
                }
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setCEditItem(null);
                resetCForm();
              }}
              disabled={updateCandidateMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleEditCandidate}
              disabled={updateCandidateMutation.isPending}
            >
              {updateCandidateMutation.isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!cDeleteId}
        onOpenChange={() => setCDeleteId(null)}
        title="Reject Candidate"
        confirmLabel="Reject"
        variant="destructive"
        loading={updateCandidateMutation.isPending}
        onConfirm={handleDeleteCandidate}
      >
        Are you sure you want to reject this candidate? Their status will be set
        to rejected.
      </ConfirmDialog>

      <Dialog
        open={!!cScheduleCandidate}
        onOpenChange={(open) => {
          if (!open) {
            setCScheduleCandidate(null);
            setCInterviewForm({ interviewerId: "", scheduledAt: "" });
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule Interview</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {cScheduleCandidate && (
              <div className="rounded-md bg-muted p-3 text-sm">
                <span className="font-medium">
                  {cScheduleCandidate.name}
                </span>
                {cScheduleCandidate.email && (
                  <span className="ml-2 text-muted-foreground">
                    ({cScheduleCandidate.email})
                  </span>
                )}
              </div>
            )}
            <div className="space-y-2">
              <Label>Interviewer ID</Label>
              <Input
                placeholder="e.g. employee-id"
                value={cInterviewForm.interviewerId}
                onChange={(e) =>
                  setCInterviewForm({
                    ...cInterviewForm,
                    interviewerId: e.target.value,
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Scheduled Date &amp; Time *</Label>
              <Input
                type="datetime-local"
                value={cInterviewForm.scheduledAt}
                onChange={(e) =>
                  setCInterviewForm({
                    ...cInterviewForm,
                    scheduledAt: e.target.value,
                  })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setCScheduleCandidate(null);
                setCInterviewForm({ interviewerId: "", scheduledAt: "" });
              }}
              disabled={scheduleInterviewMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleScheduleInterview}
              disabled={scheduleInterviewMutation.isPending}
            >
              {scheduleInterviewMutation.isPending
                ? "Scheduling..."
                : "Schedule"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
