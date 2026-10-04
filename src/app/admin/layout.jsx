"use client";

import { Suspense, useEffect, useMemo, useState, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { AdminProvider, useAdmin } from "@/context/AdminContext";
import { useData } from "@/context/DataContext";
import ThemeToggle from "@/components/ThemeToggle";
import styles from "@/styles/Admin.module.css";
import "./globals.css"; // Import admin-specific globals

const NAV_SECTIONS = [
  {
    id: "content",
    title: "Content & Question Bank",
    icon: "📚",
    items: [
      { href: "/admin/categories", label: "Quiz Categories", icon: "📁", perm: "categories" },
      { href: "/admin/taxonomy", label: "Taxonomy & Sets", icon: "🗂️", perm: "categories" },
      { href: "/admin/questions", label: "Quiz Questions", icon: "❓", perm: "questions" },
      { href: "/admin/upload", label: "Bulk Upload", icon: "📤", perm: "upload" },
      { href: "/admin/gk", label: "GK Hub", icon: "🏛️", perm: "gk" },
      ...(process.env.NEXT_PUBLIC_GK_BOOK === "true"
        ? [{ href: "/admin/gk-book", label: "GK Book (Digital)", icon: "📖", perm: "gk" }]
        : []),
      { href: "/admin/dataset-rules", label: "Dataset Rules", icon: "🎛️", perm: "settings" },
      { href: "/admin/sections", label: "Sections", icon: "📂", perm: "sections" },
    ],
  },
  {
    id: "education",
    title: "Exams & Education",
    icon: "🎓",
    items: [
      { href: "/admin/school-study", label: "School Study (1–12)", icon: "🏫", perm: "schoolStudy" },
      { href: "/admin/govt-exams", label: "Govt Exams", icon: "🏛️", perm: "govtExams" },
      { href: "/admin/mock-tests-manager", label: "Mock Tests Engine", icon: "📝", perm: "mockTestsManager" },
      { href: "/admin/study-material", label: "Study Materials", icon: "📚", perm: "studyMaterial" },
      { href: "/admin/career-guides", label: "Career Guides", icon: "🧭", perm: "careerGuides" },
      { href: "/admin/book-my-course", label: "Book My Course", icon: "🎓", perm: "bookMyCourse" },
    ],
  },
  {
    id: "engagement",
    title: "Daily & Engagement",
    icon: "⚡",
    items: [
      { href: "/admin/daily", label: "Daily Quizzes", icon: "📅", perm: "daily" },
      { href: "/admin/hot-quizzes", label: "Hot & Fun Quizzes", icon: "🔥", perm: "hotQuizzes" },
      { href: "/admin/current-affairs", label: "Current Affairs", icon: "🗞️", perm: "currentAffairs" },
      { href: "/admin/fun-facts", label: "Fun Facts", icon: "💡", perm: "funFacts" },
      { href: "/admin/true-false", label: "True / False", icon: "✅", perm: "trueFalse" },
      { href: "/admin/sawal-jawab", label: "Sawal / Jawab", icon: "📖", perm: "sawalJawab" },
      { href: "/admin/forum", label: "Community Forum", icon: "💬", perm: "forum" },
    ],
  },
  {
    id: "growth",
    title: "Monetization & Growth",
    icon: "💰",
    items: [
      { href: "/admin/monetization", label: "Monetization & Ads", icon: "💎", perm: "monetization" },
      { href: "/admin/rewards", label: "Rewards & Coins", icon: "🪙", perm: "rewards" },
      { href: "/admin/notifications", label: "Notifications", icon: "🔔", perm: "notifications" },
    ],
  },
  {
    id: "system",
    title: "System & Operations",
    icon: "⚙️",
    items: [
      { href: "/admin/pending", label: "Approval Queue", icon: "📝", perm: "pending" },
      { href: "/admin/accounts", label: "Admin Accounts", icon: "👥", perm: "accounts" },
      { href: "/admin/accounts?type=user", label: "User Accounts", icon: "👤", perm: "users" },
      { href: "/admin/logs", label: "Activity Logs", icon: "📋", perm: "logs" },
      { href: "/admin/mascots", label: "Mascots & Hosts", icon: "🎭", perm: "settings" },
      { href: "/admin/settings", label: "Settings", icon: "⚙️", perm: "settings" },
    ],
  },
];

function AdminShell({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, loaded, logout, adminUser, status } = useAdmin();
  const { refreshQuizzes } = useData();
  const [unreadCount, setUnreadCount] = useState(0);
  const [hasRefreshedForAdmin, setHasRefreshedForAdmin] = useState(false);

  const isLogin = pathname === "/admin/login";
  const isMaster = adminUser?.role === "master";

  const [openSections, setOpenSections] = useState({
    content: true,
    education: false,
    engagement: false,
    growth: false,
    system: false,
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const searchInputRef = useRef(null);

  // Auto-close mobile drawer on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Global Ctrl+K / Cmd+K shortcut to focus search input
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if (e.key === "Escape" && document.activeElement === searchInputRef.current) {
        setSearchQuery("");
        searchInputRef.current?.blur();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const filteredSections = useMemo(() => {
    return NAV_SECTIONS.map((sec) => {
      const allowedItems = sec.items.filter((item) => {
        if (isMaster) return true;
        return (adminUser?.permissions || {})[item.perm] !== false;
      });
      return {
        ...sec,
        items: allowedItems,
      };
    }).filter((sec) => sec.items.length > 0);
  }, [adminUser?.permissions, isMaster]);

  const isSearching = searchQuery.trim().length > 0;
  const q = searchQuery.toLowerCase().trim();

  // Filter sections and items based on search query
  const displayedSections = useMemo(() => {
    if (!isSearching) return filteredSections;

    return filteredSections
      .map((sec) => {
        const matchingItems = sec.items.filter((item) => {
          const labelMatch = item.label.toLowerCase().includes(q);
          const hrefMatch = item.href.toLowerCase().includes(q);
          return labelMatch || hrefMatch;
        });
        return {
          ...sec,
          items: matchingItems,
        };
      })
      .filter((sec) => sec.items.length > 0);
  }, [filteredSections, isSearching, q]);

  // Automatically expand the section matching current path
  useEffect(() => {
    if (!pathname) return;
    for (const sec of NAV_SECTIONS) {
      const hasActive = sec.items.some((item) => {
        const [basePath] = (item.href || "").split("?");
        return pathname === basePath || (basePath !== "/admin" && pathname?.startsWith(basePath));
      });
      if (hasActive) {
        setOpenSections((prev) => ({
          ...prev,
          [sec.id]: true,
        }));
        break;
      }
    }
  }, [pathname]);

  const toggleSection = (secId) => {
    setOpenSections((prev) => ({
      ...prev,
      [secId]: !prev[secId],
    }));
  };

  useEffect(() => {
    if (isLogin) return;
    if (!adminUser?.id) return;
    let cancelled = false;
    async function refresh() {
      try {
        const res = await fetch("/api/admin/notifications/unread-count", { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) setUnreadCount(Number(data?.count || 0));
      } catch {}
    }
    refresh();
    const t = setInterval(refresh, 20000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, [adminUser?.id, isLogin]);

  const searchParams = useSearchParams();
  const currentType = searchParams?.get("type") || null;

  const isUnauthenticated = loaded && (status === "unauthenticated" || (status === "authenticated" && !isAuthenticated));

  useEffect(() => {
    if (isLogin) return;
    if (isUnauthenticated) {
      router.replace("/admin/login");
    }
  }, [isLogin, isUnauthenticated, router]);

  useEffect(() => {
    if (status === "authenticated" && isAuthenticated && !hasRefreshedForAdmin) {
      setHasRefreshedForAdmin(true);
      refreshQuizzes();
    }
  }, [status, isAuthenticated, hasRefreshedForAdmin, refreshQuizzes]);

  const handleLogout = async () => {
    await logout();
    router.push("/admin/login");
  };

  const isLinkActive = (href) => {
    if (!pathname || !href) return false;
    if (href.includes("?")) {
      const [path, query] = href.split("?");
      const params = new URLSearchParams(query);
      const targetType = params.get("type");
      return pathname === path && currentType === targetType;
    }
    return pathname === href && !currentType;
  };

  const currentHub = useMemo(() => {
    if (!pathname || pathname === "/admin") return null;
    for (const sec of filteredSections || []) {
      const match = sec.items?.some((item) => {
        const [basePath] = (item.href || "").split("?");
        return pathname === basePath || (basePath !== "/admin" && pathname?.startsWith(basePath));
      });
      if (match) return sec;
    }
    return null;
  }, [pathname, filteredSections]);

  if (isLogin) return children;

  if (!loaded) {
    return <div className={styles.loading}><p>Loading...</p></div>;
  }

  if (isUnauthenticated) {
    return null;
  }

  return (
    <div className={styles.layout}>
      {/* Mobile Sticky Header */}
      <div className={styles.mobileHeader}>
        <button
          type="button"
          onClick={() => setMobileMenuOpen(true)}
          className={styles.mobileMenuBtn}
          aria-label="Open menu"
        >
          ☰
        </button>
        <Link href="/admin" className={styles.brand}>
          <span className={styles.brandEmoji}>🧠</span>
          <span className={styles.brandText}>QuizWeb Admin</span>
        </Link>
        <ThemeToggle />
      </div>

      {/* Backdrop overlay on mobile */}
      {mobileMenuOpen && (
        <div
          className={styles.mobileBackdrop}
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside className={`${styles.sidebar} ${mobileMenuOpen ? styles.sidebarOpen : ""}`}>
        <div className={styles.sidebarHeader}>
          <Link href="/" className={styles.brand}>
            <span className={styles.brandEmoji}>🧠</span>
            <span className={styles.brandText}>QuizWeb</span>
          </Link>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span className={styles.badge}>
              {isMaster ? "Master" : "Jr Admin"}
            </span>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              className={styles.sidebarCloseBtn}
              aria-label="Close menu"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Quick Search / Command Input */}
        <div className={styles.sidebarSearchContainer}>
          <div className={styles.sidebarSearchWrapper}>
            <span style={{ fontSize: "0.85rem", opacity: 0.7, lineHeight: 1 }}>🔍</span>
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tools... (Ctrl+K)"
              className={styles.sidebarSearchInput}
            />
            {isSearching ? (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className={styles.sidebarSearchClear}
                title="Clear search"
              >
                ✕
              </button>
            ) : (
              <kbd className={styles.sidebarSearchKbd}>Ctrl K</kbd>
            )}
          </div>
        </div>

        <nav className={styles.nav}>
          {/* Permanent Dashboard Link (hidden only if search does not match) */}
          {(!isSearching || "dashboard".includes(q)) && (
            <div style={{ marginBottom: "4px" }}>
              <Link
                href="/admin"
                className={`${styles.navLink} ${pathname === "/admin" ? styles.navLinkActive : ""}`}
              >
                <span className={styles.navIcon}>📊</span>
                <span className={styles.navText}>
                  <span style={{ fontWeight: 700 }}>Dashboard</span>
                </span>
              </Link>
            </div>
          )}

          {(!isSearching || "dashboard".includes(q)) && (
            <div className={styles.navSectionDivider} />
          )}

          {/* Empty Search State */}
          {isSearching && displayedSections.length === 0 && (
            <div style={{ textAlign: "center", padding: "20px 8px", color: "var(--text-tertiary, #94a3b8)" }}>
              <span style={{ fontSize: "1.4rem" }}>🔍</span>
              <p style={{ fontSize: "0.82rem", fontWeight: 700, marginTop: "6px", color: "var(--text-secondary)" }}>
                No matching tools
              </p>
              <p style={{ fontSize: "0.72rem", marginTop: "2px" }}>
                Nothing matches &ldquo;{searchQuery}&rdquo;
              </p>
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                style={{
                  marginTop: "8px",
                  fontSize: "0.72rem",
                  fontWeight: 600,
                  padding: "4px 10px",
                  borderRadius: "6px",
                  background: "var(--accent-light)",
                  color: "var(--accent)",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                Clear filter
              </button>
            </div>
          )}

          {/* 5 Collapsible Hubs (Auto-expanded when searching) */}
          {displayedSections.map((sec, secIdx) => {
            const isOpen = isSearching || !!openSections[sec.id];
            const hasActiveChild = sec.items.some((item) => isLinkActive(item.href));

            return (
              <div key={sec.id} style={{ display: "flex", flexDirection: "column" }}>
                <button
                  type="button"
                  onClick={() => toggleSection(sec.id)}
                  className={`${styles.navAccordionHeader} ${
                    hasActiveChild ? styles.navAccordionHeaderActive : ""
                  }`}
                  aria-expanded={isOpen}
                >
                  <div className={styles.navAccordionTitle}>
                    <span>{sec.icon}</span>
                    <span>{sec.title}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span
                      style={{
                        fontSize: "10px",
                        padding: "1px 6px",
                        borderRadius: "99px",
                        background: hasActiveChild
                          ? "var(--accent-light, rgba(99, 102, 241, 0.15))"
                          : "rgba(148, 163, 184, 0.12)",
                        color: hasActiveChild ? "var(--accent, #6366f1)" : "inherit",
                        fontWeight: 700,
                      }}
                    >
                      {sec.items.length}
                    </span>
                    <span
                      className={`${styles.navAccordionChevron} ${
                        isOpen ? styles.navAccordionChevronOpen : ""
                      }`}
                    >
                      ▾
                    </span>
                  </div>
                </button>

                {isOpen && (
                  <div className={styles.navAccordionItems}>
                    {sec.items.map((item) => (
                      <div key={item.href} style={{ position: "relative" }}>
                        <Link
                          href={item.href}
                          className={`${styles.navLink} ${
                            isLinkActive(item.href) ? styles.navLinkActive : ""
                          }`}
                          style={{ width: "100%" }}
                        >
                          <span className={styles.navIcon}>{item.icon}</span>
                          <span
                            className={styles.navText}
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "flex-start",
                              width: "100%",
                              overflow: "hidden",
                            }}
                          >
                            <span
                              style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                width: "100%",
                              }}
                            >
                              <span style={{ fontWeight: 600 }}>{item.label}</span>
                              {item.href === "/admin/notifications" && unreadCount > 0 ? (
                                <span className={styles.navBadge}>{unreadCount}</span>
                              ) : null}
                            </span>
                          </span>
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
                {secIdx < displayedSections.length - 1 && (
                  <div className={styles.navSectionDivider} />
                )}
              </div>
            );
          })}
        </nav>

        <div className={styles.sidebarFooter}>
          <div className={styles.adminInfo}>
            <span className={styles.adminName}>{adminUser?.name}</span>
          </div>
          <ThemeToggle />
          <button className={styles.logoutBtn} onClick={handleLogout} title="Logout">
            Logout 🚪
          </button>
        </div>
      </aside>

      <main className={styles.main}>
        {/* Top Hub Sub-Navigation Tab Bar for the Active Domain */}
        {currentHub && (
          <div className={styles.hubSubNav}>
            <div className={styles.hubSubNavInner}>
              <div className={styles.hubTitleGroup}>
                <span>{currentHub.icon}</span>
                <span>{currentHub.title}</span>
              </div>
              <div className={styles.hubTabsList}>
                {currentHub.items.map((item) => {
                  const active = isLinkActive(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`${styles.hubTabItem} ${
                        active ? styles.hubTabItemActive : ""
                      }`}
                    >
                      <span>{item.icon}</span>
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        )}
        <div className={styles.content}>{children}</div>
      </main>
    </div>
  );
}

export default function AdminLayout({ children }) {
  return (
    <div className={styles.adminBody}>
      <AdminProvider>
        <Suspense>
          <AdminShell>{children}</AdminShell>
        </Suspense>
      </AdminProvider>
    </div>
  );
}
