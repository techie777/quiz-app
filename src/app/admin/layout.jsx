"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { AdminProvider, useAdmin } from "@/context/AdminContext";
import ThemeToggle from "@/components/ThemeToggle";
import styles from "@/styles/Admin.module.css";
import "./globals.css"; // Import admin-specific globals

const JR_NAV = [
  { href: "/admin", label: "Dashboard", icon: "📊", perm: "dashboard" },
  { href: "/admin/daily", label: "Daily Quizzes", icon: "📅", perm: "daily" },
  { href: "/admin/current-affairs", label: "Current Affairs", icon: "🗞️", perm: "currentAffairs" },
  { href: "/admin/govt-exams", label: "Govt Exams", icon: "🏛️", perm: "govtExams" },
  { href: "/admin/mock-tests-manager", label: "Mock Tests Engine", icon: "📝", perm: "mockTestsManager" },
  { href: "/admin/study-material", label: "Study Materials", icon: "📚", perm: "studyMaterial" },
  { href: "/admin/sections", label: "Sections", icon: "📂", perm: "sections" },
  { href: "/admin/categories", label: "Categories", icon: "📁", perm: "categories" },
  { href: "/admin/questions", label: "Questions", icon: "❓", perm: "questions" },
  { href: "/admin/upload", label: "Bulk Upload", icon: "📤", perm: "upload" },
  { href: "/admin/notifications", label: "Notifications", icon: "🔔", perm: "notifications" },
  { href: "/admin/fun-facts", label: "Fun Facts", icon: "💡", perm: "funFacts" },
  { href: "/admin/book-my-course", label: "Book My Course", icon: "📚", perm: "bookMyCourse" },
  { href: "/admin/career-guides", label: "Career Guides", icon: "🧭", perm: "careerGuides" },
  { href: "/admin/school-study", label: "School Study", icon: "🏫", perm: "schoolStudy" },
  { href: "/admin/settings", label: "Settings", icon: "⚙️", perm: "settings" },
];

const MASTER_NAV = [
  { href: "/admin", label: "Dashboard", icon: "📊", perm: "dashboard" },
  { href: "/admin/daily", label: "Daily Quizzes", icon: "📅", perm: "daily" },
  { href: "/admin/current-affairs", label: "Current Affairs", icon: "🗞️", perm: "currentAffairs" },
  { href: "/admin/govt-exams", label: "Govt Exams", icon: "🏛️", perm: "govtExams" },
  { href: "/admin/mock-tests-manager", label: "Mock Tests Engine", icon: "📝", perm: "mockTestsManager" },
  { href: "/admin/study-material", label: "Study Materials", icon: "📚", perm: "studyMaterial" },
  { href: "/admin/sections", label: "Sections", icon: "📂", perm: "sections" },
  { href: "/admin/categories", label: "Categories", icon: "📁", perm: "categories" },
  { href: "/admin/questions", label: "Questions", icon: "❓", perm: "questions" },
  { href: "/admin/upload", label: "Bulk Upload", icon: "📤", perm: "upload" },
  { href: "/admin/pending", label: "Approval Queue", icon: "📝", perm: "pending" },
  { href: "/admin/accounts", label: "Admin Accounts", icon: "👥", perm: "accounts" },
  { href: "/admin/accounts?type=user", label: "User Accounts", icon: "👤", perm: "users" },
  { href: "/admin/logs", label: "Activity Logs", icon: "📋", perm: "logs" },
  { href: "/admin/notifications", label: "Notifications", icon: "🔔", perm: "notifications" },
  { href: "/admin/fun-facts", label: "Fun Facts", icon: "💡", perm: "funFacts" },
  { href: "/admin/book-my-course", label: "Book My Course", icon: "📚", perm: "bookMyCourse" },
  { href: "/admin/career-guides", label: "Career Guides", icon: "🧭", perm: "careerGuides" },
  { href: "/admin/school-study", label: "School Study", icon: "🏫", perm: "schoolStudy" },
  { href: "/admin/settings", label: "Settings", icon: "⚙️", perm: "settings" },
];

function AdminShell({ children }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { isAuthenticated, loaded, logout, adminUser, status } = useAdmin();
  const [unreadCount, setUnreadCount] = useState(0);

  const isLogin = pathname === "/admin/login";
  const isMaster = adminUser?.role === "master";

  const navItems = useMemo(() => {
    const raw = isMaster ? MASTER_NAV : JR_NAV;
    if (isMaster) return raw;
    const perms = adminUser?.permissions || {};
    return raw.filter((item) => perms[item.perm] !== false);
  }, [adminUser?.permissions, isMaster]);

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

  if (isLogin) return children;

  if (!loaded) {
    return <div className={styles.loading}><p>Loading...</p></div>;
  }

  // Only redirect if status is explicitly unauthenticated
  if (status === "unauthenticated") {
    router.replace("/admin/login");
    return null;
  }

  // Also check if they have admin privileges
  if (status === "authenticated" && !isAuthenticated) {
    router.replace("/admin/login");
    return null;
  }

  const handleLogout = async () => {
    await logout();
    router.push("/admin/login");
  };

  const isLinkActive = (href) => {
    if (href.includes("?")) {
      const [path, query] = href.split("?");
      const params = new URLSearchParams(query);
      const type = params.get("type");
      return pathname === path && searchParams.get("type") === type;
    }
    return pathname === href && !searchParams.get("type");
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
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`${styles.navLink} ${
                isLinkActive(item.href) ? styles.navLinkActive : ""
              }`}
            >
              <span className={styles.navIcon}>{item.icon}</span>
              <span className={styles.navText}>
                {item.label}
                {item.href === "/admin/notifications" && unreadCount > 0 ? (
                  <span className={styles.navBadge}>{unreadCount}</span>
                ) : null}
              </span>
            </Link>
          ))}
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
