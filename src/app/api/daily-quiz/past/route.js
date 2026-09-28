import { NextResponse } from "next/server";
import { getTodayIST, normalizeDailyTier } from "@/lib/dailyQuizHelper";

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const url = new URL(request.url);
    const rawTier = url.searchParams.get("tier") || url.searchParams.get("type");
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
    const limit = 30;

    const tier = normalizeDailyTier(rawTier);
    const defaultCount = tier === "kids" ? 5 : 10;
    const todayStr = getTodayIST();

    // Generate list of dates newest first starting from yesterday or today
    const now = new Date();
    const istString = now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
    const baseDate = new Date(istString);

    const startIndex = (page - 1) * limit;
    const days = [];

    for (let i = 0; i < limit; i++) {
      const offset = startIndex + i;
      const d = new Date(baseDate);
      d.setDate(d.getDate() - offset);
      
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      const dateStr = `${year}-${month}-${day}`;

      days.push({
        date: dateStr,
        isToday: dateStr === todayStr,
        questionCount: defaultCount,
        tier,
      });
    }

    return NextResponse.json({
      tier,
      page,
      limit,
      hasMore: page < 4, // Up to ~120 past days
      days,
    });
  } catch (error) {
    console.error("[DailyQuiz/Past] Error:", error);
    return NextResponse.json({ error: "Failed to load past daily quizzes" }, { status: 500 });
  }
}
