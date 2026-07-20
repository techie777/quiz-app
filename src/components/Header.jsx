"use client";

import Link from "next/link";
import { useSession, signOut, signIn } from "next-auth/react";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import ThemeToggle from "./ThemeToggle";
import LanguageToggle from "./LanguageToggle";
import UserMenu from "./UserMenu";
import BadgesModal from "./BadgesModal";
import { useUI } from "@/context/UIContext";
import { useQuiz } from "@/context/QuizContext";
import { useLanguage } from "@/context/LanguageContext";
import { Menu, Coins } from "lucide-react";
import styles from "@/styles/Header.module.css";

export default function Header() {
  const { data: session, status } = useSession();
  const { toggleMobileMenu, isMobileMenuOpen } = useUI();
  const { t, mounted: langMounted, isHindi } = useLanguage();
  const pathname = usePathname();
  const { isFullscreen: quizFullscreen, dailyStreak, totalXP } = useQuiz();
  const [isBrowserFullscreen, setIsBrowserFullscreen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [showBadgesModal, setShowBadgesModal] = useState(false);
  const [coinBalance, setCoinBalance] = useState(0);

  useEffect(() => {
    setIsMounted(true);
    const handleFullscreen = () => setIsBrowserFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handleFullscreen);
    return () => document.removeEventListener("fullscreenchange", handleFullscreen);
  }, []);

  // Fetch coin balance for logged-in users
  useEffect(() => {
    if (status === "authenticated" && session?.user && !session.user.isAdmin) {
      fetch("/api/wallet")
        .then((r) => r.json())
        .then((data) => {
          if (data.coinBalance !== undefined) {
            setCoinBalance(data.coinBalance);
          }
        })
        .catch(() => {});
    }
  }, [status, session]);

  // Listen for coin balance updates from quiz context
  useEffect(() => {
    const handleCoinUpdate = (event) => {
      if (event.detail?.coinBalance !== undefined) {
        setCoinBalance(event.detail.coinBalance);
      }
    };

    window.addEventListener('coinBalanceUpdate', handleCoinUpdate);
    return () => window.removeEventListener('coinBalanceUpdate', handleCoinUpdate);
  }, []);

  const isQuizOrExamRoute = pathname?.startsWith("/quiz/") || pathname?.includes("/mock-tests/paper/") || pathname?.startsWith("/live/");
  const isFullscreen = (isBrowserFullscreen || quizFullscreen) && isQuizOrExamRoute;

  // Hydration fix: Always render the header on the server and initial client render
  if (isMounted && isFullscreen) return null;

  if (pathname?.startsWith("/admin") || pathname?.includes("/mock-tests/paper/")) return null;

  if (!isMounted) {
    return (
      <header className={styles.header}>
        <div className={styles.container}>
          <Link href="/" className={styles.logo}>
            <span className={styles.logoEmoji}>🧠</span>
            <span className={styles.logoText}>QuizWeb</span>
          </Link>
          <div className={styles.headerActions}></div>
        </div>
      </header>
    );
  }

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
              {status === "authenticated" && session?.user && !session.user.isAdmin && (
                <div
                  className={styles.coinBadge}
                  title={isHindi ? "सिक्के" : "Coins"}
                  style={{
                    background: "rgba(251, 191, 36, 0.12)",
                    border: "1px solid rgba(251, 191, 36, 0.3)",
                    color: "#d97706",
                    padding: "4px 10px",
                    borderRadius: "12px",
                    fontWeight: "800",
                    fontSize: "0.8rem",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                    marginRight: "6px"
                  }}
                  onClick={() => window.location.href = "/wallet"}
                >
                  <Coins size={14} />
                  {coinBalance}
                </div>
              )}
              <button
                type="button"
                onClick={() => setShowBadgesModal(true)}
                title={isHindi ? "उपलब्धियां देखें" : "View Achievements"}
                className="hidden md:inline-flex"
                style={{
                  background: "rgba(245, 158, 11, 0.12)",
                  border: "1px solid rgba(245, 158, 11, 0.3)",
                  color: "#d97706",
                  padding: "4px 10px",
                  borderRadius: "12px",
                  fontWeight: "800",
                  fontSize: "0.8rem",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                  marginRight: "6px"
                }}
              >
                🏆
              </button>
              {dailyStreak > 0 && (
                <div className={`${styles.streakBadge} hidden md:flex`} title="Daily Streak">
                  🔥 {dailyStreak}
                </div>
              )}
              <div className={`${styles.xpContainer} hidden md:flex`}>
                <div className={styles.xpLevel}>LVL {Math.floor(totalXP / 1000) + 1}</div>
                <div className={styles.xpTrack}>
                  <div className={styles.xpFill} style={{ width: `${(totalXP % 1000) / 10}%` }} />
                </div>
              </div>
            </div>

            <BadgesModal isOpen={showBadgesModal} onClose={() => setShowBadgesModal(false)} />
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
              <button 
                onClick={() => {
                  if (typeof window !== "undefined") sessionStorage.setItem("auth_toast", "login");
                  signIn("google", { callbackUrl: "/" });
                }}
                className={styles.signInBtn}
              >
                 <svg viewBox="0 0 24 24" width="16" height="16" style={{ marginRight: '6px', display: 'inline-block', verticalAlign: 'middle', marginTop: '-2px' }}>
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1c-2.97 0-5.46.98-7.28 2.66l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                 </svg>
                {langMounted ? t('nav.signIn') : 'Sign In'}
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
