import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';
import { TransitionService } from '../../common/services/transition.service';
import {
  CreateJobPostingDto,
  UpdateJobPostingDto,
  QueryJobPostingDto,
} from './dto/create-job-posting.dto';
import {
  CreateCandidateDto,
  UpdateCandidateDto,
  QueryCandidateDto,
} from './dto/create-candidate.dto';
import { CreateInterviewDto, UpdateInterviewDto } from './dto/create-interview.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class RecruitmentService {
  constructor(
    private prisma: PrismaService,
    private readonly transitionService: TransitionService,
  ) {}

  // ─── JOB POSTINGS ───────────────────────────────────────────────

  async findAllJobs(companyId: string, query: QueryJobPostingDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Prisma.JobPostingWhereInput = {
      companyId,
      ...(query.status && { status: query.status }),
      ...(query.departmentId && { departmentId: query.departmentId }),
      ...(query.search && {
        title: { contains: query.search, mode: 'insensitive' },
      }),
    };

    const [data, total] = await Promise.all([
      this.prisma.jobPosting.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          department: { select: { id: true, name: true } },
          _count: { select: { candidates: true } },
        },
      }),
      this.prisma.jobPosting.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOneJob(id: string, companyId: string) {
    const job = await this.prisma.jobPosting.findFirst({
      where: { id, companyId },
      include: {
        department: { select: { id: true, name: true } },
        candidates: {
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            status: true,
            createdAt: true,
          },
        },
      },
    });

    if (!job) throw new NotFoundException('Job posting not found');
    return job;
  }

  async createJob(dto: CreateJobPostingDto, companyId: string) {
    return this.prisma.jobPosting.create({
      data: {
        title: dto.title,
        companyId,
        departmentId: dto.departmentId,
        description: dto.description ?? '',
        status: 'OPEN',
      },
      include: {
        department: { select: { id: true, name: true } },
      },
    });
  }

  async updateJob(id: string, dto: UpdateJobPostingDto, companyId: string) {
    const existing = await this.prisma.jobPosting.findFirst({
      where: { id, companyId },
    });
    if (!existing) throw new NotFoundException('Job posting not found');

    // Validate JobPosting FSM transition if status is being changed
    if (dto.status && dto.status !== existing.status) {
      this.transitionService.validate('JobPosting', existing.status, dto.status);
    }

    return this.prisma.jobPosting.update({
      where: { id },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.departmentId !== undefined && { departmentId: dto.departmentId }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.status !== undefined && { status: dto.status }),
      },
    });
  }

  async removeJob(id: string, companyId: string) {
    const existing = await this.prisma.jobPosting.findFirst({
      where: { id, companyId },
    });
    if (!existing) throw new NotFoundException('Job posting not found');

    // Validate JobPosting FSM transition before closing
    this.transitionService.validate('JobPosting', existing.status, 'CLOSED');

    // Close the posting instead of hard delete since there are candidates
    return this.prisma.jobPosting.update({
      where: { id },
      data: { status: 'CLOSED' },
    });
  }

  // ─── CANDIDATES ─────────────────────────────────────────────────

  async findAllCandidates(companyId: string, query: QueryCandidateDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Prisma.CandidateWhereInput = {
      companyId,
      ...(query.jobPostingId && { jobPostingId: query.jobPostingId }),
      ...(query.status && { status: query.status }),
      ...(query.search && {
        name: { contains: query.search, mode: 'insensitive' },
      }),
    };

    const [data, total] = await Promise.all([
      this.prisma.candidate.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          jobPosting: {
            select: { id: true, title: true },
          },
          _count: { select: { interviews: true } },
        },
      }),
      this.prisma.candidate.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOneCandidate(id: string, companyId: string) {
    const candidate = await this.prisma.candidate.findFirst({
      where: { id, companyId },
      include: {
        jobPosting: {
          select: { id: true, title: true },
        },
        interviews: {
          orderBy: { scheduledAt: 'desc' },
          include: {
            interviewer: {
              select: { id: true, firstName: true, lastName: true },
            },
          },
        },
      },
    });

    if (!candidate) throw new NotFoundException('Candidate not found');
    return candidate;
  }

  async createCandidate(dto: CreateCandidateDto, companyId: string) {
    // Verify the job posting belongs to the company
    const jobPosting = await this.prisma.jobPosting.findFirst({
      where: { id: dto.jobPostingId, companyId },
    });
    if (!jobPosting) throw new NotFoundException('Job posting not found');

    if (jobPosting.status !== 'OPEN') {
      throw new BadRequestException(
        'Cannot add candidates to a closed or on-hold job posting',
      );
    }

    return this.prisma.candidate.create({
      data: {
        jobPostingId: dto.jobPostingId,
        name: dto.name,
        email: dto.email ?? '',
        phone: dto.phone,
        resumeUrl: dto.resumeUrl,
        notes: dto.notes,
        status: 'APPLIED',
        companyId,
      },
      include: {
        jobPosting: {
          select: { id: true, title: true },
        },
      },
    });
  }

  async updateCandidate(id: string, dto: UpdateCandidateDto, companyId: string) {
    const existing = await this.prisma.candidate.findFirst({
      where: { id, companyId },
    });
    if (!existing) throw new NotFoundException('Candidate not found');

    // Validate Candidate FSM transition if status is being changed
    if (dto.status && dto.status !== existing.status) {
      this.transitionService.validate('Candidate', existing.status, dto.status);
    }

    return this.prisma.candidate.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.email !== undefined && { email: dto.email }),
        ...(dto.phone !== undefined && { phone: dto.phone }),
        ...(dto.resumeUrl !== undefined && { resumeUrl: dto.resumeUrl }),
        ...(dto.status !== undefined && { status: dto.status }),
        ...(dto.notes !== undefined && { notes: dto.notes }),
      },
    });
  }

  // ─── INTERVIEWS ─────────────────────────────────────────────────

  async scheduleInterview(
    candidateId: string,
    dto: CreateInterviewDto,
    companyId: string,
  ) {
    // Verify candidate exists and belongs to company
    const candidate = await this.prisma.candidate.findFirst({
      where: { id: candidateId, companyId },
    });
    if (!candidate) throw new NotFoundException('Candidate not found');

    return this.prisma.interview.create({
      data: {
        candidateId,
        interviewerId: dto.interviewerId,
        scheduledAt: new Date(dto.scheduledAt),
        feedback: dto.feedback,
        rating: dto.rating,
        companyId,
      },
      include: {
        interviewer: {
          select: { id: true, firstName: true, lastName: true },
        },
        candidate: {
          select: { id: true, name: true },
        },
      },
    });
  }

  async updateInterview(id: string, dto: UpdateInterviewDto, companyId: string) {
    const existing = await this.prisma.interview.findFirst({
      where: { id, companyId },
    });
    if (!existing) throw new NotFoundException('Interview not found');

    return this.prisma.interview.update({
      where: { id },
      data: {
        ...(dto.interviewerId !== undefined && { interviewerId: dto.interviewerId }),
        ...(dto.scheduledAt !== undefined && { scheduledAt: new Date(dto.scheduledAt) }),
        ...(dto.feedback !== undefined && { feedback: dto.feedback }),
        ...(dto.rating !== undefined && { rating: dto.rating }),
      },
      include: {
        interviewer: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });
  }
}
