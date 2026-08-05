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
exports.TaskCommentsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../config/prisma.service");
const transition_service_1 = require("../../../common/services/transition.service");
const client_1 = require("@prisma/client");
let TaskCommentsService = class TaskCommentsService {
    prisma;
    transitionService;
    constructor(prisma, transitionService) {
        this.prisma = prisma;
        this.transitionService = transitionService;
    }
    async findByAssignment(assignmentId, companyId, employeeId, role) {
        const where = {
            assignmentId,
            companyId,
            deletedAt: null,
        };
        if (role !== client_1.UserRole.ADMIN) {
            where.OR = [{ isPrivate: false }, { authorId: employeeId }];
        }
        return this.prisma.taskComment.findMany({
            where,
            include: {
                employees: { include: { users: true } },
            },
            orderBy: { createdAt: 'asc' },
        });
    }
    async create(dto, companyId, authorId) {
        return this.prisma.taskComment.create({
            data: {
                assignmentId: dto.assignmentId,
                companyId,
                authorId,
                content: dto.content,
                isPrivate: dto.isPrivate ?? false,
            },
            include: {
                employees: { include: { users: true } },
            },
        });
    }
    async remove(id, companyId, employeeId, role) {
        const comment = await this.prisma.taskComment.findFirst({
            where: { id, companyId },
        });
        if (!comment) {
            throw new common_1.NotFoundException(`Comment with ID ${id} not found`);
        }
        if (role !== client_1.UserRole.ADMIN && comment.authorId !== employeeId) {
            throw new common_1.NotFoundException(`Comment with ID ${id} not found`);
        }
        return this.prisma.taskComment.update({ where: { id }, data: { deletedAt: new Date() } });
    }
};
exports.TaskCommentsService = TaskCommentsService;
exports.TaskCommentsService = TaskCommentsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        transition_service_1.TransitionService])
], TaskCommentsService);
//# sourceMappingURL=task-comments.service.js.map