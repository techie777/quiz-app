"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useSession, signIn, signOut } from "next-auth/react";
import { useUI } from "@/context/UIContext";
import { ChevronDown, ChevronUp, Heart } from "lucide-react";
import styles from "@/styles/SmartNavigation.module.css";

const fallbackNavigationItems = [
  { name: "Home", href: "/", icon: "🏠", description: "Master Hub" },
  { name: "Global Leaderboard", href: "/leaderboard", icon: "🏆", description: "World intelligence rankings" },
  { name: "QuizWeb Pro", href: "/pro", icon: "👑", description: "Unlock premium features" },
  { name: "Quizzes", href: "/quizzes", icon: "🧠", description: "Play dynamic quizzes" },
  { name: "Daily Current Affairs", href: "/daily-current-affairs", icon: "📰", description: "Latest daily updates" },
  { name: "Mock Tests", href: "/mock-tests", icon: "✍️", description: "Practice papers" },
  { name: "Career Guide", href: "/career-guide", icon: "🧭", description: "Career guidance" },
  { name: "Fun facts", href: "/fun-facts", icon: "✨", description: "Amazing facts" },
  { name: "True/False", href: "/true-false", icon: "✅", description: "Interactive challenges" }
];

const HIDDEN_PATHS = ["/daily", "/govt-jobs-alerts", "/govt-study", "/book-my-course", "/school-study"];

