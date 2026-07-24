"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { useAdmin } from "@/context/AdminContext";
import styles from "@/styles/AdminCurrentAffairs.module.css";
import toast, { Toaster } from "react-hot-toast";

async function submitPending(type, payload) {
  const res = await fetch("/api/admin/pending", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type, payload }),
  });
  return res.ok;
}

function normalizeString(v) {
  return String(v || "").trim();
}

function getTodayDateString() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatDate(d) {
  if (!d) return "";
  try {
    const [y, m, day] = String(d).split("-");
    const dt = new Date(Number(y), Number(m) - 1, Number(day));
    return dt.toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return d;
  }
}

const DEFAULT_CATEGORIES = [
  { id: "cat-national", name: "National", emoji: "🇮🇳", hidden: false },
  { id: "cat-international", name: "International", emoji: "🌍", hidden: false },
  { id: "cat-economy", name: "Economy & Banking", emoji: "💰", hidden: false },
  { id: "cat-sports", name: "Sports & Awards", emoji: "🏆", hidden: false },
  { id: "cat-science", name: "Science & Tech", emoji: "🔬", hidden: false },
  { id: "cat-defense", name: "Defense & Security", emoji: "🛡️", hidden: false },
  { id: "cat-state", name: "State GK", emoji: "🏛️", hidden: false },
  { id: "cat-appointments", name: "Appointments", emoji: "👤", hidden: false },
];

const EMPTY_ARTICLE_ITEM = () => ({
  tempId: Math.random().toString(36).substring(2, 9),
  category: "National",
  heading: "",
  oneLiner: "",
  description: "",
  image: "",
  hidden: false
});

