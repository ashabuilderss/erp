import { Request } from 'express';

/**
 * Typed request interface for authenticated routes.
 *
 * Populated by `JwtAuthGuard` after successful JWT validation.
 * Use this instead of `@Request() req: any` in controllers.
 */
export interface AuthenticatedRequest extends Request {
  user: {
    /** User ID (primary key in the User table) */
    id: string;
    /** Legacy Clerk ID — same as id */
    clerkId: string;
    email: string;
    firstName: string;
    lastName: string;
    /** Role string, e.g. 'OWNER', 'ADMIN', 'MANAGER', 'EMPLOYEE', etc. */
    role: string;
    companyId: string;
    /** Employee ID linked to this user, or null if none */
    employeeId: string | null;
    /** Team ID linked to this user's employee record, or null if none */
    teamId?: string | null;
    /** Department ID linked to this user's employee record, or null if none */
    departmentId?: string | null;
    /** Resolved scopes from PermissionsGuard: { [permissionName]: scopeString } */
    scopes?: Record<string, string>;
  };
  company: {
    id: string;
    name: string;
    slug: string;
  } | null;
  /** Convenience shortcut — mirrors `user.companyId` */
  companyId: string;
  /** Convenience shortcut — mirrors `user.employeeId` */
  employeeId?: string;
}
