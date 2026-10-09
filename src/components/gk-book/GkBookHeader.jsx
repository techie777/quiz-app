"use client";

import React, { useState } from "react";
import styles from "@/styles/GkBook.module.css";
import { ArrowLeft, Headphones, FileText, SlidersHorizontal, X, Sun, Moon, BookOpen, Zap, Maximize2 } from "lucide-react";

const THEMES = [
  { id: "light", label: "लाइट", labelEn: "Light", icon: "☀️", bg: "#ffffff", color: "#1b1b3a", border: "#e4e4f4" },
  { id: "sepia", label: "सेपिया", labelEn: "Sepia", icon: "📜", bg: "#f8f0dc", color: "#3b2f1c", border: "#dccfae" },
  { id: "dark", label: "डार्क", labelEn: "Dark", icon: "🌙", bg: "#1c1c3a", color: "#ececff", border: "#2d2d55" },
];

const FONT_PRESETS = [14, 16, 18, 20, 22];

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
  isFull = false,
  onToggleShortFull,
  onBackToIndex,
}) {
  const [showSettings, setShowSettings] = useState(false);

  const handleFontDecrease = () => {
    const nextSize = Math.max(14, fontSize - 1);
    if (onFontSizeChange) onFontSizeChange(nextSize);
  };

  const handleFontIncrease = () => {
    const nextSize = Math.min(24, fontSize + 1);
    if (onFontSizeChange) onFontSizeChange(nextSize);
  };

  return (
    <>
      <header className={styles.header}>
        {/* Back to Chapter Index button */}
        {onBackToIndex && (
          <button
            type="button"
            onClick={onBackToIndex}
            className={styles.headerBackBtn}
            title="अनुक्रमणिका (Table of Contents)"
            aria-label="अनुक्रमणिका"
          >
            <ArrowLeft size={16} />
            <span className={styles.headerBackLabel}>इंडेक्स</span>
          </button>
        )}

        {/* Truncated Book/Chapter Title */}
        <h2 className={styles.headerTitle} title={title}>
          {title}
        </h2>

        {/* Action Controls */}
        <div className={styles.headerActions}>
          {/* Audio Reader Toggle */}
          {onToggleAudio && (
            <button
              type="button"
              className={`${styles.iconBtn} ${isPlayingAudio ? styles.iconBtnActive : ""}`}
              onClick={onToggleAudio}
              aria-label="ऑडियो सुनें"
              title={isPlayingAudio ? "ऑडियो बंद करें" : "ऑडियो सुनें"}
            >
              <Headphones size={15} />
              <span className={styles.btnTextResponsive}>
                {isPlayingAudio ? "रोकें" : "सुनें"}
              </span>
            </button>
          )}

          {/* Highlights & Notes Toggle */}
          {onOpenNotes && (
            <button
              type="button"
              className={styles.iconBtn}
              onClick={onOpenNotes}
              aria-label="मेरे नोट्स"
              title="मेरे नोट्स व हाइलाइट्स"
            >
              <FileText size={15} />
              {notesCount > 0 && <span className={styles.badgeCount}>{notesCount}</span>}
            </button>
          )}

          {/* Reading Preferences (Aa / Settings Drawer) */}
          <button
            type="button"
            className={`${styles.iconBtn} ${styles.settingsTriggerBtn} ${showSettings ? styles.iconBtnActive : ""}`}
            onClick={() => setShowSettings(!showSettings)}
            aria-label="रीडिंग सेटिंग्स (Font, Theme, Mode)"
            title="रीडिंग सेटिंग्स (Aa)"
          >
            <span className={styles.aaGlyph}>Aa</span>
            <SlidersHorizontal size={13} className={styles.settingsIconSmall} />
          </button>
        </div>
      </header>

      {/* ── KINDLE-STYLE READING PREFERENCES POPOVER / BOTTOM SHEET ── */}
      {showSettings && (
        <div className={styles.settingsOverlay} onClick={() => setShowSettings(false)}>
          <div className={styles.settingsDrawer} onClick={(e) => e.stopPropagation()}>
            {/* Drawer Header */}
            <div className={styles.settingsHeader}>
              <div className="flex items-center gap-2">
                <span className="text-base font-black">📖 रीडिंग प्राथमिकताएं</span>
                <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950/50 px-2 py-0.5 rounded-full">
                  Display
                </span>
              </div>
              <button
                type="button"
                className={styles.settingsCloseBtn}
                onClick={() => setShowSettings(false)}
                aria-label="बंद करें"
              >
                <X size={18} />
              </button>
            </div>

            <div className={styles.settingsBody}>
              {/* 1. Theme Selection */}
              <div className={styles.prefGroup}>
                <label className={styles.prefLabel}>पठन थीम (Theme):</label>
                <div className={styles.themeGrid}>
                  {THEMES.map((t) => {
                    const isActive = theme === t.id;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => onThemeChange && onThemeChange(t.id)}
                        className={`${styles.themeOption} ${isActive ? styles.themeOptionActive : ""}`}
                        style={{ background: t.bg, color: t.color, borderColor: t.border }}
                      >
                        <span className="text-base">{t.icon}</span>
                        <span className="font-bold text-xs">{t.label}</span>
                        {isActive && <span className={styles.themeActiveDot} />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Font Size Stepper & Presets */}
              <div className={styles.prefGroup}>
                <div className="flex items-center justify-between mb-1.5">
                  <label className={styles.prefLabel}>फॉन्ट आकार (Text Size):</label>
                  <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-0.5 rounded-md">
                    {fontSize}px
                  </span>
                </div>

                <div className={styles.fontSizeControlsRow}>
                  <button
                    type="button"
                    onClick={handleFontDecrease}
                    disabled={fontSize <= 14}
                    className={styles.fontStepperBtn}
                    title="छोटा करें"
                  >
                    A−
                  </button>

                  <div className={styles.fontPresetsBar}>
                    {FONT_PRESETS.map((sz) => (
                      <button
                        key={sz}
                        type="button"
                        onClick={() => onFontSizeChange && onFontSizeChange(sz)}
                        className={`${styles.fontPresetPill} ${fontSize === sz ? styles.fontPresetActive : ""}`}
                      >
                        {sz}
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={handleFontIncrease}
                    disabled={fontSize >= 24}
                    className={styles.fontStepperBtn}
                    title="बड़ा करें"
                  >
                    A+
                  </button>
                </div>
              </div>

              {/* 3. Short vs Full Study Mode */}
              {onToggleShortFull && (
                <div className={styles.prefGroup}>
                  <label className={styles.prefLabel}>अध्ययन प्रारूप (Study Mode):</label>
                  <div className={styles.modeSwitchGrid}>
                    <button
                      type="button"
                      onClick={() => onToggleShortFull(false)}
                      className={`${styles.modeToggleBtn} ${!isFull ? styles.modeToggleActive : ""}`}
                    >
                      <Zap size={14} className="text-amber-500" />
                      <div>
                        <div className="font-bold text-xs">संक्षिप्त (Short)</div>
                        <div className="text-[10px] opacity-70">क्विक रिवीजन नोट्स</div>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => onToggleShortFull(true)}
                      className={`${styles.modeToggleBtn} ${isFull ? styles.modeToggleActive : ""}`}
                    >
                      <BookOpen size={14} className="text-indigo-500" />
                      <div>
                        <div className="font-bold text-xs">विस्तृत (Full)</div>
                        <div className="text-[10px] opacity-70">गहन अध्ययन व विश्लेषण</div>
                      </div>
                    </button>
                  </div>
                </div>
              )}

              {/* 4. Bilingual Toggle & Zen Mode */}
              <div className={styles.quickTogglesGrid}>
                {onToggleBilingual && (
                  <button
                    type="button"
                    onClick={onToggleBilingual}
                    className={`${styles.utilityBtn} ${isBilingual ? styles.utilityBtnActive : ""}`}
                  >
                    <span className="font-black text-xs">🔤</span>
                    <div className="text-left">
                      <div className="font-bold text-xs">द्विभाषी शब्दावली</div>
                      <div className="text-[10px] opacity-70">
                        {isBilingual ? "सक्रिय (HI + EN)" : "केवल हिन्दी"}
                      </div>
                    </div>
                  </button>
                )}

                {onToggleZen && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowSettings(false);
                      onToggleZen();
                    }}
                    className={styles.utilityBtn}
                  >
                    <Maximize2 size={14} />
                    <div className="text-left">
                      <div className="font-bold text-xs">ज़ेन मोड (Zen)</div>
                      <div className="text-[10px] opacity-70">बिना रुकावट फुलस्क्रीन</div>
                    </div>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
