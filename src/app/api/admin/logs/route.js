import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin || session.user.role !== "master") {
    return NextResponse.json({ error: "Master admin only" }, { status: 403 });
  }
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
