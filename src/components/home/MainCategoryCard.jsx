"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Layers, Sparkles } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

export default function MainCategoryCard({ category, dbCount = 0 }) {
  const { isHindi } = useLanguage();

  if (!category) return null;

  const title = isHindi && category.nameHi ? category.nameHi : category.name;
  const secondaryTitle = isHindi ? category.name : category.nameHi;
  const isComingSoon = !dbCount || dbCount === 0;
  const calculatedSets = Math.floor(dbCount / 20);

  return (
    <Link href={`/category/${category.slug}`} className="block h-full select-none group">
      <motion.div
        whileHover={{ y: -4, transition: { duration: 0.2 } }}
        whileTap={{ scale: 0.98 }}
        className="h-full bg-white dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-5 shadow-xs hover:shadow-xl hover:shadow-indigo-500/10 hover:border-indigo-400/80 dark:hover:border-indigo-500/50 transition-all duration-200 flex flex-col justify-between relative overflow-hidden"
      >
        {/* Subtle decorative top-right glow */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-indigo-500/5 via-transparent to-transparent rounded-bl-full pointer-events-none group-hover:from-indigo-500/10 transition-colors" />

        <div>
          {/* Top Row: Icon Container + Badges */}
          <div className="flex items-center justify-between gap-3 mb-4">
            <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-indigo-50/80 to-purple-50/80 dark:from-slate-800 dark:to-slate-800/80 border border-indigo-100/90 dark:border-slate-700/80 flex items-center justify-center text-3xl shadow-2xs group-hover:scale-108 group-hover:rotate-2 transition-transform duration-200 shrink-0">
              {category.icon || "📚"}
            </div>

            <div className="flex flex-col items-end gap-1 shrink-0">
              {/* Category ID Number Tag */}
              <span className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider">
                #{String(category.id).padStart(2, "0")}
              </span>

              {/* Status / Question Count Pill */}
              {isComingSoon ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/60 shadow-2xs">
                  <Sparkles size={11} className="text-amber-500" />
                  <span>{isHindi ? "जल्द आ रहा है" : "Coming soon"}</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/60 shadow-2xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>{dbCount} {isHindi ? "प्रश्न" : "Qs"}</span>
                </span>
              )}
            </div>
          </div>

          {/* Middle: Title & Bilingual Subtitle */}
          <div className="space-y-1 mb-3">
            <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors tracking-tight leading-snug">
              {title}
            </h3>
            {secondaryTitle && (
              <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 truncate">
                {secondaryTitle}
              </p>
            )}
          </div>

          {/* Subtitle / Example snippet */}
          {category.example && (
            <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed mb-4">
              {category.example}
            </p>
          )}
        </div>

        {/* Bottom Row: Set Count & Arrow Action */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
          <div className="flex items-center gap-1.5">
            <Layers size={14} className="text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400" />
            <span>
              {isComingSoon
                ? (isHindi ? "विषय सूची देखें" : "Explore Topics")
                : `${calculatedSets > 0 ? `${calculatedSets} ` : ""}${isHindi ? "स्टैंडर्ड सेट्स" : "Standard Sets"}`}
            </span>
          </div>

          <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 group-hover:bg-indigo-600 group-hover:text-white dark:group-hover:bg-indigo-500 transition-all duration-200">
            <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
