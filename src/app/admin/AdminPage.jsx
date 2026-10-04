"use client";

import { useMemo, useEffect } from "react";
import Link from "next/link";
import { useData } from "@/context/DataContext";
import { useAdmin } from "@/context/AdminContext";
import styles from "@/styles/AdminDashboard.module.css";

export default function AdminDashboard() {
  const { quizzes, loaded, refreshQuizzes } = useData();
  const { adminUser } = useAdmin();
  const allowed = adminUser?.role === "master" || adminUser?.permissions?.dashboard !== false;

  // Auto-refresh categories if empty on initial mount
  useEffect(() => {
    if (quizzes.length === 0 && refreshQuizzes) {
      refreshQuizzes();
    }
  }, [quizzes.length, refreshQuizzes]);

  const totalCategories = (quizzes || []).length;

  // Calculate high-level platform stats directly & reliably
  const stats = useMemo(() => {
    let totalQuestions = 0;
    const byDifficulty = { easy: 0, medium: 0, hard: 0 };
    let govtCount = 0;
    let schoolCount = 0;

    (quizzes || []).forEach((c) => {
      if (!c?.parentId) {
        totalQuestions += (c?.questionCount || 0);
      }
      if (c?.difficultyStats) {
        byDifficulty.easy += (c.difficultyStats.easy || 0);
        byDifficulty.medium += (c.difficultyStats.medium || 0);
        byDifficulty.hard += (c.difficultyStats.hard || 0);
      }
      const cls = c?.categoryClass || "";
      if (cls.includes("govt-exam")) govtCount++;
      if (cls.includes("school") || cls.includes("class-")) schoolCount++;
    });

    return { totalQuestions, totalCategories, byDifficulty, govtCount, schoolCount };
  }, [quizzes, totalCategories]);

  // Calculate Category Health Metrics
  const healthStats = useMemo(() => {
    let empty = 0;
    let progress = 0;
    let ready = 0;

    (quizzes || []).forEach((c) => {
      const count = c?.questionCount || 0;
      if (count === 0) empty++;
      else if (count < 20) progress++;
      else ready++;
    });

    const total = totalCategories || 1;
    return {
      empty,
      progress,
      ready,
      readyPct: totalCategories > 0 ? Math.round((ready / total) * 100) : 0,
      progressPct: totalCategories > 0 ? Math.round((progress / total) * 100) : 0,
      emptyPct: totalCategories > 0 ? Math.round((empty / total) * 100) : 0,
    };
  }, [quizzes, totalCategories]);

  // Calculate Difficulty Percentages
  const diffPct = useMemo(() => {
    const total = stats.totalQuestions || 1;
    const easy = stats.byDifficulty?.easy || 0;
    const medium = stats.byDifficulty?.medium || 0;
    const hard = stats.byDifficulty?.hard || 0;

    return {
      easyPct: stats.totalQuestions > 0 ? Math.round((easy / total) * 100) : 0,
      mediumPct: stats.totalQuestions > 0 ? Math.round((medium / total) * 100) : 0,
      hardPct: stats.totalQuestions > 0 ? Math.round((hard / total) * 100) : 0,
      easy,
      medium,
      hard,
    };
  }, [stats]);

  // Priority Focus: Top categories needing content (<20 questions)
  const actionNeededCats = useMemo(() => {
    return (quizzes || [])
      .filter((c) => (c?.questionCount || 0) < 20)
      .sort((a, b) => (a?.questionCount || 0) - (b?.questionCount || 0))
      .slice(0, 6);
  }, [quizzes]);

  if (!allowed) {
    return (
      <div className={styles.page}>
        <p>Access denied.</p>
      </div>
    );
  }

  if (!loaded && totalCategories === 0) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
        <p>Loading dashboard metrics...</p>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      
      {/* 1. Executive Header */}
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
            <span>📁 Category Manager</span>
          </Link>
        </div>
      </div>

      {/* 2. Balanced 4-Column Executive KPI Cards */}
      <div className={styles.kpiGrid}>
        {/* KPI 1: Total Question Bank */}
        <Link href="/admin/questions" className={styles.kpiCard}>
          <div className={styles.kpiTop}>
            <div className={`${styles.kpiIconBox} ${styles.iconPurple}`}>❓</div>
            <span className={styles.kpiBadge}>Active Bank</span>
          </div>
          <span className={styles.kpiValue}>{stats.totalQuestions.toLocaleString()}</span>
          <span className={styles.kpiTitle}>Total Questions</span>
          <span className={styles.kpiSubtitle}>Across all subjects & sets</span>
        </Link>

        {/* KPI 2: Quiz Categories */}
        <Link href="/admin/categories" className={styles.kpiCard}>
          <div className={styles.kpiTop}>
            <div className={`${styles.kpiIconBox} ${styles.iconIndigo}`}>📁</div>
            <span className={styles.kpiBadge}>Catalog</span>
          </div>
          <span className={styles.kpiValue}>{totalCategories}</span>
          <span className={styles.kpiTitle}>Quiz Categories</span>
          <span className={styles.kpiSubtitle}>Main topics & sub-categories</span>
        </Link>

        {/* KPI 3: Learning & Exam Verticals */}
        <Link href="/admin/govt-exams" className={styles.kpiCard}>
          <div className={styles.kpiTop}>
            <div className={`${styles.kpiIconBox} ${styles.iconAmber}`}>🏛️</div>
            <span className={styles.kpiBadge}>Verticals</span>
          </div>
          <span className={styles.kpiValue}>{stats.govtCount + stats.schoolCount || 6}</span>
          <span className={styles.kpiTitle}>Exam & Class Hubs</span>
          <span className={styles.kpiSubtitle}>Govt Exams, Classes 1-12 & Guides</span>
        </Link>

        {/* KPI 4: Content Health Index */}
        <Link href="/admin/categories" className={styles.kpiCard}>
          <div className={styles.kpiTop}>
            <div className={`${styles.kpiIconBox} ${styles.iconEmerald}`}>🟢</div>
            <span className={`${styles.kpiBadge} ${styles.badgeReady}`}>{healthStats.readyPct}% Ready</span>
          </div>
          <span className={styles.kpiValue}>{healthStats.ready}</span>
          <span className={styles.kpiTitle}>Sets Ready (20+ Qs)</span>
          <span className={styles.kpiSubtitle}>{healthStats.empty} categories need content</span>
        </Link>
      </div>

      {/* 3. Five Operational Domain Hubs */}
      <div className={styles.hubsSection}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>
            <span>🗂️ Operational Domain Hubs</span>
          </h2>
        </div>
        <div className={styles.hubsGrid}>
          <Link href="/admin/categories" className={styles.hubCard}>
            <div className={styles.hubCardHeader}>
              <span className={styles.hubCardIcon}>📚</span>
              <span className={styles.hubCardCount}>7 tools</span>
            </div>
            <span className={styles.hubCardTitle}>Content & Questions</span>
            <span className={styles.hubCardSubtitle}>Categories, Sets, Q-Bank, Bulk Upload</span>
          </Link>

          <Link href="/admin/govt-exams" className={styles.hubCard}>
            <div className={styles.hubCardHeader}>
              <span className={styles.hubCardIcon}>🎓</span>
              <span className={styles.hubCardCount}>6 tools</span>
            </div>
            <span className={styles.hubCardTitle}>Exams & Education</span>
            <span className={styles.hubCardSubtitle}>Govt Exams, Classes 1–12, Mock Tests</span>
          </Link>

          <Link href="/admin/daily" className={styles.hubCard}>
            <div className={styles.hubCardHeader}>
              <span className={styles.hubCardIcon}>⚡</span>
              <span className={styles.hubCardCount}>7 tools</span>
            </div>
            <span className={styles.hubCardTitle}>Daily & Engagement</span>
            <span className={styles.hubCardSubtitle}>Daily Quizzes, Hot Quizzes, Forum</span>
          </Link>

          <Link href="/admin/monetization" className={styles.hubCard}>
            <div className={styles.hubCardHeader}>
              <span className={styles.hubCardIcon}>💰</span>
              <span className={styles.hubCardCount}>3 tools</span>
            </div>
            <span className={styles.hubCardTitle}>Monetization & Growth</span>
            <span className={styles.hubCardSubtitle}>Ads, Rewards, Coins, Notifications</span>
          </Link>

          <Link href="/admin/pending" className={styles.hubCard}>
            <div className={styles.hubCardHeader}>
              <span className={styles.hubCardIcon}>⚙️</span>
              <span className={styles.hubCardCount}>6 tools</span>
            </div>
            <span className={styles.hubCardTitle}>System & Operations</span>
            <span className={styles.hubCardSubtitle}>Approval Queue, Accounts, Logs, Settings</span>
          </Link>
        </div>
      </div>

      {/* 4. Analytics: Difficulty Balance & Readiness Index */}
      <div className={styles.analyticsRow}>
        
        {/* Difficulty Distribution Meter */}
        <div className={styles.analyticsCard}>
          <div className={styles.analyticsHeader}>
            <h3 className={styles.analyticsTitle}>
              <span>🎯 Difficulty Balance Bar</span>
            </h3>
            <span className={styles.sectionBadge}>{stats.totalQuestions.toLocaleString()} Questions</span>
          </div>

          <div className={styles.segmentedBar}>
            <div className={styles.barSegmentEasy} style={{ width: `${diffPct.easyPct}%` }} title={`Easy: ${diffPct.easyPct}%`}></div>
            <div className={styles.barSegmentMedium} style={{ width: `${diffPct.mediumPct}%` }} title={`Medium: ${diffPct.mediumPct}%`}></div>
            <div className={styles.barSegmentHard} style={{ width: `${diffPct.hardPct}%` }} title={`Hard: ${diffPct.hardPct}%`}></div>
          </div>

          <div className={styles.analyticsLegend}>
            <div className={styles.legendItem}>
              <span className={styles.legendDot} style={{ background: '#10b981' }}></span>
              <span>Easy: {diffPct.easy.toLocaleString()} ({diffPct.easyPct}%)</span>
            </div>
            <div className={styles.legendItem}>
              <span className={styles.legendDot} style={{ background: '#f59e0b' }}></span>
              <span>Medium: {diffPct.medium.toLocaleString()} ({diffPct.mediumPct}%)</span>
            </div>
            <div className={styles.legendItem}>
              <span className={styles.legendDot} style={{ background: '#ef4444' }}></span>
              <span>Hard: {diffPct.hard.toLocaleString()} ({diffPct.hardPct}%)</span>
            </div>
          </div>
        </div>

        {/* Category Health & Content Readiness Meter */}
        <div className={styles.analyticsCard}>
          <div className={styles.analyticsHeader}>
            <h3 className={styles.analyticsTitle}>
              <span>🏥 Content Readiness Index</span>
            </h3>
            <span className={styles.sectionBadge}>{healthStats.readyPct}% Complete</span>
          </div>

          <div className={styles.segmentedBar}>
            <div className={styles.barSegmentReady} style={{ width: `${healthStats.readyPct}%` }} title={`Ready: ${healthStats.readyPct}%`}></div>
            <div className={styles.barSegmentWarning} style={{ width: `${healthStats.progressPct}%` }} title={`In Progress: ${healthStats.progressPct}%`}></div>
            <div className={styles.barSegmentEmpty} style={{ width: `${healthStats.emptyPct}%` }} title={`Needs Content: ${healthStats.emptyPct}%`}></div>
          </div>

          <div className={styles.analyticsLegend}>
            <div className={styles.legendItem}>
              <span className={styles.legendDot} style={{ background: '#6366f1' }}></span>
              <span>🟢 Ready (20+ Qs): {healthStats.ready}</span>
            </div>
            <div className={styles.legendItem}>
              <span className={styles.legendDot} style={{ background: '#f59e0b' }}></span>
              <span>🟡 In Progress: {healthStats.progress}</span>
            </div>
            <div className={styles.legendItem}>
              <span className={styles.legendDot} style={{ background: '#f43f5e' }}></span>
              <span>🔴 Needs Content: {healthStats.empty}</span>
            </div>
          </div>
        </div>

      </div>

      {/* 5. Priority Action: Focused List of Categories Needing Content */}
      <div className={styles.actionCard}>
        <div className={styles.actionHeader}>
          <div className={styles.actionHeaderLeft}>
            <h2 className={styles.actionHeaderTitle}>
              <span>🚨 Priority Action: Categories Needing Content</span>
            </h2>
            <p className={styles.actionHeaderDesc}>
              Topics with 0 or fewer than 20 questions requiring content additions
            </p>
          </div>
          <span className={styles.actionBadge}>
            {healthStats.empty + healthStats.progress} Topics Pending
          </span>
        </div>

        {actionNeededCats.length > 0 ? (
          <div className={styles.actionList}>
            {actionNeededCats.map((cat) => {
              const count = cat.questionCount || 0;
              const isEmpty = count === 0;

              return (
                <div key={cat.id} className={styles.actionRow}>
                  <div className={styles.actionRowInfo}>
                    <span className={styles.actionRowEmoji}>{cat.emoji || "📁"}</span>
                    <div className={styles.actionRowNameGroup}>
                      <span className={styles.actionRowName}>{cat.topic}</span>
                      <span className={styles.actionRowSub}>
                        {cat.categoryClass || "General Topic"} • {cat.originalLang === "hi" ? "Hindi" : "English"}
                      </span>
                    </div>
                  </div>

                  <div className={styles.actionRowRight}>
                    <span className={isEmpty ? styles.countPillEmpty : styles.countPillProgress}>
                      {count} Questions {isEmpty ? "(Empty)" : "(Incomplete Set)"}
                    </span>
                    <Link
                      href={`/admin/questions?category=${cat.id}`}
                      className={styles.actionRowAddBtn}
                    >
                      <span>+ Add Questions</span>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className={styles.allGoodBox}>
            <span>🎉 Excellent work! All {totalCategories} categories have at least 20 questions loaded.</span>
          </div>
        )}

        <div className={styles.actionFooter}>
          <Link href="/admin/categories" className={styles.actionFooterLink}>
            <span>Manage All {totalCategories} Categories in Full Category Manager →</span>
          </Link>
        </div>
      </div>

    </div>
  );
}
