import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/lib/prisma";

export const authOptions = {
  adapter: PrismaAdapter(prisma),
  secret: process.env.NEXTAUTH_SECRET,
  session: { 
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  providers: [
    // Google OAuth
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true,
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
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.userId = user.id;
        token.role = "user";
        token.isAdmin = false;

        // Enforce 1-user-1-device: bump sessionVersion on each fresh sign-in.
        // Old tokens will become invalid when their sessionVersion mismatches.
        try {
          const updated = await prisma.user.update({
            where: { id: user.id },
            data: { sessionVersion: { increment: 1 }, lastLoginAt: new Date() },
            select: { sessionVersion: true },
          });
          token.sessionVersion = updated.sessionVersion;
        } catch {
          // If DB is temporarily unavailable, fall back to existing token behavior.
          token.sessionVersion = token.sessionVersion ?? 0;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.userId;
        session.user.role = token.role;
        session.user.isAdmin = token.isAdmin;

        // Validate sessionVersion against DB for single-device enforcement.
        try {
          const row = await prisma.user.findUnique({
            where: { id: token.userId },
            select: { sessionVersion: true },
          });
          const dbV = row?.sessionVersion ?? 0;
          const tokV = Number.isFinite(token.sessionVersion) ? token.sessionVersion : Number(token.sessionVersion ?? 0);
          if (tokV !== dbV) {
            return null;
          }
        } catch {
          // If DB read fails, don't hard-lock users out.
        }
      }
      return session;
    },
  },
  pages: {
    signIn: "/signin",
  },
};
