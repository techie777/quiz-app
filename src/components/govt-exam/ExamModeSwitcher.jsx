"use client";

import React from "react";
import { motion } from "framer-motion";
import { BookOpen, Zap } from "lucide-react";

export default function ExamModeSwitcher({ mode = "quiz", onModeChange, isHindi = false }) {
  return (
    <div className="w-full max-w-xl mx-auto my-6 p-1.5 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 shadow-inner flex items-center relative gap-1">
      {/* Quiz Mode Button */}
      <button
        type="button"
        onClick={() => onModeChange("quiz")}
        className={`relative flex-1 py-3 px-4 rounded-xl font-bold text-sm sm:text-base flex items-center justify-center gap-2.5 transition-colors duration-200 z-10 ${
          mode === "quiz"
            ? "text-indigo-900 dark:text-white"
            : "text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-300"
        }`}
      >
        {mode === "quiz" && (
          <motion.div
            layoutId="activeExamModeIndicator"
            className="absolute inset-0 bg-white dark:bg-indigo-600 rounded-xl shadow-md border border-indigo-100 dark:border-indigo-500"
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            style={{ zIndex: -1 }}
          />
        )}
        <Zap size={18} className={mode === "quiz" ? "text-amber-500 dark:text-amber-300" : "text-slate-500"} />
        <span>{isHindi ? "🎯 क्विज़ मोड (अभ्यास)" : "🎯 Quiz Mode (Interactive)"}</span>
      </button>

      {/* Read Mode Button */}
      <button
        type="button"
        onClick={() => onModeChange("read")}
        className={`relative flex-1 py-3 px-4 rounded-xl font-bold text-sm sm:text-base flex items-center justify-center gap-2.5 transition-colors duration-200 z-10 ${
          mode === "read"
            ? "text-indigo-900 dark:text-white"
            : "text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-300"
        }`}
      >
        {mode === "read" && (
          <motion.div
            layoutId="activeExamModeIndicator"
            className="absolute inset-0 bg-white dark:bg-indigo-600 rounded-xl shadow-md border border-indigo-100 dark:border-indigo-500"
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            style={{ zIndex: -1 }}
          />
        )}
        <BookOpen size={18} className={mode === "read" ? "text-indigo-600 dark:text-white" : "text-slate-500"} />
        <span>{isHindi ? "📖 रीड मोड (डिजिटल बुक)" : "📖 Read Mode (Digital Book)"}</span>
      </button>
    </div>
  );
}
