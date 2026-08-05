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
exports.LeadFollowUpService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../config/prisma.service");
let LeadFollowUpService = class LeadFollowUpService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async logFollowUp(leadId, companyId, userId, dto) {
        const lead = await this.prisma.lead.findFirst({
            where: { id: leadId, companyId, deletedAt: null },
        });
        if (!lead)
            throw new common_1.NotFoundException('Lead not found');
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { firstName: true, lastName: true, email: true },
        });
        const entry = await this.prisma.activityLog.create({
            data: {
                action: 'LEAD_FOLLOW_UP',
                entityType: 'Lead',
                entityId: leadId,
                companyId,
                performedById: userId,
                actorName: user ? `${user.firstName} ${user.lastName}` : null,
                actorEmail: user?.email ?? null,
                description: `[${dto.type}] ${dto.notes}`,
                metadata: {
                    followUpType: dto.type,
                    outcome: dto.outcome ?? null,
                    nextFollowUpDate: dto.nextFollowUpDate ?? null,
                    notes: dto.notes,
                },
            },
        });
        if (dto.nextFollowUpDate) {
            await this.prisma.lead.update({
                where: { id: leadId },
                data: { notes: `Next follow-up: ${dto.nextFollowUpDate} — ${dto.notes}` },
            });
        }
        return entry;
    }
    async getFollowUps(leadId, companyId) {
        const lead = await this.prisma.lead.findFirst({
            where: { id: leadId, companyId, deletedAt: null },
        });
        if (!lead)
            throw new common_1.NotFoundException('Lead not found');
        return this.prisma.activityLog.findMany({
            where: {
                entityType: 'Lead',
                entityId: leadId,
                companyId,
                action: 'LEAD_FOLLOW_UP',
                deletedAt: null,
            },
            orderBy: { createdAt: 'desc' },
        });
    }
};
exports.LeadFollowUpService = LeadFollowUpService;
exports.LeadFollowUpService = LeadFollowUpService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], LeadFollowUpService);
//# sourceMappingURL=lead-followup.service.js.map