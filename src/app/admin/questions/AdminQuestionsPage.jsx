"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { useAdmin } from "@/context/AdminContext";
import { useData } from "@/context/DataContext";
import styles from "@/styles/AdminQuestions.module.css";
import toast from "react-hot-toast";
import {
  Search,
  Filter,
  Plus,
  Trash2,
  Edit2,
  Upload,
  RefreshCw,
  Copy,
  Layers,
  AlertTriangle,
  Inbox,
  CheckCircle2,
  Calendar,
  Grid,
  Check,
  X,
  ChevronDown,
  ChevronRight,
  ExternalLink,
} from "lucide-react";

export default function AdminQuestionsPage() {
  const { adminUser } = useAdmin();
  const { quizzes: quizCategories } = useData();
  const searchParams = useSearchParams();
  const allowed = adminUser?.role === "master" || adminUser?.permissions?.questions !== false;

  // Active Tab
  const [activeTab, setActiveTab] = useState("bank"); // bank | import | taxonomy | matrix | duplicates | suggestions | reports

  // Taxonomy data
  const [categories, setCategories] = useState([]);
  const [loadingTaxonomy, setLoadingTaxonomy] = useState(false);

  // Tab 1: Bank state
  const [questions, setQuestions] = useState([]);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingQuestions, setLoadingQuestions] = useState(false);

  // Filters
  const [search, setSearch] = useState("");
  const initialCategory = searchParams?.get("category") || "all";
  const [selectedCat, setSelectedCat] = useState(initialCategory);

  // Sync category from URL parameter when navigation occurs
  useEffect(() => {
    const catFromUrl = searchParams?.get("category");
    if (catFromUrl && catFromUrl !== selectedCat) {
      setSelectedCat(catFromUrl);
      setPage(1);
    }
  }, [searchParams]);
  const [selectedTopic, setSelectedTopic] = useState("all");
  const [selectedDiff, setSelectedDiff] = useState("all");
  const [selectedAudience, setSelectedAudience] = useState("all");
  const [selectedExam, setSelectedExam] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedLanguage, setSelectedLanguage] = useState("all");
  const [reviewDueOnly, setReviewDueOnly] = useState(false);

  // Selection for bulk actions
  const [selectedIds, setSelectedIds] = useState([]);

  // Inline / Edit Modal
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [editForm, setEditForm] = useState({
    text_hi: "",
    text_en: "",
    options_list: ["", "", "", ""],
    correct_index: 0,
    difficulty_level: 1,
    audience: ["explorer"],
    exam: [],
    state: "",
    status: "published",
    tags: "",
    explanation_hi: "",
    explanation_en: "",
    time_sensitive: false,
    category_id: "",
    topic_id: "",
  });

  // Bulk Edit Modal
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [bulkUpdates, setBulkUpdates] = useState({
    category_id: "",
    topic_id: "",
    difficulty_level: "",
    audience: [],
    exam: [],
    status: "",
    addTags: "",
  });

  // Tab 2: Import state
  const [importFormat, setImportFormat] = useState("csv");
  const [importContent, setImportContent] = useState("");
  const [importCatId, setImportCatId] = useState("");
  const [importTopId, setImportTopId] = useState("");
  const [importReport, setImportReport] = useState(null);
  const [isImporting, setIsImporting] = useState(false);

  // Tab 3: Taxonomy state
  const [expandedCats, setExpandedCats] = useState({});
  const [editingTaxonomyCat, setEditingTaxonomyCat] = useState(null);
  const [editingTaxonomyTopic, setEditingTaxonomyTopic] = useState(null);

  // Tab 4: Matrix state
  const [matrixData, setMatrixData] = useState([]);
  const [loadingMatrix, setLoadingMatrix] = useState(false);

  // Tab 5: Duplicates state
  const [duplicates, setDuplicates] = useState([]);
  const [loadingDuplicates, setLoadingDuplicates] = useState(false);

  // Tab 6: Suggestions state
  const [suggestions, setSuggestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  // Tab 7: Reports state
  const [errorReports, setErrorReports] = useState([]);
  const [loadingReports, setLoadingReports] = useState(false);

  // Fetch Taxonomy Categories
  const fetchTaxonomy = useCallback(async () => {
    setLoadingTaxonomy(true);
    try {
      const res = await fetch("/api/taxonomy/categories");
      const data = await res.json();
      if (data.success) {
        setCategories(data.categories || []);
      }
    } catch {
      toast.error("Failed to load taxonomy");
    } finally {
      setLoadingTaxonomy(false);
    }
  }, []);

  useEffect(() => {
    fetchTaxonomy();
  }, [fetchTaxonomy]);

  // Derived topics for active category in filter
  const filterTopics = useMemo(() => {
    if (selectedCat === "all") return [];
    const cat = categories.find((c) => c.id === selectedCat);
    return cat?.topics || [];
  }, [categories, selectedCat]);

  // Derived topics for edit form
  const editFormTopics = useMemo(() => {
    if (!editForm.category_id) return [];
    const cat = categories.find((c) => c.id === editForm.category_id);
    return cat?.topics || [];
  }, [categories, editForm.category_id]);

  // Fetch Question Bank
  const fetchQuestions = useCallback(async () => {
    setLoadingQuestions(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      });

      if (search) params.set("search", search);
      if (selectedCat !== "all") params.set("categoryId", selectedCat);
      if (selectedTopic !== "all") params.set("topicId", selectedTopic);
      if (selectedDiff !== "all") params.set("difficulty", selectedDiff);
      if (selectedAudience !== "all") params.set("audience", selectedAudience);
      if (selectedExam !== "all") params.set("exam", selectedExam);
      if (selectedStatus !== "all") params.set("status", selectedStatus);
      if (selectedLanguage !== "all") params.set("language", selectedLanguage);
      if (reviewDueOnly) params.set("reviewDue", "true");

      const res = await fetch(`/api/admin/questions/bank?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setQuestions(data.questions || []);
        setTotalQuestions(data.total || 0);
        setTotalPages(data.totalPages || 1);
      } else {
        toast.error(data.error || "Failed to fetch questions");
      }
    } catch {
      toast.error("Network error fetching questions");
    } finally {
      setLoadingQuestions(false);
    }
  }, [
    page,
    limit,
    search,
    selectedCat,
    selectedTopic,
    selectedDiff,
    selectedAudience,
    selectedExam,
    selectedStatus,
    selectedLanguage,
    reviewDueOnly,
  ]);

  useEffect(() => {
    if (activeTab === "bank") {
      fetchQuestions();
    }
  }, [activeTab, fetchQuestions]);

  // Fetch Coverage Matrix
  const fetchMatrix = async () => {
    setLoadingMatrix(true);
    try {
      const res = await fetch("/api/admin/questions/bank/coverage-matrix");
      const data = await res.json();
      if (data.success) {
        setMatrixData(data.matrix || []);
      }
    } catch {
      toast.error("Failed to load coverage matrix");
    } finally {
      setLoadingMatrix(false);
    }
  };

  // Fetch Duplicates
  const fetchDuplicates = async () => {
    setLoadingDuplicates(true);
    try {
      const catParam = selectedCat !== "all" ? `?categoryId=${selectedCat}` : "";
      const res = await fetch(`/api/admin/questions/bank/duplicates${catParam}`);
      const data = await res.json();
      if (data.success) {
        setDuplicates(data.duplicates || []);
        toast.success(`Found ${data.count} potential duplicate pairs`);
      }
    } catch {
      toast.error("Failed to scan duplicates");
    } finally {
      setLoadingDuplicates(false);
    }
  };

  // Fetch Difficulty Suggestions
  const fetchSuggestions = async () => {
    setLoadingSuggestions(true);
    try {
      const res = await fetch("/api/admin/questions/bank/difficulty-suggestions");
      const data = await res.json();
      if (data.success) {
        setSuggestions(data.suggestions || []);
      }
    } catch {
      toast.error("Failed to load suggestions");
    } finally {
      setLoadingSuggestions(false);
    }
  };

  // Fetch Error Reports
  const fetchReports = async () => {
    setLoadingReports(true);
    try {
      const res = await fetch("/api/admin/questions/bank/error-reports");
      const data = await res.json();
      if (data.success) {
        setErrorReports(data.reports || []);
      }
    } catch {
      toast.error("Failed to load error reports");
    } finally {
      setLoadingReports(false);
    }
  };

  // Tab Change Handler
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === "matrix") fetchMatrix();
    if (tab === "duplicates") fetchDuplicates();
    if (tab === "suggestions") fetchSuggestions();
    if (tab === "reports") fetchReports();
  };

  // Checkbox handlers
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(questions.map((q) => q.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // Inline / Edit Question
  const openEditQuestion = (q) => {
    setEditingQuestion(q);
    setEditForm({
      text_hi: q.text_hi || "",
      text_en: q.text_en || "",
      options_list: q.options_list?.length === 4 ? [...q.options_list] : ["", "", "", ""],
      correct_index: q.correct_index || 0,
      difficulty_level: q.difficulty_level || 1,
      audience: q.audience || ["explorer"],
      exam: q.exam || [],
      state: q.state || "",
      status: q.status || "published",
      tags: (q.tags || []).join(", "),
      explanation_hi: q.explanation_hi || "",
      explanation_en: q.explanation_en || "",
      time_sensitive: !!q.time_sensitive,
      category_id: q.category_id || "",
      topic_id: q.topic_id || "",
    });
    setEditModalOpen(true);
  };

  const saveEditQuestion = async (e) => {
    e.preventDefault();
    if (!editingQuestion) return;

    try {
      const tagsArray = editForm.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      const res = await fetch("/api/admin/questions/bank", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingQuestion.id,
          ...editForm,
          tags: tagsArray,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Question updated successfully");
        setEditModalOpen(false);
        fetchQuestions();
      } else {
        toast.error(data.error || "Failed to update question");
      }
    } catch {
      toast.error("Error saving question");
    }
  };

  // Delete single question
  const handleDeleteQuestion = async (id) => {
    if (!confirm("Are you sure you want to delete this question?")) return;
    try {
      const res = await fetch(`/api/admin/questions/bank?id=${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Question deleted");
        fetchQuestions();
      } else {
        toast.error(data.error || "Failed to delete");
      }
    } catch {
      toast.error("Error deleting question");
    }
  };

  // Bulk Edit Execution
  const executeBulkEdit = async () => {
    if (selectedIds.length === 0) return;
    try {
      const updates = {};
      if (bulkUpdates.category_id) updates.category_id = bulkUpdates.category_id;
      if (bulkUpdates.topic_id) updates.topic_id = bulkUpdates.topic_id;
      if (bulkUpdates.difficulty_level) updates.difficulty_level = bulkUpdates.difficulty_level;
      if (bulkUpdates.audience.length > 0) updates.audience = bulkUpdates.audience;
      if (bulkUpdates.exam.length > 0) updates.exam = bulkUpdates.exam;
      if (bulkUpdates.status) updates.status = bulkUpdates.status;
      if (bulkUpdates.addTags) {
        updates.addTags = bulkUpdates.addTags
          .split(",")
          .map((t) => t.trim().toLowerCase())
          .filter(Boolean);
      }

      const res = await fetch("/api/admin/questions/bank/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ids: selectedIds,
          action: "edit",
          updates,
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(`Updated ${data.modifiedCount} questions`);
        setBulkModalOpen(false);
        setSelectedIds([]);
        fetchQuestions();
      } else {
        toast.error(data.error || "Failed bulk edit");
      }
    } catch {
      toast.error("Error during bulk edit");
    }
  };

  // Bulk Delete Execution
  const executeBulkDelete = async () => {
    if (
      !confirm(
        `Are you sure you want to permanently delete ${selectedIds.length} selected questions?`
      )
    )
      return;
    try {
      const res = await fetch("/api/admin/questions/bank/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ids: selectedIds,
          action: "delete",
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(`Deleted ${data.deletedCount} questions`);
        setSelectedIds([]);
        fetchQuestions();
      } else {
        toast.error(data.error || "Failed bulk delete");
      }
    } catch {
      toast.error("Error during bulk delete");
    }
  };

  // Import Submission
  const handleImportSubmit = async (e) => {
    e.preventDefault();
    if (!importContent.trim()) {
      toast.error("Please enter or paste questions content");
      return;
    }

    setIsImporting(true);
    setImportReport(null);
    try {
      let content = importContent;
      if (importFormat === "json") {
        try {
          content = JSON.parse(importContent);
        } catch {
          toast.error("Invalid JSON syntax");
          setIsImporting(false);
          return;
        }
      }

      const res = await fetch("/api/admin/questions/bank/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          format: importFormat,
          content,
          defaultCategoryId: importCatId || undefined,
          defaultTopicId: importTopId || undefined,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setImportReport(data);
        if (data.importedCount > 0) {
          toast.success(`Successfully imported ${data.importedCount} questions!`);
        }
        if (data.errorCount > 0) {
          toast.error(`${data.errorCount} rows had validation errors`);
        }
      } else {
        toast.error(data.error || "Import failed");
      }
    } catch {
      toast.error("Network error during import");
    } finally {
      setIsImporting(false);
    }
  };

  // Apply single difficulty suggestion
  const applyDifficulty = async (qId, level) => {
    try {
      const res = await fetch("/api/admin/questions/bank/difficulty-suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId: qId,
          suggestedLevel: level,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Difficulty updated");
        setSuggestions((prev) => prev.filter((s) => s.id !== qId));
      }
    } catch {
      toast.error("Error updating difficulty");
    }
  };

  // Apply all difficulty suggestions
  const applyAllSuggestions = async () => {
    if (!confirm(`Apply all ${suggestions.length} suggested difficulty adjustments?`)) return;
    try {
      const res = await fetch("/api/admin/questions/bank/difficulty-suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applyAll: true,
          items: suggestions,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Applied ${data.appliedCount} difficulty changes`);
        setSuggestions([]);
      }
    } catch {
      toast.error("Error applying all suggestions");
    }
  };

  // Resolve error report
  const handleResolveReport = async (reportId, status) => {
    try {
      const res = await fetch("/api/admin/questions/bank/error-reports", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportId, status }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Report marked as ${status}`);
        setErrorReports((prev) => prev.filter((r) => r.id !== reportId));
      }
    } catch {
      toast.error("Error updating report");
    }
  };

  if (!allowed) {
    return (
      <div className={styles.page}>
        <p>Access denied. You do not have permission to view Question Bank.</p>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.headerRow}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>Admin Question Bank</h1>
          <p className={styles.subtitle}>
            Comprehensive question management, taxonomy, matrix, bulk edit & error inbox
          </p>
        </div>
        <div className={styles.headerActions}>
          <button
            className={styles.refreshBtn}
            onClick={() => {
              fetchTaxonomy();
              if (activeTab === "bank") fetchQuestions();
              if (activeTab === "matrix") fetchMatrix();
              if (activeTab === "suggestions") fetchSuggestions();
              if (activeTab === "reports") fetchReports();
            }}
          >
            <RefreshCw size={16} />
            Refresh
          </button>
          <button
            className={styles.addBtn}
            onClick={() => {
              setEditingQuestion({ id: "new" });
              setEditForm({
                text_hi: "",
                text_en: "",
                options_list: ["", "", "", ""],
                correct_index: 0,
                difficulty_level: 1,
                audience: ["explorer"],
                exam: [],
                state: "",
                status: "published",
                tags: "",
                explanation_hi: "",
                explanation_en: "",
                time_sensitive: false,
                category_id: categories[0]?.id || "",
                topic_id: categories[0]?.topics?.[0]?.id || "",
              });
              setEditModalOpen(true);
            }}
          >
            <Plus size={16} />
            New Question
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className={styles.tabsNav}>
        <button
          className={`${styles.tabBtn} ${activeTab === "bank" ? styles.tabBtnActive : ""}`}
          onClick={() => handleTabChange("bank")}
        >
          <Layers size={16} />
          Question Table
          <span className={styles.tabBadge}>{totalQuestions}</span>
        </button>
        <button
          className={`${styles.tabBtn} ${activeTab === "import" ? styles.tabBtnActive : ""}`}
          onClick={() => handleTabChange("import")}
        >
          <Upload size={16} />
          CSV/JSON Import
        </button>
        <button
          className={`${styles.tabBtn} ${activeTab === "taxonomy" ? styles.tabBtnActive : ""}`}
          onClick={() => handleTabChange("taxonomy")}
        >
          <Grid size={16} />
          Taxonomy Manager
          <span className={styles.tabBadge}>{categories.length}</span>
        </button>
        <button
          className={`${styles.tabBtn} ${activeTab === "matrix" ? styles.tabBtnActive : ""}`}
          onClick={() => handleTabChange("matrix")}
        >
          <Grid size={16} />
          Coverage Matrix
        </button>
        <button
          className={`${styles.tabBtn} ${activeTab === "duplicates" ? styles.tabBtnActive : ""}`}
          onClick={() => handleTabChange("duplicates")}
        >
          <Copy size={16} />
          Duplicate Finder
        </button>
        <button
          className={`${styles.tabBtn} ${activeTab === "suggestions" ? styles.tabBtnActive : ""}`}
          onClick={() => handleTabChange("suggestions")}
        >
          <Sparkles size={16} />
          Difficulty Suggestions
          {suggestions.length > 0 && <span className={styles.tabBadge}>{suggestions.length}</span>}
        </button>
        <button
          className={`${styles.tabBtn} ${activeTab === "reports" ? styles.tabBtnActive : ""}`}
          onClick={() => handleTabChange("reports")}
        >
          <Inbox size={16} />
          Error Reports
          {errorReports.length > 0 && <span className={styles.tabBadge}>{errorReports.length}</span>}
        </button>
      </div>

      {/* ================= TAB 1: QUESTION BANK TABLE ================= */}
      {activeTab === "bank" && (
        <>
          {/* Multi-Select Bulk Actions Bar */}
          {selectedIds.length > 0 && (
            <div className={styles.bulkBar}>
              <div className={styles.bulkInfo}>
                <Check size={18} style={{ display: "inline", verticalAlign: "middle", marginRight: 8 }} />
                {selectedIds.length} questions selected
              </div>
              <div className={styles.bulkActions}>
                <button className={styles.bulkBtn} onClick={() => setBulkModalOpen(true)}>
                  <Edit2 size={14} style={{ display: "inline", marginRight: 4 }} />
                  Bulk Edit
                </button>
                <button className={`${styles.bulkBtn} ${styles.bulkDeleteBtn}`} onClick={executeBulkDelete}>
                  <Trash2 size={14} style={{ display: "inline", marginRight: 4 }} />
                  Delete Selected
                </button>
                <button
                  className={styles.bulkBtn}
                  onClick={() => setSelectedIds([])}
                  style={{ background: "transparent" }}
                >
                  Clear Selection
                </button>
              </div>
            </div>
          )}

          {/* Filter Bar */}
          <div className={styles.controlBar}>
            {/* Search row */}
            <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
              <div style={{ position: "relative", flex: 1 }}>
                <Search
                  size={18}
                  style={{
                    position: "absolute",
                    left: 14,
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "var(--text-muted)",
                  }}
                />
                <input
                  type="text"
                  placeholder="Search questions by Hindi, English text, or tag..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  style={{
                    width: "100%",
                    padding: "10px 14px 10px 42px",
                    borderRadius: "10px",
                    border: "1.5px solid var(--card-border)",
                    background: "var(--bg-secondary)",
                    color: "var(--text-primary)",
                    fontSize: "0.95rem",
                  }}
                />
              </div>
              {search && (
                <button
                  className={styles.refreshBtn}
                  onClick={() => {
                    setSearch("");
                    setPage(1);
                  }}
                >
                  Clear
                </button>
              )}
            </div>

            {/* Filters Row */}
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
              {/* Category */}
              <select
                value={selectedCat}
                onChange={(e) => {
                  setSelectedCat(e.target.value);
                  setSelectedTopic("all");
                  setPage(1);
                }}
                className={styles.select}
                style={{ width: "auto", minWidth: "200px" }}
              >
                <option value="all">📁 All Categories</option>
                {quizCategories && quizCategories.length > 0 && (
                  <optgroup label="── Quiz Categories ──">
                    {quizCategories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.emoji || "📁"} {c.name || c.topic} ({c.questionCount || 0} Qs)
                      </option>
                    ))}
                  </optgroup>
                )}
                {categories && categories.length > 0 && (
                  <optgroup label="── Taxonomy Groups ──">
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>

              {/* Topic */}
              <select
                value={selectedTopic}
                onChange={(e) => {
                  setSelectedTopic(e.target.value);
                  setPage(1);
                }}
                disabled={selectedCat === "all"}
                className={styles.select}
                style={{ width: "auto", minWidth: "170px" }}
              >
                <option value="all">📂 All Topics</option>
                {filterTopics.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>

              {/* Difficulty */}
              <select
                value={selectedDiff}
                onChange={(e) => {
                  setSelectedDiff(e.target.value);
                  setPage(1);
                }}
                className={styles.select}
                style={{ width: "auto" }}
              >
                <option value="all">⚡ All Difficulties</option>
                <option value="1">🟢 Easy (Level 1)</option>
                <option value="2">🟡 Medium (Level 2)</option>
                <option value="3">🔴 Hard (Level 3)</option>
              </select>

              {/* Audience */}
              <select
                value={selectedAudience}
                onChange={(e) => {
                  setSelectedAudience(e.target.value);
                  setPage(1);
                }}
                className={styles.select}
                style={{ width: "auto" }}
              >
                <option value="all">👥 All Audiences</option>
                <option value="kids">Kids</option>
                <option value="students">Students</option>
                <option value="explorer">Explorer</option>
              </select>

              {/* Exam */}
              <select
                value={selectedExam}
                onChange={(e) => {
                  setSelectedExam(e.target.value);
                  setPage(1);
                }}
                className={styles.select}
                style={{ width: "auto" }}
              >
                <option value="all">🎯 All Exams</option>
                <option value="SSC">SSC</option>
                <option value="Banking">Banking</option>
                <option value="Railway">Railway</option>
                <option value="State">State Exams</option>
                <option value="UPSC">UPSC</option>
              </select>

              {/* Status */}
              <select
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(e.target.value);
                  setPage(1);
                }}
                className={styles.select}
                style={{ width: "auto" }}
              >
                <option value="all">🏷️ All Statuses</option>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
                <option value="reviewed">Reviewed</option>
                <option value="flagged">Flagged</option>
              </select>

              {/* Language */}
              <select
                value={selectedLanguage}
                onChange={(e) => {
                  setSelectedLanguage(e.target.value);
                  setPage(1);
                }}
                className={styles.select}
                style={{ width: "auto" }}
              >
                <option value="all">🌐 All Languages</option>
                <option value="hi">Hindi Only</option>
                <option value="en">English Only</option>
                <option value="both">Bilingual</option>
              </select>

              {/* Review Due Toggle */}
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  color: reviewDueOnly ? "#ef4444" : "var(--text-secondary)",
                }}
              >
                <input
                  type="checkbox"
                  checked={reviewDueOnly}
                  onChange={(e) => {
                    setReviewDueOnly(e.target.checked);
                    setPage(1);
                  }}
                />
                Review Due
              </label>
            </div>
          </div>

          {/* Table */}
          {loadingQuestions ? (
            <div className={styles.emptyState}>⏳ Loading questions from database...</div>
          ) : questions.length === 0 ? (
            <div className={styles.emptyState}>No questions found matching your filter criteria.</div>
          ) : (
            <div className={styles.matrixCard} style={{ padding: 0 }}>
              <table className={styles.matrixTable}>
                <thead>
                  <tr>
                    <th style={{ width: "40px", textAlign: "center" }}>
                      <input
                        type="checkbox"
                        checked={selectedIds.length === questions.length && questions.length > 0}
                        onChange={handleSelectAll}
                      />
                    </th>
                    <th style={{ minWidth: "320px" }}>Question Text</th>
                    <th style={{ minWidth: "200px" }}>Options & Correct Answer</th>
                    <th>Difficulty</th>
                    <th>Audience / Exam</th>
                    <th>Status</th>
                    <th>Stats</th>
                    <th style={{ textAlign: "right", minWidth: "100px" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {questions.map((q) => {
                    const isChecked = selectedIds.includes(q.id);
                    const diffColors = {
                      1: { bg: "rgba(16, 185, 129, 0.12)", color: "#059669", label: "Easy" },
                      2: { bg: "rgba(245, 158, 11, 0.12)", color: "#d97706", label: "Medium" },
                      3: { bg: "rgba(239, 68, 68, 0.12)", color: "#dc2626", label: "Hard" },
                    };
                    const diff = diffColors[q.difficulty_level] || diffColors[1];

                    return (
                      <tr
                        key={q.id}
                        style={{
                          background: isChecked ? "rgba(99, 102, 241, 0.05)" : "transparent",
                        }}
                      >
                        <td style={{ textAlign: "center" }}>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleSelectOne(q.id)}
                          />
                        </td>
                        <td>
                          <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>
                            {q.text_hi || q.text_en}
                          </div>
                          {q.text_en && q.text_hi !== q.text_en && (
                            <div style={{ fontSize: "0.82rem", color: "var(--text-secondary)", marginTop: 2 }}>
                              {q.text_en}
                            </div>
                          )}
                          {q.tags?.length > 0 && (
                            <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 4 }}>
                              {q.tags.slice(0, 3).map((t, i) => (
                                <span
                                  key={i}
                                  style={{
                                    fontSize: "0.72rem",
                                    padding: "2px 6px",
                                    borderRadius: "4px",
                                    background: "var(--bg-secondary)",
                                    color: "var(--text-muted)",
                                  }}
                                >
                                  #{t}
                                </span>
                              ))}
                            </div>
                          )}
                        </td>
                        <td>
                          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                            {q.options_list?.map((opt, idx) => {
                              const isCorrect = idx === q.correct_index;
                              return (
                                <div
                                  key={idx}
                                  style={{
                                    fontSize: "0.8rem",
                                    fontWeight: isCorrect ? 700 : 400,
                                    color: isCorrect ? "#047857" : "var(--text-secondary)",
                                    background: isCorrect ? "rgba(16, 185, 129, 0.12)" : "transparent",
                                    border: isCorrect ? "1px solid rgba(16, 185, 129, 0.3)" : "1px solid transparent",
                                    borderRadius: "6px",
                                    padding: "2px 8px",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 6,
                                  }}
                                >
                                  {isCorrect ? (
                                    <span style={{ color: "#10b981", display: "inline-flex" }}>
                                      <CheckCircle2 size={13} />
                                    </span>
                                  ) : (
                                    <span style={{ opacity: 0.35, fontSize: "0.75rem" }}>•</span>
                                  )}
                                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                    {opt}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </td>
                        <td>
                          <span
                            style={{
                              padding: "4px 8px",
                              borderRadius: "6px",
                              fontSize: "0.78rem",
                              fontWeight: 700,
                              background: diff.bg,
                              color: diff.color,
                              display: "inline-block",
                            }}
                          >
                            {diff.label}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                            {q.audience?.map((a) => (
                              <span
                                key={a}
                                style={{
                                  fontSize: "0.72rem",
                                  fontWeight: 700,
                                  padding: "2px 6px",
                                  borderRadius: "4px",
                                  background: "rgba(99, 102, 241, 0.1)",
                                  color: "#6366f1",
                                }}
                              >
                                {a}
                              </span>
                            ))}
                            {q.exam?.map((e) => (
                              <span
                                key={e}
                                style={{
                                  fontSize: "0.72rem",
                                  fontWeight: 700,
                                  padding: "2px 6px",
                                  borderRadius: "4px",
                                  background: "rgba(245, 158, 11, 0.1)",
                                  color: "#d97706",
                                }}
                              >
                                {e}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td>
                          <span
                            style={{
                              fontSize: "0.75rem",
                              fontWeight: 700,
                              padding: "3px 8px",
                              borderRadius: "6px",
                              background:
                                q.status === "published"
                                  ? "rgba(16, 185, 129, 0.1)"
                                  : q.status === "flagged"
                                  ? "rgba(239, 68, 68, 0.1)"
                                  : "rgba(100, 116, 139, 0.1)",
                              color:
                                q.status === "published"
                                  ? "#059669"
                                  : q.status === "flagged"
                                  ? "#dc2626"
                                  : "#64748b",
                            }}
                          >
                            {q.status}
                          </span>
                        </td>
                        <td style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
                          <div>{q.attempts} att</div>
                          <div style={{ fontWeight: 700, color: "var(--text-primary)" }}>{q.accuracy}% acc</div>
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <div style={{ display: "inline-flex", gap: "6px" }}>
                            <button
                              onClick={() => openEditQuestion(q)}
                              style={{
                                padding: "6px",
                                borderRadius: "6px",
                                border: "1px solid var(--card-border)",
                                background: "var(--bg-primary)",
                                cursor: "pointer",
                                color: "#6366f1",
                              }}
                              title="Edit"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              onClick={() => handleDeleteQuestion(q.id)}
                              style={{
                                padding: "6px",
                                borderRadius: "6px",
                                border: "1px solid var(--card-border)",
                                background: "var(--bg-primary)",
                                cursor: "pointer",
                                color: "#ef4444",
                              }}
                              title="Delete"
                            >
                              <Trash2 size={14} />
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

          {/* Pagination Controls */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 12,
              padding: "16px 4px",
            }}
          >
            <div style={{ fontSize: "0.88rem", color: "var(--text-secondary)" }}>
              Showing {questions.length} of {totalQuestions} questions (Page {page} of {totalPages})
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <button
                className={styles.refreshBtn}
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </button>
              <button
                className={styles.refreshBtn}
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}

      {/* ================= TAB 2: BULK IMPORT ================= */}
      {activeTab === "import" && (
        <div className={styles.matrixCard}>
          <h2 style={{ fontSize: "1.3rem", fontWeight: 700, marginBottom: "8px" }}>
            CSV / JSON Question Import
          </h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginBottom: "20px" }}>
            Upload or paste questions in bulk. Every question is validated for 4 options, valid correct answer,
            and complete schema. A detailed error report is provided if any rows fail.
          </p>

          <form onSubmit={handleImportSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {/* Format choice & Default category/topic */}
            <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
              <div>
                <label className={styles.label}>Format</label>
                <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
                  <button
                    type="button"
                    className={`${styles.bulkBtn} ${importFormat === "csv" ? styles.tabBtnActive : ""}`}
                    onClick={() => setImportFormat("csv")}
                    style={{
                      background: importFormat === "csv" ? "#6366f1" : "var(--bg-secondary)",
                      color: importFormat === "csv" ? "#fff" : "var(--text-primary)",
                    }}
                  >
                    CSV
                  </button>
                  <button
                    type="button"
                    className={`${styles.bulkBtn} ${importFormat === "json" ? styles.tabBtnActive : ""}`}
                    onClick={() => setImportFormat("json")}
                    style={{
                      background: importFormat === "json" ? "#6366f1" : "var(--bg-secondary)",
                      color: importFormat === "json" ? "#fff" : "var(--text-primary)",
                    }}
                  >
                    JSON
                  </button>
                </div>
              </div>

              <div>
                <label className={styles.label}>Default Category (Optional)</label>
                <select
                  value={importCatId}
                  onChange={(e) => {
                    setImportCatId(e.target.value);
                    setImportTopId("");
                  }}
                  className={styles.select}
                  style={{ width: "220px", marginTop: "4px" }}
                >
                  <option value="">Select Category...</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={styles.label}>Default Topic (Optional)</label>
                <select
                  value={importTopId}
                  onChange={(e) => setImportTopId(e.target.value)}
                  disabled={!importCatId}
                  className={styles.select}
                  style={{ width: "220px", marginTop: "4px" }}
                >
                  <option value="">Select Topic...</option>
                  {categories
                    .find((c) => c.id === importCatId)
                    ?.topics?.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            {/* Template hint */}
            <div
              style={{
                background: "var(--bg-secondary)",
                borderRadius: "10px",
                padding: "12px 16px",
                fontSize: "0.85rem",
                color: "var(--text-secondary)",
              }}
            >
              <strong>{importFormat.toUpperCase()} Header Format:</strong>
              {importFormat === "csv" ? (
                <code>
                  {" "}
                  text_hi, text_en, option1, option2, option3, option4, correct_answer, difficulty, audience, tags
                </code>
              ) : (
                <code>
                  {" "}
                  [{'{"text_hi": "...", "options": ["A","B","C","D"], "correct_index": 0, "difficulty_level": 1}'}]
                </code>
              )}
            </div>

            {/* Input textarea */}
            <div>
              <label className={styles.label}>Paste Questions Content</label>
              <textarea
                rows={12}
                value={importContent}
                onChange={(e) => setImportContent(e.target.value)}
                placeholder={
                  importFormat === "csv"
                    ? 'text_hi,text_en,option1,option2,option3,option4,correct_answer,difficulty,audience\n"भारत की राजधानी क्या है?","What is the capital of India?","Mumbai","New Delhi","Kolkata","Chennai","New Delhi","1","students"'
                    : '[\n  {\n    "text_hi": "भारत की राजधानी क्या है?",\n    "text_en": "What is the capital of India?",\n    "options": ["Mumbai", "New Delhi", "Kolkata", "Chennai"],\n    "correct_index": 1,\n    "difficulty_level": 1,\n    "audience": ["students"]\n  }\n]'
                }
                className={styles.textarea}
                style={{ fontFamily: "monospace", fontSize: "0.85rem" }}
              />
            </div>

            <div style={{ display: "flex", gap: 12 }}>
              <button
                type="submit"
                disabled={isImporting}
                className={styles.addBtn}
                style={{ width: "auto" }}
              >
                <Upload size={16} />
                {isImporting ? "Validating & Importing..." : "Validate & Import"}
              </button>
            </div>
          </form>

          {/* Import Result / Error Report */}
          {importReport && (
            <div
              style={{
                marginTop: "24px",
                padding: "16px",
                borderRadius: "12px",
                background: importReport.errorCount > 0 ? "rgba(239, 68, 68, 0.08)" : "rgba(16, 185, 129, 0.08)",
                border:
                  importReport.errorCount > 0
                    ? "1px solid rgba(239, 68, 68, 0.2)"
                    : "1px solid rgba(16, 185, 129, 0.2)",
              }}
            >
              <h3 style={{ fontSize: "1.1rem", fontWeight: 700, margin: "0 0 8px 0" }}>
                Import Summary: {importReport.importedCount} questions successfully imported
                {importReport.errorCount > 0 && ` (${importReport.errorCount} errors)`}
              </h3>

              {importReport.errors?.length > 0 && (
                <div style={{ marginTop: "12px" }}>
                  <h4 style={{ fontSize: "0.92rem", fontWeight: 700, color: "#dc2626", marginBottom: "8px" }}>
                    Validation Error Report:
                  </h4>
                  <ul style={{ margin: 0, paddingLeft: "20px", fontSize: "0.85rem", color: "#dc2626" }}>
                    {importReport.errors.map((err, idx) => (
                      <li key={idx}>
                        <strong>Row {err.row}:</strong> {err.error}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 3: TAXONOMY MANAGER ================= */}
      {activeTab === "taxonomy" && (
        <div className={styles.matrixCard}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <div>
              <h2 style={{ fontSize: "1.3rem", fontWeight: 700, margin: 0 }}>Standard Taxonomy Hierarchy</h2>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", margin: "4px 0 0 0" }}>
                15 Core Categories with 10 Topics each (150 total topics)
              </p>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {categories.map((cat) => {
              const isExpanded = !!expandedCats[cat.id];
              return (
                <div
                  key={cat.id}
                  style={{
                    border: "1px solid var(--card-border)",
                    borderRadius: "12px",
                    overflow: "hidden",
                    background: "var(--bg-primary)",
                  }}
                >
                  <div
                    onClick={() =>
                      setExpandedCats((prev) => ({ ...prev, [cat.id]: !prev[cat.id] }))
                    }
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "14px 20px",
                      cursor: "pointer",
                      background: isExpanded ? "var(--bg-secondary)" : "transparent",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                      <div>
                        <span style={{ fontWeight: 700, fontSize: "1rem" }}>{cat.name}</span>
                        <span style={{ color: "var(--text-muted)", marginLeft: 8, fontSize: "0.9rem" }}>
                          ({cat.nameHi})
                        </span>
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                      <span className={styles.tabBadge}>
                        {cat.topics?.length || 0} topics ·{" "}
                        {cat.topics?.reduce((acc, t) => acc + (t.questionCount || 0), 0) || 0} Qs
                      </span>
                    </div>
                  </div>

                  {isExpanded && (
                    <div style={{ padding: "12px 20px", borderTop: "1px solid var(--card-border)" }}>
                      <table className={styles.matrixTable} style={{ margin: 0 }}>
                        <thead>
                          <tr>
                            <th>Topic Name</th>
                            <th>Hindi Name</th>
                            <th>Tags</th>
                            <th style={{ textAlign: "right" }}>Question Count</th>
                          </tr>
                        </thead>
                        <tbody>
                          {cat.topics?.map((topic) => (
                            <tr key={topic.id}>
                              <td style={{ fontWeight: 600 }}>{topic.name}</td>
                              <td style={{ color: "var(--text-secondary)" }}>{topic.nameHi}</td>
                              <td>
                                <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                                  {topic.tags?.map((t, idx) => (
                                    <span
                                      key={idx}
                                      style={{
                                        fontSize: "0.72rem",
                                        padding: "2px 6px",
                                        borderRadius: "4px",
                                        background: "var(--bg-secondary)",
                                      }}
                                    >
                                      {t}
                                    </span>
                                  ))}
                                </div>
                              </td>
                              <td style={{ textAlign: "right", fontWeight: 700 }}>
                                <span
                                  className={`${styles.matrixCountBadge} ${
                                    topic.questionCount >= 15 ? styles.cellGreen : styles.cellRed
                                  }`}
                                >
                                  {topic.questionCount || 0}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ================= TAB 4: COVERAGE MATRIX ================= */}
      {activeTab === "matrix" && (
        <div className={styles.matrixCard}>
          <div style={{ marginBottom: "16px" }}>
            <h2 style={{ fontSize: "1.3rem", fontWeight: 700, margin: 0 }}>
              Question Bank Coverage Matrix (Category × Difficulty)
            </h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", margin: "4px 0 0 0" }}>
              Identifies inventory depth across categories. Green indicates $\ge 20$ questions, Amber 15-19,
              Red indicates &lt; 15 questions (needing more questions for auto sets).
            </p>
          </div>

          {loadingMatrix ? (
            <div className={styles.emptyState}>⏳ Computing coverage matrix...</div>
          ) : (
            <table className={styles.matrixTable}>
              <thead>
                <tr>
                  <th>Category</th>
                  <th style={{ textAlign: "center" }}>Easy (Level 1)</th>
                  <th style={{ textAlign: "center" }}>Medium (Level 2)</th>
                  <th style={{ textAlign: "center" }}>Hard (Level 3)</th>
                  <th style={{ textAlign: "center" }}>Total Questions</th>
                  <th style={{ textAlign: "center" }}>Auto-Set Readiness</th>
                </tr>
              </thead>
              <tbody>
                {matrixData.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <div style={{ fontWeight: 700 }}>{row.name}</div>
                      <div style={{ fontSize: "0.82rem", color: "var(--text-secondary)" }}>{row.nameHi}</div>
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <span
                        className={`${styles.matrixCountBadge} ${
                          row.easy >= 20 ? styles.cellGreen : row.easy >= 10 ? styles.cellAmber : styles.cellRed
                        }`}
                      >
                        {row.easy}
                      </span>
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <span
                        className={`${styles.matrixCountBadge} ${
                          row.medium >= 20
                            ? styles.cellGreen
                            : row.medium >= 10
                            ? styles.cellAmber
                            : styles.cellRed
                        }`}
                      >
                        {row.medium}
                      </span>
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <span
                        className={`${styles.matrixCountBadge} ${
                          row.hard >= 20 ? styles.cellGreen : row.hard >= 10 ? styles.cellAmber : styles.cellRed
                        }`}
                      >
                        {row.hard}
                      </span>
                    </td>
                    <td style={{ textAlign: "center", fontWeight: 700, fontSize: "1rem" }}>{row.total}</td>
                    <td style={{ textAlign: "center" }}>
                      {row.total >= 15 ? (
                        <span
                          style={{
                            fontSize: "0.8rem",
                            fontWeight: 700,
                            padding: "4px 8px",
                            borderRadius: "6px",
                            background: "rgba(16, 185, 129, 0.12)",
                            color: "#059669",
                          }}
                        >
                          Ready ({Math.floor(row.total / 20)} sets)
                        </span>
                      ) : (
                        <span
                          style={{
                            fontSize: "0.8rem",
                            fontWeight: 700,
                            padding: "4px 8px",
                            borderRadius: "6px",
                            background: "rgba(239, 68, 68, 0.12)",
                            color: "#dc2626",
                          }}
                        >
                          Needs {15 - row.total} more
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ================= TAB 5: DUPLICATE FINDER ================= */}
      {activeTab === "duplicates" && (
        <div className={styles.matrixCard}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <div>
              <h2 style={{ fontSize: "1.3rem", fontWeight: 700, margin: 0 }}>Duplicate Question Scanner</h2>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", margin: "4px 0 0 0" }}>
                Scans questions for token overlap &ge; 75% similarity to detect redundant questions
              </p>
            </div>
            <button className={styles.addBtn} onClick={fetchDuplicates} disabled={loadingDuplicates}>
              <RefreshCw size={16} />
              {loadingDuplicates ? "Scanning..." : "Rescan Now"}
            </button>
          </div>

          {loadingDuplicates ? (
            <div className={styles.emptyState}>⏳ Scanning question bank for duplicates...</div>
          ) : duplicates.length === 0 ? (
            <div className={styles.emptyState}>
              <CheckCircle2 size={32} style={{ color: "#10b981", margin: "0 auto 8px auto" }} />
              No duplicate questions found! Your question bank is clean.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {duplicates.map((dup, idx) => (
                <div key={idx} className={styles.duplicatePairCard}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span
                      style={{
                        padding: "3px 8px",
                        borderRadius: "6px",
                        background: "rgba(239, 68, 68, 0.1)",
                        color: "#ef4444",
                        fontSize: "0.8rem",
                        fontWeight: 700,
                      }}
                    >
                      {dup.similarity}% Similarity Match
                    </span>
                  </div>

                  <div className={styles.duplicateGrid}>
                    <div className={styles.duplicateItem}>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: 4 }}>
                        Question A ({dup.q1.id})
                      </div>
                      <div style={{ fontWeight: 600 }}>{dup.q1.text}</div>
                      <button
                        onClick={() => handleDeleteQuestion(dup.q1.id)}
                        style={{
                          marginTop: 8,
                          padding: "4px 8px",
                          borderRadius: "4px",
                          border: "none",
                          background: "#ef4444",
                          color: "#fff",
                          fontSize: "0.75rem",
                          cursor: "pointer",
                        }}
                      >
                        Delete Question A
                      </button>
                    </div>

                    <div className={styles.duplicateItem}>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: 4 }}>
                        Question B ({dup.q2.id})
                      </div>
                      <div style={{ fontWeight: 600 }}>{dup.q2.text}</div>
                      <button
                        onClick={() => handleDeleteQuestion(dup.q2.id)}
                        style={{
                          marginTop: 8,
                          padding: "4px 8px",
                          borderRadius: "4px",
                          border: "none",
                          background: "#ef4444",
                          color: "#fff",
                          fontSize: "0.75rem",
                          cursor: "pointer",
                        }}
                      >
                        Delete Question B
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 6: DIFFICULTY SUGGESTIONS ================= */}
      {activeTab === "suggestions" && (
        <div className={styles.matrixCard}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <div>
              <h2 style={{ fontSize: "1.3rem", fontWeight: 700, margin: 0 }}>
                Accuracy-Based Difficulty Suggestions
              </h2>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", margin: "4px 0 0 0" }}>
                Rule: After 30 attempts, accuracy &gt; 75% = Easy, 40-75% = Medium, &lt; 40% = Hard.
              </p>
            </div>
            {suggestions.length > 0 && (
              <button className={styles.addBtn} onClick={applyAllSuggestions}>
                Apply All {suggestions.length} Suggestions
              </button>
            )}
          </div>

          {loadingSuggestions ? (
            <div className={styles.emptyState}>⏳ Evaluating attempt metrics...</div>
          ) : suggestions.length === 0 ? (
            <div className={styles.emptyState}>
              <CheckCircle2 size={32} style={{ color: "#10b981", margin: "0 auto 8px auto" }} />
              All questions with &ge; 30 attempts have difficulties matching their real-world accuracy!
            </div>
          ) : (
            <table className={styles.matrixTable}>
              <thead>
                <tr>
                  <th>Question Text</th>
                  <th>Attempts</th>
                  <th>Accuracy</th>
                  <th>Current Level</th>
                  <th>Suggested Level</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {suggestions.map((s) => (
                  <tr key={s.id}>
                    <td style={{ fontWeight: 600 }}>{s.text}</td>
                    <td>{s.attempts}</td>
                    <td style={{ fontWeight: 700 }}>{s.accuracy}%</td>
                    <td>
                      <span
                        style={{
                          padding: "4px 8px",
                          borderRadius: "6px",
                          fontSize: "0.8rem",
                          background: "var(--bg-secondary)",
                        }}
                      >
                        {s.currentDifficultyName}
                      </span>
                    </td>
                    <td>
                      <span
                        style={{
                          padding: "4px 8px",
                          borderRadius: "6px",
                          fontSize: "0.8rem",
                          fontWeight: 700,
                          background:
                            s.suggestedLevel === 1
                              ? "rgba(16, 185, 129, 0.12)"
                              : s.suggestedLevel === 2
                              ? "rgba(245, 158, 11, 0.12)"
                              : "rgba(239, 68, 68, 0.12)",
                          color:
                            s.suggestedLevel === 1
                              ? "#059669"
                              : s.suggestedLevel === 2
                              ? "#d97706"
                              : "#dc2626",
                        }}
                      >
                        {s.suggestedDifficultyName}
                      </span>
                    </td>
                    <td>
                      <button
                        className={styles.refreshBtn}
                        onClick={() => applyDifficulty(s.id, s.suggestedLevel)}
                      >
                        Apply {s.suggestedDifficultyName}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ================= TAB 7: ERROR REPORTS INBOX ================= */}
      {activeTab === "reports" && (
        <div className={styles.matrixCard}>
          <div style={{ marginBottom: "16px" }}>
            <h2 style={{ fontSize: "1.3rem", fontWeight: 700, margin: 0 }}>
              &quot;Report an Error&quot; Inbox
            </h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", margin: "4px 0 0 0" }}>
              User feedback and factual error submissions
            </p>
          </div>

          {loadingReports ? (
            <div className={styles.emptyState}>⏳ Loading error reports...</div>
          ) : errorReports.length === 0 ? (
            <div className={styles.emptyState}>
              <CheckCircle2 size={32} style={{ color: "#10b981", margin: "0 auto 8px auto" }} />
              No pending error reports in the inbox!
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {errorReports.map((report) => (
                <div
                  key={report.id}
                  style={{
                    padding: "16px",
                    borderRadius: "12px",
                    border: "1px solid var(--card-border)",
                    background: "var(--bg-primary)",
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span
                      style={{
                        padding: "3px 8px",
                        borderRadius: "6px",
                        fontSize: "0.8rem",
                        fontWeight: 700,
                        background: "rgba(239, 68, 68, 0.1)",
                        color: "#ef4444",
                      }}
                    >
                      Issue: {report.issue}
                    </span>
                    <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                      Reported by {report.reportedBy} on{" "}
                      {new Date(report.reportedAt).toLocaleDateString()}
                    </span>
                  </div>

                  {report.details && (
                    <div style={{ fontSize: "0.9rem", color: "var(--text-secondary)" }}>
                      <strong>User Note:</strong> {report.details}
                    </div>
                  )}

                  {report.question && (
                    <div
                      style={{
                        padding: "10px 14px",
                        borderRadius: "8px",
                        background: "var(--bg-secondary)",
                        fontSize: "0.88rem",
                      }}
                    >
                      <strong>Question:</strong> {report.question.text_hi || report.question.text_en}
                    </div>
                  )}

                  <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
                    <button
                      className={styles.refreshBtn}
                      style={{ background: "#10b981", color: "#fff", borderColor: "#10b981" }}
                      onClick={() => handleResolveReport(report.id, "resolved")}
                    >
                      Mark Resolved
                    </button>
                    <button
                      className={styles.refreshBtn}
                      onClick={() => handleResolveReport(report.id, "dismissed")}
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ================= EDIT / NEW QUESTION MODAL ================= */}
      {editModalOpen && (
        <div className={styles.modalBackdrop} onClick={() => setEditModalOpen(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h2 style={{ fontSize: "1.3rem", fontWeight: 700, margin: 0 }}>
                {editingQuestion?.id === "new" ? "Create New Question" : "Edit Question"}
              </h2>
              <button onClick={() => setEditModalOpen(false)} style={{ background: "none", border: "none", cursor: "pointer" }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={saveEditQuestion} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {/* Category & Topic */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label className={styles.label}>Taxonomy Category</label>
                  <select
                    value={editForm.category_id}
                    onChange={(e) => {
                      setEditForm((f) => ({ ...f, category_id: e.target.value, topic_id: "" }));
                    }}
                    className={styles.select}
                  >
                    <option value="">Select Category...</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={styles.label}>Topic</label>
                  <select
                    value={editForm.topic_id}
                    onChange={(e) => setEditForm((f) => ({ ...f, topic_id: e.target.value }))}
                    disabled={!editForm.category_id}
                    className={styles.select}
                  >
                    <option value="">Select Topic...</option>
                    {editFormTopics.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Hindi & English text */}
              <div>
                <label className={styles.label}>Question Text (Hindi / Devanagari)</label>
                <textarea
                  rows={2}
                  value={editForm.text_hi}
                  onChange={(e) => setEditForm((f) => ({ ...f, text_hi: e.target.value }))}
                  className={styles.textarea}
                  placeholder="प्रश्न हिन्दी में लिखें..."
                />
              </div>

              <div>
                <label className={styles.label}>Question Text (English)</label>
                <textarea
                  rows={2}
                  value={editForm.text_en}
                  onChange={(e) => setEditForm((f) => ({ ...f, text_en: e.target.value }))}
                  className={styles.textarea}
                  placeholder="Question in English (optional)..."
                />
              </div>

              {/* Options & Correct Answer Radio */}
              <div>
                <label className={styles.label}>Options (Select the correct option circle)</label>
                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 4 }}>
                  {editForm.options_list.map((opt, idx) => (
                    <div key={idx} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <input
                        type="radio"
                        name="correctOpt"
                        checked={editForm.correct_index === idx}
                        onChange={() => setEditForm((f) => ({ ...f, correct_index: idx }))}
                      />
                      <input
                        type="text"
                        value={opt}
                        onChange={(e) => {
                          const updated = [...editForm.options_list];
                          updated[idx] = e.target.value;
                          setEditForm((f) => ({ ...f, options_list: updated }));
                        }}
                        className={styles.input}
                        placeholder={`Option ${idx + 1}`}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Difficulty, Status, Audience */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                <div>
                  <label className={styles.label}>Difficulty Level</label>
                  <select
                    value={editForm.difficulty_level}
                    onChange={(e) =>
                      setEditForm((f) => ({ ...f, difficulty_level: parseInt(e.target.value, 10) }))
                    }
                    className={styles.select}
                  >
                    <option value={1}>Easy (Level 1)</option>
                    <option value={2}>Medium (Level 2)</option>
                    <option value={3}>Hard (Level 3)</option>
                  </select>
                </div>

                <div>
                  <label className={styles.label}>Status</label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm((f) => ({ ...f, status: e.target.value }))}
                    className={styles.select}
                  >
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                    <option value="reviewed">Reviewed</option>
                    <option value="flagged">Flagged</option>
                  </select>
                </div>

                <div>
                  <label className={styles.label}>State (Optional)</label>
                  <input
                    type="text"
                    value={editForm.state}
                    onChange={(e) => setEditForm((f) => ({ ...f, state: e.target.value }))}
                    placeholder="e.g. Rajasthan"
                    className={styles.input}
                  />
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className={styles.label}>Tags (comma-separated)</label>
                <input
                  type="text"
                  value={editForm.tags}
                  onChange={(e) => setEditForm((f) => ({ ...f, tags: e.target.value }))}
                  placeholder="history, ancient, indus"
                  className={styles.input}
                />
              </div>

              {/* Explanations */}
              <div>
                <label className={styles.label}>Explanation (Hindi)</label>
                <textarea
                  rows={2}
                  value={editForm.explanation_hi}
                  onChange={(e) => setEditForm((f) => ({ ...f, explanation_hi: e.target.value }))}
                  className={styles.textarea}
                />
              </div>

              <div className={styles.modalActions}>
                <button
                  type="button"
                  className={styles.refreshBtn}
                  onClick={() => setEditModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className={styles.addBtn}>
                  Save Question
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= BULK EDIT MODAL ================= */}
      {bulkModalOpen && (
        <div className={styles.modalBackdrop} onClick={() => setBulkModalOpen(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h2 style={{ fontSize: "1.3rem", fontWeight: 700, margin: 0 }}>
                Bulk Edit ({selectedIds.length} Questions Selected)
              </h2>
              <button onClick={() => setBulkModalOpen(false)} style={{ background: "none", border: "none", cursor: "pointer" }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.88rem", margin: 0 }}>
                Only the fields you set below will be modified across all {selectedIds.length} selected questions.
              </p>

              <div>
                <label className={styles.label}>Move to Category</label>
                <select
                  value={bulkUpdates.category_id}
                  onChange={(e) =>
                    setBulkUpdates((b) => ({ ...b, category_id: e.target.value, topic_id: "" }))
                  }
                  className={styles.select}
                >
                  <option value="">No Change</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={styles.label}>Set Difficulty</label>
                <select
                  value={bulkUpdates.difficulty_level}
                  onChange={(e) => setBulkUpdates((b) => ({ ...b, difficulty_level: e.target.value }))}
                  className={styles.select}
                >
                  <option value="">No Change</option>
                  <option value="1">Easy (Level 1)</option>
                  <option value="2">Medium (Level 2)</option>
                  <option value="3">Hard (Level 3)</option>
                </select>
              </div>

              <div>
                <label className={styles.label}>Set Status</label>
                <select
                  value={bulkUpdates.status}
                  onChange={(e) => setBulkUpdates((b) => ({ ...b, status: e.target.value }))}
                  className={styles.select}
                >
                  <option value="">No Change</option>
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                  <option value="reviewed">Reviewed</option>
                  <option value="flagged">Flagged</option>
                </select>
              </div>

              <div>
                <label className={styles.label}>Add Tags (comma-separated)</label>
                <input
                  type="text"
                  placeholder="e.g. ssc, 2026, rev1"
                  value={bulkUpdates.addTags}
                  onChange={(e) => setBulkUpdates((b) => ({ ...b, addTags: e.target.value }))}
                  className={styles.input}
                />
              </div>

              <div className={styles.modalActions}>
                <button
                  type="button"
                  className={styles.refreshBtn}
                  onClick={() => setBulkModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="button" className={styles.addBtn} onClick={executeBulkEdit}>
                  Apply Bulk Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
