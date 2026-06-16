import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface User {
    firstName?: string;
    lastName?: string;
    role?: string;
    companyId?: string;
    employeeId?: string | null;
  }

  interface Session {
    user: {
      id: string;
      firstName: string;
      lastName: string;
      role: string;
      companyId: string;
      email: string;
      name?: string | null;
      employeeId?: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    firstName: string;
    lastName: string;
    role: string;
    companyId: string;
    employeeId?: string;
  }
}
