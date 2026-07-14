import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/adminSessionServer";

export const dynamic = "force-dynamic";

export async function POST(req) {
  const adminCheck = await requireAdmin();
  if (!adminCheck.ok) return NextResponse.json({ error: adminCheck.error }, { status: adminCheck.status });

  try {
    const body = await req.json();
    const { action, targetId, days, reason } = body;

    if (action === "APPROVE_TOPIC") {
      await prisma.forumTopic.update({ where: { id: targetId }, data: { status: "APPROVED" } });
      return NextResponse.json({ success: true });
    }

    if (action === "REJECT_TOPIC") {
      await prisma.forumTopic.update({ where: { id: targetId }, data: { status: "REJECTED", rejectReason: reason || "Does not meet guidelines." } });
      return NextResponse.json({ success: true });
    }

    if (action === "RESTORE_TOPIC") {
      await prisma.forumTopic.update({ where: { id: targetId }, data: { isDeleted: false, status: "APPROVED" } });
      return NextResponse.json({ success: true });
    }

    if (action === "HIDE_TOPIC") {
      await prisma.forumTopic.update({ where: { id: targetId }, data: { isHidden: true } });
      return NextResponse.json({ success: true });
    }

    if (action === "HIDE_COMMENT") {
      await prisma.forumComment.update({ where: { id: targetId }, data: { isHidden: true } });
      return NextResponse.json({ success: true });
    }

    if (action === "DELETE_TOPIC") {
      await prisma.forumTopic.delete({ where: { id: targetId } });
      return NextResponse.json({ success: true });
    }

    if (action === "BAN_USER") {
      const banUntil = new Date();
      banUntil.setDate(banUntil.getDate() + (days || 7));
      
      await prisma.user.update({
        where: { email: targetId }, // targetId is email for banning to make it easy for admin
        data: { forumBanUntil: banUntil }
      });
      return NextResponse.json({ success: true, message: `User banned for ${days} days` });
    }

    if (action === "RESOLVE_REPORT") {
      await prisma.forumReport.update({
        where: { id: targetId },
        data: { status: "RESOLVED" }
      });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: "Action failed" }, { status: 500 });
  }
}
