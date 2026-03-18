"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useData } from "@/context/DataContext";
import { motion } from "framer-motion";
import styles from "@/styles/LandingPage.module.css";

const DEFAULT_CHIPS = ["Science", "History", "GK", "Quick 5 Min"];
const TRENDING_CHIP = "Trending Quiz";
const DAILY_CATEGORY_IDS = new Set([
  "65f1a2b3c4d5e6f7a8b9c0d9", // Quiz of the day
  "65f1a2b3c4d5e6f7a8b9c0e1", // Daily current affairs
]);

const estimateTime = (numQuestions) => {
  const seconds = numQuestions * 18; // Avg 18s per question
  const minutes = Math.round(seconds / 60);
  return minutes < 1 ? "< 1 min" : `~${minutes} mins`;
};

export default function LandingPage() {
  const { quizzes, settings, loaded } = useData();
  const [search, setSearch] = useState("");
  const [activeFilters, setActiveFilters] = useState([]);
  const isLoading = !loaded;

  const handleFilterClick = (filter) => {
    setActiveFilters(prev => 
      prev.includes(filter) 
        ? prev.filter(f => f !== filter) 
        : [...prev, filter]
    );
  };

  const chips = useMemo(() => {
    const raw = settings?.homeChips;
    let list = DEFAULT_CHIPS;
    if (typeof raw === "string" && raw.trim()) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          const cleaned = parsed
            .map((s) => (typeof s === "string" ? s.trim() : ""))
            .filter(Boolean);
          if (cleaned.length > 0) list = cleaned;
        }
      } catch {}
    }

    const withoutTrending = list.filter(
      (c) => c.toLowerCase() !== TRENDING_CHIP.toLowerCase()
    );
    return [TRENDING_CHIP, ...withoutTrending];
  }, [settings?.homeChips]);

  const visibleCategories = useMemo(() => {
    let filtered = quizzes.filter((c) => !c.hidden && !c.parentId && !DAILY_CATEGORY_IDS.has(c.id));

    if (search) {
      filtered = filtered.filter((c) => 
        c.topic.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (activeFilters.length > 0) {
      filtered = filtered.filter(c => {
        const catChips = Array.isArray(c.chips) ? c.chips.map((x) => String(x).toLowerCase()) : [];
        return activeFilters.every((f) => {
          const key = String(f || "").toLowerCase().trim();
          if (!key) return true;
          if (key === TRENDING_CHIP.toLowerCase() || key === "trending") return !!c.isTrending;
          if (key === "gk") return c.topic.toLowerCase() === "general knowledge";
          if (key.includes("quick")) return c.questions.length <= 20;
          return (
            catChips.includes(key) ||
            c.topic.toLowerCase().includes(key) ||
            (c.description || "").toLowerCase().includes(key)
          );
        });
      });
    }

    return filtered;
  }, [quizzes, search, activeFilters]);

  return (
    <main className={styles.page}>
      <div className={styles.bgOrbs} aria-hidden="true">
        <div className={`${styles.orb} ${styles.orb1}`} />
        <div className={`${styles.orb} ${styles.orb2}`} />
      </div>

      <div className={styles.searchContainer}>
        <div className={styles.searchBox}>
          <span className={styles.searchIcon}>🔍</span>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search for any topic..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className={styles.filterChips}>
          {chips.map((filter) => (
            <button 
              key={filter}
              className={`${styles.chip} ${activeFilters.includes(filter) ? styles.activeChip : ''}`}
              onClick={() => handleFilterClick(filter)}
            >
              {filter.startsWith("#") ? filter : `#${filter}`}
            </button>
          ))}
        </div>
      </div>

      <h2 className={styles.sectionTitle}>All Categories</h2>
      {isLoading && <div className={styles.loadingHint}>Loading categories…</div>}
      <motion.div 
        className={styles.grid}
        variants={{ 
          hidden: { opacity: 0 },
          show: {
            opacity: 1,
            transition: { staggerChildren: 0.05 }
          }
        }}
        initial="hidden"
        animate="show"
      >
        <motion.div
          key="daily-quiz"
          className={styles.cardWrapper}
          variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
          layout
        >
          <Link href="/daily" className={styles.card}>
            <div className={styles.cardImageContainer}>
              <div className={styles.mediaFallback}>
                <span className={styles.mediaEmoji}>📅</span>
              </div>
            </div>
            <div className={styles.cardContent}>
              <h3 className={styles.cardTitle}>Daily Quiz</h3>
              <p className={styles.cardDesc}>Quiz of the day + Daily current affairs (past & present).</p>
              <div className={styles.cardFooter}>
                <span className={styles.cardInfo}>Daily</span>
                <span className={styles.cardInfo}>Export PDF</span>
              </div>
              <div className={styles.playButton}>▶ Open</div>
            </div>
          </Link>
        </motion.div>

        <motion.div
          key="current-affairs"
          className={styles.cardWrapper}
          variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
          layout
        >
          <Link href="/current-affairs" className={styles.card}>
            <div className={styles.cardImageContainer}>
              <div className={styles.mediaFallback}>
                <span className={styles.mediaEmoji}>🗞️</span>
              </div>
            </div>
            <div className={styles.cardContent}>
              <h3 className={styles.cardTitle}>Current Affairs</h3>
              <p className={styles.cardDesc}>Daily current affairs posts with date & category filters.</p>
              <div className={styles.cardFooter}>
                <span className={styles.cardInfo}>Date-wise</span>
                <span className={styles.cardInfo}>Export PDF</span>
              </div>
              <div className={styles.playButton}>▶ Open</div>
            </div>
          </Link>
        </motion.div>

        {isLoading
          ? Array.from({ length: 9 }).map((_, idx) => (
              <motion.div
                key={`sk-${idx}`}
                className={styles.cardWrapper}
                variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
                layout
              >
                <div className={`${styles.card} ${styles.skeletonCard}`}>
                  <div className={styles.cardImageContainer}>
                    <div className={styles.skeletonMedia} />
                  </div>
                  <div className={styles.cardContent}>
                    <div className={styles.skeletonTitle} />
                    <div className={styles.skeletonLine} />
                    <div className={styles.skeletonLineShort} />
                    <div className={styles.skeletonFooter} />
                    <div className={styles.skeletonButton} />
                  </div>
                </div>
              </motion.div>
            ))
          : visibleCategories.map((cat) => (
              <motion.div
                key={cat.id}
                className={styles.cardWrapper}
                variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
                layout
              >
                <Link href={`/category/${cat.id}`} className={styles.card}>
                  <div className={styles.cardImageContainer}>
                    <div className={styles.mediaFallback}>
                      <span className={styles.mediaEmoji}>{cat.emoji}</span>
                    </div>
                    {cat.image && (
                      <img
                        src={cat.image}
                        alt={cat.topic}
                        className={styles.cardImage}
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    )}
                  </div>
                  <div className={styles.cardContent}>
                    <h3 className={styles.cardTitle}>{cat.topic}</h3>
                    <p className={styles.cardDesc}>{cat.description}</p>
                    <div className={styles.cardFooter}>
                      <span className={styles.cardInfo}>{cat.questions.length} Questions</span>
                      <span className={styles.cardInfo}>{estimateTime(cat.questions.length)}</span>
                    </div>
                    <div className={styles.playButton}>▶ Play Quiz</div>
                  </div>
                </Link>
              </motion.div>
            ))}
      </motion.div>

      {!isLoading && visibleCategories.length === 0 && (
        <p className={styles.empty}>
          {search || activeFilters.length > 0 ? "No categories match your criteria." : "No categories available."}
        </p>
      )}
    </main>
  );
}
