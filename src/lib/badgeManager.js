"use client";

import toast from "react-hot-toast";

export const BADGES = [
  {
    id: "first_quiz",
    title: "First Step",
    titleHi: "पहला कदम",
    icon: "🌟",
    desc: "Complete your very first quiz",
    descHi: "अपनी पहली क्विज़ पूरी करें",
    req: 1,
    category: "quizCount"
  },
  {
    id: "perfect_score",
    title: "Perfect 100",
    titleHi: "शतक वीर",
    icon: "💯",
    desc: "Achieve a 100% score on any quiz",
    descHi: "किसी भी क्विज़ में 100% स्कोर प्राप्त करें",
    req: 1,
    category: "perfectCount"
  },
  {
    id: "speed_demon",
    title: "Speed Demon",
    titleHi: "रफ़्तार किंग",
    icon: "⚡",
    desc: "Finish a quiz in record speed (< 6s/question)",
    descHi: "रिकॉर्ड गति में क्विज़ पूरी करें (< 6 सेकंड/प्रश्न)",
    req: 1,
    category: "fastCount"
  },
  {
    id: "questions_100",
    title: "Century Scholar",
    titleHi: "100 प्रश्न योद्धा",
    icon: "📚",
    desc: "Answer 100 total questions",
    descHi: "कुल 100 प्रश्नों के उत्तर दें",
    req: 100,
    category: "totalQuestions"
  },
  {
    id: "streak_3",
    title: "Streak Warrior",
    titleHi: "सतत अभ्यासी",
    icon: "🔥",
    desc: "Maintain a 3-day active quiz streak",
    descHi: "3 दिनों का सक्रिय क्विज़ स्ट्रैक बनाए रखें",
    req: 3,
    category: "streak"
  },
  {
    id: "categories_5",
    title: "Category Master",
    titleHi: "बहुमुखी विद्वान",
    icon: "🧠",
    desc: "Play quizzes across 5 different topics",
    descHi: "5 अलग-अलग विषयों पर क्विज़ खेलें",
    req: 5,
    category: "uniqueCategories"
  },
  {
    id: "voice_user",
    title: "Voice Master",
    titleHi: "वॉइस मास्टर",
    icon: "🎤",
    desc: "Use Voice Answer Mode to answer a question",
    descHi: "प्रश्न का उत्तर देने के लिए वॉइस मोड का उपयोग करें",
    req: 1,
    category: "voiceUsed"
  }
];

const BADGES_KEY = "user_unlocked_badges";
const STATS_KEY = "user_badge_stats";

export function getBadgeStats() {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STATS_KEY);
    return raw ? JSON.parse(raw) : {
      quizCount: 0,
      perfectCount: 0,
      fastCount: 0,
      totalQuestions: 0,
      streak: 0,
      uniqueCategories: [],
      voiceUsed: 0
    };
  } catch {
    return {};
  }
}

export function getUnlockedBadges() {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(BADGES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function updateBadgeStats(updates = {}) {
  if (typeof window === "undefined") return;
  try {
    const current = getBadgeStats();
    const nextStats = {
      ...current,
      quizCount: (current.quizCount || 0) + (updates.quizCount || 0),
      perfectCount: (current.perfectCount || 0) + (updates.perfectCount || 0),
      fastCount: (current.fastCount || 0) + (updates.fastCount || 0),
      totalQuestions: (current.totalQuestions || 0) + (updates.totalQuestions || 0),
      streak: Math.max(current.streak || 0, updates.streak || 0),
      voiceUsed: (current.voiceUsed || 0) + (updates.voiceUsed || 0),
    };

    if (updates.categoryId && !current.uniqueCategories?.includes(updates.categoryId)) {
      nextStats.uniqueCategories = [...(current.uniqueCategories || []), updates.categoryId];
    }

    localStorage.setItem(STATS_KEY, JSON.stringify(nextStats));
    checkAndGrantBadges(nextStats);
  } catch (e) {
    console.error("Error updating badge stats:", e);
  }
}

export function checkAndGrantBadges(stats = getBadgeStats()) {
  if (typeof window === "undefined") return;
  const currentlyUnlocked = new Set(getUnlockedBadges());
  const newlyUnlocked = [];

  BADGES.forEach((b) => {
    if (currentlyUnlocked.has(b.id)) return;

    let val = 0;
    if (b.category === "uniqueCategories") {
      val = stats.uniqueCategories?.length || 0;
    } else {
      val = stats[b.category] || 0;
    }

    if (val >= b.req) {
      currentlyUnlocked.add(b.id);
      newlyUnlocked.push(b);
    }
  });

  if (newlyUnlocked.length > 0) {
    localStorage.setItem(BADGES_KEY, JSON.stringify(Array.from(currentlyUnlocked)));
    newlyUnlocked.forEach((b) => {
      toast.success(
        `🏆 Achievement Unlocked: ${b.icon} ${b.title}!`,
        { duration: 4000, style: { background: "#1e1b4b", color: "#fbbf24", border: "1px solid #f59e0b" } }
      );
    });
  }
}
