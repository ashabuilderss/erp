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
var TaskWarningWorker_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskWarningWorker = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const prisma_service_1 = require("../../config/prisma.service");
const client_1 = require("@prisma/client");
let TaskWarningWorker = TaskWarningWorker_1 = class TaskWarningWorker {
    prisma;
    logger = new common_1.Logger(TaskWarningWorker_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    async handlePendingTaskWarnings() {
        this.logger.debug('Running Pending Task Warning Worker...');
        const now = new Date();
        const thresholdDate = new Date(now.getTime() + 2 * 60 * 60 * 1000);
        const pendingTasks = await this.prisma.task.findMany({
            where: {
                status: client_1.TaskStatus.PENDING,
                dueDate: {
                    gt: now,
                    lte: thresholdDate,
                },
            },
            include: {
                taskHistories: true,
            },
        });
        for (const task of pendingTasks) {
            const alreadyWarned = task.taskHistories.some((history) => history.event === 'TASK_DUE_WARNING');
            if (!alreadyWarned) {
                await this.prisma.taskHistory.create({
                    data: {
                        taskId: task.id,
                        companyId: task.companyId,
                        event: 'TASK_DUE_WARNING',
                        comments: 'System warning: Task is due in less than 2 hours.',
                    },
                });
                this.logger.log(`Generated due date warning for task ${task.id}`);
            }
        }
    }
};
exports.TaskWarningWorker = TaskWarningWorker;
__decorate([
    (0, schedule_1.Cron)('0 0 * * * *'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], TaskWarningWorker.prototype, "handlePendingTaskWarnings", null);
exports.TaskWarningWorker = TaskWarningWorker = TaskWarningWorker_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], TaskWarningWorker);
//# sourceMappingURL=task-warning.worker.js.map