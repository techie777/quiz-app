"use client";

import React from "react";
import { Play, Sparkles, BookOpen, Layers, X, Zap, ChevronRight, CheckCircle2 } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

export default function QuizModeSelectModal({
  isOpen,
  onClose,
  set,
  categoryTopic = "",
  onSelectMode, // (mode: 'quiz' | 'flashcard' | 'read', set) => void
}) {
  const { isHindi } = useLanguage();

  if (!isOpen || !set) return null;

  const setIndex = set.index || 1;
  const qCount = set.questions?.length || 20;

  const handleModeClick = (mode) => {
    onSelectMode?.(mode, set);
  };

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="mode-modal-title"
    >
      <div
        className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl relative flex flex-col gap-5 overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-100 flex items-center justify-center transition-colors"
          aria-label="Close"
        >
          <X size={16} />
        </button>

        {/* Modal Header */}
        <div className="flex items-start gap-3.5 pr-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 text-white flex items-center justify-center text-2xl shadow-md shadow-indigo-500/25 shrink-0">
            🎯
          </div>
          <div>
            <h2 id="mode-modal-title" className="text-lg sm:text-xl font-black text-slate-900 dark:text-white leading-tight">
              {isHindi ? "सीखने का तरीका चुनें" : "Choose Learning Mode"}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              {categoryTopic} • {isHindi ? `सेट ${setIndex}` : `Set ${setIndex}`} ({qCount} {isHindi ? "प्रश्न" : "Questions"})
            </p>
          </div>
        </div>

        {/* 3 Learning Mode Cards */}
        <div className="flex flex-col gap-3">
          {/* 1. QUIZ MODE */}
          <button
            type="button"
            onClick={() => handleModeClick("quiz")}
            className="w-full text-left p-4 rounded-2xl border-2 border-indigo-500/30 hover:border-indigo-600 bg-gradient-to-r from-indigo-50/60 to-purple-50/40 dark:from-indigo-950/30 dark:to-purple-950/20 hover:shadow-md transition-all flex items-center justify-between gap-3 group active:scale-[0.99]"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-11 h-11 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/30 shrink-0 group-hover:scale-105 transition-transform">
                <Play size={20} fill="currentColor" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
                    {isHindi ? "🎯 क्विज़ मोड (Quiz Mode)" : "🎯 Timed Quiz Mode"}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-600 text-white">
                    {isHindi ? "लोकप्रिय" : "Popular"}
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-1">
                  {isHindi
                    ? "समय सीमा, लाइव स्कोर, स्ट्रीक और 4 विकल्पों के साथ खेलें"
                    : "Interactive 4-choice timed test with XP, streaks & mascot reactions"}
                </p>
              </div>
            </div>
            <ChevronRight size={18} className="text-indigo-600 dark:text-indigo-400 group-hover:translate-x-1 transition-transform shrink-0" />
          </button>

          {/* 2. FLASHCARDS MODE */}
          <button
            type="button"
            onClick={() => handleModeClick("flashcard")}
            className="w-full text-left p-4 rounded-2xl border-2 border-purple-500/30 hover:border-purple-600 bg-gradient-to-r from-purple-50/60 to-pink-50/40 dark:from-purple-950/30 dark:to-pink-950/20 hover:shadow-md transition-all flex items-center justify-between gap-3 group active:scale-[0.99]"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-11 h-11 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-md shadow-purple-600/30 shrink-0 group-hover:scale-105 transition-transform">
                <Layers size={20} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
                    {isHindi ? "🗂️ फ़्लैशकार्ड्स मोड (Flashcards)" : "🗂️ Flashcards Mode"}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-100 text-purple-700 dark:bg-purple-900/60 dark:text-purple-300">
                    {isHindi ? "स्मरण" : "Memory"}
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-1">
                  {isHindi
                    ? "3D फ्लिप कार्ड्स — टैप करके उत्तर देखें और तेजी से याद करें"
                    : "Tap to flip & reveal answer, swipe cards at your own comfortable pace"}
                </p>
              </div>
            </div>
            <ChevronRight size={18} className="text-purple-600 dark:text-purple-400 group-hover:translate-x-1 transition-transform shrink-0" />
          </button>

          {/* 3. READ MODE */}
          <button
            type="button"
            onClick={() => handleModeClick("read")}
            className="w-full text-left p-4 rounded-2xl border-2 border-emerald-500/30 hover:border-emerald-600 bg-gradient-to-r from-emerald-50/60 to-teal-50/40 dark:from-emerald-950/30 dark:to-teal-950/20 hover:shadow-md transition-all flex items-center justify-between gap-3 group active:scale-[0.99]"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-11 h-11 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/30 shrink-0 group-hover:scale-105 transition-transform">
                <BookOpen size={20} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
                    {isHindi ? "📖 रीड मोड (Read Mode)" : "📖 Full Read Mode"}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300">
                    {isHindi ? "अध्ययन" : "Study"}
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-1">
                  {isHindi
                    ? "सभी प्रश्न, उत्तर और विस्तृत व्याख्याएं एक साथ पढ़ें"
                    : "Complete question list with instant answers, explanations & search filter"}
                </p>
              </div>
            </div>
            <ChevronRight size={18} className="text-emerald-600 dark:text-emerald-400 group-hover:translate-x-1 transition-transform shrink-0" />
          </button>
        </div>

        {/* Footer tip */}
        <div className="text-center pt-1 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400">
          💡 {isHindi ? "आप बाद में कभी भी ऊपर दिए गए स्विच से मोड बदल सकते हैं।" : "You can switch between modes at any time while practicing."}
        </div>
      </div>
    </div>
  );
}
