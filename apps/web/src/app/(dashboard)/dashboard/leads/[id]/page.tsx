"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  User,
  Phone,
  Mail,
  MapPin,
  Tag,
  FileText,
  Loader2,
  AlertTriangle,
  Home,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLead } from "@/hooks/api";
import { format } from "date-fns";

const statusColors: Record<string, string> = {
  NEW: "bg-blue-100 text-blue-800",
  CONTACTED: "bg-indigo-100 text-indigo-800",
  INTERESTED: "bg-purple-100 text-purple-800",
  SITE_VISIT_SCHEDULED: "bg-cyan-100 text-cyan-800",
  NEGOTIATION: "bg-orange-100 text-orange-800",
  CONVERTED: "bg-green-100 text-green-800",
  LOST: "bg-red-100 text-red-800",
};

const sourceColors: Record<string, string> = {
  WEBSITE: "bg-gray-100 text-gray-800",
  REFERRAL: "bg-emerald-100 text-emerald-800",
  SOCIAL_MEDIA: "bg-pink-100 text-pink-800",
  PHONE_INQUIRY: "bg-yellow-100 text-yellow-800",
  WALK_IN: "bg-teal-100 text-teal-800",
  OTHER: "bg-gray-100 text-gray-800",
};

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <p className="text-sm text-foreground break-words">{value}</p>
      </div>
    </div>
  );
}

export default function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { data: lead, isLoading, isError } = useLead(id);

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError || !lead) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
        <AlertTriangle className="h-12 w-12 text-yellow-500 mb-4" />
        <h2 className="text-2xl font-semibold mb-2">Lead not found</h2>
        <p className="text-muted-foreground mb-4">
          This lead may have been removed or you don&apos;t have access to it.
        </p>
        <Button onClick={() => router.push("/dashboard/leads")}>
          Back to Leads
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <Link
        href="/dashboard/leads"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Leads
      </Link>

      <div className="rounded-lg border p-6 space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold">{lead.customerName}</h1>
              <Badge variant="outline" className={statusColors[lead.status]}>
                {lead.status.replace(/_/g, " ")}
              </Badge>
              <Badge variant="outline" className={sourceColors[lead.source]}>
                {lead.source.replace(/_/g, " ")}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Lead created {format(new Date(lead.createdAt), "MMM d, yyyy")}
              {lead.assignedTo && (
                <span>
                  {" "}· Assigned to {lead.assignedTo.user?.firstName}{" "}
                  {lead.assignedTo.user?.lastName}
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 border-t pt-6">
          {lead.customerPhone && (
            <InfoRow
              icon={Phone}
              label="Phone"
              value={lead.customerPhone}
            />
          )}
          {lead.customerEmail && (
            <InfoRow icon={Mail} label="Email" value={lead.customerEmail} />
          )}
          {lead.property && (
            <InfoRow
              icon={Home}
              label="Property"
              value={`${lead.property.title} — ${lead.property.city}`}
            />
          )}
          <InfoRow
            icon={MapPin}
            label="Assigned To"
            value={
              lead.assignedTo?.user
                ? `${lead.assignedTo.user.firstName} ${lead.assignedTo.user.lastName}`
                : "Unassigned"
            }
          />
        </div>

        {lead.notes && (
          <div className="border-t pt-6">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold">Notes</h2>
            </div>
            <p className="whitespace-pre-wrap text-sm text-foreground leading-relaxed">
              {lead.notes}
            </p>
          </div>
        )}

        <div className="flex items-center gap-2 border-t pt-4 text-xs text-muted-foreground">
          <Tag className="h-3 w-3" />
          Lead ID: {lead.id}
        </div>
      </div>
    </div>
  );
}
