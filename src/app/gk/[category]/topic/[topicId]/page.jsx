"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Play,
  Eye,
  Share2,
  Star,
  CheckCircle2,
  RefreshCw,
  Sparkles,
  ChevronRight,
  BookOpen,
  Swords,
  Shuffle,
  Layers,
  ChevronDown,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { useQuiz } from "@/context/QuizContext";
import { shareQuiz, shareSetChallenge } from "@/lib/shareHelper";
import SetPreviewModal from "@/components/SetPreviewModal";
import ArenaClient from "@/app/arena/ArenaClient";
import ProBannerStrip from "@/components/monetization/ProBannerStrip";
import toast, { Toaster } from "react-hot-toast";

export default function GkTopicSetsPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isHindi } = useLanguage();
  const { startQuizSet } = useQuiz();

  // Layer: "standard" | "arena" (Rule 6)
  const initialModeParam = searchParams?.get("mode") || searchParams?.get("layer");
  const [activeLayer, setActiveLayer] = useState(initialModeParam === "arena" ? "arena" : "standard");

  const rawCategory = params.category || "india";
  const categoryTitle = rawCategory.toLowerCase().includes("world") ? "World GK" : "India GK";
  const topicId = params.topicId;

  const [topicData, setTopicData] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState(searchParams?.get("subject") || null);
  const [sets, setSets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [displayLimit, setDisplayLimit] = useState(12);

  // Preview modal state
  const [previewModalData, setPreviewModalData] = useState(null);
  const [loadingPreviewId, setLoadingPreviewId] = useState(null);

  const currentLang = isHindi ? "hi" : "en";

  useEffect(() => {
    let isCancelled = false;
    async function loadTopicSets() {
      setLoading(true);
      try {
        let deviceId = "";
        try {
          deviceId = localStorage.getItem("quizweb_device_id") || "";
        } catch {}

        const res = await fetch(
          `/api/gk/topic-sets?topicId=${encodeURIComponent(topicId)}&language=${currentLang}&deviceId=${deviceId}`
        );
        const data = await res.json();
        if (!isCancelled && res.ok) {
          setTopicData(data.topic);
          setSubjects(data.subjects || []);
          setSets(data.sets || []);
        }
      } catch (err) {
        console.error("Failed to load topic sets:", err);
      } finally {
        if (!isCancelled) setLoading(false);
      }
    }
    loadTopicSets();
    return () => {
      isCancelled = true;
    };
  }, [topicId, currentLang]);

  // Filter sets by selected subject (or show all)
  const displaySets = useMemo(() => {
    if (!selectedSubjectId) return sets;
    return sets.filter((s) => s.subjectId === selectedSubjectId);
  }, [sets, selectedSubjectId]);

  const visibleSets = useMemo(() => {
    return displaySets.slice(0, displayLimit);
  }, [displaySets, displayLimit]);

  const activeSubject = useMemo(() => {
    if (!selectedSubjectId) return null;
    return subjects.find((s) => s.id === selectedSubjectId || s.slug === selectedSubjectId);
  }, [subjects, selectedSubjectId]);

  const topicName = isHindi && topicData?.nameHi ? topicData.nameHi : topicData?.name || "GK Topic";
  const currentTitle = activeSubject
    ? (isHindi && activeSubject.nameHi ? activeSubject.nameHi : activeSubject.name)
    : topicName;

  const completedSets = displaySets.filter((s) => s.completed).length;
  const progressPct = displaySets.length > 0 ? Math.round((completedSets / displaySets.length) * 100) : 0;
  const nextUpSet = displaySets.find((s) => !s.completed) || displaySets[0];

  const handlePlaySet = async (setDoc) => {
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
        currentTitle,
        true,
        null,
        setDoc.subjectId,
        setDoc.topicId || topicId
      );
      router.push(`/quiz/${setDoc.id}`);
    } catch {
      toast.error(isHindi ? "क्विज़ शुरू करने में त्रुटि" : "Failed to launch quiz set");
    }
  };

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
          categoryTopic: currentTitle,
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

  const handlePlayMix = async () => {
    if (displaySets.length === 0) return;
    const targetSet = displaySets[Math.floor(Math.random() * displaySets.length)];
    handlePlaySet(targetSet);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-24 text-slate-900 dark:text-white select-none">
      <Toaster position="top-center" />

      {/* Top Header & Breadcrumb */}
      <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <button
              type="button"
              onClick={() => router.back()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-black text-slate-700 dark:text-slate-200 transition-colors shrink-0"
            >
              <ArrowLeft size={14} />
              <span>{isHindi ? "पीछे जाएं" : "Back"}</span>
            </button>

            {/* Breadcrumb path */}
            <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-bold text-slate-400 overflow-hidden text-ellipsis whitespace-nowrap">
              <Link href="/gk" className="hover:text-purple-600 transition-colors">
                GK
              </Link>
              <span>/</span>
              <Link href={`/gk?category=${rawCategory}`} className="hover:text-purple-600 transition-colors">
                {categoryTitle}
              </Link>
              <span>/</span>
              <span className="text-slate-600 dark:text-slate-300 font-black">{topicName}</span>
              {activeSubject && (
                <>
                  <span>/</span>
                  <span className="text-purple-600 dark:text-purple-400 font-black">{currentTitle}</span>
                </>
              )}
            </div>
          </div>

          <span className="text-xs font-black text-purple-600 dark:text-purple-400 shrink-0">
            {categoryTitle}
          </span>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-5 space-y-6">
        {/* Top Two-Tab Switch: Standard Sets | Quiz Arena (Rule 6) */}
        <div className="flex items-center justify-center my-1">
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
              <span>⚔️</span>
              <span>{isHindi ? "क्विज़ अखाड़ा (Arena)" : "Quiz Arena"}</span>
            </button>
          </div>
        </div>

        {activeLayer === "arena" ? (
          <div className="mt-2 mb-12">
            <ArenaClient
              initialSelectedCategoryIds={[selectedSubjectId || topicId]}
              embedded={true}
            />
          </div>
        ) : (
          <>
            {/* Topic Header Hero Card */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-purple-100 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center text-3xl shrink-0">
              {topicData?.icon || "🏛️"}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-black uppercase text-purple-600 dark:text-purple-400 tracking-wider">
                  {categoryTitle} · {topicName}
                </span>
                {activeSubject && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                    Subject View
                  </span>
                )}
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white leading-tight mt-0.5">
                {currentTitle}
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {displaySets.length} {isHindi ? "सेट्स" : "Sets"} · {displaySets.length * 20} {isHindi ? "प्रश्न" : "Questions"}
              </p>
            </div>
          </div>

          {/* Progress Bar (Task 2.3) */}
          <div className="w-full md:w-56 p-3.5 rounded-2xl bg-purple-50/80 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900/40">
            <div className="flex items-center justify-between gap-4 text-xs font-black text-purple-900 dark:text-purple-200 mb-1.5">
              <span>{isHindi ? "प्रगति" : "Progress"}</span>
              <span>{completedSets} / {displaySets.length} {isHindi ? "पूर्ण" : "done"} ({progressPct}%)</span>
            </div>
            <div className="w-full h-2 rounded-full bg-purple-200/70 dark:bg-purple-800/40 overflow-hidden">
              <div
                className="h-full bg-purple-600 dark:bg-purple-500 rounded-full transition-all duration-300"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        </div>

        {/* Rule 2: Subject Tiles / Pills (Hierarchy level: Topic > Subject) */}
        {subjects.length > 0 && (
          <div className="space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Layers size={13} className="text-purple-600" />
                <span>{isHindi ? "विषय अनुसार चुनें (Subjects)" : "Browse by Subject"}</span>
              </h2>
              {selectedSubjectId && (
                <button
                  type="button"
                  onClick={() => setSelectedSubjectId(null)}
                  className="text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline"
                >
                  {isHindi ? "सभी सेट्स देखें" : "View All"}
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
              {/* All Option */}
              <button
                type="button"
                onClick={() => {
                  setSelectedSubjectId(null);
                  setDisplayLimit(12);
                }}
                className={`p-3 rounded-2xl text-left border transition-all ${
                  selectedSubjectId === null
                    ? "bg-purple-600 text-white border-purple-600 shadow-sm"
                    : "bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border-slate-200/80 dark:border-slate-800 hover:border-purple-300"
                }`}
              >
                <div className="text-xs font-black line-clamp-1">
                  {isHindi ? "सभी सेट्स" : "All Sets"}
                </div>
                <div
                  className={`text-[11px] font-bold mt-0.5 ${
                    selectedSubjectId === null ? "text-purple-100" : "text-slate-400"
                  }`}
                >
                  {sets.length} {isHindi ? "सेट्स" : "Sets"}
                </div>
              </button>

              {subjects.map((sub) => {
                const isSelected = selectedSubjectId === sub.id || selectedSubjectId === sub.slug;
                const isComingSoon = (sub.setCount || 0) === 0;
                const subName = isHindi && sub.nameHi ? sub.nameHi : sub.name;

                return (
                  <button
                    key={sub.id}
                    type="button"
                    disabled={isComingSoon}
                    onClick={() => {
                      setSelectedSubjectId(sub.id);
                      setDisplayLimit(12);
                    }}
                    className={`p-3 rounded-2xl text-left border transition-all relative ${
                      isSelected
                        ? "bg-purple-600 text-white border-purple-600 shadow-sm"
                        : isComingSoon
                        ? "bg-slate-100/60 dark:bg-slate-900/40 text-slate-400 border-dashed border-slate-200 dark:border-slate-800 cursor-not-allowed"
                        : "bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border-slate-200/80 dark:border-slate-800 hover:border-purple-300"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-sm shrink-0">{sub.icon || "📖"}</span>
                      {isComingSoon && (
                        <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400">
                          {isHindi ? "जल्द" : "Soon"}
                        </span>
                      )}
                    </div>
                    <div className="text-xs font-black line-clamp-1 mt-1">
                      {subName}
                    </div>
                    <div
                      className={`text-[11px] font-bold mt-0.5 ${
                        isSelected ? "text-purple-100" : "text-slate-400"
                      }`}
                    >
                      {isComingSoon
                        ? (isHindi ? "जल्द आ रहा है" : "Coming soon")
                        : `${sub.setCount || 0} ${isHindi ? "सेट्स" : "Sets"}`}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Task 2.3: Subject Page Quick Action Row (Continue, Mix, Arena) */}
        {displaySets.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {/* 1. Continue / Next Up */}
            {nextUpSet && (
              <button
                type="button"
                onClick={() => handlePlaySet(nextUpSet)}
                className="p-3.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white flex items-center justify-between shadow-sm transition-all cursor-pointer"
              >
                <div className="text-left">
                  <span className="text-[10px] font-black uppercase tracking-wider text-purple-200">
                    {isHindi ? "अगला सेट" : "Continue"}
                  </span>
                  <div className="text-xs font-black leading-tight">
                    {isHindi ? `सेट ${nextUpSet.number} शुरू करें` : `Play Set ${nextUpSet.number}`}
                  </div>
                </div>
                <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                  <Play size={14} fill="currentColor" className="translate-x-0.5" />
                </div>
              </button>
            )}

            {/* 2. Mix / Play All */}
            <button
              type="button"
              onClick={handlePlayMix}
              className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 hover:border-purple-300 text-slate-800 dark:text-slate-200 flex items-center justify-between shadow-2xs transition-all cursor-pointer"
            >
              <div className="text-left">
                <span className="text-[10px] font-black uppercase tracking-wider text-purple-600 dark:text-purple-400">
                  {isHindi ? "रैंडम 20" : "Mix Mode"}
                </span>
                <div className="text-xs font-black leading-tight">
                  {isHindi ? "मिक्स 20 प्रश्न" : "Play Mix (20 Qs)"}
                </div>
              </div>
              <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                <Shuffle size={14} />
              </div>
            </button>

            {/* 3. Quiz Arena */}
            <Link
              href={`/arena?topic=${encodeURIComponent(topicId)}${selectedSubjectId ? `&subject=${encodeURIComponent(selectedSubjectId)}` : ""}`}
              className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 hover:border-amber-400 text-slate-800 dark:text-slate-200 flex items-center justify-between shadow-2xs transition-all cursor-pointer"
            >
              <div className="text-left">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400">
                  {isHindi ? "कस्टम क्विज़" : "Custom Quiz"}
                </span>
                <div className="text-xs font-black leading-tight">
                  {isHindi ? "क्विज़ अखाड़ा (Arena)" : "Quiz Arena"}
                </div>
              </div>
              <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <Swords size={14} />
              </div>
            </Link>
          </div>
        )}

        {/* Task B1: Paginated Set Grid (12 per page) */}
        {loading ? (
          <div className="py-20 text-center space-y-2">
            <RefreshCw size={24} className="animate-spin mx-auto text-purple-600" />
            <p className="text-xs font-bold text-slate-400">Loading sets...</p>
          </div>
        ) : displaySets.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-xs font-bold bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800">
            {isHindi ? "इस विषय में अभी कोई सेट उपलब्ध नहीं है" : "No sets available for this subject yet"}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {isHindi ? "अभ्यास सेट्स (20 प्रश्न प्रति सेट)" : "Practice Sets (20 Qs each)"}
              </h2>
              <span className="text-xs font-black text-slate-400">
                Showing {Math.min(visibleSets.length, displaySets.length)} of {displaySets.length}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {visibleSets.map((s) => (
                <div
                  key={s.id}
                  className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 hover:border-purple-300 transition-all flex flex-col justify-between space-y-3.5 shadow-2xs"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                        <span>{s.title || (isHindi ? `सेट ${s.number}` : `Set ${s.number}`)}</span>
                        {s.completed && <CheckCircle2 size={13} className="text-emerald-500" />}
                      </span>

                      <div className="flex items-center gap-1 text-[10px] text-slate-400 font-bold">
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
                        {s.bestScore > 0 && <span>· {s.bestScore}/20</span>}
                      </div>
                    </div>

                    {/* Subject / Tags line */}
                    <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 line-clamp-1">
                      {s.subjectName || currentTitle}
                    </p>

                    {/* Rule 4 Difficulty Mix Bar (7/7/6) */}
                    <div
                      className="w-full h-1.5 rounded-full overflow-hidden flex bg-slate-100 dark:bg-slate-800 mt-2.5"
                      title={`Mix: ${s.mix?.easy || 0} Easy, ${s.mix?.medium || 0} Medium, ${s.mix?.hardExpert || 0} Hard/Expert`}
                    >
                      <div style={{ width: `${((s.mix?.easy || 0) / 20) * 100}%` }} className="bg-emerald-500 h-full" />
                      <div style={{ width: `${((s.mix?.medium || 0) / 20) * 100}%` }} className="bg-amber-500 h-full" />
                      <div style={{ width: `${((s.mix?.hardExpert || 0) / 20) * 100}%` }} className="bg-rose-500 h-full" />
                    </div>
                  </div>

                  {/* Action Row: Play (shuffled) vs Read (sheet order) vs Share */}
                  <div className="flex items-center justify-between gap-2 pt-2.5 border-t border-slate-100 dark:border-slate-800/80">
                    <button
                      type="button"
                      onClick={() => handleOpenPreview(s)}
                      disabled={loadingPreviewId === s.id}
                      className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-black transition-colors flex items-center gap-1 cursor-pointer"
                      title="Read in Sheet Order"
                    >
                      <BookOpen size={13} />
                      <span>{isHindi ? "रीड" : "Read"}</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        shareSetChallenge({
                          setId: s.id,
                          setTitle: `${currentTitle} Set ${s.number}`,
                          score: s.bestScore || undefined,
                          isHindi,
                        });
                      }}
                      className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                      title={isHindi ? "मित्र को चुनौती दें" : "Challenge a Friend"}
                    >
                      <Share2 size={13} />
                    </button>

                    <button
                      type="button"
                      onClick={() => handlePlaySet(s)}
                      className="flex-1 py-1.5 px-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-black transition-all flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                    >
                      <Play size={12} fill="currentColor" />
                      <span>{s.completed ? (isHindi ? "पुनः खेलें" : "Replay") : (isHindi ? "खेलें" : "Play")}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Load More Button (12 per page, Task B1) */}
            {displaySets.length > displayLimit && (
              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => setDisplayLimit((prev) => prev + 12)}
                  className="px-5 py-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-purple-400 text-xs font-black text-purple-600 dark:text-purple-400 shadow-2xs transition-all inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <span>{isHindi ? "और सेट्स देखें" : "Load More Sets"}</span>
                  <span className="text-[11px] text-slate-400 font-bold">
                    ({displaySets.length - displayLimit} {isHindi ? "बाकी" : "remaining"})
                  </span>
                  <ChevronDown size={14} />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Task 2.4: Single Pro Banner */}
        <ProBannerStrip />
          </>
        )}
      </div>

      {/* Set Preview / Read Mode Modal */}
      {previewModalData && (
        <SetPreviewModal
          isOpen={Boolean(previewModalData)}
          onClose={() => setPreviewModalData(null)}
          set={previewModalData.set}
          categoryTopic={previewModalData.categoryTopic}
          onStartSet={() => {
            const s = previewModalData.set;
            setPreviewModalData(null);
            handlePlaySet(s);
          }}
        />
      )}
    </div>
  );
}
