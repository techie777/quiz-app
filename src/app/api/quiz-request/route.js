import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    const { topic } = await request.json();
    if (!topic) {
      return NextResponse.json({ error: "Topic is required" }, { status: 400 });
    }

    // Find master admin account to assign request task
    const masterAdmin = await prisma.adminAccount.findFirst({
      where: { status: "active" },
      orderBy: { createdAt: "asc" }
    });

    if (masterAdmin) {
      await prisma.pendingTask.create({
        data: {
          adminId: masterAdmin.id,
          actionType: "user_request_quiz_data",
          entityType: "category",
          payload: JSON.stringify({
            topic,
            requestedAt: new Date().toISOString(),
            note: `Priority upload requested by user for quiz category '${topic}'`
          }),
          status: "pending"
        }
      });

      await prisma.adminActivityLog.create({
        data: {
          adminId: masterAdmin.id,
          action: "user_quiz_data_request",
          details: `User requested question update for category: ${topic}`
        }
      });
    }

    return NextResponse.json({ success: true, message: "Admin notified successfully" });
  } catch (error) {
    console.error("[QuizRequestAPI] Error:", error);
    return NextResponse.json({ error: "Failed to notify admin" }, { status: 500 });
  }
}
