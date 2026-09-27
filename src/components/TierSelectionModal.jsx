"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTier, TIERS } from "@/context/TierContext";
import { useLanguage } from "@/context/LanguageContext";
import { Sparkles, Check, X } from "lucide-react";

export default function TierSelectionModal() {
  const { isTierModalOpen, closeTierModal, setTier, tier: activeTier, tierConfig } = useTier();
  const { isHindi } = useLanguage();

  if (!isTierModalOpen) return null;

  const handleSelect = (tierKey) => {
    setTier(tierKey);
    closeTierModal();
  };

  const options = [
    {
      key: TIERS.KIDS,
      config: tierConfig.kids,
      bgHover: "hover:border-amber-400 dark:hover:border-amber-400 hover:shadow-amber-500/10",
      accentBadge: "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300/40",
      ringColor: "ring-amber-400",
    },
    {
      key: TIERS.STUDENTS,
      config: tierConfig.students,
      bgHover: "hover:border-sky-400 dark:hover:border-sky-400 hover:shadow-sky-500/10",
      accentBadge: "bg-sky-100 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300 border-sky-300/40",
      ringColor: "ring-sky-400",
    },
    {
      key: TIERS.ADULTS,
      config: tierConfig.adults,
      bgHover: "hover:border-indigo-400 dark:hover:border-indigo-400 hover:shadow-indigo-500/10",
      accentBadge: "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-300/40",
      ringColor: "ring-indigo-400",
    },
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={closeTierModal}
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-md transition-opacity"
        />

        {/* Modal Dialog */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 16 }}
          transition={{ type: "spring", duration: 0.45, bounce: 0.15 }}
          className="relative w-full max-w-2xl bg-white dark:bg-[#111638] rounded-3xl shadow-2xl border border-slate-200/80 dark:border-indigo-500/20 p-6 sm:p-8 z-10 overflow-hidden"
          role="dialog"
          aria-modal="true"
        >
          {/* Decorative ambient gradient */}
          <div className="absolute -top-24 -right-24 w-60 h-60 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-60 h-60 bg-gradient-to-tr from-amber-500/15 to-sky-500/15 rounded-full blur-3xl pointer-events-none" />

          {/* Close button */}
          <button
            onClick={closeTierModal}
            className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Close dialog"
          >
            <X size={20} />
          </button>

          {/* Header */}
          <div className="text-center mb-6 sm:mb-8">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/50 text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-wider mb-2.5">
              <Sparkles size={13} />
              <span>{isHindi ? "पर्सनलाइज्ड अनुभव" : "Personalized Experience"}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {isHindi ? "आज कौन खेल रहा है?" : "Who's playing today?"}
            </h2>
            <p className="mt-2 text-sm sm:text-base text-slate-500 dark:text-slate-400 max-w-lg mx-auto leading-relaxed">
              {isHindi
                ? "अपनी पसंद के अनुसार अनुभव चुनें। इसे आप कभी भी ऊपर हेडर से बदल सकते हैं।"
                : "Choose an experience tailored for you. You can change this anytime from the top header."}
            </p>
          </div>

          {/* Options Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4 mb-6">
            {options.map(({ key, config, bgHover, accentBadge, ringColor }) => {
              const isSelected = activeTier === key;
              return (
                <button
                  key={key}
                  onClick={() => handleSelect(key)}
                  className={`group relative text-left p-4 sm:p-5 rounded-2xl border-2 transition-all duration-200 flex flex-col justify-between ${
                    isSelected
                      ? `border-indigo-600 dark:border-cyan-400 bg-indigo-50/50 dark:bg-indigo-950/30 shadow-lg ${ringColor} ring-2 ring-offset-2 dark:ring-offset-[#111638]`
                      : `border-slate-200 dark:border-slate-800/80 bg-slate-50/60 dark:bg-slate-900/40 ${bgHover} hover:shadow-md hover:-translate-y-0.5`
                  }`}
                >
                  {/* Top Row: Icon + Age badge */}
                  <div className="flex items-start justify-between mb-3 w-full">
                    <span className="text-4xl p-1 bg-white dark:bg-slate-800/80 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700/60 group-hover:scale-110 transition-transform">
                      {config.icon}
                    </span>
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${accentBadge}`}>
                      {config.ageRange}
                    </span>
                  </div>

                  {/* Title & Tagline */}
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-white">
                        {isHindi ? config.labelHi : config.label}
                      </h3>
                      {isSelected && (
                        <Check size={16} className="text-indigo-600 dark:text-cyan-400 ml-auto" />
                      )}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                      {isHindi ? config.taglineHi : config.tagline}
                    </p>
                  </div>

                  {/* Tap CTA Indicator */}
                  <div className="mt-4 pt-2.5 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between text-[11px] font-semibold text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-cyan-400 transition-colors">
                    <span>{isHindi ? "शुरू करें" : "Select"}</span>
                    <span>→</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Footer Skip Link */}
          <div className="text-center pt-2 border-t border-slate-100 dark:border-slate-800/60">
            <button
              onClick={() => handleSelect(TIERS.ADULTS)}
              className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors py-1 px-3 rounded-lg font-medium"
            >
              {isHindi ? "छोड़ें (वयस्क मोड में जारी रखें)" : "Skip for now (continue in Adults mode)"}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
