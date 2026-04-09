"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import ThemeToggle from "./ThemeToggle";
import UserMenu from "./UserMenu";
import { useUI } from "@/context/UIContext";
import styles from "@/styles/Header.module.css";

export default function Header() {
  const { data: session, status } = useSession();
  const { toggleMobileMenu, isMobileMenuOpen } = useUI();
  const pathname = usePathname();

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
        </div>
      </div>
    </header>
  );
}
