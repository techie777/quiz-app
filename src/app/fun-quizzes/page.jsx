"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Search, Filter, Sparkles, ChevronDown, Lock, Clock } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { useQuiz } from "@/context/QuizContext";
import { useEntitlement } from "@/context/EntitlementContext";
import { FORMAT_CONFIG, HOT_QUIZZES_SEED } from "@/lib/hotQuizzesData";
import ProBannerStrip from "@/components/monetization/ProBannerStrip";

const FORMAT_TABS = [
  { key: "all", label: "All", labelHi: "सभी", emoji: "✨" },
  { key: "image", label: "Image", labelHi: "फोटो", emoji: "🖼️" },
  { key: "flag", label: "Flags", labelHi: "झंडे", emoji: "🚩" },
  { key: "logo", label: "Logos", labelHi: "लोगो", emoji: "🏷️" },
  { key: "map", label: "Maps", labelHi: "मानचित्र", emoji: "🗺️" },
  { key: "riddle", label: "Riddles", labelHi: "पहेलियां", emoji: "🧩" },
  { key: "fact", label: "Facts", labelHi: "तथ्य", emoji: "💡" },
];

export default function FunQuizzesPage() {
  const router = useRouter();
  const { isHindi } = useLanguage();
  const { startQuizSet } = useQuiz();
  const { isSetLocked, openLockedSheet, isPro, freeSetsPerWindow } = useEntitlement();

  const [activeFormat, setActiveFormat] = useState("all");
  const [sortOption, setSortOption] = useState("popular"); // "popular" | "new" | "alpha"
  const [searchQuery, setSearchQuery] = useState("");
  const [quizzes, setQuizzes] = useState(HOT_QUIZZES_SEED);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function fetchQuizzes() {
      try {
        setLoading(true);
        const params = new URLSearchParams({
          format: activeFormat,
          sort: sortOption,
        });
        if (searchQuery.trim()) {
          params.append("search", searchQuery.trim());
        }

        const res = await fetch(`/api/quizzes/fun?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data.quizzes) {
            setQuizzes(data.quizzes);
          }
        }
      } catch (e) {
        console.error("Fun quizzes fetch error:", e);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    const timer = setTimeout(fetchQuizzes, 200);
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [activeFormat, sortOption, searchQuery]);

  const handleQuizClick = (quiz, idx) => {
    const setIndex = (quiz.hotRank || idx + 1);
    const targetSetId = `fun-${quiz.slug || quiz.id}-${setIndex}`;
    const locked = isSetLocked ? isSetLocked(setIndex, targetSetId) : (setIndex > (freeSetsPerWindow || 2) && !isPro);

    if (locked) {
      openLockedSheet(
        {
          ...quiz,
          id: targetSetId,
          index: setIndex,
          topic: isHindi && quiz.titleHi ? quiz.titleHi : quiz.title,
        },
        () => {
          startQuiz(quiz, setIndex);
        }
      );
      return;
    }

    startQuiz(quiz, setIndex);
  };

  const startQuiz = (quiz, setIndex = 1) => {
    if (quiz.questions && quiz.questions.length > 0) {
      startQuizSet(
        quiz.slug || quiz.id,
        quiz.questions,
        30,
        isHindi ? "hi" : "en",
        setIndex,
        isHindi && quiz.titleHi ? quiz.titleHi : quiz.title,
        true
      );
    }
    router.push(`/quiz/${quiz.slug || quiz.id}?set=${setIndex}`);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 text-slate-900 dark:text-slate-50 pb-24">
      {/* Sticky Header */}
      <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => router.back()}
              className="p-2 -ml-1 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Back"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white flex items-center gap-1.5 tracking-tight">
              <span>🎉</span>
              <span>{isHindi ? "मज़ेदार क्विज़" : "Fun Quizzes"}</span>
            </h1>
          </div>

          {/* Sort Dropdown */}
          <div className="relative shrink-0">
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              className="appearance-none bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 pr-7 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer min-h-[38px]"
              aria-label="Sort quizzes"
            >
              <option value="popular">{isHindi ? "लोकप्रिय" : "Popular"}</option>
              <option value="new">{isHindi ? "नया" : "New"}</option>
              <option value="alpha">{isHindi ? "A से Z" : "A–Z"}</option>
            </select>
            <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
          </div>
        </div>

        {/* Search Bar */}
        <div className="max-w-4xl mx-auto mt-2.5 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search size={16} />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isHindi ? "मज़ेदार क्विज़ खोजें (फोटो, झंडे, पहेलियां)..." : "Search fun quizzes (images, flags, riddles)..."}
            className="w-full pl-9 pr-8 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 text-xs sm:text-sm font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
            >
              ✕
            </button>
          )}
        </div>

        {/* Sticky Filter Chips */}
        <div className="max-w-4xl mx-auto mt-3 flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
          {FORMAT_TABS.map((tab) => {
            const isSelected = activeFormat === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveFormat(tab.key)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 min-h-[34px] ${
                  isSelected
                    ? "bg-indigo-600 text-white font-black shadow-md shadow-indigo-500/20"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                }`}
              >
                <span>{tab.emoji}</span>
                <span>{isHindi ? tab.labelHi : tab.label}</span>
              </button>
            );
          })}
        </div>
      </header>

      {/* Main 2-Column Responsive Grid */}
      <main className="max-w-4xl mx-auto px-4 mt-5">
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 animate-pulse h-[200px] flex flex-col justify-between"
              >
                <div className="w-full h-[110px] rounded-xl bg-slate-200 dark:bg-slate-800" />
                <div className="w-3/4 h-3.5 rounded bg-slate-200 dark:bg-slate-800 mt-2" />
                <div className="w-1/2 h-2.5 rounded bg-slate-200 dark:bg-slate-800 mt-1" />
              </div>
            ))}
          </div>
        ) : quizzes.length === 0 ? (
          <div className="py-16 text-center">
            <span className="text-4xl">🔍</span>
            <p className="mt-3 text-sm font-bold text-slate-500 dark:text-slate-400">
              {isHindi ? "कोई क्विज़ नहीं मिला।" : "No quizzes found matching your filter."}
            </p>
            <button
              onClick={() => {
                setActiveFormat("all");
                setSearchQuery("");
              }}
              className="mt-2 text-xs font-black text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              {isHindi ? "सभी फ़िल्टर साफ़ करें" : "Clear all filters"}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
            {quizzes.map((quiz, idx) => {
              const fmt = FORMAT_CONFIG[quiz.format] || FORMAT_CONFIG.image;
              const title = isHindi && quiz.titleHi ? quiz.titleHi : quiz.title;
              const setIndex = (quiz.hotRank || idx + 1);
              const targetSetId = `fun-${quiz.slug || quiz.id}-${setIndex}`;
              const isLocked = isSetLocked ? isSetLocked(setIndex, targetSetId) : (setIndex > (freeSetsPerWindow || 2) && !isPro);

              return (
                <div
                  key={quiz.id}
                  onClick={() => handleQuizClick(quiz, idx)}
                  className={`rounded-2xl bg-white dark:bg-slate-900 border transition-all duration-200 shadow-xs hover:shadow-md cursor-pointer select-none flex flex-col justify-between overflow-hidden group ${
                    isLocked ? "border-amber-300 dark:border-amber-800/60" : ""
                  }`}
                  style={{ borderColor: isLocked ? undefined : fmt.border }}
                >
                  {/* Illustration Tile */}
                  <div
                    className="relative w-full h-[110px] sm:h-[120px] flex items-center justify-center overflow-hidden"
                    style={{ backgroundColor: fmt.tint }}
                  >
                    {quiz.coverImage ? (
                      <img
                        src={quiz.coverImage}
                        alt={title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    ) : (
                      <span className="text-4xl filter drop-shadow-xs">{quiz.emoji || fmt.emoji}</span>
                    )}

                    {/* Format Badge */}
                    <span
                      className="absolute top-2 left-2 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider backdrop-blur-md shadow-2xs"
                      style={{
                        backgroundColor: "rgba(255, 255, 255, 0.92)",
                        color: fmt.textCol,
                      }}
                    >
                      {isHindi ? fmt.labelHi : fmt.badge}
                    </span>

                    {/* Lock Badge if locked */}
                    {isLocked && (
                      <div className="absolute top-2 right-2 p-1.5 rounded-xl bg-amber-500 text-white shadow-md">
                        <Lock size={12} strokeWidth={2.5} />
                      </div>
                    )}
                  </div>

                  {/* Body Details */}
                  <div className="p-3 flex flex-col justify-between flex-1 gap-2">
                    <h3 className="text-xs sm:text-sm font-black text-slate-800 dark:text-slate-100 line-clamp-2 leading-snug group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {title}
                    </h3>

                    <div className="flex items-center justify-between mt-auto pt-1">
                      <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                        {quiz.questionCount || 20} {isHindi ? "प्रश्न" : "Qs"}
                      </span>

                      {isLocked ? (
                        <span className="text-[10px] font-black text-amber-600 dark:text-amber-400 flex items-center gap-0.5">
                          <Lock size={10} /> AD
                        </span>
                      ) : (
                        <span className="text-[11px] font-black text-indigo-600 dark:text-indigo-400">
                          {isHindi ? "खेलें →" : "Play →"}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pro Banner Strip */}
        <div className="mt-8">
          <ProBannerStrip />
        </div>
      </main>
    </div>
  );
}
