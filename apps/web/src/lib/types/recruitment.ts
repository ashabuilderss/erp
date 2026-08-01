export type JobPostingStatus = "OPEN" | "CLOSED" | "ON_HOLD";
export type CandidateStatus = "APPLIED" | "SCREENING" | "INTERVIEW" | "OFFERED" | "HIRED" | "REJECTED";

export interface JobPosting {
  id: string;
  companyId: string;
  title: string;
  departmentId?: string;
  description?: string;
  status: JobPostingStatus;
  createdAt: string;
  updatedAt: string;
  candidates?: Candidate[];
  department?: { id: string; name: string };
  deletedAt?: string;
}

export interface Candidate {
  id: string;
  jobPostingId: string;
  name: string;
  email?: string;
  phone?: string;
  resumeUrl?: string;
  status: CandidateStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  jobPostings?: JobPosting;
  interviews?: Interview[];
  deletedAt?: string;
}

export interface Interview {
  id: string;
  candidateId: string;
  interviewerId?: string;
  scheduledAt: string;
  feedback?: string;
  rating?: number;
  createdAt: string;
  employees?: { id: string; user?: { firstName: string; lastName: string } };
}

export interface CreateJobPostingDto {
  title: string;
  departmentId?: string;
  description?: string;
}

export interface CreateCandidateDto {
  jobPostingId: string;
  name: string;
  email?: string;
  phone?: string;
  resumeUrl?: string;
}

export interface CreateInterviewDto {
  interviewerId?: string;
  scheduledAt: string;
}
