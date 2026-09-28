"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useTier, TIERS } from "@/context/TierContext";
import { useLanguage } from "@/context/LanguageContext";
import { ChevronDown, Check, Home, Sparkles, GraduationCap, Compass, Swords } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function TierSwitcher() {
  const { tier, setTier, clearTier, hasSavedTier, currentConfig, tierConfig, mounted } = useTier();
  const { isHindi } = useLanguage();
  const router = useRouter();
  const pathname = usePathname();
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

  // Exact dropdown order: Kids, Students, Explorer, Quiz Arena
  const tierList = [
    { 
      key: TIERS.KIDS, 
      config: tierConfig.kids,
      icon: <Sparkles size={16} className="text-amber-500" />,
      bgIcon: "bg-amber-50 dark:bg-amber-950/40 text-amber-500",
      isNew: false
    },
    { 
      key: TIERS.STUDENTS, 
      config: tierConfig.students,
      icon: <GraduationCap size={16} className="text-teal-600 dark:text-teal-400" />,
      bgIcon: "bg-teal-50 dark:bg-teal-950/40 text-teal-600",
      isNew: false
    },
    { 
      key: TIERS.ADULTS, 
      config: tierConfig.adults,
      icon: <Compass size={16} className="text-indigo-600 dark:text-indigo-400" />,
      bgIcon: "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600",
      isNew: false
    },
    { 
      key: TIERS.ARENA, 
      config: tierConfig.arena,
      icon: <Swords size={16} className="text-purple-600 dark:text-purple-400" />,
      bgIcon: "bg-purple-50 dark:bg-purple-950/40 text-purple-600",
      isNew: true
    },
  ];

  const isHomeSelected = !hasSavedTier;

  const getCurrentTriggerIcon = () => {
    if (isHomeSelected) return <Home size={14} className="shrink-0 text-indigo-600 dark:text-indigo-400" />;
    if (tier === TIERS.KIDS) return <Sparkles size={14} className="shrink-0 text-amber-500" />;
    if (tier === TIERS.STUDENTS) return <GraduationCap size={14} className="shrink-0 text-teal-600" />;
    if (tier === TIERS.ARENA) return <Swords size={14} className="shrink-0 text-purple-600" />;
    return <Compass size={14} className="shrink-0 text-indigo-600" />;
  };

  return (
    <div className="relative inline-block" ref={containerRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="relative flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500 transition-all duration-300 group shadow-sm text-xs font-bold text-slate-800 dark:text-slate-200 select-none min-h-[38px]"
        aria-label="Switch experience tier"
        aria-expanded={isOpen}
      >
        <span className="flex items-center justify-center">
          {getCurrentTriggerIcon()}
        </span>
        <span className="hidden sm:inline font-bold tracking-tight">
          {isHomeSelected
            ? (isHindi ? "मुख्य पृष्ठ" : "QuizWeb Home")
            : (isHindi ? currentConfig.shortLabelHi : currentConfig.shortLabel)}
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
            className="absolute right-0 sm:left-0 sm:right-auto mt-2 w-56 sm:w-64 bg-white dark:bg-[#111638] rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700/80 p-2 z-[9999] overflow-hidden"
          >
            <div className="px-2.5 py-1.5 mb-1 border-b border-slate-100 dark:border-slate-800/60">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                {isHindi ? "अनुभव मोड चुनें" : "Experience Mode"}
              </span>
            </div>

            <div className="flex flex-col gap-1">
              {/* Item 1: QuizWeb Home */}
              <button
                type="button"
                onClick={() => {
                  clearTier();
                  setIsOpen(false);
                  if (pathname === "/") {
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  } else {
                    router.push("/");
                  }
                }}
                className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-colors min-h-[44px] ${
                  isHomeSelected
                    ? "bg-indigo-50/80 dark:bg-indigo-950/50 text-indigo-700 dark:text-cyan-300 font-bold"
                    : "hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300 font-medium"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="p-1 bg-slate-100 dark:bg-slate-800 rounded-lg shrink-0 flex items-center justify-center w-8 h-8 text-indigo-600 dark:text-cyan-400">
                    <Home size={16} />
                  </span>
                  <div className="min-w-0">
                    <div className="text-xs sm:text-sm font-bold truncate">
                      {isHindi ? "मुख्य पृष्ठ" : "QuizWeb Home"}
                    </div>
                    <div className="text-[10px] text-slate-400 truncate">
                      {isHindi ? "मास्टर लैंडिंग पेज" : "Master Landing Page"}
                    </div>
                  </div>
                </div>
                {isHomeSelected && (
                  <Check size={16} className="text-indigo-600 dark:text-cyan-400 shrink-0 ml-1.5" />
                )}
              </button>

              {/* Items 2-5: Kids, Students, Explorer, Quiz Arena (NEW tag) */}
              {tierList.map(({ key, config, icon, bgIcon, isNew }) => {
                const isSelected = !isHomeSelected && tier === key;
                return (
                  <button
                    type="button"
                    key={key}
                    onClick={() => {
                      setTier(key);
                      setIsOpen(false);
                      if (key === TIERS.ARENA && !pathname.startsWith("/arena")) {
                        router.push("/arena");
                      }
                    }}
                    className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-colors min-h-[44px] ${
                      isSelected
                        ? "bg-indigo-50/80 dark:bg-indigo-950/50 text-indigo-700 dark:text-cyan-300 font-bold"
                        : "hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300 font-medium"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className={`p-1 rounded-lg shrink-0 flex items-center justify-center w-8 h-8 ${bgIcon}`}>
                        {icon}
                      </span>
                      <div className="min-w-0">
                        <div className="text-xs sm:text-sm font-bold truncate flex items-center gap-1.5">
                          <span>{isHindi ? config.labelHi : config.label}</span>
                          {isNew && (
                            <span className="text-[9px] font-black uppercase tracking-wider bg-gradient-to-r from-violet-600 to-pink-500 text-white px-1.5 py-0.2 rounded-full">
                              NEW
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate">
                          {(isHindi && config.ageRangeHi ? config.ageRangeHi : config.ageRange)} • {isHindi ? config.taglineHi : config.tagline}
                        </div>
                      </div>
                    </div>
                    {isSelected && (
                      <Check size={16} className="text-indigo-600 dark:text-cyan-400 shrink-0 ml-1.5" />
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
