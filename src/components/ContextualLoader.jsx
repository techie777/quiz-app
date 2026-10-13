"use client";

import React from "react";
import { useLanguage } from "@/context/LanguageContext";

/**
 * ContextualLoader - Provides polite, delightful, and specific loading messages
 * across the app for data, quizzes, questions, subjects, etc.
 */
export default function ContextualLoader({
  type = "data", // 'data' | 'quiz' | 'questions' | 'subjects' | 'categories' | 'live'
  title = null,
  subtitle = null,
  compact = false,
  className = "",
}) {
  const { isHindi } = useLanguage();

  const configs = {
    subjects: {
      icon: "📚",
      defaultTitle: isHindi ? "विषय लोड हो रहे हैं..." : "Loading Subjects...",
      defaultSub: isHindi
        ? "कृपया प्रतीक्षा करें, ज्ञान और सेट्स तैयार किए जा रहे हैं..."
        : "Please wait while we prepare the subjects and sets...",
    },
    categories: {
      icon: "🗂️",
      defaultTitle: isHindi ? "श्रेणियां लोड हो रही हैं..." : "Loading Categories...",
      defaultSub: isHindi
        ? "सभी मुख्य विषय और अध्याय तैयार किए जा रहे हैं..."
        : "Preparing main categories and study topics...",
    },
    questions: {
      icon: "❓",
      defaultTitle: isHindi ? "प्रश्न तैयार किए जा रहे हैं..." : "Loading Questions...",
      defaultSub: isHindi
        ? "क्विज़ प्रश्न और विकल्प लोड हो रहे हैं..."
        : "Shuffling questions and options for your quiz...",
    },
    quiz: {
      icon: "🎯",
      defaultTitle: isHindi ? "क्विज़ लोड हो रही है..." : "Loading Quiz...",
      defaultSub: isHindi
        ? "नया अभ्यास सत्र शुरू हो रहा है, तैयार हो जाइए..."
        : "Initializing your quiz session, get ready...",
    },
    live: {
      icon: "⚔️",
      defaultTitle: isHindi ? "लाइव मुकाबला तैयार हो रहा है..." : "Connecting to Live Battle...",
      defaultSub: isHindi
        ? "लाइव रूम और खिलाड़ियों से संपर्क किया जा रहा है..."
        : "Connecting to the battle room and synchronizing players...",
    },
    data: {
      icon: "⚡",
      defaultTitle: isHindi ? "डेटा लोड हो रहा है..." : "Loading Data...",
      defaultSub: isHindi
        ? "कृपया थोड़ा इंतज़ार करें, नवीनतम जानकारी लाई जा रही है..."
        : "Fetching the latest information, please wait a moment...",
    },
  };

  const current = configs[type] || configs.data;
  const finalTitle = title || current.defaultTitle;
  const finalSub = subtitle || current.defaultSub;

  if (compact) {
    return (
      <div className={`flex items-center gap-2.5 py-3 px-4 rounded-2xl bg-indigo-50/80 dark:bg-slate-800/80 border border-indigo-150 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold animate-in fade-in duration-300 ${className}`}>
        <span className="text-base animate-bounce">{current.icon}</span>
        <div className="flex-1 min-w-0">
          <p className="font-black text-slate-900 dark:text-white truncate">{finalTitle}</p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-ping"></span>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center justify-center p-8 sm:p-12 text-center max-w-sm sm:max-w-md mx-auto my-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xl space-y-4 animate-in zoom-in-95 duration-300 ${className}`}>
      {/* Animated Glowing Icon Badge */}
      <div className="relative w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/80 flex items-center justify-center text-3xl shadow-xs">
        <span className="animate-bounce select-none">{current.icon}</span>
        <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-indigo-600 rounded-full animate-ping"></span>
      </div>

      {/* Text Hierarchy */}
      <div className="space-y-1.5">
        <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
          {finalTitle}
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed max-w-xs mx-auto">
          {finalSub}
        </p>
      </div>

      {/* Fluid Multi-dot bouncing indicator */}
      <div className="flex items-center justify-center gap-1.5 pt-1">
        <div className="w-2 h-2 rounded-full bg-indigo-600 animate-bounce" style={{ animationDelay: "0ms" }}></div>
        <div className="w-2 h-2 rounded-full bg-purple-600 animate-bounce" style={{ animationDelay: "150ms" }}></div>
        <div className="w-2 h-2 rounded-full bg-pink-600 animate-bounce" style={{ animationDelay: "300ms" }}></div>
      </div>
    </div>
  );
}
