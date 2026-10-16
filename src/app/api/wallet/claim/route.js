import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const DAILY_REWARD = 50;

// Helper to get calendar date string in IST (Asia/Kolkata) -> "YYYY-MM-DD"
function getISTDateString(date) {
  return date.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
}

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, coinBalance: true, totalCoinsEarned: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    let streak = await prisma.dailyStreak.findUnique({
      where: { userId: user.id },
    });

    if (!streak) {
      streak = await prisma.dailyStreak.create({
        data: { userId: user.id, streakCount: 0 },
      });
    }

    const now = new Date();
    const todayStr = getISTDateString(now);
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const yesterdayStr = getISTDateString(yesterday);

    // Check if already claimed today
    if (streak.lastClaimAt) {
      const lastClaimStr = getISTDateString(new Date(streak.lastClaimAt));
      if (lastClaimStr === todayStr) {
        return NextResponse.json({ error: "Already claimed today" }, { status: 400 });
      }
    }

    // Determine new streak count
    let newStreakCount = 1;
    if (streak.lastClaimAt) {
      const lastClaimStr = getISTDateString(new Date(streak.lastClaimAt));
      if (lastClaimStr === yesterdayStr) {
        newStreakCount = (streak.streakCount || 0) + 1;
      }
    }

    // Update streak
    const updatedStreak = await prisma.dailyStreak.update({
      where: { userId: user.id },
      data: {
        streakCount: newStreakCount,
        lastClaimAt: now,
      },
    });

    // Create transaction record
    const transaction = await prisma.coinTransaction.create({
      data: {
        userId: user.id,
        type: "DAILY_LOGIN",
        amount: DAILY_REWARD,
        description: `Daily login reward (Streak: ${newStreakCount})`,
      },
    });

    // Update user balance atomically
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        coinBalance: { increment: DAILY_REWARD },
        totalCoinsEarned: { increment: DAILY_REWARD },
      },
      select: {
        coinBalance: true,
        totalCoinsEarned: true,
      },
    });

    return NextResponse.json({
      wallet: {
        coinBalance: updatedUser.coinBalance,
        totalCoinsEarned: updatedUser.totalCoinsEarned,
      },
      streak: updatedStreak,
      transaction,
    });
  } catch (error) {
    console.error("Daily claim error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
