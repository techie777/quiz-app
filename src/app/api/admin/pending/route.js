import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminSessionServer";
import { prisma } from "@/lib/prisma";
import { safeJsonParse } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const admin = await requireAdmin();
  if (!admin.ok) return NextResponse.json({ error: admin.error }, { status: admin.status });
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") || "pending";

  const where = {};
  if (status !== "all") where.status = status;

  const tasks = await prisma.pendingTask.findMany({
    where,
    include: { admin: { select: { username: true, displayName: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(tasks.map((t) => ({ ...t, payload: safeJsonParse(t.payload, {}) })));
}

export async function POST(request) {
  const admin = await requireAdmin();
  if (!admin.ok) return NextResponse.json({ error: admin.error }, { status: admin.status });
  try {
    const body = await request.json();
    const actionType = body.type || body.actionType;
    const payload = body.payload;

    if (!actionType || !payload) {
      return NextResponse.json({ error: "actionType and payload are required" }, { status: 400 });
    }

    // Derive entityType and entityId from actionType and payload
    let entityType = body.entityType || "";
    let entityId = body.entityId || null;
    if (!entityType) {
      if (actionType.includes("category")) {
        entityType = "category";
        entityId = payload.categoryId || payload.id || null;
      } else if (actionType.includes("question")) {
        entityType = "question";
        entityId = payload.questionId || payload.id || null;
      } else if (actionType.includes("current_affair")) {
        entityType = "currentAffair";
        entityId = payload.id || null;
      } else if (actionType.includes("bulk")) {
        entityType = "bulk";
      }
    }

    const task = await prisma.pendingTask.create({
      data: {
        adminId: admin.admin.id,
        actionType,
        entityType,
        entityId,
        payload: JSON.stringify(payload),
      },
    });

    // Log the submission
    await prisma.adminActivityLog.create({
      data: {
        adminId: admin.admin.id,
        action: "submit_pending",
        details: `Submitted ${actionType} for approval`,
      },
    });

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error("Pending task creation error:", error);
    return NextResponse.json({ error: "Failed to create pending task" }, { status: 500 });
  }
}
