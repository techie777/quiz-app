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
  onToggleAudio,
  isPlayingAudio = false,
  onToggleZen,
  onOpenNotes,
  notesCount = 0,
  isBilingual = false,
  onToggleBilingual,
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

      {/* Audio Reader Toggle */}
      {onToggleAudio && (
        <button
          type="button"
          className={styles.iconBtn}
          onClick={onToggleAudio}
          aria-label="ऑडियो सुनें (Listen Audio)"
          title="ऑडियो मोड: पृष्ठ को सुनें"
          style={{
            color: isPlayingAudio ? "var(--ok)" : "inherit",
            borderColor: isPlayingAudio ? "var(--ok)" : undefined,
          }}
        >
          {isPlayingAudio ? "🔊 बंद करें" : "🎧 सुनें"}
        </button>
      )}

      {/* Highlights & Notes Drawer Toggle */}
      {onOpenNotes && (
        <button
          type="button"
          className={styles.iconBtn}
          onClick={onOpenNotes}
          aria-label="मेरे नोट्स व हाइलाइट्स"
          title="मेरे हाइलाइट्स व नोट्स"
        >
          📝 {notesCount > 0 ? `(${notesCount})` : ""}
        </button>
      )}

      {/* Zen Focus Mode Toggle */}
      {onToggleZen && (
        <button
          type="button"
          className={styles.iconBtn}
          onClick={onToggleZen}
          aria-label="ज़ेन मोड (Focus Mode)"
          title="ज़ेन मोड: एकाग्र पठन (Distraction Free)"
        >
          🔲
        </button>
      )}

      {/* Bilingual / Terminology Toggle */}
      {onToggleBilingual && (
        <button
          type="button"
          className={styles.iconBtn}
          onClick={onToggleBilingual}
          aria-label="द्विभाषी टॉगल"
          title="द्विभाषी मोड: हिन्दी + English शब्दावली"
          style={{
            fontWeight: 800,
            fontSize: "11px",
            color: isBilingual ? "var(--pri)" : "inherit",
            borderColor: isBilingual ? "var(--pri)" : undefined,
          }}
        >
          {isBilingual ? "HI+EN" : "HI"}
        </button>
      )}

      {/* Theme Toggle */}
      <button
        type="button"
        className={styles.iconBtn}
        onClick={handleToggleTheme}
        aria-label="थीम बदलें (Toggle Theme)"
        title={`थीम: ${theme}`}
      >
        {themeIcon}
      </button>

      {/* Font Size Adjusters */}
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
