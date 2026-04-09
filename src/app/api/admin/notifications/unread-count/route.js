import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminSessionServer";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin.ok) return NextResponse.json({ error: admin.error }, { status: admin.status });

  const isMaster = admin.admin.role === "master";
  if (isMaster) {
    const count = await prisma.pendingTask.count({ where: { status: "pending" } });
    return NextResponse.json({ count });
  }

  const seenRow = await prisma.setting.findUnique({
    where: { key: `adminNotifSeen:${admin.admin.id}` },
    select: { value: true },
  });
  const seenAt = seenRow?.value ? new Date(seenRow.value) : new Date(0);
  const validSeenAt = isNaN(seenAt.getTime()) ? new Date(0) : seenAt;

  const count = await prisma.pendingTask.count({
    where: {
      adminId: admin.admin.id,
      status: { in: ["approved", "rejected"] },
      updatedAt: { gt: validSeenAt },
    },
  });

  return NextResponse.json({ count });
}
