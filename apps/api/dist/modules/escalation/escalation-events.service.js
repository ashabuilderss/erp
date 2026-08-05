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
exports.EscalationEventsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../config/prisma.service");
let EscalationEventsService = class EscalationEventsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(companyId, status) {
        return this.prisma.escalationEvent.findMany({
            where: {
                companyId,
                ...(status && { status: status }),
            },
            orderBy: { triggeredAt: 'desc' },
            include: {
                escalationRules: {
                    select: { name: true, triggerType: true, level: true },
                },
            },
        });
    }
    async resolve(id, companyId) {
        const event = await this.prisma.escalationEvent.findFirst({
            where: { id, companyId },
        });
        if (!event)
            throw new common_1.NotFoundException('Escalation event not found');
        return this.prisma.escalationEvent.update({
            where: { id },
            data: {
                status: 'RESOLVED',
                resolvedAt: new Date(),
            },
        });
    }
};
exports.EscalationEventsService = EscalationEventsService;
exports.EscalationEventsService = EscalationEventsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], EscalationEventsService);
//# sourceMappingURL=escalation-events.service.js.map