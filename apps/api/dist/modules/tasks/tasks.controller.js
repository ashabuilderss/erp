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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TasksController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const permissions_decorator_1 = require("../../common/decorators/permissions.decorator");
const permissions_1 = require("../../common/auth/permissions");
const tasks_service_1 = require("./tasks.service");
const task_proof_service_1 = require("./task-proof.service");
const task_extension_service_1 = require("./task-extension.service");
const tasks_dto_1 = require("./dto/tasks.dto");
const query_task_dto_1 = require("./dto/query-task.dto");
const client_1 = require("@prisma/client");
const idempotency_decorator_1 = require("../../common/decorators/idempotency.decorator");
let TasksController = class TasksController {
    tasksService;
    proofService;
    extensionService;
    constructor(tasksService, proofService, extensionService) {
        this.tasksService = tasksService;
        this.proofService = proofService;
        this.extensionService = extensionService;
    }
    async createTask(req, dto) {
        const isOwner = req.user.role === 'OWNER';
        return await this.tasksService.createTask(req.user.companyId, req.user.id, dto, isOwner);
    }
    async findAll(req, query) {
        return await this.tasksService.findAll(req.user.companyId, query);
    }
    async findMyTasks(req, query) {
        return await this.tasksService.findMyTasks(req.user.companyId, req.user.id, query);
    }
    async findOne(id, req) {
        return await this.tasksService.findOne(req.user.companyId, id);
    }
    async reassignTask(id, req, dto) {
        return await this.tasksService.reassignTask(req.user.companyId, id, req.user.id, dto);
    }
    async cancelTask(id, req) {
        return await this.tasksService.cancelTask(req.user.companyId, id, req.user.id);
    }
    async acknowledgeTask(id, req) {
        return await this.tasksService.acknowledgeTask(req.user.companyId, id, req.user.id);
    }
    async submitProof(id, req, dto) {
        return await this.proofService.submitProof(req.user.companyId, id, req.user.id, dto);
    }
    async acknowledgeCompletion(proofId, req, dto) {
        return await this.proofService.acknowledgeCompletion(req.user.companyId, proofId, req.user.id, dto);
    }
    async approveCompletion(proofId, req, dto) {
        return await this.proofService.approveCompletion(req.user.companyId, proofId, req.user.id, dto);
    }
    async rejectCompletion(proofId, req, dto) {
        return await this.proofService.rejectCompletion(req.user.companyId, proofId, req.user.id, dto);
    }
    async requestExtension(id, req, dto) {
        return await this.extensionService.requestExtension(req.user.companyId, id, req.user.id, dto);
    }
};
exports.TasksController = TasksController;
__decorate([
    (0, common_1.Post)(),
    (0, idempotency_decorator_1.UseIdempotency)(),
    (0, roles_decorator_1.Roles)(client_1.UserRole.OWNER, client_1.UserRole.ADMIN, client_1.UserRole.MANAGER, client_1.UserRole.TEAM_LEAD),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.TASK_ASSIGN),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, tasks_dto_1.CreateTaskDto]),
    __metadata("design:returntype", Promise)
], TasksController.prototype, "createTask", null);
__decorate([
    (0, common_1.Get)(),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.TASK_ASSIGN),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, query_task_dto_1.QueryTaskDto]),
    __metadata("design:returntype", Promise)
], TasksController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('me'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.OWNER, client_1.UserRole.ADMIN, client_1.UserRole.EMPLOYEE, client_1.UserRole.FIELD_EMPLOYEE, client_1.UserRole.MANAGER, client_1.UserRole.TEAM_LEAD, client_1.UserRole.HR_MANAGER),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.TASK_ASSIGN),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, query_task_dto_1.QueryTaskDto]),
    __metadata("design:returntype", Promise)
], TasksController.prototype, "findMyTasks", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.TASK_ASSIGN),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], TasksController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(':id/reassign'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.OWNER, client_1.UserRole.ADMIN, client_1.UserRole.MANAGER, client_1.UserRole.TEAM_LEAD),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.TASK_ASSIGN),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, tasks_dto_1.ReassignTaskDto]),
    __metadata("design:returntype", Promise)
], TasksController.prototype, "reassignTask", null);
__decorate([
    (0, common_1.Post)(':id/cancel'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.OWNER, client_1.UserRole.ADMIN, client_1.UserRole.MANAGER, client_1.UserRole.TEAM_LEAD),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.TASK_ASSIGN),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], TasksController.prototype, "cancelTask", null);
__decorate([
    (0, common_1.Post)(':id/acknowledge'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.EMPLOYEE, client_1.UserRole.FIELD_EMPLOYEE),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.TASK_ASSIGN),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], TasksController.prototype, "acknowledgeTask", null);
__decorate([
    (0, common_1.Post)(':id/proof'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.EMPLOYEE, client_1.UserRole.FIELD_EMPLOYEE),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.TASK_ASSIGN),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, tasks_dto_1.SubmitProofDto]),
    __metadata("design:returntype", Promise)
], TasksController.prototype, "submitProof", null);
__decorate([
    (0, common_1.Post)('proofs/:proofId/acknowledge'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.OWNER, client_1.UserRole.ADMIN, client_1.UserRole.MANAGER, client_1.UserRole.TEAM_LEAD, client_1.UserRole.HR_MANAGER),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.TASK_COMPLETION_ACKNOWLEDGE),
    __param(0, (0, common_1.Param)('proofId')),
    __param(1, (0, common_1.Request)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, tasks_dto_1.ReviewProofDto]),
    __metadata("design:returntype", Promise)
], TasksController.prototype, "acknowledgeCompletion", null);
__decorate([
    (0, common_1.Post)('proofs/:proofId/approve'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.OWNER, client_1.UserRole.ADMIN),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.TASK_COMPLETION_APPROVE),
    __param(0, (0, common_1.Param)('proofId')),
    __param(1, (0, common_1.Request)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, tasks_dto_1.ReviewProofDto]),
    __metadata("design:returntype", Promise)
], TasksController.prototype, "approveCompletion", null);
__decorate([
    (0, common_1.Post)('proofs/:proofId/reject'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.OWNER, client_1.UserRole.ADMIN, client_1.UserRole.MANAGER, client_1.UserRole.TEAM_LEAD, client_1.UserRole.HR_MANAGER),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.TASK_COMPLETION_ACKNOWLEDGE),
    __param(0, (0, common_1.Param)('proofId')),
    __param(1, (0, common_1.Request)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, tasks_dto_1.ReviewProofDto]),
    __metadata("design:returntype", Promise)
], TasksController.prototype, "rejectCompletion", null);
__decorate([
    (0, common_1.Post)(':id/extensions'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.EMPLOYEE, client_1.UserRole.FIELD_EMPLOYEE),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.TASK_ASSIGN),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, tasks_dto_1.CreateExtensionDto]),
    __metadata("design:returntype", Promise)
], TasksController.prototype, "requestExtension", null);
exports.TasksController = TasksController = __decorate([
    (0, common_1.Controller)('tasks'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [tasks_service_1.TasksService,
        task_proof_service_1.TaskProofService,
        task_extension_service_1.TaskExtensionService])
], TasksController);
//# sourceMappingURL=tasks.controller.js.map