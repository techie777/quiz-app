"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Flag, X, ArrowRight, Play } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

export default function EndQuizConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  answeredCount = 0,
  totalQuestions = 20,
}) {
  const { isHindi } = useLanguage();

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm select-none"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 14 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-2xl p-6 sm:p-7 text-center overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Dismiss Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 flex items-center justify-center transition-colors"
          aria-label="Close"
        >
          <X size={16} />
        </button>

        {/* Illustrated Icon Badge */}
        <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-50 dark:bg-rose-950/50 text-rose-500 border border-rose-100 dark:border-rose-900/60 flex items-center justify-center mb-4 shadow-sm ring-8 ring-rose-50/60 dark:ring-rose-950/20">
          <Flag size={26} className="fill-rose-500/20 stroke-[2.2]" />
        </div>

        {/* Title */}
        <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight mb-2">
          {isHindi ? "क्विज़ जल्दी समाप्त करें?" : "End Quiz Early?"}
        </h2>

        {/* Body Text */}
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium mb-4">
          {isHindi
            ? "आपने अभी सभी प्रश्न पूरे नहीं किए हैं। क्या आप अभी क्विज़ समाप्त करके परिणाम देखना चाहते हैं?"
            : "You haven't finished all questions yet. Are you sure you want to end now and calculate your score?"}
        </p>

        {/* Questions Progress Pill */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 mb-6">
          <span>📊</span>
          <span>
            {isHindi
              ? `प्रगति: ${answeredCount} / ${totalQuestions} प्रश्न हल`
              : `Progress: ${answeredCount} of ${totalQuestions} answered`}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs sm:text-sm transition-all active:scale-95 flex items-center justify-center gap-1.5"
          >
            <Play size={14} className="fill-current" />
            <span>{isHindi ? "खेलते रहें" : "Keep Playing"}</span>
          </button>

          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 py-3 px-4 rounded-2xl bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-rose-500/25 transition-all active:scale-95 flex items-center justify-center gap-1.5"
          >
            <span>{isHindi ? "हाँ, समाप्त करें" : "Yes, End Quiz"}</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </motion.div>
    </div>
  );
}
