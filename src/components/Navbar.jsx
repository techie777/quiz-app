"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useData } from "@/context/DataContext";
import ThemeToggle from "./ThemeToggle";
import styles from "@/styles/Navbar.module.css";

const DEFAULT_NAV_ITEMS = [
  { id: "daily-quiz", label: "Daily quiz", href: "/daily/quiz-of-the-day", children: [] },
  { id: "daily-current-affairs", label: "Daily current affairs", href: "/daily/daily-current-affairs", children: [] },
  {
    id: "school-study",
    label: "School study",
    href: "/school-study",
    children: [
      { id: "mp-board", label: "Madhya Pradesh", href: "/school-study/madhya-pradesh" },
      { id: "cbse", label: "CBSE", href: "/school-study/cbse" },
      { id: "cisce", label: "CISCE", href: "/school-study/cisce" },
    ],
  },
  { id: "previous-years-papers", label: "Previous years papers", href: "/previous-years-papers", children: [] },
  {
    id: "govt-exams",
    label: "Govt exams",
    href: "/govt-exams",
    children: [
      { id: "upsc", label: "UPSC", href: "/govt-exams/upsc" },
      { id: "ssc", label: "SSC", href: "/govt-exams/ssc" },
      { id: "rrb", label: "RRB", href: "/govt-exams/rrb" },
      { id: "ibp", label: "IBP", href: "/govt-exams/ibp" },
    ],
  },
];

function safeParseNav(raw) {
  if (typeof raw !== "string" || !raw.trim()) return null;
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    return parsed
      .map((it) => ({
        id: String(it?.id || it?.label || Math.random().toString(36).slice(2, 8)).trim(),
        label: String(it?.label || "").trim(),
        href: String(it?.href || "").trim(),
        children: Array.isArray(it?.children)
          ? it.children
              .map((c) => ({
                id: String(c?.id || c?.label || Math.random().toString(36).slice(2, 8)).trim(),
                label: String(c?.label || "").trim(),
                href: String(c?.href || "").trim(),
              }))
              .filter((c) => c.label)
          : [],
      }))
      .filter((it) => it.label);
  } catch {
    return null;
  }
}

