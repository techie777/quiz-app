import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { safeJsonParse } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const url = new URL(request.url);
    const type = url.searchParams.get("type");
    if (!type) {
      return NextResponse.json({ error: "type required" }, { status: 400 });
    }

    const rows = await prisma.dailyQuiz.findMany({
      where: { type },
      orderBy: { date: "desc" },
    });

    // Get all unique question IDs from all history rows to check existence
    const allIds = new Set();
    rows.forEach(r => {
      const ids = safeJsonParse(r.questionIds) || [];
      ids.forEach(id => {
        if (typeof id === 'string' && id.length === 24) allIds.add(id);
      });
    });

    // Find which of these IDs actually exist in the database
    const existingQuestions = await prisma.question.findMany({
      where: { id: { in: Array.from(allIds) } },
      select: { id: true }
    });
    const existingIdSet = new Set(existingQuestions.map(q => q.id));

    const results = rows
      .map((r) => {
        const parsed = safeJsonParse(r.questionIds);
        const ids = Array.isArray(parsed) ? parsed : [];
        // Only count IDs that are valid AND exist in the Question table
        const validIds = ids.filter(id => existingIdSet.has(id));
        
        return {
          date: r.date,
          questionCount: validIds.length,
        };
      })
      .filter((r) => r.questionCount > 0);

    return NextResponse.json(results);
  } catch (error) {
    console.error("DailyQuiz history error:", error);
    return NextResponse.json([], { status: 200 });
  }
}

