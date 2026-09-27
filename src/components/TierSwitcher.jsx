"use client";

import React, { useState, useRef, useEffect } from "react";
import { useTier, TIERS } from "@/context/TierContext";
import { useLanguage } from "@/context/LanguageContext";
import { ChevronDown, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function TierSwitcher() {
  const { tier, setTier, currentConfig, tierConfig, mounted } = useTier();
  const { isHindi } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [isOpen]);

  if (!mounted) return null;

  const tierList = [
    { key: TIERS.KIDS, config: tierConfig.kids },
    { key: TIERS.STUDENTS, config: tierConfig.students },
    { key: TIERS.ADULTS, config: tierConfig.adults },
  ];

  return (
    <div className="relative inline-block" ref={containerRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="relative flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500 transition-all duration-300 group shadow-sm text-xs font-bold text-slate-800 dark:text-slate-200 select-none"
        aria-label="Switch experience tier"
        aria-expanded={isOpen}
      >
        <span className="text-sm leading-none">{currentConfig.icon}</span>
        <span className="hidden sm:inline font-extrabold tracking-tight">
          {isHindi ? currentConfig.shortLabelHi : currentConfig.shortLabel}
        </span>
        <ChevronDown
          size={12}
          className={`text-slate-400 group-hover:text-indigo-500 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Dropdown Popover */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 sm:left-0 sm:right-auto mt-2 w-52 sm:w-60 bg-white dark:bg-[#111638] rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700/80 p-2 z-[9999] overflow-hidden"
          >
            <div className="px-2.5 py-1.5 mb-1 border-b border-slate-100 dark:border-slate-800/60">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                {isHindi ? "अनुभव मोड चुनें" : "Experience Mode"}
              </span>
            </div>

            <div className="flex flex-col gap-1">
              {tierList.map(({ key, config }) => {
                const isSelected = tier === key;
                return (
                  <button
                    key={key}
                    onClick={() => {
                      setTier(key);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-colors ${
                      isSelected
                        ? "bg-indigo-50/80 dark:bg-indigo-950/50 text-indigo-700 dark:text-cyan-300 font-bold"
                        : "hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300 font-medium"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-xl p-1 bg-slate-100 dark:bg-slate-800 rounded-lg shrink-0">
                        {config.icon}
                      </span>
                      <div className="min-w-0">
                        <div className="text-xs sm:text-sm font-extrabold truncate">
                          {isHindi ? config.labelHi : config.label}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate">
                          {config.ageRange} • {isHindi ? config.taglineHi : config.tagline}
                        </div>
                      </div>
                    </div>
                    {isSelected && (
                      <Check size={14} className="text-indigo-600 dark:text-cyan-400 shrink-0 ml-1.5" />
                    )}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
