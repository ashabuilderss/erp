export type MeetingStatus = "SCHEDULED" | "COMPLETED" | "CANCELLED";

export interface Meeting {
  id: string;
  companyId: string;
  title: string;
  scheduledAt: string;
  location?: string;
  status: MeetingStatus;
  organizerId?: string;
  createdAt: string;
  updatedAt: string;
  employees?: { id: string; user?: { firstName: string; lastName: string } };
  attendees?: MeetingAttendee[];
  minutes?: MeetingMinutes[];
  actionItems?: MeetingActionItem[];
  deletedAt?: string;
}

export interface MeetingAttendee {
  id: string;
  meetingId: string;
  employeeId: string;
  attended: boolean;
  employees?: { id: string; employeeCode?: string; user?: { firstName: string; lastName: string } };
}

export interface MeetingMinutes {
  id: string;
  meetingId: string;
  content: string;
  recordedById?: string;
  createdAt: string;
}

export interface MeetingActionItem {
  id: string;
  meetingId: string;
  description: string;
  assigneeId?: string;
  dueDate?: string;
  taskId?: string;
  employees?: { id: string; user?: { firstName: string; lastName: string } };
}

export interface CreateMeetingDto {
  title: string;
  scheduledAt: string;
  location?: string;
  attendeeIds?: string[];
}

export interface CreateMeetingMinutesDto {
  content: string;
}

export interface CreateActionItemDto {
  description: string;
  assigneeId?: string;
  dueDate?: string;
}
