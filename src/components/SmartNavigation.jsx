"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useSession, signIn, signOut } from "next-auth/react";
import {
  Home,
  Sparkles,
  Gamepad2,
  Newspaper,
  Trophy,
  FileText,
  Compass,
  User,
  LogOut,
  Heart,
  Shield,
  Mail,
  Check,
  HelpCircle,
} from "lucide-react";
import { useUI } from "@/context/UIContext";
import { useLanguage } from "@/context/LanguageContext";
import { useData } from "@/context/DataContext";
import { useTier } from "@/context/TierContext";
import { useMonetization } from "@/context/MonetizationContext";
import LanguageToggle from "./LanguageToggle";
import ThemeToggle from "./ThemeToggle";
import styles from "@/styles/SmartNavigation.module.css";

const fallbackNavigationItems = [
  { key: "home", href: "/", Icon: Home, label: "Home", labelHi: "होम" },
  { key: "learn", href: "/learn", Icon: Sparkles, label: "Learn", labelHi: "सीखें" },
  { key: "quizzes", href: "/quizzes", Icon: Gamepad2, label: "Play", labelHi: "खेलें" },
  { key: "currentAffairs", href: "/daily-current-affairs", Icon: Newspaper, label: "Current Affairs", labelHi: "करेंट अफेयर्स" },
  { key: "leaderboard", href: "/leaderboard", Icon: Trophy, label: "Leaderboard", labelHi: "लीडरबोर्ड" },
  { key: "mockTests", href: "/mock-tests", Icon: FileText, label: "Mock Tests", labelHi: "मॉक टेस्ट" },
  { key: "careerGuide", href: "/career-guide", Icon: Compass, label: "Career Guide", labelHi: "करियर गाइड" },
];

