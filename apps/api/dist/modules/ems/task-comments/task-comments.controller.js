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
exports.TaskCommentsController = void 0;
const common_1 = require("@nestjs/common");
const task_comments_service_1 = require("./task-comments.service");
const create_task_comment_dto_1 = require("./dto/create-task-comment.dto");
const roles_decorator_1 = require("../../../common/decorators/roles.decorator");
const permissions_decorator_1 = require("../../../common/decorators/permissions.decorator");
const permissions_1 = require("../../../common/auth/permissions");
const current_user_decorator_1 = require("../../../common/decorators/current-user.decorator");
const client_1 = require("@prisma/client");
const idempotency_decorator_1 = require("../../../common/decorators/idempotency.decorator");
let TaskCommentsController = class TaskCommentsController {
    taskCommentsService;
    constructor(taskCommentsService) {
        this.taskCommentsService = taskCommentsService;
    }
    async findByAssignment(assignmentId, companyId, employeeId, role) {
        return this.taskCommentsService.findByAssignment(assignmentId, companyId, employeeId, role);
    }
    async create(dto, companyId, employeeId) {
        return this.taskCommentsService.create(dto, companyId, employeeId);
    }
    async remove(id, companyId, employeeId, role) {
        return this.taskCommentsService.remove(id, companyId, employeeId, role);
    }
};
exports.TaskCommentsController = TaskCommentsController;
__decorate([
    (0, common_1.Get)('assignment/:assignmentId'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN, client_1.UserRole.EMPLOYEE),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.EMS_READ),
    __param(0, (0, common_1.Param)('assignmentId')),
    __param(1, (0, current_user_decorator_1.CurrentCompany)('id')),
    __param(2, (0, current_user_decorator_1.CurrentEmployeeId)()),
    __param(3, (0, current_user_decorator_1.CurrentUser)('role')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object, String]),
    __metadata("design:returntype", Promise)
], TaskCommentsController.prototype, "findByAssignment", null);
__decorate([
    (0, common_1.Post)(),
    (0, idempotency_decorator_1.UseIdempotency)(),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN, client_1.UserRole.EMPLOYEE),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.EMS_CREATE),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentCompany)('id')),
    __param(2, (0, current_user_decorator_1.CurrentEmployeeId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_task_comment_dto_1.CreateTaskCommentDto, String, Object]),
    __metadata("design:returntype", Promise)
], TaskCommentsController.prototype, "create", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN, client_1.UserRole.EMPLOYEE),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.EMS_CREATE),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentCompany)('id')),
    __param(2, (0, current_user_decorator_1.CurrentEmployeeId)()),
    __param(3, (0, current_user_decorator_1.CurrentUser)('role')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object, String]),
    __metadata("design:returntype", Promise)
], TaskCommentsController.prototype, "remove", null);
exports.TaskCommentsController = TaskCommentsController = __decorate([
    (0, common_1.Controller)('task-comments'),
    __metadata("design:paramtypes", [task_comments_service_1.TaskCommentsService])
], TaskCommentsController);
//# sourceMappingURL=task-comments.controller.js.map