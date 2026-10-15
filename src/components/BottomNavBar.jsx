"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";
import { useTier, TIERS } from "@/context/TierContext";
import {
  Home,
  Target,
  Swords,
  GraduationCap,
  Newspaper,
  Sparkles,
  X,
  BookOpen,
  Trophy,
  User,
  Zap,
  ChevronRight,
  Baby,
  Palette,
  Gamepad2,
  Gift,
} from "lucide-react";

/**
 * UNIFIED, UNCLUTTERED BOTTOM NAVIGATION BAR
 * 6 streamlined primary destinations with concise labels:
 * 1. Home (/) - होम
 * 2. Quiz (/quizzes) - क्विज़
 * 3. Battle (/arena?battle=true) - मुकाबला (Elevated Center CTA)
 * 4. Govt Exams (/govt-exams) - परीक्षा
 * 5. School & Kids (/school-study) - स्कूल
 * 6. Others (#others) - अन्य (Drawer Sheet with Current Affairs, Fun Facts, True/False, Books, etc.)
 */
export const BOTTOM_NAV_ITEMS = [
  {
    id: "home",
    href: "/",
    label: "Home",
    labelHi: "होम",
    icon: Home,
    emoji: "🏠",
    matchRegex: /^\/$/,
  },
  {
    id: "quiz",
    href: "/quizzes",
    label: "Quiz",
    labelHi: "क्विज़",
    icon: Target,
    emoji: "🎯",
    matchRegex: /^\/(quizzes|category|sets)/,
  },
  {
    id: "battle",
    href: "/arena?battle=true",
    label: "Battle",
    labelHi: "मुकाबला",
    icon: Swords,
    emoji: "⚔️",
    isElevated: true,
    matchRegex: /^\/arena/,
  },
  {
    id: "govt-exams",
    href: "/govt-exams",
    label: "Exams",
    labelHi: "परीक्षा",
    icon: GraduationCap,
    emoji: "🏛️",
    matchRegex: /^\/(govt-exams|govt-exam-preparation|mock-tests)/,
  },
  {
    id: "school-kids",
    href: "/school-study",
    label: "School",
    labelHi: "स्कूल",
    icon: BookOpen,
    emoji: "🎒",
    matchRegex: /^\/(school-study)/,
  },
  {
    id: "others",
    href: "#others",
    label: "Others",
    labelHi: "अन्य",
    icon: Sparkles,
    emoji: "⚡",
    isModalTrigger: true,
    matchRegex: /^\/(daily-current-affairs|current-affairs|fun-facts|true-false|gk-book|leaderboard|profile)/,
  },
];

