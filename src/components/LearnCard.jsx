"use client";

import React from "react";
import { motion } from "framer-motion";
import { ArrowRight, BookOpen } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

export default function LearnCard({ item, onReadMore }) {
  const { isHindi } = useLanguage();

  if (!item) return null;

  return (
    <motion.div
      whileHover={{ y: -3, scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2 }}
      onClick={onReadMore}
      className="group relative cursor-pointer overflow-hidden rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 p-4 sm:p-5 flex flex-col justify-between shadow-sm hover:shadow-md transition-all select-none"
    >
      <div>
        {item.date && (
          <div className="mb-2">
            <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500">
              {item.date}
            </span>
          </div>
        )}

        {/* Title */}
        <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white line-clamp-2 leading-snug group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
          {item.title}
        </h4>

        {/* Summary */}
        <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
          {item.summary || item.description}
        </p>
      </div>

      {/* Bottom link */}
      <div className="mt-4 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400">
          <BookOpen size={13} />
          <span>{isHindi ? "विस्तार से पढ़ें" : "Read"}</span>
        </span>
        <ArrowRight size={14} className="text-indigo-600 dark:text-indigo-400 group-hover:translate-x-1 transition-transform" />
      </div>
    </motion.div>
  );
}
