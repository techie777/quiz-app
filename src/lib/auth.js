import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

// Only include Google provider if real credentials are configured
const googleId = process.env.GOOGLE_CLIENT_ID ?? "";
const googleSecret = process.env.GOOGLE_CLIENT_SECRET ?? "";
const hasGoogleCreds = googleId && !googleId.startsWith("your-") && googleSecret && !googleSecret.startsWith("your-");

export const authOptions = {
  adapter: PrismaAdapter(prisma),
  session: { 
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
  },
  providers: [
    // Google OAuth
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    // User login with Email PIN
    CredentialsProvider({
      id: "email-pin",
      name: "Email PIN",
      credentials: {
        email: { label: "Email", type: "email" },
        pin: { label: "PIN", type: "text" },
        isNewUser: { label: "Is New User", type: "text" }, // "true" or "false"
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.pin) return null;
        
        const email = credentials.email.trim().toLowerCase();
        const pin = credentials.pin.trim();

        // Find user
        let user = await prisma.user.findUnique({ where: { email } });

        if (credentials.isNewUser === "true") {
          throw new Error("New user registration is administratively restricted.");
        } else {
          if (!user) throw new Error("User not found");
          if (!user.pin) throw new Error("No PIN set for this account. Please contact admin.");
          if (user.pin !== pin) throw new Error("Invalid PIN");
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image || user.avatar,
          pin: user.pin, // Include PIN for admin view if needed in session
        };
      },
    }),
    // Admin login (kept separate for management)
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

        // Log the login
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
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.userId = user.id;
        if (account?.provider === "admin-login") {
          token.role = user.role;
          token.adminId = user.adminId;
          token.username = user.username;
          token.isAdmin = true;
        } else {
          token.role = "user";
          token.isAdmin = false;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.userId;
        session.user.role = token.role;
        session.user.isAdmin = token.isAdmin;
        if (token.isAdmin) {
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
      }
      return session;
    },
  },
  pages: {
    signIn: "/signin",
  },
};
