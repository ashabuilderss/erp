import { Badge } from "@/components/ui/badge";

interface StatusBadgeConfig {
  label: string;
  className: string;
}

const statusMap: Record<string, StatusBadgeConfig> = {
  PRESENT: { label: "Present", className: "bg-green-100 text-green-800" },
  ABSENT: { label: "Absent", className: "bg-red-100 text-red-800" },
  HALF_DAY: { label: "Half Day", className: "bg-yellow-100 text-yellow-800" },
  LEAVE: { label: "Leave", className: "bg-blue-100 text-blue-800" },
  PENDING: { label: "Pending", className: "bg-yellow-100 text-yellow-800" },
  APPROVED: { label: "Approved", className: "bg-green-100 text-green-800" },
  REJECTED: { label: "Rejected", className: "bg-red-100 text-red-800" },
  ACTIVE: { label: "Active", className: "bg-green-100 text-green-800" },
  INACTIVE: { label: "Inactive", className: "bg-gray-100 text-gray-800" },
  TERMINATED: { label: "Terminated", className: "bg-red-100 text-red-800" },
  AVAILABLE: { label: "Available", className: "bg-green-100 text-green-800" },
  RESERVED: { label: "Reserved", className: "bg-blue-100 text-blue-800" },
  BOOKED: { label: "Booked", className: "bg-purple-100 text-purple-800" },
  SOLD: { label: "Sold", className: "bg-gray-100 text-gray-800" },
  NEW: { label: "New", className: "bg-blue-100 text-blue-800" },
  CONTACTED: { label: "Contacted", className: "bg-indigo-100 text-indigo-800" },
  INTERESTED: { label: "Interested", className: "bg-purple-100 text-purple-800" },
  SITE_VISIT_SCHEDULED: { label: "Site Visit Scheduled", className: "bg-orange-100 text-orange-800" },
  NEGOTIATION: { label: "Negotiation", className: "bg-amber-100 text-amber-800" },
  CONVERTED: { label: "Converted", className: "bg-green-100 text-green-800" },
  LOST: { label: "Lost", className: "bg-red-100 text-red-800" },
  SCHEDULED: { label: "Scheduled", className: "bg-blue-100 text-blue-800" },
  COMPLETED: { label: "Completed", className: "bg-green-100 text-green-800" },
  CANCELLED: { label: "Cancelled", className: "bg-red-100 text-red-800" },
  RESCHEDULED: { label: "Rescheduled", className: "bg-orange-100 text-orange-800" },
  CONFIRMED: { label: "Confirmed", className: "bg-green-100 text-green-800" },
  PARTIAL: { label: "Partial", className: "bg-yellow-100 text-yellow-800" },
  Verified: { label: "Verified", className: "bg-green-100 text-green-800" },
  Pending: { label: "Pending", className: "bg-gray-100 text-gray-800" },
};

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusMap[status] || {
    label: status,
    className: "bg-gray-100 text-gray-800",
  };
  return (
    <Badge variant="outline" className={`${config.className} ${className || ""}`}>
      {config.label}
    </Badge>
  );
}
