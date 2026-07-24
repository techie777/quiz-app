"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { AdminProvider, useAdmin } from "@/context/AdminContext";
import { useData } from "@/context/DataContext";
import ThemeToggle from "@/components/ThemeToggle";
import styles from "@/styles/Admin.module.css";
import "./globals.css"; // Import admin-specific globals

const JR_NAV = [
  { href: "/admin", label: "Dashboard", icon: "📊", perm: "dashboard" },
  { href: "/admin/categories", label: "Quiz Categories", icon: "📁", perm: "categories" },
  { href: "/admin/questions", label: "Quiz Questions", icon: "❓", perm: "questions" },
  { href: "/admin/govt-exams", label: "Govt Exams", icon: "🏛️", perm: "govtExams" },
  { href: "/admin/current-affairs", label: "Current Affairs", icon: "🗞️", perm: "currentAffairs" },
  { href: "/admin/sections", label: "Sections", icon: "📂", perm: "sections" },
  { href: "/admin/upload", label: "Bulk Upload", icon: "📤", perm: "upload" },
  { href: "/admin/sawal-jawab", label: "Sawal / Jawab", icon: "📖", perm: "sawalJawab" },
  { href: "/admin/daily", label: "Daily Quizzes", icon: "📅", perm: "daily" },
  { href: "/admin/mock-tests-manager", label: "Mock Tests Engine", icon: "📝", perm: "mockTestsManager" },
  { href: "/admin/rewards", label: "Rewards & Coins", icon: "🪙", perm: "rewards" },
  { href: "/admin/study-material", label: "Study Materials", icon: "📚", perm: "studyMaterial" },
  { href: "/admin/notifications", label: "Notifications", icon: "🔔", perm: "notifications" },
  { href: "/admin/fun-facts", label: "Fun Facts", icon: "💡", perm: "funFacts" },
  { href: "/admin/true-false", label: "True/False", icon: "✅", perm: "trueFalse" },
  { href: "/admin/book-my-course", label: "Book My Course", icon: "📚", perm: "bookMyCourse" },
  { href: "/admin/career-guides", label: "Career Guides", icon: "🧭", perm: "careerGuides" },
  { href: "/admin/forum", label: "Community Forum", icon: "💬", perm: "forum" },
  { href: "/admin/school-study", label: "School Study", icon: "🏫", perm: "schoolStudy" },
  { href: "/admin/settings", label: "Settings", icon: "⚙️", perm: "settings" },
];

const MASTER_NAV_DEFAULT = [
  { href: "/admin", label: "Dashboard", icon: "📊", perm: "dashboard" },
  { href: "/admin/categories", label: "Quiz Categories", icon: "📁", perm: "categories" },
  { href: "/admin/questions", label: "Quiz Questions", icon: "❓", perm: "questions" },
  { href: "/admin/govt-exams", label: "Govt Exams", icon: "🏛️", perm: "govtExams" },
  { href: "/admin/current-affairs", label: "Current Affairs", icon: "🗞️", perm: "currentAffairs" },
  { href: "/admin/sections", label: "Sections", icon: "📂", perm: "sections" },
  { href: "/admin/upload", label: "Bulk Upload", icon: "📤", perm: "upload" },
  { href: "/admin/sawal-jawab", label: "Sawal / Jawab", icon: "📖", perm: "sawalJawab" },
  { href: "/admin/daily", label: "Daily Quizzes", icon: "📅", perm: "daily" },
  { href: "/admin/mock-tests-manager", label: "Mock Tests Engine", icon: "📝", perm: "mockTestsManager" },
  { href: "/admin/rewards", label: "Rewards & Coins", icon: "🪙", perm: "rewards" },
  { href: "/admin/study-material", label: "Study Materials", icon: "📚", perm: "studyMaterial" },
  { href: "/admin/pending", label: "Approval Queue", icon: "📝", perm: "pending" },
  { href: "/admin/accounts", label: "Admin Accounts", icon: "👥", perm: "accounts" },
  { href: "/admin/accounts?type=user", label: "User Accounts", icon: "👤", perm: "users" },
  { href: "/admin/logs", label: "Activity Logs", icon: "📋", perm: "logs" },
  { href: "/admin/notifications", label: "Notifications", icon: "🔔", perm: "notifications" },
  { href: "/admin/fun-facts", label: "Fun Facts", icon: "💡", perm: "funFacts" },
  { href: "/admin/true-false", label: "True/False", icon: "✅", perm: "trueFalse" },
  { href: "/admin/book-my-course", label: "Book My Course", icon: "📚", perm: "bookMyCourse" },
  { href: "/admin/career-guides", label: "Career Guides", icon: "🧭", perm: "careerGuides" },
  { href: "/admin/forum", label: "Community Forum", icon: "💬", perm: "forum" },
  { href: "/admin/school-study", label: "School Study", icon: "🏫", perm: "schoolStudy" },
  { href: "/admin/settings", label: "Settings", icon: "⚙️", perm: "settings" },
];

