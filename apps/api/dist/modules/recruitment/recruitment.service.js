"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecruitmentService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../config/prisma.service");
const transition_service_1 = require("../../common/services/transition.service");
let RecruitmentService = class RecruitmentService {
    prisma;
    transitionService;
    constructor(prisma, transitionService) {
        this.prisma = prisma;
        this.transitionService = transitionService;
    }
    async findAllJobs(companyId, query) {
        const page = query.page ?? 1;
        const limit = query.limit ?? 20;
        const skip = (page - 1) * limit;
        const where = {
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
    async findOneJob(id, companyId) {
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
        if (!job)
            throw new common_1.NotFoundException('Job posting not found');
        return job;
    }
    async createJob(dto, companyId) {
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
    async updateJob(id, dto, companyId) {
        const existing = await this.prisma.jobPosting.findFirst({
            where: { id, companyId },
        });
        if (!existing)
            throw new common_1.NotFoundException('Job posting not found');
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
    async removeJob(id, companyId) {
        const existing = await this.prisma.jobPosting.findFirst({
            where: { id, companyId },
        });
        if (!existing)
            throw new common_1.NotFoundException('Job posting not found');
        this.transitionService.validate('JobPosting', existing.status, 'CLOSED');
        return this.prisma.jobPosting.update({
            where: { id },
            data: { status: 'CLOSED' },
        });
    }
    async findAllCandidates(companyId, query) {
        const page = query.page ?? 1;
        const limit = query.limit ?? 20;
        const skip = (page - 1) * limit;
        const where = {
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
    async findOneCandidate(id, companyId) {
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
        if (!candidate)
            throw new common_1.NotFoundException('Candidate not found');
        return candidate;
    }
    async createCandidate(dto, companyId) {
        const jobPosting = await this.prisma.jobPosting.findFirst({
            where: { id: dto.jobPostingId, companyId },
        });
        if (!jobPosting)
            throw new common_1.NotFoundException('Job posting not found');
        if (jobPosting.status !== 'OPEN') {
            throw new common_1.BadRequestException('Cannot add candidates to a closed or on-hold job posting');
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
    async updateCandidate(id, dto, companyId) {
        const existing = await this.prisma.candidate.findFirst({
            where: { id, companyId },
        });
        if (!existing)
            throw new common_1.NotFoundException('Candidate not found');
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
    async scheduleInterview(candidateId, dto, companyId) {
        const candidate = await this.prisma.candidate.findFirst({
            where: { id: candidateId, companyId },
        });
        if (!candidate)
            throw new common_1.NotFoundException('Candidate not found');
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
    async updateInterview(id, dto, companyId) {
        const existing = await this.prisma.interview.findFirst({
            where: { id, companyId },
        });
        if (!existing)
            throw new common_1.NotFoundException('Interview not found');
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
};
exports.RecruitmentService = RecruitmentService;
exports.RecruitmentService = RecruitmentService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        transition_service_1.TransitionService])
], RecruitmentService);
//# sourceMappingURL=recruitment.service.js.map