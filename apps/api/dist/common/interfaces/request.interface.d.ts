import { Request } from 'express';
export interface AuthenticatedRequest extends Request {
    user: {
        id: string;
        clerkId: string;
        email: string;
        firstName: string;
        lastName: string;
        role: string;
        companyId: string;
        employeeId: string | null;
        teamId?: string | null;
        departmentId?: string | null;
        scopes?: Record<string, string>;
    };
    company: {
        id: string;
        name: string;
        slug: string;
    } | null;
    companyId: string;
    employeeId?: string;
}
