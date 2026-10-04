"use client";

import React, { useState, useEffect, useMemo } from "react";
import styles from "@/styles/GkBook.module.css";
import GkBookHeader from "./GkBookHeader";
import {
  BOOKS_CATALOG,
  INDIA_GK_TREE,
  WORLD_GK_TREE,
  SHORT_PAGES,
  SOLAR_SYSTEM_SHORT_PAGES,
  STORAGE_KEY,
  LIVE_CHAPTER,
} from "@/lib/gk-book/seedData";

export default function GkBookIndex({
  onSelectChapter,
  bookSlug = "india-gk",
  onBackToShelf,
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [theme, setTheme] = useState("light");
  const [fontSize, setFontSize] = useState(17);
  const [readPages, setReadPages] = useState({});
  const [lastPage, setLastPage] = useState(0);

  // Identify current book object & tree
  const currentBook = useMemo(() => {
    return (
      BOOKS_CATALOG.find((b) => b.slug === bookSlug || b.id === bookSlug) ||
      BOOKS_CATALOG[0]
    );
  }, [bookSlug]);

  const bookTree = useMemo(() => {
    if (bookSlug === "world-gk") return WORLD_GK_TREE;
    return currentBook.tree || INDIA_GK_TREE;
  }, [bookSlug, currentBook]);

  // Load reading progress from localStorage "gkbook:v1"
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && typeof parsed === "object") {
          if (parsed.read) setReadPages(parsed.read);
          if (typeof parsed.pg === "number") setLastPage(parsed.pg);
          if (typeof parsed.fs === "number") setFontSize(parsed.fs);
        }
      }
    } catch (e) {
      console.warn("Could not read gkbook:v1", e);
    }
  }, []);

  // Calculate pages and times
  const isWorldGk = bookSlug === "world-gk";
  const activeChapterPages = isWorldGk ? SOLAR_SYSTEM_SHORT_PAGES : SHORT_PAGES;
  const readCount = Object.keys(readPages).length;
  const totalPages = activeChapterPages.length;
  const totalShortMin = activeChapterPages.reduce((acc, p) => acc + (p.m || 3), 0);
  const totalFullMin = totalShortMin + 15;

  // Reading status indicator
  let statusIcon = "○";
  let statusText = "नहीं पढ़ा";
  let statusClass = styles.iconUnread;

  if (readCount === totalPages) {
    statusIcon = "✓";
    statusText = "पढ़ लिया";
    statusClass = styles.iconDone;
  } else if (readCount > 0) {
    statusIcon = "◐";
    statusText = `जारी ${readCount}/${totalPages}`;
    statusClass = styles.iconProgress;
  }

  // Count total chapters & live chapters for this specific book
  const { totalChapters, liveChaptersCount } = useMemo(() => {
    let tot = 0;
    let live = 0;
    if (bookTree && bookTree.t) {
      bookTree.t.forEach((top) => {
        top.s.forEach((sub) => {
          sub.c.forEach((ch) => {
            tot++;
            if (ch.live) live++;
          });
        });
      });
    }
    return { totalChapters: tot, liveChaptersCount: live };
  }, [bookTree]);

  // Filtered tree based on search query
  const query = searchQuery.trim().toLowerCase();

  const handleOpenChapter = (slug) => {
    if (onSelectChapter) {
      onSelectChapter(slug, 0);
    }
  };

  return (
    <div className={styles.bookWrapper} data-theme={theme}>
      <GkBookHeader
        title={currentBook.title}
        theme={theme}
        onThemeChange={setTheme}
        fontSize={fontSize}
        onFontSizeChange={setFontSize}
      />

      <main className={styles.main}>
        {/* Back to Shelf Button */}
        {onBackToShelf && (
          <button
            type="button"
            onClick={onBackToShelf}
            className={styles.backToShelfBtn}
          >
            ← सभी पुस्तकें (Bookshelf)
          </button>
        )}

        {/* Breadcrumb */}
        <div className={styles.crumb}>
          {onBackToShelf ? (
            <button
              type="button"
              onClick={onBackToShelf}
              style={{
                background: "none",
                border: "none",
                color: "var(--pri)",
                cursor: "pointer",
                font: "inherit",
                fontWeight: 600,
                padding: 0,
              }}
            >
              मेरी पुस्तकें
            </button>
          ) : (
            <span>मेरी पुस्तकें</span>
          )}
          <span>›</span>
          <span style={{ fontWeight: 700, color: "var(--tx)" }}>
            {currentBook.title}
          </span>
          <span>›</span>
          <span>अनुक्रमणिका</span>
        </div>

        {/* Book Header Card */}
        <div className={styles.indexBookHeader}>
          <img
            src={currentBook.cover}
            alt={currentBook.title}
            className={styles.indexBookCover}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", gap: "6px", alignItems: "center", marginBottom: "4px" }}>
              <span
                className={`${styles.chip}`}
                style={{
                  background: "var(--ok)",
                  color: "#ffffff",
                  fontWeight: 700,
                  fontSize: "10.5px",
                  padding: "2px 8px",
                  borderRadius: "10px",
                }}
              >
                ✓ {currentBook.badgeLabel || "लाइव उपलब्ध"}
              </span>
              <span className={styles.chip} style={{ fontSize: "11px" }}>
                {totalChapters} अध्याय · {liveChaptersCount} उपलब्ध
              </span>
            </div>
            <h1 className={styles.heading1} style={{ fontSize: "22px", margin: "0 0 4px" }}>
              {currentBook.title}
            </h1>
            <p
              className={styles.mutedText}
              style={{ fontSize: "12.5px", margin: 0, lineHeight: 1.4 }}
            >
              {currentBook.subtitle}
            </p>
          </div>
        </div>

        {/* Search Input for this book */}
        <input
          type="search"
          className={styles.searchInput}
          placeholder="इस पुस्तक में अध्याय या विषय खोजें…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          aria-label="अध्याय या विषय खोजें"
        />

        {/* Legend */}
        <div className={styles.mutedText} style={{ fontSize: "13px", marginBottom: "16px" }}>
          <span style={{ color: "var(--mut)", fontWeight: 700 }}>○</span> नहीं पढ़ा ·{" "}
          <span style={{ color: "#d97706", fontWeight: 700 }}>◐</span> जारी ·{" "}
          <span style={{ color: "var(--ok)", fontWeight: 700 }}>✓</span> पढ़ लिया
        </div>

        {/* Tree Accordion */}
        <div style={{ marginTop: "12px" }}>
          {bookTree.t.map((top, topIdx) => {
            const topMatches =
              top.n.toLowerCase().includes(query) ||
              (top.en && top.en.toLowerCase().includes(query));

            const filteredSubjects = top.s
              .map((sub) => {
                const subMatches =
                  sub.n.toLowerCase().includes(query) ||
                  (sub.en && sub.en.toLowerCase().includes(query));

                const filteredChapters = sub.c.filter((ch) => {
                  if (!query) return true;
                  return (
                    ch.title.toLowerCase().includes(query) ||
                    (ch.en && ch.en.toLowerCase().includes(query)) ||
                    (ch.slug && ch.slug.toLowerCase().includes(query)) ||
                    subMatches ||
                    topMatches
                  );
                });

                return {
                  ...sub,
                  chapters: filteredChapters,
                };
              })
              .filter((s) => s.chapters.length > 0);

            const topicChapterCount = filteredSubjects.reduce(
              (sum, s) => sum + s.chapters.length,
              0
            );

            if (filteredSubjects.length === 0) return null;

            const isTopicOpen = Boolean(query) || topIdx === 0;

            return (
              <details key={topIdx} className={styles.d1} open={isTopicOpen}>
                <summary className={styles.summary}>
                  <span className={styles.summaryTitle}>
                    <span className={styles.summaryArrow}>▸</span>
                    {top.n}
                  </span>
                  <span className={styles.chapterCount}>{topicChapterCount} अध्याय</span>
                </summary>

                {filteredSubjects.map((sub, subIdx) => {
                  const hasLive = sub.chapters.some((c) => c.live);
                  const isSubOpen = Boolean(query) || hasLive || subIdx === 0;

                  return (
                    <details key={subIdx} className={styles.d2} open={isSubOpen}>
                      <summary className={styles.summary}>
                        <span className={styles.summaryTitle}>
                          <span className={styles.summaryArrow}>▸</span>
                          {sub.n}
                        </span>
                        <span className={styles.chapterCount}>
                          {sub.chapters.length} अध्याय
                        </span>
                      </summary>

                      <div style={{ padding: "4px 0 8px" }}>
                        {sub.chapters.map((ch, chIdx) => {
                          if (ch.live) {
                            return (
                              <button
                                key={chIdx}
                                type="button"
                                onClick={() => handleOpenChapter(ch.slug)}
                                className={`${styles.chapterRow} ${styles.chapterRowLive}`}
                                aria-label={`${ch.title} पढ़ें`}
                              >
                                <div>
                                  <div
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: "8px",
                                    }}
                                  >
                                    <b className={`${styles.iconStatus} ${statusClass}`}>
                                      {statusIcon}
                                    </b>
                                    <span style={{ fontSize: "15px", fontWeight: 700 }}>
                                      {ch.title}
                                    </span>
                                  </div>
                                  <small
                                    className={styles.mutedText}
                                    style={{
                                      display: "block",
                                      marginTop: "4px",
                                      fontSize: "12px",
                                    }}
                                  >
                                    ⏱ लगभग {totalShortMin} मिनट संक्षिप्त · {totalFullMin}{" "}
                                    मिनट पूरा · {totalPages} पृष्ठ
                                  </small>
                                </div>
                                <span className={styles.chip}>{statusText}</span>
                              </button>
                            );
                          }

                          return (
                            <div key={chIdx} className={styles.chapterRow}>
                              <span style={{ fontSize: "14px", color: "var(--tx)" }}>
                                {ch.title}
                              </span>
                              <span className={styles.chip}>जल्द आ रहा है</span>
                            </div>
                          );
                        })}
                      </div>
                    </details>
                  );
                })}
              </details>
            );
          })}
        </div>
      </main>
    </div>
  );
}
