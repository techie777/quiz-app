import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { topicId, commentId, reason } = await req.json();

    if (!reason || (!topicId && !commentId)) {
      return NextResponse.json({ error: "Invalid report data" }, { status: 400 });
    }

    const report = await prisma.forumReport.create({
      data: {
        reporterId: session.user.id,
        topicId: topicId || null,
        commentId: commentId || null,
        reason
      }
    });

    return NextResponse.json({ success: true, reportId: report.id });
  } catch (error) {
    return NextResponse.json({ error: "Failed to submit report" }, { status: 500 });
  }
}