export default function BottomNavBar() {
  const pathname = usePathname();
  const router = useRouter();
  const { isHindi } = useLanguage();
  const { tier, setTier } = useTier();
  const [isOthersOpen, setIsOthersOpen] = useState(false);

  // SUPPRESSION RULES:
  // Hide ONLY during full-screen interactive test taking or admin panel
  const isQuizPlaying =
    pathname?.startsWith("/quiz/") ||
    pathname?.startsWith("/live/") ||
    pathname?.startsWith("/t/") ||
    pathname?.startsWith("/institute");
  const isTimedExam = pathname?.includes("/mock-tests/paper/");
  const isAdmin = pathname?.startsWith("/admin");

  if (isAdmin || isTimedExam || isQuizPlaying) {
    return null;
  }

  // ── KID-FRIENDLY FLOATING DOCK (When tier === "kids" or pathname === "/kids") ──
  if (tier === "kids" || pathname === "/kids") {
    const isKidsHome = pathname === "/kids" || pathname === "/";
    const isProfile = pathname === "/profile";
    const isRewards = pathname === "/rewards";

    const handleHomeClick = () => {
      if (pathname === "/kids") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        router.push("/kids");
      }
    };

    const handleTopicsClick = () => {
      if (pathname === "/kids") {
        const el = document.getElementById("kids-topics");
        if (el) {
          el.scrollIntoView({ behavior: "smooth" });
        } else {
          window.scrollTo({ top: 450, behavior: "smooth" });
        }
      } else {
        router.push("/kids#kids-topics");
      }
    };

    const handlePlayClick = () => {
      if (pathname === "/kids") {
        window.dispatchEvent(new CustomEvent("kids-play-quest"));
      } else {
        router.push("/kids");
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent("kids-play-quest"));
        }, 300);
      }
    };

    const handleRewardsClick = () => {
      if (pathname === "/kids") {
        window.dispatchEvent(new CustomEvent("open-kids-stickers"));
      } else {
        router.push("/rewards");
      }
    };

    return (
      <nav
        aria-label="Kids Zone Bottom Navigation"
        role="navigation"
        className="fixed bottom-0 left-0 right-0 w-full z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t-2 border-amber-200 dark:border-amber-900/60 shadow-[0_-4px_25px_rgba(245,158,11,0.15)] select-none pb-[env(safe-area-inset-bottom,0px)]"
      >
        <div className="w-full max-w-[430px] mx-auto h-[62px] sm:h-[66px] px-3 flex items-center justify-between relative">
          {/* 1. Home */}
          <button
            type="button"
            onClick={handleHomeClick}
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 transition cursor-pointer py-1 ${
              isKidsHome
                ? "text-amber-600 dark:text-amber-400 font-black"
                : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-semibold"
            }`}
          >
            <div className={`p-1 rounded-xl transition ${isKidsHome ? "bg-amber-100 dark:bg-amber-950/70" : ""}`}>
              <Home className="w-5 h-5" />
            </div>
            <span className="text-[10px] leading-tight font-black">{isHindi ? "होम" : "Home"}</span>
          </button>

          {/* 2. Topics */}
          <button
            type="button"
            onClick={handleTopicsClick}
            className="flex-1 flex flex-col items-center justify-center gap-0.5 transition cursor-pointer py-1 text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 font-semibold"
          >
            <div className="p-1 rounded-xl hover:bg-amber-50 dark:hover:bg-amber-950/40">
              <Palette className="w-5 h-5" />
            </div>
            <span className="text-[10px] leading-tight font-black">{isHindi ? "विषय" : "Topics"}</span>
          </button>

          {/* 3. Center Elevated Play Button with Pulsing Glow */}
          <div className="flex-1 flex flex-col items-center justify-end pb-1">
            <button
              type="button"
              onClick={handlePlayClick}
              className="group relative -top-3 focus:outline-none flex flex-col items-center justify-center cursor-pointer"
              aria-label={isHindi ? "खेलें" : "Play"}
            >
              <div className="relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-60"></span>
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.92 }}
                  className="w-13 h-13 rounded-full bg-gradient-to-tr from-amber-400 via-orange-500 to-pink-500 text-white flex items-center justify-center shadow-xl shadow-orange-500/40 border-4 border-white dark:border-slate-900 transition-transform"
                >
                  <Gamepad2 className="w-6 h-6 fill-white/20 text-white" />
                </motion.div>
              </div>
              <span className="text-[10px] font-black text-amber-900 dark:text-amber-300 mt-1 leading-none tracking-tight">
                {isHindi ? "खेलें" : "Play"}
              </span>
            </button>
          </div>

          {/* 4. Rewards / Sticker Album */}
          <button
            type="button"
            onClick={handleRewardsClick}
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 transition cursor-pointer py-1 ${
              isRewards
                ? "text-amber-600 dark:text-amber-400 font-black"
                : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-semibold"
            }`}
          >
            <div className={`p-1 rounded-xl transition ${isRewards ? "bg-amber-100 dark:bg-amber-950/70" : ""}`}>
              <Gift className="w-5 h-5" />
            </div>
            <span className="text-[10px] leading-tight font-black">{isHindi ? "इनाम" : "Rewards"}</span>
          </button>

          {/* 5. Profile */}
          <Link
            href="/profile"
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 transition cursor-pointer py-1 ${
              isProfile
                ? "text-amber-600 dark:text-amber-400 font-black"
                : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-semibold"
            }`}
          >
            <div className={`p-1 rounded-xl transition ${isProfile ? "bg-amber-100 dark:bg-amber-950/70" : ""}`}>
              <User className="w-5 h-5" />
            </div>
            <span className="text-[10px] leading-tight font-black">{isHindi ? "प्रोफ़ाइल" : "Profile"}</span>
          </Link>
        </div>
      </nav>
    );
  }

  const isItemActive = (item) => {
    if (item.matchRegex) {
      return item.matchRegex.test(pathname);
    }
    if (item.href === "/") {
      return pathname === "/";
    }
    return pathname?.startsWith(item.href);
  };

  const handleOthersNavigate = (path, tierId) => {
    if (tierId && setTier) {
      setTier(tierId);
    }
    setIsOthersOpen(false);
    router.push(path);
  };

  return (
    <>
      <nav
        aria-label="Unified Bottom Navigation"
        role="navigation"
        className="fixed bottom-0 left-0 right-0 w-full z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200/80 dark:border-slate-800 shadow-[0_-4px_25px_rgba(0,0,0,0.06)] select-none pb-[env(safe-area-inset-bottom,0px)]"
      >
        {/* Full responsive width container */}
        <div className="w-full max-w-lg md:max-w-2xl mx-auto h-[62px] sm:h-[66px] px-1 sm:px-3 flex items-center justify-between relative">
          {BOTTOM_NAV_ITEMS.map((item) => {
            const isActive = isItemActive(item);
            const label = isHindi ? item.labelHi : item.label;
            const Icon = item.icon;

            // ── Elevated Center "Battle" button ──
            if (item.isElevated) {
              return (
                <div
                  key={item.id}
                  className="relative flex-1 flex flex-col items-center justify-end pb-1 min-w-0"
                >
                  <Link
                    href={item.href}
                    className="group relative -top-3 focus:outline-none flex flex-col items-center justify-center cursor-pointer"
                    aria-label={label}
                  >
                    <motion.div
                      whileHover={{ scale: 1.08 }}
                      whileTap={{ scale: 0.92 }}
                      transition={{ type: "spring", stiffness: 450, damping: 25 }}
                      className="relative w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-[#7C3AED] via-[#6366F1] to-[#4F46E5] flex items-center justify-center text-white ring-3 ring-white dark:ring-slate-900 shadow-md shadow-purple-600/30 border border-purple-300/30 cursor-pointer"
                    >
                      <Swords className="w-5 h-5 text-amber-300 group-hover:rotate-12 transition-transform" />
                      <span className="absolute -top-1 -right-1 bg-amber-400 text-slate-950 font-black text-[7.5px] px-1 py-0.2 rounded-full shadow-xs uppercase tracking-tighter">
                        1v1
                      </span>
                    </motion.div>

                    <span className="text-[10px] sm:text-[10.5px] font-black text-indigo-600 dark:text-indigo-400 mt-1 leading-none tracking-tight">
                      {label}
                    </span>
                  </Link>
                </div>
              );
            }

            // ── "Others" Modal Trigger Button ──
            if (item.isModalTrigger) {
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setIsOthersOpen(true)}
                  className="relative flex-1 h-full min-h-[44px] min-w-0 flex flex-col items-center justify-center focus:outline-none cursor-pointer py-1"
                  aria-label={label}
                >
                  <div className="flex flex-col items-center justify-center">
                    <div
                      className={`flex items-center justify-center rounded-full transition-all duration-200 ${
                        isActive || isOthersOpen
                          ? "bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 px-2 py-0.5"
                          : "text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 py-0.5"
                      }`}
                    >
                      <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                    <span
                      className={`text-[10px] sm:text-[10.5px] leading-tight mt-0.5 tracking-tight truncate max-w-full ${
                        isActive || isOthersOpen
                          ? "text-indigo-600 dark:text-indigo-400 font-bold"
                          : "text-slate-500 dark:text-slate-400 font-medium"
                      }`}
                    >
                      {label}
                    </span>
                  </div>
                </button>
              );
            }

            // ── Standard Destinations ──
            return (
              <Link
                key={item.id}
                href={item.href}
                prefetch={true}
                className="relative flex-1 h-full min-h-[44px] min-w-0 flex flex-col items-center justify-center focus:outline-none cursor-pointer py-1"
                aria-label={label}
              >
                <div className="flex flex-col items-center justify-center">
                  <div
                    className={`flex items-center justify-center rounded-full transition-all duration-200 ${
                      isActive
                        ? "bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 px-2 py-0.5"
                        : "text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 py-0.5"
                    }`}
                  >
                    <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <span
                    className={`text-[10px] sm:text-[10.5px] leading-tight mt-0.5 tracking-tight truncate max-w-full ${
                      isActive
                        ? "text-indigo-600 dark:text-indigo-400 font-bold"
                        : "text-slate-500 dark:text-slate-400 font-medium"
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

      {/* ================= OTHERS BOTTOM DRAWER SHEET ================= */}
      <AnimatePresence>
        {isOthersOpen && (
          <div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
            onClick={() => setIsOthersOpen(false)}
          >
            <motion.div
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-[430px] bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl border border-slate-200/90 dark:border-slate-800 max-h-[85vh] flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                      {isHindi ? "अन्य फीचर्स व हब" : "More Features & Hubs"}
                    </h3>
                    <p className="text-[10px] text-slate-400">
                      {isHindi ? "दैनिक समाचार, रोचक खेल व अध्ययन सामग्री" : "Daily news, fun games & study tools"}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setIsOthersOpen(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-500 cursor-pointer"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Action Grid */}
              <div className="space-y-2 overflow-y-auto pr-1 flex-1">
                {/* 1. Kids Zone & School Study Quick Persona Switchers */}
                <div className="grid grid-cols-2 gap-2 mb-1">
                  {/* Kids Hub Card */}
                  <div
                    onClick={() => handleOthersNavigate("/school-study", TIERS.KIDS)}
                    className="p-3 rounded-2xl border border-amber-200/90 dark:border-amber-900/60 bg-amber-50/70 dark:bg-amber-950/30 hover:bg-amber-100/70 transition-all cursor-pointer flex flex-col justify-between group active:scale-[0.98]"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center text-lg">
                        👶
                      </div>
                      <span className="text-[8.5px] font-black uppercase bg-amber-200 text-amber-900 px-1.5 py-0.2 rounded">
                        AGE 5-12
                      </span>
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-slate-900 dark:text-white">
                        {isHindi ? "बच्चे (Kids Zone)" : "Kids Zone"}
                      </h4>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">
                        {isHindi ? "सरल खेल व बुनियादी ज्ञान" : "Fun games & basics"}
                      </p>
                    </div>
                  </div>

                  {/* School / Students Card */}
                  <div
                    onClick={() => handleOthersNavigate("/school-study", TIERS.STUDENTS)}
                    className="p-3 rounded-2xl border border-emerald-200/90 dark:border-emerald-900/60 bg-emerald-50/70 dark:bg-emerald-950/30 hover:bg-emerald-100/70 transition-all cursor-pointer flex flex-col justify-between group active:scale-[0.98]"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center text-lg">
                        🎓
                      </div>
                      <span className="text-[8.5px] font-black uppercase bg-emerald-200 text-emerald-900 px-1.5 py-0.2 rounded">
                        CLASS 6-12
                      </span>
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-slate-900 dark:text-white">
                        {isHindi ? "विद्यार्थी (School)" : "School Study"}
                      </h4>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">
                        {isHindi ? "NCERT व बोर्ड परीक्षा" : "Class 6-12 subjects"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* 2. Daily Current Affairs */}
                <div
                  onClick={() => handleOthersNavigate("/daily-current-affairs")}
                  className="p-3 rounded-2xl border border-slate-200/90 dark:border-slate-800 hover:border-sky-400 bg-sky-50/40 dark:bg-sky-950/20 hover:bg-sky-50/70 transition-all cursor-pointer flex items-center justify-between group active:scale-[0.99]"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-sky-100 dark:bg-sky-900/40 text-sky-600 dark:text-sky-300 flex items-center justify-center text-xl shrink-0 group-hover:scale-105 transition-transform">
                      📰
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                          {isHindi ? "दैनिक करेंट अफेयर्स (Current Affairs)" : "Daily Current Affairs"}
                        </h4>
                        <span className="bg-sky-100 text-sky-800 text-[9px] font-black px-1.5 py-0.2 rounded">
                          DAILY
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {isHindi ? "आज के शीर्ष 10 समाचार व 5-प्रश्नों का टेस्ट" : "Today's top news & daily recap quiz"}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-sky-600 group-hover:translate-x-0.5 transition-transform" />
                </div>

                {/* 3. Fun Facts */}
                <div
                  onClick={() => handleOthersNavigate("/fun-facts")}
                  className="p-3 rounded-2xl border border-slate-200/90 dark:border-slate-800 hover:border-amber-400 bg-amber-50/40 dark:bg-amber-950/20 hover:bg-amber-50/70 transition-all cursor-pointer flex items-center justify-between group active:scale-[0.99]"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-300 flex items-center justify-center text-xl shrink-0 group-hover:scale-105 transition-transform">
                      💡
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                          {isHindi ? "रोचक तथ्य (Fun Facts)" : "Fun Facts & Trivia"}
                        </h4>
                        <span className="bg-amber-100 text-amber-800 text-[9px] font-black px-1.5 py-0.2 rounded">
                          1,000+
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {isHindi ? "3D फ्लिप कार्ड्स, ऑडियो और अद्भुत ज्ञान" : "1,000+ mind-blowing educational facts"}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-amber-600 group-hover:translate-x-0.5 transition-transform" />
                </div>

                {/* 4. True & False */}
                <div
                  onClick={() => handleOthersNavigate("/true-false")}
                  className="p-3 rounded-2xl border border-slate-200/90 dark:border-slate-800 hover:border-emerald-400 bg-emerald-50/40 dark:bg-emerald-950/20 hover:bg-emerald-50/70 transition-all cursor-pointer flex items-center justify-between group active:scale-[0.99]"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-300 flex items-center justify-center text-xl shrink-0 group-hover:scale-105 transition-transform">
                      ⚡
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                          {isHindi ? "सही या गलत (True & False)" : "True & False Challenge"}
                        </h4>
                        <span className="bg-emerald-100 text-emerald-800 text-[9px] font-black px-1.5 py-0.2 rounded">
                          RAPID
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {isHindi ? "60 सेकंड में तुरंत निर्णय लें व स्कोर बनाएं" : "Fast-paced 1-tap rapid trivia game"}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-transform" />
                </div>

                {/* 5. GK Digital Books */}
                <div
                  onClick={() => handleOthersNavigate("/gk-book")}
                  className="p-3 rounded-2xl border border-slate-200/90 dark:border-slate-800 hover:border-indigo-400 bg-indigo-50/40 dark:bg-indigo-950/20 hover:bg-indigo-50/70 transition-all cursor-pointer flex items-center justify-between group active:scale-[0.99]"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300 flex items-center justify-center text-xl shrink-0 group-hover:scale-105 transition-transform">
                      📖
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                        {isHindi ? "GK डिजिटल पुस्तकें (My Books)" : "Digital GK Books"}
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {isHindi ? "संरचित अध्याय व पेज-वार अभ्यास प्रश्न" : "Chapter-wise digital study books"}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-transform" />
                </div>

                {/* 6. Leaderboard */}
                <div
                  onClick={() => handleOthersNavigate("/leaderboard")}
                  className="p-3 rounded-2xl border border-slate-200/90 dark:border-slate-800 hover:border-violet-400 bg-white dark:bg-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer flex items-center justify-between group active:scale-[0.99]"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-300 flex items-center justify-center text-xl shrink-0 group-hover:scale-105 transition-transform">
                      🏆
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                        {isHindi ? "लीडरबोर्ड व रैंकिंग (Leaderboard)" : "Rankings & Leaderboard"}
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {isHindi ? "देशभर के टॉप खिलाड़ियों की रैंक देखें" : "All-India competitive rankings"}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-purple-600 group-hover:translate-x-0.5 transition-transform" />
                </div>

                {/* 7. Profile */}
                <div
                  onClick={() => handleOthersNavigate("/profile")}
                  className="p-3 rounded-2xl border border-slate-200/90 dark:border-slate-800 hover:border-slate-400 bg-white dark:bg-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer flex items-center justify-between group active:scale-[0.99]"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center text-xl shrink-0 group-hover:scale-105 transition-transform">
                      👤
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                        {isHindi ? "मेरी प्रोफ़ाइल (Profile & Stats)" : "My Profile & Badges"}
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {isHindi ? "आपकी प्रगति, सिक्के व खाता सेटिंग्स" : "Your quiz history, coins & settings"}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
