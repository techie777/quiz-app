"use client";

import React from "react";
import { motion } from "framer-motion";
import { BookOpen, Zap } from "lucide-react";

export default function ExamModeSwitcher({ mode = "quiz", onModeChange, isHindi = false, compact = false }) {
  return (
    <div className={`w-full mx-auto p-1.5 bg-slate-100/90 dark:bg-slate-800/90 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-inner flex items-center relative gap-1.5 ${compact ? 'max-w-md my-0' : 'max-w-xl my-4'}`}>
      {/* Quiz Mode Button */}
      <button
        type="button"
        onClick={() => onModeChange("quiz")}
        className={`relative flex-1 ${compact ? 'py-2 px-3.5 rounded-xl text-xs sm:text-sm' : 'py-3 px-5 rounded-xl text-sm sm:text-base'} font-black flex items-center justify-center gap-2 transition-all duration-200 z-10 ${
          mode === "quiz"
            ? "text-white drop-shadow-sm"
            : "text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-300"
        }`}
      >
        {mode === "quiz" && (
          <motion.div
            layoutId="activeExamModeIndicator"
            className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-violet-600 rounded-xl shadow-lg shadow-indigo-500/30"
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            style={{ zIndex: -1 }}
          />
        )}
        <Zap size={16} className={mode === "quiz" ? "text-amber-300 fill-amber-300" : "text-slate-400"} />
        <span>
          {isHindi ? "🎯 क्विज़ मोड" : "🎯 Quiz Mode"}
          <span className="hidden sm:inline opacity-90 text-[11px] ml-1">{isHindi ? "(अभ्यास)" : "(Practice)"}</span>
        </span>
      </button>

      {/* Read Mode Button */}
      <button
        type="button"
        onClick={() => onModeChange("read")}
        className={`relative flex-1 ${compact ? 'py-2 px-3.5 rounded-xl text-xs sm:text-sm' : 'py-3 px-5 rounded-xl text-sm sm:text-base'} font-black flex items-center justify-center gap-2 transition-all duration-200 z-10 ${
          mode === "read"
            ? "text-white drop-shadow-sm"
            : "text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-300"
        }`}
      >
        {mode === "read" && (
          <motion.div
            layoutId="activeExamModeIndicator"
            className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-violet-600 rounded-xl shadow-lg shadow-indigo-500/30"
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            style={{ zIndex: -1 }}
          />
        )}
        <BookOpen size={16} className={mode === "read" ? "text-indigo-200" : "text-slate-400"} />
        <span>
          {isHindi ? "📖 रीड मोड" : "📖 Read Mode"}
          <span className="hidden sm:inline opacity-90 text-[11px] ml-1">{isHindi ? "(डिजिटल बुक)" : "(Digital Book)"}</span>
        </span>
      </button>
    </div>
  );
}
