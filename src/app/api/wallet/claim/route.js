import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DAILY_REWARD = 50;

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

    // Check if can claim (24 hours since last claim)
    if (streak.lastClaimAt) {
      const lastClaim = new Date(streak.lastClaimAt);
      const now = new Date();
      const hoursSinceClaim = (now - lastClaim) / (1000 * 60 * 60);
      
      if (hoursSinceClaim < 24) {
        return NextResponse.json({ error: "Already claimed today" }, { status: 400 });
      }
    }

    // Check if streak is broken (more than 48 hours)
    let newStreakCount = streak.streakCount + 1;
    if (streak.lastClaimAt) {
      const lastClaim = new Date(streak.lastClaimAt);
      const now = new Date();
      const hoursSinceClaim = (now - lastClaim) / (1000 * 60 * 60);
      
      if (hoursSinceClaim > 48) {
        newStreakCount = 1; // Reset streak
      }
    }

    // Update streak
    const updatedStreak = await prisma.dailyStreak.update({
      where: { userId: user.id },
      data: {
        streakCount: newStreakCount,
        lastClaimAt: new Date(),
      },
    });

    // Create transaction
    const transaction = await prisma.coinTransaction.create({
      data: {
        userId: user.id,
        type: "DAILY_LOGIN",
        amount: DAILY_REWARD,
        description: `Daily login reward (Streak: ${newStreakCount})`,
      },
    });

    // Update user balance
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        coinBalance: user.coinBalance + DAILY_REWARD,
        totalCoinsEarned: user.totalCoinsEarned + DAILY_REWARD,
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
