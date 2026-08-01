/**
 * Typed request interface for authenticated routes.
 *
 * Populated by `JwtAuthGuard` after successful JWT validation.
 * Use this instead of `@Req() req: any` or `@Req() req: Request`
 * in controllers that need access to the authenticated user.
 */
export interface AuthenticatedRequest {
  user: {
    sub: string;
    email: string;
    role: string;
    companyId: string;
  };
  companyId: string;
  employeeId?: string;
}
