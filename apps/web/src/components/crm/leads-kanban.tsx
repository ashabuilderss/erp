"use client";

import { useState } from "react";
import { useLeads, useUpdateLeadStatus } from "@/hooks/api";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { getApiErrorMessage } from "@/lib/api";
import type { Lead, LeadStatus } from "@/lib/types";
import { GripVertical, User } from "lucide-react";

interface KanbanColumn {
  id: string;
  label: string;
  statuses: LeadStatus[];
}

const COLUMNS: KanbanColumn[] = [
  { id: "pipeline", label: "Pipeline", statuses: ["NEW", "CONTACTED", "INTERESTED", "SITE_VISIT_SCHEDULED", "NEGOTIATION"] },
  { id: "converted", label: "Converted", statuses: ["CONVERTED"] },
  { id: "lost", label: "Lost", statuses: ["LOST"] },
];

const SOURCE_COLORS: Record<string, string> = {
  WEBSITE: "bg-blue-100 text-blue-800",
  REFERRAL: "bg-green-100 text-green-800",
  SOCIAL_MEDIA: "bg-purple-100 text-purple-800",
  PHONE_INQUIRY: "bg-yellow-100 text-yellow-800",
  WALK_IN: "bg-orange-100 text-orange-800",
  OTHER: "bg-gray-100 text-gray-800",
};

const STATUS_LABELS: Record<LeadStatus, string> = {
  NEW: "New",
  CONTACTED: "Contacted",
  INTERESTED: "Interested",
  SITE_VISIT_SCHEDULED: "Site Visit",
  NEGOTIATION: "Negotiation",
  CONVERTED: "Converted",
  LOST: "Lost",
};

function LeadCard({ lead }: { lead: Lead }) {
  const onDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData("text/plain", lead.id);
    e.dataTransfer.effectAllowed = "move";
  };

  return (
    <Card
      draggable
      onDragStart={onDragStart}
      className="cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow"
      size="sm"
    >
      <CardContent className="p-3 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <span className="text-sm font-medium truncate">{lead.customerName}</span>
          <GripVertical className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
        </div>
        <Badge variant="outline" className={`${SOURCE_COLORS[lead.source] || "bg-gray-100 text-gray-800"} text-[10px]`}>
          {lead.source.replace(/_/g, " ")}
        </Badge>
        {lead.assignedTo && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <User className="h-3 w-3" />
            <span className="truncate">
              {lead.assignedTo.user
                ? `${lead.assignedTo.user.firstName} ${lead.assignedTo.user.lastName}`
                : lead.assignedTo.employeeCode}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function KanbanColumnDrop({
  leads,
  columnId,
  columnName,
  onDrop,
  highlightId,
}: {
  leads: Lead[];
  columnId: string;
  columnName: string;
  onDrop: (leadId: string, newStatus: LeadStatus) => void;
  highlightId: string | null;
}) {
  const [dragOver, setDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setDragOver(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const leadId = e.dataTransfer.getData("text/plain");
    if (leadId) {
      const targetStatus = leads.length > 0 ? leads[0].status : columnId.toUpperCase() as LeadStatus;
      let newStatus: LeadStatus;
      if (leads.length > 0) {
        newStatus = leads[0].status;
      } else {
        newStatus = columnId.toUpperCase() as LeadStatus;
      }
      onDrop(leadId, newStatus);
    }
  };

  const isDroppable = columnId === "pipeline" ? false : leads.length > 0;

  return (
    <div
      className="min-w-[200px] w-[240px] shrink-0 flex flex-col gap-2"
    >
      <div className="flex items-center justify-between px-1">
        <span className="text-sm font-semibold text-foreground">{columnName}</span>
        <Badge variant="secondary" className="text-xs">{leads.length}</Badge>
      </div>
      {columnId === "pipeline" ? (
        <PipelineColumns leads={leads} onDrop={onDrop} highlightId={highlightId} />
      ) : (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`flex-1 rounded-lg p-2 space-y-2 min-h-[200px] transition-colors ${
            dragOver ? "bg-primary/5 ring-2 ring-primary/20" : "bg-muted/30"
          }`}
        >
          {leads.map((lead) => (
            <LeadCard key={lead.id} lead={lead} />
          ))}
          {leads.length === 0 && (
            <div className="flex items-center justify-center h-20 text-xs text-muted-foreground">
              Drop lead here
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function PipelineColumns({ leads, onDrop, highlightId }: { leads: Lead[]; onDrop: (leadId: string, newStatus: LeadStatus) => void; highlightId: string | null }) {
  const pipelineStatuses: LeadStatus[] = ["NEW", "CONTACTED", "INTERESTED", "SITE_VISIT_SCHEDULED", "NEGOTIATION"];

  return (
    <div className="flex gap-2 flex-1">
      {pipelineStatuses.map((status) => {
        const statusLeads = leads.filter((l) => l.status === status);
        return <PipelineSubColumn key={status} status={status} leads={statusLeads} onDrop={onDrop} highlightId={highlightId} />;
      })}
    </div>
  );
}

function PipelineSubColumn({ status, leads, onDrop, highlightId }: { status: LeadStatus; leads: Lead[]; onDrop: (leadId: string, newStatus: LeadStatus) => void; highlightId: string | null }) {
  const [dragOver, setDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setDragOver(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const leadId = e.dataTransfer.getData("text/plain");
    if (leadId) {
      onDrop(leadId, status);
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`flex-1 min-w-[140px] rounded-lg p-2 space-y-2 min-h-[200px] transition-colors ${
        dragOver ? "bg-primary/5 ring-2 ring-primary/20" : "bg-muted/30"
      }`}
    >
      <div className="flex items-center justify-between px-1 mb-1">
        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">{STATUS_LABELS[status]}</span>
        <span className="text-[10px] text-muted-foreground">{leads.length}</span>
      </div>
      {leads.map((lead) => (
        <LeadCard key={lead.id} lead={lead} />
      ))}
    </div>
  );
}

export function LeadsKanban() {
  const { data, isLoading } = useLeads({ page: 1, limit: 200 });
  const updateStatus = useUpdateLeadStatus();
  const { showToast } = useToast();
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
  const [highlightId, setHighlightId] = useState<string | null>(null);

  const leads = data?.data || [];

  const handleDrop = (leadId: string, newStatus: LeadStatus) => {
    const lead = leads.find((l) => l.id === leadId);
    if (!lead || lead.status === newStatus) return;

    setHighlightId(leadId);
    setTimeout(() => setHighlightId(null), 1000);

    updateStatus.mutate(
      { id: leadId, status: newStatus },
      {
        onError: (err) => showToast(getApiErrorMessage(err, "Failed to update lead status"), "error"),
      }
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        Loading leads...
      </div>
    );
  }

  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex gap-4 min-w-max">
        {COLUMNS.map((column) => {
          const columnLeads = leads.filter((l) => column.statuses.includes(l.status));
          return (
            <KanbanColumnDrop
              key={column.id}
              leads={columnLeads}
              columnId={column.id}
              columnName={column.label}
              onDrop={handleDrop}
              highlightId={highlightId}
            />
          );
        })}
      </div>
    </div>
  );
}
