import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    // Fetch users with their activity counts
    // For "Global Intelligence Leaderboard", we sum their interactions
    const users = await prisma.user.findMany({
      where: {
        isAdmin: false,
      },
      select: {
        id: true,
        name: true,
        image: true,
        isPro: true,
        factsReadCount: true,
        tfAnsweredCount: true,
        quizProgress: {
            select: {
                score: true
            }
        }
      },
      orderBy: {
        createdAt: 'desc' // We will sort them in memory for the score
      },
      take: 100 // Top 100 for global leaderboard
    });

    const leaderboardData = users.map(user => {
      const totalQuizPoints = user.quizProgress.reduce((sum, p) => sum + (p.score || 0), 0);
      const intelligenceScore = totalQuizPoints + (user.factsReadCount || 0) + (user.tfAnsweredCount || 0);

      return {
        id: user.id,
        name: user.name || "Anonymous Scholar",
        image: user.image,
        isPro: user.isPro,
        quizPoints: totalQuizPoints,
        factsRead: user.factsReadCount || 0,

        tfAnswered: user.tfAnsweredCount || 0,
        totalScore: intelligenceScore
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
