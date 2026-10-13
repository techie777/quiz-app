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
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = Math.min(200, Math.max(10, parseInt(searchParams.get("limit") || "50", 10)));
  const skip = (page - 1) * limit;

  const where = {};
  if (adminId) where.adminId = adminId;
  if (action) where.action = action;

  const [total, logs] = await Promise.all([
    prisma.adminActivityLog.count({ where }),
    prisma.adminActivityLog.findMany({
      where,
      include: { admin: { select: { username: true, displayName: true } } },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
  ]);

  return NextResponse.json({
    logs,
    total,
    page,
    totalPages: Math.ceil(total / limit) || 1,
    limit,
  });
}
