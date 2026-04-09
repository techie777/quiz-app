import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminSessionServer";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const admin = await requireAdmin({ masterOnly: true });
  if (!admin.ok) return NextResponse.json({ error: admin.error }, { status: admin.status });
  const { searchParams } = new URL(request.url);
  const adminId = searchParams.get("adminId");
  const action = searchParams.get("action");
  const where = {};
  if (adminId) where.adminId = adminId;
  if (action) where.action = action;

  const logs = await prisma.adminActivityLog.findMany({
    where,
    include: { admin: { select: { username: true, displayName: true } } },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  return NextResponse.json(logs);
}
