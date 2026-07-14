import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/adminSessionServer";

export const dynamic = "force-dynamic";

export async function GET(req) {
  const adminCheck = await requireAdmin();
  if (!adminCheck.ok) return NextResponse.json({ error: adminCheck.error }, { status: adminCheck.status });

  try {
    const [pending, deleted] = await Promise.all([
      prisma.forumTopic.findMany({
        where: { status: "PENDING", isDeleted: false },
        orderBy: { createdAt: "desc" },
        include: { author: { select: { name: true, email: true } } }
      }),
      prisma.forumTopic.findMany({
        where: { isDeleted: true },
        orderBy: { updatedAt: "desc" },
        include: { author: { select: { name: true, email: true } } }
      })
    ]);

    return NextResponse.json({ pending, deleted });
  } catch (error) {
    return NextResponse.json({ error: "Failed to load moderation queues" }, { status: 500 });
  }
}
