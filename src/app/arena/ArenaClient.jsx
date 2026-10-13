"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  Sparkles,
  ArrowRight,
  Check,
  Search,
  Clock,
  Layers,
  Zap,
  Loader2,
  Swords,
  Trophy,
  Share2,
  ChevronDown,
  ChevronUp,
  Sliders,
} from "lucide-react";
import { useQuiz } from "@/context/QuizContext";
import { useLanguage } from "@/context/LanguageContext";
import { useTier } from "@/context/TierContext";
import { useData } from "@/context/DataContext";
import toast from "react-hot-toast";
import { quizEngine } from "@/lib/quizEngine";
import { MAIN_CATEGORIES } from "@/lib/mainCategoriesConfig";
import ContextualLoader from "@/components/ContextualLoader";

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

  // Mode Selection: 'solo' (Solo Test Engine) | 'battle' (1v1 Friend Challenge)
  const isBattleRequested = searchParams?.get("battle") === "true" || searchParams?.get("mode") === "battle";
  const [activeArenaMode, setActiveArenaMode] = useState(() => isBattleRequested ? "battle" : "solo");

  // Metadata & categories state
  const [meta, setMeta] = useState(() => cachedArenaMeta);
  const [loadingMeta, setLoadingMeta] = useState(() => !cachedArenaMeta);
  const [isStarting, setIsStarting] = useState(false);

  // 1. Categories Selection State (Pre-select India GK if nothing chosen)
  const [catSearch, setCatSearch] = useState("");
  const [showUpcoming, setShowUpcoming] = useState(false);
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
  const [showCustomTimer, setShowCustomTimer] = useState(false);

  // 4. Optional Question Count: 10 | 20 | 30 | 50
  const [questionCount, setQuestionCount] = useState(20);
  const [showCustomCount, setShowCustomCount] = useState(false);

  // 1v1 Battle Mode Inputs
  const [battleCategory, setBattleCategory] = useState(() => {
    return searchParams?.get("cat") || searchParams?.get("category") || "india-gk";
  });
  const [challengeCodeInput, setChallengeCodeInput] = useState("");
  const [battleTab, setBattleTab] = useState(() => searchParams?.get("tab") === "join" ? "join" : "create"); // "create" | "join"

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
          if (saved.questionCount) {
            setQuestionCount(saved.questionCount);
            if (![10, 20, 30, 50].includes(saved.questionCount)) setShowCustomCount(true);
          }
          if (saved.timerSeconds !== undefined) {
            setTimerSeconds(saved.timerSeconds);
            if (![0, 15, 20, 30].includes(saved.timerSeconds)) setShowCustomTimer(true);
          }
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
      const slugKey = (cat.slug || "").toLowerCase();
      const aliasKey = (cat.slug === "india-sports" ? "sports" : (cat.slug === "india-polity" ? "politics-government" : null));
      const dbMatch =
        dbMap.get(slugKey) ||
        (aliasKey ? dbMap.get(aliasKey) : null) ||
        (meta?.categories || []).find((c) => {
          const cSlug = (c.slug || c.id)?.toLowerCase();
          return cSlug === slugKey || (aliasKey && cSlug === aliasKey);
        });

      let count = 0;
      if (dbMatch) {
        if (typeof dbMatch.questionCount === "number") count = dbMatch.questionCount;
        else if (Array.isArray(dbMatch.questions)) count = dbMatch.questions.length;
        else if (typeof dbMatch.count === "number") count = dbMatch.count;
      }

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

  // Real-Time Live Battle Handlers (Connected to Live Socket Engine)
  const handleCreateBattle = () => {
    const chosen = battleCategory || selectedCats[0] || "india-gk";
    // Generate clean 6-character room code (e.g. BTL902)
    const sessionId = "BTL" + Math.random().toString(36).substring(2, 6).toUpperCase();
    toast.success(isHindi ? "लाइव बैटल रूम तैयार हो रहा है..." : "Creating Live Battle Room...");
    router.push(`/live/${sessionId}?is_host=true&categoryId=${encodeURIComponent(chosen)}`);
  };

  const handleJoinBattle = (e) => {
    e?.preventDefault();
    if (!challengeCodeInput.trim()) {
      toast.error(isHindi ? "कृपया 6-अक्षरों का रूम कोड या लिंक दर्ज करें" : "Please enter room code or link");
      return;
    }
    let cleanInput = challengeCodeInput.trim();
    if (cleanInput.includes("/live/")) {
      const match = cleanInput.match(/\/live\/([a-zA-Z0-9_-]+)/);
      if (match && match[1]) cleanInput = match[1];
    } else if (cleanInput.includes("code=")) {
      const match = cleanInput.match(/code=([^&]+)/);
      if (match && match[1]) cleanInput = match[1];
    }
    cleanInput = cleanInput.replace(/[^a-zA-Z0-9_-]/g, "").toUpperCase();
    if (!cleanInput) {
      toast.error(isHindi ? "अमान्य रूम कोड" : "Invalid room code");
      return;
    }
    toast.success(isHindi ? `लाइव रूम ${cleanInput} में प्रवेश कर रहे हैं...` : `Joining Live Room ${cleanInput}...`);
    router.push(`/live/${cleanInput}`);
  };

  const handleCreateAsyncChallenge = () => {
    const chosen = battleCategory || selectedCats[0] || "india-gk";
    const userName = authSession?.user?.name || (isHindi ? "खिलाड़ी" : "Quizzer");
    router.push(`/challenge?cat=${chosen}&score=0&total=10&name=${encodeURIComponent(userName)}`);
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

  if (loadingMeta) {
    return (
      <div className="relative w-full min-h-screen bg-gradient-to-b from-[#EEF4FF] via-[#E2EDFF] to-[#D5E5FF] dark:from-[#080E1E] dark:via-[#0F1B38] dark:to-[#0A1226] text-slate-900 dark:text-slate-100 flex items-center justify-center p-4">
        <ContextualLoader 
          type="subjects" 
          message={isHindi ? "टेस्ट इंजन व विषय लोड हो रहे हैं..." : "Loading Test Engine & Subjects..."}
          subMessage={isHindi ? "सभी श्रेणियां व प्रश्न बैंक तैयार किए जा रहे हैं..." : "Preparing categories and question bank..."}
        />
      </div>
    );
  }

  return (
    <div className="relative w-full min-h-screen bg-gradient-to-b from-[#EEF4FF] via-[#E2EDFF] to-[#D5E5FF] dark:from-[#080E1E] dark:via-[#0F1B38] dark:to-[#0A1226] text-slate-900 dark:text-slate-100 overflow-hidden transition-colors">
      
      {/* ── MODERN SLEEK COSMIC GLOW (Clean radial ambient orbs) ── */}
      <div className="absolute inset-0 pointer-events-none select-none overflow-hidden z-0">
        <div className="absolute top-10 left-1/4 w-96 h-96 bg-indigo-500/15 dark:bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-80 right-10 w-96 h-96 bg-purple-500/15 dark:bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-20 left-10 w-80 h-80 bg-sky-500/15 dark:bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Main Content Container */}
      <div className="relative z-10 w-full max-w-[960px] mx-auto px-3 sm:px-4 py-4 pb-28">
        
        {/* ── 1. HEADER & FULL-WIDTH MODE SWITCHER ── */}
        <header className="mb-3.5">
          {/* Top Row: Title + Subtitle on Left, Leaderboard Icon Button on Right */}
          <div className="flex items-center justify-between gap-3">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                {activeArenaMode === "solo"
                  ? (isHindi ? "🎯 GK टेस्ट इंजन" : "🎯 GK Test Engine")
                  : (isHindi ? "⚔️ 1v1 लाइव जीके बैटल" : "⚔️ 1v1 Live GK Battle")}
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                {activeArenaMode === "solo"
                  ? (isHindi ? "श्रेणी और समय चुनें, लगातार प्रश्नों का अभ्यास करें" : "Configure categories & practice continuous testing")
                  : (isHindi ? "दोस्त के साथ लाइव GK मुकाबला" : "Real-time 1v1 battle with friends")}
              </p>
            </div>

            {/* Compact Header Leaderboard Icon Button */}
            <Link
              href="/leaderboard"
              className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200/80 text-xs font-bold transition-all shadow-2xs flex items-center gap-1 shrink-0"
              title={isHindi ? "लीडरबोर्ड देखें" : "View Leaderboard"}
            >
              <Trophy size={15} className="text-amber-600" />
              <span className="hidden sm:inline">{isHindi ? "लीडरबोर्ड" : "Leaderboard"}</span>
            </Link>
          </div>

          {/* Full-Width Segmented Mode Switcher (Heading ke theek neeche) */}
          <div className="w-full grid grid-cols-2 p-1 rounded-2xl bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 shadow-2xs mt-3 text-xs font-bold">
            <button
              type="button"
              onClick={() => setActiveArenaMode("solo")}
              className={`py-2 px-3 rounded-xl text-center transition-all cursor-pointer ${
                activeArenaMode === "solo"
                  ? "bg-indigo-600 text-white shadow-xs font-bold"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 font-medium"
              }`}
            >
              🎯 {isHindi ? "सोलो टेस्ट" : "Solo Practice"}
            </button>
            <button
              type="button"
              onClick={() => setActiveArenaMode("battle")}
              className={`py-2 px-3 rounded-xl text-center transition-all cursor-pointer ${
                activeArenaMode === "battle"
                  ? "bg-indigo-600 text-white shadow-xs font-bold"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 font-medium"
              }`}
            >
              ⚔️ {isHindi ? "1v1 बैटल" : "1v1 Battle"}
            </button>
          </div>
        </header>

        {/* ── CONDITIONAL SECTION: BATTLE MODE VS SOLO ENGINE ── */}
        {activeArenaMode === "battle" ? (
          <div className="space-y-3 animate-in fade-in duration-200">
            {/* Unified 1v1 Battle Card (Single Card, 2 Tabs) */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-3">
              {/* Card Sub-Tabs: [ नया रूम ] [ कोड से जुड़ें ] */}
              <div className="grid grid-cols-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl gap-1 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setBattleTab("create")}
                  className={`py-2 px-3 rounded-lg text-center transition-all cursor-pointer ${
                    battleTab === "create"
                      ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs font-bold"
                      : "text-slate-500 hover:text-slate-800 dark:text-slate-400 font-medium"
                  }`}
                >
                  ✨ {isHindi ? "नया रूम" : "Create Room"}
                </button>
                <button
                  type="button"
                  onClick={() => setBattleTab("join")}
                  className={`py-2 px-3 rounded-lg text-center transition-all cursor-pointer ${
                    battleTab === "join"
                      ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs font-bold"
                      : "text-slate-500 hover:text-slate-800 dark:text-slate-400 font-medium"
                  }`}
                >
                  🔗 {isHindi ? "कोड से जुड़ें" : "Join Code"}
                </button>
              </div>

              {/* Tab 1: नया रूम (Create Room) */}
              {battleTab === "create" ? (
                <div className="space-y-3 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between text-[13px] font-semibold text-slate-700 dark:text-slate-300">
                    <span>{isHindi ? "विषय" : "Topic"}</span>
                    {(() => {
                      const selCat = categoriesWithData.find((c) => c.slug === battleCategory);
                      return selCat ? (
                        <span className="text-[11px] text-slate-400 font-normal">
                          ({selCat.count} {isHindi ? "प्रश्न" : "ques"})
                        </span>
                      ) : null;
                    })()}
                  </div>

                  {/* Topic Selector Chips (Tappable Chips) */}
                  <div className="flex flex-wrap gap-1.5 max-h-44 overflow-y-auto custom-scrollbar pt-0.5">
                    {categoriesWithData.map((cat) => {
                      const isSelected = battleCategory === cat.slug;
                      return (
                        <button
                          key={cat.slug}
                          type="button"
                          onClick={() => setBattleCategory(cat.slug)}
                          className={`px-2.5 py-1.5 rounded-xl text-xs transition-all cursor-pointer flex items-center gap-1.5 border select-none ${
                            isSelected
                              ? "bg-indigo-50 dark:bg-indigo-950/60 border-indigo-500 text-indigo-700 dark:text-indigo-300 font-bold shadow-2xs ring-1 ring-indigo-500/20"
                              : "bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300 font-medium"
                          }`}
                        >
                          <span>{cat.icon || "📚"}</span>
                          <span>{isHindi ? cat.nameHi : cat.name}</span>
                          <span className="text-[10px] text-slate-400 font-normal">
                            ({cat.count})
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Primary Solid Indigo Button */}
                  <button
                    type="button"
                    onClick={handleCreateBattle}
                    className="w-full py-2.5 sm:py-3 px-4 rounded-xl font-bold text-xs sm:text-sm text-white bg-indigo-600 hover:bg-indigo-700 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs mt-1"
                  >
                    <span>⚔️</span>
                    <span>{isHindi ? "लाइव रूम बनाएं" : "Create Live Room"}</span>
                    <ArrowRight size={15} />
                  </button>
                </div>
              ) : (
                /* Tab 2: कोड से जुड़ें (Join with Code) */
                <div className="space-y-3 animate-in fade-in duration-150">
                  <div>
                    <label className="block text-[13px] font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      {isHindi ? "रूम कोड या लिंक" : "Room Code or Link"}
                    </label>
                    <input
                      type="text"
                      value={challengeCodeInput}
                      onChange={(e) => setChallengeCodeInput(e.target.value.toUpperCase())}
                      placeholder={isHindi ? "उदा. BTL902 या लिंक..." : "e.g. BTL902 or paste link..."}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-mono font-bold text-slate-800 dark:text-slate-100 uppercase tracking-widest placeholder:tracking-normal placeholder:font-sans focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  {/* Primary Solid Indigo Button (No Pink Gradient!) */}
                  <button
                    type="button"
                    onClick={handleJoinBattle}
                    className="w-full py-2.5 sm:py-3 px-4 rounded-xl font-bold text-xs sm:text-sm text-white bg-indigo-600 hover:bg-indigo-700 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs mt-1"
                  >
                    <span>🔗</span>
                    <span>{isHindi ? "रूम में शामिल हों" : "Join Room"}</span>
                    <ArrowRight size={15} />
                  </button>
                </div>
              )}
            </div>

            {/* Offline Challenge: Single-line Left-aligned Row */}
            <button
              type="button"
              onClick={handleCreateAsyncChallenge}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100/80 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between gap-2 text-left transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300 min-w-0">
                <span className="text-sm shrink-0">📩</span>
                <span className="truncate">
                  {isHindi ? "दोस्त offline है? Score challenge भेजें" : "Friend offline? Send a Score Challenge"}
                </span>
              </div>
              <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 group-hover:translate-x-0.5 transition-transform shrink-0">
                →
              </span>
            </button>

            {/* Sub-Link: Leaderboard */}
            <div className="text-center pt-0.5">
              <Link
                href="/leaderboard"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 transition-colors"
              >
                <span>🏆</span>
                <span>{isHindi ? "लाइव लीडरबोर्ड देखें" : "View Live Leaderboard"}</span>
                <span>→</span>
              </Link>
            </div>
          </div>
        ) : (
          /* Solo Test Engine Configurator */
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* ── CATEGORY SELECTION CARD (No Inner Scroll Trap) ── */}
            <section className="p-4 sm:p-5 rounded-3xl bg-white/95 dark:bg-slate-900/95 border border-blue-100/80 dark:border-slate-800 shadow-xl shadow-blue-900/5 backdrop-blur-md">
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
                    className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                  >
                    {isHindi ? "उपलब्ध सभी चुनें" : "Select All Active"}
                  </button>
                  <button
                    type="button"
                    onClick={handleClearAll}
                    className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
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

              {/* Responsive Category Grid: Natural Flow without inner scroll trap */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                {categoriesWithData.map((cat) => {
                  const isSelected = selectedCats.includes(cat.id);
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => toggleCategory(cat.id)}
                      className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all select-none active:scale-[0.97] min-h-[105px] sm:min-h-[115px] group cursor-pointer ${
                        isSelected
                          ? "bg-indigo-50/95 dark:bg-indigo-950/80 border-indigo-600 dark:border-indigo-400 shadow-md ring-2 ring-indigo-500/40 text-indigo-950 dark:text-indigo-100"
                          : "bg-white dark:bg-slate-800/60 border-slate-200/90 dark:border-slate-700/80 hover:border-indigo-300 dark:hover:border-slate-600 hover:shadow-sm"
                      }`}
                    >
                      {/* Top: Icon Thumbnail + Question Count Badge */}
                      <div className="flex items-center justify-between w-full mb-2">
                        <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xl shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                          {cat.icon || "🎯"}
                        </div>

                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-indigo-100/90 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800 shadow-2xs">
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
              </div>

              {/* Upcoming Categories Accordion Toggle */}
              {upcomingCategories.length > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-200/80 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowUpcoming((prev) => !prev)}
                    className="w-full flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 transition-all cursor-pointer text-left"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-base">🚀</span>
                      <span className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200">
                        {isHindi ? "आगामी विषय (जल्द आ रहे हैं)" : "Upcoming Categories (Coming Soon)"}
                      </span>
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-100/80 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border border-amber-200/70 dark:border-amber-800/60">
                        {upcomingCategories.length} {isHindi ? "विषय" : "topics"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-xs font-bold text-indigo-600 dark:text-indigo-400">
                      <span>{showUpcoming ? (isHindi ? "छुपाएं" : "Hide") : (isHindi ? "दिखाएं" : "Show")}</span>
                      {showUpcoming ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </div>
                  </button>

                  {showUpcoming && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 mt-3 animate-in fade-in duration-300">
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
                    </div>
                  )}
                </div>
              )}
            </section>

            {/* ── CONTROLS GRID: DIFFICULTY, TIMER, COUNT (COMPACT & MODERN) ── */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Difficulty Card */}
              <section className="p-4 sm:p-5 rounded-3xl bg-white/95 dark:bg-slate-900/95 border border-slate-200/90 dark:border-slate-800 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
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
                          className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all text-center cursor-pointer active:scale-95 ${
                            active
                              ? "bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-500/20"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                          }`}
                        >
                          {diffLabels[level]}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800/80 text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                  {isHindi ? "सभी स्तरों के मिश्रित या विशिष्ट प्रश्न" : "Mixed or specific question levels"}
                </div>
              </section>

              {/* Timer Card */}
              <section className="p-4 sm:p-5 rounded-3xl bg-white/95 dark:bg-slate-900/95 border border-slate-200/90 dark:border-slate-800 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                      <Clock size={16} className="text-indigo-500" />
                      <span>3. {isHindi ? "टाइमर (वैकल्पिक)" : "Timer (Optional)"}</span>
                    </h2>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/80">
                      {getTimerLabel(timerSeconds)}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mb-2.5">
                    {[0, 15, 20, 30].map((sec) => {
                      const active = timerSeconds === sec && !showCustomTimer;
                      return (
                        <button
                          key={sec}
                          type="button"
                          onClick={() => {
                            setTimerSeconds(sec);
                            setShowCustomTimer(false);
                          }}
                          className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all text-center cursor-pointer active:scale-95 ${
                            active
                              ? "bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-500/20"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                          }`}
                        >
                          {sec === 0 ? (isHindi ? "बिना टाइमर" : "No Timer") : `${sec} ${isHindi ? "सेकंड" : "s"}`}
                        </button>
                      );
                    })}
                  </div>

                  {/* Custom Toggle */}
                  <button
                    type="button"
                    onClick={() => setShowCustomTimer((prev) => !prev)}
                    className="flex items-center justify-center gap-1.5 w-full py-1 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                  >
                    <Sliders size={12} />
                    <span>{showCustomTimer ? (isHindi ? "प्रीसेट विकल्प दिखाएं" : "Show Presets") : (isHindi ? "कस्टम टाइमर सेट करें" : "Custom Timer Slider")}</span>
                  </button>
                </div>

                {/* Slider (appears when custom is toggled) */}
                {showCustomTimer && (
                  <div className="pt-2.5 mt-2 border-t border-slate-100 dark:border-slate-800/80 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      <span>{isHindi ? "कस्टम सेकंड:" : "Custom seconds:"}</span>
                      <span className="px-2 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300">
                        {timerSeconds}s
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="60"
                      step="5"
                      value={timerSeconds}
                      onChange={(e) => setTimerSeconds(parseInt(e.target.value, 10) || 0)}
                      className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                    />
                  </div>
                )}
              </section>

              {/* Question Count Card */}
              <section className="p-4 sm:p-5 rounded-3xl bg-white/95 dark:bg-slate-900/95 border border-slate-200/90 dark:border-slate-800 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                      <Zap size={16} className="text-indigo-500" />
                      <span>4. {isHindi ? "प्रश्न संख्या" : "Question Count"}</span>
                    </h2>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/80">
                      {questionCount} {isHindi ? "प्रश्न" : "Ques"}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mb-2.5">
                    {[10, 20, 30, 50].map((cnt) => {
                      const active = questionCount === cnt && !showCustomCount;
                      return (
                        <button
                          key={cnt}
                          type="button"
                          onClick={() => {
                            setQuestionCount(cnt);
                            setShowCustomCount(false);
                          }}
                          className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all text-center cursor-pointer active:scale-95 ${
                            active
                              ? "bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-500/20"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                          }`}
                        >
                          {cnt} {isHindi ? "प्रश्न" : "Questions"}
                        </button>
                      );
                    })}
                  </div>

                  {/* Custom Toggle */}
                  <button
                    type="button"
                    onClick={() => setShowCustomCount((prev) => !prev)}
                    className="flex items-center justify-center gap-1.5 w-full py-1 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                  >
                    <Sliders size={12} />
                    <span>{showCustomCount ? (isHindi ? "प्रीसेट विकल्प दिखाएं" : "Show Presets") : (isHindi ? "कस्टम संख्या सेट करें" : "Custom Question Slider")}</span>
                  </button>
                </div>

                {/* Slider (appears when custom is toggled) */}
                {showCustomCount && (
                  <div className="pt-2.5 mt-2 border-t border-slate-100 dark:border-slate-800/80 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      <span>{isHindi ? "कस्टम प्रश्न:" : "Custom count:"}</span>
                      <span className="px-2 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300">
                        {questionCount}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="5"
                      max="100"
                      step="5"
                      value={questionCount}
                      onChange={(e) => setQuestionCount(parseInt(e.target.value, 10) || 5)}
                      className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                    />
                  </div>
                )}
              </section>
            </div>

            {/* ── STICKY BOTTOM LAUNCH ACTION BAR ── */}
            <div className="sticky bottom-16 sm:bottom-6 z-30 p-3.5 sm:p-4 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200/90 dark:border-slate-800 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-center sm:text-left">
                <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  {isHindi ? "चयनित विन्यास:" : "Selected Configuration:"}
                </div>
                {selectedCats.length === 0 ? (
                  <div className="text-xs font-bold text-amber-600 dark:text-amber-400 mt-0.5">
                    {isHindi ? "⚠️ टेस्ट शुरू करने के लिए कम से कम 1 श्रेणी चुनें" : "⚠️ Please select at least 1 category"}
                  </div>
                ) : (
                  <div className="text-sm font-bold text-slate-800 dark:text-slate-100 mt-0.5">
                    {selectedCats.length} {isHindi ? "श्रेणियां" : "Categories"} · {questionCount} {isHindi ? "प्रश्न" : "Ques"} · {diffLabels[difficulty]} · {getTimerLabel(timerSeconds)}
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={handleStartQuiz}
                disabled={isStarting || selectedCats.length === 0}
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold text-sm sm:text-base text-white bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-600 hover:from-indigo-500 hover:to-purple-500 active:scale-95 transition-all shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isStarting ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    <span>{isHindi ? "लोड हो रहा है..." : "Loading..."}</span>
                  </>
                ) : (
                  <>
                    <span>{isHindi ? "🚀 टेस्ट शुरू करें" : "🚀 Start Test"}</span>
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
