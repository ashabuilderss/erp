"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Require2FA = exports.REQUIRE_2FA_KEY = void 0;
const common_1 = require("@nestjs/common");
exports.REQUIRE_2FA_KEY = 'require_2fa';
const Require2FA = () => (0, common_1.SetMetadata)(exports.REQUIRE_2FA_KEY, true);
exports.Require2FA = Require2FA;
//# sourceMappingURL=require-2fa.decorator.js.map