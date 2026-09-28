"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";
import { ArrowRight } from "lucide-react";

export default function CategoryCard({ category, onClick, customCountText, hideViewSets = false }) {
  const router = useRouter();
  const { isHindi } = useLanguage();

  if (!category) return null;

  const title = (isHindi && category.topicHi) ? category.topicHi : category.topic;
  const qCount = category.questionCount ?? category._count?.questions ?? (Array.isArray(category.questions) ? category.questions.length : 0);
  const countDisplay = customCountText || `${qCount} ${isHindi ? "प्रश्न" : "Qs"}`;
  const targetHref = `/category/${category.slug || category.id}`;

  const handleClick = (e) => {
    if (onClick) {
      onClick(category, e);
    } else {
      router.push(targetHref);
    }
  };

  return (
    <motion.div
      whileHover={{ y: -3, scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.15 }}
      onClick={handleClick}
      className="group relative cursor-pointer bg-white/95 dark:bg-slate-900/90 hover:bg-white dark:hover:bg-slate-800/95 border border-slate-200/80 dark:border-slate-800/80 hover:border-indigo-500/50 dark:hover:border-indigo-500/50 rounded-2xl p-3.5 sm:p-4 shadow-sm hover:shadow-lg hover:shadow-indigo-500/10 transition-all duration-200 flex flex-col justify-between select-none min-h-[110px]"
    >
      {/* Top: Icon + Single Count Chip ("50 Qs") */}
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100/80 dark:border-indigo-900/40 flex items-center justify-center text-xl sm:text-2xl group-hover:scale-105 transition-transform shrink-0">
          {category.image ? (
            <img
              src={category.image}
              alt={title}
              className="w-full h-full object-cover rounded-xl"
              loading="lazy"
            />
          ) : (
            category.emoji || "📝"
          )}
        </div>

        {/* Single Scannable Count Chip: e.g. "50 Qs" */}
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10.5px] sm:text-xs font-black bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/50 tracking-tight shrink-0">
          {countDisplay}
        </span>
      </div>

      {/* Middle: Clean Category Name */}
      <div className="min-w-0 flex-1 flex flex-col justify-center">
        <h3
          title={title}
          className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2 leading-tight"
        >
          {title}
        </h3>
      </div>

      {/* Bottom: Subtle Arrow Action (Hidden when hideViewSets is true) */}
      {!hideViewSets && (
        <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-xs font-bold text-slate-400 dark:text-slate-500 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
          <span>{isHindi ? "सेट देखें" : "View Sets"}</span>
          <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
        </div>
      )}
    </motion.div>
  );
}
