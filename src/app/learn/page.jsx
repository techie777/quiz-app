"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  LayoutGrid,
  List,
  Flame,
  TrendingUp,
  X,
  Compass,
  ArrowRight,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { useQuiz } from "@/context/QuizContext";
import SetCard, { FREE_SETS_QUOTA } from "@/components/SetCard";
import LearnCard from "@/components/LearnCard";
import styles from "@/styles/LearnPage.module.css";
import toast from "react-hot-toast";

export default function LearnDiscoveryPage() {
  const router = useRouter();
  const { isHindi } = useLanguage();
  const { startQuizSet } = useQuiz();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    subjects: [],
    todaySets: [],
    thisWeekSets: [],
    allSets: [],
    explainers: [],
    meta: { totalSets: 0, totalCategories: 0 },
  });

  const [selectedSubject, setSelectedSubject] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [viewMode, setViewMode] = useState("grid"); // "grid" (Seekho poster grid) or "row" (wide set cards)

  // Fetch Discovery Data
  useEffect(() => {
    let isMounted = true;
    async function fetchLearnData() {
      try {
        setLoading(true);
        const res = await fetch("/api/learn", { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to fetch discovery feed");
        const json = await res.json();
        if (isMounted) {
          setData(json);
        }
      } catch (err) {
        console.error("Learn feed fetch error:", err);
        toast.error(isHindi ? "डेटा लोड करने में विफल" : "Failed to load discovery feed");
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchLearnData();
    return () => {
      isMounted = false;
    };
  }, [isHindi]);

  // Instant Client-Side Filter Function (No page reload)
  const filterSetList = (setList) => {
    if (!Array.isArray(setList)) return [];
    return setList.filter((set) => {
      // 1. Filter by Subject/Category chip
      const matchesSubject =
        selectedSubject === "all" ||
        set.categoryId === selectedSubject ||
        set.categorySlug === selectedSubject;

      if (!matchesSubject) return false;

      // 2. Filter by Search Query (if any)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesTopic = (set.categoryTopic || "").toLowerCase().includes(query);
        const matchesTopicHi = (set.categoryTopicHi || "").toLowerCase().includes(query);
        const matchesSetNum = `set ${set.index}`.includes(query) || `सेट ${set.index}`.includes(query);
        const matchesQuestion = set.questions?.some((q) =>
          (q?.text || "").toLowerCase().includes(query)
        );
        return matchesTopic || matchesTopicHi || matchesSetNum || matchesQuestion;
      }

      return true;
    });
  };

  // Filtered Dated Sections
  const filteredTodaySets = useMemo(
    () => filterSetList(data.todaySets || []),
    [data.todaySets, selectedSubject, searchQuery]
  );

  const filteredThisWeekSets = useMemo(
    () => filterSetList(data.thisWeekSets || []),
    [data.thisWeekSets, selectedSubject, searchQuery]
  );

  const filteredExplainers = useMemo(() => {
    if (!Array.isArray(data.explainers)) return [];
    if (!searchQuery.trim()) return data.explainers;
    const query = searchQuery.toLowerCase().trim();
    return data.explainers.filter(
      (item) =>
        (item.title || "").toLowerCase().includes(query) ||
        (item.summary || "").toLowerCase().includes(query)
    );
  }, [data.explainers, searchQuery]);

  // Handle Play Quiz directly from feed
  const handlePlay = (set) => {
    if (!set) return;

    if (set.questions && set.questions.length > 0) {
      const topicSuffix = ` ${isHindi ? "सेट" : "Set"} ${set.index}`;
      const lang = isHindi ? "hi" : "en";
      startQuizSet(
        set.categoryId,
        set.questions,
        0,
        lang,
        set.index,
        set.categoryTopic + topicSuffix,
        true
      );
      router.push(`/quiz/${set.categorySlug || set.categoryId}`);
    } else {
      router.push(`/category/${set.categorySlug || set.categoryId}`);
    }
  };

  // Handle Live Multiplayer Play
  const handleLivePlay = (set) => {
    if (!set) return;
    const sessionId = Math.random().toString(36).substring(2, 10).toUpperCase();
    toast.success(isHindi ? "लाइव रूम तैयार किया जा रहा है..." : "Creating live room...");
    router.push(
      `/live/${sessionId}?is_host=true&categoryId=${set.categoryId}&setIndex=${set.index}`
    );
  };

  return (
    <div className={`w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 ${styles.pageWrapper}`}>
      {/* ── Top Header ── */}
      <div className="flex items-center justify-between gap-4 mb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            {isHindi ? "सीखें" : "Learn"}
          </h1>
        </div>

        {/* Top Controls: Search Input & View Toggle */}
        <div className="flex items-center gap-2">
          {/* Quick Search Bar */}
          <div className="relative">
            {isSearchOpen ? (
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={isHindi ? "सेट या विषय खोजें..." : "Search set or topic..."}
                  autoFocus
                  className="w-48 sm:w-64 pl-8 pr-8 py-2 rounded-xl text-xs sm:text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <Search size={14} className="absolute left-2.5 text-slate-400 pointer-events-none" />
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setIsSearchOpen(false);
                  }}
                  className="absolute right-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsSearchOpen(true)}
                title={isHindi ? "खोजें" : "Search"}
                className="p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-all shadow-sm"
              >
                <Search size={18} />
              </button>
            )}
          </div>

          {/* View Toggle: Poster Grid vs List Rows */}
          <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/60">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === "grid"
                  ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
              }`}
              title={isHindi ? "पोस्टर ग्रिड व्यू" : "Poster Grid View"}
            >
              <LayoutGrid size={17} />
            </button>
            <button
              onClick={() => setViewMode("row")}
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === "row"
                  ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
              }`}
              title={isHindi ? "लिस्ट व्यू" : "List Row View"}
            >
              <List size={17} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Horizontal Filter Chips ── */}
      <div className="relative mb-6">
        <div className={styles.chipScrollArea}>
          {/* "All" Filter Chip */}
          <button
            onClick={() => setSelectedSubject("all")}
            className={`${styles.filterChip} ${
              selectedSubject === "all" ? styles.filterChipActive : ""
            }`}
          >
            <span>{isHindi ? "सभी" : "All"}</span>
            <span className="text-[11px] font-black opacity-80">
              ({data.meta?.totalSets || data.allSets?.length || 0})
            </span>
          </button>

          {/* Individual Major Subject/Category Chips */}
          {data.subjects.map((sub) => {
            const isSelected = selectedSubject === sub.id || selectedSubject === sub.slug;
            const label = isHindi && sub.nameHi ? sub.nameHi : sub.name;
            return (
              <button
                key={sub.id}
                onClick={() => setSelectedSubject(sub.id)}
                className={`${styles.filterChip} ${isSelected ? styles.filterChipActive : ""}`}
              >
                <span>{sub.emoji}</span>
                <span>{label}</span>
                <span className="text-[11px] font-black opacity-75">
                  ({sub.setCount})
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Loading Skeleton State ── */}
      {loading && (
        <div className="space-y-8 animate-pulse">
          <div>
            <div className="h-6 w-32 bg-slate-200 dark:bg-slate-800 rounded-lg mb-4" />
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="aspect-[4/5] bg-slate-200 dark:bg-slate-800 rounded-2xl" />
              ))}
            </div>
          </div>
        </div>
      )}

      {!loading && (
        <div className="space-y-8">
          {/* ── Section 1: "Today" ── */}
          <section>
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center">
                  <Flame size={16} />
                </div>
                <h2 className={styles.sectionHeading}>
                  {isHindi ? "आज" : "Today"}
                </h2>
              </div>

              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                {filteredTodaySets.length} {isHindi ? "सेट्स" : "sets"}
              </span>
            </div>

            {filteredTodaySets.length > 0 ? (
              <div
                className={
                  viewMode === "grid"
                    ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4"
                    : "flex flex-col gap-3"
                }
              >
                {filteredTodaySets.map((set) => (
                  <SetCard
                    key={`today_${set.id}`}
                    set={set}
                    categoryTopic={isHindi && set.categoryTopicHi ? set.categoryTopicHi : set.categoryTopic}
                    freeQuota={FREE_SETS_QUOTA}
                    handlePlay={handlePlay}
                    handleLivePlay={handleLivePlay}
                    layout={viewMode}
                  />
                ))}
              </div>
            ) : (
              <div className="p-8 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                <p className="text-sm font-bold text-slate-500 dark:text-slate-400">
                  {isHindi
                    ? "इस श्रेणी में आज के कोई नए सेट्स नहीं हैं।"
                    : "No new sets found in this subject for today."}
                </p>
                <button
                  onClick={() => setSelectedSubject("all")}
                  className="mt-2 text-xs font-extrabold text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  {isHindi ? "सभी सेट्स देखें" : "View all sets"}
                </button>
              </div>
            )}
          </section>

          {/* ── Section 2: "This Week" ── */}
          <section>
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <TrendingUp size={16} />
                </div>
                <h2 className={styles.sectionHeading}>
                  {isHindi ? "इस सप्ताह" : "This Week"}
                </h2>
              </div>

              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                {filteredThisWeekSets.length} {isHindi ? "सेट्स" : "sets"}
              </span>
            </div>

            {filteredThisWeekSets.length > 0 ? (
              <div
                className={
                  viewMode === "grid"
                    ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4"
                    : "flex flex-col gap-3"
                }
              >
                {filteredThisWeekSets.map((set) => (
                  <SetCard
                    key={`this_week_${set.id}`}
                    set={set}
                    categoryTopic={isHindi && set.categoryTopicHi ? set.categoryTopicHi : set.categoryTopic}
                    freeQuota={FREE_SETS_QUOTA}
                    handlePlay={handlePlay}
                    handleLivePlay={handleLivePlay}
                    layout={viewMode}
                  />
                ))}
              </div>
            ) : (
              <div className="p-8 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                <p className="text-sm font-bold text-slate-500 dark:text-slate-400">
                  {isHindi
                    ? "इस श्रेणी में इस सप्ताह कोई सेट्स नहीं मिले।"
                    : "No trending sets found in this subject this week."}
                </p>
                <button
                  onClick={() => setSelectedSubject("all")}
                  className="mt-2 text-xs font-extrabold text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  {isHindi ? "सभी सेट्स देखें" : "View all sets"}
                </button>
              </div>
            )}
          </section>

          {/* ── Section 3: Lightweight LearnCards (Short Explainers) ── */}
          {filteredExplainers.length > 0 && (
            <section className="pt-4 border-t border-slate-200/80 dark:border-slate-800/80">
              <div className="flex items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                    <Compass size={16} />
                  </div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">
                    {isHindi ? "संक्षिप्त ज्ञान" : "Quick Concepts"}
                  </h3>
                </div>

                <button
                  onClick={() => router.push("/daily-current-affairs")}
                  className="text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline inline-flex items-center gap-1"
                >
                  <span>{isHindi ? "सभी देखें" : "View all"}</span>
                  <ArrowRight size={13} />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {filteredExplainers.map((explainer) => (
                  <LearnCard
                    key={explainer.id}
                    item={explainer}
                    onReadMore={() => router.push("/daily-current-affairs")}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
