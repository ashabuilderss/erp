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
exports.UploadsController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const multer_1 = require("multer");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const permissions_decorator_1 = require("../../common/decorators/permissions.decorator");
const permissions_1 = require("../../common/auth/permissions");
const client_1 = require("@prisma/client");
const file_policy_service_1 = require("./file-policy.service");
let UploadsController = class UploadsController {
    filePolicyService;
    storage;
    constructor(filePolicyService, storage) {
        this.filePolicyService = filePolicyService;
        this.storage = storage;
    }
    getPolicy() {
        return this.filePolicyService.getPolicy();
    }
    async uploadAvatar(file) {
        if (!file)
            throw new common_1.BadRequestException('File is required');
        this.filePolicyService.validate(file, true);
        const result = await this.storage.upload({
            buffer: file.buffer,
            originalname: file.originalname,
            mimetype: file.mimetype,
            size: file.size,
        });
        return result;
    }
    async uploadPropertyImages(files) {
        if (!files?.length)
            throw new common_1.BadRequestException('At least one file is required');
        return Promise.all(files.map(async (f) => {
            this.filePolicyService.validate(f, true);
            return this.storage.upload({
                buffer: f.buffer,
                originalname: f.originalname,
                mimetype: f.mimetype,
                size: f.size,
            });
        }));
    }
    async uploadAttendanceSelfie(file) {
        if (!file)
            throw new common_1.BadRequestException('Attendance selfie file is required');
        this.filePolicyService.validate(file, true);
        const result = await this.storage.upload({
            buffer: file.buffer,
            originalname: file.originalname,
            mimetype: file.mimetype,
            size: file.size,
        });
        return result;
    }
    async uploadGeneral(file) {
        if (!file)
            throw new common_1.BadRequestException('File is required');
        this.filePolicyService.validate(file);
        const result = await this.storage.upload({
            buffer: file.buffer,
            originalname: file.originalname,
            mimetype: file.mimetype,
            size: file.size,
        });
        return result;
    }
    async deleteFile(key) {
        await this.storage.delete(key);
        return { success: true };
    }
};
exports.UploadsController = UploadsController;
__decorate([
    (0, common_1.Get)('policy'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.OWNER, client_1.UserRole.ADMIN, client_1.UserRole.HR_MANAGER, client_1.UserRole.EMPLOYEE, client_1.UserRole.FIELD_EMPLOYEE, client_1.UserRole.MANAGER, client_1.UserRole.ACCOUNTS),
    (0, permissions_decorator_1.RequirePermissions)(permissions_1.Permissions.EMPLOYEE_READ),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], UploadsController.prototype, "getPolicy", null);
__decorate([
    (0, common_1.Post)('avatar'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN, client_1.UserRole.HR_MANAGER, client_1.UserRole.EMPLOYEE),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', {
        storage: (0, multer_1.memoryStorage)(),
        fileFilter: (_req, file, callback) => {
            if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) {
                return callback(new common_1.BadRequestException('Only JPG, PNG, and WebP images are allowed'), false);
            }
            callback(null, true);
        },
        limits: { fileSize: file_policy_service_1.MAX_UPLOAD_SIZE_BYTES },
    })),
    __param(0, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UploadsController.prototype, "uploadAvatar", null);
__decorate([
    (0, common_1.Post)('property-images'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN, client_1.UserRole.EMPLOYEE),
    (0, common_1.UseInterceptors)((0, platform_express_1.FilesInterceptor)('files', 10, {
        storage: (0, multer_1.memoryStorage)(),
        fileFilter: (_req, file, callback) => {
            if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) {
                return callback(new common_1.BadRequestException('Only JPG, PNG, and WebP images are allowed'), false);
            }
            callback(null, true);
        },
        limits: { fileSize: file_policy_service_1.MAX_UPLOAD_SIZE_BYTES },
    })),
    __param(0, (0, common_1.UploadedFiles)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Array]),
    __metadata("design:returntype", Promise)
], UploadsController.prototype, "uploadPropertyImages", null);
__decorate([
    (0, common_1.Post)('attendance-selfie'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN, client_1.UserRole.HR_MANAGER, client_1.UserRole.EMPLOYEE, client_1.UserRole.FIELD_EMPLOYEE),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', {
        storage: (0, multer_1.memoryStorage)(),
        fileFilter: (_req, file, callback) => {
            if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) {
                return callback(new common_1.BadRequestException('Only JPG, PNG, and WebP images are allowed for attendance selfies'), false);
            }
            callback(null, true);
        },
        limits: { fileSize: file_policy_service_1.MAX_UPLOAD_SIZE_BYTES },
    })),
    __param(0, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UploadsController.prototype, "uploadAttendanceSelfie", null);
__decorate([
    (0, common_1.Post)('general'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN, client_1.UserRole.HR_MANAGER, client_1.UserRole.EMPLOYEE),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', {
        storage: (0, multer_1.memoryStorage)(),
        limits: { fileSize: file_policy_service_1.MAX_UPLOAD_SIZE_BYTES },
    })),
    __param(0, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UploadsController.prototype, "uploadGeneral", null);
__decorate([
    (0, common_1.Delete)(':key'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.OWNER, client_1.UserRole.ADMIN),
    __param(0, (0, common_1.Param)('key')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UploadsController.prototype, "deleteFile", null);
exports.UploadsController = UploadsController = __decorate([
    (0, common_1.Controller)('uploads'),
    __param(1, (0, common_1.Inject)('STORAGE_PROVIDER')),
    __metadata("design:paramtypes", [file_policy_service_1.FilePolicyService, Object])
], UploadsController);
//# sourceMappingURL=uploads.controller.js.map