export default function SmartNavigation() {
  const { isMobileMenuOpen, closeMobileMenu } = useUI();
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const isUser = session?.user && !session.user.isAdmin;
  
  const [navigationItems, setNavigationItems] = useState(fallbackNavigationItems);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSignOutConfirm, setIsSignOutConfirm] = useState(false);

  useEffect(() => {
    const fetchNav = async () => {
      try {
        const res = await fetch('/api/navigation');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            const visibleItems = data.filter(item => !HIDDEN_PATHS.includes(item.href));
            setNavigationItems(visibleItems);
          }
        }
      } catch (e) { console.error("Nav fetch error:", e); }
    };
    fetchNav();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const offset = window.scrollY;
      setScrolled(offset > 50);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (pathname?.startsWith("/admin") || pathname?.includes("/mock-tests/paper/")) return null;

  return (
    <>
      {/* SEO-friendly structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": navigationItems.map((item, index) => ({
              "@type": "ListItem",
              "position": index + 1,
              "name": item.name,
              "description": item.description,
              "item": `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}${item.href}`
            }))
          })
        }}
      />

      <nav 
        className={`${styles.navigation} ${scrolled ? styles.scrolled : ''}`}
        role="navigation"
        aria-label="Main navigation"
      >
        <div className={styles.container}>
          {/* Desktop Navigation */}
          <ul className={styles.navList} role="menubar">
            {navigationItems.map((item, index) => {
              const isActive = pathname === item.href;
              return (
                <li key={item.href} role="none">
                  <Link
                    href={item.href}
                    className={`${styles.navLink} ${isActive ? styles.active : ''}`}
                    role="menuitem"
                    aria-current={isActive ? "page" : undefined}
                    title={item.description}
                    data-keywords={item.keywords}
                  >
                    {isActive && (
                      <motion.div
                        className={styles.activePill}
                        layoutId="activePill"
                        initial={false}
                        transition={{
                          type: "spring",
                          stiffness: 400,
                          damping: 30
                        }}
                      />
                    )}
                    <span className={styles.navIcon}>{item.icon}</span>
                    <span className={styles.navText}>{item.name}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              className={styles.mobileMenu}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              <div className={styles.mobileMenuContainer}>
                {/* Mobile Header Auth - Moved from footer to top as requested */}
                <div className={styles.mobileMenuHeader}>
                  {status === "loading" ? (
                    <div className={styles.loading}>Loading...</div>
                  ) : isUser ? (
                    <div className={styles.mobileUserMenu}>
                      <div className={styles.mobileUserLinksWrapper}>
                        <div 
                          className={styles.mobileUserHeaderToggle}
                          onClick={() => setIsProfileOpen(!isProfileOpen)}
                        >
                          <div className={styles.mobileUserStats}>
                            <div className={styles.mobileUserAvatar}>
                              {session.user.name?.[0]?.toUpperCase() || "U"}
                            </div>
                            <div className={styles.mobileUserInfo}>
                              <div className={styles.mobileUserNameRow}>
                                <p className={styles.mobileUserName}>{session.user.name}</p>
                                {isProfileOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                              </div>
                              <p className={styles.mobileUserEmail}>{session.user.email}</p>
                            </div>
                          </div>
                        </div>
                        
                        <AnimatePresence>
                          {isProfileOpen && (
                            <motion.div 
                              className={styles.mobileUserLinks}
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                            >
                              <div className={styles.mobileUserLinksList}>
                                <Link href="/profile" className={styles.mobileUserLink} onClick={closeMobileMenu}>
                                  <span className={styles.userMenuIcon}>👤</span> My Profile
                                </Link>
                                <Link href="/my-favourites" className={styles.mobileUserLink} onClick={closeMobileMenu}>
                                  <span className={styles.userMenuIcon}>❤️</span> My Favourites
                                </Link>
                                <Link href="/school-study/dashboard" className={styles.mobileUserLink} onClick={closeMobileMenu}>
                                  <span className={styles.userMenuIcon}>📊</span> Learning Progress
                                </Link>
                                <Link href="/leaderboard" className={styles.mobileUserLink} onClick={closeMobileMenu}>
                                  <span className={styles.userMenuIcon}>🏆</span> Global Leaderboard
                                </Link>
                                
                                <div className={styles.mobileSignOutSection}>
                                  {!isSignOutConfirm ? (
                                    <button 
                                      className={styles.mobileSignOutBtn}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setIsSignOutConfirm(true);
                                      }}
                                    >
                                      <span className={styles.userMenuIcon}>🚪</span> Sign Out
                                    </button>
                                  ) : (
                                    <div className={styles.mobileSignOutConfirm}>
                                      <p className={styles.signOutLabel}>Are you sure you want to sign out?</p>
                                      <div className={styles.signOutBtnGroup}>
                                        <button 
                                          className={styles.confirmBtn}
                                          onClick={() => {
                                            signOut({ callbackUrl: '/' });
                                            closeMobileMenu();
                                          }}
                                        >
                                          Yes, Sign Out
                                        </button>
                                        <button 
                                          className={styles.cancelBtn}
                                          onClick={() => setIsSignOutConfirm(false)}
                                        >
                                          Cancel
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  ) : (
                    <div className={styles.mobileAuthActions}>
                      <button
                        className={styles.mobileGoogleBtn}
                        onClick={() => signIn("google", { callbackUrl: "/" })}
                      >
                         <svg className={styles.googleIcon} viewBox="0 0 24 24" width="20" height="20">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                        </svg>
                        Continue with Google
                      </button>
                      <Link href="/signin" className={styles.mobileSignInBtn} onClick={closeMobileMenu}>
                        Sign In with PIN
                      </Link>
                    </div>
                  )}
                </div>

                <ul className={styles.mobileNavList} role="menu">
                  {navigationItems.map((item, index) => {
                    const isActive = pathname === item.href;
                    return (
                      <li key={item.href} role="none">
                        <Link
                          href={item.href}
                          className={`${styles.mobileNavLink} ${isActive ? styles.active : ''}`}
                          role="menuitem"
                          aria-current={isActive ? "page" : undefined}
                          onClick={closeMobileMenu}
                        >
                          <div className={styles.mobileNavIcon}>{item.icon}</div>
                          <div className={styles.mobileNavInfo}>
                            <span className={styles.mobileNavText}>{item.name}</span>
                            <span className={styles.mobileNavDescription}>
                              {item.description}
                            </span>
                          </div>
                          {isActive && (
                            <span className={styles.mobileActiveIndicator}>✓</span>
                          )}
                        </Link>
                      </li>
                    );
                  })}
                </ul>

                {/* Footer centered with badge */}
                <div className={styles.mobileMenuFooter}>
                  <div className={styles.mobileMenuInfo}>
                    <p className={styles.badgeText}>
                      <span className={styles.hotBadge}>HOT</span>
                      Education & Exam Preparation Platform 🔥
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Overlay for mobile menu */}
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
    </>
  );
}
