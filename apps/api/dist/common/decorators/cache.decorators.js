"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CacheInvalidateExtra = exports.CACHE_INVALIDATE_EXTRA_KEY = exports.NoCache = exports.NOCACHE_KEY = void 0;
const common_1 = require("@nestjs/common");
exports.NOCACHE_KEY = 'no_cache';
const NoCache = () => (0, common_1.SetMetadata)(exports.NOCACHE_KEY, true);
exports.NoCache = NoCache;
exports.CACHE_INVALIDATE_EXTRA_KEY = 'cache_invalidate_extra';
const CacheInvalidateExtra = (resources) => (0, common_1.SetMetadata)(exports.CACHE_INVALIDATE_EXTRA_KEY, resources);
exports.CacheInvalidateExtra = CacheInvalidateExtra;
//# sourceMappingURL=cache.decorators.js.map