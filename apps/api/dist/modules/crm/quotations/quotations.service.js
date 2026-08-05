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
exports.QuotationsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../config/prisma.service");
const transition_service_1 = require("../../../common/services/transition.service");
const client_1 = require("@prisma/client");
const quotation_pdf_service_1 = require("./quotation-pdf.service");
let QuotationsService = class QuotationsService {
    prisma;
    pdfService;
    transitionService;
    constructor(prisma, pdfService, transitionService) {
        this.prisma = prisma;
        this.pdfService = pdfService;
        this.transitionService = transitionService;
    }
    async create(companyId, employeeId, dto) {
        const existing = await this.prisma.quotation.findFirst({
            where: { companyId, referenceNumber: dto.referenceNumber },
        });
        if (existing) {
            throw new common_1.BadRequestException('Quotation reference number must be unique');
        }
        return await this.prisma.quotation.create({
            data: {
                companyId,
                referenceNumber: dto.referenceNumber,
                leadId: dto.leadId,
                propertyId: dto.propertyId,
                customerId: dto.customerId,
                totalAmount: dto.totalAmount,
                breakdown: dto.breakdown,
                validUntil: new Date(dto.validUntil),
                notes: dto.notes,
                createdById: employeeId,
            },
        });
    }
    async findAll(companyId, query) {
        const { page = 1, limit = 10, status, leadId, propertyId } = query;
        const skip = (page - 1) * limit;
        const where = {
            companyId,
            deletedAt: null,
            ...(status ? { status } : {}),
            ...(leadId ? { leadId } : {}),
            ...(propertyId ? { propertyId } : {}),
        };
        const [items, total] = await Promise.all([
            this.prisma.quotation.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    createdBy: true,
                    lead: true,
                    customer: true,
                },
            }),
            this.prisma.quotation.count({ where }),
        ]);
        return {
            items,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    async findOne(companyId, id, userId, ipAddress, userAgent) {
        const quotation = await this.prisma.quotation.findFirst({
            where: { id, companyId, deletedAt: null },
            include: {
                createdBy: true,
                companies: true,
            },
        });
        if (!quotation) {
            throw new common_1.NotFoundException('Quotation not found');
        }
        await this.logAccess(companyId, id, userId, client_1.QuotationAction.VIEW, ipAddress, userAgent);
        return quotation;
    }
    async updateStatus(companyId, id, dto) {
        const quotation = await this.prisma.quotation.findFirst({
            where: { id, companyId, deletedAt: null },
        });
        if (!quotation) {
            throw new common_1.NotFoundException('Quotation not found');
        }
        this.transitionService.validate('Quotation', quotation.status, dto.status);
        return await this.prisma.quotation.update({
            where: { id },
            data: { status: dto.status },
        });
    }
    async downloadPdf(companyId, id, userId, email, ipAddress, userAgent) {
        const quotation = await this.prisma.quotation.findFirst({
            where: { id, companyId, deletedAt: null },
            include: {
                createdBy: true,
                companies: true,
            },
        });
        if (!quotation) {
            throw new common_1.NotFoundException('Quotation not found');
        }
        await this.logAccess(companyId, id, userId, client_1.QuotationAction.DOWNLOAD, ipAddress, userAgent);
        return await this.pdfService.generateWatermarkedPdf(quotation, email);
    }
    async getAccessLogs(companyId, quotationId) {
        return await this.prisma.quotationAccessLog.findMany({
            where: { companyId, quotationId },
            orderBy: { createdAt: 'desc' },
            include: {
                user: {
                    select: { id: true, email: true, firstName: true, lastName: true },
                },
            },
        });
    }
    async logAccess(companyId, quotationId, userId, action, ipAddress, userAgent) {
        await this.prisma.quotationAccessLog.create({
            data: {
                companyId,
                quotationId,
                userId,
                action,
                ipAddress,
                userAgent,
            },
        });
    }
};
exports.QuotationsService = QuotationsService;
exports.QuotationsService = QuotationsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        quotation_pdf_service_1.QuotationPdfService,
        transition_service_1.TransitionService])
], QuotationsService);
//# sourceMappingURL=quotations.service.js.map