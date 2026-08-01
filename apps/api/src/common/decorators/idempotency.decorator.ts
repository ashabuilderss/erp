import { SetMetadata } from '@nestjs/common';

export const IDEMPOTENCY_KEY = 'idempotency';

/**
 * Marks a controller method as requiring an idempotency key.
 *
 * The `IdempotencyGuard` reads the `Idempotency-Key` header (or generates one)
 * and ensures that duplicate requests with the same key return the cached
 * response instead of re-executing the handler.
 */
export const UseIdempotency = () => SetMetadata(IDEMPOTENCY_KEY, true);
