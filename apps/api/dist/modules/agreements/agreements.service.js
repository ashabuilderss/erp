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
exports.AgreementsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../config/prisma.service");
const transition_service_1 = require("../../common/services/transition.service");
const client_1 = require("@prisma/client");
let AgreementsService = class AgreementsService {
    prisma;
    transitionService;
    constructor(prisma, transitionService) {
        this.prisma = prisma;
        this.transitionService = transitionService;
    }
    async findAll(companyId, query) {
        const page = query.page ?? 1;
        const limit = query.limit ?? 20;
        const skip = (page - 1) * limit;
        const where = {
            companyId,
            deletedAt: null,
            ...(query.type && { type: query.type }),
            ...(query.status && { status: query.status }),
            ...(query.search && {
                title: { contains: query.search, mode: 'insensitive' },
            }),
        };
        const [data, total] = await Promise.all([
            this.prisma.agreement.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    createdBy: {
                        select: { id: true, firstName: true, lastName: true },
                    },
                    _count: { select: { approvals: true } },
                },
            }),
            this.prisma.agreement.count({ where }),
        ]);
        return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
    }
    async create(dto, createdById, companyId) {
        return this.prisma.$transaction(async (tx) => {
            const agreement = await tx.agreement.create({
                data: {
                    title: dto.title,
                    type: dto.type,
                    content: dto.content,
                    attachments: dto.attachments ?? client_1.Prisma.JsonNull,
                    companyId,
                    createdById,
                    status: 'DRAFT',
                },
            });
            if (dto.approvalSteps && dto.approvalSteps.length > 0) {
                await tx.agreementApproval.createMany({
                    data: dto.approvalSteps.map((step) => ({
                        companyId,
                        agreementId: agreement.id,
                        approverId: step.approverId,
                        step: step.step,
                        status: 'PENDING',
                    })),
                });
            }
            return this.findOne(agreement.id, companyId);
        });
    }
    async findOne(id, companyId) {
        const agreement = await this.prisma.agreement.findFirst({
            where: { id, companyId, deletedAt: null },
            include: {
                createdBy: {
                    select: { id: true, firstName: true, lastName: true },
                },
                approvals: {
                    orderBy: { step: 'asc' },
                    include: {
                        approver: {
                            select: { id: true, firstName: true, lastName: true },
                        },
                    },
                },
            },
        });
        if (!agreement)
            throw new common_1.NotFoundException('Agreement not found');
        return agreement;
    }
    async update(id, dto, companyId) {
        const existing = await this.prisma.agreement.findFirst({
            where: { id, companyId, deletedAt: null },
        });
        if (!existing)
            throw new common_1.NotFoundException('Agreement not found');
        if (existing.status !== 'DRAFT') {
            throw new common_1.BadRequestException('Can only edit agreements in DRAFT status');
        }
        return this.prisma.agreement.update({
            where: { id },
            data: {
                ...(dto.title !== undefined && { title: dto.title }),
                ...(dto.type !== undefined && { type: dto.type }),
                ...(dto.content !== undefined && { content: dto.content }),
                ...(dto.attachments !== undefined && { attachments: dto.attachments }),
            },
        });
    }
    async remove(id, companyId) {
        const existing = await this.prisma.agreement.findFirst({
            where: { id, companyId, deletedAt: null },
        });
        if (!existing)
            throw new common_1.NotFoundException('Agreement not found');
        return this.prisma.agreement.update({
            where: { id },
            data: { deletedAt: new Date() },
        });
    }
    async submit(id, companyId) {
        const agreement = await this.prisma.agreement.findFirst({
            where: { id, companyId, deletedAt: null },
            include: { approvals: true },
        });
        if (!agreement)
            throw new common_1.NotFoundException('Agreement not found');
        if (agreement.status !== 'DRAFT') {
            throw new common_1.BadRequestException('Only DRAFT agreements can be submitted');
        }
        if (!agreement.approvals || agreement.approvals.length === 0) {
            throw new common_1.BadRequestException('Cannot submit an agreement without approval steps. Add approval steps first.');
        }
        this.transitionService.validate('Agreement', agreement.status, 'PENDING_APPROVAL');
        return this.prisma.agreement.update({
            where: { id },
            data: { status: 'PENDING_APPROVAL' },
        });
    }
    async approve(id, approverId, companyId, comments) {
        const agreement = await this.prisma.agreement.findFirst({
            where: { id, companyId, deletedAt: null },
            include: { approvals: { orderBy: { step: 'asc' } } },
        });
        if (!agreement)
            throw new common_1.NotFoundException('Agreement not found');
        if (agreement.status !== 'PENDING_APPROVAL') {
            throw new common_1.BadRequestException('Agreement is not pending approval');
        }
        const pendingStep = agreement.approvals.find((a) => a.approverId === approverId && a.status === 'PENDING');
        if (!pendingStep) {
            throw new common_1.BadRequestException('You do not have a pending approval step for this agreement');
        }
        return this.prisma.$transaction(async (tx) => {
            await tx.agreementApproval.update({
                where: { id: pendingStep.id },
                data: { status: 'APPROVED', comments },
            });
            const updatedApprovals = await tx.agreementApproval.findMany({
                where: { agreementId: id },
            });
            const allApproved = updatedApprovals.every((a) => a.status === 'APPROVED');
            if (allApproved) {
                this.transitionService.validate('Agreement', agreement.status, 'APPROVED');
                await tx.agreement.update({
                    where: { id },
                    data: { status: 'APPROVED' },
                });
            }
            return tx.agreement.findUnique({
                where: { id },
                include: {
                    approvals: {
                        orderBy: { step: 'asc' },
                        include: {
                            approver: {
                                select: { id: true, firstName: true, lastName: true },
                            },
                        },
                    },
                },
            });
        });
    }
    async archive(id, companyId) {
        const agreement = await this.prisma.agreement.findFirst({
            where: { id, companyId, deletedAt: null },
        });
        if (!agreement)
            throw new common_1.NotFoundException('Agreement not found');
        if (agreement.status !== 'APPROVED') {
            throw new common_1.BadRequestException('Only APPROVED agreements can be archived');
        }
        this.transitionService.validate('Agreement', agreement.status, 'ARCHIVED');
        return this.prisma.agreement.update({
            where: { id },
            data: { status: 'ARCHIVED' },
        });
    }
};
exports.AgreementsService = AgreementsService;
exports.AgreementsService = AgreementsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        transition_service_1.TransitionService])
], AgreementsService);
//# sourceMappingURL=agreements.service.js.map