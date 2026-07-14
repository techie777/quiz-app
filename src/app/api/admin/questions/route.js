import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/adminSessionServer";

export const dynamic = "force-dynamic";

export async function GET() {
  const adminCheck = await requireAdmin();
  if (!adminCheck.ok) {
    return NextResponse.json({ error: adminCheck.error }, { status: adminCheck.status });
  }

  try {
    const questions = await prisma.question.findMany({
      include: {
        category: {
          select: { topic: true, emoji: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const parsedQuestions = questions.map(q => {
      let opts = [];
      try {
        opts = JSON.parse(q.options);
      } catch (e) {
        opts = [];
      }
      return {
        ...q,
        options: opts,
        categoryTopic: q.category?.topic,
        categoryEmoji: q.category?.emoji
      };
    });

    return NextResponse.json(parsedQuestions);
  } catch (error) {
    console.error("Admin Questions GET error:", error);
    return NextResponse.json({ error: "Failed to fetch questions" }, { status: 500 });
  }
}
