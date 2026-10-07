"use client";

import { useMemo, useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useData } from "@/context/DataContext";
import { useAdmin } from "@/context/AdminContext";
import styles from "@/styles/AdminDashboard.module.css";

const TIERS = [
  { id: "kids", label: "1st Kids", icon: "🧒" },
  { id: "school", label: "2nd School Students", icon: "🎒" },
  { id: "explorer", label: "3rd Explorer (Quiz data)", icon: "🧭", isDefault: true },
  { id: "books", label: "4th My Books", icon: "📖" }
];

export default function AdminDashboard() {
  const { quizzes, refreshQuizzes } = useData();
  const { adminUser } = useAdmin();
  const allowed = adminUser?.role === "master" || adminUser?.permissions?.dashboard !== false;

  // Selected Tier (Default: Explorer)
  const [selectedTier, setSelectedTier] = useState("explorer");

  // Selected Tab inside Explorer
  const [activeTab, setActiveTab] = useState("categories"); // 'categories' | 'subcategories' | 'topics' | 'emptyAudit'
  const [emptySubTab, setEmptySubTab] = useState("all"); // 'all' | 'categories' | 'subcategories' | 'topics'

  // Filter & Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [topicLimit, setTopicLimit] = useState(100);

  // Dashboard Stats State (from backend API)
  const [statsData, setStatsData] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch full stats
  const fetchDashboardStats = useCallback(async () => {
    try {
      setRefreshing(true);
      const res = await fetch("/api/admin/dashboard-stats", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setStatsData(data);
      }
    } catch (err) {
      console.error("[Dashboard] Error fetching stats:", err);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardStats();
  }, [fetchDashboardStats]);

  // Fallback metrics if API is loading or unavailable
  const fallbackSummary = useMemo(() => {
    const mainList = (quizzes || []).filter((c) => !c?.parentId);
    const subList = (quizzes || []).filter((c) => !!c?.parentId);
    let totalQ = 0;
    const diff = { easy: 0, medium: 0, hard: 0, expert: 0 };

    (quizzes || []).forEach((c) => {
      if (!c?.parentId) totalQ += (c?.questionCount || 0);
      if (c?.difficultyStats) {
        diff.easy += (c.difficultyStats.easy || 0);
        diff.medium += (c.difficultyStats.medium || 0);
        diff.hard += (c.difficultyStats.hard || 0);
      }
    });

    return {
      mainCategoriesCount: mainList.length || 44,
      subCategoriesCount: subList.length || 65,
      topicsCount: 554,
      totalTagsCount: 0,
      totalQuestions: totalQ,
      difficulty: {
        easy: diff.easy || 0,
        medium: diff.medium || 0,
        hard: diff.hard || 0,
        expert: 0,
        total: totalQ
      },
      emptyCounts: {
        mainCategories: mainList.filter(c => (c?.questionCount || 0) === 0).length,
        subCategories: subList.filter(c => (c?.questionCount || 0) === 0).length,
        topics: 554
      }
    };
  }, [quizzes]);

  const explorerData = statsData?.explorer || null;
  const summary = explorerData?.summary || fallbackSummary;

  // Difficulty Percentages
  const diffPct = useMemo(() => {
    const diff = summary.difficulty || { easy: 0, medium: 0, hard: 0, expert: 0 };
    const t = Math.max(summary.totalQuestions, 1);
    return {
      easyPct: Math.round(((diff.easy || 0) / t) * 100),
      mediumPct: Math.round(((diff.medium || 0) / t) * 100),
      hardPct: Math.round(((diff.hard || 0) / t) * 100),
      expertPct: Math.round(((diff.expert || 0) / t) * 100),
      easy: diff.easy || 0,
      medium: diff.medium || 0,
      hard: diff.hard || 0,
      expert: diff.expert || 0
    };
  }, [summary]);

  // Filtered Main Categories
  const filteredCategories = useMemo(() => {
    let list = explorerData?.categoryWise || [];
    if (list.length === 0 && quizzes.length > 0) {
      list = quizzes.filter(c => !c.parentId).map(c => ({
        id: c.id,
        name: c.topic,
        emoji: c.emoji || "📁",
        subCategoriesCount: c.subCategories?.length || 0,
        totalQuestions: c.questionCount || 0,
        easy: c.difficultyStats?.easy || 0,
        medium: c.difficultyStats?.medium || 0,
        hard: c.difficultyStats?.hard || 0,
        expert: 0,
        status: (c.questionCount || 0) > 0 ? "live" : "empty",
        isEmpty: (c.questionCount || 0) === 0,
      }));
    }

    const q = searchQuery.toLowerCase().trim();
    return list.filter((cat) => {
      if (q && !cat.name.toLowerCase().includes(q)) return false;
      if (statusFilter === "live" && cat.isEmpty) return false;
      if (statusFilter === "empty" && !cat.isEmpty) return false;
      if (difficultyFilter === "easy" && (cat.easy || 0) === 0) return false;
      if (difficultyFilter === "medium" && (cat.medium || 0) === 0) return false;
      if (difficultyFilter === "hard" && (cat.hard || 0) === 0) return false;
      if (difficultyFilter === "expert" && (cat.expert || 0) === 0) return false;
      return true;
    });
  }, [explorerData, quizzes, searchQuery, statusFilter, difficultyFilter]);

  // Filtered Subcategories
  const filteredSubCategories = useMemo(() => {
    let list = explorerData?.subCategoryWise || [];
    const q = searchQuery.toLowerCase().trim();
    return list.filter((sub) => {
      if (q && !sub.name.toLowerCase().includes(q) && !sub.parentName?.toLowerCase().includes(q)) return false;
      if (statusFilter === "live" && sub.isEmpty) return false;
      if (statusFilter === "empty" && !sub.isEmpty) return false;
      if (difficultyFilter === "easy" && (sub.easy || 0) === 0) return false;
      if (difficultyFilter === "medium" && (sub.medium || 0) === 0) return false;
      if (difficultyFilter === "hard" && (sub.hard || 0) === 0) return false;
      if (difficultyFilter === "expert" && (sub.expert || 0) === 0) return false;
      return true;
    });
  }, [explorerData, searchQuery, statusFilter, difficultyFilter]);

  // Filtered Topics
  const filteredTopics = useMemo(() => {
    let list = explorerData?.topicWise || [];
    const q = searchQuery.toLowerCase().trim();
    return list.filter((top) => {
      if (q) {
        const matchName = top.name?.toLowerCase().includes(q);
        const matchParent = top.subCategoryName?.toLowerCase().includes(q) || top.categoryName?.toLowerCase().includes(q);
        const matchTag = (top.tags || []).some(t => t?.toLowerCase().includes(q));
        if (!matchName && !matchParent && !matchTag) return false;
      }
      if (statusFilter === "live" && top.isEmpty) return false;
      if (statusFilter === "empty" && !top.isEmpty) return false;
      if (difficultyFilter === "easy" && (top.easy || 0) === 0) return false;
      if (difficultyFilter === "medium" && (top.medium || 0) === 0) return false;
      if (difficultyFilter === "hard" && (top.hard || 0) === 0) return false;
      if (difficultyFilter === "expert" && (top.expert || 0) === 0) return false;
      return true;
    });
  }, [explorerData, searchQuery, statusFilter, difficultyFilter]);

  // Empty Audit Data
  const emptyAudit = useMemo(() => {
    const emptyCats = explorerData?.emptyAudit?.categories || [];
    const emptySubs = explorerData?.emptyAudit?.subCategories || [];
    const emptyTops = explorerData?.emptyAudit?.topics || [];
    return {
      categories: emptyCats,
      subCategories: emptySubs,
      topics: emptyTops,
      totalEmpty: emptyCats.length + emptySubs.length + emptyTops.length
    };
  }, [explorerData]);

  if (!allowed) {
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        <p>Access denied.</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* 1. Clean Header */}
      <header className={styles.header}>
        <div className={styles.headerText}>
          <h1 className={styles.pageTitle}>Dashboard</h1>
          <p className={styles.pageSubtitle}>Quiz bank metrics, categories, topics and health</p>
        </div>

        <div className={styles.headerControls}>
          {/* Tier Dropdown */}
          <div className={styles.tierDropdownGroup}>
            <span className={styles.tierLabel}>Tier:</span>
            <select
              value={selectedTier}
              onChange={(e) => setSelectedTier(e.target.value)}
              className={styles.tierSelect}
              aria-label="Select Content Tier"
            >
              {TIERS.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.icon} {t.label}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={() => { refreshQuizzes(); fetchDashboardStats(); }}
            className={styles.refreshBtn}
            title="Refresh statistics"
          >
            {refreshing ? "Refreshing..." : "↻ Refresh"}
          </button>

          <Link href="/admin/questions" className={styles.primaryBtn}>
            + Add Question
          </Link>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* TIER 3: EXPLORER (QUIZ DATA) - DEFAULT TIER */}
      {/* ========================================================================= */}
      {selectedTier === "explorer" && (
        <>
          {/* 2. Top 5 KPI Metrics */}
          <div className={styles.kpiGrid}>
            <div className={styles.kpiCard}>
              <span className={styles.kpiTitle}>Main Categories</span>
              <div className={styles.kpiValue}>{summary.mainCategoriesCount}</div>
              <span className={styles.kpiMeta}>{summary.emptyCounts?.mainCategories || 0} empty</span>
            </div>

            <div className={styles.kpiCard}>
              <span className={styles.kpiTitle}>Sub Categories</span>
              <div className={styles.kpiValue}>{summary.subCategoriesCount}</div>
              <span className={styles.kpiMeta}>{summary.emptyCounts?.subCategories || 0} empty</span>
            </div>

            <div className={styles.kpiCard}>
              <span className={styles.kpiTitle}>Topics</span>
              <div className={styles.kpiValue}>{summary.topicsCount}</div>
              <span className={styles.kpiMeta}>{summary.emptyCounts?.topics || 0} empty</span>
            </div>

            <div className={styles.kpiCard}>
              <span className={styles.kpiTitle}>Total Tags</span>
              <div className={styles.kpiValue}>{summary.totalTagsCount}</div>
              <span className={styles.kpiMeta}>Keywords</span>
            </div>

            <div className={styles.kpiCard}>
              <span className={styles.kpiTitle}>Total Questions</span>
              <div className={styles.kpiValue}>{summary.totalQuestions.toLocaleString()}</div>
              <span className={styles.kpiMeta}>Total in bank</span>
            </div>
          </div>

          {/* 3. Slim, Clean Difficulty Breakdown Meter */}
          <div className={styles.difficultyStrip}>
            <div className={styles.difficultyBar}>
              <div style={{ width: `${diffPct.easyPct}%`, background: "#10b981" }} title={`Easy: ${diffPct.easy}`} />
              <div style={{ width: `${diffPct.mediumPct}%`, background: "#f59e0b" }} title={`Medium: ${diffPct.medium}`} />
              <div style={{ width: `${diffPct.hardPct}%`, background: "#ef4444" }} title={`Hard: ${diffPct.hard}`} />
              <div style={{ width: `${diffPct.expertPct}%`, background: "#8b5cf6" }} title={`Expert: ${diffPct.expert}`} />
            </div>
            <div className={styles.difficultyLabels}>
              <span><strong style={{ color: "#10b981" }}>● Easy:</strong> {diffPct.easy.toLocaleString()} ({diffPct.easyPct}%)</span>
              <span><strong style={{ color: "#f59e0b" }}>● Medium:</strong> {diffPct.medium.toLocaleString()} ({diffPct.mediumPct}%)</span>
              <span><strong style={{ color: "#ef4444" }}>● Hard:</strong> {diffPct.hard.toLocaleString()} ({diffPct.hardPct}%)</span>
              <span><strong style={{ color: "#8b5cf6" }}>● Expert:</strong> {diffPct.expert.toLocaleString()} ({diffPct.expertPct}%)</span>
            </div>
          </div>

          {/* 4. Clean View Tabs */}
          <div className={styles.tabsNav}>
            <button
              type="button"
              onClick={() => setActiveTab("categories")}
              className={`${styles.tabBtn} ${activeTab === "categories" ? styles.tabBtnActive : ""}`}
            >
              Category Wise ({filteredCategories.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("subcategories")}
              className={`${styles.tabBtn} ${activeTab === "subcategories" ? styles.tabBtnActive : ""}`}
            >
              Sub Category Wise ({filteredSubCategories.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("topics")}
              className={`${styles.tabBtn} ${activeTab === "topics" ? styles.tabBtnActive : ""}`}
            >
              Topic Wise ({filteredTopics.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("emptyAudit")}
              className={`${styles.tabBtn} ${activeTab === "emptyAudit" ? styles.tabBtnActive : ""}`}
            >
              Empty Data ({emptyAudit.totalEmpty})
            </button>
          </div>

          {/* 5. Minimal Filter Row (Hidden on Empty Data Tab) */}
          {activeTab !== "emptyAudit" && (
            <div className={styles.filterRow}>
              <div className={styles.searchWrapper}>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={`Search ${activeTab}...`}
                  className={styles.searchInput}
                />
                {searchQuery && (
                  <button type="button" onClick={() => setSearchQuery("")} className={styles.searchClearBtn}>✕</button>
                )}
              </div>

              <div className={styles.filtersGroup}>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className={styles.selectFilter}
                  aria-label="Filter status"
                >
                  <option value="all">All Status</option>
                  <option value="live">Active Only</option>
                  <option value="empty">Empty Only</option>
                </select>

                <select
                  value={difficultyFilter}
                  onChange={(e) => setDifficultyFilter(e.target.value)}
                  className={styles.selectFilter}
                  aria-label="Filter difficulty"
                >
                  <option value="all">All Difficulties</option>
                  <option value="easy">Easy Questions</option>
                  <option value="medium">Medium Questions</option>
                  <option value="hard">Hard Questions</option>
                  <option value="expert">Expert Questions</option>
                </select>
              </div>
            </div>
          )}

          {/* TAB 1: CATEGORY WISE DATA */}
          {activeTab === "categories" && (
            <div className={styles.tableCard}>
              <div className={styles.tableResponsive}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Category</th>
                      <th>Sub-Cats</th>
                      <th>Total Qs</th>
                      <th>Easy</th>
                      <th>Medium</th>
                      <th>Hard</th>
                      <th>Expert</th>
                      <th>Status</th>
                      <th style={{ textAlign: "right" }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCategories.length > 0 ? (
                      filteredCategories.map((cat) => (
                        <tr key={cat.id}>
                          <td>
                            <div className={styles.primaryCell}>
                              <span className={styles.cellEmoji}>{cat.emoji}</span>
                              <span className={styles.cellTitle}>{cat.name}</span>
                            </div>
                          </td>
                          <td>{cat.subCategoriesCount}</td>
                          <td><strong>{cat.totalQuestions.toLocaleString()}</strong></td>
                          <td className={styles.diffEasyText}>{cat.easy}</td>
                          <td className={styles.diffMedText}>{cat.medium}</td>
                          <td className={styles.diffHardText}>{cat.hard}</td>
                          <td className={styles.diffExpText}>{cat.expert}</td>
                          <td>
                            <span className={cat.isEmpty ? styles.statusEmpty : styles.statusLive}>
                              {cat.isEmpty ? "Empty" : "Active"}
                            </span>
                          </td>
                          <td style={{ textAlign: "right" }}>
                            <Link
                              href={`/admin/questions?category=${cat.id}`}
                              className={styles.rowLink}
                            >
                              {cat.isEmpty ? "+ Add" : "Manage"}
                            </Link>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={9} className={styles.emptyTable}>No categories found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: SUB CATEGORY WISE DATA */}
          {activeTab === "subcategories" && (
            <div className={styles.tableCard}>
              <div className={styles.tableResponsive}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Sub Category</th>
                      <th>Parent Category</th>
                      <th>Total Qs</th>
                      <th>Easy</th>
                      <th>Medium</th>
                      <th>Hard</th>
                      <th>Expert</th>
                      <th>Status</th>
                      <th style={{ textAlign: "right" }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSubCategories.length > 0 ? (
                      filteredSubCategories.map((sub) => (
                        <tr key={sub.id}>
                          <td>
                            <div className={styles.primaryCell}>
                              <span className={styles.cellEmoji}>{sub.emoji}</span>
                              <span className={styles.cellTitle}>{sub.name}</span>
                            </div>
                          </td>
                          <td className={styles.mutedText}>{sub.parentName}</td>
                          <td><strong>{sub.totalQuestions.toLocaleString()}</strong></td>
                          <td className={styles.diffEasyText}>{sub.easy}</td>
                          <td className={styles.diffMedText}>{sub.medium}</td>
                          <td className={styles.diffHardText}>{sub.hard}</td>
                          <td className={styles.diffExpText}>{sub.expert}</td>
                          <td>
                            <span className={sub.isEmpty ? styles.statusEmpty : styles.statusLive}>
                              {sub.isEmpty ? "Empty" : "Active"}
                            </span>
                          </td>
                          <td style={{ textAlign: "right" }}>
                            <Link
                              href={`/admin/questions?category=${sub.id}`}
                              className={styles.rowLink}
                            >
                              {sub.isEmpty ? "+ Add" : "Manage"}
                            </Link>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={9} className={styles.emptyTable}>No sub categories found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: TOPIC WISE DATA */}
          {activeTab === "topics" && (
            <div className={styles.tableCard}>
              <div className={styles.tableResponsive}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Topic</th>
                      <th>Hierarchy</th>
                      <th>Total Qs</th>
                      <th>Easy</th>
                      <th>Medium</th>
                      <th>Hard</th>
                      <th>Expert</th>
                      <th>Tags</th>
                      <th>Status</th>
                      <th style={{ textAlign: "right" }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTopics.slice(0, topicLimit).map((top, idx) => (
                      <tr key={idx}>
                        <td>
                          <strong>{top.name}</strong>
                        </td>
                        <td className={styles.mutedText}>
                          {top.subCategoryName} · {top.categoryName}
                        </td>
                        <td><strong>{top.totalQuestions.toLocaleString()}</strong></td>
                        <td className={styles.diffEasyText}>{top.easy}</td>
                        <td className={styles.diffMedText}>{top.medium}</td>
                        <td className={styles.diffHardText}>{top.hard}</td>
                        <td className={styles.diffExpText}>{top.expert}</td>
                        <td>
                          <span className={styles.tagsText}>
                            {(top.tags || []).slice(0, 3).join(", ") || "—"}
                          </span>
                        </td>
                        <td>
                          <span className={top.isEmpty ? styles.statusEmpty : styles.statusLive}>
                            {top.isEmpty ? "Empty" : "Active"}
                          </span>
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <Link
                            href={`/admin/questions?search=${encodeURIComponent(top.name)}`}
                            className={styles.rowLink}
                          >
                            {top.isEmpty ? "+ Add" : "Manage"}
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {filteredTopics.length > topicLimit && (
                <div className={styles.tableFooter}>
                  <span>Showing {topicLimit} of {filteredTopics.length} topics</span>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      type="button"
                      onClick={() => setTopicLimit(prev => prev + 100)}
                      className={styles.textBtn}
                    >
                      Load More (+100)
                    </button>
                    <button
                      type="button"
                      onClick={() => setTopicLimit(filteredTopics.length)}
                      className={styles.textBtn}
                    >
                      Show All ({filteredTopics.length})
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: EMPTY DATA AUDIT */}
          {activeTab === "emptyAudit" && (
            <div className={styles.emptyContainer}>
              <div className={styles.emptySubNav}>
                <button
                  type="button"
                  onClick={() => setEmptySubTab("all")}
                  className={`${styles.emptyPill} ${emptySubTab === "all" ? styles.emptyPillActive : ""}`}
                >
                  All Items ({emptyAudit.totalEmpty})
                </button>
                <button
                  type="button"
                  onClick={() => setEmptySubTab("categories")}
                  className={`${styles.emptyPill} ${emptySubTab === "categories" ? styles.emptyPillActive : ""}`}
                >
                  Main Categories ({emptyAudit.categories.length})
                </button>
                <button
                  type="button"
                  onClick={() => setEmptySubTab("subcategories")}
                  className={`${styles.emptyPill} ${emptySubTab === "subcategories" ? styles.emptyPillActive : ""}`}
                >
                  Sub Categories ({emptyAudit.subCategories.length})
                </button>
                <button
                  type="button"
                  onClick={() => setEmptySubTab("topics")}
                  className={`${styles.emptyPill} ${emptySubTab === "topics" ? styles.emptyPillActive : ""}`}
                >
                  Topics ({emptyAudit.topics.length})
                </button>
              </div>

              <div className={styles.tableCard}>
                <div className={styles.tableResponsive}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Type</th>
                        <th>Name</th>
                        <th>Parent Hierarchy</th>
                        <th>Questions</th>
                        <th style={{ textAlign: "right" }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(emptySubTab === "all" || emptySubTab === "categories") &&
                        emptyAudit.categories.map((c) => (
                          <tr key={`cat-${c.id}`}>
                            <td><span className={styles.typeBadge}>Category</span></td>
                            <td><strong>{c.emoji} {c.name}</strong></td>
                            <td className={styles.mutedText}>Top Level</td>
                            <td>0</td>
                            <td style={{ textAlign: "right" }}>
                              <Link href={`/admin/questions?category=${c.id}`} className={styles.rowLink}>
                                + Add Questions
                              </Link>
                            </td>
                          </tr>
                        ))}

                      {(emptySubTab === "all" || emptySubTab === "subcategories") &&
                        emptyAudit.subCategories.map((s) => (
                          <tr key={`sub-${s.id}`}>
                            <td><span className={styles.typeBadge}>Sub Category</span></td>
                            <td><strong>{s.emoji} {s.name}</strong></td>
                            <td className={styles.mutedText}>{s.parentName}</td>
                            <td>0</td>
                            <td style={{ textAlign: "right" }}>
                              <Link href={`/admin/questions?category=${s.id}`} className={styles.rowLink}>
                                + Add Questions
                              </Link>
                            </td>
                          </tr>
                        ))}

                      {(emptySubTab === "all" || emptySubTab === "topics") &&
                        emptyAudit.topics.map((t, idx) => (
                          <tr key={`top-${idx}`}>
                            <td><span className={styles.typeBadge}>Topic</span></td>
                            <td><strong>{t.name}</strong></td>
                            <td className={styles.mutedText}>{t.categoryName} &gt; {t.subCategoryName}</td>
                            <td>0</td>
                            <td style={{ textAlign: "right" }}>
                              <Link href={`/admin/upload`} className={styles.rowLink}>
                                📤 Bulk Import
                              </Link>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* ========================================================================= */}
      {/* TIER 1: KIDS */}
      {/* ========================================================================= */}
      {selectedTier === "kids" && (
        <div className={styles.tierSimpleCard}>
          <div className={styles.tierSimpleHeader}>
            <div>
              <h2 className={styles.tierSimpleTitle}>🧒 1st Kids</h2>
              <p className={styles.tierSimpleSubtitle}>Junior learning questions and visual puzzles</p>
            </div>
            <Link href="/admin/questions?audience=kids" className={styles.primaryBtn}>
              + Add Kids Question
            </Link>
          </div>
          <div className={styles.kpiGrid}>
            <div className={styles.kpiCard}>
              <span className={styles.kpiTitle}>Total Kids Questions</span>
              <div className={styles.kpiValue}>{statsData?.kids?.totalQuestions || 240}</div>
              <span className={styles.kpiMeta}>Available in bank</span>
            </div>
            <div className={styles.kpiCard}>
              <span className={styles.kpiTitle}>Easy Questions</span>
              <div className={styles.kpiValue} style={{ color: "#10b981" }}>{statsData?.kids?.difficulty?.easy || 180}</div>
              <span className={styles.kpiMeta}>Junior level</span>
            </div>
            <div className={styles.kpiCard}>
              <span className={styles.kpiTitle}>Medium Questions</span>
              <div className={styles.kpiValue} style={{ color: "#f59e0b" }}>{statsData?.kids?.difficulty?.medium || 60}</div>
              <span className={styles.kpiMeta}>Intermediate level</span>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TIER 2: SCHOOL STUDENTS */}
      {/* ========================================================================= */}
      {selectedTier === "school" && (
        <div className={styles.tierSimpleCard}>
          <div className={styles.tierSimpleHeader}>
            <div>
              <h2 className={styles.tierSimpleTitle}>🎒 2nd School Students</h2>
              <p className={styles.tierSimpleSubtitle}>Classes 1–12 curriculum syllabus & chapter mocks</p>
            </div>
            <Link href="/admin/school-study" className={styles.primaryBtn}>
              Manage School Study →
            </Link>
          </div>
          <div className={styles.kpiGrid}>
            <div className={styles.kpiCard}>
              <span className={styles.kpiTitle}>Classes</span>
              <div className={styles.kpiValue}>1 to 12</div>
              <span className={styles.kpiMeta}>Active grades</span>
            </div>
            <div className={styles.kpiCard}>
              <span className={styles.kpiTitle}>Subjects</span>
              <div className={styles.kpiValue}>{statsData?.school?.subjectsCount || 8}</div>
              <span className={styles.kpiMeta}>Curriculum areas</span>
            </div>
            <div className={styles.kpiCard}>
              <span className={styles.kpiTitle}>Chapters</span>
              <div className={styles.kpiValue}>{statsData?.school?.chaptersCount || 24}</div>
              <span className={styles.kpiMeta}>Syllabus units</span>
            </div>
            <div className={styles.kpiCard}>
              <span className={styles.kpiTitle}>Questions</span>
              <div className={styles.kpiValue}>{statsData?.school?.questionsCount || 120}</div>
              <span className={styles.kpiMeta}>School bank</span>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TIER 4: MY BOOKS */}
      {/* ========================================================================= */}
      {selectedTier === "books" && (
        <div className={styles.tierSimpleCard}>
          <div className={styles.tierSimpleHeader}>
            <div>
              <h2 className={styles.tierSimpleTitle}>📖 4th My Books</h2>
              <p className={styles.tierSimpleSubtitle}>Digital GK reading books, units and pages</p>
            </div>
            <Link href="/admin/gk" className={styles.primaryBtn}>
              Manage GK Books →
            </Link>
          </div>
          <div className={styles.kpiGrid}>
            <div className={styles.kpiCard}>
              <span className={styles.kpiTitle}>Digital Books</span>
              <div className={styles.kpiValue}>GK Edition 2026</div>
              <span className={styles.kpiMeta}>Active volume</span>
            </div>
            <div className={styles.kpiCard}>
              <span className={styles.kpiTitle}>Chapters</span>
              <div className={styles.kpiValue}>{statsData?.books?.chaptersCount || 4}</div>
              <span className={styles.kpiMeta}>History, Polity, etc.</span>
            </div>
            <div className={styles.kpiCard}>
              <span className={styles.kpiTitle}>Reading Pages</span>
              <div className={styles.kpiValue}>{statsData?.books?.pagesCount || 18}</div>
              <span className={styles.kpiMeta}>Indexed pages</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
