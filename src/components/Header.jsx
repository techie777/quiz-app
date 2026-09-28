"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Sparkles } from "lucide-react";
import TierSwitcher from "./TierSwitcher";
import { useUI } from "@/context/UIContext";
import { useTier } from "@/context/TierContext";
import styles from "@/styles/Header.module.css";

export default function Header() {
  const { toggleMobileMenu, isMobileMenuOpen } = useUI();
  const pathname = usePathname();
  const router = useRouter();
  const { hasSavedTier, clearTier } = useTier();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
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

  const isQuizOrExamRoute = pathname?.startsWith("/quiz/") || pathname?.includes("/mock-tests/paper/") || pathname?.startsWith("/live/");
  if (pathname?.startsWith("/admin") || isQuizOrExamRoute) return null;

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <Link href="/" className={styles.logo} onClick={handleLogoClick}>
          <span className="flex items-center justify-center w-8 h-8 rounded-xl bg-indigo-600/10 dark:bg-indigo-400/15 text-indigo-600 dark:text-indigo-400">
            <Sparkles size={18} />
          </span>
          <span className={styles.logoText}>QuizWeb</span>
        </Link>

        <div className={styles.headerActions}>
          <TierSwitcher />
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
  );
}
