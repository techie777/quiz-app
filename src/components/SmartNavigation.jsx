"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useSession, signOut } from "next-auth/react";
import { useUI } from "@/context/UIContext";
import styles from "@/styles/SmartNavigation.module.css";

const navigationItems = [
  {
    name: "Home",
    href: "/",
    icon: "🏠",
    description: "Return to the main quiz homepage",
    keywords: "quiz, homepage, main, start"
  },
  {
    name: "Daily Quiz",
    href: "/daily",
    icon: "🏆",
    description: "Take our daily quiz to test your knowledge",
    keywords: "daily quiz, test, knowledge, practice"
  },
  {
    name: "Daily Current Affairs",
    href: "/daily-current-affairs",
    icon: "📰",
    description: "Latest daily current affairs and news updates",
    keywords: "current affairs, news, daily updates"
  },
  {
    name: "Govt Jobs Alerts",
    href: "/govt-jobs-alerts",
    icon: "💼",
    description: "Government job notifications and alerts",
    keywords: "government jobs, sarkari naukri, job alerts"
  },
  {
    name: "Book My Course",
    href: "/book-my-course",
    icon: "📚",
    description: "Order school courses and books online",
    keywords: "school books, course booking, parent portal, education"
  },
  {
    name: "Career Guide",
    href: "/career-guide",
    icon: "🧭",
    description: "Complete career guidance and roadmaps",
    keywords: "career, jobs, guidance, roadmap, career guide"
  }
];

export default function SmartNavigation() {
  const { isMobileMenuOpen, closeMobileMenu } = useUI();
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const isUser = session?.user && !session.user.isAdmin;
  useEffect(() => {
    const handleScroll = () => {
      const offset = window.scrollY;
      setScrolled(offset > 50);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    // Close mobile menu when route changes handled by UIContext
  }, [pathname]);

  if (pathname?.startsWith("/admin")) return null;

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

                {/* Additional mobile menu content */}
                <div className={styles.mobileMenuFooter}>
                  {status === "loading" ? (
                    <div className={styles.loading}>Loading...</div>
                  ) : isUser ? (
                    <div className={styles.mobileUserMenu}>
                      <span className={styles.welcomeText}>Welcome, {session.user.name}</span>
                      <button 
                        className={styles.signOutBtn}
                        onClick={() => {
                          signOut({ callbackUrl: '/' });
                          closeMobileMenu();
                        }}
                      >
                        Sign Out
                      </button>
                    </div>
                  ) : (
                    <Link href="/signin" className={styles.mobileSignInBtn} onClick={closeMobileMenu}>
                      Sign In to Access All Features
                    </Link>
                  )}
                  <div className={styles.mobileMenuInfo}>
                    <p>Education & Exam Preparation Platform</p>
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
