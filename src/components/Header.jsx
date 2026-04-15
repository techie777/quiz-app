"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import ThemeToggle from "./ThemeToggle";
import UserMenu from "./UserMenu";
import { useUI } from "@/context/UIContext";
import { Menu } from "lucide-react";
import styles from "@/styles/Header.module.css";

export default function Header() {
  const { data: session, status } = useSession();
  const { toggleMobileMenu, isMobileMenuOpen } = useUI();
  const pathname = usePathname();
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreen = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handleFullscreen);
    return () => document.removeEventListener("fullscreenchange", handleFullscreen);
  }, []);

  if (pathname?.startsWith("/admin") || pathname?.includes("/mock-tests/paper/")) return null;

  return (
    <header className={`${styles.header} ${isFullscreen ? 'absolute top-0 left-0 w-full z-50 bg-black/40 backdrop-blur-sm border-b border-white/10' : ''}`}>
      <div className={styles.container}>
        <Link href="/" className={styles.logo}>
          <span className={styles.logoEmoji}>🧠</span>
          <span className={`${styles.logoText} ${isFullscreen ? 'text-white' : ''}`}>QuizWeb</span>
        </Link>
        
        <div className={styles.headerActions}>
          {isFullscreen ? (
            <button 
              onClick={toggleMobileMenu}
              className="flex items-center gap-2 bg-slate-800/80 hover:bg-slate-700 text-white px-4 py-2 rounded-full border border-slate-600 transition"
            >
              <Menu size={16} /> Navigation
            </button>
          ) : (
            <>
              <div className={styles.mobileActions}>
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
              <div className={styles.loading}>Loading...</div>
            ) : session ? (
              <UserMenu />
            ) : (
              <Link href="/signin" className={styles.signInBtn}>
                  Sign In
                </Link>
              )}
            </div>
          </>
        )}
        </div>
      </div>
    </header>
  );
}
