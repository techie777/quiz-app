"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Flame, Heart } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { useQuiz } from "@/context/QuizContext";
import { FORMAT_CONFIG, HOT_QUIZZES_SEED } from "@/lib/hotQuizzesData";
import { isQuestionFavourited, toggleQuestionFavourite } from "@/lib/favouritesHelper";

export default function HotQuizzesRow() {
  const router = useRouter();
  const { isHindi } = useLanguage();
  const { startQuizSet } = useQuiz();
  const [quizzes, setQuizzes] = useState(HOT_QUIZZES_SEED);
  const [loading, setLoading] = useState(true);
  const [imgErrors, setImgErrors] = useState({});

  useEffect(() => {
    let isMounted = true;
    async function loadHotQuizzes() {
      try {
        const res = await fetch("/api/quizzes/hot");
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data.quizzes && data.quizzes.length > 0) {
            setQuizzes(data.quizzes);
          }
        }
      } catch (err) {
        console.error("Failed to load hot quizzes:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadHotQuizzes();
    return () => {
      isMounted = false;
    };
  }, []);

  // Empty state: Hide the whole row if there are no hot quizzes
  if (!loading && (!quizzes || quizzes.length === 0)) {
    return null;
  }

  const handleCardClick = (quiz) => {
    if (quiz.questions && quiz.questions.length > 0) {
      startQuizSet(
        quiz.slug || quiz.id,
        quiz.questions,
        30,
        isHindi ? "hi" : "en",
        1,
        isHindi && quiz.titleHi ? quiz.titleHi : quiz.title,
        true
      );
      router.push(`/quiz/${quiz.slug || quiz.id}?set=1`);
    } else {
      router.push(`/quiz/${quiz.slug || quiz.id}?set=1`);
    }
  };

  return (
    <section className="w-full mb-3" aria-label={isHindi ? "हॉट क्विज़" : "Hot Quizzes"}>
      {/* Header */}
      <div className="flex items-center justify-between px-1 mb-2.5">
        <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-1.5 tracking-tight">
          <span>🔥</span>
          <span>{isHindi ? "हॉट क्विज़" : "Hot Quizzes"}</span>
        </h2>
        <Link
          href="/fun-quizzes"
          className="text-xs sm:text-sm font-black text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1 transition-colors"
        >
          <span>{isHindi ? "सभी देखें" : "See all"}</span>
          <ArrowRight size={13} strokeWidth={2.5} />
        </Link>
      </div>

      {/* Row with CSS Scroll-Snap */}
      <div
        className="flex items-stretch gap-3 overflow-x-auto no-scrollbar py-1 px-1 -mx-1"
        style={{
          scrollSnapType: "x mandatory",
          WebkitOverflowScrolling: "touch",
        }}
      >
        {loading
          ? Array.from({ length: 4 }).map((_, idx) => (
              <div
                key={idx}
                className="w-[140px] h-[165px] rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 shrink-0 animate-pulse flex flex-col justify-between"
                style={{ scrollSnapAlign: "start" }}
              >
                <div className="w-full h-[90px] rounded-xl bg-slate-200 dark:bg-slate-800" />
                <div className="w-3/4 h-3 rounded bg-slate-200 dark:bg-slate-800 mt-2" />
                <div className="w-1/2 h-2.5 rounded bg-slate-200 dark:bg-slate-800 mt-1" />
              </div>
            ))
          : quizzes.slice(0, 8).map((quiz) => {
              const fmt = FORMAT_CONFIG[quiz.format] || FORMAT_CONFIG.image;
              const title = isHindi && quiz.titleHi ? quiz.titleHi : quiz.title;
              const formatBadge = isHindi ? fmt.labelHi : fmt.badge;
              const hasImgError = Boolean(imgErrors[quiz.id]);

              return (
                <div
                  key={quiz.id}
                  onClick={() => handleCardClick(quiz)}
                  className="w-[140px] shrink-0 rounded-2xl bg-white dark:bg-slate-900 border transition-all duration-200 shadow-xs hover:shadow-md cursor-pointer select-none flex flex-col justify-between overflow-hidden group"
                  style={{
                    scrollSnapAlign: "start",
                    borderColor: fmt.border,
                  }}
                >
                  {/* Top Illustration Tile (140 x 90 px) */}
                  <div
                    className="relative w-full h-[88px] flex items-center justify-center overflow-hidden"
                    style={{ backgroundColor: fmt.tint }}
                  >
                    {/* Always render the format tint background with large emoji */}
                    <span className="text-3xl filter drop-shadow-xs select-none">
                      {quiz.emoji || fmt.emoji}
                    </span>

                    {/* Cover image layered on top: unmounted if failed or absent */}
                    {quiz.coverImage && !hasImgError && (
                      <img
                        src={quiz.coverImage}
                        alt=""
                        aria-hidden="true"
                        onError={() => setImgErrors((prev) => ({ ...prev, [quiz.id]: true }))}
                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    )}
                    <span className="sr-only">{title}</span>

                    {/* Corner Format Badge */}
                    <span
                      className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider backdrop-blur-md shadow-2xs"
                      style={{
                        backgroundColor: "rgba(255, 255, 255, 0.9)",
                        color: fmt.textCol,
                      }}
                    >
                      {formatBadge}
                    </span>
                  </div>

                  {/* Body Content */}
                  <div className="p-2 flex flex-col justify-between flex-1 gap-1.5">
                    <h3
                      className="text-xs font-black text-slate-800 dark:text-slate-100 line-clamp-2 leading-snug group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors"
                      title={title}
                    >
                      {title}
                    </h3>

                    {/* Footer chip with Q count */}
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                        {quiz.questionCount || 20} {isHindi ? "प्रश्न" : "Qs"}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
      </div>
    </section>
  );
}
