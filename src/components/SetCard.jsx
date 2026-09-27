"use client";

import React from "react";
import { motion } from "framer-motion";
import { Users, Play, CheckCircle2, Lock } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { useTier } from "@/context/TierContext";

export const FREE_SETS_QUOTA = 3;

export default function SetCard({
  set,
  categoryTopic = "",
  freeQuota = FREE_SETS_QUOTA,
  handlePlay,
  handleLivePlay,
  handleLockedClick,
  isMix = false,
  handlePlayMix,
  mixQuestions = [],
  layout = "row",
}) {
  const { t, isHindi } = useLanguage();
  const { tier } = useTier();

  // Mega Mix Special Card
  if (isMix) {
    const qCount = mixQuestions?.length || 0;
    return (
      <motion.div
        whileHover={{ y: -3, scale: 1.005 }}
        whileTap={{ scale: 0.99 }}
        transition={{ duration: 0.2 }}
        className="w-full bg-gradient-to-r from-indigo-50/70 via-purple-50/60 to-pink-50/70 dark:from-indigo-950/40 dark:via-purple-950/30 dark:to-pink-950/40 border-2 border-indigo-400/40 dark:border-indigo-500/30 rounded-2xl p-4 sm:p-5 shadow-sm hover:shadow-lg transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        {/* Left: Thumbnail & Details */}
        <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center text-2xl shadow-md shadow-indigo-500/20 shrink-0">
            ✨
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white truncate">
                {t('quizzes.category.megaMix') || (isHindi ? "मेगा मिक्स क्विज़" : "Mega Mix Quiz")}
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                📝 {qCount} {isHindi ? "प्रश्न" : "Questions"}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
              {isHindi
                ? "सभी सेट्स के प्रश्नों का यादृच्छिक मिश्रण — अपनी संपूर्ण तैयारी का परीक्षण करें।"
                : "Randomized mix of questions from all sets to challenge your overall knowledge."}
            </p>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0 w-full md:w-auto">
          <button
            onClick={handlePlayMix}
            className="flex-1 md:flex-initial inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-extrabold text-xs sm:text-sm shadow-md shadow-indigo-600/20 active:scale-95 transition-all"
          >
            <Play size={16} fill="currentColor" />
            <span>{t('quizzes.category.configurePlay') || (isHindi ? "मिक्स खेलें" : "Play Mix")}</span>
          </button>
        </div>
      </motion.div>
    );
  }

  // Standard Set Card
  const setIndex = set?.index || 1;
  const isLocked = setIndex > freeQuota;
  const defaultCount = tier === "kids" ? 10 : 20;
  const qCount = set?.questions?.length || defaultCount;
  const isComplete = Boolean(set?.progress?.isComplete);
  const progressPercent = Math.round(set?.progress?.progress || 0);
  const inProgress = progressPercent > 0 && !isComplete;

  const title = `${categoryTopic} ${isHindi ? "सेट" : "Set"} ${setIndex}`;

  // Grid / Poster Layout (Seekho Discovery Feed Pattern)
  if (layout === "grid") {
    return (
      <motion.div
        whileHover={{ y: -4, scale: 1.015 }}
        whileTap={{ scale: 0.98 }}
        transition={{ duration: 0.2 }}
        onClick={() => {
          if (isLocked && handleLockedClick) {
            handleLockedClick(set);
          } else {
            handlePlay?.(set);
          }
        }}
        className={`group relative cursor-pointer overflow-hidden rounded-2xl border transition-all duration-300 flex flex-col justify-between select-none shadow-sm hover:shadow-xl ${
          isLocked
            ? "border-slate-200/80 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 hover:border-slate-400 dark:hover:border-slate-700"
            : "border-slate-200/80 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 hover:border-indigo-500/60 dark:hover:border-indigo-500/50 shadow-indigo-500/5"
        }`}
      >
        {/* Poster Top Visual */}
        <div className="relative aspect-[4/4.2] sm:aspect-[4/4.5] w-full overflow-hidden bg-gradient-to-b from-indigo-900/40 via-slate-900/70 to-slate-950 flex flex-col justify-between p-3">
          {/* Header row in poster: Lock + Count */}
          <div className="flex items-center justify-between w-full z-10">
            {isLocked ? (
              <div
                className="w-7 h-7 rounded-xl bg-slate-950/85 backdrop-blur-md text-amber-400 flex items-center justify-center border border-amber-400/30 shadow-md"
                title={isHindi ? "प्रीमियम सेट" : "Premium Set"}
              >
                <Lock size={12} strokeWidth={2.5} />
              </div>
            ) : (
              <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 backdrop-blur-md">
                SET {setIndex}
              </span>
            )}

            {isComplete ? (
              <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-md">
                <CheckCircle2 size={13} strokeWidth={3} />
              </div>
            ) : (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-black/60 text-white/90 backdrop-blur-md border border-white/10">
                📝 {qCount} Q
              </span>
            )}
          </div>

          {/* Central Artwork / Visual */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-85 group-hover:scale-105 transition-transform duration-300">
            {set?.categoryImage ? (
              <img
                src={set.categoryImage}
                alt={title}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="flex flex-col items-center justify-center">
                <span className="text-4xl sm:text-5xl filter drop-shadow-lg">
                  {set?.categoryEmoji || "📝"}
                </span>
                <span className="mt-1 text-[10px] font-black tracking-wider uppercase text-slate-300/80 px-2 py-0.5 rounded bg-black/40 backdrop-blur-sm">
                  {categoryTopic}
                </span>
              </div>
            )}
          </div>

          {/* Subtle gradient overlay at bottom of poster */}
          <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent pointer-events-none" />

          {/* Bottom title inside poster */}
          <div className="relative z-10 mt-auto">
            <h4 className="text-xs sm:text-sm font-black text-white leading-snug line-clamp-2 drop-shadow-md">
              {title}
            </h4>
            {set?.attemptCount !== undefined && set.attemptCount > 0 && (
              <p className="text-[10px] font-bold text-slate-300 mt-0.5">
                👥 {set.attemptCount} {isHindi ? "प्रयास" : "attempts"}
              </p>
            )}
          </div>
        </div>

        {/* Card Footer / Action Button */}
        <div className="p-2.5 sm:p-3 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800/80 flex items-center gap-1.5">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handlePlay?.(set);
            }}
            className="flex-1 inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[11px] sm:text-xs shadow-sm transition-all"
          >
            <Play size={12} fill="currentColor" />
            <span>
              {inProgress
                ? (isHindi ? "जारी रखें" : "Continue")
                : (isHindi ? "खेलें" : "Play")}
            </span>
          </button>

          {handleLivePlay && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleLivePlay?.(set);
              }}
              title={isHindi ? "लाइव खेलें" : "Play Live"}
              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-all"
            >
              <Users size={13} />
            </button>
          )}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      whileHover={{ y: -3, scale: 1.005 }}
      whileTap={{ scale: 0.99 }}
      transition={{ duration: 0.2 }}
      className={`w-full bg-white/90 dark:bg-slate-900/80 border rounded-2xl p-4 sm:p-5 shadow-sm hover:shadow-lg transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
        isLocked
          ? "border-slate-200/60 dark:border-slate-800/60 hover:border-slate-300 dark:hover:border-slate-700"
          : "border-slate-200/80 dark:border-slate-800 hover:border-indigo-400/50 dark:hover:border-indigo-500/50"
      }`}
    >
      {/* Left: Thumbnail + Metadata */}
      <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
        {/* Small Icon / Thumbnail with Lock or Number */}
        <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/50 border border-indigo-100 dark:border-indigo-900/40 flex items-center justify-center text-2xl font-black text-indigo-600 dark:text-indigo-400 shrink-0 select-none shadow-sm">
          <span>{setIndex}</span>

          {/* Visual Lock Icon for sets beyond free quota */}
          {isLocked && (
            <div
              className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-slate-900 text-amber-400 dark:bg-amber-400 dark:text-slate-900 flex items-center justify-center shadow-md border-2 border-white dark:border-slate-900"
              title={isHindi ? "प्रीमियम सेट" : "Premium Set"}
            >
              <Lock size={12} strokeWidth={2.5} />
            </div>
          )}

          {/* Completion Checkmark */}
          {isComplete && (
            <div
              className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-md border-2 border-white dark:border-slate-900"
              title={isHindi ? "100% पूर्ण" : "100% Completed"}
            >
              <CheckCircle2 size={13} strokeWidth={3} />
            </div>
          )}
        </div>

        {/* Text info & Chips */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white truncate">
              {title}
            </h3>

            {/* Question Count Chip */}
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700">
              <span>📝</span>
              <span>{qCount} {isHindi ? "प्रश्न" : "Questions"}</span>
            </span>

            {/* Completion / Progress Indicator */}
            {isComplete && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
                <span>✓</span>
                <span>{isHindi ? "पूर्ण" : "Completed"}</span>
              </span>
            )}
            {inProgress && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60">
                <span>{progressPercent}% Done</span>
              </span>
            )}
            {isLocked && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200/70 dark:border-amber-800/50">
                <Lock size={10} />
                <span>PRO</span>
              </span>
            )}
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
            {set?.questions?.[0]?.text || (isHindi ? "इस सेट के साथ अभ्यास करें।" : "Practice this 20-question chunk.")}
          </p>
        </div>
      </div>

      {/* Right: Identical CTAs in the same position on EVERY card */}
      <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 sm:gap-2.5 shrink-0 w-full md:w-auto pt-2 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-slate-800">
        {/* Primary CTA: "क्विज़ खेलें" */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (isLocked && handleLockedClick) {
              handleLockedClick(set);
            } else {
              handlePlay(set);
            }
          }}
          className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl font-extrabold text-xs sm:text-sm shadow-md active:scale-95 transition-all ${
            isLocked
              ? "bg-slate-900 hover:bg-slate-800 text-amber-300 border border-amber-400/40 shadow-slate-900/30"
              : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/20"
          }`}
        >
          {isLocked ? (
            <>
              <Lock size={14} className="text-amber-400" />
              <span>{isHindi ? "अनलॉक करें" : "Unlock Set"}</span>
            </>
          ) : (
            <>
              <Play size={15} fill="currentColor" />
              <span>
                {inProgress
                  ? (isHindi ? "जारी रखें" : "Continue")
                  : (isHindi ? "क्विज़ खेलें" : "Play Quiz")}
              </span>
            </>
          )}
        </button>

        {/* Secondary CTA: "लाइव खेलें" */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (isLocked && handleLockedClick) {
              handleLockedClick(set);
            } else {
              handleLivePlay(set);
            }
          }}
          className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-extrabold text-xs sm:text-sm border border-slate-200 dark:border-slate-700 active:scale-95 transition-all"
        >
          <Users size={16} />
          <span>{isHindi ? "लाइव खेलें" : "Play Live"}</span>
        </button>
      </div>
    </motion.div>
  );
}
