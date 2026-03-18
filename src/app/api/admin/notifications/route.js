import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const unread = searchParams.get("unread") === "1";

  const isMaster = session.user.role === "master";

  if (isMaster) {
    const tasks = await prisma.pendingTask.findMany({
      where: { status: "pending" },
      include: { admin: { select: { username: true, displayName: true } } },
      orderBy: { createdAt: "desc" },
      take: 200,
    });

    return NextResponse.json(
      tasks.map((t) => ({
        id: t.id,
        type: "pending_request",
        title: `Pending: ${t.actionType}`,
        message: `${t.admin?.displayName || t.admin?.username || "Jr Admin"} submitted a request`,
        link: "/admin/pending",
        createdAt: t.createdAt,
        readAt: null,
      }))
    );
  }

  const seenRow = await prisma.setting.findUnique({
    where: { key: `adminNotifSeen:${session.user.adminId}` },
    select: { value: true },
  });
  const seenAt = seenRow?.value ? new Date(seenRow.value) : new Date(0);
  const validSeenAt = isNaN(seenAt.getTime()) ? new Date(0) : seenAt;

  const tasks = await prisma.pendingTask.findMany({
    where: { adminId: session.user.adminId, status: { in: ["approved", "rejected"] } },
    orderBy: { updatedAt: "desc" },
    take: 200,
  });

  const mapped = tasks.map((t) => {
    const createdAt = t.updatedAt || t.createdAt;
    const isUnread = createdAt > validSeenAt;
    return {
      id: t.id,
      type: t.status === "approved" ? "task_approved" : "task_rejected",
      title: t.status === "approved" ? "Approval granted" : "Approval rejected",
      message: `${t.actionType}${t.reviewNote ? ` — ${t.reviewNote}` : ""}`,
      link: "/admin/pending?status=all",
      createdAt,
      readAt: isUnread ? null : createdAt,
    };
  });

  return NextResponse.json(unread ? mapped.filter((n) => !n.readAt) : mapped);
}
