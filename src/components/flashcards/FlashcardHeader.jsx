"use client";

import React from "react";
import Link from "next/link";
import { ChevronDown, Flame } from "lucide-react";
import styles from "@/styles/Flashcards.module.css";

/**
 * FlashcardHeader:
 * Header row 1:
 *   Left = segmented switch "Facts | True / False"
 *   Right = EN | HI toggle
 * Header row 2:
 *   Left = current category name with a small chevron-down (opens category sheet)
 *   Right = optional streak chip (if streak >= 3) + progress text ("7 / 20")
 */
export default function FlashcardHeader({
  activeTab = "facts", // "facts" or "tf"
  language = "EN", // "EN" or "HI"
  onLanguageChange,
  categoryName = "All categories",
  categoryNameHi = "सभी",
  onOpenCategorySheet,
  progressText = "1 / 20",
  streak = 0,
}) {
  const isHindi = language === "HI";
  const displayCategory = isHindi ? (categoryNameHi || categoryName) : categoryName;

  return (
    <header className={styles.headerSection} role="banner">
      {/* Header Row 1 */}
      <div className={styles.headerRow1}>
        {/* Left: Segmented Switch Facts | True / False */}
        <div className={styles.segmentedSwitch} role="tablist" aria-label="Flashcard Mode">
          <Link
            href="/fun-facts"
            className={`${styles.segmentItem} ${
              activeTab === "facts" ? styles.segmentItemActive : ""
            }`}
            role="tab"
            aria-selected={activeTab === "facts"}
          >
            {isHindi ? "तथ्य" : "Facts"}
          </Link>
          <Link
            href="/true-false"
            className={`${styles.segmentItem} ${
              activeTab === "tf" ? styles.segmentItemActive : ""
            }`}
            role="tab"
            aria-selected={activeTab === "tf"}
          >
            {isHindi ? "सही / गलत" : "True / False"}
          </Link>
        </div>

        {/* Right: EN | HI toggle */}
        <div className={styles.segmentedSwitch} role="group" aria-label="Language Switcher">
          <button
            type="button"
            className={`${styles.segmentItem} ${
              language === "EN" ? styles.segmentItemActive : ""
            }`}
            onClick={() => onLanguageChange("EN")}
            aria-label="Switch to English"
          >
            EN
          </button>
          <button
            type="button"
            className={`${styles.segmentItem} ${
              language === "HI" ? styles.segmentItemActive : ""
            }`}
            onClick={() => onLanguageChange("HI")}
            aria-label="Switch to Hindi"
          >
            HI
          </button>
        </div>
      </div>

      {/* Header Row 2 */}
      <div className={styles.headerRow2}>
        {/* Left: Category dropdown button */}
        <button
          type="button"
          className={styles.categorySelectorBtn}
          onClick={onOpenCategorySheet}
          aria-label={`Current category: ${displayCategory}. Click to change category`}
        >
          <span>{displayCategory}</span>
          <ChevronDown size={15} className={styles.chevronIcon} />
        </button>

        {/* Right: Progress and optional Streak Chip */}
        <div className={styles.progressAndBadges}>
          {streak >= 3 && (
            <div className={styles.streakChip} aria-label={`Current streak: ${streak}`}>
              <Flame size={13} fill="#8C5800" />
              <span>{streak}</span>
            </div>
          )}
          <span className={styles.progressText}>{progressText}</span>
        </div>
      </div>
    </header>
  );
}
