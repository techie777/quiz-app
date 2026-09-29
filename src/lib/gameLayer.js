/**
 * gameLayer.js
 * Step 9: Unified Game Layer System
 * - XP ("ज्ञान अंक") and 5-tier Progression Levels:
 *   जिज्ञासु (1), विद्यार्थी (2), ज्ञानी (3), पंडित (4), महाज्ञानी (5)
 * - Daily Goals & Streaks with automatic Streak Freeze protection
 * - Combo Multiplier rewards
 * - 3-Fact Recap & Weak-Topic Hint generators
 * - Seeded Challenge a Friend encoder/decoder
 */

export const LEVELS = [
  { id: 1, name: "जिज्ञासु", nameEn: "Curious", minXP: 0, nextXP: 500, icon: "🌱", color: "#10B981" },
  { id: 2, name: "विद्यार्थी", nameEn: "Learner", minXP: 500, nextXP: 1500, icon: "📚", color: "#6366F1" },
  { id: 3, name: "ज्ञानी", nameEn: "Scholar", minXP: 1500, nextXP: 3500, icon: "⚡", color: "#F59E0B" },
  { id: 4, name: "पंडित", nameEn: "Expert", minXP: 3500, nextXP: 7000, icon: "🎓", color: "#8B5CF6" },
  { id: 5, name: "महाज्ञानी", nameEn: "Grandmaster", minXP: 7000, nextXP: 15000, icon: "👑", color: "#EC4899" },
];

const XP_KEY = "quizweb_user_xp";
const STREAK_KEY = "quizweb_user_streak_v2";
const GOAL_KEY = "quizweb_daily_goal";

export function getXP() {
  if (typeof window === "undefined") return 0;
  try {
    const raw = localStorage.getItem(XP_KEY);
    return raw ? parseInt(raw, 10) || 0 : 0;
  } catch {
    return 0;
  }
}

export function saveXP(xp) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(XP_KEY, String(Math.max(0, xp)));
  } catch {}
}

export function getLevelInfo(xp = 0) {
  const currentXP = Math.max(0, xp);
  let currentLevel = LEVELS[0];

  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (currentXP >= LEVELS[i].minXP) {
      currentLevel = LEVELS[i];
      break;
    }
  }

  const isMaxLevel = currentLevel.id === LEVELS[LEVELS.length - 1].id;
  const xpInLevel = currentXP - currentLevel.minXP;
  const xpRange = isMaxLevel ? 8000 : (currentLevel.nextXP - currentLevel.minXP);
  const progressPct = Math.min(100, Math.max(0, Math.round((xpInLevel / xpRange) * 100)));
  const xpToNext = isMaxLevel ? 0 : Math.max(0, currentLevel.nextXP - currentXP);

  return {
    ...currentLevel,
    currentXP,
    progressPct,
    xpToNext,
    isMaxLevel,
  };
}

export function getStreakData() {
  if (typeof window === "undefined") return { count: 1, freezes: 1, lastDate: null };
  try {
    const raw = localStorage.getItem(STREAK_KEY);
    if (!raw) return { count: 1, freezes: 1, lastDate: null };
    const parsed = JSON.parse(raw);
    return {
      count: Number(parsed.count) || 1,
      freezes: typeof parsed.freezes === "number" ? parsed.freezes : 1,
      lastDate: parsed.lastDate || null,
    };
  } catch {
    return { count: 1, freezes: 1, lastDate: null };
  }
}

export function getTodayDateString() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function getYesterdayDateString() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/**
 * Record a completed quiz session into the Game Layer.
 * Calculates XP, updates Level, updates Streak with Freeze fallback,
 * checks Daily Goal, and produces 3-Fact Recap & Weak Topic Hint.
 */
