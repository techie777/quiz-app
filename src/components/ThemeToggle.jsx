"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import styles from "@/styles/ThemeToggle.module.css";

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <div className={styles.toggle} />;
  }

  const isDark = theme === "dark";

  return (
    <button
      className={`${styles.toggle} ${isDark ? styles.dark : ""}`}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
      title={`Switch to ${isDark ? "light" : "dark"} mode`}
    >
      <span className={styles.icon}>{isDark ? "🌙" : "☀️"}</span>
      <span className={styles.slider} />
    </button>
  );
}
