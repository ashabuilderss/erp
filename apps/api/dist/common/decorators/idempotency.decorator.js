"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UseIdempotency = exports.IDEMPOTENCY_KEY = void 0;
const common_1 = require("@nestjs/common");
exports.IDEMPOTENCY_KEY = 'idempotency';
const UseIdempotency = () => (0, common_1.SetMetadata)(exports.IDEMPOTENCY_KEY, true);
exports.UseIdempotency = UseIdempotency;
//# sourceMappingURL=idempotency.decorator.js.map