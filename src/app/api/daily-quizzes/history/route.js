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
      select: { date: true, questionIds: true },
    });

    return NextResponse.json(
      rows.map((r) => ({
        date: r.date,
        questionCount: (safeJsonParse(r.questionIds) || []).length,
      }))
    );
  } catch (error) {
    console.error("DailyQuiz history error:", error);
    return NextResponse.json([], { status: 200 });
  }
}

