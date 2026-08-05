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
var TaskExtensionService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskExtensionService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../config/prisma.service");
const approvals_1 = require("../approvals");
const client_1 = require("@prisma/client");
let TaskExtensionService = TaskExtensionService_1 = class TaskExtensionService {
    prisma;
    spawningService;
    logger = new common_1.Logger(TaskExtensionService_1.name);
    constructor(prisma, spawningService) {
        this.prisma = prisma;
        this.spawningService = spawningService;
    }
    async requestExtension(companyId, taskId, actorId, dto) {
        const actor = await this.prisma.employee.findFirst({
            where: { userId: actorId, companyId },
        });
        if (!actor)
            throw new common_1.BadRequestException('Actor not found.');
        const newDueDate = new Date(dto.requestedDueDate);
        return await this.prisma.$transaction(async (tx) => {
            const task = await tx.task.findFirst({
                where: { id: taskId, companyId },
            });
            if (!task)
                throw new common_1.BadRequestException('Task not found.');
            if (newDueDate <= task.dueDate) {
                throw new common_1.BadRequestException('Requested due date must be later than the current due date.');
            }
            const existingPending = await tx.taskExtension.findFirst({
                where: { taskId, status: client_1.ApprovalStatus.PENDING },
            });
            if (existingPending) {
                throw new common_1.BadRequestException('A Task may only have one PENDING TaskExtension at any time.');
            }
            const extension = await tx.taskExtension.create({
                data: {
                    taskId,
                    companyId,
                    requestedDueDate: newDueDate,
                    reason: dto.reason,
                    status: client_1.ApprovalStatus.PENDING,
                },
            });
            const creatorEmployee = await this.prisma.employee.findUnique({
                where: { id: task.creatorId },
                select: { userId: true },
            });
            const approvalReq = await this.spawningService.spawnRequest(companyId, 'TASK_EXTENSION', extension.id, creatorEmployee?.userId || actorId);
            await tx.taskExtension.update({
                where: { id: extension.id },
                data: { approvalId: approvalReq.id },
            });
            await tx.taskHistory.create({
                data: {
                    taskId,
                    companyId,
                    actorId: actor.id,
                    event: 'EXTENSION_REQUESTED',
                    comments: `Extension requested to ${dto.requestedDueDate}. Reason: ${dto.reason}`,
                },
            });
            return extension;
        });
    }
    async processExtensionOutcome(approvalId, status) {
        const extension = await this.prisma.taskExtension.findFirst({
            where: { approvalId, status: client_1.ApprovalStatus.PENDING },
            include: { tasks: true },
        });
        if (!extension)
            return;
        await this.prisma.$transaction(async (tx) => {
            await tx.taskExtension.update({
                where: { id: extension.id },
                data: { status },
            });
            if (status === client_1.ApprovalStatus.APPROVED) {
                await tx.task.update({
                    where: { id: extension.taskId },
                    data: { dueDate: extension.requestedDueDate },
                });
                await tx.taskHistory.create({
                    data: {
                        taskId: extension.taskId,
                        companyId: extension.tasks.companyId,
                        event: 'EXTENSION_APPROVED',
                        comments: `Task due date extended to ${extension.requestedDueDate.toISOString()}`,
                    },
                });
            }
            else if (status === client_1.ApprovalStatus.REJECTED) {
                await tx.taskHistory.create({
                    data: {
                        taskId: extension.taskId,
                        companyId: extension.tasks.companyId,
                        event: 'EXTENSION_REJECTED',
                        comments: `Task extension request was rejected.`,
                    },
                });
            }
        });
    }
};
exports.TaskExtensionService = TaskExtensionService;
exports.TaskExtensionService = TaskExtensionService = TaskExtensionService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        approvals_1.ApprovalsSpawningService])
], TaskExtensionService);
//# sourceMappingURL=task-extension.service.js.map