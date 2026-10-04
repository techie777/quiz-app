"use client";

import React from "react";
import styles from "@/styles/GkBook.module.css";

const THEMES = ["light", "sepia", "dark"];

export default function GkBookHeader({
  title = "GK Book",
  theme = "light",
  onThemeChange,
  fontSize = 17,
  onFontSizeChange,
}) {
  const handleToggleTheme = () => {
    const currentIndex = THEMES.indexOf(theme);
    const nextTheme = THEMES[(currentIndex + 1) % THEMES.length];
    if (onThemeChange) onThemeChange(nextTheme);
  };

  const handleFontDecrease = () => {
    const nextSize = Math.max(14, fontSize - 1);
    if (onFontSizeChange) onFontSizeChange(nextSize);
  };

  const handleFontIncrease = () => {
    const nextSize = Math.min(24, fontSize + 1);
    if (onFontSizeChange) onFontSizeChange(nextSize);
  };

  const themeIcon = theme === "dark" ? "🌙" : theme === "sepia" ? "📜" : "🌓";

  return (
    <header className={styles.header}>
      <b className={styles.headerTitle}>{title}</b>
      <button
        type="button"
        className={styles.iconBtn}
        onClick={handleToggleTheme}
        aria-label="थीम बदलें (Toggle Theme)"
        title={`थीम: ${theme}`}
      >
        {themeIcon}
      </button>
      <button
        type="button"
        className={styles.iconBtn}
        onClick={handleFontDecrease}
        aria-label="फॉन्ट छोटा करें (Smaller Text)"
        title="A- Font Size"
      >
        A−
      </button>
      <button
        type="button"
        className={styles.iconBtn}
        onClick={handleFontIncrease}
        aria-label="फॉन्ट बड़ा करें (Larger Text)"
        title="A+ Font Size"
      >
        A+
      </button>
    </header>
  );
}
