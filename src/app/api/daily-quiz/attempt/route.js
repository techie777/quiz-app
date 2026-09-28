import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTodayIST, normalizeDailyTier } from "@/lib/dailyQuizHelper";

export const dynamic = "force-dynamic";

function getYesterdayIST() {
  const now = new Date();
  const istString = now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
  const istDate = new Date(istString);
  istDate.setDate(istDate.getDate() - 1);
  const year = istDate.getFullYear();
  const month = String(istDate.getMonth() + 1).padStart(2, "0");
  const day = String(istDate.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    const body = await request.json();
    const { tier: rawTier, date, score, total, timeTaken, deviceId } = body;

    const tier = normalizeDailyTier(rawTier);
    const todayIST = getTodayIST();
    const playedOnDay = Boolean(date === todayIST);

    let streak = 1;

    // Authenticated user streak tracking
    if (session?.user?.id) {
      const userId = session.user.id;
      try {
        const existingStreak = await prisma.dailyStreak.findUnique({
          where: { userId },
        });

        if (playedOnDay) {
          if (existingStreak && existingStreak.lastClaimAt) {
            const lastClaimIST = new Date(existingStreak.lastClaimAt)
              .toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
            const lastClaimDate = new Date(lastClaimIST);
            const lastYear = lastClaimDate.getFullYear();
            const lastMonth = String(lastClaimDate.getMonth() + 1).padStart(2, "0");
            const lastDay = String(lastClaimDate.getDate()).padStart(2, "0");
            const lastClaimDateStr = `${lastYear}-${lastMonth}-${lastDay}`;

            if (lastClaimDateStr === todayIST) {
              // Already played today: maintain current streak
              streak = existingStreak.streakCount;
            } else if (lastClaimDateStr === getYesterdayIST()) {
              // Played yesterday: increment streak
              streak = (existingStreak.streakCount || 0) + 1;
            } else {
              // Streak broken: reset to 1
              streak = 1;
            }
          } else {
            streak = 1;
          }

          await prisma.dailyStreak.upsert({
            where: { userId },
            update: { streakCount: streak, lastClaimAt: new Date() },
            create: { userId, streakCount: streak, lastClaimAt: new Date() },
          });
        } else if (existingStreak) {
          streak = existingStreak.streakCount || 0;
        }
      } catch (streakErr) {
        console.warn("[DailyQuiz/Attempt] Error updating streak:", streakErr.message);
      }
    }

    return NextResponse.json({
      success: true,
      playedOnDay,
      streak,
      score: Number(score) || 0,
      total: Number(total) || 10,
      timeTaken: Number(timeTaken) || 0,
      date,
      tier,
    });
  } catch (error) {
    console.error("[DailyQuiz/Attempt] Error saving attempt:", error);
    return NextResponse.json({ error: "Failed to record attempt" }, { status: 500 });
  }
}
