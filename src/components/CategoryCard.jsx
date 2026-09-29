"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";
import { ArrowRight, ChevronRight } from "lucide-react";

export default function CategoryCard({ category, onClick, customCountText, hideViewSets = false }) {
  const router = useRouter();
  const { isHindi } = useLanguage();

  if (!category) return null;

  const title = isHindi && (category.topicHi || category.nameHi)
    ? category.topicHi || category.nameHi
    : category.topic || category.name;
  const qCount = category.questionCount ?? category._count?.questions ?? (Array.isArray(category.questions) ? category.questions.length : 0);
  const countDisplay = customCountText || `${qCount} ${isHindi ? "प्रश्न" : "Qs"}`;
  
  let targetHref = `/category/${category.slug || category.id}`;
  if (category.isGkParent) {
    targetHref = `/gk?category=${category.categorySlug || "india"}`;
  } else if (category.isGkTopic) {
    targetHref = `/gk/${category.categorySlug || "india"}/topic/${category.id}`;
  }

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
      className="group relative cursor-pointer bg-white hover:bg-[#FAFAFE] border border-slate-200/90 hover:border-indigo-400/90 rounded-2xl p-4 sm:p-5 shadow-sm hover:shadow-md hover:shadow-indigo-500/10 transition-all duration-200 flex flex-col justify-between select-none min-h-[120px] sm:min-h-[135px]"
    >
      {/* Top: Premium Icon + Question Count Badge */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-indigo-50 to-violet-50/70 border border-indigo-100/90 flex items-center justify-center text-2xl group-hover:scale-105 transition-transform shrink-0 shadow-2xs">
          {category.image ? (
            <img
              src={category.image}
              alt={title}
              className="w-full h-full object-cover rounded-2xl"
              loading="lazy"
            />
          ) : (
            category.emoji || category.icon || "📝"
          )}
        </div>

        {/* Elevated Question Count Badge with Optional GK badge */}
        <div className="flex items-center gap-1 shrink-0">
          {category.isGkParent && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-black bg-purple-100 text-purple-700 border border-purple-200 uppercase">
              GK
            </span>
          )}
          {category.isGkTopic && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[9.5px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
              {category.category === "World GK" ? "World GK" : "India GK"}
            </span>
          )}
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-100/90 tracking-tight shadow-2xs">
            {countDisplay}
          </span>
        </div>
      </div>

      {/* Middle: Prominent Category Title with Larger, Crisp Font */}
      <div className="min-w-0 flex-1 flex flex-col justify-end">
        <h3
          title={title}
          className="text-sm sm:text-base md:text-lg font-black text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-2 leading-snug tracking-tight"
        >
          {title}
        </h3>
      </div>

      {/* Bottom: Subtle Action Link (when not hidden) */}
      {!hideViewSets && (
        <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-500 group-hover:text-indigo-600 transition-colors">
          <span>{isHindi ? "सेट देखें" : "View Sets"}</span>
          <ChevronRight size={15} className="group-hover:translate-x-1 transition-transform" />
        </div>
      )}
    </motion.div>
  );
}
