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
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.userId = user.id;
        token.role = "user";
        token.isAdmin = false;

        // Enforce 1-user-1-device: attempt to bump sessionVersion.
        try {
          const updated = await prisma.user.update({
            where: { id: user.id },
            data: { sessionVersion: { increment: 1 }, lastLoginAt: new Date() },
            select: { sessionVersion: true },
          });
          token.sessionVersion = updated.sessionVersion;
        } catch (updateError) {
          // LOG: DB or Schema mismatch. Default to 0 to allow login.
          console.error("⚠️ [AUTH] Session versioning failed during login:", updateError.message);
          token.sessionVersion = 0;
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
          const tokV = Number.isFinite(token.sessionVersion) ? Number(token.sessionVersion) : 0;
          
          if (tokV !== dbV) {
            console.warn("🚫 [AUTH] Session version mismatch (multi-device login detected).");
            return null;
          }
        } catch (checkError) {
          // If DB read fails, don't hard-lock users out.
          console.warn("⚠️ [AUTH] Session validation skipped due to DB error.");
        }
      }
      return session;
    },
  },
  // pages: {
  //   signIn: "/signin",
  // },
};
