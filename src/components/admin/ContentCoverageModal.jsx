"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import toast from "react-hot-toast";
import styles from "@/styles/ContentCoverageModal.module.css";

const STATUS_OPTIONS = [
  { value: "all", label: "All Status" },
  { value: "covered", label: "Covered 🟢" },
  { value: "in_progress", label: "In Progress 🟡" },
  { value: "planned", label: "Planned ⚪" },
];

export default function ContentCoverageModal({
  isOpen,
  onClose,
  initialCategory = null,
  allCategories = [],
  onRefresh = () => {},
}) {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [stats, setStats] = useState({ total: 0, covered: 0, inProgress: 0, planned: 0, coveragePercent: 0 });

  // Filter States
  const [selectedCatId, setSelectedCatId] = useState(initialCategory?.id || "all");
  const [selectedSubCatId, setSelectedSubCatId] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // View Mode: 'list' | 'add_single' | 'bulk_paste'
  const [activeView, setActiveView] = useState("list");

  // Single Add / Edit Form State
  const [editingItemId, setEditingItemId] = useState(null);
  const [singleForm, setSingleForm] = useState({
    chapterTitle: "",
    chapterTitleHi: "",
    categoryId: initialCategory?.id || "",
    subCategoryId: "",
    topic: "",
    status: "covered",
    targetQuestions: 20,
    tags: "",
    notes: "",
  });

  // Bulk Import State
  const [bulkText, setBulkText] = useState("");
  const [bulkCatId, setBulkCatId] = useState(initialCategory?.id || "");
  const [bulkSubCatId, setBulkSubCatId] = useState("");
  const [bulkStatus, setBulkStatus] = useState("covered");
  const [bulkTargetQs, setBulkTargetQs] = useState(20);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Parent Categories (Main categories)
  const mainCategories = useMemo(() => {
    return (allCategories || []).filter((c) => !c.parentId);
  }, [allCategories]);

  // Sub-categories for currently selected main category
  const availableSubCategories = useMemo(() => {
    const targetCatId = selectedCatId !== "all" ? selectedCatId : (bulkCatId || singleForm.categoryId);
    if (!targetCatId) return [];
    return (allCategories || []).filter((c) => c.parentId === targetCatId);
  }, [allCategories, selectedCatId, bulkCatId, singleForm.categoryId]);

  // Fetch coverage data from API
  const fetchCoverageData = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedCatId && selectedCatId !== "all") params.set("categoryId", selectedCatId);
      if (selectedSubCatId && selectedSubCatId !== "all") params.set("subCategoryId", selectedSubCatId);
      if (selectedStatus && selectedStatus !== "all") params.set("status", selectedStatus);

      const res = await fetch(`/api/admin/categories/content-coverage?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load content coverage");

      const data = await res.json();
      setItems(data.items || []);
      setStats(data.stats || { total: 0, covered: 0, inProgress: 0, planned: 0, coveragePercent: 0 });
    } catch (err) {
      console.error(err);
      toast.error("Error loading coverage data");
    } finally {
      setLoading(false);
    }
  }, [selectedCatId, selectedSubCatId, selectedStatus]);

  useEffect(() => {
    if (isOpen) {
      if (initialCategory?.id) {
        setSelectedCatId(initialCategory.id);
        setBulkCatId(initialCategory.id);
        setSingleForm((prev) => ({ ...prev, categoryId: initialCategory.id }));
      }
      fetchCoverageData();
    }
  }, [isOpen, initialCategory, fetchCoverageData]);

  // Filter items locally by search query
  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) => {
      const matchTitle = (item.chapterTitle || "").toLowerCase().includes(q);
      const matchTitleHi = (item.chapterTitleHi || "").toLowerCase().includes(q);
      const matchCat = (item.categoryName || "").toLowerCase().includes(q);
      const matchSub = (item.subCategoryName || "").toLowerCase().includes(q);
      const matchTopic = (item.topic || "").toLowerCase().includes(q);
      const matchTags = (item.tags || []).some((t) => t.toLowerCase().includes(q));
      return matchTitle || matchTitleHi || matchCat || matchSub || matchTopic || matchTags;
    });
  }, [items, searchQuery]);

  // Save Single Chapter (Add or Edit)
  const handleSaveSingle = async (e) => {
    e.preventDefault();
    if (!singleForm.chapterTitle.trim()) {
      toast.error("Please enter a chapter title");
      return;
    }
    if (!singleForm.categoryId) {
      toast.error("Please select a target Category");
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        chapterTitle: singleForm.chapterTitle.trim(),
        chapterTitleHi: singleForm.chapterTitleHi.trim(),
        categoryId: singleForm.categoryId,
        subCategoryId: singleForm.subCategoryId || null,
        topic: singleForm.topic.trim(),
        status: singleForm.status,
        targetQuestions: Number(singleForm.targetQuestions) || 20,
        tags: singleForm.tags.split(",").map((t) => t.trim()).filter(Boolean),
        notes: singleForm.notes.trim(),
      };

      if (editingItemId) {
        payload.id = editingItemId;
        const res = await fetch("/api/admin/categories/content-coverage", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error("Failed to update chapter");
        toast.success("Chapter updated successfully!");
      } else {
        const res = await fetch("/api/admin/categories/content-coverage", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error("Failed to add chapter");
        toast.success("Chapter added successfully!");
      }

      setEditingItemId(null);
      setSingleForm({
        chapterTitle: "",
        chapterTitleHi: "",
        categoryId: selectedCatId !== "all" ? selectedCatId : "",
        subCategoryId: "",
        topic: "",
        status: "covered",
        targetQuestions: 20,
        tags: "",
        notes: "",
      });
      setActiveView("list");
      fetchCoverageData();
      onRefresh();
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Operation failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Edit Form for an item
  const handleStartEdit = (item) => {
    setEditingItemId(item.id);
    setSingleForm({
      chapterTitle: item.chapterTitle || "",
      chapterTitleHi: item.chapterTitleHi || "",
      categoryId: item.categoryId || "",
      subCategoryId: item.subCategoryId || "",
      topic: item.topic || "",
      status: item.status || "covered",
      targetQuestions: item.targetQuestions || 20,
      tags: Array.isArray(item.tags) ? item.tags.join(", ") : "",
      notes: item.notes || "",
    });
    setActiveView("add_single");
  };

  // Bulk Import handler
  const handleBulkImport = async () => {
    if (!bulkText.trim()) {
      toast.error("Please paste chapter list in the box");
      return;
    }
    if (!bulkCatId) {
      toast.error("Please select a target Category for bulk import");
      return;
    }

    const lines = bulkText.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);
    if (lines.length === 0) {
      toast.error("No valid lines found");
      return;
    }

    try {
      setIsSubmitting(true);
      const parsedItems = lines.map((line, idx) => {
        // Support format: "English Title | Hindi Title | Tags" OR "1. Title"
        let clean = line.replace(/^\d+[\.\)\-:]\s*/, ""); // remove leading numbering like "1." or "1)"
        let titleEn = clean;
        let titleHi = "";
        let tags = [];

        if (clean.includes("|")) {
          const parts = clean.split("|").map((p) => p.trim());
          titleEn = parts[0] || clean;
          titleHi = parts[1] || "";
          if (parts[2]) {
            tags = parts[2].split(",").map((t) => t.trim()).filter(Boolean);
          }
        }

        return {
          chapterTitle: titleEn,
          chapterTitleHi: titleHi,
          categoryId: bulkCatId,
          subCategoryId: bulkSubCatId || null,
          status: bulkStatus,
          targetQuestions: Number(bulkTargetQs) || 20,
          tags,
          sortOrder: idx + 1,
        };
      });

      const res = await fetch("/api/admin/categories/content-coverage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: parsedItems }),
      });

      if (!res.ok) throw new Error("Failed to import chapters");
      const result = await res.json();
      toast.success(`Successfully imported ${result.insertedCount || parsedItems.length} chapters!`);
      setBulkText("");
      setActiveView("list");
      fetchCoverageData();
      onRefresh();
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Bulk import failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle status cycle: planned -> in_progress -> covered
  const handleToggleStatus = async (item) => {
    const cycle = {
      planned: "in_progress",
      in_progress: "covered",
      covered: "planned",
    };
    const nextStatus = cycle[item.status] || "covered";

    try {
      const res = await fetch("/api/admin/categories/content-coverage", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: item.id, status: nextStatus }),
      });
      if (!res.ok) throw new Error("Failed to change status");

      setItems((prev) =>
        prev.map((it) => (it.id === item.id ? { ...it, status: nextStatus } : it))
      );
      toast.success(`Status updated to ${nextStatus.replace("_", " ")}`);
      fetchCoverageData();
    } catch (err) {
      console.error(err);
      toast.error("Failed to update status");
    }
  };

  // Delete chapter
  const handleDeleteItem = async (id, title) => {
    if (!window.confirm(`Delete chapter "${title}"?`)) return;
    try {
      const res = await fetch(`/api/admin/categories/content-coverage?id=${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete chapter");
      toast.success("Chapter deleted");
      setItems((prev) => prev.filter((it) => it.id !== id));
      fetchCoverageData();
      onRefresh();
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete");
    }
  };

  // Export to Excel / CSV
  const handleExportExcel = () => {
    if (items.length === 0) {
      toast.error("No data to export");
      return;
    }

    const headers = [
      "Chapter Title",
      "Hindi Title",
      "Main Category",
      "Sub Category",
      "Topic",
      "Status",
      "Questions Count",
      "Target Questions",
      "Tags",
      "Notes",
    ];

    const rows = items.map((it) => [
      `"${(it.chapterTitle || "").replace(/"/g, '""')}"`,
      `"${(it.chapterTitleHi || "").replace(/"/g, '""')}"`,
      `"${(it.categoryName || "").replace(/"/g, '""')}"`,
      `"${(it.subCategoryName || "").replace(/"/g, '""')}"`,
      `"${(it.topic || "").replace(/"/g, '""')}"`,
      it.status,
      it.questionCount || 0,
      it.targetQuestions || 20,
      `"${(it.tags || []).join(", ").replace(/"/g, '""')}"`,
      `"${(it.notes || "").replace(/"/g, '""')}"`,
    ]);

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `syllabus_coverage_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Exported syllabus to CSV (Excel compatible)!");
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal} role="dialog" aria-modal="true">
        
        {/* Header */}
        <div className={styles.modalHeader}>
          <div className={styles.headerLeft}>
            <div className={styles.headerIcon}>📖</div>
            <div className={styles.titleArea}>
              <h2 className={styles.modalTitle}>
                Syllabus & Chapters Coverage Tracker
              </h2>
              <p className={styles.modalSubtitle}>
                Manage chapters covered, in-progress & planned across categories and topics
              </p>
            </div>
          </div>
          <button type="button" className={styles.closeBtn} onClick={onClose} title="Close">
            ✕
          </button>
        </div>

        {/* Overview Metrics Bar */}
        <div className={styles.metricsBar}>
          <div className={styles.metricCard}>
            <span className={styles.metricLabel}>Total Chapters</span>
            <div className={styles.metricValueRow}>
              <span className={styles.metricValue}>{stats.total}</span>
              <span className={styles.metricSub} style={{ color: "#6366f1" }}>100% Tracked</span>
            </div>
          </div>

          <div className={styles.metricCard}>
            <span className={styles.metricLabel}>Covered</span>
            <div className={styles.metricValueRow}>
              <span className={styles.metricValue} style={{ color: "#166534" }}>{stats.covered}</span>
              <span className={styles.metricSub} style={{ color: "#166534" }}>🟢 Ready</span>
            </div>
          </div>

          <div className={styles.metricCard}>
            <span className={styles.metricLabel}>In Progress</span>
            <div className={styles.metricValueRow}>
              <span className={styles.metricValue} style={{ color: "#b45309" }}>{stats.inProgress}</span>
              <span className={styles.metricSub} style={{ color: "#b45309" }}>🟡 Writing</span>
            </div>
          </div>

          <div className={styles.metricCard}>
            <span className={styles.metricLabel}>Planned</span>
            <div className={styles.metricValueRow}>
              <span className={styles.metricValue} style={{ color: "#475569" }}>{stats.planned}</span>
              <span className={styles.metricSub} style={{ color: "#64748b" }}>⚪ Pending</span>
            </div>
          </div>

          <div className={styles.metricCard}>
            <span className={styles.metricLabel}>Overall Coverage</span>
            <div className={styles.metricValueRow}>
              <span className={styles.metricValue}>{stats.coveragePercent}%</span>
              <span className={styles.metricSub} style={{ color: stats.coveragePercent >= 80 ? "#166534" : "#4f46e5" }}>
                {stats.coveragePercent >= 80 ? "Excellent" : "In Progress"}
              </span>
            </div>
            <div className={styles.progressBarContainer}>
              <div
                className={styles.progressBarFill}
                style={{ width: `${Math.min(stats.coveragePercent, 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Controls, Filters & Actions Bar */}
        <div className={styles.controlsRow}>
          <div className={styles.filtersGroup}>
            {/* Category Filter */}
            <select
              className={styles.filterSelect}
              value={selectedCatId}
              onChange={(e) => {
                setSelectedCatId(e.target.value);
                setSelectedSubCatId("all");
              }}
              title="Filter by Main Category"
            >
              <option value="all">📁 All Main Categories</option>
              {mainCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.topic}
                </option>
              ))}
            </select>

            {/* Sub-Category Filter */}
            {availableSubCategories.length > 0 && (
              <select
                className={styles.filterSelect}
                value={selectedSubCatId}
                onChange={(e) => setSelectedSubCatId(e.target.value)}
                title="Filter by Sub-Category"
              >
                <option value="all">📂 All Sub-Categories</option>
                {availableSubCategories.map((sc) => (
                  <option key={sc.id} value={sc.id}>
                    ↳ {sc.topic}
                  </option>
                ))}
              </select>
            )}

            {/* Status Filter */}
            <select
              className={styles.filterSelect}
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              title="Filter by status"
            >
              {STATUS_OPTIONS.map((st) => (
                <option key={st.value} value={st.value}>
                  {st.label}
                </option>
              ))}
            </select>

            {/* Search Input */}
            <div className={styles.searchBox}>
              <span className={styles.searchIcon}>🔍</span>
              <input
                type="text"
                className={styles.searchInput}
                placeholder="Search chapter, topic, tag..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className={styles.actionsGroup}>
            {activeView === "list" ? (
              <>
                <button
                  type="button"
                  className={styles.secondaryBtn}
                  onClick={() => {
                    setBulkCatId(selectedCatId !== "all" ? selectedCatId : "");
                    setActiveView("bulk_paste");
                  }}
                  title="Paste entire chapter list from syllabus or outline"
                >
                  📋 Bulk Paste
                </button>
                <button
                  type="button"
                  className={styles.primaryBtn}
                  onClick={() => {
                    setEditingItemId(null);
                    setSingleForm({
                      chapterTitle: "",
                      chapterTitleHi: "",
                      categoryId: selectedCatId !== "all" ? selectedCatId : "",
                      subCategoryId: "",
                      topic: "",
                      status: "covered",
                      targetQuestions: 20,
                      tags: "",
                      notes: "",
                    });
                    setActiveView("add_single");
                  }}
                >
                  + Add Chapter
                </button>
                <button
                  type="button"
                  className={styles.exportBtn}
                  onClick={handleExportExcel}
                  title="Download as Excel/CSV"
                >
                  📥 Export Excel
                </button>
              </>
            ) : (
              <button
                type="button"
                className={styles.secondaryBtn}
                onClick={() => {
                  setActiveView("list");
                  setEditingItemId(null);
                }}
              >
                ← Back to Chapter List
              </button>
            )}
          </div>
        </div>

        {/* Modal Body */}
        <div className={styles.modalBody}>

          {/* VIEW 1: SINGLE ADD / EDIT PANEL */}
          {activeView === "add_single" && (
            <div className={styles.panelCard}>
              <div className={styles.panelHeader}>
                <h3 className={styles.panelTitle}>
                  {editingItemId ? "✏️ Edit Chapter Coverage" : "➕ Add Single Syllabus Chapter"}
                </h3>
              </div>
              <form onSubmit={handleSaveSingle}>
                <div className={styles.formGrid}>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>
                      Chapter Title (English) *
                    </label>
                    <input
                      type="text"
                      className={styles.formInput}
                      placeholder="e.g. Indus Valley Civilization"
                      value={singleForm.chapterTitle}
                      onChange={(e) => setSingleForm({ ...singleForm, chapterTitle: e.target.value })}
                      required
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>
                      Chapter Title (Hindi)
                    </label>
                    <input
                      type="text"
                      className={styles.formInput}
                      placeholder="e.g. सिंधु घाटी सभ्यता"
                      value={singleForm.chapterTitleHi}
                      onChange={(e) => setSingleForm({ ...singleForm, chapterTitleHi: e.target.value })}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>
                      Target Main Category *
                    </label>
                    <select
                      className={styles.formSelect}
                      value={singleForm.categoryId}
                      onChange={(e) => setSingleForm({ ...singleForm, categoryId: e.target.value, subCategoryId: "" })}
                      required
                    >
                      <option value="">Select Main Category</option>
                      {mainCategories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.topic}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>
                      Sub-Category (Optional)
                    </label>
                    <select
                      className={styles.formSelect}
                      value={singleForm.subCategoryId}
                      onChange={(e) => setSingleForm({ ...singleForm, subCategoryId: e.target.value })}
                    >
                      <option value="">None / Top Level</option>
                      {availableSubCategories.map((sc) => (
                        <option key={sc.id} value={sc.id}>
                          {sc.topic}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>
                      Topic / Sub-topic Name
                    </label>
                    <input
                      type="text"
                      className={styles.formInput}
                      placeholder="e.g. Ancient Indian History"
                      value={singleForm.topic}
                      onChange={(e) => setSingleForm({ ...singleForm, topic: e.target.value })}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>
                      Coverage Status
                    </label>
                    <select
                      className={styles.formSelect}
                      value={singleForm.status}
                      onChange={(e) => setSingleForm({ ...singleForm, status: e.target.value })}
                    >
                      <option value="covered">🟢 Covered</option>
                      <option value="in_progress">🟡 In Progress</option>
                      <option value="planned">⚪ Planned</option>
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>
                      Target Questions Count
                    </label>
                    <input
                      type="number"
                      min="1"
                      className={styles.formInput}
                      value={singleForm.targetQuestions}
                      onChange={(e) => setSingleForm({ ...singleForm, targetQuestions: e.target.value })}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>
                      Tags <span className={styles.labelHint}>(comma separated)</span>
                    </label>
                    <input
                      type="text"
                      className={styles.formInput}
                      placeholder="e.g. ancient, history, ivc, harappa"
                      value={singleForm.tags}
                      onChange={(e) => setSingleForm({ ...singleForm, tags: e.target.value })}
                    />
                  </div>

                  <div className={styles.formGroupFull}>
                    <label className={styles.label}>
                      Notes & Coverage Scope
                    </label>
                    <textarea
                      className={styles.formTextarea}
                      style={{ minHeight: "70px" }}
                      placeholder="Key sub-points covered or required (e.g. Town planning, Seals, Decline theory...)"
                      value={singleForm.notes}
                      onChange={(e) => setSingleForm({ ...singleForm, notes: e.target.value })}
                    />
                  </div>
                </div>

                <div className={styles.panelActions}>
                  <button
                    type="button"
                    className={styles.cancelBtn}
                    onClick={() => {
                      setActiveView("list");
                      setEditingItemId(null);
                    }}
                  >
                    Cancel
                  </button>
                  <button type="submit" className={styles.saveBtn} disabled={isSubmitting}>
                    {isSubmitting ? "Saving..." : editingItemId ? "Update Chapter" : "Save Chapter"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* VIEW 2: BULK PASTE SYLLABUS PANEL */}
          {activeView === "bulk_paste" && (
            <div className={styles.panelCard}>
              <div className={styles.panelHeader}>
                <h3 className={styles.panelTitle}>
                  📋 Bulk Paste Syllabus & Chapters
                </h3>
              </div>

              <div className={styles.bulkHelpBox}>
                Paste your chapter list line-by-line from your syllabus outline, PDF or Excel file.
                <br />
                <strong>Format 1 (Simple):</strong> Each line is 1 chapter title, e.g. <code>Indus Valley Civilization</code>
                <br />
                <strong>Format 2 (Bilingual & Tags):</strong> <code>Title (EN) | Title (HI) | tag1, tag2</code>
                <br />
                Numbered lines like <code>1. Introduction to Science</code> are automatically cleaned up!
              </div>

              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Target Category *</label>
                  <select
                    className={styles.formSelect}
                    value={bulkCatId}
                    onChange={(e) => {
                      setBulkCatId(e.target.value);
                      setBulkSubCatId("");
                    }}
                    required
                  >
                    <option value="">Select Category</option>
                    {mainCategories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.topic}
                      </option>
                    ))}
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Sub-Category (Optional)</label>
                  <select
                    className={styles.formSelect}
                    value={bulkSubCatId}
                    onChange={(e) => setBulkSubCatId(e.target.value)}
                  >
                    <option value="">None / Top Level</option>
                    {availableSubCategories.map((sc) => (
                      <option key={sc.id} value={sc.id}>
                        {sc.topic}
                      </option>
                    ))}
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Initial Status</label>
                  <select
                    className={styles.formSelect}
                    value={bulkStatus}
                    onChange={(e) => setBulkStatus(e.target.value)}
                  >
                    <option value="covered">🟢 Covered</option>
                    <option value="in_progress">🟡 In Progress</option>
                    <option value="planned">⚪ Planned</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Target Questions per Chapter</label>
                  <input
                    type="number"
                    min="1"
                    className={styles.formInput}
                    value={bulkTargetQs}
                    onChange={(e) => setBulkTargetQs(e.target.value)}
                  />
                </div>

                <div className={styles.formGroupFull}>
                  <label className={styles.label}>
                    Paste Chapter List Here (One per line) *
                  </label>
                  <textarea
                    className={styles.formTextarea}
                    rows={10}
                    placeholder={`1. Harappan Civilization | हड़प्पा सभ्यता | ancient, history\n2. Vedic Culture & Literature | वैदिक संस्कृति\n3. Rise of Jainism & Buddhism | जैन और बौद्ध धर्म\n4. Mauryan Empire | मौर्य साम्राज्य\n5. Gupta Golden Age | गुप्त काल`}
                    value={bulkText}
                    onChange={(e) => setBulkText(e.target.value)}
                  />
                </div>
              </div>

              <div className={styles.panelActions}>
                <button
                  type="button"
                  className={styles.cancelBtn}
                  onClick={() => setActiveView("list")}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className={styles.saveBtn}
                  disabled={isSubmitting}
                  onClick={handleBulkImport}
                >
                  {isSubmitting ? "Importing..." : "Import Chapters Now"}
                </button>
              </div>
            </div>
          )}

          {/* VIEW 3: CHAPTERS TABLE (DEFAULT LIST) */}
          {activeView === "list" && (
            <>
              {loading ? (
                <div className={styles.emptyState}>
                  <p>Loading coverage chapters...</p>
                </div>
              ) : filteredItems.length === 0 ? (
                <div className={styles.emptyState}>
                  <div className={styles.emptyIcon}>📂</div>
                  <h3>No Syllabus Chapters Found</h3>
                  <p>
                    {items.length === 0
                      ? "Start by adding or pasting chapters covered in this category to track your content syllabus."
                      : "No chapters match your search or filter criteria."}
                  </p>
                  <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                    <button
                      type="button"
                      className={styles.primaryBtn}
                      onClick={() => setActiveView("add_single")}
                    >
                      + Add Chapter
                    </button>
                    <button
                      type="button"
                      className={styles.secondaryBtn}
                      onClick={() => setActiveView("bulk_paste")}
                    >
                      📋 Bulk Paste Syllabus
                    </button>
                  </div>
                </div>
              ) : (
                <div className={styles.tableContainer}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th style={{ width: "40px" }}>#</th>
                        <th>Chapter & Title</th>
                        <th>Category / Scope</th>
                        <th>Status</th>
                        <th>Live Qs vs Target</th>
                        <th>Tags</th>
                        <th>Notes</th>
                        <th style={{ textAlign: "right", width: "90px" }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredItems.map((item, idx) => {
                        const isMet = (item.questionCount || 0) >= (item.targetQuestions || 20);
                        return (
                          <tr key={item.id}>
                            <td style={{ color: "#64748b", fontWeight: 600 }}>{idx + 1}</td>
                            <td>
                              <div className={styles.chapterTitleCell}>
                                <span className={styles.chapterNameEn}>{item.chapterTitle}</span>
                                {item.chapterTitleHi && (
                                  <span className={styles.chapterNameHi}>{item.chapterTitleHi}</span>
                                )}
                              </div>
                            </td>
                            <td>
                              <div className={styles.categoryHierarchy}>
                                <span className={styles.categoryTag}>{item.categoryName || "General"}</span>
                                {item.subCategoryName && (
                                  <>
                                    <span>›</span>
                                    <span className={styles.subCatTag}>{item.subCategoryName}</span>
                                  </>
                                )}
                              </div>
                            </td>
                            <td>
                              <button
                                type="button"
                                className={`${styles.statusBadge} ${
                                  item.status === "covered"
                                    ? styles.statusCovered
                                    : item.status === "in_progress"
                                    ? styles.statusProgress
                                    : styles.statusPlanned
                                }`}
                                onClick={() => handleToggleStatus(item)}
                                title="Click to cycle status: Planned -> In Progress -> Covered"
                              >
                                {item.status === "covered"
                                  ? "🟢 Covered"
                                  : item.status === "in_progress"
                                  ? "🟡 In Progress"
                                  : "⚪ Planned"}
                              </button>
                            </td>
                            <td>
                              <div className={isMet ? styles.qsBadgeMet : styles.qsBadgeLow}>
                                {isMet ? "✓" : "•"} {item.questionCount || 0} / {item.targetQuestions || 20}
                              </div>
                            </td>
                            <td>
                              <div className={styles.tagChipList}>
                                {(item.tags || []).slice(0, 3).map((tag, tIdx) => (
                                  <span key={tIdx} className={styles.tagChip}>
                                    #{tag}
                                  </span>
                                ))}
                                {(item.tags || []).length > 3 && (
                                  <span className={styles.tagChip}>
                                    +{(item.tags || []).length - 3}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td>
                              {item.notes ? (
                                <span className={styles.notesSnippet} title={item.notes}>
                                  {item.notes}
                                </span>
                              ) : (
                                <span style={{ color: "#cbd5e1" }}>—</span>
                              )}
                            </td>
                            <td style={{ textAlign: "right" }}>
                              <div className={styles.actionsCell} style={{ justifyContent: "flex-end" }}>
                                <button
                                  type="button"
                                  className={styles.iconBtn}
                                  onClick={() => handleStartEdit(item)}
                                  title="Edit chapter details"
                                >
                                  ✏️
                                </button>
                                <button
                                  type="button"
                                  className={`${styles.iconBtn} ${styles.iconBtnDelete}`}
                                  onClick={() => handleDeleteItem(item.id, item.chapterTitle)}
                                  title="Delete chapter"
                                >
                                  🗑️
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}

        </div>
      </div>
    </div>
  );
}
