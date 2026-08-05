import { PrismaService } from '../../config/prisma.service';
import { TransitionService } from '../../common/services/transition.service';
import { CreateJobPostingDto, UpdateJobPostingDto, QueryJobPostingDto } from './dto/create-job-posting.dto';
import { CreateCandidateDto, UpdateCandidateDto, QueryCandidateDto } from './dto/create-candidate.dto';
import { CreateInterviewDto, UpdateInterviewDto } from './dto/create-interview.dto';
export declare class RecruitmentService {
    private prisma;
    private readonly transitionService;
    constructor(prisma: PrismaService, transitionService: TransitionService);
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
    findOneJob(id: string, companyId: string): Promise<{
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
    createJob(dto: CreateJobPostingDto, companyId: string): Promise<{
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
    updateJob(id: string, dto: UpdateJobPostingDto, companyId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        description: string;
        departmentId: string;
        status: import(".prisma/client").$Enums.JobPostingStatus;
        title: string;
    }>;
    removeJob(id: string, companyId: string): Promise<{
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
    findOneCandidate(id: string, companyId: string): Promise<{
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
    createCandidate(dto: CreateCandidateDto, companyId: string): Promise<{
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
    updateCandidate(id: string, dto: UpdateCandidateDto, companyId: string): Promise<{
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
    scheduleInterview(candidateId: string, dto: CreateInterviewDto, companyId: string): Promise<{
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
    updateInterview(id: string, dto: UpdateInterviewDto, companyId: string): Promise<{
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
