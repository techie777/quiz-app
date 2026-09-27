import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

const SET_SIZE = 20;

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id || null;

    // 1. Fetch all active categories that have questions
    const categories = await prisma.category.findMany({
      where: {
        hidden: false,
      },
      include: {
        _count: {
          select: { questions: true },
        },
        questions: {
          select: {
            id: true,
            text: true,
            textHi: true,
            options: true,
            optionsHi: true,
            difficulty: true,
            createdAt: true,
            updatedAt: true,
          },
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: [
        { sortOrder: "asc" },
        { updatedAt: "desc" },
      ],
    });

    // Filter categories that have at least 1 question
    const activeCategories = categories.filter(
      (cat) => cat.questions && cat.questions.length > 0
    );

    const categoryIds = activeCategories.map((c) => c.id);

    // 2. Fetch UserProgress for attempts & user completion status
    let userProgressList = [];
    if (userId) {
      userProgressList = await prisma.userProgress.findMany({
        where: {
          userId,
          categoryId: { in: categoryIds },
        },
      });
    }

    // 3. Fetch cumulative set attempt statistics
    let setStats = [];
    try {
      if (prisma.quizSetStat) {
        setStats = await prisma.quizSetStat.findMany({
          where: {
            categoryId: { in: categoryIds },
          },
        });
      }
    } catch (e) {
      console.warn("[API/Learn] QuizSetStat fetch fallback:", e?.message);
    }

    // Also get all progress records to count community attempts if stats are empty
    let allProgressList = [];
    try {
      allProgressList = await prisma.userProgress.findMany({
        where: {
          categoryId: { in: categoryIds },
        },
        select: {
          categoryId: true,
          setIndex: true,
          attempts: true,
        },
      });
    } catch (e) {
      console.warn("[API/Learn] allProgressList fallback:", e?.message);
    }

    // Build stats lookup map: `${categoryId}_${setIndex}` -> attemptCount
    const attemptsMap = new Map();
    setStats.forEach((stat) => {
      const key = `${stat.categoryId}_${stat.setIndex}`;
      attemptsMap.set(key, (attemptsMap.get(key) || 0) + (stat.attemptCount || 1));
    });

    allProgressList.forEach((prog) => {
      const key = `${prog.categoryId}_${prog.setIndex}`;
      const count = prog.attempts || 1;
      attemptsMap.set(key, Math.max(attemptsMap.get(key) || 0, count));
    });

    // Build user progress map
    const userProgressMap = new Map();
    userProgressList.forEach((p) => {
      userProgressMap.set(`${p.categoryId}_${p.setIndex}`, p);
    });

    // 4. Generate all real Quiz Sets
    const allSets = [];
    const subjectsMap = new Map();

    for (const cat of activeCategories) {
      const qList = cat.questions || [];
      const totalQ = qList.length;
      const numSets = Math.ceil(totalQ / SET_SIZE);

      // Track subject chips
      const subjectKey = cat.id;
      if (!subjectsMap.has(subjectKey)) {
        subjectsMap.set(subjectKey, {
          id: cat.id,
          slug: cat.slug || cat.id,
          name: cat.topic,
          nameHi: cat.topicHi || cat.topic,
          emoji: cat.emoji || "📝",
          setCount: numSets,
          questionCount: totalQ,
        });
      }

      for (let sIdx = 1; sIdx <= numSets; sIdx++) {
        const start = (sIdx - 1) * SET_SIZE;
        const end = Math.min(start + SET_SIZE, totalQ);
        const setQuestions = qList.slice(start, end);
        if (setQuestions.length === 0) continue;

        const statKey = `${cat.id}_${sIdx}`;
        const rawAttempts = attemptsMap.get(statKey) || 0;
        // Natural attempt weighting: set 1 in popular category gets authentic activity
        const baseAttempts = (cat.attemptCount || 0) > 0 ? Math.floor(cat.attemptCount / numSets) : 0;
        const attemptCount = Math.max(rawAttempts, baseAttempts);

        // Date determination: use newest question in this set, or category updatedAt
        const newestQuestionDate = setQuestions.reduce((latest, q) => {
          const qDate = new Date(q.updatedAt || q.createdAt || cat.updatedAt);
          return qDate > latest ? qDate : latest;
        }, new Date(cat.createdAt));

        const userProg = userProgressMap.get(statKey) || null;

        allSets.push({
          id: `${cat.id}_set_${sIdx}`,
          index: sIdx,
          categoryId: cat.id,
          categorySlug: cat.slug || cat.id,
          categoryTopic: cat.topic,
          categoryTopicHi: cat.topicHi || cat.topic,
          categoryEmoji: cat.emoji || "📝",
          categoryImage: cat.image || null,
          categoryChips: cat.chips,
          questions: setQuestions,
          questionCount: setQuestions.length,
          attemptCount,
          createdAt: newestQuestionDate.toISOString(),
          progress: userProg
            ? {
                progress: userProg.progress || 0,
                isComplete: userProg.isComplete || false,
                score: userProg.score || 0,
              }
            : null,
        });
      }
    }

    // 5. Partition into dated sections:
    // "Today" (New Releases): sorted by createdAt / recency desc
    const sortedByRecency = [...allSets].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    // "This Week" (Trending & Most Attempted): sorted by attemptCount desc, then recency
    const sortedByTrending = [...allSets].sort((a, b) => {
      if (b.attemptCount !== a.attemptCount) {
        return b.attemptCount - a.attemptCount;
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    // 6. Fetch 2-3 recent bite-sized explainers for lightweight LearnCards
    let explainers = [];
    try {
      const recentAffairs = await prisma.currentAffair.findMany({
        where: { hidden: false },
        orderBy: { date: "desc" },
        take: 3,
        select: {
          id: true,
          date: true,
          heading: true,
          description: true,
          category: true,
          oneLiner: true,
          image: true,
        },
      });

      explainers = recentAffairs.map((ca) => ({
        id: ca.id,
        type: "explainer",
        title: ca.heading,
        category: ca.category || "Current Affairs",
        summary: ca.oneLiner || ca.description,
        date: ca.date,
        image: ca.image,
      }));
    } catch (e) {
      console.warn("[API/Learn] CurrentAffairs explainer fetch:", e?.message);
    }

    // Build subject chip list
    const subjects = Array.from(subjectsMap.values());

    return NextResponse.json({
      success: true,
      subjects,
      todaySets: sortedByRecency.slice(0, 18),
      thisWeekSets: sortedByTrending.slice(0, 18),
      allSets,
      explainers,
      meta: {
        totalSets: allSets.length,
        totalCategories: activeCategories.length,
      },
    });
  } catch (error) {
    console.error("[API/Learn] GET Error:", error);
    return NextResponse.json(
      { error: "Failed to load discovery feed", details: error.message },
      { status: 500 }
    );
  }
}
