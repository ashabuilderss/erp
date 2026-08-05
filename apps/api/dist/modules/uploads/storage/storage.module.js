"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.storageProviderFactory = exports.StorageModule = void 0;
const common_1 = require("@nestjs/common");
const local_storage_provider_1 = require("./local-storage.provider");
const s3_storage_provider_1 = require("./s3-storage.provider");
const storageProviderFactory = {
    provide: 'STORAGE_PROVIDER',
    useFactory: () => {
        if (process.env.STORAGE_DRIVER === 's3') {
            return new s3_storage_provider_1.S3StorageProvider();
        }
        return new local_storage_provider_1.LocalStorageProvider();
    },
};
exports.storageProviderFactory = storageProviderFactory;
let StorageModule = class StorageModule {
};
exports.StorageModule = StorageModule;
exports.StorageModule = StorageModule = __decorate([
    (0, common_1.Global)(),
    (0, common_1.Module)({
        providers: [storageProviderFactory],
        exports: ['STORAGE_PROVIDER'],
    })
], StorageModule);
//# sourceMappingURL=storage.module.js.map