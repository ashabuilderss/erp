"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Megaphone,
  Clock,
  ArrowLeft,
  CheckCircle,
  Eye,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  useAnnouncement,
  useMyAnnouncements,
  useReadAnnouncement,
  useAcknowledgeAnnouncement,
  useCurrentUser,
} from "@/hooks/api";
import { useToast } from "@/components/ui/toast";
import { format } from "date-fns";

const priorityColors: Record<string, string> = {
  LOW: "bg-gray-100 text-gray-800",
  NORMAL: "bg-blue-100 text-blue-800",
  HIGH: "bg-orange-100 text-orange-800",
  URGENT: "bg-red-100 text-red-800",
};

const statusColors: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-800",
  PUBLISHED: "bg-green-100 text-green-800",
  ARCHIVED: "bg-blue-100 text-blue-800",
};

export default function AnnouncementDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { data: currentUser } = useCurrentUser();
  const role = currentUser?.user?.role;
  const isManager = role === "OWNER" || role === "ADMIN" || role === "HR_MANAGER";

  const detailQuery = useAnnouncement(isManager ? id : "");
  const myQuery = useMyAnnouncements();
  const myItems = Array.isArray(myQuery.data) ? myQuery.data : [];
  const announcement = isManager
    ? detailQuery.data
    : myItems.find((a) => a.id === id);

  const readMutation = useReadAnnouncement();
  const acknowledgeMutation = useAcknowledgeAnnouncement();
  const { showToast } = useToast();

  const isLoading = isManager
    ? detailQuery.isLoading
    : myQuery.isLoading;
  const isError = isManager
    ? detailQuery.isError
    : !announcement;

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError || !announcement) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
        <AlertTriangle className="h-12 w-12 text-yellow-500 mb-4" />
        <h2 className="text-2xl font-semibold mb-2">Announcement not found</h2>
        <p className="text-muted-foreground mb-4">
          This announcement may have been removed or you don't have access to it.
        </p>
        <Button onClick={() => router.push("/dashboard/announcements")}>
          Back to Announcements
        </Button>
      </div>
    );
  }

  const author = announcement.users
    ? `${announcement.users.firstName} ${announcement.users.lastName}`
    : "Company";

  const handleRead = () => {
    readMutation.mutate(announcement.id, {
      onSuccess: () => showToast("Marked as read", "success"),
      onError: () => showToast("Failed to mark as read", "error"),
    });
  };

  const handleAcknowledge = () => {
    acknowledgeMutation.mutate(announcement.id, {
      onSuccess: () => showToast("Acknowledged", "success"),
      onError: () => showToast("Failed to acknowledge", "error"),
    });
  };

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <Link
        href="/dashboard/announcements"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Announcements
      </Link>

      <div className="rounded-lg border p-6 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
              <Megaphone className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-semibold">{announcement.title}</h1>
                <Badge variant="outline" className={priorityColors[announcement.priority]}>
                  {announcement.priority}
                </Badge>
                <Badge variant="outline" className={statusColors[announcement.status]}>
                  {announcement.status}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Posted by {author}
              </p>
            </div>
          </div>
        </div>

        <div className="border-t pt-4">
          <p className="whitespace-pre-wrap leading-relaxed text-foreground">
            {announcement.body}
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            {announcement.publishedAt && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Published {format(new Date(announcement.publishedAt), "MMM d, yyyy")}
              </span>
            )}
            {announcement.expiresAt && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Expires {format(new Date(announcement.expiresAt), "MMM d, yyyy")}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleRead}>
              <Eye className="mr-1 h-4 w-4" />
              Mark Read
            </Button>
            <Button size="sm" onClick={handleAcknowledge}>
              <CheckCircle className="mr-1 h-4 w-4" />
              Acknowledge
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
