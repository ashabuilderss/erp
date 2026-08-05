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
var ApprovalsSpawningService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApprovalsSpawningService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../config/prisma.service");
const client_1 = require("@prisma/client");
const governance_event_publisher_1 = require("../governance-events/governance-event.publisher");
const events_1 = require("../governance-events/types/events");
let ApprovalsSpawningService = ApprovalsSpawningService_1 = class ApprovalsSpawningService {
    prisma;
    eventPublisher;
    logger = new common_1.Logger(ApprovalsSpawningService_1.name);
    constructor(prisma, eventPublisher) {
        this.prisma = prisma;
        this.eventPublisher = eventPublisher;
    }
    async spawnRequest(companyId, entityType, entityId, createdById) {
        const template = await this.prisma.approvalTemplate.findUnique({
            where: {
                companyId_entityType: {
                    companyId,
                    entityType,
                },
            },
            include: {
                approvalTemplateSteps: {
                    orderBy: { sequence: 'asc' },
                },
            },
        });
        if (!template) {
            throw new common_1.NotFoundException(`Approval template not found for entity type: ${entityType}`);
        }
        if (template.approvalTemplateSteps.length === 0) {
            throw new common_1.BadRequestException('Approval template has no steps configured.');
        }
        const employee = await this.prisma.employee.findFirst({
            where: { userId: createdById, companyId },
        });
        let defaultOwnerUserId = null;
        const fetchOwner = async () => {
            if (defaultOwnerUserId)
                return defaultOwnerUserId;
            const ownerUser = await this.prisma.user.findFirst({
                where: { companyId, role: 'OWNER' },
            });
            defaultOwnerUserId = ownerUser?.id || createdById;
            return defaultOwnerUserId;
        };
        return await this.prisma.$transaction(async (tx) => {
            const request = await tx.approvalRequest.create({
                data: {
                    companyId,
                    entityType,
                    entityId,
                    createdById,
                    status: client_1.ApprovalStatus.PENDING,
                },
            });
            let managerFallbackAudits = 0;
            for (const tStep of template.approvalTemplateSteps) {
                let finalUserId = tStep.requiredUserId;
                const finalRoleId = tStep.requiredRoleId;
                let escalationLvl = 0;
                if (tStep.isDirectManager) {
                    if (employee && employee.managerId) {
                        const manager = await tx.employee.findUnique({
                            where: { id: employee.managerId },
                        });
                        if (manager && manager.userId) {
                            finalUserId = manager.userId;
                        }
                        else {
                            finalUserId = await fetchOwner();
                            escalationLvl = 1;
                            managerFallbackAudits++;
                        }
                    }
                    else {
                        finalUserId = await fetchOwner();
                        escalationLvl = 1;
                        managerFallbackAudits++;
                    }
                }
                const now = new Date();
                const deadline = new Date(now.getTime() + tStep.slaHours * 60 * 60 * 1000);
                const step = await tx.approvalStep.create({
                    data: {
                        companyId,
                        requestId: request.id,
                        sequence: tStep.sequence,
                        requiredRoleId: finalRoleId,
                        requiredUserId: finalUserId,
                        isDirectManager: tStep.isDirectManager,
                        status: client_1.ApprovalStatus.PENDING,
                        slaDeadline: deadline,
                        escalationLevel: escalationLvl,
                    },
                });
                if (escalationLvl > 0 && tStep.isDirectManager) {
                    await tx.approvalHistory.create({
                        data: {
                            companyId,
                            requestId: request.id,
                            stepId: step.id,
                            action: 'MANAGER_FALLBACK_TO_OWNER',
                            comments: 'No direct manager found. Forcibly routed to Owner.',
                        },
                    });
                }
            }
            await tx.approvalHistory.create({
                data: {
                    companyId,
                    requestId: request.id,
                    action: 'REQUEST_SPAWNED',
                    comments: `Workflow dynamically spawned from template ${template.id}`,
                },
            });
            await this.eventPublisher.publish(tx, {
                correlationId: request.id,
                eventType: events_1.DomainEventTypes.APPROVAL_CREATED,
                entityId: request.entityId,
                entityType: request.entityType,
                companyId: request.companyId,
                payload: {
                    companyId: request.companyId,
                    requestId: request.id,
                    entityType: request.entityType,
                    entityId: request.entityId,
                    createdById,
                },
            });
            return request;
        });
    }
};
exports.ApprovalsSpawningService = ApprovalsSpawningService;
exports.ApprovalsSpawningService = ApprovalsSpawningService = ApprovalsSpawningService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        governance_event_publisher_1.GovernanceEventPublisher])
], ApprovalsSpawningService);
//# sourceMappingURL=approvals-spawning.service.js.map