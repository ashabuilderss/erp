import { SetMetadata } from '@nestjs/common';

export const NOCACHE_KEY = 'no_cache';
export const NoCache = () => SetMetadata(NOCACHE_KEY, true);

export const CACHE_INVALIDATE_EXTRA_KEY = 'cache_invalidate_extra';
export const CacheInvalidateExtra = (resources: string[]) => SetMetadata(CACHE_INVALIDATE_EXTRA_KEY, resources);
