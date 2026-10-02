"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Check,
  Search,
  X,
  Clock,
  Sliders,
  Layers,
  Shield,
  Zap,
  Flame,
  Loader2,
  BookOpen,
} from "lucide-react";
import { useQuiz } from "@/context/QuizContext";
import { useLanguage } from "@/context/LanguageContext";
import { useTier } from "@/context/TierContext";
import { useData } from "@/context/DataContext";
import toast from "react-hot-toast";
import { quizEngine } from "@/lib/quizEngine";

const STORAGE_KEY = "quizweb_arena_settings";

const ICON_EMOJI_FALLBACKS = {
  landmark: "🏛️",
  globe: "🌍",
  shield: "🛡️",
  "trending-up": "📈",
  trendingup: "📈",
  atom: "⚛️",
  newspaper: "📰",
  "map-pin": "📍",
  mappin: "📍",
  palette: "🎨",
  book: "📚",
  "book-open": "📖",
  calculator: "🔢",
  compass: "🧭",
  cpu: "💻",
  music: "🎵",
  film: "🎬",
  video: "🎬",
  award: "🏆",
  trophy: "🏆",
  zap: "⚡",
  star: "⭐",
  brain: "🧠",
  folder: "📁",
  scroll: "📜",
  scale: "⚖️",
  flag: "🚩",
  heart: "❤️",
  users: "👥",
  flame: "🔥",
  sparkles: "✨",
};

function renderSafeCategoryIcon(iconOrEmoji) {
  if (!iconOrEmoji || typeof iconOrEmoji !== "string") return "🎯";
  const trimmed = iconOrEmoji.trim();
  const lower = trimmed.toLowerCase();
  if (ICON_EMOJI_FALLBACKS[lower]) {
    return ICON_EMOJI_FALLBACKS[lower];
  }
  // If it's an english word / icon slug, avoid rendering raw text
  if (/^[a-zA-Z0-9_-]{2,}$/.test(trimmed)) {
    return "🎯";
  }
  return trimmed;
}

let cachedArenaMeta = null;

