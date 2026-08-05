import { RecruitmentService } from './recruitment.service';
import { CreateJobPostingDto, UpdateJobPostingDto, QueryJobPostingDto } from './dto/create-job-posting.dto';
import { CreateCandidateDto, UpdateCandidateDto, QueryCandidateDto } from './dto/create-candidate.dto';
import { CreateInterviewDto, UpdateInterviewDto } from './dto/create-interview.dto';
export declare class RecruitmentController {
    private readonly recruitmentService;
    constructor(recruitmentService: RecruitmentService);
    findAllJobs(companyId: string, query: QueryJobPostingDto): Promise<{
        data: ({
            department: {
                name: string;
                id: string;
            };
            _count: {
                candidates: number;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            companyId: string;
            description: string;
            departmentId: string;
            status: import(".prisma/client").$Enums.JobPostingStatus;
            title: string;
        })[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    createJob(companyId: string, dto: CreateJobPostingDto): Promise<{
        department: {
            name: string;
            id: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        description: string;
        departmentId: string;
        status: import(".prisma/client").$Enums.JobPostingStatus;
        title: string;
    }>;
    findOneJob(companyId: string, id: string): Promise<{
        department: {
            name: string;
            id: string;
        };
        candidates: {
            name: string;
            id: string;
            email: string;
            createdAt: Date;
            status: import(".prisma/client").$Enums.CandidateStatus;
            phone: string | null;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        description: string;
        departmentId: string;
        status: import(".prisma/client").$Enums.JobPostingStatus;
        title: string;
    }>;
    updateJob(companyId: string, id: string, dto: UpdateJobPostingDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        description: string;
        departmentId: string;
        status: import(".prisma/client").$Enums.JobPostingStatus;
        title: string;
    }>;
    removeJob(companyId: string, id: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        description: string;
        departmentId: string;
        status: import(".prisma/client").$Enums.JobPostingStatus;
        title: string;
    }>;
    findAllCandidates(companyId: string, query: QueryCandidateDto): Promise<{
        data: ({
            jobPosting: {
                id: string;
                title: string;
            };
            _count: {
                interviews: number;
            };
        } & {
            name: string;
            id: string;
            email: string;
            createdAt: Date;
            updatedAt: Date;
            companyId: string;
            status: import(".prisma/client").$Enums.CandidateStatus;
            phone: string | null;
            notes: string | null;
            resumeUrl: string | null;
            jobPostingId: string;
        })[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    createCandidate(companyId: string, dto: CreateCandidateDto): Promise<{
        jobPosting: {
            id: string;
            title: string;
        };
    } & {
        name: string;
        id: string;
        email: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        status: import(".prisma/client").$Enums.CandidateStatus;
        phone: string | null;
        notes: string | null;
        resumeUrl: string | null;
        jobPostingId: string;
    }>;
    findOneCandidate(companyId: string, id: string): Promise<{
        jobPosting: {
            id: string;
            title: string;
        };
        interviews: ({
            interviewer: {
                id: string;
                firstName: string;
                lastName: string;
            };
        } & {
            id: string;
            createdAt: Date;
            companyId: string;
            feedback: string | null;
            rating: number | null;
            scheduledAt: Date;
            candidateId: string;
            interviewerId: string;
        })[];
    } & {
        name: string;
        id: string;
        email: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        status: import(".prisma/client").$Enums.CandidateStatus;
        phone: string | null;
        notes: string | null;
        resumeUrl: string | null;
        jobPostingId: string;
    }>;
    updateCandidate(companyId: string, id: string, dto: UpdateCandidateDto): Promise<{
        name: string;
        id: string;
        email: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        status: import(".prisma/client").$Enums.CandidateStatus;
        phone: string | null;
        notes: string | null;
        resumeUrl: string | null;
        jobPostingId: string;
    }>;
    scheduleInterview(companyId: string, candidateId: string, dto: CreateInterviewDto): Promise<{
        candidate: {
            name: string;
            id: string;
        };
        interviewer: {
            id: string;
            firstName: string;
            lastName: string;
        };
    } & {
        id: string;
        createdAt: Date;
        companyId: string;
        feedback: string | null;
        rating: number | null;
        scheduledAt: Date;
        candidateId: string;
        interviewerId: string;
    }>;
    updateInterview(companyId: string, id: string, dto: UpdateInterviewDto): Promise<{
        interviewer: {
            id: string;
            firstName: string;
            lastName: string;
        };
    } & {
        id: string;
        createdAt: Date;
        companyId: string;
        feedback: string | null;
        rating: number | null;
        scheduledAt: Date;
        candidateId: string;
        interviewerId: string;
    }>;
}
