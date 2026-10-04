"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import styles from "@/styles/GkBook.module.css";
import GkBookHeader from "./GkBookHeader";
import { BOOKS_CATALOG, INDIA_GK_TREE, WORLD_GK_TREE } from "@/lib/gk-book/seedData";

export default function GkBookShelf({ onSelectBook, onSelectChapter }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [theme, setTheme] = useState("light");
  const [fontSize, setFontSize] = useState(17);

  // Search logic across books and all internal chapters
  const query = searchQuery.trim().toLowerCase();

  // Find matching chapters across books for instant jump
  const matchingChapters = useMemo(() => {
    if (!query) return [];
    const results = [];

    const searchInTree = (bookSlug, bookTitle, tree) => {
      if (!tree || !tree.t) return;
      tree.t.forEach((top) => {
        const topMatches = top.n.toLowerCase().includes(query) || (top.en && top.en.toLowerCase().includes(query));
        top.s.forEach((sub) => {
          const subMatches = sub.n.toLowerCase().includes(query) || (sub.en && sub.en.toLowerCase().includes(query));
          sub.c.forEach((ch) => {
            const chMatches =
              ch.title.toLowerCase().includes(query) ||
              (ch.en && ch.en.toLowerCase().includes(query)) ||
              (ch.slug && ch.slug.toLowerCase().includes(query)) ||
              topMatches ||
              subMatches;

            if (chMatches) {
              results.push({
                bookSlug,
                bookTitle,
                chapterTitle: ch.title,
                chapterSlug: ch.slug,
                isLive: Boolean(ch.live),
                topicName: top.n,
                subjectName: sub.n,
              });
            }
          });
        });
      });
    };

    searchInTree("india-gk", "भारत सामान्य ज्ञान", INDIA_GK_TREE);
    searchInTree("world-gk", "विश्व सामान्य ज्ञान", WORLD_GK_TREE);

    return results.slice(0, 8); // Top 8 results
  }, [query]);

  // Filtered books
  const filteredBooks = useMemo(() => {
    return BOOKS_CATALOG.filter((book) => {
      // Category filter
      if (activeCategory === "live" && book.badge !== "live") return false;
      if (activeCategory === "national" && book.category !== "national") return false;
      if (activeCategory === "world" && book.category !== "world") return false;
      if (activeCategory === "state" && book.category !== "state") return false;

      // Search query filter
      if (!query) return true;

      const titleMatches =
        book.title.toLowerCase().includes(query) ||
        (book.titleEn && book.titleEn.toLowerCase().includes(query)) ||
        (book.subtitle && book.subtitle.toLowerCase().includes(query));

      const tagMatches = book.examTags && book.examTags.some((tag) => tag.toLowerCase().includes(query));

      const hasMatchingChapter = matchingChapters.some((mc) => mc.bookSlug === book.slug);

      return titleMatches || tagMatches || hasMatchingChapter;
    });
  }, [activeCategory, query, matchingChapters]);

  const handleBookClick = (slug) => {
    if (onSelectBook) {
      onSelectBook(slug);
    }
  };

  const handleChapterClick = (chapterSlug, isLive, bookSlug) => {
    if (isLive && onSelectChapter) {
      onSelectChapter(chapterSlug, 0);
    } else if (onSelectBook) {
      onSelectBook(bookSlug);
    }
  };

  return (
    <div className={styles.bookWrapper} data-theme={theme}>
      {/* Sticky App Header */}
      <GkBookHeader
        title="📚 मेरी डिजिटल पुस्तकें (My Bookshelf)"
        theme={theme}
        onThemeChange={setTheme}
        fontSize={fontSize}
        onFontSizeChange={setFontSize}
      />

      <main className={styles.main}>
        {/* Navigation Breadcrumb */}
        <div className={styles.crumb}>
          <Link href="/">← मुख्य पृष्ठ (Home)</Link>
          <span>›</span>
          <span style={{ fontWeight: 700, color: "var(--tx)" }}>
            मेरी पुस्तकें (Digital Bookshelf)
          </span>
        </div>

        {/* Hero Section */}
        <div className={styles.shelfHero}>
          <span className={styles.shelfHeroTag}>
            📖 डिजिटल पुस्तकालय · Digital Library
          </span>
          <h1 className={styles.shelfHeroTitle}>
            मेरी डिजिटल पुस्तकें (My Books)
          </h1>
          <p className={styles.shelfHeroDesc}>
            अध्याय दर अध्याय संरचित डिजिटल बुक्स — विस्तृत व संक्षिप्त नोट्स, महत्वपूर्ण तथ्य और प्रत्येक अध्याय के अंत में स्व-मूल्यांकन क्विज़।
          </p>

          <div className={styles.shelfStatsRow}>
            <div className={styles.shelfStatsItem}>
              <span>📚</span>
              <span>
                कुल पुस्तकें: <b className={styles.shelfStatsNum}>{BOOKS_CATALOG.length}</b>
              </span>
            </div>
            <div className={styles.shelfStatsItem}>
              <span>⚡</span>
              <span>
                लाइव पुस्तकें: <b className={styles.shelfStatsNum} style={{ color: "var(--ok)" }}>2</b>
              </span>
            </div>
            <div className={styles.shelfStatsItem}>
              <span>📝</span>
              <span>
                कुल अध्याय: <b className={styles.shelfStatsNum}>100+</b>
              </span>
            </div>
            <div className={styles.shelfStatsItem}>
              <span>🎯</span>
              <span>
                स्व-मूल्यांकन: <b className={styles.shelfStatsNum}>हर पृष्ठ पर क्विज़</b>
              </span>
            </div>
          </div>
        </div>

        {/* Prominent Search Bar */}
        <div className={styles.searchBoxWrapper}>
          <span className={styles.searchIcon}>🔍</span>
          <input
            type="search"
            className={styles.shelfSearchInput}
            placeholder="पुस्तक, विषय या अध्याय खोजें (उदा. सिंधु घाटी, सौरमंडल, संविधान, भूगोल)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="पुस्तकें या विषय खोजें"
          />
          {searchQuery && (
            <button
              type="button"
              className={styles.clearSearchBtn}
              onClick={() => setSearchQuery("")}
              aria-label="सर्च हटाएं"
            >
              ✕
            </button>
          )}
        </div>

        {/* Instant Matching Chapters Section (when search query exists) */}
        {query && matchingChapters.length > 0 && (
          <div className={styles.searchMatchesBox}>
            <div className={styles.searchMatchesHeader}>
              <span>⚡</span>
              <span>संबंधित अध्याय ({matchingChapters.length} मिले):</span>
            </div>
            {matchingChapters.map((mc, idx) => (
              <div
                key={idx}
                className={styles.searchMatchRow}
                onClick={() => handleChapterClick(mc.chapterSlug, mc.isLive, mc.bookSlug)}
                role="button"
                tabIndex={0}
              >
                <div>
                  <div style={{ fontWeight: 700, fontSize: "14px" }}>
                    {mc.chapterTitle}
                  </div>
                  <div className={styles.mutedText} style={{ fontSize: "11px", margin: "2px 0 0" }}>
                    {mc.bookTitle} › {mc.topicName} › {mc.subjectName}
                  </div>
                </div>
                <span
                  className={styles.chip}
                  style={{
                    background: mc.isLive ? "var(--ok)" : "var(--bg)",
                    color: mc.isLive ? "#ffffff" : "var(--mut)",
                    fontWeight: 700,
                  }}
                >
                  {mc.isLive ? "पढ़ें ▶" : "सूची देखें"}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Category Filter Bar */}
        <div className={styles.filterBar}>
          <button
            type="button"
            className={`${styles.filterPill} ${activeCategory === "all" ? styles.filterPillActive : ""}`}
            onClick={() => setActiveCategory("all")}
          >
            📚 सभी पुस्तकें ({BOOKS_CATALOG.length})
          </button>
          <button
            type="button"
            className={`${styles.filterPill} ${activeCategory === "live" ? styles.filterPillActive : ""}`}
            onClick={() => setActiveCategory("live")}
          >
            ✓ लाइव उपलब्ध (2)
          </button>
          <button
            type="button"
            className={`${styles.filterPill} ${activeCategory === "national" ? styles.filterPillActive : ""}`}
            onClick={() => setActiveCategory("national")}
          >
            🇮🇳 राष्ट्रीय (India GK)
          </button>
          <button
            type="button"
            className={`${styles.filterPill} ${activeCategory === "world" ? styles.filterPillActive : ""}`}
            onClick={() => setActiveCategory("world")}
          >
            🌍 विश्व (World GK)
          </button>
          <button
            type="button"
            className={`${styles.filterPill} ${activeCategory === "state" ? styles.filterPillActive : ""}`}
            onClick={() => setActiveCategory("state")}
          >
            🏛️ राज्य विशेष (State GK)
          </button>
        </div>

        {/* Bookshelf Grid */}
        {filteredBooks.length > 0 ? (
          <div className={styles.booksGrid}>
            {filteredBooks.map((book) => {
              const isLive = book.badge === "live";

              return (
                <div key={book.id} className={styles.bookCard}>
                  {/* Book Cover Area */}
                  <div className={styles.bookCoverArea}>
                    <span className={styles.bookCategoryTag}>
                      {book.categoryLabel || "सामान्य ज्ञान"}
                    </span>

                    <span
                      className={`${styles.bookBadgeTop} ${
                        isLive ? styles.badgeLive : styles.badgeUpcoming
                      }`}
                    >
                      {isLive ? "✓ " + book.badgeLabel : "⏳ " + book.badgeLabel}
                    </span>

                    <div
                      className={styles.bookCoverWrap}
                      onClick={() => isLive && handleBookClick(book.slug)}
                      style={{ cursor: isLive ? "pointer" : "default" }}
                    >
                      <img
                        src={book.cover}
                        alt={book.title}
                        className={styles.bookCoverImg}
                        loading="eager"
                      />
                    </div>
                  </div>

                  {/* Book Card Body */}
                  <div className={styles.bookCardBody}>
                    <h2 className={styles.bookCardTitle}>{book.title}</h2>
                    <p className={styles.bookCardSubtitle}>{book.subtitle}</p>

                    {/* Exam / Topic Tags */}
                    {book.examTags && book.examTags.length > 0 && (
                      <div className={styles.bookTagsRow}>
                        {book.examTags.map((tag, tagIdx) => (
                          <span key={tagIdx} className={styles.bookTagChip}>
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Stats */}
                    {book.stats && (
                      <div
                        className={styles.mutedText}
                        style={{ fontSize: "12px", marginBottom: "14px" }}
                      >
                        📊 {book.stats.topics} मुख्य विषय · {book.stats.chapters} अध्याय
                        {book.stats.pages ? ` · ${book.stats.pages}+ पृष्ठ` : ""}
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className={styles.bookActionsRow}>
                      {isLive ? (
                        <>
                          <button
                            type="button"
                            className={styles.bookBtnMain}
                            onClick={() => handleBookClick(book.slug)}
                          >
                            <span>📖 अनुक्रमणिका देखें</span>
                          </button>

                          {book.firstChapterSlug && (
                            <button
                              type="button"
                              className={styles.bookBtnSec}
                              onClick={() => {
                                if (onSelectChapter) {
                                  onSelectChapter(book.firstChapterSlug, 0);
                                } else {
                                  handleBookClick(book.slug);
                                }
                              }}
                              title="सीधे पहला अध्याय पढ़ें"
                            >
                              <span>⚡ पढ़ें</span>
                            </button>
                          )}
                        </>
                      ) : (
                        <button type="button" disabled className={styles.bookBtnDisabled}>
                          <span>⏳ {book.badgeLabel} (Coming Soon)</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div
            style={{
              textAlign: "center",
              padding: "48px 16px",
              background: "var(--card)",
              borderRadius: "20px",
              border: "1px solid var(--bd)",
            }}
          >
            <div style={{ fontSize: "40px", marginBottom: "12px" }}>🔍</div>
            <h3 style={{ fontSize: "18px", fontWeight: 700, margin: "0 0 6px" }}>
              कोई पुस्तक या अध्याय नहीं मिला
            </h3>
            <p className={styles.mutedText}>
              "{searchQuery}" के लिए कोई परिणाम नहीं मिला। कृपया दूसरा शब्द खोजें।
            </p>
            <button
              type="button"
              className={styles.iconBtn}
              onClick={() => {
                setSearchQuery("");
                setActiveCategory("all");
              }}
              style={{ marginTop: "12px", padding: "8px 18px" }}
            >
              सभी पुस्तकें देखें
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
