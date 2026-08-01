import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

type UserFields = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  companyId: string;
  employeeId: string | null;
};

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        accessToken: { label: "Access Token", type: "text" },
      },
      async authorize(credentials) {
        const API_URL = process.env.API_URL || "http://localhost:4000";
        let userFields: UserFields | null = null;

        if (credentials?.accessToken) {
          const res = await fetch(`${API_URL}/api/v1/auth/me`, {
            headers: {
              Authorization: `Bearer ${String(credentials.accessToken)}`,
            },
          });
          if (!res.ok) return null;

          const data = await res.json();
          userFields = {
            id: data.user.id,
            email: data.user.email,
            firstName: data.user.firstName,
            lastName: data.user.lastName,
            role: data.user.role,
            companyId: data.company.id,
            employeeId: data.employee?.id ?? null,
          };
        } else if (credentials?.email && credentials?.password) {
          const res = await fetch(`${API_URL}/api/v1/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
          });
          if (!res.ok) return null;

          const data = await res.json();
          if (data.requiresTwoFactor || !data.user) return null;
          userFields = data.user;
        }

        if (!userFields) return null;

        return {
          id: userFields.id,
          email: userFields.email,
          name: `${userFields.firstName} ${userFields.lastName}`,
          firstName: userFields.firstName,
          lastName: userFields.lastName,
          role: userFields.role,
          companyId: userFields.companyId,
          employeeId: userFields.employeeId ?? null,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id!;
        token.firstName = user.firstName!;
        token.lastName = user.lastName!;
        token.role = user.role!;
        token.companyId = user.companyId!;
        token.employeeId = user.employeeId!;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.firstName = token.firstName as string;
        session.user.lastName = token.lastName as string;
        session.user.role = token.role as string;
        session.user.companyId = token.companyId as string;
        session.user.employeeId = token.employeeId as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/sign-in",
  },
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60,
  },
  secret: process.env.AUTH_SECRET,
});
