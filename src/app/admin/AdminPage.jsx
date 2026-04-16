"use client";

import { useState, useMemo } from "react";
import { useData } from "@/context/DataContext";
import { useAdmin } from "@/context/AdminContext";
import styles from "@/styles/AdminDashboard.module.css";

export default function AdminDashboard() {
  const { quizzes, getStats } = useData();
  const { adminUser } = useAdmin();
  const allowed = adminUser?.role === "master" || adminUser?.permissions?.dashboard !== false;
  const stats = getStats();
  const [search, setSearch] = useState("");

  const filteredCats = useMemo(() => {
    if (!search) return quizzes;
    return quizzes.filter((c) =>
      c.topic.toLowerCase().includes(search.toLowerCase())
    );
  }, [quizzes, search]);

  if (!allowed) {
    return (
      <div className={styles.page}>
        <p>Access denied.</p>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Dashboard</h1>
      <p className={styles.subtitle}>Overview of your quiz content</p>

      {/* Stat Cards */}
      <div className={styles.statsGrid}>
        <div className={`${styles.statCard} glass-card`}>
          <span className={styles.statIcon}>📁</span>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{stats.totalCategories}</span>
            <span className={styles.statLabel}>Categories</span>
          </div>
        </div>
        <div className={`${styles.statCard} glass-card`}>
          <span className={styles.statIcon}>❓</span>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{stats.totalQuestions}</span>
            <span className={styles.statLabel}>Total Questions</span>
          </div>
        </div>
        <div className={`${styles.statCard} glass-card`}>
          <span className={styles.statIcon}>🟢</span>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{stats.byDifficulty.easy}</span>
            <span className={styles.statLabel}>Easy</span>
          </div>
        </div>
        <div className={`${styles.statCard} glass-card`}>
          <span className={styles.statIcon}>🟡</span>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{stats.byDifficulty.medium}</span>
            <span className={styles.statLabel}>Medium</span>
          </div>
        </div>
        <div className={`${styles.statCard} glass-card`}>
          <span className={styles.statIcon}>🔴</span>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{stats.byDifficulty.hard}</span>
            <span className={styles.statLabel}>Hard</span>
          </div>
        </div>
      </div>

      {/* Category Search + Grid */}
      <div className={styles.catHeader}>
        <h2 className={styles.sectionTitle}>Categories</h2>
        <input
          className={styles.searchInput}
          placeholder="Search categories..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className={styles.catGrid}>
        {filteredCats.map((cat) => (
          <div key={cat.id} className={`${styles.catCard} glass-card`}>
            <div className={styles.catCardImage}>
              {cat.image ? (
                <img src={cat.image} alt="" className={styles.catCardImg} />
              ) : (
                <span className={styles.catCardEmoji}>{cat.emoji}</span>
              )}
            </div>
            <div className={styles.catCardBody}>
              <span className={styles.catCardName}>{cat.topic}</span>
              <span className={styles.catCardCount}>
                {cat.questionCount || 0} questions
              </span>
            </div>
          </div>
        ))}
        {filteredCats.length === 0 && (
          <p className={styles.empty}>No categories match your search.</p>
        )}
      </div>
    </div>
  );
}
