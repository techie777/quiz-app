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

        if (!user) {
           // Truly new user - depends on your policy.
           // If you want to enable automatic registration, you would call prisma.user.create here.
           throw new Error("No account found for this email. Please use Google to create an account first.");
        }

        // If user exists but HAS NO PIN (likely a Google-only user until now)
        if (!user.pin) {
            console.log(`🔐 [AUTH] Setting initial PIN for Google user: ${email}`);
            user = await prisma.user.update({
                where: { id: user.id },
                data: { pin }
            });
        } else {
            // Existing user with a PIN - standard verification
            if (user.pin !== pin) {
                console.warn(`🚫 [AUTH] Invalid PIN attempt for: ${email}`);
                throw new Error("Invalid PIN. Please try again.");
            }
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
  pages: {
    signIn: "/signin",
  },
};
