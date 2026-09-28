import { prisma } from "@/lib/prisma";
import { safeJsonParse } from "@/lib/utils";

/**
 * Returns today's date formatted as YYYY-MM-DD in Asia/Kolkata (IST).
 * Resets precisely at 12:00 AM IST.
 */
export function getTodayIST() {
  const now = new Date();
  const istString = now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
  const istDate = new Date(istString);
  const year = istDate.getFullYear();
  const month = String(istDate.getMonth() + 1).padStart(2, "0");
  const day = String(istDate.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Normalizes tier names:
 * "adults" -> "explorer"
 */
export function normalizeDailyTier(tier) {
  const t = String(tier || "").toLowerCase();
  if (t === "adults") return "explorer";
  if (t === "kids") return "kids";
  if (t === "students") return "students";
  return "explorer";
}

/**
 * Deterministic pseudo-random number generator based on string seed
 */
function createPrng(seedStr) {
  let hash = 0;
  for (let i = 0; i < seedStr.length; i++) {
    hash = (hash << 5) - hash + seedStr.charCodeAt(i);
    hash |= 0;
  }
  return function () {
    hash = (hash * 9301 + 49297) % 233280;
    return Math.abs(hash / 233280);
  };
}

/**
 * Auto-generates questions suited to a tier deterministically for a date
 */
export async function autoGenerateQuestions(tier, date) {
  const normTier = normalizeDailyTier(tier);
  const targetCount = normTier === "kids" ? 5 : 10;
  const prng = createPrng(`${normTier}_${date}`);

  try {
    // 1. Fetch active categories that have questions
    const categories = await prisma.category.findMany({
      where: {
        hidden: false,
      },
      select: {
        id: true,
        topic: true,
        categoryClass: true,
        _count: { select: { questions: true } },
      },
    });

    const activeCats = categories.filter((c) => c._count.questions > 0);
    if (!activeCats || activeCats.length === 0) {
      // Fallback: query questions directly
      const rawQs = await prisma.question.findMany({ take: targetCount });
      return {
        categoryId: rawQs[0]?.categoryId || "65f1a2b3c4d5e6f7a8b9c0d9",
        questionIds: rawQs.map((q) => q.id),
      };
    }

    // Filter categories by tier flavor if possible
    let candidateCats = activeCats;
    if (normTier === "kids") {
      const kidsKeywords = ["animal", "space", "math", "art", "story", "nature", "biology", "world", "sport"];
      const filtered = activeCats.filter((c) =>
        kidsKeywords.some((kw) => (c.topic || "").toLowerCase().includes(kw))
      );
      if (filtered.length >= 3) candidateCats = filtered;
    } else if (normTier === "students") {
      const studentKeywords = ["biology", "chemistry", "physics", "computer", "history", "polity", "economy", "india", "geography"];
      const filtered = activeCats.filter((c) =>
        studentKeywords.some((kw) => (c.topic || "").toLowerCase().includes(kw))
      );
      if (filtered.length >= 3) candidateCats = filtered;
    }

    // Pick a primary category from candidates
    const primaryCat = candidateCats[Math.floor(prng() * candidateCats.length)];
    const primaryCatId = primaryCat.id;

    // Pick questions from candidate categories
    const catIds = candidateCats.map((c) => c.id);
    const availableQuestions = await prisma.question.findMany({
      where: {
        categoryId: { in: catIds },
        ...(normTier === "kids" ? { difficulty: { in: ["easy", "medium"] } } : {}),
      },
      select: { id: true, categoryId: true },
      take: 200,
    });

    if (availableQuestions.length === 0) {
      const anyQs = await prisma.question.findMany({
        select: { id: true, categoryId: true },
        take: targetCount,
      });
      return {
        categoryId: anyQs[0]?.categoryId || primaryCatId,
        questionIds: anyQs.map((q) => q.id),
      };
    }

    // Deterministically shuffle questions using PRNG
    const shuffled = [...availableQuestions];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(prng() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    const selectedIds = shuffled.slice(0, targetCount).map((q) => q.id);

    return {
      categoryId: primaryCatId,
      questionIds: selectedIds,
    };
  } catch (error) {
    console.error("[dailyQuizHelper] autoGenerateQuestions error:", error);
    // Fallback query
    const fallback = await prisma.question.findMany({
      select: { id: true, categoryId: true },
      take: targetCount,
    });
    return {
      categoryId: fallback[0]?.categoryId || "65f1a2b3c4d5e6f7a8b9c0d9",
      questionIds: fallback.map((q) => q.id),
    };
  }
}