function AdminShell({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, loaded, logout, adminUser, status } = useAdmin();
  const { refreshQuizzes } = useData();
  const [unreadCount, setUnreadCount] = useState(0);
  const [hasRefreshedForAdmin, setHasRefreshedForAdmin] = useState(false);

  // Sidebar Order State & Dragging Highlight State
  const [customNavOrder, setCustomNavOrder] = useState([]);
  const [draggedIdx, setDraggedIdx] = useState(null);
  const [dragOverIdx, setDragOverIdx] = useState(null);

  const isLogin = pathname === "/admin/login";
  const isMaster = adminUser?.role === "master";

  // Load custom sidebar order from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("admin_sidebar_order");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setCustomNavOrder(parsed);
        }
      }
    } catch (e) {
      console.error("Failed to parse sidebar order:", e);
    }
  }, []);

  const saveNavOrder = (newHrefs) => {
    setCustomNavOrder(newHrefs);
    try {
      localStorage.setItem("admin_sidebar_order", JSON.stringify(newHrefs));
    } catch (e) {}
  };

  const navItems = useMemo(() => {
    const raw = isMaster ? MASTER_NAV_DEFAULT : JR_NAV;
    let baseList = isMaster ? raw : raw.filter((item) => (adminUser?.permissions || {})[item.perm] !== false);

    if (customNavOrder.length > 0) {
      const orderMap = new Map(customNavOrder.map((href, idx) => [href, idx]));
      baseList = [...baseList].sort((a, b) => {
        const idxA = orderMap.has(a.href) ? orderMap.get(a.href) : 999;
        const idxB = orderMap.has(b.href) ? orderMap.get(b.href) : 999;
        return idxA - idxB;
      });
    }

    return baseList;
  }, [adminUser?.permissions, isMaster, customNavOrder]);

  const handleDragStart = (e, index) => {
    setDraggedIdx(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverIdx !== index) {
      setDragOverIdx(index);
    }
  };

  const handleDrop = (e, targetIdx) => {
    e.preventDefault();
    if (draggedIdx === null || draggedIdx === targetIdx) {
      setDraggedIdx(null);
      setDragOverIdx(null);
      return;
    }

    const updated = [...navItems];
    const [removed] = updated.splice(draggedIdx, 1);
    updated.splice(targetIdx, 0, removed);

    const newHrefs = updated.map(item => item.href);
    saveNavOrder(newHrefs);
    setDraggedIdx(null);
    setDragOverIdx(null);
  };

  const handleDragEnd = () => {
    setDraggedIdx(null);
    setDragOverIdx(null);
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

  useEffect(() => {
    if (status === "authenticated" && isAuthenticated && !hasRefreshedForAdmin) {
      setHasRefreshedForAdmin(true);
      refreshQuizzes();
    }
  }, [status, isAuthenticated, hasRefreshedForAdmin, refreshQuizzes]);

  if (isLogin) return children;

  if (!loaded) {
    return <div className={styles.loading}><p>Loading...</p></div>;
  }

  if (status === "unauthenticated" || (status === "authenticated" && !isAuthenticated)) {
    router.replace("/admin/login");
    return null;
  }

  const handleLogout = async () => {
    await logout();
    router.push("/admin/login");
  };

  const isLinkActive = (href) => {
    if (typeof window === "undefined") return pathname === href;
    const currentUrl = new URL(window.location.href);
    const currentType = currentUrl.searchParams.get("type");

    if (href.includes("?")) {
      const [path, query] = href.split("?");
      const params = new URLSearchParams(query);
      const targetType = params.get("type");
      return pathname === path && currentType === targetType;
    }
    return pathname === href && !currentType;
  };

  return (
    <div className={styles.layout}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <Link href="/" className={styles.brand}>
            <span className={styles.brandEmoji}>🧠</span>
            <span className={styles.brandText}>QuizWeb</span>
          </Link>
          <span className={styles.badge}>
            {isMaster ? "Master" : "Jr Admin"}
          </span>
        </div>

        <nav className={styles.nav}>
          {navItems.map((item, idx) => {
            const isBeingDragged = draggedIdx === idx;
            const isDropTarget = dragOverIdx === idx && draggedIdx !== idx;

            return (
              <div
                key={item.href}
                draggable={isMaster}
                onDragStart={(e) => handleDragStart(e, idx)}
                onDragOver={(e) => handleDragOver(e, idx)}
                onDrop={(e) => handleDrop(e, idx)}
                onDragEnd={handleDragEnd}
                style={{
                  position: "relative",
                  transition: "all 0.15s ease",
                  opacity: isBeingDragged ? 0.4 : 1,
                  transform: isBeingDragged
                    ? "scale(0.96)"
                    : isDropTarget
                    ? "translateY(2px)"
                    : "none",
                  borderTop: isDropTarget ? "3px solid #6366f1" : "3px solid transparent",
                  borderRadius: "10px",
                  background: isDropTarget ? "rgba(99, 102, 241, 0.12)" : "transparent",
                }}
              >
                <Link
                  href={item.href}
                  className={`${styles.navLink} ${
                    isLinkActive(item.href) ? styles.navLinkActive : ""
                  }`}
                  style={{ width: "100%" }}
                >
                  <span className={styles.navIcon}>{item.icon}</span>
                  <span className={styles.navText}>
                    {item.label}
                    {item.href === "/admin/notifications" && unreadCount > 0 ? (
                      <span className={styles.navBadge}>{unreadCount}</span>
                    ) : null}
                  </span>
                </Link>
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
