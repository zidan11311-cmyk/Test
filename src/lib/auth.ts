import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { Role } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      role: Role;
      avatar?: string | null;
    };
  }

  interface User {
    id: string;
    name: string;
    email: string;
    role: Role;
    avatar?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: Role;
    avatar?: string | null;
  }
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as never,
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase() },
        });

        if (!user) {
          throw new Error("Invalid email or password");
        }

        if (!user.isActive) {
          throw new Error("Your account has been deactivated. Please contact the administrator.");
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isPasswordValid) {
          throw new Error("Invalid email or password");
        }

        // Update last login
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLogin: new Date() },
        });

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.avatar = user.avatar;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.avatar = token.avatar;
      }
      return session;
    },
  },
  events: {
    async signIn({ user }) {
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: "SIGN_IN",
          entity: "User",
          entityId: user.id,
        },
      });
    },
    async signOut({ token }) {
      if (token?.id) {
        await prisma.auditLog.create({
          data: {
            userId: token.id as string,
            action: "SIGN_OUT",
            entity: "User",
            entityId: token.id as string,
          },
        });
      }
    },
  },
};

// Role-based access control helpers
export const ROLE_PERMISSIONS = {
  ADMIN: [
    "patients:read", "patients:write", "patients:delete",
    "doctors:read", "doctors:write", "doctors:delete",
    "appointments:read", "appointments:write", "appointments:delete",
    "medical_records:read", "medical_records:write",
    "pharmacy:read", "pharmacy:write",
    "laboratory:read", "laboratory:write",
    "billing:read", "billing:write",
    "emergency:read", "emergency:write",
    "nursing:read", "nursing:write",
    "discharge:read", "discharge:write",
    "reports:read",
    "admin:read", "admin:write",
    "users:read", "users:write", "users:delete",
  ],
  DOCTOR: [
    "patients:read", "patients:write",
    "appointments:read", "appointments:write",
    "medical_records:read", "medical_records:write",
    "pharmacy:read",
    "laboratory:read", "laboratory:write",
    "emergency:read", "emergency:write",
    "discharge:read", "discharge:write",
    "nursing:read",
    "reports:read",
  ],
  NURSE: [
    "patients:read",
    "appointments:read",
    "medical_records:read",
    "nursing:read", "nursing:write",
    "emergency:read",
    "laboratory:read",
  ],
  PHARMACIST: [
    "patients:read",
    "pharmacy:read", "pharmacy:write",
    "medical_records:read",
  ],
  LAB_TECHNICIAN: [
    "patients:read",
    "laboratory:read", "laboratory:write",
    "medical_records:read",
  ],
  RECEPTIONIST: [
    "patients:read", "patients:write",
    "appointments:read", "appointments:write",
    "doctors:read",
    "billing:read", "billing:write",
    "emergency:read",
    "reports:read",
  ],
} as const;

export function hasPermission(role: Role, permission: string): boolean {
  const permissions = ROLE_PERMISSIONS[role] as readonly string[];
  return permissions.includes(permission);
}

export function canAccess(role: Role, roles: Role[]): boolean {
  return roles.includes(role);
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}
