import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createAdminSessionToken, adminSessionCookieName } from "@/lib/adminSession";

export const dynamic = "force-dynamic";

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const username = String(body?.username || "").trim();
  const password = String(body?.password || "");

  if (!username || !password) {
    return NextResponse.json({ success: false, message: "Username and password required" }, { status: 400 });
  }

  const admin = await prisma.adminAccount.findUnique({
    where: { username },
    select: { id: true, username: true, displayName: true, role: true, status: true, passwordHash: true },
  });
  if (!admin || admin.status !== "active") {
    return NextResponse.json({ success: false, message: "Invalid username or password" }, { status: 401 });
  }
  // Backward compatibility: if old DB stored plain text password, allow once and migrate to bcrypt.
  const looksLikeBcrypt = typeof admin.passwordHash === "string" && admin.passwordHash.startsWith("$2");
  let ok = false;
  if (looksLikeBcrypt) {
    ok = await bcrypt.compare(password, admin.passwordHash);
  } else {
    ok = password === String(admin.passwordHash || "");
    if (ok) {
      const newHash = await bcrypt.hash(password, 10);
      await prisma.adminAccount.update({ where: { id: admin.id }, data: { passwordHash: newHash } }).catch(() => {});
    }
  }
  if (!ok) return NextResponse.json({ success: false, message: "Invalid username or password" }, { status: 401 });

  await prisma.adminActivityLog.create({
    data: { adminId: admin.id, action: "login", details: "Admin logged in" },
  });

  const secret = process.env.NEXTAUTH_SECRET || process.env.ADMIN_SESSION_SECRET;
  if (!secret) {
    return NextResponse.json({ success: false, message: "Server misconfigured (missing secret)" }, { status: 500 });
  }

  const token = createAdminSessionToken(
    { adminId: admin.id, role: admin.role, username: admin.username },
    { secret, ttlSeconds: 60 * 60 * 24 * 7 } // 7 days
  );

  const res = NextResponse.json({
    success: true,
    admin: { id: admin.id, username: admin.username, name: admin.displayName || admin.username, role: admin.role },
  });
  res.cookies.set(adminSessionCookieName(), token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}