export default function Navbar() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const { settings } = useData();
  const [menuOpen, setMenuOpen] = useState(false);
  const [navOpen, setNavOpen] = useState(null);
  const [navPos, setNavPos] = useState(null);
  const menuRef = useRef(null);
  const navBtnRefs = useRef(new Map());
  const isUser = session?.user && !session.user.isAdmin;

  useEffect(() => {
    function handleClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
      if (!e.target.closest?.(`.${styles.subnav}`)) setNavOpen(null);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    setNavOpen(null);
  }, [pathname]);

  // Hide Navbar on admin pages (admin has its own sidebar)
  if (pathname?.startsWith("/admin")) return null;

  const navbarEnabled = settings?.navbarEnabled !== false;
  const navItems = safeParseNav(settings?.navbarItems) || DEFAULT_NAV_ITEMS;

  const openItem = useMemo(() => navItems.find((n) => n.id === navOpen) || null, [navItems, navOpen]);

  useEffect(() => {
    if (!navOpen) return;
    function handleScrollOrResize() {
      setNavOpen(null);
    }
    window.addEventListener("scroll", handleScrollOrResize, true);
    window.addEventListener("resize", handleScrollOrResize);
    return () => {
      window.removeEventListener("scroll", handleScrollOrResize, true);
      window.removeEventListener("resize", handleScrollOrResize);
    };
  }, [navOpen]);

  const toggleDropdown = (itemId) => {
    setNavOpen((prev) => {
      const next = prev === itemId ? null : itemId;
      if (!next) return null;

      const el = navBtnRefs.current.get(itemId);
      if (el) {
        const rect = el.getBoundingClientRect();
        const minWidth = 220;
        const padding = 12;
        const left = Math.max(
          padding,
          Math.min(rect.left, window.innerWidth - minWidth - padding)
        );
        const top = rect.bottom + 10;
        setNavPos({ left, top, width: Math.max(minWidth, Math.floor(rect.width)) });
      } else {
        setNavPos({ left: 12, top: 110, width: 220 });
      }
      return next;
    });
  };

  return (
    <header className={styles.navbar}>
      <div className={styles.container}>
        <Link href="/" className={styles.logo}>
          <span className={styles.logoEmoji}>🧠</span>
          <span className={styles.logoText}>QuizWeb</span>
        </Link>
        <div className={styles.nav_links}>
          <Link href="/" className={styles.link}>
            Quizzes
          </Link>
          {isUser && (
            <Link href="/notes" className={styles.link}>
              My Notes
            </Link>
          )}
          <ThemeToggle />
          {isUser ? (
            <div className={styles.userMenu} ref={menuRef}>
              <button
                className={styles.avatarBtn}
                onClick={() => setMenuOpen(!menuOpen)}
                title="My Account"
              >
                <img
                  src={session.user.image || "/default-avatar.svg"}
                  alt=""
                  className={styles.avatarImg}
                  onError={(e) => {
                    e.currentTarget.src = "/default-avatar.svg";
                  }}
                />
                <span className={styles.avatarLabel}>My Account</span>
              </button>
              {menuOpen && (
                <div className={styles.dropdown}>
                  <div className={styles.dropdownHeader}>
                    <span className={styles.dropdownName}>{session.user.name}</span>
                    <span className={styles.dropdownEmail}>{session.user.email}</span>
                  </div>
                  <Link href="/profile" className={styles.dropdownItem} onClick={() => setMenuOpen(false)}>
                    👤 Profile
                  </Link>
                  <Link href="/notes" className={styles.dropdownItem} onClick={() => setMenuOpen(false)}>
                    ❤️ My Favourites / Notes
                  </Link>
                  <button
                    className={styles.dropdownItem}
                    onClick={() => { signOut({ redirect: false }); setMenuOpen(false); }}
                  >
                    🚪 Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link href="/signin" className={styles.loginBtn}>
              Sign In / Login
            </Link>
          )}
        </div>
      </div>

      {navbarEnabled && (
        <nav className={styles.subnav} aria-label="Site navigation">
          <div className={styles.subnavContainer}>
            {navItems.map((item) => {
              const hasChildren = Array.isArray(item.children) && item.children.length > 0;
              const active =
                pathname === item.href ||
                (hasChildren && item.children.some((c) => pathname === c.href)) ||
                (item.href && pathname?.startsWith(item.href) && item.href !== "/");

              if (!hasChildren) {
                return (
                  <Link
                    key={item.id}
                    href={item.href || "/"}
                    className={`${styles.subnavLink} ${active ? styles.subnavLinkActive : ""}`}
                  >
                    {item.label}
                  </Link>
                );
              }

              return (
                <div key={item.id} className={styles.subnavGroup}>
                  <button
                    type="button"
                    className={`${styles.subnavBtn} ${active ? styles.subnavLinkActive : ""}`}
                    ref={(el) => {
                      if (el) navBtnRefs.current.set(item.id, el);
                      else navBtnRefs.current.delete(item.id);
                    }}
                    onClick={() => toggleDropdown(item.id)}
                  >
                    {item.label}
                    <span className={styles.caret}>▾</span>
                  </button>
                </div>
              );
            })}
          </div>
          {openItem && navPos && (
            <div className={styles.subnavDropdown} style={{ left: navPos.left, top: navPos.top }}>
              <Link
                href={openItem.href || "/"}
                className={styles.subnavDropItem}
                onClick={() => setNavOpen(null)}
              >
                {openItem.label}
              </Link>
              {(openItem.children || []).map((c) => (
                <Link
                  key={c.id}
                  href={c.href || "/"}
                  className={styles.subnavDropItem}
                  onClick={() => setNavOpen(null)}
                >
                  {c.label}
                </Link>
              ))}
            </div>
          )}
        </nav>
      )}
    </header>
  );
}
