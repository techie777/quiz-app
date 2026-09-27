"use client";

import React from "react";
import { motion } from "framer-motion";
import { Sparkles, ArrowRight, BookOpen } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

export default function LearnCard({ item, onReadMore }) {
  const { isHindi } = useLanguage();

  if (!item) return null;

  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.015 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2 }}
      className="group relative overflow-hidden rounded-2xl border border-purple-200/70 dark:border-purple-900/40 bg-gradient-to-br from-purple-50/70 via-white to-pink-50/40 dark:from-purple-950/40 dark:via-slate-900/90 dark:to-slate-950 p-4 sm:p-5 flex flex-col justify-between shadow-sm hover:shadow-xl hover:shadow-purple-500/10 transition-all select-none"
    >
      {/* Top Tag & Date */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60">
            <Sparkles size={11} className="text-purple-600 dark:text-purple-400" />
            <span>{isHindi ? "संक्षिप्त ज्ञान" : "Quick Concept"}</span>
          </span>

          {item.date && (
            <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500">
              {item.date}
            </span>
          )}
        </div>

        {/* Title */}
        <h4 className="text-sm sm:text-base font-black text-slate-900 dark:text-white line-clamp-2 leading-snug group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
          {item.title}
        </h4>

        {/* Summary */}
        <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-400 line-clamp-3 leading-relaxed">
          {item.summary || item.description}
        </p>
      </div>

      {/* Bottom CTA */}
      <div className="mt-4 pt-3 border-t border-purple-100 dark:border-purple-900/30 flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 text-xs font-black text-purple-700 dark:text-purple-300 group-hover:translate-x-0.5 transition-transform">
          <BookOpen size={13} />
          <span>{isHindi ? "विस्तार से पढ़ें" : "Read Explainer"}</span>
        </span>
        <ArrowRight size={14} className="text-purple-600 dark:text-purple-400 group-hover:translate-x-1 transition-transform" />
      </div>
    </motion.div>
  );
}