export default function AdminCurrentAffairsPage() {
  const { adminUser } = useAdmin();
  const isMaster = adminUser?.role === "master";
  const allowed = adminUser?.role === "master" || adminUser?.permissions?.currentAffairs !== false;

  const [items, setItems] = useState([]);
  const [categoriesList, setCategoriesList] = useState(DEFAULT_CATEGORIES);
  const [months, setMonths] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedDate, setSelectedDate] = useState(() => getTodayDateString());
  const [searchQuery, setSearchQuery] = useState("");
  const [showHidden, setShowHidden] = useState(true);

  const [editing, setEditing] = useState(null); // null, "new", or item.id
  const [showBulk, setShowBulk] = useState(false);
  const [showCatManager, setShowCatManager] = useState(false);
  const [msg, setMsg] = useState("");

  // Category Edit / Add State
  const [editingCat, setEditingCat] = useState(null); // null or cat object
  const [newCatForm, setNewCatForm] = useState({ name: "", emoji: "📰", hidden: false });

  // Single Article Form State (for Editing existing item)
  const [singleForm, setSingleForm] = useState({
    id: "",
    date: "",
    category: "National",
    heading: "",
    description: "",
    oneLiner: "",
    image: "",
    hidden: false
  });

  // Multi-Article Batch Creation State
  const [batchDate, setBatchDate] = useState(() => getTodayDateString());
  const [batchDefaultCategory, setBatchDefaultCategory] = useState("National");
  const [multiArticles, setMultiArticles] = useState([EMPTY_ARTICLE_ITEM()]);

  const fileInputRef = useRef(null);
  const [bulkData, setBulkData] = useState(null);
  const [uploading, setUploading] = useState(false);

  const query = useMemo(() => {
    const params = new URLSearchParams();
    if (selectedCategory && selectedCategory !== "all") params.set("category", selectedCategory);
    if (selectedDate) params.set("date", selectedDate);
    if (!selectedDate && selectedMonth) params.set("month", selectedMonth);
    return params.toString();
  }, [selectedCategory, selectedDate, selectedMonth]);

  const exportHref = useMemo(() => `/current-affairs/export?${query}`, [query]);

  // Fetch Categories List
  const fetchCategoriesList = async () => {
    try {
      const res = await fetch('/api/admin/current-affairs/categories');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.categories) && data.categories.length > 0) {
          setCategoriesList(data.categories);
        }
      }
    } catch (err) {
      console.error("Fetch categories error:", err);
    }
  };

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/current-affairs?${query}`, { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      setItems(Array.isArray(data.items) ? data.items : []);
      setMonths(Array.isArray(data.months) ? data.months : []);
    } catch (err) {
      console.error("Fetch current affairs error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!allowed) return;
    fetchItems();
    fetchCategoriesList();
  }, [allowed, query]);

  // Category Emoji Map
  const categoryEmojiMap = useMemo(() => {
    const map = {};
    categoriesList.forEach(c => {
      map[c.name] = c.emoji || "📰";
    });
    return map;
  }, [categoriesList]);

  // Filtered Items (respecting search, category, hidden)
  const visibleItems = useMemo(() => {
    let list = items;
    if (!showHidden) {
      list = list.filter((x) => !x.hidden);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((x) =>
        (x.heading || "").toLowerCase().includes(q) ||
        (x.description || "").toLowerCase().includes(q) ||
        (x.oneLiner || "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [items, showHidden, searchQuery]);

  // Today items count
  const todayCount = useMemo(() => {
    const todayStr = getTodayDateString();
    return items.filter((x) => x.date === todayStr).length;
  }, [items]);

  // Hidden count
  const hiddenCount = useMemo(() => {
    return items.filter((x) => x.hidden).length;
  }, [items]);

  // Open Create Multi-Article Modal
  const openCreate = () => {
    setMsg("");
    setEditing("new");
    const activeCat = selectedCategory !== "all" ? selectedCategory : (categoriesList[0]?.name || "National");
    setBatchDate(selectedDate || getTodayDateString());
    setBatchDefaultCategory(activeCat);
    setMultiArticles([{ ...EMPTY_ARTICLE_ITEM(), category: activeCat }]);
  };

  // Open Edit Single Article Modal
  const openEdit = (it) => {
    setMsg("");
    setEditing(it.id);
    setSingleForm({ ...it });
  };

  // Add another article block to batch
  const handleAddArticleBlock = () => {
    setMultiArticles((prev) => [
      ...prev,
      { ...EMPTY_ARTICLE_ITEM(), category: batchDefaultCategory }
    ]);
  };

  // Remove article block from batch
  const handleRemoveArticleBlock = (index) => {
    if (multiArticles.length <= 1) return;
    setMultiArticles((prev) => prev.filter((_, idx) => idx !== index));
  };

  // Update specific field in article block
  const handleUpdateArticleBlock = (index, field, value) => {
    setMultiArticles((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  // Upload image for a specific article block
  const handleArticleBlockImageUpload = async (index, file) => {
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await fetch('/api/upload/image', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        handleUpdateArticleBlock(index, 'image', result.url);
        toast.success(`Image uploaded for Article #${index + 1}!`);
      } else {
        toast.error('Failed to upload image');
      }
    } catch (error) {
      toast.error('Upload error');
    }
  };

  // Category CRUD Handlers
  const handleCreateCategory = async (e) => {
    e.preventDefault();
    if (!newCatForm.name.trim()) {
      toast.error("Category name is required");
      return;
    }
    try {
      const res = await fetch('/api/admin/current-affairs/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCatForm)
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Category created successfully!");
        setNewCatForm({ name: "", emoji: "📰", hidden: false });
        await fetchCategoriesList();
      } else {
        toast.error(data.error || "Failed to create category");
      }
    } catch (err) {
      toast.error("Error creating category");
    }
  };

  const handleUpdateCategory = async (catObj, updates) => {
    try {
      const res = await fetch('/api/admin/current-affairs/categories', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: catObj.id, ...updates })
      });
      if (res.ok) {
        toast.success("Category updated!");
        setEditingCat(null);
        await fetchCategoriesList();
        await fetchItems();
      } else {
        toast.error("Failed to update category");
      }
    } catch (err) {
      toast.error("Error updating category");
    }
  };

  const handleDeleteCategory = async (catObj) => {
    if (!confirm(`Are you sure you want to delete category "${catObj.name}"?`)) return;
    try {
      const res = await fetch(`/api/admin/current-affairs/categories?id=${catObj.id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        toast.success("Category deleted!");
        await fetchCategoriesList();
      } else {
        toast.error("Failed to delete category");
      }
    } catch (err) {
      toast.error("Error deleting category");
    }
  };

  const handleToggleCategoryHidden = async (catObj) => {
    const newHidden = !catObj.hidden;
    const updateAllArticles = confirm(
      newHidden
        ? `Hide category "${catObj.name}"? Do you also want to hide all current affair articles under this category?`
        : `Unhide category "${catObj.name}"? Do you also want to unhide all current affair articles under this category?`
    );

    try {
      const res = await fetch('/api/admin/current-affairs/categories', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: catObj.id,
          hidden: newHidden,
          toggleArticlesHidden: updateAllArticles ? true : undefined
        })
      });
      if (res.ok) {
        toast.success(newHidden ? `Category "${catObj.name}" hidden` : `Category "${catObj.name}" visible`);
        await fetchCategoriesList();
        await fetchItems();
      }
    } catch (err) {
      toast.error("Failed to toggle category hidden status");
    }
  };

  // Save Single Article Edit
  const saveSingle = async () => {
    setMsg("");
    const date = normalizeString(singleForm.date);
    const heading = normalizeString(singleForm.heading);
    const description = normalizeString(singleForm.description);
    const oneLiner = normalizeString(singleForm.oneLiner);
    const category = normalizeString(singleForm.category) || "National";

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) { setMsg("Invalid date format"); return; }
    if (!heading) { setMsg("Heading is required"); return; }
    if (!description) { setMsg("Description is required"); return; }

    if (isMaster) {
      const res = await fetch(`/api/admin/current-affairs/${singleForm.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...singleForm, category, date, heading, description, oneLiner }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setMsg(data.error || "Failed to save");
        return;
      }
      setEditing(null);
      toast.success("Current affair updated!");
      await fetchItems();
    } else {
      const ok = await submitPending("update_current_affair", {
        entityType: "currentAffair",
        entityId: singleForm.id,
        ...singleForm, date, category, heading, description, oneLiner
      });
      setEditing(null);
      if (ok) toast.success("Submitted for admin approval");
      else toast.error("Failed to submit");
    }
  };

  // Save Multi-Article Batch Creation
  const saveMultiBatch = async () => {
    setMsg("");
    const date = normalizeString(batchDate);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      setMsg("Invalid batch date format (YYYY-MM-DD)");
      return;
    }

    const validArticles = [];
    for (let i = 0; i < multiArticles.length; i++) {
      const art = multiArticles[i];
      const heading = normalizeString(art.heading);
      const description = normalizeString(art.description);
      const oneLiner = normalizeString(art.oneLiner);
      const category = normalizeString(art.category) || batchDefaultCategory || "National";

      if (!heading || !description) {
        setMsg(`Article #${i + 1} requires both a Headline and Description.`);
        return;
      }

      validArticles.push({
        date,
        category,
        heading,
        oneLiner,
        description,
        image: art.image || "",
        hidden: !!art.hidden
      });
    }

    if (validArticles.length === 0) {
      setMsg("Please add at least one valid article.");
      return;
    }

    if (isMaster) {
      const res = await fetch("/api/admin/current-affairs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, category: batchDefaultCategory, items: validArticles }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setMsg(data.error || "Failed to publish batch");
        return;
      }

      setEditing(null);
      toast.success(`Published ${validArticles.length} current affairs for ${formatDate(date)}! 🎉`);
      await fetchItems();
    } else {
      let successCount = 0;
      for (const art of validArticles) {
        const ok = await submitPending("create_current_affair", {
          entityType: "currentAffair",
          ...art
        });
        if (ok) successCount++;
      }
      setEditing(null);
      toast.success(`Submitted ${successCount} articles for approval`);
      await fetchItems();
    }
  };

  const remove = async (it) => {
    if (!confirm("Are you sure you want to delete this current affair update?")) return;
    if (isMaster) {
      const res = await fetch(`/api/admin/current-affairs/${it.id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Deleted successfully!");
        await fetchItems();
      } else {
        toast.error("Failed to delete item");
      }
    } else {
      const ok = await submitPending("delete_current_affair", { entityType: "currentAffair", entityId: it.id, id: it.id });
      if (ok) toast.success("Submitted for approval");
      else toast.error("Failed to submit");
    }
  };

  const toggleHidden = async (it) => {
    if (isMaster) {
      await fetch(`/api/admin/current-affairs/${it.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hidden: !it.hidden }),
      });
      toast.success(it.hidden ? "Article is now Live" : "Article is now Hidden");
      await fetchItems();
    } else {
      await submitPending("update_current_affair", { entityType: "currentAffair", entityId: it.id, id: it.id, hidden: !it.hidden });
    }
  };

  const downloadTemplate = async () => {
    const XLSX = await import("xlsx");
    const data = [
      { Heading: "ISRO Launches New Navigation Satellite", Description: "ISRO successfully placed the new generation navigation satellite into orbit from Sriharikota." },
      { Heading: "India Wins Asian Hockey Champions Trophy", Description: "The Indian hockey team defeated Malaysia 4-3 in a thrilling final match." },
    ];
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Current Affairs");
    XLSX.writeFile(wb, "current-affairs-template.xlsx");
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const XLSX = await import("xlsx");
    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target.result;
      const wb = XLSX.read(bstr, { type: "binary" });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws);
      setBulkData(data);
    };
    reader.readAsBinaryString(file);
  };

  const processBulkUpload = async () => {
    if (!bulkData || bulkData.length === 0) return;
    setUploading(true);
    try {
      const res = await fetch("/api/admin/current-affairs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: selectedDate,
          category: selectedCategory !== "all" ? selectedCategory : "National",
          items: bulkData.map(d => ({ heading: d.Heading, description: d.Description }))
        }),
      });
      const result = await res.json();
      if (res.ok) {
        toast.success(`Successfully uploaded ${result.count || bulkData.length} items!`);
        setShowBulk(false);
        setBulkData(null);
        await fetchItems();
      } else {
        toast.error(result.error || "Upload failed");
      }
    } catch (err) {
      toast.error("An error occurred during bulk upload.");
    } finally {
      setUploading(false);
    }
  };

  if (!allowed) return <div className={styles.page}><p className={styles.emptyTitle}>Access denied.</p></div>;

  return (
    <div className={styles.page}>
      <Toaster position="top-right" />

      {/* Header Banner */}
      <div className={styles.headerRow}>
        <div className={styles.headerTitleGroup}>
          <div className={styles.badgeHeader}>
            <span>📰 DAILY CURRENT AFFAIRS & GK HUB</span>
          </div>
          <h1 className={styles.title}>Current Affairs & Daily GK</h1>
          <p className={styles.subtitle}>
            Create, edit, tag, export and manage daily exam-focused news updates & categories.
          </p>
        </div>

        <div className={styles.actionButtonsGroup}>
          <button className={styles.secondaryBtn} onClick={() => setShowCatManager(true)}>
            <span>🏷️ Categories ({categoriesList.length})</span>
          </button>
          <button className={styles.secondaryBtn} onClick={() => setShowBulk(true)}>
            <span>📤 Bulk Import</span>
          </button>
          <a className={styles.secondaryBtn} href={exportHref} target="_blank" rel="noreferrer">
            <span>📥 Export Excel</span>
          </a>
          <button className={styles.primaryBtn} onClick={openCreate}>
            <span>⚡ + Post Current Affairs</span>
          </button>
        </div>
      </div>

      {/* KPI Overview Bar */}
      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <div className={styles.kpiIcon} style={{ background: "rgba(99, 102, 241, 0.12)", color: "#6366f1" }}>📰</div>
          <div className={styles.kpiContent}>
            <div className={styles.kpiValue}>{items.length}</div>
            <div className={styles.kpiLabel}>Total News Updates</div>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiIcon} style={{ background: "rgba(16, 185, 129, 0.12)", color: "#10b981" }}>📅</div>
          <div className={styles.kpiContent}>
            <div className={styles.kpiValue}>{todayCount}</div>
            <div className={styles.kpiLabel}>Today's Updates ({formatDate(getTodayDateString())})</div>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiIcon} style={{ background: "rgba(168, 85, 247, 0.12)", color: "#a855f7" }}>🏷️</div>
          <div className={styles.kpiContent}>
            <div className={styles.kpiValue}>{categoriesList.length}</div>
            <div className={styles.kpiLabel}>Active Categories</div>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiIcon} style={{ background: "rgba(245, 158, 11, 0.12)", color: "#f59e0b" }}>👁️</div>
          <div className={styles.kpiContent}>
            <div className={styles.kpiValue}>{hiddenCount}</div>
            <div className={styles.kpiLabel}>Hidden / Drafts</div>
          </div>
        </div>
      </div>

      {/* Category Quick Tabs */}
      <div className={styles.categoryTabsRow}>
        <button
          className={`${styles.categoryTab} ${selectedCategory === 'all' ? styles.categoryTabActive : ''}`}
          onClick={() => setSelectedCategory('all')}
        >
          <span>✨ All Categories</span>
        </button>
        {categoriesList.map((cat) => {
          const emoji = cat.emoji || "📰";
          const isActive = (selectedCategory === cat.name);
          return (
            <button
              key={cat.id || cat.name}
              className={`${styles.categoryTab} ${isActive ? styles.categoryTabActive : ''} ${cat.hidden ? styles.articleCardHidden : ''}`}
              onClick={() => setSelectedCategory(cat.name)}
            >
              <span>{emoji} {cat.name} {cat.hidden ? '(Hidden)' : ''}</span>
            </button>
          );
        })}
      </div>

      {/* Filter Controls Bar */}
      <div className={styles.filtersBar}>
        <div className={styles.filterControlsGroup}>
          <div className={styles.filterField}>
            <span className={styles.filterLabel}>Date:</span>
            <input
              type="date"
              className={styles.inputControl}
              value={selectedDate}
              max={getTodayDateString()}
              onChange={(e) => {
                setSelectedDate(e.target.value);
                if (e.target.value) setSelectedMonth("");
              }}
            />
            <button
              type="button"
              className={styles.todayQuickBtn}
              onClick={() => {
                setSelectedDate(getTodayDateString());
                setSelectedMonth("");
              }}
            >
              Today
            </button>
          </div>

          <div className={styles.filterField}>
            <span className={styles.filterLabel}>Month:</span>
            <select
              className={styles.inputControl}
              value={selectedMonth}
              onChange={(e) => {
                setSelectedMonth(e.target.value);
                if (e.target.value) setSelectedDate("");
              }}
            >
              <option value="">All Months</option>
              {months.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>

          <div className={styles.filterField} style={{ flex: 1, minWidth: "200px" }}>
            <input
              type="text"
              className={styles.inputControl}
              style={{ width: "100%" }}
              placeholder="🔍 Search news headline or keyword..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <label className={styles.toggleSwitch}>
          <input
            type="checkbox"
            checked={showHidden}
            onChange={(e) => setShowHidden(e.target.checked)}
          />
          <span>Show Hidden Items</span>
        </label>
      </div>

      {/* CATEGORY MANAGEMENT DRAWER MODAL */}
      {showCatManager && (
        <div className={styles.sidePanelOverlay}>
          <div className={styles.sidePanel}>
            <div className={styles.sidePanelHeader}>
              <h2>🏷️ Current Affairs Categories Manager</h2>
              <button className={styles.closeBtn} onClick={() => setShowCatManager(false)}>✕</button>
            </div>

            <div className={styles.sidePanelContent}>
              {/* Form to Add New Category */}
              <div style={{ background: "rgba(99, 102, 241, 0.06)", border: "1px solid rgba(99, 102, 241, 0.18)", borderRadius: "14px", padding: "16px" }}>
                <h4 style={{ margin: "0 0 10px", fontSize: "0.95rem", fontWeight: 800, color: "#6366f1" }}>
                  ➕ Create New Category
                </h4>
                <form onSubmit={handleCreateCategory} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <div className={styles.formGrid2}>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Emoji Icon</label>
                      <input
                        type="text"
                        className={styles.formInput}
                        value={newCatForm.emoji}
                        onChange={(e) => setNewCatForm({ ...newCatForm, emoji: e.target.value })}
                        placeholder="e.g. 🇮🇳 or 🏆"
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Category Name</label>
                      <input
                        type="text"
                        className={styles.formInput}
                        value={newCatForm.name}
                        onChange={(e) => setNewCatForm({ ...newCatForm, name: e.target.value })}
                        placeholder="e.g. Environment & Climate"
                        required
                      />
                    </div>
                  </div>

                  <button type="submit" className={styles.primaryBtn} style={{ justifyContent: "center" }}>
                    <span>Save Category</span>
                  </button>
                </form>
              </div>

              {/* List of Existing Categories */}
              <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "10px" }}>
                <h4 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 800 }}>
                  Active Categories ({categoriesList.length})
                </h4>

                {categoriesList.map((cat) => (
                  <div
                    key={cat.id || cat.name}
                    style={{
                      background: cat.hidden ? "var(--bg-secondary, #f8fafc)" : "var(--bg-primary, #ffffff)",
                      border: "1px solid var(--card-border, #cbd5e1)",
                      borderRadius: "12px",
                      padding: "12px 16px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      opacity: cat.hidden ? 0.7 : 1
                    }}
                  >
                    {editingCat?.id === cat.id ? (
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1 }}>
                        <input
                          type="text"
                          style={{ width: "50px", padding: "4px 8px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                          value={editingCat.emoji}
                          onChange={(e) => setEditingCat({ ...editingCat, emoji: e.target.value })}
                        />
                        <input
                          type="text"
                          style={{ flex: 1, padding: "4px 8px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                          value={editingCat.name}
                          onChange={(e) => setEditingCat({ ...editingCat, name: e.target.value })}
                        />
                        <button
                          type="button"
                          className={styles.primaryBtn}
                          style={{ padding: "4px 10px", fontSize: "0.78rem" }}
                          onClick={() => handleUpdateCategory(cat, { name: editingCat.name, emoji: editingCat.emoji })}
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          className={styles.secondaryBtn}
                          style={{ padding: "4px 10px", fontSize: "0.78rem" }}
                          onClick={() => setEditingCat(null)}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <span style={{ fontSize: "1.3rem" }}>{cat.emoji || "📰"}</span>
                          <div>
                            <strong style={{ fontSize: "0.92rem", color: "var(--text-primary)" }}>{cat.name}</strong>
                            <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                              {cat.count !== undefined ? `${cat.count} Articles` : ''}
                            </div>
                          </div>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <button
                            type="button"
                            className={styles.actionBtn}
                            onClick={() => setEditingCat({ ...cat })}
                          >
                            ✏️ Edit
                          </button>

                          <button
                            type="button"
                            className={styles.actionBtn}
                            onClick={() => handleToggleCategoryHidden(cat)}
                          >
                            {cat.hidden ? "👁️ Show" : "🙈 Hide"}
                          </button>

                          <button
                            type="button"
                            className={styles.actionBtnDelete}
                            onClick={() => handleDeleteCategory(cat)}
                          >
                            🗑️
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.sidePanelActions}>
              <button className={styles.secondaryBtn} onClick={() => setShowCatManager(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Side Drawer Modal for Add (Multi-Article) or Edit (Single Article) */}
      {editing && (
        <div className={styles.sidePanelOverlay}>
          <div className={styles.sidePanel}>
            <div className={styles.sidePanelHeader}>
              <h2>
                {editing === "new"
                  ? `⚡ Post Current Affairs Batch (${multiArticles.length} ${multiArticles.length === 1 ? 'Article' : 'Articles'})`
                  : "✏️ Edit Current Affair Article"}
              </h2>
              <button className={styles.closeBtn} onClick={() => setEditing(null)}>✕</button>
            </div>

            <div className={styles.sidePanelContent}>
              {msg && (
                <div style={{ background: "rgba(244, 63, 94, 0.12)", color: "#f43f5e", padding: "10px 14px", borderRadius: "10px", fontWeight: 700, fontSize: "0.85rem" }}>
                  ⚠️ {msg}
                </div>
              )}

              {/* MODE 1: EDIT SINGLE EXISTING ARTICLE */}
              {editing !== "new" && (
                <>
                  <div className={styles.formGrid2}>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Publish Date</label>
                      <input
                        type="date"
                        className={styles.formInput}
                        value={singleForm.date}
                        max={getTodayDateString()}
                        onChange={(e) => setSingleForm((p) => ({ ...p, date: e.target.value }))}
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Category</label>
                      <select
                        className={styles.formSelect}
                        value={singleForm.category}
                        onChange={(e) => setSingleForm((p) => ({ ...p, category: e.target.value }))}
                      >
                        {categoriesList.map((c) => (
                          <option key={c.id || c.name} value={c.name}>{(c.emoji || "📰") + " " + c.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>News Headline / Title</label>
                    <input
                      type="text"
                      className={styles.formInput}
                      value={singleForm.heading}
                      onChange={(e) => setSingleForm((p) => ({ ...p, heading: e.target.value }))}
                      placeholder="e.g. India Successfully Tests Agni-V Missile..."
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Exam One-Liner Summary (Optional)</label>
                    <input
                      type="text"
                      className={styles.formInput}
                      value={singleForm.oneLiner || ""}
                      onChange={(e) => setSingleForm((p) => ({ ...p, oneLiner: e.target.value }))}
                      placeholder="Key 1-line exam takeaway for fast revision..."
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Detailed Description & Notes</label>
                    <textarea
                      rows={6}
                      className={styles.formTextarea}
                      value={singleForm.description}
                      onChange={(e) => setSingleForm((p) => ({ ...p, description: e.target.value }))}
                      placeholder="Write comprehensive details, historical background, key statistics, and exam points..."
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Cover Image (Upload or Image URL)</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files[0];
                        if (!file) return;
                        const formData = new FormData();
                        formData.append('file', file);
                        const res = await fetch('/api/upload/image', { method: 'POST', body: formData });
                        if (res.ok) {
                          const result = await res.json();
                          setSingleForm((p) => ({ ...p, image: result.url }));
                          toast.success('Image uploaded!');
                        }
                      }}
                      style={{ fontSize: "0.85rem" }}
                    />
                    {singleForm.image && (
                      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "8px" }}>
                        <img src={singleForm.image} alt="Preview" style={{ width: "100px", height: "65px", borderRadius: "8px", objectFit: "cover", border: "1px solid #cbd5e1" }} />
                        <button
                          type="button"
                          onClick={() => setSingleForm((p) => ({ ...p, image: "" }))}
                          style={{ background: "rgba(244, 63, 94, 0.1)", color: "#f43f5e", border: "none", padding: "4px 10px", borderRadius: "6px", fontSize: "0.78rem", fontWeight: 700, cursor: "pointer" }}
                        >
                          Remove
                        </button>
                      </div>
                    )}
                  </div>

                  <label className={styles.toggleSwitch}>
                    <input
                      type="checkbox"
                      checked={!!singleForm.hidden}
                      onChange={(e) => setSingleForm((p) => ({ ...p, hidden: e.target.checked }))}
                    />
                    <span>Hide from public Customer App</span>
                  </label>
                </>
              )}

              {/* MODE 2: MULTI-ARTICLE BATCH CREATION */}
              {editing === "new" && (
                <>
                  {/* Global Batch Controls */}
                  <div style={{ background: "rgba(99, 102, 241, 0.06)", border: "1px solid rgba(99, 102, 241, 0.15)", borderRadius: "14px", padding: "14px 18px" }}>
                    <div style={{ fontSize: "0.78rem", fontWeight: 800, color: "#6366f1", textTransform: "uppercase", marginBottom: "8px" }}>
                      📅 Batch Settings for Today / Publish Date
                    </div>
                    <div className={styles.formGrid2}>
                      <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Publish Date</label>
                        <input
                          type="date"
                          className={styles.formInput}
                          value={batchDate}
                          max={getTodayDateString()}
                          onChange={(e) => setBatchDate(e.target.value)}
                        />
                      </div>

                      <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Default Category</label>
                        <select
                          className={styles.formSelect}
                          value={batchDefaultCategory}
                          onChange={(e) => {
                            setBatchDefaultCategory(e.target.value);
                            setMultiArticles((prev) => prev.map((art) => ({ ...art, category: e.target.value })));
                          }}
                        >
                          {categoriesList.map((c) => (
                            <option key={c.id || c.name} value={c.name}>{(c.emoji || "📰") + " " + c.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* List of Dynamic Article Form Blocks */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    {multiArticles.map((art, idx) => (
                      <div key={art.tempId || idx} className={styles.batchBlockCard}>
                        <div className={styles.batchBlockHeader}>
                          <span className={styles.batchBlockTitle}>
                            📰 Article #{idx + 1}
                          </span>
                          {multiArticles.length > 1 && (
                            <button
                              type="button"
                              className={styles.removeBlockBtn}
                              onClick={() => handleRemoveArticleBlock(idx)}
                            >
                              🗑️ Remove Article #{idx + 1}
                            </button>
                          )}
                        </div>

                        <div className={styles.formGrid2}>
                          <div className={styles.formGroup}>
                            <label className={styles.formLabel}>Category</label>
                            <select
                              className={styles.formSelect}
                              value={art.category}
                              onChange={(e) => handleUpdateArticleBlock(idx, "category", e.target.value)}
                            >
                              {categoriesList.map((c) => (
                                <option key={c.id || c.name} value={c.name}>{(c.emoji || "📰") + " " + c.name}</option>
                              ))}
                            </select>
                          </div>

                          <div className={styles.formGroup}>
                            <label className={styles.formLabel}>Status</label>
                            <label className={styles.toggleSwitch} style={{ height: "42px" }}>
                              <input
                                type="checkbox"
                                checked={!!art.hidden}
                                onChange={(e) => handleUpdateArticleBlock(idx, "hidden", e.target.checked)}
                              />
                              <span>Hidden Draft</span>
                            </label>
                          </div>
                        </div>

                        <div className={styles.formGroup}>
                          <label className={styles.formLabel}>News Headline / Title *</label>
                          <input
                            type="text"
                            className={styles.formInput}
                            value={art.heading}
                            onChange={(e) => handleUpdateArticleBlock(idx, "heading", e.target.value)}
                            placeholder={`Headline for Article #${idx + 1}...`}
                          />
                        </div>

                        <div className={styles.formGroup}>
                          <label className={styles.formLabel}>Exam One-Liner Summary (Optional)</label>
                          <input
                            type="text"
                            className={styles.formInput}
                            value={art.oneLiner}
                            onChange={(e) => handleUpdateArticleBlock(idx, "oneLiner", e.target.value)}
                            placeholder="Key 1-line exam takeaway..."
                          />
                        </div>

                        <div className={styles.formGroup}>
                          <label className={styles.formLabel}>Detailed Description & Notes *</label>
                          <textarea
                            rows={4}
                            className={styles.formTextarea}
                            value={art.description}
                            onChange={(e) => handleUpdateArticleBlock(idx, "description", e.target.value)}
                            placeholder="Write comprehensive details, statistics, and exam notes..."
                          />
                        </div>

                        <div className={styles.formGroup}>
                          <label className={styles.formLabel}>Cover Image (Upload file or Image URL)</label>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleArticleBlockImageUpload(idx, e.target.files[0])}
                            style={{ fontSize: "0.85rem" }}
                          />
                          {art.image && (
                            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "6px" }}>
                              <img src={art.image} alt="Preview" style={{ width: "80px", height: "50px", borderRadius: "6px", objectFit: "cover" }} />
                              <button
                                type="button"
                                onClick={() => handleUpdateArticleBlock(idx, "image", "")}
                                style={{ background: "rgba(244, 63, 94, 0.1)", color: "#f43f5e", border: "none", padding: "2px 8px", borderRadius: "4px", fontSize: "0.75rem", fontWeight: 700, cursor: "pointer" }}
                              >
                                Clear
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* PLUS BUTTON TO ADD ANOTHER ARTICLE TO BATCH */}
                  <button
                    type="button"
                    className={styles.addMoreBtn}
                    onClick={handleAddArticleBlock}
                  >
                    <span>➕ Add Another Article Block (+ Add More)</span>
                  </button>
                </>
              )}
            </div>

            <div className={styles.sidePanelActions}>
              <button className={styles.secondaryBtn} onClick={() => setEditing(null)}>Cancel</button>

              {editing === "new" ? (
                <button className={styles.primaryBtn} onClick={saveMultiBatch}>
                  <span>💾 Save & Publish All ({multiArticles.length} {multiArticles.length === 1 ? 'Article' : 'Articles'})</span>
                </button>
              ) : (
                <button className={styles.primaryBtn} onClick={saveSingle}>
                  <span>💾 Save & Update Article</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Bulk Upload Drawer Modal */}
      {showBulk && (
        <div className={styles.sidePanelOverlay}>
          <div className={styles.sidePanel}>
            <div className={styles.sidePanelHeader}>
              <h2>📤 Excel Bulk Upload</h2>
              <button className={styles.closeBtn} onClick={() => { setShowBulk(false); setBulkData(null); }}>✕</button>
            </div>

            <div className={styles.sidePanelContent}>
              <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)" }}>
                Upload multiple current affairs items for <strong>{formatDate(selectedDate)}</strong> in category <strong>{selectedCategory !== "all" ? selectedCategory : "National"}</strong>.
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <button className={styles.secondaryBtn} onClick={downloadTemplate} style={{ justifyContent: "center" }}>
                  <span>📋 Download Excel Template (.xlsx)</span>
                </button>

                <button className={styles.primaryBtn} onClick={() => fileInputRef.current.click()} style={{ justifyContent: "center" }}>
                  <span>📁 Select Excel File</span>
                </button>
                <input type="file" ref={fileInputRef} hidden accept=".xlsx,.xls" onChange={handleFileUpload} />
              </div>

              {bulkData && (
                <div style={{ background: "rgba(99, 102, 241, 0.08)", border: "1px solid rgba(99, 102, 241, 0.2)", borderRadius: "12px", padding: "16px", marginTop: "12px" }}>
                  <h4 style={{ margin: "0 0 6px", fontSize: "0.95rem", fontWeight: 800 }}>Ready to Import</h4>
                  <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                    Found <strong>{bulkData.length}</strong> items in file.
                  </p>
                  <button
                    className={styles.primaryBtn}
                    style={{ width: "100%", marginTop: "14px", justifyContent: "center" }}
                    onClick={processBulkUpload}
                    disabled={uploading}
                  >
                    <span>{uploading ? "Uploading..." : `Process Upload (${bulkData.length} Items)`}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Articles Feed */}
      {loading ? (
        <div className={styles.emptyStateCard}>
          <div className={styles.emptyIcon}>⏳</div>
          <h3 className={styles.emptyTitle}>Loading Current Affairs...</h3>
        </div>
      ) : visibleItems.length === 0 ? (
        <div className={styles.emptyStateCard}>
          <div className={styles.emptyIcon}>🗞️</div>
          <h3 className={styles.emptyTitle}>No Current Affairs Found</h3>
          <p className={styles.emptyText}>
            No news updates available for the selected filters. Click below to add today's first update!
          </p>
          <button className={styles.primaryBtn} onClick={openCreate} style={{ marginTop: "8px" }}>
            <span>⚡ + Post Current Affairs</span>
          </button>
        </div>
      ) : (
        <div className={styles.articlesFeed}>
          {visibleItems.map((it) => {
            const catEmoji = categoryEmojiMap[it.category] || "📰";
            return (
              <div
                key={it.id}
                className={`${styles.articleCard} ${it.hidden ? styles.articleCardHidden : ''}`}
              >
                <div className={styles.articleMedia}>
                  {it.image ? (
                    <img src={it.image} alt={it.heading} className={styles.articleImg} />
                  ) : (
                    <div className={styles.articleImgFallback}>{catEmoji}</div>
                  )}
                </div>

                <div className={styles.articleBody}>
                  <div className={styles.articleHeaderRow}>
                    <div className={styles.articleMetaPills}>
                      <span className={styles.datePill}>
                        📅 {formatDate(it.date)}
                      </span>
                      <span className={styles.categoryPill}>
                        {catEmoji} {it.category || "National"}
                      </span>
                      {it.hidden ? (
                        <span className={styles.statusPillHidden}>🙈 HIDDEN</span>
                      ) : (
                        <span className={styles.statusPillLive}>🟢 LIVE</span>
                      )}
                    </div>
                  </div>

                  <h3 className={styles.articleHeading}>{it.heading}</h3>

                  {it.oneLiner && (
                    <div className={styles.oneLinerCallout}>
                      💡 {it.oneLiner}
                    </div>
                  )}

                  <p className={styles.articleDescription}>{it.description}</p>

                  <div className={styles.articleActions}>
                    <button className={styles.actionBtn} onClick={() => openEdit(it)}>
                      ✏️ Edit
                    </button>
                    <button className={styles.actionBtn} onClick={() => toggleHidden(it)}>
                      {it.hidden ? "👁️ Show" : "🙈 Hide"}
                    </button>
                    <button className={styles.actionBtnDelete} onClick={() => remove(it)}>
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
