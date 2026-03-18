import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const isMaster = session.user.role === "master";
  if (isMaster) {
    const count = await prisma.pendingTask.count({ where: { status: "pending" } });
    return NextResponse.json({ count });
  }

  const seenRow = await prisma.setting.findUnique({
    where: { key: `adminNotifSeen:${session.user.adminId}` },
    select: { value: true },
  });
  const seenAt = seenRow?.value ? new Date(seenRow.value) : new Date(0);
  const validSeenAt = isNaN(seenAt.getTime()) ? new Date(0) : seenAt;

  const count = await prisma.pendingTask.count({
    where: {
      adminId: session.user.adminId,
      status: { in: ["approved", "rejected"] },
      updatedAt: { gt: validSeenAt },
    },
  });

  return NextResponse.json({ count });
}
