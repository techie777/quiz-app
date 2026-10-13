import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminSessionServer";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const admin = await requireAdmin();
  if (!admin.ok) return NextResponse.json({ error: admin.error }, { status: admin.status });

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");

  if (type === "broadcasts") {
    const row = await prisma.setting.findUnique({
      where: { key: "studentBroadcasts" },
      select: { value: true },
    });
    let list = [];
    if (row?.value) {
      try {
        list = JSON.parse(row.value);
      } catch {
        list = [];
      }
    }
    return NextResponse.json(list);
  }

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

export async function POST(request) {
  const admin = await requireAdmin();
  if (!admin.ok) return NextResponse.json({ error: admin.error }, { status: admin.status });

  try {
    const body = await request.json();
    const { title, message, audience, category, link } = body;

    if (!title?.trim() || !message?.trim()) {
      return NextResponse.json({ error: "Title and message are required" }, { status: 400 });
    }

    const row = await prisma.setting.findUnique({
      where: { key: "studentBroadcasts" },
      select: { value: true },
    });

    let current = [];
    if (row?.value) {
      try {
        current = JSON.parse(row.value);
      } catch {
        current = [];
      }
    }

    const newBroadcast = {
      id: "bc_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7),
      title: title.trim(),
      message: message.trim(),
      audience: audience || "all", // "all", "pro", "free", "exam"
      category: category || "general", // "general", "exam_alert", "reward", "update"
      link: link?.trim() || "",
      sender: admin.admin.displayName || admin.admin.username,
      senderId: admin.admin.id,
      createdAt: new Date().toISOString(),
    };

    const updated = [newBroadcast, ...current].slice(0, 50);

    await prisma.setting.upsert({
      where: { key: "studentBroadcasts" },
      create: { key: "studentBroadcasts", value: JSON.stringify(updated) },
      update: { value: JSON.stringify(updated) },
    });

    await prisma.adminActivityLog.create({
      data: {
        adminId: admin.admin.id,
        action: "BROADCAST_NOTIFICATION",
        details: `Broadcast: "${title.trim()}" to ${audience || "all"}`,
      },
    });

    return NextResponse.json({ success: true, broadcast: newBroadcast });
  } catch (err) {
    return NextResponse.json({ error: "Failed to broadcast notification: " + err.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  const admin = await requireAdmin();
  if (!admin.ok) return NextResponse.json({ error: admin.error }, { status: admin.status });

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) return NextResponse.json({ error: "Broadcast ID required" }, { status: 400 });

    const row = await prisma.setting.findUnique({
      where: { key: "studentBroadcasts" },
      select: { value: true },
    });

    if (!row?.value) return NextResponse.json({ success: true });

    let current = JSON.parse(row.value);
    const updated = current.filter((b) => b.id !== id);

    await prisma.setting.update({
      where: { key: "studentBroadcasts" },
      data: { value: JSON.stringify(updated) },
    });

    await prisma.adminActivityLog.create({
      data: {
        adminId: admin.admin.id,
        action: "DELETE_BROADCAST",
        details: `Deleted broadcast ID: ${id}`,
      },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: "Failed to delete broadcast: " + err.message }, { status: 500 });
  }
}
