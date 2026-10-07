"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { useTier, TIERS } from "@/context/TierContext";
import { useLanguage } from "@/context/LanguageContext";
import { DEFAULT_MODULES_CONFIG } from "@/lib/modulesConfig";
import { useData } from "@/context/DataContext";
import { useUI } from "@/context/UIContext";

/**
 * Standard 5-tab destinations: Home · GK · Play · Current · Facts
 * Matches previous UI layout with elevated center PLAY button and new emoji icons & colors.
 */
export const TIER_NAVIGATION_CONFIG = {
  [TIERS.ADULTS]: [
    {
      id: "home",
      label: "Home",
      labelHi: "होम",
      shortLabel: "Home",
      shortLabelHi: "होम",
      href: "/",
      emoji: "🏠",
      matchRegex: /^\/$/,
    },
    {
      id: "gk",
      label: "India GK",
      labelHi: "इंडिया जीके",
      shortLabel: "India GK",
      shortLabelHi: "इंडिया जीके",
      href: "/category/india-gk",
      emoji: "🌐",
      matchRegex: /^\/(category\/india-gk|gk)/,
    },
    {
      id: "play",
      label: "Play",
      labelHi: "खेलें",
      shortLabel: "Play",
      shortLabelHi: "खेलें",
      href: "/arena",
      emoji: "▶",
      isElevated: true,
      matchRegex: /^\/arena/,
    },
    {
      id: "currentAffairs",
      label: "Current",
      labelHi: "करंट",
      shortLabel: "Current",
      shortLabelHi: "करंट",
      href: "/daily-current-affairs",
      emoji: "🔥",
      matchRegex: /^\/(daily-current-affairs|current-affairs)/,
    },
    {
      id: "books",
      label: "My Books",
      labelHi: "मेरी पुस्तकें",
      shortLabel: "Books",
      shortLabelHi: "पुस्तकें",
      href: "/gk-book",
      emoji: "📖",
      matchRegex: /^\/gk-book/,
    },
  ],
  [TIERS.STUDENTS]: [
    {
      id: "home",
      label: "Home",
      labelHi: "होम",
      shortLabel: "Home",
      shortLabelHi: "होम",
      href: "/",
      emoji: "🏠",
      matchRegex: /^\/$/,
    },
    {
      id: "learn",
      label: "Study",
      labelHi: "पढ़ाई",
      shortLabel: "Study",
      shortLabelHi: "पढ़ाई",
      href: "/school-study",
      emoji: "📚",
      matchRegex: /^\/(school-study|learn)/,
    },
    {
      id: "play",
      label: "Play",
      labelHi: "खेलें",
      shortLabel: "Play",
      shortLabelHi: "खेलें",
      href: "/arena?audience=students",
      emoji: "▶",
      isElevated: true,
      matchRegex: /^\/arena/,
    },
    {
      id: "currentAffairs",
      label: "Current",
      labelHi: "करंट",
      shortLabel: "Current",
      shortLabelHi: "करंट",
      href: "/daily-current-affairs",
      emoji: "🔥",
      matchRegex: /^\/(daily-current-affairs|current-affairs)/,
    },
    {
      id: "profile",
      label: "Profile",
      labelHi: "प्रोफ़ाइल",
      shortLabel: "Profile",
      shortLabelHi: "प्रोफ़ाइल",
      href: "/profile",
      emoji: "👤",
      matchRegex: /^\/(profile|wallet|settings|leaderboard)/,
    },
  ],
  [TIERS.KIDS]: [
    {
      id: "home",
      label: "Home",
      labelHi: "होम",
      shortLabel: "Home",
      shortLabelHi: "होम",
      href: "/",
      emoji: "🏠",
      matchRegex: /^\/$/,
    },
    {
      id: "learn",
      label: "Explore",
      labelHi: "सैर",
      shortLabel: "Explore",
      shortLabelHi: "सैर",
      href: "/learn",
      emoji: "✨",
      matchRegex: /^\/learn/,
    },
    {
      id: "play",
      label: "Play",
      labelHi: "खेलें",
      shortLabel: "Play",
      shortLabelHi: "खेलें",
      href: "/arena?audience=kids",
      emoji: "▶",
      isElevated: true,
      matchRegex: /^\/arena/,
    },
    {
      id: "rewards",
      label: "Rewards",
      labelHi: "इनाम",
      shortLabel: "Rewards",
      shortLabelHi: "इनाम",
      href: "/rewards",
      emoji: "🎁",
      matchRegex: /^\/rewards/,
    },
    {
      id: "profile",
      label: "Profile",
      labelHi: "प्रोफ़ाइल",
      shortLabel: "Profile",
      shortLabelHi: "प्रोफ़ाइल",
      href: "/profile",
      emoji: "👤",
      matchRegex: /^\/profile/,
    },
  ],
};

