"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Sparkles,
  ArrowRight,
  Check,
  Search,
  Clock,
  Layers,
  Zap,
  Loader2,
  BookOpen,
} from "lucide-react";
import { useQuiz } from "@/context/QuizContext";
import { useLanguage } from "@/context/LanguageContext";
import { useTier } from "@/context/TierContext";
import { useData } from "@/context/DataContext";
import toast from "react-hot-toast";
import { quizEngine } from "@/lib/quizEngine";
import { MAIN_CATEGORIES } from "@/lib/mainCategoriesConfig";

const STORAGE_KEY = "quizweb_gk_engine_settings";

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

  // Metadata & categories state
  const [meta, setMeta] = useState(() => cachedArenaMeta);
  const [loadingMeta, setLoadingMeta] = useState(() => !cachedArenaMeta);
  const [isStarting, setIsStarting] = useState(false);

  // 1. Categories Selection State (Pre-select India GK if nothing chosen)
  const [catSearch, setCatSearch] = useState("");
  const [selectedCats, setSelectedCats] = useState(() => {
    if (initialSelectedCategoryIds && initialSelectedCategoryIds.length > 0) {
      return initialSelectedCategoryIds;
    }
    const preIds = [topicParam, catParam, subjectParam].filter(Boolean);
    if (preIds.length > 0) return preIds;
    return ["india-gk"];
  });

  const { data: authSession } = useSession();

  // 2. Question Difficulty: 'all' | 'easy' | 'medium' | 'hard'
  const [difficulty, setDifficulty] = useState("all");

  // 3. Optional Timer: 0 (No timer) | 15 | 20 | 30 seconds
  const [timerSeconds, setTimerSeconds] = useState(20);

  // 4. Optional Question Count: 10 | 20 | 30 | 50
  const [questionCount, setQuestionCount] = useState(20);

  // Load metadata on mount
  useEffect(() => {
    async function loadMeta() {
      try {
        const res = await fetch("/api/arena/meta");
        if (!res.ok) throw new Error("Failed to load metadata");
        const data = await res.json();
        cachedArenaMeta = data;
        setMeta(data);

        // Load saved preferences if available
        let saved = null;
        try {
          const raw = localStorage.getItem(STORAGE_KEY);
          if (raw) saved = JSON.parse(raw);
        } catch {}

        if (saved && !topicParam && !catParam && !subjectParam && !initialSelectedCategoryIds) {
          if (Array.isArray(saved.selectedCats) && saved.selectedCats.length > 0) {
            setSelectedCats(saved.selectedCats);
          }
          if (saved.difficulty) setDifficulty(saved.difficulty);
          if (saved.questionCount) setQuestionCount(saved.questionCount);
          if (saved.timerSeconds !== undefined) setTimerSeconds(saved.timerSeconds);
        }
      } catch (err) {
        console.warn("Arena meta fetch fallback:", err);
      } finally {
        setLoadingMeta(false);
      }
    }
    loadMeta();
  }, [topicParam, catParam, subjectParam, initialSelectedCategoryIds]);

  // Save preferences
  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ selectedCats, difficulty, questionCount, timerSeconds })
      );
    } catch {}
  }, [selectedCats, difficulty, questionCount, timerSeconds]);

  // Combine canonical taxonomy with DB & meta counts
  const availableCategories = useMemo(() => {
    const dbMap = new Map();
    if (Array.isArray(quizzes)) {
      quizzes.forEach((q) => {
        const key = (q.slug || q.id || "").toLowerCase();
        dbMap.set(key, q);
      });
    }

    const list = MAIN_CATEGORIES.map((cat) => {
      const slugKey = cat.slug.toLowerCase();
      const dbMatch = dbMap.get(slugKey) || (meta?.categories || []).find((c) => (c.slug || c.id)?.toLowerCase() === slugKey);

      let count = 0;
      if (dbMatch) {
        if (typeof dbMatch.questionCount === "number") count = dbMatch.questionCount;
        else if (Array.isArray(dbMatch.questions)) count = dbMatch.questions.length;
        else if (typeof dbMatch.count === "number") count = dbMatch.count;
      }

      // If category has questions in DB or quizzes, hasData is true
      const hasData = count > 0;

      return {
        id: dbMatch?.id || cat.slug,
        slug: cat.slug,
        name: cat.name,
        nameHi: cat.nameHi,
        icon: cat.icon,
        example: cat.example,
        count: count,
        hasData: hasData,
      };
    });

    // Requirement 1 & 5: Sort categories with data FIRST, upcoming categories at last
    return list.sort((a, b) => {
      if (a.hasData && !b.hasData) return -1;
      if (!a.hasData && b.hasData) return 1;
      return (b.count || 0) - (a.count || 0);
    });
  }, [quizzes, meta]);

  // Filtered categories by search
  const filteredCategories = useMemo(() => {
    if (!catSearch.trim()) return availableCategories;
    const q = catSearch.toLowerCase().trim();
    return availableCategories.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.nameHi.toLowerCase().includes(q) ||
        c.slug.toLowerCase().includes(q)
    );
  }, [availableCategories, catSearch]);

  const toggleCategory = (id) => {
    setSelectedCats((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    setSelectedCats(availableCategories.filter((c) => c.hasData).map((c) => c.id));
  };

  const handleClearAll = () => {
    setSelectedCats([]);
  };

  // Launch GK Engine Quiz
  const handleStartQuiz = async () => {
    if (isStarting) return;
    if (selectedCats.length === 0) {
      toast.error(isHindi ? "कृपया कम से कम एक श्रेणी चुनें" : "Select at least one category");
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
          audience: "all",
          language: isHindi ? "hi" : "en",
          onlyWrong: false,
          skipCorrect: false,
          style: "practice",
          userId: authSession?.user?.id || authSession?.user?.email || "guest",
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
          .filter((q) => selectedCats.includes(q.id || q._id || q.slug))
          .forEach((q) => {
            if (Array.isArray(q.questions) && q.questions.length > 0) {
              fallbackPool.push(
                ...q.questions.map((quest) => ({
                  ...quest,
                  category: quest.category || q.slug || q.id,
                  categoryName: quest.categoryName || q.name || q.topic || q.title,
                  categoryNameHi: quest.categoryNameHi || q.nameHi || q.topicHi || q.titleHi,
                }))
              );
            }
          });
        if (fallbackPool.length > 0) {
          quizQuestions = fallbackPool.slice(0, questionCount);
        }
      }

      if (quizQuestions.length === 0) {
        toast.error(
          isHindi
            ? "चयनित श्रेणी में प्रश्न लोड नहीं हो सके। कृपया अन्य श्रेणी चुनें।"
            : "No questions found for the selected category. Please choose another."
        );
        setIsStarting(false);
        return;
      }

      // Configure QuizContext for continuous test
      const title = isHindi ? "GK टेस्ट इंजन" : "GK Test Engine";
      startMixedQuiz(
        quizQuestions,
        title,
        timerSeconds,
        difficulty.toUpperCase(),
        isHindi ? "hi" : "en",
        "practice"
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

  const diffLabels = {
    all: isHindi ? "सभी स्तर" : "All Levels",
    easy: isHindi ? "सरल" : "Easy",
    medium: isHindi ? "मध्यम" : "Medium",
    hard: isHindi ? "कठिन" : "Hard",
  };

  const getTimerLabel = (sec) => {
    const s = Number(sec);
    if (!s || s === 0) return isHindi ? "बिना टाइमर" : "No Timer";
    return isHindi ? `${s} सेकंड` : `${s}s`;
  };

  const categoriesWithData = filteredCategories.filter((c) => c.hasData);
  const upcomingCategories = filteredCategories.filter((c) => !c.hasData);

  return (
    <div className="relative w-full min-h-screen bg-gradient-to-b from-[#EEF4FF] via-[#E2EDFF] to-[#D5E5FF] dark:from-[#080E1E] dark:via-[#0F1B38] dark:to-[#0A1226] text-slate-900 dark:text-slate-100 overflow-hidden transition-colors">
      
      {/* ── PEACEFUL UNIVERSE BACKGROUND (Globe, Stars, Ships, Clouds) ── */}
      <div className="absolute inset-0 pointer-events-none select-none overflow-hidden z-0">
        {/* Twinkling & Shining Stars */}
        <span className="absolute top-10 left-[8%] text-amber-400/80 text-xl animate-pulse" style={{ animationDuration: '2.5s' }}>✦</span>
        <span className="absolute top-24 right-[12%] text-indigo-400/80 text-2xl animate-pulse" style={{ animationDuration: '3.2s' }}>★</span>
        <span className="absolute top-60 left-[5%] text-amber-300/80 text-sm animate-pulse" style={{ animationDuration: '2.1s' }}>✨</span>
        <span className="absolute top-96 right-[7%] text-sky-400/80 text-lg animate-pulse" style={{ animationDuration: '4s' }}>✦</span>
        <span className="absolute top-[480px] left-[12%] text-indigo-300/70 text-xl animate-pulse" style={{ animationDuration: '3.6s' }}>★</span>
        <span className="absolute top-[720px] right-[10%] text-amber-400/80 text-base animate-pulse" style={{ animationDuration: '2.8s' }}>✨</span>
        <span className="absolute top-[920px] left-[7%] text-sky-300/70 text-lg animate-pulse" style={{ animationDuration: '3.9s' }}>✦</span>

        {/* Peaceful Floating Globe */}
        <div className="absolute top-14 right-[6%] text-4xl sm:text-5xl opacity-40 dark:opacity-30 animate-[bounce_8s_ease-in-out_infinite] filter drop-shadow-md">
          🌍
        </div>

        {/* Cosmic Ships / Exploration Vessels */}
        <div className="absolute top-72 left-[3%] text-3xl sm:text-4xl opacity-35 dark:opacity-30 animate-[pulse_6s_ease-in-out_infinite] filter drop-shadow-md">
          🚀
        </div>
        <div className="absolute top-[580px] right-[4%] text-3xl sm:text-4xl opacity-30 dark:opacity-25 animate-[bounce_10s_ease-in-out_infinite] filter drop-shadow-md">
          ⛵
        </div>

        {/* Soft Peaceful Translucent Clouds */}
        <div className="absolute top-36 left-[20%] text-4xl opacity-35 dark:opacity-15 animate-[pulse_7s_ease-in-out_infinite]">
          ☁️
        </div>
        <div className="absolute top-[420px] right-[22%] text-5xl opacity-30 dark:opacity-15 animate-[pulse_9s_ease-in-out_infinite]">
          ☁️
        </div>
      </div>

      {/* Main Content Container (relative z-10) */}
      <div className="relative z-10 w-full max-w-[960px] mx-auto px-3 sm:px-4 py-4 pb-28">
        {/* ── 1. HEADER ── */}
        <header className="mb-6 text-center sm:text-left">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/90 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 mb-2 border border-indigo-200/80 dark:border-indigo-800 shadow-xs">
            <Sparkles size={14} className="text-amber-500 fill-amber-500" />
            <span>{isHindi ? "स्मार्ट जीके टेस्ट इंजन" : "Smart GK Test Engine"}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {isHindi ? "GK टेस्ट इंजन" : "GK Test Engine"}
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1 max-w-xl font-medium">
            {isHindi
              ? "श्रेणी, कठिनाई और समय चुनें — और बिना रुके लगातार प्रश्नों का अभ्यास करें।"
              : "Select categories, difficulty & timer — start continuous testing effortlessly."}
          </p>
        </header>

        {/* ── 2. CATEGORY SELECTION DIALOGUE (White Card) ── */}
        <section className="mb-6 p-4 sm:p-5 rounded-3xl bg-white/95 dark:bg-slate-900/95 border border-blue-100/80 dark:border-slate-800 shadow-xl shadow-blue-900/5 backdrop-blur-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3.5">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <span>📚 1. {isHindi ? "श्रेणियां चुनें" : "Select Categories"}</span>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300">
                  {selectedCats.length} {isHindi ? "चयनित" : "selected"}
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {isHindi ? "उपलब्ध मुख्य विषय चुनें (कुल प्रश्न संख्या देखें):" : "Pick available subjects (showing question counts):"}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSelectAll}
                className="px-3 py-1 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
              >
                {isHindi ? "उपलब्ध सभी चुनें" : "Select All Active"}
              </button>
              <button
                type="button"
                onClick={handleClearAll}
                className="px-3 py-1 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
              >
                {isHindi ? "हटाएं" : "Clear"}
              </button>
            </div>
          </div>

          {/* Category Search Input */}
          <div className="relative mb-3.5">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={catSearch}
              onChange={(e) => setCatSearch(e.target.value)}
              placeholder={isHindi ? "श्रेणी खोजें..." : "Search categories..."}
              className="w-full pl-9 pr-4 py-2.5 text-xs sm:text-sm rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-slate-100"
            />
          </div>

          {/* 2x2 Tile Grid View */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 max-h-[380px] overflow-y-auto pr-1 no-scrollbar">
            {/* 1. Categories with Data First */}
            {categoriesWithData.map((cat) => {
              const isSelected = selectedCats.includes(cat.id);
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => toggleCategory(cat.id)}
                  className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all select-none active:scale-[0.97] min-h-[105px] sm:min-h-[115px] group cursor-pointer ${
                    isSelected
                      ? "bg-indigo-50/95 dark:bg-indigo-950/60 border-indigo-500 dark:border-indigo-500 shadow-md ring-2 ring-indigo-500/30"
                      : "bg-white dark:bg-slate-800/60 border-slate-200/90 dark:border-slate-700/80 hover:border-indigo-300 dark:hover:border-slate-600 hover:shadow-sm"
                  }`}
                >
                  {/* Top: Icon Thumbnail + Question Count Badge */}
                  <div className="flex items-center justify-between w-full mb-2">
                    <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xl shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                      {cat.icon || "🎯"}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-indigo-100/80 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200/70 dark:border-indigo-800/60 shadow-2xs">
                        {cat.count} {isHindi ? "प्रश्न" : "Q"}
                      </span>

                      {isSelected && (
                        <div className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                          <Check size={12} strokeWidth={3} />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Bottom: Name & Example */}
                  <div className="min-w-0 w-full">
                    <div className={`text-xs sm:text-sm font-extrabold truncate ${isSelected ? "text-indigo-900 dark:text-indigo-200" : "text-slate-800 dark:text-slate-100"}`}>
                      {isHindi ? cat.nameHi : cat.name}
                    </div>
                    <div className="text-[10px] text-slate-400 dark:text-slate-500 truncate mt-0.5">
                      {cat.example}
                    </div>
                  </div>
                </button>
              );
            })}

            {/* 2. Upcoming Categories at Last */}
            {upcomingCategories.length > 0 && (
              <>
                <div className="col-span-2 sm:col-span-3 md:col-span-4 mt-2 pt-3 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
                  <div className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <span>🚀</span>
                    <span>{isHindi ? "आगामी विषय (जल्द आ रहे हैं):" : "Upcoming Categories (Coming Soon):"}</span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200/70 dark:border-amber-800/60">
                    {upcomingCategories.length} {isHindi ? "विषय" : "topics"}
                  </span>
                </div>

                {upcomingCategories.map((cat) => {
                  const isSelected = selectedCats.includes(cat.id);
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => toggleCategory(cat.id)}
                      className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all select-none active:scale-[0.97] min-h-[105px] opacity-80 hover:opacity-100 cursor-pointer ${
                        isSelected
                          ? "bg-amber-50/80 dark:bg-amber-950/40 border-amber-500 ring-2 ring-amber-500/30"
                          : "bg-slate-50/70 dark:bg-slate-800/40 border-slate-200/70 dark:border-slate-800 hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-center justify-between w-full mb-2">
                        <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-lg shrink-0">
                          {cat.icon || "🎯"}
                        </div>
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100/70 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/60">
                          {isHindi ? "जल्द" : "Soon"}
                        </span>
                      </div>
                      <div className="min-w-0 w-full">
                        <div className="text-xs sm:text-sm font-bold truncate text-slate-700 dark:text-slate-300">
                          {isHindi ? cat.nameHi : cat.name}
                        </div>
                        <div className="text-[10px] text-slate-400 dark:text-slate-500 truncate mt-0.5">
                          {cat.example}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </>
            )}
          </div>
        </section>

      {/* ── 3. CONTROLS GRID: DIFFICULTY, TIMER, COUNT ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Difficulty */}
        <section className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <h2 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                <Layers size={16} className="text-indigo-500" />
                <span>2. {isHindi ? "कठिनाई स्तर" : "Difficulty"}</span>
              </h2>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/80">
                {diffLabels[difficulty]}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {["all", "easy", "medium", "hard"].map((level) => {
                const active = difficulty === level;
                return (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setDifficulty(level)}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all text-center ${
                      active
                        ? "bg-indigo-600 text-white shadow-sm"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                    }`}
                  >
                    {diffLabels[level]}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800/80 text-[11px] text-slate-400 dark:text-slate-500">
            {isHindi ? "सभी स्तरों के मिश्रित या विशिष्ट प्रश्न" : "Mixed or specific question levels"}
          </div>
        </section>

        {/* Timer */}
        <section className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <h2 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                <Clock size={16} className="text-indigo-500" />
                <span>3. {isHindi ? "टाइमर (वैकल्पिक)" : "Timer (Optional)"}</span>
              </h2>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/80">
                {getTimerLabel(timerSeconds)}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 mb-3">
              {[0, 15, 20, 30].map((sec) => {
                const active = timerSeconds === sec;
                return (
                  <button
                    key={sec}
                    type="button"
                    onClick={() => setTimerSeconds(sec)}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all text-center ${
                      active
                        ? "bg-indigo-600 text-white shadow-sm"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                    }`}
                  >
                    {sec === 0 ? (isHindi ? "बिना टाइमर" : "No Timer") : `${sec} ${isHindi ? "सेकंड" : "s"}`}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Slider & Custom Input */}
          <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800/80">
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                {isHindi ? "स्लाइडर या कस्टम सेकंड:" : "Slider / Custom sec:"}
              </span>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min="0"
                  max="120"
                  value={timerSeconds}
                  onChange={(e) => {
                    const v = e.target.value === "" ? 0 : parseInt(e.target.value, 10);
                    if (!isNaN(v)) {
                      setTimerSeconds(Math.max(0, Math.min(120, v)));
                    }
                  }}
                  className="w-14 px-1.5 py-0.5 text-xs font-bold text-center rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-slate-100"
                />
                <span className="text-[10px] font-semibold text-slate-400">
                  {isHindi ? "सेकंड" : "s"}
                </span>
              </div>
            </div>

            <input
              type="range"
              min="0"
              max="60"
              step="1"
              value={Math.min(60, timerSeconds)}
              onChange={(e) => setTimerSeconds(parseInt(e.target.value, 10) || 0)}
              className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-medium">
              <span>{isHindi ? "0 (बंद)" : "0 (Off)"}</span>
              <span>15s</span>
              <span>30s</span>
              <span>60s</span>
            </div>
          </div>
        </section>

        {/* Question Count */}
        <section className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <h2 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                <Zap size={16} className="text-indigo-500" />
                <span>4. {isHindi ? "प्रश्न संख्या" : "Question Count"}</span>
              </h2>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/80">
                {questionCount} {isHindi ? "प्रश्न" : "Ques"}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 mb-3">
              {[10, 20, 30, 50].map((cnt) => {
                const active = questionCount === cnt;
                return (
                  <button
                    key={cnt}
                    type="button"
                    onClick={() => setQuestionCount(cnt)}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all text-center ${
                      active
                        ? "bg-indigo-600 text-white shadow-sm"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                    }`}
                  >
                    {cnt} {isHindi ? "प्रश्न" : "Questions"}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Slider & Custom Input */}
          <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800/80">
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                {isHindi ? "स्लाइडर या कस्टम संख्या:" : "Slider / Custom count:"}
              </span>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min="5"
                  max="100"
                  value={questionCount}
                  onChange={(e) => {
                    const v = e.target.value === "" ? 5 : parseInt(e.target.value, 10);
                    if (!isNaN(v)) {
                      setQuestionCount(Math.max(5, Math.min(100, v)));
                    }
                  }}
                  className="w-14 px-1.5 py-0.5 text-xs font-bold text-center rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-slate-100"
                />
                <span className="text-[10px] font-semibold text-slate-400">
                  {isHindi ? "प्रश्न" : "Q"}
                </span>
              </div>
            </div>

            <input
              type="range"
              min="5"
              max="100"
              step="1"
              value={questionCount}
              onChange={(e) => setQuestionCount(parseInt(e.target.value, 10) || 5)}
              className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-medium">
              <span>5</span>
              <span>25</span>
              <span>50</span>
              <span>100</span>
            </div>
          </div>
        </section>
      </div>

      {/* ── 4. STICKY / BOTTOM LAUNCH ACTION ── */}
      <div className="sticky bottom-16 sm:bottom-6 z-30 p-3 sm:p-4 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="text-center sm:text-left">
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            {isHindi ? "चयनित विन्यास:" : "Selected Configuration:"}
          </div>
          <div className="text-sm font-bold text-slate-800 dark:text-slate-100 mt-0.5">
            {selectedCats.length} {isHindi ? "श्रेणियां" : "Categories"} · {questionCount} {isHindi ? "प्रश्न" : "Ques"} · {diffLabels[difficulty]} · {getTimerLabel(timerSeconds)}
          </div>
        </div>

        <button
          type="button"
          onClick={handleStartQuiz}
          disabled={isStarting || selectedCats.length === 0}
          className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold text-sm sm:text-base text-white bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-600 hover:from-indigo-500 hover:to-purple-500 active:scale-95 transition-all shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
        >
          {isStarting ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              <span>{isHindi ? "लोड हो रहा है..." : "Loading..."}</span>
            </>
          ) : (
            <>
              <span>{isHindi ? "🚀 क्विज़ शुरू करें" : "🚀 Start Quiz"}</span>
              <ArrowRight size={18} />
            </>
          )}
        </button>
      </div>
    </div>
  </div>
);
}
