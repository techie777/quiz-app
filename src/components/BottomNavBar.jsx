"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
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
import { useData } from "@/context/DataContext";
import { DEFAULT_MODULES_CONFIG } from "@/lib/modulesConfig";

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
      shortLabel: "Home",
      shortLabelHi: "होम",
      href: "/",
      icon: Home,
      matchRegex: /^\/$/,
    },
    {
      id: "learn",
      label: "Learn",
      labelHi: "सीखें",
      shortLabel: "Learn",
      shortLabelHi: "सीखें",
      href: "/learn",
      icon: BookOpen,
      matchRegex: /^\/learn/,
    },
    {
      id: "play",
      label: "PLAY",
      labelHi: "खेलें",
      shortLabel: "PLAY",
      shortLabelHi: "खेलें",
      href: "/play",
      icon: Play,
      isElevated: true, // Visually elevated exact center FAB (3rd of 5)
      matchRegex: /^\/(quizzes|category|play)/,
    },
    {
      id: "currentAffairs",
      label: "Current",
      labelHi: "करंट",
      shortLabel: "Current",
      shortLabelHi: "करंट",
      href: "/daily-current-affairs",
      icon: Flame,
      matchRegex: /^\/(daily-current-affairs|current-affairs)/,
    },
    {
      id: "mockTests",
      label: "Tests",
      labelHi: "टेस्ट",
      shortLabel: "Tests",
      shortLabelHi: "टेस्ट",
      href: "/mock-tests",
      icon: FileText,
      matchRegex: /^\/mock-tests/,
    },
    {
      id: "profile",
      label: "Profile",
      labelHi: "प्रोफ़ाइल",
      shortLabel: "Profile",
      shortLabelHi: "प्रोफ़ाइल",
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
  const router = useRouter();
  const pathname = usePathname();
  const { tier, hasSavedTier, mounted: tierMounted, currentConfig } = useTier();
  const { isHindi } = useLanguage();
  const { isFullscreen, startMixedQuiz } = useQuiz();
  const { modules } = useData();

  // Handle direct quick play for centre PLAY button (no extra screen)
  const handleQuickPlay = async (e) => {
    e.preventDefault();
    try {
      let preferredCats = "";
      try {
        const stored = localStorage.getItem("quiz_recent_categories");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            preferredCats = parsed.join(",");
          }
        }
      } catch {}

      const res = await fetch(`/api/quiz/quick-play?count=10&categories=${encodeURIComponent(preferredCats)}`, {
        cache: "no-store",
      });

      if (res.ok) {
        const data = await res.json();
        if (data.questions && data.questions.length > 0) {
          const title = isHindi ? "क्विक क्विज़" : "Quick Quiz";
          startMixedQuiz(data.questions, title, 30, "ALL", isHindi ? "hi" : "en");
          router.push("/quiz/quick");
          return;
        }
      }
    } catch (err) {
      console.error("Quick play error:", err);
    }
    // Fallback directly to /play
    router.push("/play");
  };

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
  const allDestinations = TIER_NAVIGATION_CONFIG[tier] || TIER_NAVIGATION_CONFIG[TIERS.ADULTS];
  const activeModules = modules || DEFAULT_MODULES_CONFIG;
  const destinations = allDestinations.filter((item) => {
    if (item.id === "home" && activeModules.home === false) return false;
    if ((item.id === "learn" || item.id === "study") && activeModules.learn === false) return false;
    if ((item.id === "quizzes" || item.id === "funZone" || item.id === "play") && activeModules.play === false) return false;
    if (item.id === "mockTests" && !activeModules.mockTests) return false;
    if (item.id === "currentAffairs" && activeModules.currentAffairs === false) return false;
    if (item.id === "profile" && activeModules.profile === false) return false;
    if (item.id === "careerGuide" && !activeModules.careerGuide) return false;
    return true;
  });

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
          {destinations.map((item) => {
            const isActive = isTabActive(item);
            const Icon = item.icon;
            const label = isHindi ? (item.labelHi || item.label) : item.label;
            const shortLabel = isHindi
              ? (item.shortLabelHi || item.labelHi || item.label)
              : (item.shortLabel || item.label);

            // ── Visually Elevated Most-Used Tab (PLAY center highlighted FAB) ──
            if (item.isElevated) {
              return (
                <div key={item.id} className="relative flex-1 flex flex-col items-center justify-center">
                  <Link
                    href={item.href}
                    onClick={handleQuickPlay}
                    title={label}
                    className="group relative -top-4 sm:-top-5 focus:outline-none min-w-[48px] min-h-[48px] flex items-center justify-center"
                    aria-label={label}
                  >
                    <motion.div
                      whileTap={{ scale: 0.94 }}
                      transition={{ type: "spring", stiffness: 450, damping: 25 }}
                      style={{
                        background: currentConfig?.gradient || "var(--brand-gradient)",
                        boxShadow: isActive
                          ? `0 8px 25px ${currentConfig?.glowColor || "rgba(99,102,241,0.5)"}`
                          : `0 6px 20px ${currentConfig?.glowColor || "rgba(79,70,229,0.35)"}`,
                      }}
                      className={`relative w-14 h-14 sm:w-16 sm:h-16 rounded-2xl sm:rounded-full flex flex-col items-center justify-center text-white transition-all ${
                        isActive
                          ? "ring-4 ring-white/40"
                          : "border-2 border-slate-950 hover:brightness-110"
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

            // ── Standard Destinations with Filled Pill Active Highlight ──
            return (
              <Link
                key={item.id}
                href={item.href}
                className="relative flex-1 h-full min-h-[44px] min-w-[44px] flex flex-col items-center justify-center focus:outline-none"
                aria-label={label}
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
