"use client";

import { Suspense } from 'react';
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { AdminProvider, useAdmin } from "@/context/AdminContext";
import ThemeToggle from "@/components/ThemeToggle";
import styles from "@/styles/Admin.module.css";

const COMMON_NAV = [
  { href: "/admin", label: "Dashboard", icon: "📊" },
  { href: "/admin/categories", label: "Categories", icon: "📁" },
  { href: "/admin/questions", label: "Questions", icon: "❓" },
  { href: "/admin/daily", label: "Daily Quizzes", icon: "📅" },
  { href: "/admin/upload", label: "Bulk Upload", icon: "📤" },
  { href: "/admin/settings", label: "Settings", icon: "⚙️" },
];

const MASTER_NAV = [
  { href: "/admin/pending", label: "Approval Queue", icon: "📝" },
  { href: "/admin/accounts", label: "Admin Accounts", icon: "👥" },
  { href: "/admin/accounts?type=user", label: "User Accounts", icon: "👤" },
  { href: "/admin/logs", label: "Activity Logs", icon: "📋" },
];

function AdminShell({ children }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { isAuthenticated, loaded, logout, adminUser } = useAdmin();

  if (pathname === "/admin/login") return children;

  if (!loaded) {
    return <div className={styles.loading}><p>Loading...</p></div>;
  }

  if (!isAuthenticated) {
    router.replace("/admin/login");
    return null;
  }

  const isMaster = adminUser?.role === "master";
  const navItems = isMaster ? [...COMMON_NAV, ...MASTER_NAV] : COMMON_NAV;

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
              <span>{item.label}</span>
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
    <AdminProvider>
      <Suspense>
        <AdminShell>{children}</AdminShell>
      </Suspense>
    </AdminProvider>
  );
}
