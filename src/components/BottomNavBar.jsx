"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  Home,
  Compass,
  Play,
  FileText,
  User,
  Sparkles,
  BookOpen,
  GraduationCap,
  Award,
  Flame,
  Star,
  ShieldCheck,
} from "lucide-react";
import { useTier, TIERS } from "@/context/TierContext";
import { useLanguage } from "@/context/LanguageContext";
import { useQuiz } from "@/context/QuizContext";

/**
 * Requirement 1: Configurable destinations per tier (max 5 destinations).
 * Kids tier has exactly 4 destinations: Home, Play, Rewards, Parent.
 */
export const TIER_NAVIGATION_CONFIG = {
  [TIERS.ADULTS]: [
    {
      id: "home",
      label: "Home",
      labelHi: "होम",
      href: "/",
      icon: Home,
      matchRegex: /^\/$/,
    },
    {
      id: "learn",
      label: "Learn",
      labelHi: "सीखें",
      href: "/learn",
      icon: Flame,
      matchRegex: /^\/learn/,
    },
    {
      id: "quizzes",
      label: "Quiz Hub",
      labelHi: "क्विज़ हब",
      shortLabel: "Play",
      shortLabelHi: "खेलें",
      href: "/quizzes",
      icon: Play,
      isElevated: true, // Visually elevated exact center FAB (3rd of 5)
      matchRegex: /^\/(quizzes|category)/,
    },
    {
      id: "mockTests",
      label: "Mock Tests",
      labelHi: "मॉक टेस्ट",
      href: "/mock-tests",
      icon: FileText,
      matchRegex: /^\/mock-tests/,
    },
    {
      id: "profile",
      label: "Profile",
      labelHi: "प्रोफ़ाइल",
      href: "/profile",
      icon: User,
      matchRegex: /^\/(profile|wallet|settings)/,
    },
  ],
  [TIERS.STUDENTS]: [
    {
      id: "home",
      label: "Home",
      labelHi: "होम",
      href: "/",
      icon: Home,
      matchRegex: /^\/$/,
    },
    {
      id: "study",
      label: "Study",
      labelHi: "पढ़ाई",
      href: "/school-study",
      icon: BookOpen,
      matchRegex: /^\/(school-study|learn)/,
    },
    {
      id: "funZone",
      label: "Fun Zone",
      labelHi: "फन ज़ोन",
      shortLabel: "Fun",
      shortLabelHi: "फन",
      href: "/quizzes",
      icon: Sparkles,
      isElevated: true,
      matchRegex: /^\/(quizzes|category)/,
    },
    {
      id: "currentAffairs",
      label: "Current Affairs",
      labelHi: "करंट अफेयर्स",
      href: "/daily-current-affairs",
      icon: Flame,
      matchRegex: /^\/(daily-current-affairs|current-affairs)/,
    },
    {
      id: "profile",
      label: "Profile",
      labelHi: "प्रोफ़ाइल",
      href: "/profile",
      icon: User,
      matchRegex: /^\/(profile|wallet|settings|leaderboard)/,
    },
  ],
  [TIERS.KIDS]: [
    {
      id: "home",
      label: "Home",
      labelHi: "होम",
      href: "/",
      icon: Home,
      matchRegex: /^\/$/,
    },
    {
      id: "rewards",
      label: "Rewards",
      labelHi: "इनाम",
      href: "/rewards",
      icon: Star,
      matchRegex: /^\/rewards/,
    },
    {
      id: "quizzes",
      label: "Play",
      labelHi: "खेलें",
      shortLabel: "Play",
      shortLabelHi: "खेलें",
      href: "/quizzes",
      icon: Play,
      isElevated: true,
      matchRegex: /^\/(quizzes|category)/,
    },
    {
      id: "parent",
      label: "Parent",
      labelHi: "पैरेंट",
      href: "/parent",
      icon: ShieldCheck,
      matchRegex: /^\/parent/,
    },
  ],
};

