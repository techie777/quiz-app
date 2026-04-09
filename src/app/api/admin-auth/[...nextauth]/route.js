import NextAuth from "next-auth";
import { adminAuthOptions } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

const handler = NextAuth(adminAuthOptions);
export { handler as GET, handler as POST };

