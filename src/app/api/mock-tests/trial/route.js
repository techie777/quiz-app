import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    // 1. Fetch live mock paper (or first available live paper)
    let trialPaper = await prisma.mockPaper.findFirst({
      where: { isLive: true },
      orderBy: { createdAt: "desc" },
      include: {
        exam: {
          select: { id: true, name: true, emoji: true }
        },
        sections: {
          orderBy: { order: "asc" }
        },
        _count: {
          select: { questions: true }
        }
      }
    });

    // Fallback if no live paper in DB: return demo structured trial object
    if (!trialPaper) {
      trialPaper = {
        id: "demo-ssc-trial-2025",
        title: "Official SSC CGL Tier-I High Yield Trial Mock Test",
        slug: "ssc-cgl-tier-1-trial-mock",
        timeLimit: 60,
        totalMarks: 200,
        negativeMarking: 0.5,
        positiveMarking: 2.0,
        isTrial: true,
        isLive: true,
        exam: {
          name: "SSC CGL Tier-I Official Trial",
          emoji: "🏆"
        },
        _count: {
          questions: 100
        }
      };
    }

    return NextResponse.json({
      success: true,
      trialPaper
    });
  } catch (error) {
    console.error("Trial mock API error:", error);
    return NextResponse.json({ error: "Failed to fetch trial mock paper" }, { status: 500 });
  }
}
