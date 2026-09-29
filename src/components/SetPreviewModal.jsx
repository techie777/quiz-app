"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Search,
  Eye,
  Play,
  Heart,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import toast from "react-hot-toast";

export default function SetPreviewModal({
  isOpen,
  onClose,
  set,
  categoryTopic = "",
  onStartSet,
  favouriteIds = [],
  onToggleFav,
}) {
  const { isHindi } = useLanguage();
  const [search, setSearch] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState("all");
  const [expandedIndex, setExpandedIndex] = useState(null);

  const questions = set?.questions || [];
  const setIndex = set?.index || 1;
  const setTitle = `${categoryTopic} ${isHindi ? "सेट" : "Set"} ${setIndex}`;

  // Filter questions by search query and difficulty
  const filteredQuestions = useMemo(() => {
    return questions.filter((q) => {
      // 1. Difficulty filter
      if (selectedDifficulty !== "all") {
        const rawDiff = String(q.difficulty || "medium").toLowerCase();
        const diffNum = q.difficulty_level;
        if (selectedDifficulty === "easy" && rawDiff !== "easy" && diffNum !== 1) return false;
        if (selectedDifficulty === "medium" && rawDiff !== "medium" && diffNum !== 2) return false;
        if (selectedDifficulty === "hard" && rawDiff !== "hard" && diffNum !== 3) return false;
        if (selectedDifficulty === "expert" && rawDiff !== "expert" && diffNum !== 4) return false;
      }

      // 2. Search filter
      if (search.trim()) {
        const query = search.toLowerCase().trim();
        const textEn = (q.text || q.question || "").toLowerCase();
        const textHi = (q.textHi || q.text_hi || "").toLowerCase();
        return textEn.includes(query) || textHi.includes(query);
      }

      return true;
    });
  }, [questions, selectedDifficulty, search]);

  if (!isOpen || !set) return null;

  const toggleExpand = (idx) => {
    setExpandedIndex((prev) => (prev === idx ? null : idx));
  };

  const getDifficultyBadge = (q) => {
    const rawDiff = String(q?.difficulty || "medium").toLowerCase();
    const isEasy = rawDiff === "easy" || q?.difficulty_level === 1;
    const isHard = rawDiff === "hard" || q?.difficulty_level === 3;
    const isExpert = rawDiff === "expert" || q?.difficulty_level === 4;

    if (isExpert) {
      return {
        label: isHindi ? "विशेषज्ञ" : "Expert",
        style: "bg-[#EDE9FE] text-[#7C3AED] border-[#C4B5FD]",
      };
    }
    if (isEasy) {
      return {
        label: isHindi ? "सरल" : "Easy",
        style: "bg-[#DCFCE7] text-[#16A34A] border-[#86EFAC]",
      };
    }
    if (isHard) {
      return {
        label: isHindi ? "कठिन" : "Hard",
        style: "bg-[#FEE2E2] text-[#DC2626] border-[#FCA5A5]",
      };
    }
    return {
      label: isHindi ? "मध्यम" : "Medium",
      style: "bg-[#FEF3C7] text-[#D97706] border-[#FDE68A]",
    };
  };

  return (
    <div
      className="fixed inset-0 z-[10000] flex flex-col justify-end sm:justify-center p-0 sm:p-4 bg-slate-950/60 backdrop-blur-sm select-none"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-2xl bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col max-h-[88vh] sm:max-h-[85vh] overflow-hidden mx-auto"
      >
        {/* Sticky Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-100 dark:border-indigo-900/40">
                <Eye size={20} />
              </div>
              <div className="min-w-0">
                <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white truncate">
                  {setTitle}
                </h2>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                    {questions.length} {isHindi ? "प्रश्न" : "Questions"}
                  </span>
                  <span className="text-slate-300 dark:text-slate-700">·</span>
                  <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                    {isHindi ? "प्रिव्यू व अध्ययन मोड" : "Preview & Study Mode"}
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-800 dark:text-slate-300 flex items-center justify-center transition-colors shrink-0"
              aria-label="Close"
            >
              <X size={16} />
            </button>
          </div>

          {/* Search + Difficulty Filter Bar */}
          <div className="space-y-2.5">
            <div className="relative w-full">
              <Search
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={
                  isHindi
                    ? "इस सेट में प्रश्न खोजें..."
                    : "Search question text within this set..."
                }
                className="w-full pl-9 pr-8 py-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 text-xs sm:text-sm font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Difficulty Filter Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              {[
                { id: "all", label: isHindi ? "सभी" : "All" },
                { id: "easy", label: isHindi ? "सरल" : "Easy" },
                { id: "medium", label: isHindi ? "मध्यम" : "Medium" },
                { id: "hard", label: isHindi ? "कठिन" : "Hard" },
                { id: "expert", label: isHindi ? "विशेषज्ञ" : "Expert" },
              ].map((diff) => (
                <button
                  key={diff.id}
                  type="button"
                  onClick={() => setSelectedDifficulty(diff.id)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                    selectedDifficulty === diff.id
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                  }`}
                >
                  {diff.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Scrollable Questions List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-2.5 divide-y divide-slate-100 dark:divide-slate-800/80">
          {filteredQuestions.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs font-bold">
              {isHindi ? "कोई प्रश्न नहीं मिला" : "No questions match your filter"}
            </div>
          ) : (
            filteredQuestions.map((q, idx) => {
              const diff = getDifficultyBadge(q);
              const isExpanded = expandedIndex === idx;
              const qText = isHindi && (q.textHi || q.text_hi) ? q.textHi || q.text_hi : q.text || q.question;
              const options = isHindi && q.optionsHi && q.optionsHi.length > 0 ? q.optionsHi : q.options || q.options_list || [];
              const correctAns = String(isHindi && q.correctAnswerHi ? q.correctAnswerHi : q.correctAnswer || "").trim();
              const isFav = favouriteIds.includes(q.id || q._id);

              return (
                <div
                  key={q.id || q._id || idx}
                  className={`pt-2.5 first:pt-0 transition-colors ${
                    isExpanded ? "bg-slate-50/80 dark:bg-slate-800/30 -mx-2 px-2 rounded-2xl" : ""
                  }`}
                >
                  <div
                    onClick={() => toggleExpand(idx)}
                    className="flex items-start justify-between gap-3 cursor-pointer py-1.5"
                  >
                    <div className="flex items-start gap-2.5 min-w-0 flex-1">
                      {/* Number badge */}
                      <span className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-black flex items-center justify-center shrink-0 mt-0.5">
                        {idx + 1}
                      </span>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          {/* Difficulty Chip */}
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${diff.style}`}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-current" />
                            <span>{diff.label}</span>
                          </span>

                          <span className="text-[10px] font-semibold text-slate-400">
                            {isExpanded
                              ? isHindi
                                ? "विकल्प छुपाएं"
                                : "Tap to collapse"
                              : isHindi
                              ? "उत्तर देखें"
                              : "Tap to see answer"}
                          </span>
                        </div>

                        {/* Question text */}
                        <div className="flex items-start gap-2">
                          {(q.media?.url || q.image) && (
                            <div className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-slate-800 overflow-hidden border border-slate-200 dark:border-slate-700 shrink-0 mt-0.5 shadow-2xs">
                              <img src={q.media?.url || q.image} alt="Thumb" className="w-full h-full object-cover" loading="lazy" />
                            </div>
                          )}
                          <p
                            className={`text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 leading-snug flex-1 ${
                              isExpanded ? "" : "line-clamp-2"
                            }`}
                          >
                            {qText}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Right: Heart + Expand Chevron */}
                    <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => onToggleFav?.(q)}
                        className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                          isFav
                            ? "text-rose-500 bg-rose-50 dark:bg-rose-950/40"
                            : "text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                        }`}
                        title={isHindi ? "पसंदीदा बनाएं" : "Favourite"}
                      >
                        <Heart size={14} fill={isFav ? "currentColor" : "none"} />
                      </button>

                      <button
                        type="button"
                        onClick={() => toggleExpand(idx)}
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1"
                      >
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </button>
                    </div>
                  </div>

                  {/* Expanded Study/Preview Mode: Options with Correct Answer in Green */}
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-2.5 pb-2 pl-8 sm:pl-9 pr-2 space-y-1.5"
                    >
                      {options.map((opt, optIdx) => {
                        const optText = String(opt).trim();
                        const isCorrect =
                          optText === correctAns ||
                          (typeof q.correct_index === "number" && optIdx === q.correct_index);

                        return (
                          <div
                            key={optIdx}
                            className={`p-2 sm:p-2.5 rounded-xl border text-xs flex items-center justify-between gap-2 ${
                              isCorrect
                                ? "bg-emerald-50 dark:bg-emerald-950/50 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 font-bold"
                                : "bg-white dark:bg-slate-800/60 border-slate-200/80 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span
                                className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-black ${
                                  isCorrect
                                    ? "bg-emerald-600 text-white"
                                    : "bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300"
                                }`}
                              >
                                {["A", "B", "C", "D"][optIdx] || optIdx + 1}
                              </span>
                              <span>{optText}</span>
                            </div>

                            {isCorrect && (
                              <span className="flex items-center gap-1 text-[11px] font-extrabold text-emerald-600 dark:text-emerald-400 shrink-0">
                                <CheckCircle2 size={13} />
                                <span>{isHindi ? "सही उत्तर" : "Correct"}</span>
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </motion.div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Sticky Bottom Bar CTA: "Start this set" */}
        <div className="p-3 sm:p-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
          <div className="text-xs font-bold text-slate-600 dark:text-slate-300 truncate">
            {isHindi ? "तैयार हैं? अभी टेस्ट दें:" : "Ready to play this set?"}
          </div>

          <button
            type="button"
            onClick={() => {
              onClose();
              onStartSet?.(set);
            }}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-indigo-600/25 flex items-center gap-2 transition-all active:scale-95 shrink-0"
          >
            <Play size={14} fill="currentColor" />
            <span>{isHindi ? "यह सेट शुरू करें" : "Start This Set"}</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}
