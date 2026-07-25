"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
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
import { useQuiz } from "@/context/QuizContext";

const chapterQuestionsCache = new Map();

export default function DigitalBookReader({
  chapter,
  subject,
  onBackToIndex,
  isHindi = false,
  allChapters = [],
  onSelectChapter,
  initialPage = 1,
}) {
  const router = useRouter();
  const { startQuizSet } = useQuiz();
  const [questions, setQuestions] = useState(chapter?.questions || []);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [revealAll, setRevealAll] = useState(false);
  const [page, setPage] = useState(initialPage);

  // Fetch full questions for the chapter if questions list is empty or partial
  useEffect(() => {
    let isMounted = true;
    
    // Always scroll to the reader component to prevent inheriting scroll position or showing the global header
    if (typeof window !== 'undefined') {
      setTimeout(() => {
        const readerEl = document.getElementById("reader-feed-top");
        if (readerEl) {
          const yOffset = -20;
          const y = readerEl.getBoundingClientRect().top + window.scrollY + yOffset;
          window.scrollTo({ top: y, behavior: 'smooth' });
        } else {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }, 50);
    }

    if (chapterId) {
      if (chapterQuestionsCache.has(chapterId)) {
        setQuestions(chapterQuestionsCache.get(chapterId));
        setLoading(false);
      } else if (!chapter.questions || chapter.questions.length <= 3) {
        setLoading(true);
        fetch(`/api/categories/${chapterId}?full=true`)
          .then((res) => (res.ok ? res.json() : null))
          .then((data) => {
            if (isMounted && data && Array.isArray(data.questions)) {
              chapterQuestionsCache.set(chapterId, data.questions);
              setQuestions(data.questions);
            }
          })
          .catch((err) => console.error("Failed to load chapter questions:", err))
          .finally(() => {
            if (isMounted) setLoading(false);
          });
      } else if (chapter?.questions) {
        chapterQuestionsCache.set(chapterId, chapter.questions);
        setQuestions(chapter.questions);
      }
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

  const [showSetModal, setShowSetModal] = useState(false);

  const quizSets = useMemo(() => {
    if (!questions || questions.length === 0) return [];
    const count = questions.length;
    const result = [];
    for (let i = 0; i < count; i += ITEMS_PER_PAGE) {
      const setIdx = result.length + 1;
      result.push({
        index: setIdx,
        start: i + 1,
        end: Math.min(i + ITEMS_PER_PAGE, count),
        questions: questions.slice(i, i + ITEMS_PER_PAGE),
      });
    }
    return result;
  }, [questions, ITEMS_PER_PAGE]);

  const handleLaunchSet = (setObj) => {
    const localizedQuestions = setObj.questions.map((q) => {
      if (isHindi && q.textHi) {
        return {
          ...q,
          text: q.textHi,
          options: q.optionsHi && q.optionsHi.length > 0 ? q.optionsHi : q.options,
          explanation: q.explanationHi || q.explanation,
        };
      }
      return q;
    });

    startQuizSet(
      subject?.id || "quiz",
      localizedQuestions,
      localizedQuestions.length * 20,
      isHindi ? "hi" : "en",
      `${chapterId}_set_${setObj.index}`,
      `${subjectTitle} - ${chapterTitle} (Set ${setObj.index})`,
      true
    );
    setShowSetModal(false);
    const activeSlug = chapterId || subject?.slug || subject?.id || "quiz";
    router.push(`/quiz/${activeSlug}?set=${setObj.index}`);
  };

  // Sync URL params dynamically in Read Mode when page changes
  useEffect(() => {
    if (chapterId && page && typeof window !== 'undefined' && window.location.pathname === '/quizzes') {
      const newUrl = `/quizzes?mode=read&cat=${encodeURIComponent(chapterId)}&set=${page}`;
      if (window.location.search !== `?mode=read&cat=${encodeURIComponent(chapterId)}&set=${page}`) {
        window.history.replaceState(null, "", newUrl);
      }
    }
  }, [chapterId, page]);

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
    <div id="digital-book-reader" className="w-full max-w-4xl mx-auto space-y-6">
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

        <div className="flex items-center gap-2 justify-between sm:justify-end flex-wrap">
          {/* Select Set to Play Button */}
          <button
            type="button"
            disabled={questions.length === 0 || loading}
            onClick={() => setShowSetModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-xs font-black bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/20 hover:scale-105 transition-all cursor-pointer disabled:opacity-50"
          >
            <Sparkles size={15} />
            <span>{isHindi ? "क्विज़ खेलें (सेट चुनें)" : "Play Quiz (Select Set)"}</span>
          </button>

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

      {/* Chapter Theory & Study Notes Section */}
      {(chapter?.storyText || chapter?.storyImage || chapter?.description) && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-indigo-100 dark:border-slate-800 shadow-md">
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-black text-sm uppercase tracking-wider mb-3">
            <BookOpen size={18} />
            <span>{isHindi ? "अध्याय सिद्धांत एवं व्याख्याएं (Chapter Theory & Study Notes)" : "Chapter Theory & Study Notes"}</span>
          </div>

          {chapter?.storyImage && (
            <img
              src={chapter.storyImage}
              alt={chapterTitle}
              className="w-full max-h-72 object-cover rounded-2xl mb-4 border border-slate-200 dark:border-slate-800"
            />
          )}

          {chapter?.storyText ? (
            <div className="prose dark:prose-invert max-w-none text-slate-700 dark:text-slate-300 text-sm sm:text-base leading-relaxed whitespace-pre-line font-medium bg-slate-50 dark:bg-slate-950/60 p-5 rounded-2xl border border-slate-100 dark:border-slate-800">
              {chapter.storyText}
            </div>
          ) : chapter?.description ? (
            <p className="text-slate-600 dark:text-slate-400 text-sm font-medium">
              {isHindi && chapter.descriptionHi ? chapter.descriptionHi : chapter.description}
            </p>
          ) : null}
        </div>
      )}

      {/* Reader Feed */}
      <div id="reader-feed-top" className="scroll-mt-6" />
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
                onClick={() => {
                  setPage(page - 1);
                  setTimeout(() => {
                    const readerEl = document.getElementById("reader-feed-top");
                    if (readerEl) {
                      const y = readerEl.getBoundingClientRect().top + window.scrollY - 20;
                      window.scrollTo({ top: y, behavior: 'smooth' });
                    }
                  }, 50);
                }}
                className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 disabled:opacity-40 font-bold text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
              >
                <ChevronLeft size={18} />
              </button>

              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }).map((_, pIdx) => (
                  <button
                    key={pIdx}
                    onClick={() => {
                      setPage(pIdx + 1);
                      setTimeout(() => {
                        const readerEl = document.getElementById("reader-feed-top");
                        if (readerEl) {
                          const y = readerEl.getBoundingClientRect().top + window.scrollY - 20;
                          window.scrollTo({ top: y, behavior: 'smooth' });
                        }
                      }, 50);
                    }}
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
                onClick={() => {
                  setPage(page + 1);
                  setTimeout(() => {
                    const readerEl = document.getElementById("reader-feed-top");
                    if (readerEl) {
                      const y = readerEl.getBoundingClientRect().top + window.scrollY - 20;
                      window.scrollTo({ top: y, behavior: 'smooth' });
                    }
                  }, 50);
                }}
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

      {/* Fixed Play Quiz Button (Mobile & Desktop) */}
      <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-t border-slate-200/80 dark:border-slate-800 shadow-[0_-4px_20px_rgba(0,0,0,0.1)] flex justify-center">
        <button
          type="button"
          disabled={questions.length === 0 || loading}
          onClick={() => setShowSetModal(true)}
          className="w-full max-w-md py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-black text-lg flex justify-center items-center gap-2 shadow-xl shadow-indigo-600/30 transition-all"
        >
          <Sparkles size={20} />
          {isHindi ? "क्विज़ खेलें (सेट चुनें)" : "Play Quiz (Select Set)"}
        </button>
      </div>
      
      {/* Spacer to prevent content from hiding behind the fixed button */}
      <div className="h-24"></div>

      {/* Set Selection Modal */}
      <AnimatePresence>
        {showSetModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-sm"
            onClick={() => setShowSetModal(false)}
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0, y: 8 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.96, opacity: 0, y: 8 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-5 max-w-md w-full shadow-xl space-y-4 max-h-[85vh] flex flex-col"
            >
              {/* Modal Header */}
              <div className="flex items-start justify-between pb-3 border-b border-slate-100 dark:border-slate-800/80">
                <div className="space-y-0.5">
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 tracking-tight">
                    <span className="text-indigo-500">🎯</span>
                    <span>{isHindi ? "क्विज़ सेट चुनें" : "Select Quiz Set"}</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    {chapterTitle} • {questions.length} {isHindi ? "प्रश्न" : "Questions"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowSetModal(false)}
                  className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 flex items-center justify-center text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* Sets List */}
              <div className="overflow-y-auto pr-0.5 space-y-2.5 flex-1 custom-scrollbar">
                {quizSets.map((setObj) => {
                  const isCurrentReadPage = setObj.index === page;
                  return (
                    <div
                      key={setObj.index}
                      onClick={() => handleLaunchSet(setObj)}
                      className={`group p-3 sm:p-3.5 rounded-xl border transition-all duration-150 cursor-pointer flex items-center justify-between gap-3 ${
                        isCurrentReadPage
                          ? "bg-indigo-50/60 dark:bg-indigo-950/40 border-indigo-300/80 dark:border-indigo-800/80 shadow-xs ring-1 ring-indigo-500/20"
                          : "bg-slate-50/40 dark:bg-slate-800/40 border-slate-200/70 dark:border-slate-800 hover:border-indigo-400/60 hover:bg-slate-50 dark:hover:bg-slate-800/60"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center font-bold text-xs flex-shrink-0 transition-transform group-hover:scale-105 ${
                          isCurrentReadPage 
                            ? "bg-indigo-600 text-white shadow-xs shadow-indigo-600/30" 
                            : "bg-slate-200/80 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                        }`}>
                          {setObj.index}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                              {isHindi ? `सेट ${setObj.index}` : `Set ${setObj.index}`}
                            </span>
                            {isCurrentReadPage && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 text-[9px] font-bold uppercase tracking-wider border border-indigo-200/50 dark:border-indigo-800/60">
                                {isHindi ? "वर्तमान पृष्ठ" : "Current Page"}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate mt-0.5">
                            {isHindi ? `प्रश्न #${setObj.start} - #${setObj.end}` : `Questions #${setObj.start} to #${setObj.end}`} ({setObj.questions.length} Qs)
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all flex items-center gap-1 shadow-xs flex-shrink-0 group-hover:translate-x-0.5"
                      >
                        <span>{isHindi ? "खेलें" : "Play"}</span>
                        <span className="text-[10px]">→</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
