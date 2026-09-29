"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Home,
  BookOpen,
  Play,
  Flame,
  User,
  Sparkles,
  Globe,
} from "lucide-react";
import { useTier, TIERS } from "@/context/TierContext";
import { useLanguage } from "@/context/LanguageContext";
import { DEFAULT_MODULES_CONFIG } from "@/lib/modulesConfig";
import { useData } from "@/context/DataContext";

/**
 * Standard 5-tab destinations: Home · GK · Play · Current · Seekho
 * Center PLAY button opens Quiz Arena.
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
      id: "gk",
      label: "GK",
      labelHi: "जीके",
      shortLabel: "GK",
      shortLabelHi: "जीके",
      href: "/gk",
      icon: Globe,
      matchRegex: /^\/gk/,
    },
    {
      id: "play",
      label: "Play",
      labelHi: "खेलें",
      shortLabel: "Play",
      shortLabelHi: "खेलें",
      href: "/arena",
      icon: Play,
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
      icon: Flame,
      matchRegex: /^\/(daily-current-affairs|current-affairs)/,
    },
    {
      id: "seekho",
      label: "Seekho",
      labelHi: "सीखो",
      shortLabel: "Seekho",
      shortLabelHi: "सीखो",
      href: "/learn",
      icon: BookOpen,
      matchRegex: /^\/learn/,
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
      icon: Home,
      matchRegex: /^\/$/,
    },
    {
      id: "learn",
      label: "Study",
      labelHi: "पढ़ाई",
      shortLabel: "Study",
      shortLabelHi: "पढ़ाई",
      href: "/school-study",
      icon: BookOpen,
      matchRegex: /^\/(school-study|learn)/,
    },
    {
      id: "play",
      label: "Play",
      labelHi: "खेलें",
      shortLabel: "Play",
      shortLabelHi: "खेलें",
      href: "/arena?audience=students",
      icon: Play,
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
      icon: Flame,
      matchRegex: /^\/(daily-current-affairs|current-affairs)/,
    },
    {
      id: "profile",
      label: "Profile",
      labelHi: "प्रोफ़ाइल",
      shortLabel: "Profile",
      shortLabelHi: "प्रोफ़ाइल",
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
      shortLabel: "Home",
      shortLabelHi: "होम",
      href: "/",
      icon: Home,
      matchRegex: /^\/$/,
    },
    {
      id: "learn",
      label: "Explore",
      labelHi: "सैर",
      shortLabel: "Explore",
      shortLabelHi: "सैर",
      href: "/learn",
      icon: Sparkles,
      matchRegex: /^\/learn/,
    },
    {
      id: "play",
      label: "Play",
      labelHi: "खेलें",
      shortLabel: "Play",
      shortLabelHi: "खेलें",
      href: "/arena?audience=kids",
      icon: Play,
      isElevated: true,
      matchRegex: /^\/arena/,
    },
    {
      id: "profile",
      label: "Profile",
      labelHi: "प्रोफ़ाइल",
      shortLabel: "Profile",
      shortLabelHi: "प्रोफ़ाइल",
      href: "/profile",
      icon: User,
      matchRegex: /^\/profile/,
    },
  ],
};

export default function BottomNavBar() {
  const pathname = usePathname();
  const router = useRouter();
  const { tier, hasSavedTier, mounted: tierMounted } = useTier();
  const { isHindi } = useLanguage();
  const { modules } = useData();

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
    if (item.id === "learn" && activeModules.learn === false) return false;
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

  const handlePlayClick = (e, item) => {
    e.preventDefault();
    router.push(item.href || "/arena");
  };

  return (
    <nav
      aria-label="Bottom Navigation"
      role="navigation"
      className="fixed bottom-0 left-0 right-0 w-full z-50 bg-[#FFFFFF] border-t border-[#EEF0F4] shadow-[0_-4px_20px_rgba(0,0,0,0.05)] select-none pb-[env(safe-area-inset-bottom,0px)]"
    >
      {/* 100% width full responsive bar, centered content on tablet/desktop */}
      <div className="w-full max-w-lg md:max-w-2xl mx-auto h-[62px] sm:h-[66px] px-2 sm:px-6 flex items-center justify-between relative">
        {destinations.map((item) => {
          const isActive = isTabActive(item);
          const Icon = item.icon;
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
                <Link
                  href={item.href}
                  prefetch={true}
                  title={label}
                  className="group relative -top-4 sm:-top-5 focus:outline-none min-w-[52px] min-h-[52px] flex items-center justify-center"
                  aria-label={label}
                >
                  <motion.div
                    whileTap={{ scale: 0.94 }}
                    transition={{ type: "spring", stiffness: 450, damping: 25 }}
                    className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-2xl sm:rounded-full bg-gradient-to-tr from-[#6366F1] to-[#8B5CF6] flex flex-col items-center justify-center text-white ring-4 ring-white shadow-lg shadow-indigo-500/30 transition-transform"
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
                      ? "bg-[#EEF2FF] text-[#6366F1] px-3 py-1"
                      : "text-[#94A3B8] hover:text-slate-700 py-1"
                  }`}
                >
                  <Icon
                    size={20}
                    strokeWidth={isActive ? 2.5 : 2}
                    className="transition-transform duration-200"
                  />
                </div>
                <span
                  className={`text-[10.5px] sm:text-[11px] leading-tight mt-0.5 tracking-tight ${
                    isActive
                      ? "text-[#6366F1] font-bold"
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