export default function ArenaClient({ initialSelectedCategoryIds = null, embedded = false }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { startMixedQuiz } = useQuiz();
  const { isHindi } = useLanguage();
  const { tier } = useTier();
  const { quizzes } = useData();

  const topicParam = searchParams?.get("topic");
  const catParam = searchParams?.get("category");
  const subjectParam = searchParams?.get("subject");

  // 2-Step Flow: Step 1 (Categories) | Step 2 (Setup)
  const [currentStep, setCurrentStep] = useState(() => {
    if (initialSelectedCategoryIds && initialSelectedCategoryIds.length > 0) return 2;
    if (topicParam || catParam || subjectParam) return 2;
    return 1;
  });

  // Audience context
  const urlAudience =
    searchParams?.get("audience") ||
    (tier === "kids" ? "kids" : tier === "students" ? "students" : "all");

  // Metadata & categories state (instant from cache if available)
  const [meta, setMeta] = useState(() => cachedArenaMeta);
  const [loadingMeta, setLoadingMeta] = useState(() => !cachedArenaMeta);
  const [isStarting, setIsStarting] = useState(false);

  // Step 1: Category selection state
  const [catSearch, setCatSearch] = useState("");
  const [selectedCats, setSelectedCats] = useState(() => {
    if (initialSelectedCategoryIds && initialSelectedCategoryIds.length > 0) {
      return initialSelectedCategoryIds;
    }
    const preIds = [topicParam, catParam, subjectParam].filter(Boolean);
    return preIds.length > 0 ? preIds : [];
  });

  // Step 2: Single-screen quiz setup state
  const [difficulty, setDifficulty] = useState("all"); // 'all' | 'easy' | 'medium' | 'hard'
  const [questionCount, setQuestionCount] = useState(20); // 10 | 20 | 30 | 50
  const [timerSeconds, setTimerSeconds] = useState(20); // 0 (off) | 10 | 20 | 30

  // 1. Fetch metadata on mount
  useEffect(() => {
    async function loadMeta() {
      try {
        const res = await fetch("/api/arena/meta");
        if (!res.ok) throw new Error("Failed to load metadata");
        const data = await res.json();
        cachedArenaMeta = data;
        setMeta(data);

        // Pre-filter takes precedence
        if (initialSelectedCategoryIds && initialSelectedCategoryIds.length > 0) {
          setSelectedCats(initialSelectedCategoryIds);
          return;
        }

        const preIds = [topicParam, catParam, subjectParam].filter(Boolean);
        if (preIds.length > 0) {
          setSelectedCats(preIds);
          return;
        }

        // Load saved preferences if available
        let saved = null;
        try {
          const raw = localStorage.getItem(STORAGE_KEY);
          if (raw) saved = JSON.parse(raw);
        } catch {}

        if (saved && !searchParams?.get("audience")) {
          if (Array.isArray(saved.selectedCats) && saved.selectedCats.length > 0) {
            setSelectedCats(saved.selectedCats);
          }
          if (saved.difficulty) setDifficulty(saved.difficulty);
          if (saved.questionCount) setQuestionCount(saved.questionCount);
          if (typeof saved.timerSeconds === "number") setTimerSeconds(saved.timerSeconds);
        } else {
          // Pre-select categories matching audience
          const relevant = (data.categories || []).filter((c) => {
            if (urlAudience === "kids")
              return Array.isArray(c.audience) ? c.audience.includes("kids") : c.audience === "kids";
            if (urlAudience === "students")
              return Array.isArray(c.audience) ? c.audience.includes("students") : true;
            return true;
          });
          setSelectedCats(relevant.map((c) => c.id));
        }
      } catch (err) {
        console.error("Meta load error:", err);
      } finally {
        setLoadingMeta(false);
      }
    }
    loadMeta();
  }, [searchParams, urlAudience, initialSelectedCategoryIds, topicParam, catParam, subjectParam]);

  // 2. Persist preferences
  useEffect(() => {
    if (loadingMeta) return;
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          selectedCats,
          difficulty,
          questionCount,
          timerSeconds,
        })
      );
    } catch {}
  }, [selectedCats, difficulty, questionCount, timerSeconds, loadingMeta]);

  // Category helpers: robust union between API meta categories and DataContext quizzes
  const allCategories = useMemo(() => {
    const map = new Map();
    // 1. Seed from DataContext quizzes (instant client availability)
    if (Array.isArray(quizzes)) {
      quizzes.forEach((q) => {
        const id = q.id || q._id;
        if (!id) return;
        map.set(id, {
          id,
          name: q.topic || q.name || "General",
          nameHi: q.topicHi || q.topic || "सामान्य",
          emoji: q.emoji || "🎯",
          slug: q.slug || id,
          audience: q.audience || "all",
          count: q._count?.questions || q.questions?.length || 20,
          questionCount: q._count?.questions || q.questions?.length || 20,
        });
      });
    }
    // 2. Merge with meta.categories
    const metaList = meta?.categories || [];
    metaList.forEach((c) => {
      const existing = map.get(c.id) || {};
      map.set(c.id, {
        ...existing,
        ...c,
        emoji: c.emoji && c.emoji !== "🎯" ? c.emoji : (existing.emoji || c.emoji || "🎯"),
        nameHi: c.nameHi && c.nameHi !== c.name ? c.nameHi : (existing.nameHi || c.nameHi || c.name),
        count: c.questionCount || c.count || existing.count || 20,
        questionCount: c.questionCount || c.count || existing.count || 20,
        group: c.group || existing.group || null,
        isGkTopic: Boolean(c.isGkTopic || existing.isGkTopic),
      });
    });
    return Array.from(map.values());
  }, [meta, quizzes]);

  const filteredCategories = useMemo(() => {
    if (!catSearch.trim()) return allCategories;
    const query = catSearch.toLowerCase().trim();
    return allCategories.filter((c) => {
      const nameEn = (c.name || c.topic || "").toLowerCase();
      const nameHi = (c.nameHi || c.topicHi || "").toLowerCase();
      const slug = (c.slug || "").toLowerCase();
      return nameEn.includes(query) || nameHi.includes(query) || slug.includes(query);
    });
  }, [allCategories, catSearch]);

  const groupedCategorySections = useMemo(() => {
    const indiaGk = filteredCategories.filter((c) => c.group === "India GK");
    const worldGk = filteredCategories.filter((c) => c.group === "World GK");
    const general = filteredCategories.filter((c) => !c.group);

    const sections = [];
    if (indiaGk.length > 0) {
      sections.push({
        id: "india-gk",
        title: isHindi ? "🏛️ भारत सामान्य ज्ञान (India GK)" : "🏛️ India GK Topics",
        items: indiaGk,
      });
    }
    if (worldGk.length > 0) {
      sections.push({
        id: "world-gk",
        title: isHindi ? "🌍 विश्व सामान्य ज्ञान (World GK)" : "🌍 World GK Topics",
        items: worldGk,
      });
    }
    if (general.length > 0) {
      sections.push({
        id: "general",
        title: isHindi ? "🎯 सामान्य व परीक्षा श्रेणियां" : "🎯 General Categories",
        items: general,
      });
    }
    return sections;
  }, [filteredCategories, isHindi]);

  const totalAvailableQuestions = useMemo(() => {
    if (selectedCats.length === 0) return 0;
    return allCategories
      .filter((c) => selectedCats.includes(c.id))
      .reduce((acc, c) => acc + (c.count ?? c.questionCount ?? 20), 0);
  }, [allCategories, selectedCats]);

  const toggleCategory = (catId) => {
    setSelectedCats((prev) =>
      prev.includes(catId) ? prev.filter((id) => id !== catId) : [...prev, catId]
    );
  };

  const handleSelectAll = () => {
    setSelectedCats(allCategories.map((c) => c.id));
  };

  const handleClearAll = () => {
    setSelectedCats([]);
  };

  // Step 1 -> Step 2 validation
  const handleProceedToSetup = () => {
    if (selectedCats.length === 0) {
      toast.error(
        isHindi ? "कृपया कम से कम एक श्रेणी चुनें" : "Select at least one category to proceed"
      );
      return;
    }
    setCurrentStep(2);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleBackToCategories = () => {
    setCurrentStep(1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Launch Quiz from Step 2
  const handleStartQuiz = async () => {
    if (isStarting) return;
    if (selectedCats.length === 0) {
      toast.error(isHindi ? "पहले श्रेणी चुनें" : "Select categories first");
      setCurrentStep(1);
      return;
    }

    setIsStarting(true);
    try {
      let quizQuestions = [];

      try {
        const result = await quizEngine.buildQuiz({
          categories: selectedCats,
          difficulty,
          count: questionCount,
          timer: timerSeconds,
          audience: urlAudience,
          language: isHindi ? "hi" : "en",
        });
        if (result && Array.isArray(result.questions)) {
          quizQuestions = result.questions;
        }
      } catch (apiErr) {
        console.warn("Quiz build API failed, attempting in-memory fallback:", apiErr);
      }

      // In-memory fallback if API returned 0 questions
      if (quizQuestions.length === 0 && Array.isArray(quizzes)) {
        const fallbackPool = [];
        quizzes
          .filter((q) => selectedCats.includes(q.id || q._id))
          .forEach((q) => {
            if (Array.isArray(q.questions) && q.questions.length > 0) {
              fallbackPool.push(...q.questions);
            }
          });
        if (fallbackPool.length > 0) {
          quizQuestions = fallbackPool.slice(0, questionCount);
        }
      }

      if (quizQuestions.length === 0) {
        toast.error(
          isHindi
            ? "चयनित श्रेणियों में कोई प्रश्न नहीं मिला। कृपया अन्य श्रेणी चुनें।"
            : "No questions match your current settings. Please choose other categories."
        );
        setIsStarting(false);
        return;
      }

      // Configure QuizContext
      const title = isHindi ? "क्विज़ एरीना" : "Quiz Arena";
      startMixedQuiz(
        quizQuestions,
        title,
        timerSeconds,
        difficulty.toUpperCase(),
        isHindi ? "hi" : "en"
      );

      router.push("/quiz/arena");
    } catch (err) {
      console.error("Quiz launch error:", err);
      toast.error(
        isHindi ? "क्विज़ शुरू करने में त्रुटि आई" : err.message || "Failed to start quiz"
      );
      setIsStarting(false);
    }
  };

  if (loadingMeta && allCategories.length === 0) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center select-none">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-3" />
        <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
          {isHindi ? "क्विज़ एरीना लोड हो रहा है..." : "Loading Quiz Arena..."}
        </p>
      </div>
    );
  }

  // Live summary format: "20 questions · Medium · 20 s each · 3 categories"
  const diffLabel =
    difficulty === "easy"
      ? (isHindi ? "सरल" : "Easy")
      : difficulty === "medium"
      ? (isHindi ? "मध्यम" : "Medium")
      : difficulty === "hard"
      ? (isHindi ? "कठिन" : "Hard")
      : (isHindi ? "सभी मिक्स" : "All Mix");

  const timerLabel =
    timerSeconds === 0
      ? (isHindi ? "टाइमर बंद" : "No Timer")
      : `${timerSeconds}s ${isHindi ? "प्रति प्रश्न" : "each"}`;

  const summaryText = `${Math.min(questionCount, totalAvailableQuestions || questionCount)} ${
    isHindi ? "प्रश्न" : "questions"
  } · ${diffLabel} · ${timerLabel} · ${selectedCats.length} ${
    isHindi ? "श्रेणियां" : "categories"
  }`;

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-4 sm:py-6 pb-36 text-slate-900 dark:text-slate-100 select-none">
      <AnimatePresence mode="wait">
        {/* ══════════════════════════════════════════════════════════════
            STEP 1: CHOOSE CATEGORIES (Full Screen Sheet / Card)
        ══════════════════════════════════════════════════════════════ */}
        {currentStep === 1 && (
          <motion.div
            key="step-1"
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 16 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col"
          >
            {/* Header: Title + Close Button */}
            <div className="flex items-center justify-between gap-3 mb-4">
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                  <span>⚡</span>
                  <span>{isHindi ? "श्रेणियां चुनें" : "Choose Categories"}</span>
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                  {isHindi
                    ? "जिन विषयों का अभ्यास करना चाहते हैं, उन्हें चुनें (Step 1/2)"
                    : "Select topics you want to include in your quiz (Step 1 of 2)"}
                </p>
              </div>

              <button
                type="button"
                onClick={() => router.push("/")}
                className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-800 dark:text-slate-300 flex items-center justify-center transition-colors shrink-0"
                title={isHindi ? "बंद करें" : "Close"}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            {/* Pinned Search Bar */}
            <div className="sticky top-2 z-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md pt-1 pb-3">
              <div className="relative w-full">
                <Search
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                />
                <input
                  type="text"
                  value={catSearch}
                  onChange={(e) => setCatSearch(e.target.value)}
                  placeholder={
                    isHindi
                      ? "श्रेणी खोजें (विज्ञान, इतिहास, भूगोल...)"
                      : "Search categories (Science, History, Tech...)"
                  }
                  className="w-full pl-10 pr-9 py-2.5 rounded-2xl bg-slate-100/90 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700 text-xs sm:text-sm font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                />
                {catSearch && (
                  <button
                    type="button"
                    onClick={() => setCatSearch("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    aria-label="Clear search"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Quick Actions Bar */}
              <div className="flex items-center justify-between gap-2 mt-2.5 px-0.5">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                  {selectedCats.length} / {allCategories.length}{" "}
                  {isHindi ? "श्रेणियां चयनित" : "selected"}
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    className="px-2.5 py-1 rounded-lg text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950 transition-colors"
                  >
                    {isHindi ? "सभी चुनें" : "Select all"}
                  </button>
                  <span className="text-slate-300 dark:text-slate-700">·</span>
                  <button
                    type="button"
                    onClick={handleClearAll}
                    disabled={selectedCats.length === 0}
                    className="px-2.5 py-1 rounded-lg text-xs font-bold text-slate-500 hover:text-rose-600 disabled:opacity-40 transition-colors"
                  >
                    {isHindi ? "साफ़ करें" : "Clear"}
                  </button>
                </div>
              </div>
            </div>

            {/* Grouped Category Sections (including India GK & World GK - Phase 5B.3) */}
            <div className="space-y-6 mt-1">
              {groupedCategorySections.map((sec) => (
                <div key={sec.id} className="space-y-2.5">
                  <div className="flex items-center justify-between px-1">
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      {sec.title}
                    </h3>
                    <span className="text-[10px] font-bold text-slate-400">
                      {sec.items.length} {isHindi ? "विषय" : "categories"}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3">
                    {sec.items.map((cat) => {
                      const isSelected = selectedCats.includes(cat.id);
                      const title = isHindi && cat.nameHi ? cat.nameHi : cat.name || cat.topic;
                      const count = cat.count ?? cat.questionCount ?? 20;

                      return (
                        <motion.div
                          key={cat.id}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => toggleCategory(cat.id)}
                          className={`relative p-3.5 sm:p-4 rounded-2xl cursor-pointer transition-all duration-150 flex flex-col justify-between min-h-[96px] overflow-hidden ${
                            isSelected
                              ? "bg-indigo-50/90 dark:bg-indigo-950/50 border-2 border-indigo-600 shadow-sm shadow-indigo-500/10 ring-2 ring-indigo-500/20"
                              : "bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-2xs"
                          }`}
                        >
                          {/* Top Row: Icon + Checkbox Badge */}
                          <div className="flex items-center justify-between gap-1.5 mb-2">
                            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-100 to-violet-100 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center text-lg shrink-0 overflow-hidden leading-none select-none">
                              {renderSafeCategoryIcon(cat.emoji || cat.icon)}
                            </div>

                            <div
                              className={`w-5 h-5 rounded-md flex items-center justify-center transition-all ${
                                isSelected
                                  ? "bg-indigo-600 text-white"
                                  : "border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                              }`}
                            >
                              {isSelected && <Check size={13} strokeWidth={3} />}
                            </div>
                          </div>

                          {/* Category Title + Question Count Badge */}
                          <div>
                            <h3
                              title={title}
                              className={`text-xs sm:text-sm font-black leading-snug line-clamp-1 ${
                                isSelected
                                  ? "text-indigo-950 dark:text-indigo-100"
                                  : "text-slate-800 dark:text-slate-200"
                              }`}
                            >
                              {title}
                            </h3>
                            <span className="text-[10.5px] font-bold text-slate-500 dark:text-slate-400 mt-0.5 block">
                              {count} {isHindi ? "प्रश्न" : "Qs"}
                            </span>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Sticky Bottom Bar for Step 1 */}
            <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 shadow-[0_-4px_24px_rgba(0,0,0,0.12)] p-3 sm:p-4 pb-[calc(14px+env(safe-area-inset-bottom,0px))]">
              <div className="w-full max-w-2xl mx-auto flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-xs sm:text-sm font-black text-slate-900 dark:text-white truncate">
                    {selectedCats.length} {isHindi ? "श्रेणियां चुनी गईं" : "categories selected"}
                  </div>
                  <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate">
                    {totalAvailableQuestions} {isHindi ? "प्रश्न उपलब्ध" : "questions available"}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleProceedToSetup}
                  disabled={selectedCats.length === 0}
                  className="px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs sm:text-sm shadow-md shadow-indigo-500/25 flex items-center gap-2 transition-all active:scale-95 shrink-0"
                >
                  <span>{isHindi ? "आगे सेटअप करें" : "Next: Set Up"}</span>
                  <ArrowRight size={15} />
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* ══════════════════════════════════════════════════════════════
            STEP 2: SET UP THE QUIZ (Single Screen, Zero Clutter)
        ══════════════════════════════════════════════════════════════ */}
        {currentStep === 2 && (
          <motion.div
            key="step-2"
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col space-y-6"
          >
            {/* Header: Back Button + Title */}
            <div className="flex items-center justify-between gap-3 pb-2 border-b border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={handleBackToCategories}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 transition-colors"
              >
                <ArrowLeft size={14} />
                <span>{isHindi ? "श्रेणियां बदलें" : "Categories"}</span>
              </button>

              <div className="text-center">
                <h1 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
                  {isHindi ? "क्विज़ सेटअप" : "Quiz Setup"}
                </h1>
                <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                  Step 2 of 2
                </span>
              </div>

              <button
                type="button"
                onClick={() => router.push("/")}
                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-800 dark:text-slate-300 flex items-center justify-center transition-colors"
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>

            {/* 1. DIFFICULTY (Segmented Control matching Section 0 Tokens) */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-4 sm:p-5 shadow-sm">
              <label className="text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-1.5 mb-3">
                <Sliders size={14} className="text-indigo-600" />
                <span>{isHindi ? "1. कठिनाई स्तर चुनें" : "1. Choose Difficulty"}</span>
              </label>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl">
                {[
                  {
                    id: "all",
                    label: isHindi ? "मिक्स" : "Mix",
                    activeStyle: "bg-white text-indigo-700 dark:bg-slate-900 dark:text-indigo-300 shadow-sm border border-indigo-200",
                  },
                  {
                    id: "easy",
                    label: isHindi ? "सरल" : "Easy",
                    activeStyle: "bg-[#DCFCE7] text-[#16A34A] border border-[#86EFAC] shadow-sm",
                  },
                  {
                    id: "medium",
                    label: isHindi ? "मध्यम" : "Medium",
                    activeStyle: "bg-[#FEF3C7] text-[#D97706] border border-[#FDE68A] shadow-sm",
                  },
                  {
                    id: "hard",
                    label: isHindi ? "कठिन" : "Hard",
                    activeStyle: "bg-[#FEE2E2] text-[#DC2626] border border-[#FCA5A5] shadow-sm",
                  },
                  {
                    id: "expert",
                    label: isHindi ? "विशेषज्ञ" : "Expert",
                    activeStyle: "bg-[#EDE9FE] text-[#7C3AED] border border-[#C4B5FD] shadow-sm",
                  },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setDifficulty(item.id)}
                    className={`py-2.5 px-1 rounded-xl text-xs font-bold transition-all text-center ${
                      difficulty === item.id
                        ? item.activeStyle
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 2. NUMBER OF QUESTIONS (Chips: 10 · 20 · 30 · 50) */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-4 sm:p-5 shadow-sm">
              <div className="flex items-center justify-between gap-2 mb-3">
                <label className="text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                  <BookOpen size={14} className="text-indigo-600" />
                  <span>{isHindi ? "2. प्रश्नों की संख्या" : "2. Number of Questions"}</span>
                </label>
                <span className="text-[11px] font-bold text-slate-500">
                  {totalAvailableQuestions} {isHindi ? "उपलब्ध" : "available"}
                </span>
              </div>

              <div className="grid grid-cols-4 gap-2">
                {[10, 20, 30, 50].map((num) => {
                  const isSelected = questionCount === num;
                  const isOverPool = totalAvailableQuestions > 0 && num > totalAvailableQuestions;

                  return (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setQuestionCount(num)}
                      className={`py-3 px-2 rounded-2xl text-xs sm:text-sm font-black transition-all flex flex-col items-center justify-center gap-0.5 ${
                        isSelected
                          ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/25 ring-2 ring-indigo-500/20"
                          : "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
                      }`}
                    >
                      <span>{num}</span>
                      <span className="text-[9.5px] font-semibold opacity-80">
                        {isHindi ? "प्रश्न" : "Qs"}
                      </span>
                    </button>
                  );
                })}
              </div>

              {totalAvailableQuestions > 0 && questionCount > totalAvailableQuestions && (
                <p className="text-[11px] font-bold text-amber-600 dark:text-amber-400 mt-2.5">
                  ⚠️ {isHindi
                    ? `चयनित श्रेणियों में केवल ${totalAvailableQuestions} प्रश्न हैं। सभी उपलब्ध प्रश्न शामिल किए जाएंगे।`
                    : `Only ${totalAvailableQuestions} questions are available in the selected categories. All will be included.`}
                </p>
              )}
            </div>

            {/* 3. TIMER (Chips: Off · 10s · 20s · 30s) */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-4 sm:p-5 shadow-sm">
              <label className="text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-1.5 mb-3">
                <Clock size={14} className="text-indigo-600" />
                <span>{isHindi ? "3. प्रति प्रश्न टाइमर" : "3. Timer Per Question"}</span>
              </label>

              <div className="grid grid-cols-4 gap-2">
                {[
                  { seconds: 0, label: isHindi ? "बंद" : "Off", sub: isHindi ? "आराम से" : "Untimed" },
                  { seconds: 10, label: "10s", sub: isHindi ? "तेज़" : "Fast" },
                  { seconds: 20, label: "20s", sub: isHindi ? "मानक" : "Standard" },
                  { seconds: 30, label: "30s", sub: isHindi ? "विस्तृत" : "Relaxed" },
                ].map((item) => {
                  const isSelected = timerSeconds === item.seconds;

                  return (
                    <button
                      key={item.seconds}
                      type="button"
                      onClick={() => setTimerSeconds(item.seconds)}
                      className={`py-3 px-2 rounded-2xl text-xs sm:text-sm font-black transition-all flex flex-col items-center justify-center gap-0.5 ${
                        isSelected
                          ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/25 ring-2 ring-indigo-500/20"
                          : "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
                      }`}
                    >
                      <span>{item.label}</span>
                      <span className="text-[9.5px] font-semibold opacity-80">{item.sub}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 4. LIVE SUMMARY LINE */}
            <div className="p-3.5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60 text-center">
              <span className="text-xs font-bold text-indigo-950 dark:text-indigo-200 tracking-tight">
                ⚡ {summaryText}
              </span>
            </div>

            {/* Sticky Bottom Bar for Step 2 */}
            <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 shadow-[0_-4px_24px_rgba(0,0,0,0.12)] p-3 sm:p-4 pb-[calc(14px+env(safe-area-inset-bottom,0px))]">
              <div className="w-full max-w-2xl mx-auto flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleBackToCategories}
                  className="py-3 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs sm:text-sm flex items-center gap-1.5 transition-all shrink-0"
                >
                  <ArrowLeft size={15} />
                  <span>{isHindi ? "पीछे" : "Back"}</span>
                </button>

                <button
                  type="button"
                  onClick={handleStartQuiz}
                  disabled={isStarting}
                  className="flex-1 py-3 px-5 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-black text-xs sm:text-sm shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-60"
                >
                  {isStarting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>{isHindi ? "क्विज़ तैयार हो रहा है..." : "Building Quiz..."}</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={16} className="fill-white" />
                      <span>{isHindi ? "क्विज़ शुरू करें" : "Start Quiz"}</span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