export default function SmartNavigation() {
  const { isMobileMenuOpen, closeMobileMenu, openTutorial } = useUI();
  const { isHindi } = useLanguage();
  const { tier } = useTier();
  const { isPro } = useMonetization();
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const { modules } = useData();

  // Close menu on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isMobileMenuOpen) {
        closeMobileMenu();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isMobileMenuOpen, closeMobileMenu]);

  // Lock background scroll when drawer is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileMenuOpen]);

  // Filter items based on active modules config
  const navItems = fallbackNavigationItems.filter((item) => {
    if (modules) {
      if (item.key === "mockTests" && !modules.mockTests) return false;
      if (item.key === "careerGuide" && !modules.careerGuide) return false;
      if (item.key === "learn" && modules.learn === false) return false;
      if (item.key === "quizzes" && modules.play === false) return false;
      if (item.key === "currentAffairs" && modules.currentAffairs === false) return false;
      if (item.key === "home" && modules.home === false) return false;
    } else {
      // Default hide unfinished
      if (["mockTests", "careerGuide"].includes(item.key)) return false;
    }
    return true;
  });

  const isQuizOrExamRoute = pathname?.startsWith("/quiz/") || pathname?.includes("/mock-tests/paper/") || pathname?.startsWith("/live/");
  const isFlashcardRoute = pathname?.startsWith("/fun-facts") || pathname?.startsWith("/true-false");
  if (pathname?.startsWith("/admin") || isQuizOrExamRoute || isFlashcardRoute) return null;

  const userInitial = session?.user?.name
    ? session.user.name.charAt(0).toUpperCase()
    : session?.user?.email
    ? session.user.email.charAt(0).toUpperCase()
    : "U";

  return (
    <>
      {/* Backdrop overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            className={styles.overlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeMobileMenu}
          />
        )}
      </AnimatePresence>

      {/* Hamburger Menu Drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            className={styles.drawer}
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            {/* Top Auth Section */}
            {status === "authenticated" && session?.user ? (
              <div className={styles.userSection}>
                <div className={styles.userInfo}>
                  <div className={styles.userAvatar}>{userInitial}</div>
                  <div className={styles.userMeta}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <p className={styles.userName}>{session.user.name || "QuizWeb User"}</p>
                      {isPro && (
                        <span
                          style={{
                            background: "linear-gradient(135deg, #F59E0B, #D97706)",
                            color: "#FFFFFF",
                            fontSize: "10px",
                            fontWeight: 800,
                            padding: "2px 6px",
                            borderRadius: "6px",
                            letterSpacing: "0.5px",
                          }}
                        >
                          PRO
                        </span>
                      )}
                    </div>
                    {session.user.email && (
                      <p className={styles.userEmail}>{session.user.email}</p>
                    )}
                  </div>
                </div>
                <div className={styles.userActions}>
                  <Link
                    href="/profile"
                    className={styles.profileBtn}
                    onClick={closeMobileMenu}
                  >
                    <User size={16} />
                    <span>{isHindi ? "प्रोफ़ाइल" : "Profile"}</span>
                  </Link>
                  <button
                    className={styles.signOutBtn}
                    onClick={() => {
                      if (typeof window !== "undefined") sessionStorage.setItem("auth_toast", "logout");
                      signOut({ callbackUrl: "/" });
                      closeMobileMenu();
                    }}
                  >
                    <LogOut size={16} />
                    <span>{isHindi ? "साइन आउट" : "Sign Out"}</span>
                  </button>
                </div>
              </div>
            ) : (
              <button
                className={styles.googleSignInBtn}
                onClick={() => {
                  if (typeof window !== "undefined") sessionStorage.setItem("auth_toast", "login");
                  signIn("google", { callbackUrl: "/" });
                }}
              >
                <svg className={styles.googleIcon} viewBox="0 0 24 24" width="20" height="20">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1c-2.97 0-5.46.98-7.28 2.66l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                <span>{isHindi ? "Google से साइन इन करें" : "Sign in with Google"}</span>
              </button>
            )}

            {/* Quick Preferences: Language & Theme */}
            <div className={styles.preferencesRow}>
              <div className={styles.prefItem}>
                <span className={styles.prefLabel}>{isHindi ? "भाषा" : "Language"}</span>
                <LanguageToggle />
              </div>
              <div className={styles.prefItem}>
                <span className={styles.prefLabel}>{isHindi ? "थीम" : "Theme"}</span>
                <ThemeToggle />
              </div>
            </div>

            {/* Navigation Links */}
            <div className={styles.navSection}>
              <ul className={styles.menuLinksList}>
                {navItems.map((item) => {
                  const isActive = pathname === item.href;
                  const Icon = item.Icon;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={`${styles.menuLink} ${isActive ? styles.activeLink : ""}`}
                        onClick={closeMobileMenu}
                      >
                        <span className={styles.menuLinkIcon}>
                          <Icon size={18} />
                        </span>
                        <span className={styles.menuLinkLabel}>
                          {isHindi ? item.labelHi : item.label}
                        </span>
                        {isActive && (
                          <span className={styles.activeCheck}>
                            <Check size={16} />
                          </span>
                        )}
                      </Link>
                    </li>
                  );
                })}

                <li>
                  <Link
                    href="/my-favourites"
                    className={`${styles.menuLink} ${pathname === "/my-favourites" ? styles.activeLink : ""}`}
                    onClick={closeMobileMenu}
                  >
                    <span className={styles.menuLinkIcon}>
                      <Heart size={18} />
                    </span>
                    <span className={styles.menuLinkLabel}>
                      {isHindi ? "पसंदीदा" : "My Favourites"}
                    </span>
                    {pathname === "/my-favourites" && (
                      <span className={styles.activeCheck}>
                        <Check size={16} />
                      </span>
                    )}
                  </Link>
                </li>

                {status !== "authenticated" && (
                  <li>
                    <Link
                      href="/profile"
                      className={`${styles.menuLink} ${pathname === "/profile" ? styles.activeLink : ""}`}
                      onClick={closeMobileMenu}
                    >
                      <span className={styles.menuLinkIcon}>
                        <User size={18} />
                      </span>
                      <span className={styles.menuLinkLabel}>
                        {isHindi ? "प्रोफ़ाइल" : "Profile"}
                      </span>
                      {pathname === "/profile" && (
                        <span className={styles.activeCheck}>
                          <Check size={16} />
                        </span>
                      )}
                    </Link>
                  </li>
                )}
                <li>
                  <Link
                    href="/pro"
                    className={`${styles.menuLink} ${pathname === "/pro" ? styles.activeLink : ""}`}
                    onClick={closeMobileMenu}
                  >
                    <span className={styles.menuLinkIcon}>
                      <span style={{ fontSize: "16px" }}>👑</span>
                    </span>
                    <span className={styles.menuLinkLabel} style={{ fontWeight: 700, color: "#4F46E5" }}>
                      {isHindi ? "क्विज़वेब प्रो (बिना विज्ञापन)" : "QuizWeb Pro (No Ads)"}
                    </span>
                    {isPro && (
                      <span
                        style={{
                          background: "#10B981",
                          color: "#FFF",
                          fontSize: "10px",
                          fontWeight: 800,
                          padding: "2px 6px",
                          borderRadius: "4px",
                          marginLeft: "auto",
                        }}
                      >
                        ACTIVE
                      </span>
                    )}
                  </Link>
                </li>
              </ul>
            </div>

            {/* Legal & Support Links (FOOTER RULE) */}
            <div className={styles.legalSection}>
              <div className={styles.legalSectionTitle}>
                {isHindi ? "कानूनी और सहायता" : "Legal & Support"}
              </div>
              <ul className={styles.legalLinksList}>
                <li>
                  <button
                    type="button"
                    className={styles.legalLink}
                    onClick={() => {
                      closeMobileMenu();
                      openTutorial();
                    }}
                    style={{ background: "none", border: "none", width: "100%", textAlign: "left", cursor: "pointer", padding: "8px 0" }}
                  >
                    <HelpCircle size={16} className="text-indigo-600" />
                    <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                      {isHindi ? "क्विज़वेब कैसे काम करता है" : "How QuizWeb works"}
                    </span>
                  </button>
                </li>
                <li>
                  <Link href="/privacy" className={styles.legalLink} onClick={closeMobileMenu}>
                    <Shield size={16} />
                    <span>{isHindi ? "गोपनीयता नीति" : "Privacy Policy"}</span>
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className={styles.legalLink} onClick={closeMobileMenu}>
                    <FileText size={16} />
                    <span>{isHindi ? "सेवा की शर्तें" : "Terms of Service"}</span>
                  </Link>
                </li>
                {tier !== "kids" && (
                  <li>
                    <Link href="/support" className={styles.legalLink} onClick={closeMobileMenu}>
                      <Heart size={16} style={{ color: "#E11D48" }} />
                      <div style={{ display: "flex", flexDirection: "column" }}>
                        <span>{isHindi ? "हमारा समर्थन करें" : "Support Us"}</span>
                        {tier === "students" && (
                          <span style={{ fontSize: "10px", color: "#94A3B8" }}>
                            {isHindi ? "(अभिभावक से पूछें)" : "(Ask a parent or guardian)"}
                          </span>
                        )}
                      </div>
                    </Link>
                  </li>
                )}
                <li>
                  <Link href="/contact" className={styles.legalLink} onClick={closeMobileMenu}>
                    <Mail size={16} />
                    <span>{isHindi ? "संपर्क करें" : "Contact"}</span>
                  </Link>
                </li>
              </ul>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
