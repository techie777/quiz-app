"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import styles from "@/styles/GkBook.module.css";
import GkBookHeader from "./GkBookHeader";
import GkBookQuizCard from "./GkBookQuizCard";
import {
  SHORT_PAGES,
  FULL_PAGES,
  SOLAR_SYSTEM_SHORT_PAGES,
  SOLAR_SYSTEM_FULL_PAGES,
  CHAPTER_PAGES_MAP,
  STORAGE_KEY,
  sanitizeHtml,
  LIVE_CHAPTER,
} from "@/lib/gk-book/seedData";

export default function GkBookReader({
  initialPage = 0,
  chapterSlug = "sindhu-ghati",
  onBackToIndex,
}) {
  // Local state synced with localStorage "gkbook:v1"
  const [pageIndex, setPageIndex] = useState(initialPage);
  const [isFull, setIsFull] = useState(false);
  const [fontSize, setFontSize] = useState(17);
  const [theme, setTheme] = useState("light");
  const [readPages, setReadPages] = useState({});
  const [attempts, setAttempts] = useState({});
  const [isMounted, setIsMounted] = useState(false);
  const [chapterData, setChapterData] = useState(null);

  const quizCardRef = useRef(null);

  // Load chapter dynamically from DB API with fallback
  useEffect(() => {
    let isCancelled = false;
    async function loadChapter() {
      try {
        const res = await fetch(`/api/gk-book/chapters/${chapterSlug}`);
        const data = await res.json();
        if (!isCancelled && data.success && data.chapter) {
          setChapterData(data.chapter);
        }
      } catch (err) {
        console.warn("[GkBookReader] Failed to fetch chapter from API, using seed:", err);
      }
    }
    loadChapter();
    return () => {
      isCancelled = true;
    };
  }, [chapterSlug]);

  // Load saved settings & progress from localStorage on mount
  useEffect(() => {
    setIsMounted(true);
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && typeof parsed === "object") {
          if (parsed.read) setReadPages(parsed.read);
          if (parsed.att) setAttempts(parsed.att);
          if (typeof parsed.fs === "number") setFontSize(parsed.fs);
          if (parsed.full !== undefined) setIsFull(Boolean(parsed.full));
          if (typeof parsed.pg === "number" && parsed.pg >= 0 && parsed.pg < SHORT_PAGES.length) {
            setPageIndex(parsed.pg);
          }
        }
      }
    } catch (e) {
      console.warn("Failed to load gkbook:v1 state", e);
    }
  }, []);

  // Save changes to localStorage
  const saveState = (updated) => {
    try {
      const current = {
        read: readPages,
        att: attempts,
        pg: pageIndex,
        fs: fontSize,
        full: isFull ? 1 : 0,
        ...updated,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
    } catch (e) {
      console.warn("Failed to save gkbook:v1 state", e);
    }
  };

  const isSolar = chapterSlug === "solar-system";
  const defaultShortPages = isSolar ? SOLAR_SYSTEM_SHORT_PAGES : SHORT_PAGES;
  const defaultFullPages = isSolar ? SOLAR_SYSTEM_FULL_PAGES : FULL_PAGES;
  const seedPages = CHAPTER_PAGES_MAP[chapterSlug] || defaultShortPages;

  const dynamicPages = chapterData?.pages && chapterData.pages.length > 0 ? chapterData.pages : seedPages;
  const totalPagesCount = dynamicPages.length > 0 ? dynamicPages.length : 1;

  // Switch Page
  const goToPage = (newIndex) => {
    if (newIndex < 0 || newIndex >= totalPagesCount) return;
    setPageIndex(newIndex);
    saveState({ pg: newIndex });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Toggle Short / Full
  const handleToggleShortFull = (fullMode) => {
    setIsFull(fullMode);
    saveState({ full: fullMode ? 1 : 0 });
  };

  // Font size change
  const handleFontSizeChange = (newSize) => {
    setFontSize(newSize);
    saveState({ fs: newSize });
  };

  // Theme change
  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
  };

  // IntersectionObserver: Mark page as read ONLY when user scrolls to quiz card
  useEffect(() => {
    if (!isMounted) return;

    const el = quizCardRef.current;
    if (!el) return;

    if (!("IntersectionObserver" in window)) {
      if (!readPages[pageIndex]) {
        const updated = { ...readPages, [pageIndex]: 1 };
        setReadPages(updated);
        saveState({ read: updated });
      }
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !readPages[pageIndex]) {
          const updated = { ...readPages, [pageIndex]: 1 };
          setReadPages(updated);
          saveState({ read: updated });
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );

    observer.observe(el);

    return () => {
      observer.disconnect();
    };
  }, [pageIndex, readPages, isMounted]);

  // Record Quiz Attempt
  const handleRecordAttempt = (pIdx, attempt) => {
    const pageAttempts = attempts[pIdx] || [];
    const updated = {
      ...attempts,
      [pIdx]: [...pageAttempts, attempt],
    };
    setAttempts(updated);
    saveState({ att: updated });
  };

  // Reset Quiz Score for this page
  const handleResetScore = (pIdx) => {
    if (!window.confirm("क्या आप वाकई इस पृष्ठ का स्कोर रीसेट करना चाहते हैं?")) {
      return;
    }
    const updated = { ...attempts };
    delete updated[pIdx];
    setAttempts(updated);
    saveState({ att: updated });
  };

  const currentPage = dynamicPages[pageIndex] || dynamicPages[0] || {};
  const shortBlocks = currentPage.P || currentPage.b || [];
  const fullBlocks = currentPage.F || defaultFullPages[pageIndex] || [];
  const currentBlocks = isFull ? (fullBlocks.length > 0 ? fullBlocks : shortBlocks) : shortBlocks;
  const readMin = isFull ? (currentPage.readingTimeFull || (currentPage.m || 3) + 3) : (currentPage.readingTimeShort || currentPage.m || 3);
  const progressPct = ((pageIndex + 1) / totalPagesCount) * 100;
  const chapterDisplayTitle = chapterData?.titleHi || (isSolar ? "सौरमंडल (Solar System)" : LIVE_CHAPTER.title);

  // Render individual content block
  const renderBlock = (block, idx) => {
    if (!block) return null;
    const type = block.type || block[0];
    const val = block.text !== undefined ? block.text : (block.items !== undefined ? block.items : block[1]);

    if (type === "h") {
      return (
        <h2
          key={idx}
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(val) }}
        />
      );
    }
    if (type === "p") {
      return (
        <p
          key={idx}
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(val) }}
        />
      );
    }
    if (type === "f") {
      return (
        <div
          key={idx}
          className={styles.fact}
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(val) }}
        />
      );
    }
    if (type === "l") {
      return (
        <ul key={idx}>
          {Array.isArray(val) &&
            val.map((item, itemIdx) => (
              <li
                key={itemIdx}
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(item) }}
              />
            ))}
        </ul>
      );
    }
    if (type === "t") {
      return (
        <div key={idx} className={styles.tableWrap}>
          <table className={styles.table}>
            <tbody>
              {Array.isArray(val) &&
                val.map((row, rIdx) => (
                  <tr key={rIdx}>
                    {Array.isArray(row) &&
                      row.map((cell, cIdx) =>
                        rIdx === 0 ? (
                          <th
                            key={cIdx}
                            dangerouslySetInnerHTML={{ __html: sanitizeHtml(cell) }}
                          />
                        ) : (
                          <td
                            key={cIdx}
                            dangerouslySetInnerHTML={{ __html: sanitizeHtml(cell) }}
                          />
                        )
                      )}
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      );
    }
    return null;
  };

  return (
    <div className={styles.bookWrapper} data-theme={theme}>
      {/* Sticky Reader Header */}
      <GkBookHeader
        title={`अध्याय ${pageIndex + 1} / ${totalPagesCount} · ${currentPage.t || currentPage.title || chapterDisplayTitle}`}
        theme={theme}
        onThemeChange={handleThemeChange}
        fontSize={fontSize}
        onFontSizeChange={handleFontSizeChange}
      />

      <main className={styles.main}>
        {/* Breadcrumb with Back to Index */}
        <div className={styles.crumb}>
          {onBackToIndex ? (
            <button
              type="button"
              onClick={onBackToIndex}
              style={{ background: "none", border: "none", color: "var(--pri)", cursor: "pointer", font: "inherit", fontWeight: 700, padding: 0 }}
            >
              ← अनुक्रमणिका (Index)
            </button>
          ) : (
            <Link href="/gk-book">
              ← अनुक्रमणिका (Index)
            </Link>
          )}
          <span>›</span>
          <span>{chapterDisplayTitle}</span>
          <span>›</span>
          <span>पृष्ठ {pageIndex + 1}</span>
        </div>

        {/* Top Prev/Next Navigation Row */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
          <button
            type="button"
            className={`${styles.btn} ${styles.btnSec} ${pageIndex === 0 ? styles.btnDisabled : ""}`}
            onClick={() => goToPage(pageIndex - 1)}
            disabled={pageIndex === 0}
            style={{ minHeight: "36px", padding: "6px 14px", fontSize: "13px" }}
          >
            ‹ पिछला
          </button>
          <span style={{ fontSize: "14px", fontWeight: 700, color: "var(--tx)" }}>
            अध्याय {pageIndex + 1}: {currentPage.t}
          </span>
          <button
            type="button"
            className={`${styles.btn} ${styles.btnSec} ${pageIndex === SHORT_PAGES.length - 1 ? styles.btnDisabled : ""}`}
            onClick={() => goToPage(pageIndex + 1)}
            disabled={pageIndex === totalPagesCount - 1}
            style={{ minHeight: "36px", padding: "6px 14px", fontSize: "13px" }}
          >
            अगला ›
          </button>
        </div>

        {/* Progress Bar */}
        <div className={styles.progressBar} style={{ margin: "0 0 14px" }}>
          <i className={styles.progressFill} style={{ width: `${progressPct}%` }} />
        </div>

        {/* Page Dots Navigation */}
        <div className={styles.dots}>
          {(dynamicPages.length > 0 ? dynamicPages : SHORT_PAGES).map((p, idx) => {
            const isRead = Boolean(readPages[idx]);
            const isCurrent = idx === pageIndex;
            let dotClass = styles.dot;
            if (isRead) dotClass += ` ${styles.dotRead}`;
            if (isCurrent) dotClass += ` ${styles.dotCurrent}`;

            return (
              <button
                key={idx}
                type="button"
                className={dotClass}
                onClick={() => goToPage(idx)}
                aria-label={`अध्याय ${idx + 1}${isRead ? " (पढ़ा हुआ)" : " (नहीं पढ़ा)"}`}
              >
                {isRead ? "✓" : idx + 1}
              </button>
            );
          })}
        </div>

        {/* Short / Full Reading Mode Switcher */}
        <div className={styles.navRow} style={{ margin: "0 0 16px" }}>
          <button
            type="button"
            className={`${styles.btn} ${isFull ? styles.btnSec : ""}`}
            onClick={() => handleToggleShortFull(false)}
          >
            संक्षिप्त पाठ (Short)
          </button>
          <button
            type="button"
            className={`${styles.btn} ${!isFull ? styles.btnSec : ""}`}
            onClick={() => handleToggleShortFull(true)}
          >
            पूरा पाठ (Full)
          </button>
        </div>

        {/* Article Body */}
        <article className={styles.art} style={{ fontSize: `${fontSize}px` }}>
          <h1 style={{ fontSize: "1.5em", margin: "0 0 4px", fontWeight: 800 }}>
            {currentPage.title || currentPage.t}
          </h1>
          <div style={{ color: "var(--mut)", fontSize: "0.85em", marginBottom: "16px" }}>
            ⏱ {readMin} मिनट का पाठ {isFull ? "(विस्तृत अध्ययन)" : "(संक्षिप्त बिंदु)"}
          </div>

          {currentBlocks.map((b, idx) => renderBlock(b, idx))}
        </article>

        {/* Quiz Card at bottom of page with IntersectionObserver anchor */}
        <div ref={quizCardRef}>
          <GkBookQuizCard
            pageIndex={pageIndex}
            questions={currentPage.q || []}
            attempts={attempts[pageIndex] || []}
            onRecordAttempt={handleRecordAttempt}
            onResetScore={handleResetScore}
          />
        </div>

        {/* Bottom Navigation Row */}
        <div className={styles.navRow} style={{ marginTop: "24px" }}>
          <button
            type="button"
            className={`${styles.btn} ${styles.btnSec} ${pageIndex === 0 ? styles.btnDisabled : ""}`}
            onClick={() => goToPage(pageIndex - 1)}
            disabled={pageIndex === 0}
          >
            ← पिछला अध्याय
          </button>
          <button
            type="button"
            className={`${styles.btn} ${pageIndex === totalPagesCount - 1 ? styles.btnDisabled : ""}`}
            onClick={() => goToPage(pageIndex + 1)}
            disabled={pageIndex === totalPagesCount - 1}
            style={{ marginLeft: "auto" }}
          >
            अगला अध्याय →
          </button>
        </div>
      </main>
    </div>
  );
}
