import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      // Unauthenticated / Guest response
      return NextResponse.json({ attempts: [], isGuest: true });
    }

    const userId = session.user.id;

    // Fetch quiz sets attempts (UserProgress) and mock test attempts (MockAttempt) concurrently
    const [quizProgressList, mockAttemptsList] = await Promise.all([
      prisma.userProgress.findMany({
        where: { userId },
        include: {
          category: {
            select: {
              id: true,
              topic: true,
              topicHi: true,
              emoji: true,
              slug: true,
            },
          },
        },
        orderBy: { updatedAt: "desc" },
        take: 30,
      }),
      prisma.mockAttempt.findMany({
        where: { userId },
        include: {
          paper: {
            select: {
              id: true,
              title: true,
              totalMarks: true,
              exam: {
                select: {
                  name: true,
                  emoji: true,
                },
              },
            },
          },
        },
        orderBy: { updatedAt: "desc" },
        take: 30,
      }),
    ]);

    // Map general quiz sets to unified attempt items
    const generalQuizAttempts = (quizProgressList || []).map((p) => {
      const categoryTopic = p.category?.topic || "Quiz";
      return {
        id: `quiz-${p.id}`,
        rawId: p.id,
        type: "QUIZ_SET",
        typeLabel: "General Quiz Set",
        typeLabelHi: "सामान्य क्विज़ सेट",
        category: categoryTopic,
        categoryHi: p.category?.topicHi || categoryTopic,
        title: `${categoryTopic} — Set ${p.setIndex}`,
        emoji: p.category?.emoji || "🎯",
        score: p.score,
        scoreDisplay: `${p.score} Pts`,
        progress: Math.round(p.progress || 0),
        isComplete: Boolean(p.isComplete),
        status: p.isComplete ? "COMPLETED" : "IN_PROGRESS",
        attemptsCount: p.attempts || 1,
        date: p.updatedAt ? p.updatedAt.toISOString() : new Date().toISOString(),
        href: `/category/${p.category?.slug || p.categoryId}`,
      };
    });

    // Map govt exam mocks to unified attempt items
    const govtMockAttempts = (mockAttemptsList || []).map((m) => {
      const examName = m.paper?.exam?.name || "Govt Mock Test";
      const paperTitle = m.paper?.title || "Mock Test Paper";
      const totalMarks = m.paper?.totalMarks || 100;

      return {
        id: `mock-${m.id}`,
        rawId: m.id,
        type: "MOCK_EXAM",
        typeLabel: "Govt Exam Mock",
        typeLabelHi: "सरकारी परीक्षा मॉक",
        category: examName,
        categoryHi: examName,
        title: paperTitle,
        emoji: m.paper?.exam?.emoji || "🏛️",
        score: m.score,
        scoreDisplay: `${m.score} / ${totalMarks} Marks`,
        progress: m.status === "COMPLETED" ? 100 : Math.round((m.attemptedCount / 100) * 100),
        isComplete: m.status === "COMPLETED",
        status: m.status || "COMPLETED",
        correctCount: m.correctCount || 0,
        attemptedCount: m.attemptedCount || 0,
        date: (m.completedAt || m.updatedAt || m.startedAt || new Date()).toISOString(),
        href: `/mock-tests/result/${m.id}`,
      };
    });

    // Merge and sort chronologically descending
    const allAttempts = [...generalQuizAttempts, ...govtMockAttempts].sort(
      (a, b) => new Date(b.date) - new Date(a.date)
    );

    return NextResponse.json({
      attempts: allAttempts,
      counts: {
        total: allAttempts.length,
        quizSets: generalQuizAttempts.length,
        mockExams: govtMockAttempts.length,
      },
    });
  } catch (error) {
    console.error("Attempts API Error:", error);
    return NextResponse.json({ error: "Failed to fetch attempts" }, { status: 500 });
  }
}