export function recordQuizCompletion({
  score = 0,
  total = 0,
  maxCombo = 0,
  questions = [],
  userAnswers = {},
  categoryName = "सामान्य ज्ञान",
  isHindi = true,
}) {
  const oldXP = getXP();
  const oldLevel = getLevelInfo(oldXP);

  // 1. Calculate XP Breakdown
  const correctCount = Math.max(0, score);
  const correctXP = correctCount * 20;
  const comboXP = Math.max(0, maxCombo) * 5;
  const completionXP = 50;
  const perfectXP = (total > 0 && correctCount === total) ? 100 : 0;
  const earnedXP = correctXP + comboXP + completionXP + perfectXP;

  const newTotalXP = oldXP + earnedXP;
  saveXP(newTotalXP);
  const newLevel = getLevelInfo(newTotalXP);
  const leveledUp = newLevel.id > oldLevel.id;

  // 2. Streak & Freeze Management
  const today = getTodayDateString();
  const yesterday = getYesterdayDateString();
  const streakData = getStreakData();
  let updatedStreakCount = streakData.count;
  let freezesLeft = streakData.freezes;
  let streakProtectedWithFreeze = false;

  if (streakData.lastDate === today) {
    // Already practiced today; maintain streak
  } else if (streakData.lastDate === yesterday) {
    // Consecutive day! Increment streak
    updatedStreakCount += 1;
  } else if (streakData.lastDate && streakData.lastDate < yesterday) {
    // Missed a day: Check if Streak Freeze is available
    if (freezesLeft > 0) {
      freezesLeft -= 1;
      streakProtectedWithFreeze = true;
      updatedStreakCount += 1; // Preserve streak!
    } else {
      updatedStreakCount = 1; // Reset to 1
    }
  } else {
    // First time
    updatedStreakCount = 1;
  }

  try {
    localStorage.setItem(
      STREAK_KEY,
      JSON.stringify({
        count: updatedStreakCount,
        freezes: freezesLeft,
        lastDate: today,
      })
    );
  } catch {}

  // 3. Daily Goal Tracking (Target: 100 XP / day or 1 quiz)
  let isDailyGoalMet = false;
  try {
    const rawGoal = localStorage.getItem(GOAL_KEY);
    let goal = rawGoal ? JSON.parse(rawGoal) : null;
    if (!goal || goal.date !== today) {
      goal = { date: today, currentXP: 0, quizzesDone: 0 };
    }
    goal.currentXP += earnedXP;
    goal.quizzesDone += 1;
    isDailyGoalMet = goal.currentXP >= 100 || goal.quizzesDone >= 1;
    localStorage.setItem(GOAL_KEY, JSON.stringify(goal));
  } catch {}

  // 4. Generate 3-Fact Recap ("३ रोचक तथ्य")
  const recapFacts = [];
  if (Array.isArray(questions)) {
    // Collect questions with rich explanations
    const candidates = questions.filter(
      (q) => (q.explanation || q.explanationHi || q.text || q.textHi)
    );
    // Pick up to 3 diverse facts
    for (let i = 0; i < candidates.length && recapFacts.length < 3; i++) {
      const q = candidates[i];
      const rawText = isHindi && q.explanationHi ? q.explanationHi : q.explanation;
      if (rawText && rawText.trim().length > 15) {
        recapFacts.push(rawText.trim());
      } else {
        const qTitle = (isHindi && q.textHi ? q.textHi : q.text) || "";
        const qAns = String(q.correctAnswer || (q.options ? q.options[0] : "")).trim();
        if (qTitle && qAns) {
          recapFacts.push(`${qTitle} → सही उत्तर: ${qAns}`);
        }
      }
    }
  }

  // 5. Generate Weak-Topic Hint ("सुधार का सुझाव")
  let weakTopicHint = null;
  const wrongCount = Math.max(0, total - correctCount);
  if (wrongCount > 0 && total > 0) {
    const accuracy = Math.round((correctCount / total) * 100);
    if (accuracy < 50) {
      weakTopicHint = isHindi
        ? `💡 सुझाव: ${categoryName} में आपकी सटीकता ${accuracy}% रही। इस सेट को एक बार पुनः अभ्यास करने से आपकी पकड़ और मजबूत होगी!`
        : `💡 Focus Area: Your accuracy in ${categoryName} was ${accuracy}%. Practicing this set once more will help solidify key concepts!`;
    } else if (accuracy < 80) {
      weakTopicHint = isHindi
        ? `💡 सुझाव: कुछ कठिन प्रश्नों में सुधार की गुंजाइश है। व्याख्याओं को ध्यान से पढ़ें और अगला सेट हल करें!`
        : `💡 Focus Area: Great effort! Review the missed question explanations above to target a 100% score on the next set.`;
    }
  }

  return {
    earnedXP,
    breakdown: {
      correctXP,
      comboXP,
      completionXP,
      perfectXP,
    },
    totalXP: newTotalXP,
    oldLevel,
    newLevel,
    leveledUp,
    streak: {
      count: updatedStreakCount,
      freezes: freezesLeft,
      protectedWithFreeze: streakProtectedWithFreeze,
    },
    isDailyGoalMet,
    recapFacts,
    weakTopicHint,
  };
}

/**
 * Challenge a Friend Seed encoder / decoder
 */
export function createChallengeCode({ categorySlug, categoryName, score, total, playerName = "Quizzer" }) {
  const seed = Math.floor(100000 + Math.random() * 900000);
  const payload = {
    c: categorySlug || "general",
    n: categoryName || "Quiz",
    s: Number(score) || 0,
    t: Number(total) || 10,
    p: playerName,
    r: seed,
    ts: Date.now(),
  };
  try {
    return btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
  } catch {
    return `${categorySlug || "general"}-${score}-${total}-${seed}`;
  }
}

export function parseChallengeCode(code) {
  if (!code) return null;
  try {
    const jsonStr = decodeURIComponent(escape(atob(code)));
    const parsed = JSON.parse(jsonStr);
    return {
      categorySlug: parsed.c,
      categoryName: parsed.n,
      challengerScore: parsed.s,
      totalQuestions: parsed.t,
      challengerName: parsed.p || "Friend",
      seed: parsed.r,
      timestamp: parsed.ts,
    };
  } catch {
    return null;
  }
}
