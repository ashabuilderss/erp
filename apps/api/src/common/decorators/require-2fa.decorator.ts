import { SetMetadata } from '@nestjs/common';

/**
 * Marks a route as requiring two-factor authentication for privileged roles
 * (OWNER / ADMIN / ACCOUNTS). Enforced by `TwoFactorEnforcedGuard`.
 *
 * Non-privileged roles are never blocked by this guard; the presence of the
 * metadata simply opts the route into the 2FA check.
 */
export const REQUIRE_2FA_KEY = 'require_2fa';
export const Require2FA = () => SetMetadata(REQUIRE_2FA_KEY, true);
