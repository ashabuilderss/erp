"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocalStorageProvider = void 0;
const common_1 = require("@nestjs/common");
const path_1 = require("path");
const fs = __importStar(require("fs"));
const crypto_1 = require("crypto");
const UPLOADS_DIR = (0, path_1.join)(process.cwd(), 'uploads');
let LocalStorageProvider = class LocalStorageProvider {
    async upload(file) {
        const dir = (0, path_1.join)(UPLOADS_DIR, 'general');
        if (!fs.existsSync(dir))
            fs.mkdirSync(dir, { recursive: true });
        const key = `${Date.now()}-${(0, crypto_1.randomBytes)(6).toString('hex')}${(0, path_1.extname)(file.originalname)}`;
        const filePath = (0, path_1.join)(dir, key);
        fs.writeFileSync(filePath, file.buffer);
        const signedUrl = await this.getUrl(`general/${key}`);
        return {
            url: signedUrl,
            key: `general/${key}`,
            size: file.size,
            mimetype: file.mimetype,
        };
    }
    async delete(key) {
        const uploadsRoot = (0, path_1.resolve)(UPLOADS_DIR);
        const filePath = (0, path_1.resolve)(uploadsRoot, key);
        const relativePath = (0, path_1.relative)(uploadsRoot, filePath);
        if (relativePath.startsWith('..') || (0, path_1.isAbsolute)(relativePath)) {
            return;
        }
        if (fs.existsSync(filePath))
            fs.unlinkSync(filePath);
    }
    async getUrl(key) {
        return `/uploads/${key}`;
    }
};
exports.LocalStorageProvider = LocalStorageProvider;
exports.LocalStorageProvider = LocalStorageProvider = __decorate([
    (0, common_1.Injectable)()
], LocalStorageProvider);
//# sourceMappingURL=local-storage.provider.js.map