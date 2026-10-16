import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Fetch top active users with activity counts & custom profile handles
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        nickname: true,
        image: true,
        avatar: true,
        isPro: true,
        factsReadCount: true,
        tfAnsweredCount: true,
        totalCoinsEarned: true,
        quizProgress: {
          select: {
            score: true,
          },
        },
      },
      orderBy: {
        totalCoinsEarned: "desc",
      },
      take: 100,
    });

    const leaderboardData = users.map((user) => {
      const totalQuizPoints = (user.quizProgress || []).reduce((sum, p) => sum + (p.score || 0), 0);
      const intelligenceScore =
        totalQuizPoints +
        (user.factsReadCount || 0) +
        (user.tfAnsweredCount || 0) +
        (user.totalCoinsEarned || 0);

      return {
        id: user.id,
        name: user.nickname || user.name || "Anonymous Scholar",
        image: user.avatar || user.image || null,
        isPro: Boolean(user.isPro),
        quizPoints: totalQuizPoints,
        coinsEarned: user.totalCoinsEarned || 0,
        factsRead: user.factsReadCount || 0,
        tfAnswered: user.tfAnsweredCount || 0,
        totalScore: intelligenceScore,
      };
    });

    // Sort by total score descending
    leaderboardData.sort((a, b) => b.totalScore - a.totalScore);

    return NextResponse.json({ leaderboard: leaderboardData });
  } catch (error) {
    console.error("Leaderboard API Error:", error);
    return NextResponse.json({ error: "Failed to fetch leaderboard" }, { status: 500 });
  }
}
