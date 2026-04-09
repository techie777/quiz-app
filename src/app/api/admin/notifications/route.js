import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminSessionServer";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const admin = await requireAdmin();
  if (!admin.ok) return NextResponse.json({ error: admin.error }, { status: admin.status });

  const { searchParams } = new URL(request.url);
  const unread = searchParams.get("unread") === "1";

  const isMaster = admin.admin.role === "master";

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
    where: { key: `adminNotifSeen:${admin.admin.id}` },
    select: { value: true },
  });
  const seenAt = seenRow?.value ? new Date(seenRow.value) : new Date(0);
  const validSeenAt = isNaN(seenAt.getTime()) ? new Date(0) : seenAt;

  const tasks = await prisma.pendingTask.findMany({
    where: { adminId: admin.admin.id, status: { in: ["approved", "rejected"] } },
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
