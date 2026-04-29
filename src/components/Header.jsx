"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import ThemeToggle from "./ThemeToggle";
import LanguageToggle from "./LanguageToggle";
import UserMenu from "./UserMenu";
import { useUI } from "@/context/UIContext";
import { useQuiz } from "@/context/QuizContext";
import { useLanguage } from "@/context/LanguageContext";
import { Menu } from "lucide-react";
import styles from "@/styles/Header.module.css";

export default function Header() {
  const { data: session, status } = useSession();
  const { toggleMobileMenu, isMobileMenuOpen } = useUI();
  const { t, mounted: langMounted } = useLanguage();
  const pathname = usePathname();
  const { isFullscreen: quizFullscreen, dailyStreak, totalXP } = useQuiz();
  const [isBrowserFullscreen, setIsBrowserFullscreen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const handleFullscreen = () => setIsBrowserFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handleFullscreen);
    return () => document.removeEventListener("fullscreenchange", handleFullscreen);
  }, []);

  const isFullscreen = isBrowserFullscreen || quizFullscreen;

  if (!isMounted || isFullscreen) return null;

  if (pathname?.startsWith("/admin") || pathname?.includes("/mock-tests/paper/")) return null;

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <Link href="/" className={styles.logo}>
          <span className={styles.logoEmoji}>🧠</span>
          <span className={styles.logoText}>QuizWeb</span>
        </Link>
        
        <div className={styles.headerActions}>
          <div className={styles.mobileActions}>
            <div className={styles.gamification}>
              {dailyStreak > 0 && (
                <div className={styles.streakBadge} title="Daily Streak">
                  🔥 {dailyStreak}
                </div>
              )}
              <div className={styles.xpContainer}>
                <div className={styles.xpLevel}>LVL {Math.floor(totalXP / 1000) + 1}</div>
                <div className={styles.xpTrack}>
                  <div className={styles.xpFill} style={{ width: `${(totalXP % 1000) / 10}%` }} />
                </div>
              </div>
            </div>
            <LanguageToggle />
            <ThemeToggle />
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

          <div className={styles.desktopAuth}>
            {status === "loading" ? (
              <div className={styles.loading}>{langMounted ? t('nav.loading') : '...'}</div>
            ) : session ? (
              <UserMenu />
            ) : (
              <Link href="/signin" className={styles.signInBtn}>
                {langMounted ? t('nav.signIn') : 'Sign In'}
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