export default function BottomNavBar() {
  const pathname = usePathname();
  const { tier, hasSavedTier, mounted: tierMounted } = useTier();
  const { isHindi } = useLanguage();
  const { modules } = useData();
  const { openPlayMenu } = useUI();

  // Hide on Unset Landing Page (root with no saved tier)
  if (pathname === "/" && (!tierMounted || !hasSavedTier)) {
    return null;
  }

  // Hide during quiz play, timed exam, admin, or dedicated Quiz Arena 2-step wizard
  const isQuizPlaying = pathname?.startsWith("/quiz") || pathname?.startsWith("/live");
  const isTimedExam = pathname?.includes("/mock-tests/paper/");
  const isAdmin = pathname?.startsWith("/admin");
  const isArena = pathname?.startsWith("/arena");

  if (isAdmin || isTimedExam || isQuizPlaying || isArena) {
    return null;
  }

  const allDestinations = TIER_NAVIGATION_CONFIG[tier] || TIER_NAVIGATION_CONFIG[TIERS.ADULTS];
  const activeModules = modules || DEFAULT_MODULES_CONFIG;
  const destinations = allDestinations.filter((item) => {
    if (item.id === "home" && activeModules.home === false) return false;
    if ((item.id === "learn" || item.id === "facts") && activeModules.learn === false && activeModules.facts === false) return false;
    if (item.id === "play" && activeModules.arena === false && activeModules.play === false) return false;
    if (item.id === "currentAffairs" && activeModules.currentAffairs === false) return false;
    if (item.id === "profile" && activeModules.profile === false) return false;
    return true;
  });

  const isTabActive = (item) => {
    if (item.href === "/") return pathname === "/";
    if (item.matchRegex) return item.matchRegex.test(pathname);
    return pathname.startsWith(item.href);
  };

  return (
    <nav
      aria-label="Bottom Navigation"
      role="navigation"
      className="fixed bottom-0 left-0 right-0 w-full z-50 bg-[#FFFFFF] dark:bg-slate-900 border-t border-[#EEF0F4] dark:border-slate-800 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] select-none pb-[env(safe-area-inset-bottom,0px)]"
    >
      {/* 100% width full responsive bar, centered content on tablet/desktop */}
      <div className="w-full max-w-lg md:max-w-2xl mx-auto h-[62px] sm:h-[66px] px-2 sm:px-6 flex items-center justify-between relative">
        {destinations.map((item) => {
          const isActive = isTabActive(item);
          const label = isHindi ? item.labelHi || item.label : item.label;
          const shortLabel = isHindi
            ? item.shortLabelHi || item.labelHi || item.label
            : item.shortLabel || item.label;

          // ── Visually Elevated Center PLAY button ──
          if (item.isElevated) {
            return (
              <div
                key={item.id}
                className="relative flex-1 flex flex-col items-center justify-center"
              >
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    openPlayMenu();
                  }}
                  className="group relative -top-5 sm:-top-6 focus:outline-none min-w-[56px] min-h-[56px] flex items-center justify-center cursor-pointer bg-transparent border-0"
                  aria-label={label}
                >
                  {/* Ambient Breathing Pulse Glow */}
                  <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-violet-600 via-purple-500 to-indigo-600 blur-md opacity-60 group-hover:opacity-100 transition-opacity animate-pulse pointer-events-none" />

                  <motion.div
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.92 }}
                    transition={{ type: "spring", stiffness: 450, damping: 25 }}
                    className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-[#7C3AED] via-[#6366F1] to-[#4F46E5] flex flex-col items-center justify-center text-white ring-4 ring-white dark:ring-slate-900 shadow-xl shadow-purple-600/40 border border-purple-300/30 overflow-hidden cursor-pointer"
                  >
                    {/* Top glass reflection highlight */}
                    <div className="absolute -top-3 inset-x-0 h-6 bg-gradient-to-b from-white/40 to-transparent rounded-full pointer-events-none" />

                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-white/20 backdrop-blur-xs mb-0.5 shadow-inner">
                      <svg
                        width="13"
                        height="13"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className="translate-x-0.5 drop-shadow-sm text-white"
                      >
                        <polygon points="5 3 19 12 5 21 5 3" />
                      </svg>
                    </div>

                    <span className="text-[10px] sm:text-[10.5px] font-black uppercase tracking-wider leading-none text-white drop-shadow-xs">
                      {shortLabel}
                    </span>
                  </motion.div>
                </button>
              </div>
            );
          }

          // ── Standard Destinations with soft tinted pill behind icon on active ──
          return (
            <Link
              key={item.id}
              href={item.href}
              prefetch={true}
              className="relative flex-1 h-full min-h-[44px] min-w-[44px] flex flex-col items-center justify-center focus:outline-none"
              aria-label={label}
            >
              <div className="relative flex flex-col items-center justify-center">
                <div
                  className={`flex items-center justify-center rounded-full transition-all duration-200 ${
                    isActive
                      ? "bg-[#EEF2FF] dark:bg-indigo-950/60 text-[#6366F1] dark:text-indigo-400 px-3 py-1"
                      : "text-[#94A3B8] hover:text-slate-700 dark:hover:text-slate-300 py-1"
                  }`}
                >
                  <span className="text-xl leading-none select-none">
                    {item.emoji}
                  </span>
                </div>
                <span
                  className={`text-[10.5px] sm:text-[11px] leading-tight mt-0.5 tracking-tight ${
                    isActive
                      ? "text-[#6366F1] dark:text-indigo-400 font-bold"
                      : "text-[#94A3B8] font-medium"
                  }`}
                >
                  {label}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
