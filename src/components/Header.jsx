"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Sparkles, Flame } from "lucide-react";
import TierSwitcher from "./TierSwitcher";
import { useUI } from "@/context/UIContext";
import { useTier } from "@/context/TierContext";
import { useLanguage } from "@/context/LanguageContext";
import styles from "@/styles/Header.module.css";

export default function Header() {
  const { toggleMobileMenu, isMobileMenuOpen } = useUI();
  const pathname = usePathname();
  const router = useRouter();
  const { hasSavedTier, clearTier } = useTier();
  const { isHindi, toggleLanguage } = useLanguage();
  const [isMounted, setIsMounted] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [streakCount, setStreakCount] = useState(5);

  useEffect(() => {
    setIsMounted(true);
    try {
      const saved = localStorage.getItem("daily_quiz_streak");
      if (saved) setStreakCount(parseInt(saved, 10));
    } catch {}
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 8) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogoClick = (e) => {
    e.preventDefault();
    clearTier();
    if (pathname === "/") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      router.push("/");
    }
  };

  const isQuizOrExamRoute = pathname?.startsWith("/quiz/") || pathname?.includes("/mock-tests/paper/") || pathname?.startsWith("/live/") || pathname?.startsWith("/t/");
  const isFlashcardRoute = pathname?.startsWith("/fun-facts") || pathname?.startsWith("/true-false");
  const isArenaRoute = pathname?.startsWith("/arena");
  const isCategoryRoute = pathname?.startsWith("/category");
  const isSchoolStudyRoute = pathname?.startsWith("/school-study");
  if (!isMounted || pathname?.startsWith("/admin") || isQuizOrExamRoute || isFlashcardRoute || isArenaRoute || isCategoryRoute || isSchoolStudyRoute) return null;

  const isMasterLanding = !hasSavedTier && pathname === "/";

  return (
    <>
      <header className={`${styles.header} ${isScrolled ? styles.scrolled : ""}`}>
        <div className={styles.container}>
          <Link href="/" className={styles.logo} onClick={handleLogoClick}>
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 shrink-0">
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 fill-white/20" />
            </div>
            <span className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
              Quiz<span className="text-indigo-600 dark:text-indigo-400">Web</span>
            </span>
          </Link>

          <div className={styles.headerActions}>
            {isMasterLanding ? (
              <div className="flex items-center space-x-2">
                {/* Daily Streak Counter */}
                <div
                  title="Daily Active Streak"
                  className="flex items-center space-x-1 bg-amber-50 dark:bg-amber-950/60 border border-amber-200/80 dark:border-amber-800/80 px-2 sm:px-2.5 py-1 rounded-full shadow-xs cursor-pointer active:scale-95 transition-transform"
                  onClick={() => alert(isHindi ? `🔥 शानदार! आपकी लगातार अध्ययन स्ट्रीक ${streakCount} दिनों की है।` : `🔥 Awesome! Your active study streak is ${streakCount} days.`)}
                >
                  <Flame className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500 fill-amber-500 animate-pulse" />
                  <span className="text-xs font-bold text-amber-800 dark:text-amber-300">{streakCount}d</span>
                </div>

                {/* Language Switch */}
                <button
                  onClick={toggleLanguage}
                  className="text-xs font-semibold px-2 sm:px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition"
                  aria-label="Toggle Language"
                >
                  {isHindi ? "EN" : "हिन्दी"}
                </button>
              </div>
            ) : (
              <TierSwitcher />
            )}

            <button
              className={`${styles.mobileMenuButton} ${isMobileMenuOpen ? styles.open : ""}`}
              onClick={toggleMobileMenu}
              aria-label="Toggle navigation menu"
              aria-expanded={isMobileMenuOpen}
            >
              <span className={styles.hamburgerLine}></span>
              <span className={styles.hamburgerLine}></span>
              <span className={styles.hamburgerLine}></span>
            </button>
          </div>
        </div>
      </header>
      {/* Spacer to prevent content jump when header is fixed */}
      <div className={styles.headerSpacer} aria-hidden="true" />
    </>
  );
}