export default function BottomNavBar() {
  const pathname = usePathname();
  const { tier, hasSavedTier, mounted: tierMounted } = useTier();
  const { isHindi } = useLanguage();
  const { isFullscreen } = useQuiz();

  // Requirement: Don't add a bottom nav bar to the unset landing page at root
  if (pathname === "/" && (!tierMounted || !hasSavedTier)) {
    return null;
  }

  // Requirement: While playing quizzes or mock tests, do not show bottom navigation bar
  const isQuizPlaying = pathname?.startsWith("/quiz") || pathname?.startsWith("/live");
  const isTimedExam = pathname?.includes("/mock-tests/paper/");
  const isAdmin = pathname?.startsWith("/admin");

  if (isAdmin || isTimedExam || isQuizPlaying) {
    return null;
  }

  // Get current tier's destinations (defaults to Adults if undefined)
  const destinations = TIER_NAVIGATION_CONFIG[tier] || TIER_NAVIGATION_CONFIG[TIERS.ADULTS];

  // Helper to determine if a destination tab is active
  const isTabActive = (item) => {
    if (item.href === "/") {
      return pathname === "/";
    }
    if (item.matchRegex) {
      return item.matchRegex.test(pathname);
    }
    return pathname.startsWith(item.href);
  };

  return (
    <nav
      aria-label="Bottom Navigation"
      role="navigation"
      className="fixed bottom-0 inset-x-0 z-50 pointer-events-none pb-[max(0.5rem,env(safe-area-inset-bottom,0px))]"
    >
      <div className="w-full max-w-lg mx-auto px-3 sm:px-4">
        {/* Floating Capsule Bar (Native app feel matching Seekho screenshots) */}
        <div className="pointer-events-auto relative w-full h-[62px] sm:h-[66px] bg-slate-950/95 dark:bg-slate-950/95 backdrop-blur-2xl border border-white/10 dark:border-slate-800/90 rounded-full px-2 shadow-[0_10px_35px_rgba(0,0,0,0.45)] flex items-center justify-between select-none">
          {destinations.map((item, index) => {
            const isActive = isTabActive(item);
            const Icon = item.icon;
            const label = isHindi ? (item.labelHi || item.label) : item.label;
            const shortLabel = isHindi
              ? (item.shortLabelHi || item.labelHi || item.label)
              : (item.shortLabel || item.label);

            // ── Requirement 3: Visually Elevated Most-Used Tab (Quiz Hub FAB) ──
            if (item.isElevated) {
              return (
                <div key={item.id} className="relative flex-1 flex flex-col items-center justify-center">
                  <Link
                    href={item.href}
                    title={label}
                    className="group relative -top-4 sm:-top-5 focus:outline-none"
                  >
                    <motion.div
                      whileHover={{ scale: 1.08, y: -2 }}
                      whileTap={{ scale: 0.94 }}
                      transition={{ type: "spring", stiffness: 450, damping: 25 }}
                      className={`relative w-14 h-14 sm:w-16 sm:h-16 rounded-2xl sm:rounded-full flex flex-col items-center justify-center text-white shadow-2xl transition-all ${
                        isActive
                          ? "bg-gradient-to-tr from-indigo-500 via-indigo-600 to-purple-600 ring-4 ring-indigo-400/50 shadow-[0_8px_25px_rgba(99,102,241,0.6)]"
                          : "bg-gradient-to-tr from-indigo-600 to-purple-700 hover:from-indigo-500 hover:to-purple-600 shadow-[0_6px_20px_rgba(79,70,229,0.45)] border-2 border-slate-950"
                      }`}
                    >
                      <Play
                        size={22}
                        fill="currentColor"
                        className="translate-x-0.5 group-hover:scale-110 transition-transform"
                      />
                      <span className="text-[10px] font-black uppercase tracking-wider mt-0.5 leading-none">
                        {shortLabel}
                      </span>
                    </motion.div>
                  </Link>
                </div>
              );
            }

            // ── Standard Destinations with Requirement 2 Filled Pill Active Highlight ──
            return (
              <Link
                key={item.id}
                href={item.href}
                className="relative flex-1 h-full flex flex-col items-center justify-center focus:outline-none"
              >
                {/* Requirement 2: Active tab gets a filled rounded pill */}
                {isActive && (
                  <motion.div
                    layoutId="bottomNavActivePill"
                    className="absolute inset-y-1.5 inset-x-1 sm:inset-x-2 bg-white text-slate-950 rounded-full shadow-md pointer-events-none"
                    transition={{
                      type: "spring",
                      stiffness: 500,
                      damping: 34,
                    }}
                  />
                )}

                <div
                  className={`relative z-10 flex flex-col items-center justify-center transition-colors duration-200 ${
                    isActive
                      ? "text-slate-950 font-black"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <Icon
                    size={19}
                    strokeWidth={isActive ? 2.6 : 2}
                    className="transition-transform duration-200"
                  />
                  <span
                    className={`text-[10.5px] sm:text-[11px] leading-tight mt-0.5 tracking-tight ${
                      isActive ? "font-black" : "font-semibold opacity-90"
                    }`}
                  >
                    {label}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
