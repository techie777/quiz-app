"use client";

import React from "react";
import { motion } from "framer-motion";
import { AlertTriangle, X, Play, ArrowLeft } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

export default function ExitConfirmModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  progress, 
  score, 
  totalQuestions,
  customTitle,
  customMessage,
  confirmText,
}) {
  const { isHindi } = useLanguage();

  if (!isOpen) return null;

  const handleConfirmAction = () => {
    onConfirm();
    onClose();
  };

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
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 flex items-center justify-center transition-colors"
          aria-label="Close"
        >
          <X size={16} />
        </button>

        {/* Warning Icon Badge */}
        <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-500 border border-amber-200 dark:border-amber-900/60 flex items-center justify-center mb-4 shadow-sm ring-8 ring-amber-50/60 dark:ring-amber-950/20">
          <AlertTriangle size={26} className="fill-amber-500/20 stroke-[2.2]" />
        </div>

        {/* Title */}
        <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight mb-2">
          {customTitle || (isHindi ? "क्विज़ छोड़ें?" : "Exit Quiz?")}
        </h2>

        {/* Description */}
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium mb-4">
          {customMessage ||
            (isHindi
              ? "यदि आप अभी बाहर निकलते हैं, तो इस क्विज़ की आपकी प्रगति समाप्त हो जाएगी।"
              : "Your progress for this attempt will be lost if you leave now.")}
        </p>

        {/* Optional Stats Badge */}
        {(progress !== undefined || (score !== undefined && totalQuestions !== undefined)) && (
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 mb-6">
            <span>📊</span>
            <span>
              {progress !== undefined && `प्रगति: ${progress}%`}
              {score !== undefined && totalQuestions !== undefined && ` · स्कोर: ${score}/${totalQuestions}`}
            </span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-3 mt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs sm:text-sm transition-all active:scale-95 flex items-center justify-center gap-1.5"
          >
            <Play size={14} className="fill-current" />
            <span>{isHindi ? "खेलते रहें" : "Continue"}</span>
          </button>

          <button
            type="button"
            onClick={handleConfirmAction}
            className="flex-1 py-3 px-4 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-rose-600/25 transition-all active:scale-95 flex items-center justify-center gap-1.5"
          >
            <ArrowLeft size={14} />
            <span>{confirmText || (isHindi ? "बाहर निकलें" : "Yes, Exit")}</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}
