"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthModule = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const passport_1 = require("@nestjs/passport");
const auth_controller_1 = require("./auth.controller");
const auth_service_1 = require("./auth.service");
const jwt_strategy_1 = require("./strategies/jwt.strategy");
const encryption_service_1 = require("../../common/services/encryption.service");
const two_factor_service_1 = require("./two-factor.service");
const two_factor_controller_1 = require("./two-factor.controller");
function validateAuthSecret() {
    const secret = process.env.AUTH_SECRET;
    if (!secret) {
        throw new Error('FATAL: AUTH_SECRET environment variable is required. Set AUTH_SECRET in your .env file.');
    }
}
let AuthModule = class AuthModule {
    onModuleInit() {
        validateAuthSecret();
    }
};
exports.AuthModule = AuthModule;
exports.AuthModule = AuthModule = __decorate([
    (0, common_1.Module)({
        imports: [
            passport_1.PassportModule.register({ defaultStrategy: 'jwt' }),
            jwt_1.JwtModule.registerAsync({
                useFactory: () => {
                    validateAuthSecret();
                    return {
                        secret: process.env.AUTH_SECRET,
                        signOptions: { expiresIn: '15m' },
                    };
                },
            }),
        ],
        controllers: [auth_controller_1.AuthController, two_factor_controller_1.TwoFactorController],
        providers: [auth_service_1.AuthService, two_factor_service_1.TwoFactorService, jwt_strategy_1.JwtStrategy, encryption_service_1.EncryptionService],
        exports: [jwt_1.JwtModule, auth_service_1.AuthService, two_factor_service_1.TwoFactorService, encryption_service_1.EncryptionService],
    })
], AuthModule);
//# sourceMappingURL=auth.module.js.map