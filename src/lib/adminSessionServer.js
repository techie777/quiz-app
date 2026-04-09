import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { adminSessionCookieName, verifyAdminSessionToken } from "@/lib/adminSession";

export async function getAdminFromRequest() {
  const secret = process.env.NEXTAUTH_SECRET || process.env.ADMIN_SESSION_SECRET;
  if (!secret) return null;

  const jar = await cookies();
  const token = jar.get(adminSessionCookieName())?.value || "";
  const verified = verifyAdminSessionToken(token, { secret });
  if (!verified.ok) return null;

  const adminId = verified.payload.adminId;
  const admin = await prisma.adminAccount.findUnique({
    where: { id: adminId },
    select: { id: true, username: true, displayName: true, role: true, status: true },
  });
  if (!admin || admin.status !== "active") return null;

  const permRow = await prisma.setting.findUnique({
    where: { key: `adminPerms:${admin.id}` },
    select: { value: true },
  });

  return {
    id: admin.id,
    username: admin.username,
    name: admin.displayName || admin.username,
    role: admin.role,
    permissions: permRow?.value || "{}",
  };
}

export async function requireAdmin({ masterOnly = false } = {}) {
  const admin = await getAdminFromRequest();
  if (!admin) return { ok: false, admin: null, status: 401, error: "Unauthorized" };
  if (masterOnly && admin.role !== "master") return { ok: false, admin, status: 403, error: "Master admin only" };
  return { ok: true, admin };
}

