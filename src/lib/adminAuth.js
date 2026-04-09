import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/lib/prisma";

export const adminAuthOptions = {
  adapter: PrismaAdapter(prisma),
  secret: process.env.NEXTAUTH_SECRET,
  basePath: "/api/admin-auth",
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  cookies: {
    sessionToken: {
      name: "admin-next-auth.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
    callbackUrl: {
      name: "admin-next-auth.callback-url",
      options: {
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
    csrfToken: {
      name: "admin-next-auth.csrf-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
  providers: [
    CredentialsProvider({
      id: "admin-login",
      name: "Admin Login",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) return null;
        const admin = await prisma.adminAccount.findUnique({
          where: { username: credentials.username },
        });
        if (!admin) return null;
        if (admin.status !== "active") return null;
        const valid = await bcrypt.compare(credentials.password, admin.passwordHash);
        if (!valid) return null;

        await prisma.adminActivityLog.create({
          data: { adminId: admin.id, action: "login", details: "Admin logged in" },
        });

        return {
          id: admin.id,
          name: admin.displayName || admin.username,
          email: `admin:${admin.username}`,
          role: admin.role,
          adminId: admin.id,
          username: admin.username,
          isAdmin: true,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.userId = user.id;
        token.role = user.role;
        token.adminId = user.adminId;
        token.username = user.username;
        token.isAdmin = true;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.userId;
        session.user.role = token.role;
        session.user.isAdmin = true;
        session.user.adminId = token.adminId;
        session.user.username = token.username;
        try {
          const admin = await prisma.adminAccount.findUnique({
            where: { id: token.adminId },
            select: { role: true, status: true, displayName: true, username: true },
          });
          if (admin?.status !== "active") {
            session.user.isAdmin = false;
          } else {
            session.user.role = admin.role;
            session.user.username = admin.username;
            session.user.name = admin.displayName || admin.username;
            const permRow = await prisma.setting.findUnique({
              where: { key: `adminPerms:${token.adminId}` },
              select: { value: true },
            });
            session.user.permissions = permRow?.value || "{}";
          }
        } catch {
          session.user.permissions = "{}";
        }
      }
      return session;
    },
  },
  pages: {
    signIn: "/admin/login",
  },
};

