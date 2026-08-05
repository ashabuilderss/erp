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
exports.RecruitmentController = void 0;
const common_1 = require("@nestjs/common");
const recruitment_service_1 = require("./recruitment.service");
const create_job_posting_dto_1 = require("./dto/create-job-posting.dto");
const create_candidate_dto_1 = require("./dto/create-candidate.dto");
const create_interview_dto_1 = require("./dto/create-interview.dto");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const permissions_decorator_1 = require("../../common/decorators/permissions.decorator");
const permissions_1 = require("../../common/auth/permissions");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const client_1 = require("@prisma/client");
let RecruitmentController = class RecruitmentController {
    recruitmentService;
    constructor(recruitmentService) {
        this.recruitmentService = recruitmentService;
    }
    async findAllJobs(companyId, query) {
        return this.recruitmentService.findAllJobs(companyId, query);
    }
    async createJob(companyId, dto) {
        return this.recruitmentService.createJob(dto, companyId);
    }
    async findOneJob(companyId, id) {
        return this.recruitmentService.findOneJob(id, companyId);
    }
    async updateJob(companyId, id, dto) {
        return this.recruitmentService.updateJob(id, dto, companyId);
    }
    async removeJob(companyId, id) {
        return this.recruitmentService.removeJob(id, companyId);
    }
    async findAllCandidates(companyId, query) {
        return this.recruitmentService.findAllCandidates(companyId, query);
    }
    async createCandidate(companyId, dto) {
        return this.recruitmentService.createCandidate(dto, companyId);
    }
    async findOneCandidate(companyId, id) {
        return this.recruitmentService.findOneCandidate(id, companyId);
    }
    async updateCandidate(companyId, id, dto) {
        return this.recruitmentService.updateCandidate(id, dto, companyId);
    }
    async scheduleInterview(companyId, candidateId, dto) {
        return this.recruitmentService.scheduleInterview(candidateId, dto, companyId);
    }
    async updateInterview(companyId, id, dto) {
        return this.recruitmentService.updateInterview(id, dto, companyId);
    }
};
exports.RecruitmentController = RecruitmentController;
__decorate([
    (0, common_1.Get)('jobs'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.OWNER, client_1.UserRole.ADMIN, client_1.UserRole.HR_MANAGER, client_1.UserRole.MANAGER),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.RECRUITMENT_READ),
    __param(0, (0, current_user_decorator_1.CurrentUser)('companyId')),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_job_posting_dto_1.QueryJobPostingDto]),
    __metadata("design:returntype", Promise)
], RecruitmentController.prototype, "findAllJobs", null);
__decorate([
    (0, common_1.Post)('jobs'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.OWNER, client_1.UserRole.ADMIN, client_1.UserRole.HR_MANAGER),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.RECRUITMENT_CREATE),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, current_user_decorator_1.CurrentUser)('companyId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_job_posting_dto_1.CreateJobPostingDto]),
    __metadata("design:returntype", Promise)
], RecruitmentController.prototype, "createJob", null);
__decorate([
    (0, common_1.Get)('jobs/:id'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.OWNER, client_1.UserRole.ADMIN, client_1.UserRole.HR_MANAGER, client_1.UserRole.MANAGER),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.RECRUITMENT_READ),
    __param(0, (0, current_user_decorator_1.CurrentUser)('companyId')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], RecruitmentController.prototype, "findOneJob", null);
__decorate([
    (0, common_1.Patch)('jobs/:id'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.OWNER, client_1.UserRole.ADMIN, client_1.UserRole.HR_MANAGER),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.RECRUITMENT_UPDATE),
    __param(0, (0, current_user_decorator_1.CurrentUser)('companyId')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, create_job_posting_dto_1.UpdateJobPostingDto]),
    __metadata("design:returntype", Promise)
], RecruitmentController.prototype, "updateJob", null);
__decorate([
    (0, common_1.Delete)('jobs/:id'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.OWNER, client_1.UserRole.ADMIN, client_1.UserRole.HR_MANAGER),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.RECRUITMENT_UPDATE),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, current_user_decorator_1.CurrentUser)('companyId')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], RecruitmentController.prototype, "removeJob", null);
__decorate([
    (0, common_1.Get)('candidates'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.OWNER, client_1.UserRole.ADMIN, client_1.UserRole.HR_MANAGER, client_1.UserRole.MANAGER),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.RECRUITMENT_READ),
    __param(0, (0, current_user_decorator_1.CurrentUser)('companyId')),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_candidate_dto_1.QueryCandidateDto]),
    __metadata("design:returntype", Promise)
], RecruitmentController.prototype, "findAllCandidates", null);
__decorate([
    (0, common_1.Post)('candidates'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.OWNER, client_1.UserRole.ADMIN, client_1.UserRole.HR_MANAGER),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.RECRUITMENT_CREATE),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, current_user_decorator_1.CurrentUser)('companyId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_candidate_dto_1.CreateCandidateDto]),
    __metadata("design:returntype", Promise)
], RecruitmentController.prototype, "createCandidate", null);
__decorate([
    (0, common_1.Get)('candidates/:id'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.OWNER, client_1.UserRole.ADMIN, client_1.UserRole.HR_MANAGER, client_1.UserRole.MANAGER),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.RECRUITMENT_READ),
    __param(0, (0, current_user_decorator_1.CurrentUser)('companyId')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], RecruitmentController.prototype, "findOneCandidate", null);
__decorate([
    (0, common_1.Patch)('candidates/:id'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.OWNER, client_1.UserRole.ADMIN, client_1.UserRole.HR_MANAGER),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.RECRUITMENT_UPDATE),
    __param(0, (0, current_user_decorator_1.CurrentUser)('companyId')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, create_candidate_dto_1.UpdateCandidateDto]),
    __metadata("design:returntype", Promise)
], RecruitmentController.prototype, "updateCandidate", null);
__decorate([
    (0, common_1.Post)('candidates/:id/interviews'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.OWNER, client_1.UserRole.ADMIN, client_1.UserRole.HR_MANAGER),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.RECRUITMENT_CREATE),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, current_user_decorator_1.CurrentUser)('companyId')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, create_interview_dto_1.CreateInterviewDto]),
    __metadata("design:returntype", Promise)
], RecruitmentController.prototype, "scheduleInterview", null);
__decorate([
    (0, common_1.Patch)('interviews/:id'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.OWNER, client_1.UserRole.ADMIN, client_1.UserRole.HR_MANAGER),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.RECRUITMENT_UPDATE),
    __param(0, (0, current_user_decorator_1.CurrentUser)('companyId')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, create_interview_dto_1.UpdateInterviewDto]),
    __metadata("design:returntype", Promise)
], RecruitmentController.prototype, "updateInterview", null);
exports.RecruitmentController = RecruitmentController = __decorate([
    (0, common_1.Controller)('recruitment'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [recruitment_service_1.RecruitmentService])
], RecruitmentController);
//# sourceMappingURL=recruitment.controller.js.map