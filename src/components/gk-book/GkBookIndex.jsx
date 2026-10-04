"use client";

import React, { useState, useEffect, useMemo } from "react";
import styles from "@/styles/GkBook.module.css";
import GkBookHeader from "./GkBookHeader";
import {
  BOOK_TREE,
  SHORT_PAGES,
  STORAGE_KEY,
  LIVE_CHAPTER,
} from "@/lib/gk-book/seedData";

export default function GkBookIndex({ onSelectChapter }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [theme, setTheme] = useState("light");
  const [fontSize, setFontSize] = useState(17);
  const [readPages, setReadPages] = useState({});
  const [lastPage, setLastPage] = useState(0);

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

  // Calculate live chapter stats
  const readCount = Object.keys(readPages).length;
  const totalPages = SHORT_PAGES.length;
  const totalShortMin = SHORT_PAGES.reduce((acc, p) => acc + (p.m || 3), 0);
  const totalFullMin = totalShortMin + 20;

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

  // Count total chapters & live chapters across tree
  const { totalChapters, liveChaptersCount } = useMemo(() => {
    let tot = 0;
    let live = 0;
    BOOK_TREE.forEach((cat) => {
      cat.t.forEach((top) => {
        top.s.forEach((sub) => {
          sub.c.forEach((ch) => {
            tot++;
            if (ch.live) live++;
          });
        });
      });
    });
    return { totalChapters: tot, liveChaptersCount: live };
  }, []);

  // Filtered tree based on search query
  const query = searchQuery.trim().toLowerCase();

  const handleOpenLiveChapter = (e) => {
    e.preventDefault();
    if (onSelectChapter) {
      onSelectChapter(LIVE_CHAPTER.slug, lastPage || 0);
    }
  };

  return (
    <div className={styles.bookWrapper} data-theme={theme}>
      <GkBookHeader
        title="GK Book"
        theme={theme}
        onThemeChange={setTheme}
        fontSize={fontSize}
        onFontSizeChange={setFontSize}
      />

      <main className={styles.main}>
        {/* Breadcrumb */}
        <div className={styles.crumb}>
          <span>GK Book</span>
          <span>›</span>
          <span>अनुक्रमणिका (Shelf)</span>
        </div>

        <h1 className={styles.heading1}>GK Book</h1>
        <p className={styles.mutedText}>
          पूरी अनुक्रमणिका: उप-श्रेणी → विषय → उप-विषय → अध्याय · {totalChapters} अध्याय, {liveChaptersCount} उपलब्ध
        </p>

        {/* Search Input */}
        <input
          type="search"
          className={styles.searchInput}
          placeholder="अध्याय या विषय खोजें…"
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
          {BOOK_TREE.map((cat, catIdx) => {
            const catMatches = cat.n.toLowerCase().includes(query) || (cat.en && cat.en.toLowerCase().includes(query));

            const filteredTopics = cat.t.map((top) => {
              const topMatches = top.n.toLowerCase().includes(query) || (top.en && top.en.toLowerCase().includes(query));

              const filteredSubjects = top.s.map((sub) => {
                const subMatches = sub.n.toLowerCase().includes(query) || (sub.en && sub.en.toLowerCase().includes(query));

                const filteredChapters = sub.c.filter((ch) => {
                  if (!query) return true;
                  return (
                    ch.title.toLowerCase().includes(query) ||
                    (ch.en && ch.en.toLowerCase().includes(query)) ||
                    (ch.slug && ch.slug.toLowerCase().includes(query)) ||
                    subMatches ||
                    topMatches ||
                    catMatches
                  );
                });

                return {
                  ...sub,
                  chapters: filteredChapters,
                };
              }).filter((s) => s.chapters.length > 0);

              const topicChapterCount = filteredSubjects.reduce(
                (sum, s) => sum + s.chapters.length,
                0
              );

              return {
                ...top,
                subjects: filteredSubjects,
                totalCount: topicChapterCount,
              };
            }).filter((t) => t.subjects.length > 0);

            const catChapterCount = filteredTopics.reduce(
              (sum, t) => sum + t.totalCount,
              0
            );

            if (filteredTopics.length === 0) return null;

            const isCatOpen = Boolean(query) || cat.n === "India GK";

            return (
              <details key={catIdx} className={styles.d1} open={isCatOpen}>
                <summary className={styles.summary}>
                  <span className={styles.summaryTitle}>
                    <span className={styles.summaryArrow}>▸</span>
                    {cat.n}
                  </span>
                  <span className={styles.chapterCount}>{catChapterCount} अध्याय</span>
                </summary>

                {filteredTopics.map((top, topIdx) => {
                  const isTopicOpen = Boolean(query) || top.n === "इतिहास";

                  return (
                    <details key={topIdx} className={styles.d2} open={isTopicOpen}>
                      <summary className={styles.summary}>
                        <span className={styles.summaryTitle}>
                          <span className={styles.summaryArrow}>▸</span>
                          {top.n}
                        </span>
                        <span className={styles.chapterCount}>{top.totalCount} अध्याय</span>
                      </summary>

                      {top.subjects.map((sub, subIdx) => {
                        const hasLive = sub.chapters.some((c) => c.live);
                        const isSubOpen = Boolean(query) || hasLive;

                        return (
                          <details key={subIdx} className={styles.d3} open={isSubOpen}>
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
                                      onClick={handleOpenLiveChapter}
                                      className={`${styles.chapterRow} ${styles.chapterRowLive}`}
                                      aria-label={`${ch.title} पढ़ें`}
                                    >
                                      <div>
                                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                          <b className={`${styles.iconStatus} ${statusClass}`}>
                                            {statusIcon}
                                          </b>
                                          <span style={{ fontSize: "15px", fontWeight: 700 }}>
                                            {ch.title}
                                          </span>
                                        </div>
                                        <small className={styles.mutedText} style={{ display: "block", marginTop: "4px", fontSize: "12px" }}>
                                          ⏱ लगभग {totalShortMin} मिनट संक्षिप्त · {totalFullMin} मिनट पूरा · {totalPages} अध्याय
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
              </details>
            );
          })}
        </div>
      </main>
    </div>
  );
}
