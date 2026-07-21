"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Search,
  Eye,
  EyeOff,
  BookOpen,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";
import ReadingCard from "./ReadingCard";

export default function DigitalBookReader({
  chapter,
  subject,
  onBackToIndex,
  isHindi = false,
  allChapters = [],
  onSelectChapter,
}) {
  const [questions, setQuestions] = useState(chapter?.questions || []);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [revealAll, setRevealAll] = useState(false);
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 20;

  const chapterId = chapter?.id || chapter?.slug;
  const chapterTitle =
    isHindi && chapter?.topicHi
      ? chapter.topicHi
      : chapter?.topic || chapter?.title || "Study Chapter";
  const subjectTitle =
    isHindi && subject?.nameHi
      ? subject.nameHi
      : subject?.name || "Govt Exam Preparation";

  // Fetch full questions for the chapter if questions list is empty or partial
  useEffect(() => {
    let isMounted = true;
    
    // Always scroll to top when opening a new chapter to prevent inheriting scroll position
    if (typeof window !== 'undefined') {
      window.scrollTo(0, 0);
    }

    if (chapterId && (!chapter.questions || chapter.questions.length <= 3)) {
      setLoading(true);
      fetch(`/api/categories/${chapterId}?full=true`, { cache: "no-store" })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (isMounted && data && Array.isArray(data.questions)) {
            setQuestions(data.questions);
          }
        })
        .catch((err) => console.error("Failed to load chapter questions:", err))
        .finally(() => {
          if (isMounted) setLoading(false);
        });
    } else if (chapter?.questions) {
      setQuestions(chapter.questions);
    }
    return () => {
      isMounted = false;
    };
  }, [chapterId, chapter]);

  // Filtered questions
  const filteredQuestions = useMemo(() => {
    if (!searchTerm.trim()) return questions;
    const term = searchTerm.toLowerCase();
    return questions.filter((q) => {
      const text = (q.text || "").toLowerCase();
      const textHi = (q.textHi || "").toLowerCase();
      const optionsStr = Array.isArray(q.options)
        ? q.options.join(" ").toLowerCase()
        : "";
      return text.includes(term) || textHi.includes(term) || optionsStr.includes(term);
    });
  }, [questions, searchTerm]);

  // Pagination
  const totalPages = Math.ceil(filteredQuestions.length / ITEMS_PER_PAGE) || 1;
  const currentQuestions = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return filteredQuestions.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredQuestions, page]);

  // Find previous and next chapters
  const currentChapterIdx = allChapters.findIndex(
    (c) => (c.id || c.slug) === chapterId
  );
  const prevChapter =
    currentChapterIdx > 0 ? allChapters[currentChapterIdx - 1] : null;
  const nextChapter =
    currentChapterIdx >= 0 && currentChapterIdx < allChapters.length - 1
      ? allChapters[currentChapterIdx + 1]
      : null;

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Top Controls & Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <button
          type="button"
          onClick={onBackToIndex}
          className="inline-flex items-center gap-2 text-sm font-black text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors bg-indigo-50 dark:bg-indigo-950/80 px-4 py-2.5 rounded-2xl border border-indigo-100 dark:border-indigo-900/60"
        >
          <ArrowLeft size={16} />
          <span>{isHindi ? "अनुक्रमणिका (इंडेक्स) पर लौटें" : "Back to Index"}</span>
        </button>

        <div className="flex items-center gap-2 justify-between sm:justify-end">
          {/* Global Reveal / Hide Toggle */}
          <button
            type="button"
            onClick={() => setRevealAll(!revealAll)}
            className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-xs font-black transition-all ${
              revealAll
                ? "bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300/80 dark:border-amber-800"
                : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200/60 dark:border-slate-700"
            }`}
          >
            {revealAll ? <EyeOff size={15} /> : <Eye size={15} />}
            <span>
              {revealAll
                ? isHindi
                  ? "सभी उत्तर छिपाएं"
                  : "Hide All Answers"
                : isHindi
                ? "सभी उत्तर दिखाएं"
                : "Reveal All Answers"}
            </span>
          </button>
        </div>
      </div>

      {/* Chapter Reader Banner */}
      <div className="bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 bottom-0 translate-x-8 translate-y-8 w-48 h-48 bg-purple-500/20 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-indigo-200 text-xs font-bold mb-3 border border-white/10">
            <span>{subjectTitle}</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black tracking-tight mb-2 flex items-center gap-3">
            <span>{chapter?.emoji || "📖"}</span>
            <span>{chapterTitle}</span>
          </h1>

          <p className="text-indigo-200 text-sm font-medium">
            {isHindi
              ? `क्रमबद्ध डिजिटल अध्ययन • कुल ${questions.length} प्रश्न`
              : `Sequential Digital Study • ${questions.length} total questions available`}
          </p>

          {/* Quick Search inside chapter */}
          <div className="mt-6 relative max-w-md">
            <Search
              size={18}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-indigo-300"
            />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              placeholder={
                isHindi
                  ? "इस अध्याय में प्रश्न खोजें..."
                  : "Search questions in this chapter..."
              }
              className="w-full pl-10 pr-4 py-2.5 bg-white/10 backdrop-blur-md text-white placeholder-indigo-200/70 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 text-xs sm:text-sm"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-indigo-200 hover:text-white"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Reader Feed */}
      {loading ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-16 text-center border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <Loader2 size={40} className="mx-auto text-indigo-600 animate-spin mb-4" />
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">
            {isHindi ? "डिजिटल बुक अध्याय लोड हो रहा है..." : "Loading Digital Book Chapter..."}
          </h3>
          <p className="text-slate-500 text-sm mt-1">
            {isHindi
              ? "उच्च गुणवत्ता वाले प्रश्न एवं व्याख्याएं तैयार की जा रही हैं"
              : "Preparing study cards with clear explanations"}
          </p>
        </div>
      ) : filteredQuestions.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center border border-dashed border-slate-300 dark:border-slate-800">
          <BookOpen size={48} className="mx-auto text-indigo-400 mb-3" />
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-1">
            {isHindi ? "कोई प्रश्न नहीं मिला" : "No questions matched your search"}
          </h3>
          <p className="text-slate-500 text-sm">
            {isHindi ? "कृपया अलग शब्द खोजें।" : "Try adjusting your search filter."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2 text-xs font-bold text-slate-500 dark:text-slate-400">
            <span>
              {isHindi ? "दिखाए जा रहे हैं" : "Showing"} {(page - 1) * ITEMS_PER_PAGE + 1} -{" "}
              {Math.min(page * ITEMS_PER_PAGE, filteredQuestions.length)}{" "}
              {isHindi ? "का" : "of"} {filteredQuestions.length} {isHindi ? "प्रश्न" : "Questions"}
            </span>
            <span>
              {isHindi ? "पृष्ठ" : "Page"} {page} / {totalPages}
            </span>
          </div>

          <AnimatePresence mode="wait">
            {currentQuestions.map((q, qIdx) => {
              const globalIndex = (page - 1) * ITEMS_PER_PAGE + qIdx;
              return (
                <motion.div
                  key={q.id || globalIndex}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: qIdx * 0.03 }}
                >
                  <ReadingCard
                    key={q.id || globalIndex}
                    question={q}
                    index={globalIndex}
                    isHindi={isHindi}
                    subjectName={chapterTitle}
                    forceReveal={revealAll}
                  />
                </motion.div>
              );
            })}
          </AnimatePresence>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-6">
              <button
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
                className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 disabled:opacity-40 font-bold text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
              >
                <ChevronLeft size={18} />
              </button>

              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }).map((_, pIdx) => (
                  <button
                    key={pIdx}
                    onClick={() => setPage(pIdx + 1)}
                    className={`w-9 h-9 rounded-xl font-bold text-xs transition-all ${
                      page === pIdx + 1
                        ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                        : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200/80 dark:border-slate-800 hover:bg-slate-50"
                    }`}
                  >
                    {pIdx + 1}
                  </button>
                ))}
              </div>

              <button
                disabled={page === totalPages}
                onClick={() => setPage(page + 1)}
                className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 disabled:opacity-40 font-bold text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          )}

          {/* Bottom Next/Prev Chapter Footer */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 border-t border-slate-200/80 dark:border-slate-800">
            {prevChapter ? (
              <button
                type="button"
                onClick={() => onSelectChapter && onSelectChapter(prevChapter, subject)}
                className="w-full sm:w-auto p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-600 text-left transition-all"
              >
                <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">
                  ← {isHindi ? "पिछला अध्याय" : "Previous Chapter"}
                </span>
                <span className="text-sm font-extrabold text-slate-800 dark:text-slate-200 block">
                  {prevChapter.topic || prevChapter.title}
                </span>
              </button>
            ) : <div />}

            {nextChapter ? (
              <button
                type="button"
                onClick={() => onSelectChapter && onSelectChapter(nextChapter, subject)}
                className="w-full sm:w-auto p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-600 text-right transition-all"
              >
                <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">
                  {isHindi ? "अगला अध्याय" : "Next Chapter"} →
                </span>
                <span className="text-sm font-extrabold text-slate-800 dark:text-slate-200 block">
                  {nextChapter.topic || nextChapter.title}
                </span>
              </button>
            ) : <div />}
          </div>
        </div>
      )}

      {/* Mobile Fixed Play Quiz Button */}
      <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-t border-slate-200/80 dark:border-slate-800 shadow-[0_-4px_20px_rgba(0,0,0,0.1)] sm:hidden">
        <button
          type="button"
          onClick={() => {
            window.location.href = `/category/${chapter.slug || chapter.id}`;
          }}
          className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-lg flex justify-center items-center gap-2 shadow-xl shadow-indigo-600/30 transition-all"
        >
          <Sparkles size={20} />
          {isHindi ? "क्विज़ खेलें" : "Play Quiz"}
        </button>
      </div>
      
      {/* Spacer to prevent content from hiding behind the fixed button on mobile */}
      <div className="h-24 sm:hidden"></div>
    </div>
  );
}
