"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useData } from "@/context/DataContext";
import { useAdmin } from "@/context/AdminContext";
import styles from "@/styles/AdminDashboard.module.css";

export default function AdminDashboard() {
  const { quizzes, getStats } = useData();
  const { adminUser } = useAdmin();
  const allowed = adminUser?.role === "master" || adminUser?.permissions?.dashboard !== false;
  const stats = getStats();

  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("all"); // "all", "empty", "progress", "ready"

  // Calculate Category Health Metrics
  const healthStats = useMemo(() => {
    let empty = 0;
    let progress = 0;
    let ready = 0;

    quizzes.forEach((c) => {
      const count = c.questionCount || 0;
      if (count === 0) empty++;
      else if (count < 20) progress++;
      else ready++;
    });

    const total = quizzes.length || 1;
    return {
      empty,
      progress,
      ready,
      readyPct: Math.round((ready / total) * 100),
      progressPct: Math.round((progress / total) * 100),
      emptyPct: Math.round((empty / total) * 100),
    };
  }, [quizzes]);

  // Calculate Difficulty Percentage
  const diffPct = useMemo(() => {
    const total = stats.totalQuestions || 1;
    const easy = stats.byDifficulty?.easy || 0;
    const medium = stats.byDifficulty?.medium || 0;
    const hard = stats.byDifficulty?.hard || 0;

    return {
      easyPct: Math.round((easy / total) * 100),
      mediumPct: Math.round((medium / total) * 100),
      hardPct: Math.round((hard / total) * 100),
      easy,
      medium,
      hard,
    };
  }, [stats]);

  // Filter Categories by Tab + Search
  const filteredCats = useMemo(() => {
    return quizzes.filter((c) => {
      const matchesSearch = !search || c.topic.toLowerCase().includes(search.toLowerCase());
      const count = c.questionCount || 0;

      if (!matchesSearch) return false;
      if (activeTab === "empty") return count === 0;
      if (activeTab === "progress") return count > 0 && count < 20;
      if (activeTab === "ready") return count >= 20;
      return true;
    });
  }, [quizzes, search, activeTab]);

  if (!allowed) {
    return (
      <div className={styles.page}>
        <p>Access denied.</p>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      
      {/* Executive Command Header */}
      <div className={styles.headerRow}>
        <div className={styles.headerLeft}>
          <div className={styles.headerBadge}>
            <span className={styles.statusDot}></span>
            <span>Platform Operational • Live Sync</span>
          </div>
          <h1 className={styles.title}>EdTech Control Center</h1>
          <p className={styles.subtitle}>
            Overview of question bank, learning verticals & content readiness
          </p>
        </div>

        {/* Quick Action Productivity Group */}
        <div className={styles.quickActionsGroup}>
          <Link href="/admin/questions" className={styles.actionBtnPrimary}>
            <span>⚡ Quick Add Question</span>
          </Link>
          <Link href="/admin/upload" className={styles.actionBtnSecondary}>
            <span>📤 Bulk Import</span>
          </Link>
          <Link href="/admin/categories" className={styles.actionBtnSecondary}>
            <span>📁 New Category</span>
          </Link>
        </div>
      </div>

      {/* KPI Overview Grid */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={`${styles.statIconBox} ${styles.iconIndigo}`}>📁</div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{stats.totalCategories}</span>
            <span className={styles.statLabel}>Quiz Categories</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={`${styles.statIconBox} ${styles.iconPurple}`}>❓</div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{stats.totalQuestions.toLocaleString()}</span>
            <span className={styles.statLabel}>Total Questions</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={`${styles.statIconBox} ${styles.iconEmerald}`}>🟢</div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{diffPct.easy.toLocaleString()}</span>
            <span className={styles.statLabel}>Easy Questions ({diffPct.easyPct}%)</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={`${styles.statIconBox} ${styles.iconAmber}`}>🟡</div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{diffPct.medium.toLocaleString()}</span>
            <span className={styles.statLabel}>Medium Questions ({diffPct.mediumPct}%)</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={`${styles.statIconBox} ${styles.iconRose}`}>🔴</div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{diffPct.hard.toLocaleString()}</span>
            <span className={styles.statLabel}>Hard Questions ({diffPct.hardPct}%)</span>
          </div>
        </div>
      </div>

      {/* Content Analytics & Readiness Row */}
      <div className={styles.analyticsRow}>
        
        {/* Difficulty Distribution Meter */}
        <div className={styles.analyticsCard}>
          <div className={styles.analyticsHeader}>
            <h3 className={styles.analyticsTitle}>
              <span>🎯 Difficulty Balance Bar</span>
            </h3>
            <span className={styles.sectionBadge}>{stats.totalQuestions} Questions</span>
          </div>

          <div className={styles.segmentedBar}>
            <div className={styles.barSegmentEasy} style={{ width: `${diffPct.easyPct}%` }} title={`Easy: ${diffPct.easyPct}%`}></div>
            <div className={styles.barSegmentMedium} style={{ width: `${diffPct.mediumPct}%` }} title={`Medium: ${diffPct.mediumPct}%`}></div>
            <div className={styles.barSegmentHard} style={{ width: `${diffPct.hardPct}%` }} title={`Hard: ${diffPct.hardPct}%`}></div>
          </div>

          <div className={styles.analyticsLegend}>
            <div className={styles.legendItem}>
              <span className={styles.legendDot} style={{ background: '#10b981' }}></span>
              <span>Easy ({diffPct.easyPct}%)</span>
            </div>
            <div className={styles.legendItem}>
              <span className={styles.legendDot} style={{ background: '#f59e0b' }}></span>
              <span>Medium ({diffPct.mediumPct}%)</span>
            </div>
            <div className={styles.legendItem}>
              <span className={styles.legendDot} style={{ background: '#ef4444' }}></span>
              <span>Hard ({diffPct.hardPct}%)</span>
            </div>
          </div>
        </div>

        {/* Category Health & Content Readiness Meter */}
        <div className={styles.analyticsCard}>
          <div className={styles.analyticsHeader}>
            <h3 className={styles.analyticsTitle}>
              <span>🏥 Content Readiness Index</span>
            </h3>
            <span className={styles.sectionBadge}>{healthStats.readyPct}% Ready</span>
          </div>

          <div className={styles.segmentedBar}>
            <div className={styles.barSegmentReady} style={{ width: `${healthStats.readyPct}%` }} title={`Ready: ${healthStats.readyPct}%`}></div>
            <div className={styles.barSegmentWarning} style={{ width: `${healthStats.progressPct}%` }} title={`In Progress: ${healthStats.progressPct}%`}></div>
            <div className={styles.barSegmentEmpty} style={{ width: `${healthStats.emptyPct}%` }} title={`Empty: ${healthStats.emptyPct}%`}></div>
          </div>

          <div className={styles.analyticsLegend}>
            <div className={styles.legendItem}>
              <span className={styles.legendDot} style={{ background: '#6366f1' }}></span>
              <span>🟢 Ready 20+ Qs ({healthStats.ready})</span>
            </div>
            <div className={styles.legendItem}>
              <span className={styles.legendDot} style={{ background: '#f59e0b' }}></span>
              <span>🟡 In Progress ({healthStats.progress})</span>
            </div>
            <div className={styles.legendItem}>
              <span className={styles.legendDot} style={{ background: '#f43f5e' }}></span>
              <span>🔴 Needs Content ({healthStats.empty})</span>
            </div>
          </div>
        </div>

      </div>

      {/* Control Center & Category Health Matrix */}
      <div className={styles.controlCenter}>
        
        <div className={styles.catHeader}>
          <div className={styles.sectionTitleGroup}>
            <h2 className={styles.sectionTitle}>Category Operations</h2>
            <span className={styles.sectionBadge}>{filteredCats.length} Categories</span>
          </div>

          <div className={styles.filterGroup}>
            {/* Filter Tabs */}
            <div className={styles.tabsContainer}>
              <button
                className={`${styles.tabBtn} ${activeTab === "all" ? styles.tabBtnActive : ""}`}
                onClick={() => setActiveTab("all")}
              >
                All ({quizzes.length})
              </button>

              <button
                className={`${styles.tabBtn} ${activeTab === "empty" ? styles.tabBtnActive : ""}`}
                onClick={() => setActiveTab("empty")}
              >
                🔴 Empty ({healthStats.empty})
              </button>

              <button
                className={`${styles.tabBtn} ${activeTab === "progress" ? styles.tabBtnActive : ""}`}
                onClick={() => setActiveTab("progress")}
              >
                🟡 In Progress ({healthStats.progress})
              </button>

              <button
                className={`${styles.tabBtn} ${activeTab === "ready" ? styles.tabBtnActive : ""}`}
                onClick={() => setActiveTab("ready")}
              >
                🟢 Ready ({healthStats.ready})
              </button>
            </div>

            {/* Search Input */}
            <input
              className={styles.searchInput}
              placeholder="Search category title..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Category Cards Grid */}
        <div className={styles.catGrid}>
          {filteredCats.map((cat) => {
            const count = cat.questionCount || 0;
            const sets = Math.ceil(count / 20);

            let statusLabel = "READY";
            let pillClass = styles.pillReady;
            if (count === 0) {
              statusLabel = "NEEDS CONTENT";
              pillClass = styles.pillEmpty;
            } else if (count < 20) {
              statusLabel = "IN PROGRESS";
              pillClass = styles.pillWarning;
            }

            return (
              <div key={cat.id} className={styles.catCard}>
                <div className={styles.catCardHeader}>
                  {cat.image ? (
                    <img src={cat.image} alt="" className={styles.catCardImg} />
                  ) : (
                    <span className={styles.catCardEmoji}>{cat.emoji || "📁"}</span>
                  )}
                  <span className={`${styles.statusPill} ${pillClass}`}>{statusLabel}</span>
                </div>

                <div className={styles.catCardBody}>
                  <span className={styles.catCardName}>{cat.topic}</span>
                  <div className={styles.catCardMeta}>
                    <span>{count} Questions</span>
                    <span>{sets} {sets === 1 ? 'Set' : 'Sets'}</span>
                  </div>
                </div>

                <div className={styles.catCardFooter}>
                  <Link href={`/admin/questions?category=${cat.id}`} className={styles.addQBtn}>
                    <span>+ Add Qs</span>
                  </Link>
                  <Link href={`/admin/categories`} className={styles.manageBtn}>
                    <span>Manage</span>
                  </Link>
                </div>
              </div>
            );
          })}

          {filteredCats.length === 0 && (
            <div className={styles.emptyState}>
              <p>No categories found matching your selected filter or search query.</p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
