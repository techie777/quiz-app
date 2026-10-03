"use client";

import React, { useState, useEffect, useMemo } from "react";
import { X, Check } from "lucide-react";
import styles from "@/styles/Flashcards.module.css";

/**
 * CategorySheet component with multi-category selection support.
 * Full-height white slide-up sheet with search, mode chips (All / Random / Daily),
 * checkboxes for multi-selection, and sticky Apply button.
 */
export default function CategorySheet({
  isOpen,
  onClose,
  categories = [],
  selectedCategoryIds = [], // Array of string IDs
  selectedMode = "all", // "all", "random", "daily"
  onSelectCategories,
  onSelectMode,
  isHindi = false,
}) {
  const [searchQuery, setSearchQuery] = useState("");
  // Local working state for multi-select so user can pick multiple and apply
  const [tempSelectedIds, setTempSelectedIds] = useState([]);

  useEffect(() => {
    if (isOpen) {
      setTempSelectedIds(Array.isArray(selectedCategoryIds) ? [...selectedCategoryIds] : []);
    }
  }, [isOpen, selectedCategoryIds]);

  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return categories;
    const q = searchQuery.toLowerCase().trim();
    return categories.filter((cat) => {
      const matchEn = cat.name?.toLowerCase().includes(q);
      const matchHi = cat.nameHi?.toLowerCase().includes(q);
      return matchEn || matchHi;
    });
  }, [categories, searchQuery]);

  const toggleCategory = (catId) => {
    setTempSelectedIds((prev) => {
      if (prev.includes(catId)) {
        return prev.filter((id) => id !== catId);
      } else {
        return [...prev, catId];
      }
    });
  };

  const handleSelectAll = () => {
    setTempSelectedIds([]);
  };

  const handleApply = () => {
    onSelectCategories(tempSelectedIds);
    onClose();
  };

  if (!isOpen) return null;

  const isAllSelected = tempSelectedIds.length === 0;

  return (
    <div
      className={styles.sheetOverlay}
      onClick={handleApply}
      role="dialog"
      aria-modal="true"
      aria-label="Category Selection"
    >
      <div
        className={styles.fullHeightSheet}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sheet Header */}
        <div className={styles.sheetHeader}>
          <h2 className={styles.sheetTitle}>
            {isHindi ? "श्रेणियाँ (Categories)" : "Categories"}
          </h2>
          <button
            type="button"
            className={styles.sheetCloseBtn}
            onClick={handleApply}
            aria-label="Close categories sheet"
          >
            <X size={22} />
          </button>
        </div>

        {/* Search Input */}
        <div className={styles.sheetSearchContainer}>
          <input
            type="text"
            className={styles.sheetSearchInput}
            placeholder={isHindi ? "खोजें (Search)" : "Search"}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoFocus
          />
        </div>

        {/* Mode Chips: All, Random, Daily */}
        <div className={styles.sheetModesRow}>
          {[
            { id: "all", label: "All", labelHi: "सभी" },
            { id: "random", label: "Random", labelHi: "रैंडम" },
            { id: "daily", label: "Daily", labelHi: "दैनिक" },
          ].map((mode) => {
            const isActive = selectedMode === mode.id;
            return (
              <button
                key={mode.id}
                type="button"
                className={`${styles.modeChip} ${
                  isActive ? styles.modeChipActive : ""
                }`}
                onClick={() => onSelectMode(mode.id)}
              >
                {isHindi ? mode.labelHi : mode.label}
              </button>
            );
          })}
        </div>

        {/* Multi-Select Sub-Bar */}
        <div className={styles.sheetSubBar}>
          <span className={styles.multiSelectHint}>
            {isAllSelected
              ? isHindi
                ? "सभी श्रेणियां चुनी गईं"
                : "All categories selected"
              : isHindi
              ? `${tempSelectedIds.length} श्रेणियां चुनी गईं`
              : `${tempSelectedIds.length} selected`}
          </span>
          {!isAllSelected && (
            <button
              type="button"
              className={styles.multiSelectClearBtn}
              onClick={handleSelectAll}
            >
              {isHindi ? "सभी चुनें (Reset)" : "Select All"}
            </button>
          )}
        </div>

        {/* Categories List (Scrollable) */}
        <div className={styles.categoryListScrollable}>
          {/* Row 1: All categories */}
          <div
            className={styles.categoryRow}
            onClick={handleSelectAll}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                handleSelectAll();
              }
            }}
          >
            <div className={styles.categoryRowText}>
              <span>All categories</span>
              <span className={styles.categorySep}> · </span>
              <span className={styles.categoryHindi}>सभी</span>
            </div>
            <div
              className={`${styles.categoryCheckboxBox} ${
                isAllSelected ? styles.categoryCheckboxBoxActive : ""
              }`}
            >
              {isAllSelected && <Check size={14} strokeWidth={3} />}
            </div>
          </div>

          {/* Filtered category rows */}
          {filteredCategories.map((cat) => {
            const isSelected = tempSelectedIds.includes(cat.id);
            return (
              <div
                key={cat.id}
                className={styles.categoryRow}
                onClick={() => toggleCategory(cat.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    toggleCategory(cat.id);
                  }
                }}
              >
                <div className={styles.categoryRowText}>
                  <span>{cat.name}</span>
                  {cat.nameHi && (
                    <>
                      <span className={styles.categorySep}> · </span>
                      <span className={styles.categoryHindi}>{cat.nameHi}</span>
                    </>
                  )}
                </div>
                <div
                  className={`${styles.categoryCheckboxBox} ${
                    isSelected ? styles.categoryCheckboxBoxActive : ""
                  }`}
                >
                  {isSelected && <Check size={14} strokeWidth={3} />}
                </div>
              </div>
            );
          })}
        </div>

        {/* Sticky Apply Footer */}
        <div className={styles.sheetStickyFooter}>
          <button
            type="button"
            className={styles.sheetApplyButton}
            onClick={handleApply}
          >
            <Check size={18} />
            <span>
              {isHindi
                ? isAllSelected
                  ? "सभी श्रेणियां लागू करें"
                  : `${tempSelectedIds.length} श्रेणियां लागू करें`
                : isAllSelected
                ? "Apply All Categories"
                : `Apply (${tempSelectedIds.length} Selected)`}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
