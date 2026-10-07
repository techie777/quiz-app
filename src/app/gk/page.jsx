"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Landmark,
  Globe,
  Play,
  Sparkles,
  Search,
  BookOpen,
  ArrowRight,
  Star,
  CheckCircle2,
  Lock,
  Eye,
  Heart,
  Share2,
  RefreshCw,
  Flame,
  ChevronRight,
  Compass,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { useQuiz } from "@/context/QuizContext";
import { GK_CATEGORIES } from "@/lib/gkData";
import { shareQuiz } from "@/lib/shareHelper";
import { isFavourite, toggleFavourite } from "@/lib/favouritesHelper";
import SetPreviewModal from "@/components/SetPreviewModal";
import ArenaClient from "@/app/arena/ArenaClient";
import toast, { Toaster } from "react-hot-toast";

export default function GkHubPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isHindi, setLanguage: setGlobalLang } = useLanguage();
  const { startQuizSet } = useQuiz();

  // Layer: "standard" | "arena" (Rule 6)
  const initialModeParam = searchParams.get("mode") || searchParams.get("layer");
  const [activeLayer, setActiveLayer] = useState(initialModeParam === "arena" ? "arena" : "standard");

  // Category: India GK | World GK (remember last choice in localStorage)
  const initialCategoryParam = searchParams.get("category");
  const [category, setCategory] = useState(() => {
    if (initialCategoryParam?.toLowerCase().includes("world")) return GK_CATEGORIES.WORLD;
    if (initialCategoryParam?.toLowerCase().includes("india")) return GK_CATEGORIES.INDIA;
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("quizweb_gk_category_pref");
      if (saved) return saved;
    }
    return GK_CATEGORIES.INDIA;
  });

  // View: "play-all" | "topics"
  const initialViewParam = searchParams.get("view");
  const [view, setView] = useState(initialViewParam === "play-all" ? "play-all" : "topics");

  // Search filter
  const [searchQuery, setSearchQuery] = useState("");

  // Data state
  const [gkData, setGkData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Preview modal state
  const [previewModalData, setPreviewModalData] = useState(null);
  const [loadingPreviewId, setLoadingPreviewId] = useState(null);

  // Favourites state
  const [favMap, setFavMap] = useState({});

  const currentLang = isHindi ? "hi" : "en";

  // Persist category preference
  useEffect(() => {
    try {
      localStorage.setItem("quizweb_gk_category_pref", category);
    } catch {}
  }, [category]);

  // Fetch GK Data for current category and language
  useEffect(() => {
    let isCancelled = false;
    async function loadData() {
      setLoading(true);
      try {
        let deviceId = "";
        try {
          deviceId = localStorage.getItem("quizweb_device_id") || "";
        } catch {}

        const res = await fetch(
          `/api/gk/data?category=${encodeURIComponent(category)}&language=${currentLang}&deviceId=${deviceId}`
        );
        const data = await res.json();
        if (!isCancelled && res.ok) {
          setGkData(data);
        }
      } catch (err) {
        console.error("Failed to load GK data:", err);
      } finally {
        if (!isCancelled) setLoading(false);
      }
    }
    loadData();
    return () => {
      isCancelled = true;
    };
  }, [category, currentLang]);

  // Filter topics by search query
  const filteredTopics = useMemo(() => {
    const list = gkData?.topics || [];
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase().trim();
    return list.filter((t) => {
      const name = (t.name || "").toLowerCase();
      const nameHi = (t.nameHi || "").toLowerCase();
      return name.includes(q) || nameHi.includes(q);
    });
  }, [gkData?.topics, searchQuery]);

  // Filter master sets by search query (e.g. Set number or tags)
  const filteredMasterSets = useMemo(() => {
    const list = gkData?.masterSets || [];
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase().trim();
    return list.filter((s) => {
      const tagStr = (s.tags || []).join(" ").toLowerCase();
      return `set ${s.number}`.includes(q) || tagStr.includes(q);
    });
  }, [gkData?.masterSets, searchQuery]);

  // Handler to start playing a set
  const handlePlaySet = async (setDoc, topicName = "GK Master Path") => {
    try {
      const res = await fetch(`/api/gk/topic-sets?setId=${setDoc.id}&language=${currentLang}`);
      const data = await res.json();
      if (!res.ok || !data.questions || data.questions.length === 0) {
        toast.error(isHindi ? "प्रश्न लोड करने में त्रुटि" : "Could not load questions for this set");
        return;
      }

      startQuizSet(
        setDoc.id,
        data.questions,
        30,
        currentLang,
        setDoc.number,
        topicName
      );
      router.push(`/quiz/${setDoc.id}`);
    } catch (err) {
      toast.error(isHindi ? "क्विज़ शुरू करने में त्रुटि" : "Failed to launch quiz set");
    }
  };

  // Handler to preview questions of a set
  const handleOpenPreview = async (setDoc) => {
    setLoadingPreviewId(setDoc.id);
    try {
      const res = await fetch(`/api/gk/topic-sets?setId=${setDoc.id}&language=${currentLang}`);
      const data = await res.json();
      if (res.ok && data.questions) {
        setPreviewModalData({
          set: {
            ...setDoc,
            index: setDoc.number,
            questions: data.questions,
          },
          categoryTopic: category,
        });
      } else {
        toast.error("Could not load preview");
      }
    } catch {
      toast.error("Preview failed");
    } finally {
      setLoadingPreviewId(null);
    }
  };

  const handleShareSet = (e, setDoc) => {
    e.stopPropagation();
    shareQuiz({
      id: setDoc.id,
      title: `${category} Set ${setDoc.number}`,
      description: `Test your knowledge with 20 questions in ${category}!`,
    });
  };

  // Next up set recommendation in Master Path
  const masterPointer = gkData?.masterPointer || 1;
  const totalMasterSets = gkData?.totalMasterSets || 0;
  const completedMasterSets = gkData?.completedMasterSets || 0;
  const masterProgressPct = totalMasterSets > 0 ? Math.round((completedMasterSets / totalMasterSets) * 100) : 0;

  // Phase badge calculation
  let phaseName = isHindi ? "वार्म-अप" : "Warm-up";
  let phaseColor = "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300";
  if (masterProgressPct > 75) {
    phaseName = isHindi ? "चुनौती (विशेषज्ञ)" : "Challenge (Expert)";
    phaseColor = "bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300";
  } else if (masterProgressPct > 40) {
    phaseName = isHindi ? "प्रगतिशील (मध्यम-कठिन)" : "Rising (Medium-Hard)";
    phaseColor = "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300";
  }

  // Next set doc
  const nextUpSet = (gkData?.masterSets || []).find((s) => s.number === masterPointer) || (gkData?.masterSets?.[0] || null);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-24 text-slate-900 dark:text-white select-none">
      <Toaster position="top-center" />

      {/* ── HEADER ── */}
      <header className="sticky top-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center font-black shadow-sm">
              <Compass size={18} />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-black tracking-tight leading-none">
                {isHindi ? "सामान्य ज्ञान (जीके)" : "General Knowledge (GK)"}
              </h1>
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                {gkData?.stats?.totalQuestions
                  ? `${gkData.stats.totalQuestions.toLocaleString("en-IN")}+ ${isHindi ? "सत्यापित प्रश्न" : "Verified Questions"}`
                  : (isHindi ? "सत्यापित प्रश्न संग्रह" : "Verified Question Bank")}
              </span>
            </div>
          </div>

          {/* Language Toggle */}
          <button
            type="button"
            onClick={() => setGlobalLang(isHindi ? "en" : "hi")}
            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-black text-slate-700 dark:text-slate-200 transition-colors"
          >
            {isHindi ? "English" : "हिंदी"}
          </button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-4 space-y-4">
        {/* Top Two-Tab Switch: Standard Sets | Quiz Arena (Rule 6) */}
        <div className="flex items-center justify-center my-2">
          <div className="inline-flex p-1 rounded-2xl bg-slate-200/70 dark:bg-slate-900 border border-slate-300/60 dark:border-slate-800 shadow-2xs">
            <button
              type="button"
              onClick={() => setActiveLayer("standard")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all ${
                activeLayer === "standard"
                  ? "bg-white dark:bg-slate-800 text-purple-600 dark:text-purple-400 shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <span>📚</span>
              <span>{isHindi ? "स्टैंडर्ड सेट्स" : "Standard Sets"}</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveLayer("arena")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all ${
                activeLayer === "arena"
                  ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <span>⚡</span>
              <span>{isHindi ? "GK टेस्ट इंजन" : "GK Test Engine"}</span>
            </button>
          </div>
        </div>

        {activeLayer === "arena" ? (
          <div className="mt-2 mb-12">
            <ArenaClient
              initialSelectedCategoryIds={
                gkData?.topics?.length > 0
                  ? gkData.topics.map((t) => t.id)
                  : [category === GK_CATEGORIES.WORLD ? "world-gk" : "india-gk"]
              }
              embedded={true}
            />
          </div>
        ) : (
          <>
            {/* ── SEARCH BAR ── */}
            <div className="relative w-full">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              view === "topics"
                ? isHindi
                  ? "विषय खोजें (इतिहास, भूगोल, राजव्यवस्था...)"
                  : "Search topics (History, Geography, Polity...)"
                : isHindi
                ? "मास्टर सेट खोजें (Set 1, SSC, Tags...)"
                : "Search master sets (Set 1, SSC, Tags...)"
            }
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 shadow-2xs"
          />
        </div>

        {/* ── TOP-LEVEL CATEGORY SELECTOR (India GK | World GK) ── */}
        <div className="p-1 rounded-2xl bg-slate-200/70 dark:bg-slate-900 border border-slate-300/60 dark:border-slate-800 flex items-center gap-1 shadow-2xs">
          <button
            type="button"
            onClick={() => setCategory(GK_CATEGORIES.INDIA)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-black transition-all ${
              category === GK_CATEGORIES.INDIA
                ? "bg-white text-indigo-700 dark:bg-slate-800 dark:text-indigo-300 shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
            }`}
          >
            <Landmark size={15} />
            <span>{isHindi ? "भारत सामान्य ज्ञान" : "India GK"}</span>
          </button>

          <button
            type="button"
            onClick={() => setCategory(GK_CATEGORIES.WORLD)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-black transition-all ${
              category === GK_CATEGORIES.WORLD
                ? "bg-white text-indigo-700 dark:bg-slate-800 dark:text-indigo-300 shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
            }`}
          >
            <Globe size={15} />
            <span>{isHindi ? "विश्व सामान्य ज्ञान" : "World GK"}</span>
          </button>
        </div>

        {/* ── VIEW CHIPS: PLAY ALL · TOPICS ── */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setView("topics")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-2xl text-xs font-extrabold transition-all ${
              view === "topics"
                ? "bg-purple-600 text-white shadow-sm shadow-purple-500/25"
                : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200/80 dark:border-slate-800 hover:bg-slate-100"
            }`}
          >
            <BookOpen size={14} />
            <span>{isHindi ? "विषय अनुसार (Topics)" : "Topics"}</span>
            {gkData?.topics && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full bg-white/20 text-[10px]">
                {gkData.topics.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setView("play-all")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-2xl text-xs font-extrabold transition-all ${
              view === "play-all"
                ? "bg-purple-600 text-white shadow-sm shadow-purple-500/25"
                : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200/80 dark:border-slate-800 hover:bg-slate-100"
            }`}
          >
            <Play size={14} />
            <span>{isHindi ? "प्ले ऑल (मास्टर पाथ)" : "Play All"}</span>
            {totalMasterSets > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full bg-white/20 text-[10px]">
                {totalMasterSets}
              </span>
            )}
          </button>
        </div>

        {/* ── LOADING STATE ── */}
        {loading ? (
          <div className="py-20 text-center space-y-2">
            <RefreshCw size={26} className="animate-spin mx-auto text-purple-600" />
            <p className="text-xs font-bold text-slate-400">
              {isHindi ? "जीके संग्रह लोड हो रहा है..." : "Loading GK collection..."}
            </p>
          </div>
        ) : (
          <>
            {/* ══════════════════════════════════════════════════════════
                VIEW 1: PLAY ALL (MASTER PATH HERO + SETS GRID)
            ══════════════════════════════════════════════════════════ */}
            {view === "play-all" && (
              <div className="space-y-4">
                {/* Hero Card: Master Path */}
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-purple-700 via-indigo-700 to-indigo-900 text-white p-6 shadow-xl shadow-purple-900/10">
                  <div className="absolute -right-10 -bottom-10 w-44 h-44 rounded-full bg-white/10 blur-2xl pointer-events-none" />

                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="space-y-1.5 max-w-md">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-[10px] font-black uppercase tracking-wider text-purple-100">
                          {isHindi ? "मास्टर पाथ" : "GK MASTER PATH"}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${phaseColor}`}>
                          {phaseName}
                        </span>
                      </div>

                      <h2 className="text-lg sm:text-xl font-black tracking-tight">
                        {category} {isHindi ? "मास्टर क्विज़ पाथ" : "Master Path"}
                      </h2>

                      <p className="text-xs text-purple-100/90 leading-relaxed">
                        {isHindi
                          ? `पहला 40% सरल व मध्यम; उसके बाद कठिन और विशेषज्ञ प्रश्न। सेट ${masterPointer} ऑफ़ ${totalMasterSets}`
                          : `Ramps from Easy to Expert. Set ${masterPointer} of ${totalMasterSets} ready.`}
                      </p>

                      {/* Progress bar */}
                      <div className="w-full h-2 rounded-full bg-white/20 overflow-hidden mt-3">
                        <div
                          className="h-full bg-emerald-400 rounded-full transition-all duration-500"
                          style={{ width: `${masterProgressPct}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[10.5px] font-bold text-purple-200">
                        <span>{completedMasterSets} {isHindi ? "सेट पूर्ण" : "sets finished"}</span>
                        <span>{masterProgressPct}%</span>
                      </div>
                    </div>

                    {/* Big Continue Button */}
                    {nextUpSet ? (
                      <button
                        type="button"
                        onClick={() => handlePlaySet(nextUpSet, `${category} Master Set ${nextUpSet.number}`)}
                        className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-white hover:bg-purple-50 text-indigo-900 font-black text-sm shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95 shrink-0 cursor-pointer"
                      >
                        <Play size={16} fill="currentColor" />
                        <span>{isHindi ? `सेट ${nextUpSet.number} जारी रखें` : `Continue Set ${nextUpSet.number}`}</span>
                      </button>
                    ) : (
                      <div className="text-xs text-purple-200 font-bold">
                        {isHindi ? "सभी सेट पूर्ण हो गए! बधाई!" : "All sets completed! Well done!"}
                      </div>
                    )}
                  </div>
                </div>

                {/* Master Sets Grid */}
                {filteredMasterSets.length === 0 ? (
                  <div className="py-16 text-center text-slate-400 text-xs font-bold bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800">
                    {isHindi ? "इस भाषा में कोई मास्टर सेट उपलब्ध नहीं हैं" : "No master sets available in this language yet"}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {filteredMasterSets.map((s) => {
                      const isUpNext = s.number === masterPointer;
                      const isCompleted = s.completed;

                      return (
                        <div
                          key={s.id}
                          className={`relative p-4 rounded-3xl border transition-all flex flex-col justify-between space-y-3 ${
                            isUpNext
                              ? "bg-purple-50/70 dark:bg-purple-950/40 border-2 border-purple-600 shadow-md shadow-purple-500/10 ring-2 ring-purple-500/20"
                              : "bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 hover:border-slate-300"
                          }`}
                        >
                          <div>
                            {/* Card Top: Number + Up Next Badge */}
                            <div className="flex items-center justify-between gap-2 mb-1.5">
                              <span className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                                <span>{isHindi ? `सेट ${s.number}` : `Set ${s.number}`}</span>
                                {isCompleted && (
                                  <CheckCircle2 size={13} className="text-emerald-500" />
                                )}
                              </span>

                              {isUpNext && (
                                <span className="px-2 py-0.5 rounded-full bg-purple-600 text-white text-[9.5px] font-black tracking-wide uppercase">
                                  {isHindi ? "अगला" : "Up Next"}
                                </span>
                              )}
                            </div>

                            {/* Tags (2 lines) */}
                            <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 line-clamp-2 min-h-[32px] leading-snug">
                              {s.tags?.length > 0 ? s.tags.join(" · ") : "General Knowledge Trivia"}
                            </p>

                            {/* Small Mix Bar */}
                            <div className="w-full h-1.5 rounded-full overflow-hidden flex bg-slate-100 dark:bg-slate-800 mt-2">
                              <div style={{ width: `${((s.mix?.easy || 0) / 20) * 100}%` }} className="bg-emerald-500 h-full" />
                              <div style={{ width: `${((s.mix?.medium || 0) / 20) * 100}%` }} className="bg-amber-500 h-full" />
                              <div style={{ width: `${((s.mix?.hard || 0) / 20) * 100}%` }} className="bg-rose-500 h-full" />
                              <div style={{ width: `${((s.mix?.expert || 0) / 20) * 100}%` }} className="bg-purple-600 h-full" />
                            </div>

                            {/* Score / Stars */}
                            <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold mt-1.5">
                              <div className="flex items-center gap-0.5 text-amber-500">
                                {[1, 2, 3].map((starIdx) => (
                                  <Star
                                    key={starIdx}
                                    size={11}
                                    fill={starIdx <= (s.stars || 0) ? "currentColor" : "none"}
                                    strokeWidth={2}
                                  />
                                ))}
                              </div>
                              <span>
                                {s.bestScore > 0 ? `${s.bestScore}/20` : "20 Qs"}
                              </span>
                            </div>
                          </div>

                          {/* Action Row */}
                          <div className="flex items-center justify-between gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                            <button
                              type="button"
                              onClick={() => handleOpenPreview(s)}
                              disabled={loadingPreviewId === s.id}
                              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
                              title={isHindi ? "प्रश्न देखें" : "Preview 20 Questions"}
                            >
                              <Eye size={13} />
                            </button>

                            <button
                              type="button"
                              onClick={(e) => handleShareSet(e, s)}
                              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
                              title="Share"
                            >
                              <Share2 size={13} />
                            </button>

                            <button
                              type="button"
                              onClick={() => handlePlaySet(s, `${category} Master Set ${s.number}`)}
                              className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
                                isUpNext
                                  ? "bg-purple-600 hover:bg-purple-700 text-white shadow-xs"
                                  : "bg-slate-100 hover:bg-indigo-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:text-indigo-600"
                              }`}
                            >
                              <span>{isCompleted ? (isHindi ? "पुनः खेलें" : "Replay") : (isHindi ? "शुरू करें" : "Start")}</span>
                              <ChevronRight size={13} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ══════════════════════════════════════════════════════════
                VIEW 2: TOPICS VIEW (2-COLUMN RESPONSIVE GRID)
            ══════════════════════════════════════════════════════════ */}
            {view === "topics" && (
              <div className="space-y-4">
                {filteredTopics.length === 0 ? (
                  <div className="py-16 text-center text-slate-400 text-xs font-bold bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800">
                    {isHindi ? "कोई विषय नहीं मिला" : "No topics matched your search"}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {filteredTopics.map((topic) => {
                      const title = isHindi ? topic.nameHi || topic.name : topic.name;
                      const setsCount = topic.setsCount || 0;
                      const qCount = topic.questionCount || setsCount * 20;

                      const isIndia = category.toLowerCase().includes("india");
                      const targetHref = isIndia 
                        ? `/category/india-gk?sub=${topic.id}`
                        : `/category/world-gk?sub=${topic.id}`;

                      return (
                        <Link
                          key={topic.id}
                          href={targetHref}
                          className="group relative p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 hover:border-purple-300 dark:hover:border-purple-800 hover:shadow-md hover:shadow-purple-500/5 transition-all flex flex-col justify-between min-h-[120px]"
                        >
                          <div>
                            {/* Icon & Sets Badge */}
                            <div className="flex items-center justify-between gap-1 mb-2">
                              <div className="w-10 h-10 rounded-2xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 flex items-center justify-center text-xl shrink-0">
                                {topic.icon || "🏛️"}
                              </div>

                              <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-600 dark:text-slate-400">
                                {setsCount} {isHindi ? "सेट्स" : "Sets"}
                              </span>
                            </div>

                            {/* Title */}
                            <h3 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white line-clamp-2 leading-snug group-hover:text-purple-600 transition-colors">
                              {title}
                            </h3>
                          </div>

                          {/* Footer: Q count + Arrow */}
                          <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/80 text-[11px] text-slate-500 font-bold mt-2">
                            <span>{qCount} {isHindi ? "प्रश्न" : "Qs"}</span>
                            <span className="text-purple-600 group-hover:translate-x-0.5 transition-transform">
                              <ChevronRight size={14} />
                            </span>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </>
    )}
  </div>

      {/* Set Questions Preview Modal */}
      {previewModalData && (
        <SetPreviewModal
          isOpen={Boolean(previewModalData)}
          onClose={() => setPreviewModalData(null)}
          set={previewModalData.set}
          categoryTopic={previewModalData.categoryTopic}
          onStartSet={() => {
            const s = previewModalData.set;
            setPreviewModalData(null);
            handlePlaySet(s, `${category} Set ${s.number}`);
          }}
        />
      )}
    </div>
  );
}
