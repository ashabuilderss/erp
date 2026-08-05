"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FilePolicyService = exports.MAX_UPLOAD_SIZE_BYTES = void 0;
const common_1 = require("@nestjs/common");
const path_1 = require("path");
exports.MAX_UPLOAD_SIZE_BYTES = 25 * 1024 * 1024;
const ALLOWED_EXTENSIONS = new Set([
    'jpg',
    'jpeg',
    'png',
    'webp',
    'pdf',
    'docx',
    'mp3',
    'webm',
    'dwg',
]);
const ALLOWED_MIME_TYPES = new Set([
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'audio/mpeg',
    'audio/mp3',
    'video/webm',
    'audio/webm',
    'application/acad',
    'application/x-acad',
    'application/autocad_dwg',
    'application/dwg',
    'application/x-dwg',
    'image/vnd.dwg',
    'drawing/dwg',
]);
let FilePolicyService = class FilePolicyService {
    validate(file, imageOnly = false) {
        const extension = (0, path_1.extname)(file.originalname).replace('.', '').toLowerCase();
        if (!extension || !ALLOWED_EXTENSIONS.has(extension)) {
            throw new common_1.BadRequestException('Unsupported file type. Allowed: JPG, PNG, WEBP, PDF, DOCX, MP3, WEBM, DWG');
        }
        if (imageOnly && !['jpg', 'jpeg', 'png', 'webp'].includes(extension)) {
            throw new common_1.BadRequestException('Only JPG, PNG, and WebP images are allowed');
        }
        if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
            throw new common_1.BadRequestException('Unsupported file MIME type');
        }
        if (file.size > exports.MAX_UPLOAD_SIZE_BYTES) {
            throw new common_1.BadRequestException('File exceeds the 25MB upload limit');
        }
        return { extension, maxSizeBytes: exports.MAX_UPLOAD_SIZE_BYTES, allowed: true };
    }
    getPolicy() {
        return {
            maxSizeBytes: exports.MAX_UPLOAD_SIZE_BYTES,
            allowedExtensions: Array.from(ALLOWED_EXTENSIONS).sort(),
            allowedMimeTypes: Array.from(ALLOWED_MIME_TYPES).sort(),
        };
    }
};
exports.FilePolicyService = FilePolicyService;
exports.FilePolicyService = FilePolicyService = __decorate([
    (0, common_1.Injectable)()
], FilePolicyService);
//# sourceMappingURL=file-policy.service.js.map