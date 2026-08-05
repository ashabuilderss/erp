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
