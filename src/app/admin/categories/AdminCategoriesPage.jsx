"use client";

import { useState, useRef, useMemo } from "react";
import Link from "next/link";
import { useData } from "@/context/DataContext";
import { useAdmin } from "@/context/AdminContext";
import styles from "@/styles/AdminCategories.module.css";
import toast from "react-hot-toast";
import CategorySearchSelect from "@/components/admin/CategorySearchSelect";
import SetManagerModal from "@/components/admin/SetManagerModal";
import SubCategoryManagerModal from "@/components/admin/SubCategoryManagerModal";
import ContentCoverageModal from "@/components/admin/ContentCoverageModal";

const EMPTY_CAT = { id: "", topic: "", topicHi: "", emoji: "", description: "", descriptionHi: "", categoryClass: "", hidden: false, image: "", image_url: "", group: "core", status: "coming_soon", sort_order: 0, sortOrder: 0, parentId: "", showSubCategoriesOnHome: false, storyText: "", storyImage: "", originalLang: "en", isTrending: false, chips: [] };

async function submitPending(type, payload) {
  const res = await fetch("/api/admin/pending", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type, payload }),
  });
  if (res.ok) {
    toast.success("Your change has been submitted for approval.");
  } else {
    toast.error("Failed to submit change for approval.");
  }
}

const EditForm = ({ category, onSave, onCancel, isNew = false, quizzes = [], settings = {}, editingId, isSubmitting = false, onOpenSubCatModal }) => {
  const [form, setForm] = useState(category);
  const linkedSubs = useMemo(() => {
    if (!category?.id) return [];
    return (quizzes || []).filter((c) => c?.parentId === category.id);
  }, [quizzes, category?.id]);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image file size must be less than 5MB');
      return;
    }
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/upload/image', {
        method: 'POST',
        body: formData,
      });
      
      if (response.ok) {
        const result = await response.json();
        setForm({ ...form, image: result.url });
        toast.success('Image uploaded successfully!');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to upload image');
      }
    } catch (error) {
      console.error('Image upload error:', error);
      toast.error('Failed to upload image');
    }
  };

  const handleStoryImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image file size must be less than 5MB');
      return;
    }
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/upload/image', {
        method: 'POST',
        body: formData,
      });
      
      if (response.ok) {
        const result = await response.json();
        setForm({ ...form, storyImage: result.url });
        toast.success('Story image uploaded successfully!');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to upload story image');
      }
    } catch (error) {
      console.error('Story image upload error:', error);
      toast.error('Failed to upload story image');
    }
  };

  const handleCardImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 150 * 1024) {
      toast.error(`Card WebP image must be under 150 KB (Current: ${(file.size / 1024).toFixed(1)} KB)`);
      return;
    }

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('slug', form.slug || form.topic?.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'category');

      const response = await fetch('/api/admin/categories/upload-card-image', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        setForm({ ...form, image_url: result.url, image: result.url });
        toast.success(`Card image saved as ${result.filename}!`);
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to upload card image');
      }
    } catch (error) {
      console.error('Card image upload error:', error);
      toast.error('Failed to upload card image');
    }
  };

  return (
    <div className={styles.inlineForm}>
      <h2 className={styles.formTitle}>
        {isNew ? "📁 Create New Quiz Category" : "✏️ Edit Quiz Category"}
      </h2>
      
      <div className={styles.formGrid}>
        <div className={styles.field}>
          <label>Emoji Icon</label>
          <input
            value={form.emoji}
            onChange={(e) => setForm({ ...form, emoji: e.target.value })}
            placeholder="e.g. 🔬"
            className={styles.input}
          />
        </div>

        <div className={styles.field}>
          <label>Topic Title (English)</label>
          <input
            value={form.topic}
            onChange={(e) => setForm({ ...form, topic: e.target.value })}
            placeholder="e.g. Biology & Life Sciences"
            className={styles.input}
          />
        </div>

        <div className={styles.field}>
          <label>Topic Title (Hindi)</label>
          <input
            value={form.topicHi || ""}
            onChange={(e) => setForm({ ...form, topicHi: e.target.value })}
            placeholder="जैसे: जीव विज्ञान"
            className={styles.input}
          />
        </div>

        <div className={styles.field}>
          <label>Description (English)</label>
          <input
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Short overview"
            className={styles.input}
          />
        </div>

        <div className={styles.field}>
          <label>Description (Hindi)</label>
          <input
            value={form.descriptionHi || ""}
            onChange={(e) => setForm({ ...form, descriptionHi: e.target.value })}
            placeholder="संक्षिप्त विवरण"
            className={styles.input}
          />
        </div>

        <div className={styles.field}>
          <label>Category Type</label>
          <select
            value={form.categoryClass === 'govt-exam' || form.categoryClass?.includes('govt-exam') ? 'govt-exam' : (form.categoryClass === 'image-quiz' || form.categoryClass?.includes('image-quiz') ? 'image-quiz' : '')}
            onChange={(e) => setForm({ ...form, categoryClass: e.target.value })}
            className={styles.select}
          >
            <option value="">Regular Category</option>
            <option value="govt-exam">Govt Exam / Preparation</option>
            <option value="image-quiz">Image Quiz</option>
          </select>
        </div>

        <div className={styles.field}>
          <label>Parent Category (Optional)</label>
          <CategorySearchSelect
            categories={quizzes.filter((c) => c.id !== editingId && !c.parentId)}
            value={form.parentId || ""}
            onChange={(val) => setForm({ ...form, parentId: val || null })}
            emptyLabel="None (Top Level Category)"
            placeholder="🔍 Search parent category..."
          />
        </div>

        {!isNew && !form.parentId && (
          <div className={styles.field} style={{ gridColumn: '1 / -1', background: '#f8fafc', padding: '12px 16px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
              <div>
                <span style={{ fontWeight: 700, fontSize: '0.88rem', color: '#0f172a' }}>
                  📁 Linked Sub-Categories ({linkedSubs.length})
                </span>
                <span style={{ fontSize: '0.78rem', color: '#64748b', marginLeft: '8px' }}>
                  Sub-categories displayed under this master category
                </span>
              </div>
              <button
                type="button"
                onClick={() => onOpenSubCatModal && onOpenSubCatModal(category)}
                className={styles.manageSubsBtn}
              >
                ⚙️ Manage / Add / Deselect Sub-Categories
              </button>
            </div>
            {linkedSubs.length === 0 ? (
              <div style={{ fontSize: '0.8rem', color: '#94a3b8', fontStyle: 'italic' }}>
                No sub-categories linked yet. Click &ldquo;Manage / Add / Deselect Sub-Categories&rdquo; to link or create sub-categories.
              </div>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {linkedSubs.map((sub) => (
                  <span
                    key={sub.id}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '4px 10px',
                      background: '#ffffff',
                      border: '1px solid #cbd5e1',
                      borderRadius: '99px',
                      fontSize: '0.8rem',
                      color: '#1e293b',
                      fontWeight: 600,
                    }}
                  >
                    <span>{sub.emoji || '📁'}</span>
                    <span>{sub.topic}</span>
                    <span style={{ fontSize: '0.72rem', color: '#4338ca', background: '#e0e7ff', padding: '1px 6px', borderRadius: '4px' }}>
                      {sub.questionCount || 0} Qs
                    </span>
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        <div className={styles.field}>
          <label>Original Language</label>
          <select
            value={form.originalLang || "en"}
            onChange={(e) => setForm({ ...form, originalLang: e.target.value })}
            className={styles.select}
          >
            <option value="en">English (EN)</option>
            <option value="hi">Hindi (HI)</option>
          </select>
        </div>

        <div className={styles.field}>
          <label>Status (Live / Coming soon)</label>
          <select
            value={form.status || "coming_soon"}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
            className={styles.select}
          >
            <option value="live">● Live (Publicly Playable)</option>
            <option value="coming_soon">Coming soon (Shows Waitlist Toast)</option>
          </select>
        </div>

        <div className={styles.field}>
          <label>Group Category</label>
          <select
            value={form.group || "core"}
            onChange={(e) => setForm({ ...form, group: e.target.value })}
            className={styles.select}
          >
            <option value="core">⭐ Core (Popular)</option>
            <option value="india">India</option>
            <option value="learn">Learn</option>
            <option value="fun">Fun</option>
            <option value="world">World</option>
          </select>
        </div>

        <div className={styles.field}>
          <label>Sort Order (1 to 40)</label>
          <input
            type="number"
            value={form.sort_order ?? form.sortOrder ?? 0}
            onChange={(e) => {
              const val = parseInt(e.target.value, 10) || 0;
              setForm({ ...form, sort_order: val, sortOrder: val });
            }}
            placeholder="e.g. 1"
            className={styles.input}
          />
        </div>

        <div className={styles.field}>
          <label>Card Thumbnail (WebP, 512x512, max 150 KB)</label>
          <input
            type="file"
            accept="image/webp,image/*"
            onChange={handleCardImageUpload}
            className={styles.fileInput}
          />
          <small style={{ color: "#64748b", fontSize: "11px", display: "block", marginTop: "4px" }}>
            Auto-saves to /cards/{form.slug || "slug"}.webp (Instant customer site reflection)
          </small>
          {(form.image_url || form.image) && (
            <div className={styles.imagePreview} style={{ marginTop: "6px" }}>
              <img src={form.image_url || form.image} alt="Card Preview" style={{ width: "64px", height: "64px", objectFit: "cover", borderRadius: "10px" }} />
              <button
                type="button"
                className={styles.removeImg}
                onClick={() => setForm({ ...form, image_url: "", image: "" })}
              >
                ✕ Remove
              </button>
            </div>
          )}
        </div>

        <div className={styles.field}>
          <label>Options & Visibility</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={!!form.showSubCategoriesOnHome}
                onChange={(e) => setForm({ ...form, showSubCategoriesOnHome: e.target.checked })}
              />
              <span> Show sub-categories on homepage</span>
            </label>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={!!form.isTrending}
                onChange={(e) => setForm({ ...form, isTrending: e.target.checked })}
              />
              <span> Mark as Trending Topic 🔥</span>
            </label>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={!!form.hidden}
                onChange={(e) => setForm({ ...form, hidden: e.target.checked })}
              />
              <span> Hide from public view</span>
            </label>
          </div>
        </div>
      </div>

      <div style={{ marginTop: '20px' }}>
        <h3 className={styles.sectionTitle}>📖 Digital Book / Story Content (Read Mode Sidebar)</h3>
        <div className={styles.field}>
          <label>Story/Informative Overview Text</label>
          <textarea
            value={form.storyText || ""}
            onChange={(e) => setForm({ ...form, storyText: e.target.value })}
            placeholder="Add background notes, study summary, or chapter guide for Read Mode..."
            className={styles.textarea}
            rows={4}
          />
        </div>
      </div>

      <div className={styles.formActions}>
        <button className="actionBtnSecondary" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </button>
        <button className="actionBtnPrimary" disabled={isSubmitting} onClick={() => onSave(form, isNew)}>
          {isSubmitting ? (isNew ? "Creating..." : "Saving...") : isNew ? "Create Category" : "Save Changes"}
        </button>
      </div>
    </div>
  );
};

export default function AdminCategoriesPage() {
  const { quizzes, settings, addCategory, updateCategory, deleteCategory, reorderCategories, refreshQuizzes } = useData();
  const { adminUser } = useAdmin();
  const isJr = adminUser?.role === "jr";
  const allowed = adminUser?.role === "master" || adminUser?.permissions?.categories !== false;

  const [editingId, setEditingId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const [activeTab, setActiveTab] = useState("quizzes"); // "quizzes", "govt-exams", "image-quizzes"
  const [healthFilter, setHealthFilter] = useState("all"); // "all", "ready", "progress", "empty"
  const [search, setSearch] = useState("");
  const [expandedParents, setExpandedParents] = useState({});
  const [setModalConfig, setSetModalConfig] = useState(null); // { category, tab: 'review' | 'paste' }
  const [subCatModalCategory, setSubCatModalCategory] = useState(null); // category to manage subcategories for
  const [coverageModalOpen, setCoverageModalOpen] = useState(false);
  const [coverageInitialCategory, setCoverageInitialCategory] = useState(null);

  const openSetModal = (category, tab = "review") => {
    setSetModalConfig({ category, tab });
  };

  const toggleParentExpand = (catId) => {
    setExpandedParents((prev) => ({
      ...prev,
      [catId]: !prev[catId],
    }));
  };

  const dragItem = useRef(null);
  const dragOver = useRef(null);

  // Health Metrics for Category Tab
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

    return { empty, progress, ready, total: (quizzes || []).length };
  }, [quizzes]);

  // Category Type Counts
  const typeCounts = useMemo(() => {
    const list = quizzes || [];
    return {
      total: list.length,
      regular: list.filter(c => !(c?.categoryClass || '').includes('govt-exam') && !(c?.categoryClass || '').includes('image-quiz')).length,
      govtExams: list.filter(c => (c?.categoryClass || '').includes('govt-exam')).length,
      imageQuizzes: list.filter(c => (c?.categoryClass || '').includes('image-quiz')).length,
    };
  }, [quizzes]);

  // Main Categories Filtered
  const filteredCategories = useMemo(() => {
    return (quizzes || [])
      .filter((c) => !c?.parentId)
      .filter((cat) => {
        if (!cat) return false;
        if (activeTab === "all") return true;
        const cls = cat.categoryClass || "";
        if (activeTab === "govt-exams") return cls.includes("govt-exam");
        if (activeTab === "image-quizzes") return cls.includes("image-quiz");
        return !cls.includes("govt-exam") && !cls.includes("image-quiz");
      })
      .filter((cat) => {
        if (!search) return true;
        const query = search.toLowerCase();
        return (
          cat.topic?.toLowerCase().includes(query) ||
          cat.topicHi?.toLowerCase().includes(query) ||
          cat.description?.toLowerCase().includes(query)
        );
      })
      .filter((cat) => {
        const count = cat?.questionCount || 0;
        if (healthFilter === "empty") return count === 0;
        if (healthFilter === "progress") return count > 0 && count < 20;
        if (healthFilter === "ready") return count >= 20;
        return true;
      })
      .sort((a, b) => {
        const aOrder = a.sortOrder ?? a.sort_order ?? 9999;
        const bOrder = b.sortOrder ?? b.sort_order ?? 9999;
        if (aOrder !== bOrder) return aOrder - bOrder;
        const aCount = a?.questionCount || 0;
        const bCount = b?.questionCount || 0;
        if (bCount !== aCount) return bCount - aCount;
        return (a.topic || "").localeCompare(b.topic || "");
      });
  }, [quizzes, activeTab, search, healthFilter]);

  if (!allowed) {
    return (
      <div className={styles.page}>
        <p>Access denied.</p>
      </div>
    );
  }

  const openAdd = () => setEditingId("new");
  const openEdit = (cat) => setEditingId(cat.id);

  const handleSave = async (formData, isNew) => {
    if (isSubmitting) return;
    try {
      if (!formData || !formData.topic) {
        toast.error("Topic title is required!");
        return;
      }
      setIsSubmitting(true);

      const topicStr = String(formData.topic).trim();
      const emojiStr = formData.emoji ? String(formData.emoji).trim() : "📁";

      const data = { 
        topic: topicStr, 
        topicHi: formData.topicHi || null,
        emoji: emojiStr, 
        description: formData.description || "", 
        descriptionHi: formData.descriptionHi || null,
        categoryClass: formData.categoryClass || `category-${topicStr.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")}`,
        hidden: !!formData.hidden, 
        image: formData.image || null, 
        parentId: formData.parentId && formData.parentId !== "" ? formData.parentId : null, 
        showSubCategoriesOnHome: !!formData.showSubCategoriesOnHome, 
        storyText: formData.storyText || "",
        storyImage: formData.storyImage || null,
        originalLang: formData.originalLang || "en",
        isTrending: !!formData.isTrending,
        chips: Array.isArray(formData.chips) ? formData.chips : [],
      };

      if (!isNew) {
        if (isJr) {
          await submitPending("update_category", { categoryId: editingId, ...data });
          setEditingId(null);
        } else {
          const success = await updateCategory(editingId, data);
          if (success) {
            toast.success("Category updated successfully!");
            setEditingId(null);
          }
        }
      } else {
        if (isJr) {
          await submitPending("create_category", data);
          setEditingId(null);
        } else {
          const success = await addCategory(data);
          if (success) {
            toast.success("Category created successfully!");
            setEditingId(null);
          }
        }
      }
    } catch (error) {
      console.error("[AdminCategories] handleSave error:", error);
      toast.error("An error occurred: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (isJr) {
      await submitPending("delete_category", { categoryId: id });
    } else {
      const success = await deleteCategory(id);
      if (success) toast.success("Category deleted successfully!");
      else toast.error("Failed to delete category.");
    }
    setConfirm(null);
  };

  const handleDragEnd = () => {
    if (dragItem.current === null || dragOver.current === null) return;
    if (dragItem.current === dragOver.current) return;

    const draggedCat = filteredCategories[dragItem.current];
    const droppedOnCat = filteredCategories[dragOver.current];

    if (!draggedCat || !droppedOnCat) return;

    const items = [...quizzes];
    const fromIndex = items.findIndex(c => c.id === draggedCat.id);
    const toIndex = items.findIndex(c => c.id === droppedOnCat.id);

    if (fromIndex !== -1 && toIndex !== -1) {
      const [removed] = items.splice(fromIndex, 1);
      items.splice(toIndex, 0, removed);
      reorderCategories(items);
    }
    
    dragItem.current = null;
    dragOver.current = null;
  };

  return (
    <div className={styles.page}>
      
      {/* 1. Clean Page Header */}
      <div className={styles.header}>
        <div className={styles.headerText}>
          <div className={styles.titleWithCount}>
            <h1 className={styles.title}>Quiz Categories</h1>
            <span className={styles.totalBadge}>{(quizzes || []).length}</span>
          </div>
          <p className={styles.subtitle}>
            Manage main categories, sub-categories, language versions & set readiness
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <button
            type="button"
            className={styles.coverageHeaderBtn}
            onClick={() => {
              setCoverageInitialCategory(null);
              setCoverageModalOpen(true);
            }}
            title="View & manage syllabus/chapters covered across categories"
          >
            📖 Chapters Covered
          </button>
          <button
            type="button"
            className={styles.pasteSetHeaderBtn}
            onClick={() => openSetModal(null, "paste")}
            title="Paste 20 questions from Excel to create a set"
          >
            📋 Paste New Set
          </button>
          <button className={styles.addBtn} onClick={openAdd}>
            + Add Category
          </button>
        </div>
      </div>

      {/* 2. Unified Toolbar (1 Clean Row) */}
      <div className={styles.toolbar}>
        <div className={styles.typeTabs}>
          <button 
            className={`${styles.typeTabBtn} ${activeTab === 'all' ? styles.typeTabBtnActive : ''}`}
            onClick={() => setActiveTab("all")}
          >
            All <span className={styles.tabCount}>({typeCounts.total})</span>
          </button>
          <button 
            className={`${styles.typeTabBtn} ${activeTab === 'quizzes' ? styles.typeTabBtnActive : ''}`}
            onClick={() => setActiveTab("quizzes")}
          >
            Regular <span className={styles.tabCount}>({typeCounts.regular})</span>
          </button>
          <button 
            className={`${styles.typeTabBtn} ${activeTab === 'govt-exams' ? styles.typeTabBtnActive : ''}`}
            onClick={() => setActiveTab("govt-exams")}
          >
            Govt Exams <span className={styles.tabCount}>({typeCounts.govtExams})</span>
          </button>
          <button 
            className={`${styles.typeTabBtn} ${activeTab === 'image-quizzes' ? styles.typeTabBtnActive : ''}`}
            onClick={() => setActiveTab("image-quizzes")}
          >
            Image Quizzes <span className={styles.tabCount}>({typeCounts.imageQuizzes})</span>
          </button>
        </div>

        <div className={styles.toolbarRight}>
          <select
            value={healthFilter}
            onChange={(e) => setHealthFilter(e.target.value)}
            className={styles.statusSelect}
            aria-label="Filter status"
          >
            <option value="all">All Status ({healthStats.total})</option>
            <option value="ready">🟢 Ready ({healthStats.ready})</option>
            <option value="progress">🟡 In Progress ({healthStats.progress})</option>
            <option value="empty">🔴 Empty ({healthStats.empty})</option>
          </select>

          <div className={styles.searchWrapper}>
            <span className={styles.searchIcon}>🔍</span>
            <input
              className={styles.searchInput}
              placeholder="Search categories..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className={styles.clearSearchBtn}
                title="Clear search"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 3. Categories List */}
      <div className={styles.list}>
        {editingId === "new" && (
          <EditForm 
            category={EMPTY_CAT} 
            onSave={handleSave} 
            onCancel={() => setEditingId(null)} 
            isNew={true} 
            quizzes={quizzes}
            settings={settings}
            editingId={editingId}
            isSubmitting={isSubmitting}
            onOpenSubCatModal={setSubCatModalCategory}
          />
        )}

        {filteredCategories.map((cat, idx) => {
          const count = cat.questionCount || 0;
          const sets = Math.ceil(count / 20);
          const childSubs = (quizzes || []).filter((sub) => sub?.parentId === cat.id);
          const hasSubs = childSubs.length > 0;
          const isExpanded = !!expandedParents[cat.id] || (search.trim().length > 0);

          let statusText = `${sets} ${sets === 1 ? 'Set' : 'Sets'} Ready`;
          let statusClass = styles.statusReady;
          if (count === 0) {
            statusText = "Needs Content";
            statusClass = styles.statusEmpty;
          } else if (count < 20) {
            statusText = "In Progress";
            statusClass = styles.statusProgress;
          }

          return (
            <div key={cat.id} className={styles.categoryItemWrapper}>
              <div
                className={styles.row}
                draggable={editingId === null}
                onDragStart={() => (dragItem.current = idx)}
                onDragEnter={() => (dragOver.current = idx)}
                onDragEnd={handleDragEnd}
                onDragOver={(e) => e.preventDefault()}
              >
                {/* Left Info Column */}
                <div className={styles.rowLeft}>
                  <span className={styles.dragHandle} title="Drag to reorder">⋮⋮</span>
                  
                  <div className={styles.avatarBox}>
                    {cat.image ? (
                      <img src={cat.image} alt="" className={styles.rowImage} />
                    ) : (
                      <span className={styles.emoji}>{cat.emoji || "📁"}</span>
                    )}
                  </div>
                  
                  <div className={styles.nameGroup}>
                    <div className={styles.titleLine}>
                      <span className={styles.categoryTitle}>{cat.topic}</span>
                      <span className={`${styles.langBadge} ${cat.originalLang === 'hi' ? styles.langHi : styles.langEn}`}>
                        {cat.originalLang === 'hi' ? 'HI' : 'EN'}
                      </span>
                      {cat.isTrending && <span className={styles.badgeTrending}>🔥 Trending</span>}
                      {cat.showSubCategoriesOnHome && (
                        <span className={styles.badgeHome} title="Sub-categories shown on home page">🏠 Home</span>
                      )}
                    </div>

                    <div className={styles.metaLine}>
                      {hasSubs ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <button
                            type="button"
                            onClick={() => toggleParentExpand(cat.id)}
                            className={`${styles.subsToggleBtn} ${isExpanded ? styles.subsToggleBtnOpen : ''}`}
                            title={isExpanded ? "Collapse subcategories" : "Expand subcategories"}
                          >
                            <span>📁 {childSubs.length} sub-categories</span>
                            <span>{isExpanded ? "▴" : "▾"}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setSubCatModalCategory(cat)}
                            className={styles.subsToggleBtn}
                            style={{ color: '#166534', background: '#f0fdf4', borderColor: '#bbf7d0' }}
                            title="Manage, add, or deselect sub-categories"
                          >
                            ⚙️ Manage
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setSubCatModalCategory(cat)}
                          className={styles.subsToggleBtn}
                          style={{ color: '#4338ca', background: '#eef2ff', borderColor: '#c7d2fe' }}
                          title="Link or add subcategories to this category"
                        >
                          + Link Sub-Categories
                        </button>
                      )}
                      {cat.description && (
                        <span className={styles.descText} title={cat.description}>
                          {cat.description}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Meta Column */}
                <div className={styles.rowRight}>
                  <div className={styles.statsGroup}>
                    <button
                      type="button"
                      className={`${styles.statusBadge} ${statusClass} ${styles.statusBadgeClickable}`}
                      onClick={() => openSetModal(cat, "review")}
                      title="Click to review & manage sets for this category"
                    >
                      ● {statusText}
                    </button>
                    <span className={styles.questionCount}>
                      <strong>{count.toLocaleString()}</strong> Qs
                    </span>
                  </div>

                  <div className={styles.actionGroup}>
                    <button
                      type="button"
                      className={styles.manageSubsBtn}
                      onClick={() => setSubCatModalCategory(cat)}
                      title={`Manage Sub-Categories for ${cat.topic} (${childSubs.length} linked)`}
                    >
                      📁 Sub-Cats ({childSubs.length})
                    </button>
                    <button
                      type="button"
                      className={styles.chaptersActionBtn}
                      onClick={() => {
                        setCoverageInitialCategory(cat);
                        setCoverageModalOpen(true);
                      }}
                      title={`View & manage syllabus chapters covered for ${cat.topic}`}
                    >
                      📖 Chapters
                    </button>
                    <button
                      type="button"
                      className={styles.setsActionBtn}
                      onClick={() => openSetModal(cat, "review")}
                      title="Manage Sets (Review, Edit, Hide, Delete)"
                    >
                      📦 Sets
                    </button>
                    <Link href={`/admin/questions?category=${cat.id}`} className={styles.addQuestionsBtn}>
                      + Add Qs
                    </Link>
                    <button
                      type="button"
                      className={styles.iconActionBtn}
                      onClick={() =>
                        isJr
                          ? submitPending("update_category", {
                              categoryId: cat.id,
                              hidden: !cat.hidden,
                            })
                          : updateCategory(cat.id, { hidden: !cat.hidden })
                      }
                      title={cat.hidden ? "Show category" : "Hide category"}
                    >
                      {cat.hidden ? "🙈" : "👁️"}
                    </button>
                    <button
                      type="button"
                      className={styles.iconActionBtn}
                      onClick={() => openEdit(cat)}
                      title="Edit category"
                    >
                      ✏️
                    </button>
                    <button
                      type="button"
                      className={`${styles.iconActionBtn} ${styles.deleteActionBtn}`}
                      onClick={() => setConfirm(cat.id)}
                      title="Delete category"
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                {/* Confirm Delete Bar */}
                {confirm === cat.id && (
                  <div className={styles.confirmBar}>
                    <span>Delete &ldquo;{cat.topic}&rdquo; and all its questions?</span>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button
                        className={styles.confirmYes}
                        onClick={() => handleDelete(cat.id)}
                      >
                        Delete
                      </button>
                      <button className={styles.confirmNo} onClick={() => setConfirm(null)}>
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Inline Edit Form */}
              {editingId === cat.id && (
                <EditForm 
                  category={cat} 
                  onSave={handleSave} 
                  onCancel={() => setEditingId(null)} 
                  quizzes={quizzes}
                  settings={settings}
                  editingId={editingId}
                  isSubmitting={isSubmitting}
                  onOpenSubCatModal={setSubCatModalCategory}
                />
              )}

              {/* Sub-categories Accordion */}
              {hasSubs && isExpanded && (
                <div className={styles.subRowsContainer}>
                  {childSubs.map((sub) => (
                    <div key={sub.id} className={styles.subRowItem}>
                      <div className={styles.subRowLeft}>
                        <span className={styles.subTreeIcon}>↳</span>
                        <div className={styles.avatarBoxSmall}>
                          {sub.image ? (
                            <img src={sub.image} alt="" className={styles.rowImageSmall} />
                          ) : (
                            <span className={styles.emojiSmall}>{sub.emoji || "📁"}</span>
                          )}
                        </div>
                        <div className={styles.subNameGroup}>
                          <span className={styles.subTitle}>{sub.topic}</span>
                          {sub.description && (
                            <span className={styles.subDescText}>{sub.description}</span>
                          )}
                        </div>
                      </div>

                      <div className={styles.subRowRight}>
                        <button
                          type="button"
                          className={`${styles.statusBadgeSmall} ${styles.statusBadgeClickable}`}
                          onClick={() => openSetModal(sub, "review")}
                          title="Click to review & manage sets for this subcategory"
                        >
                          📦 {Math.ceil((sub.questionCount || 0) / 20)} Sets
                        </button>
                        <span className={styles.questionCountSmall}>
                          <strong>{(sub.questionCount || 0).toLocaleString()}</strong> Qs
                        </span>

                        <div className={styles.actionGroup}>
                          <button
                            type="button"
                            className={styles.chaptersActionBtnSmall}
                            onClick={() => {
                              setCoverageInitialCategory(sub);
                              setCoverageModalOpen(true);
                            }}
                            title={`View & manage chapters covered for ${sub.topic}`}
                          >
                            📖 Chapters
                          </button>
                          <button
                            type="button"
                            className={styles.setsActionBtnSmall}
                            onClick={() => openSetModal(sub, "review")}
                            title="Manage Sets"
                          >
                            📦 Sets
                          </button>
                          <Link href={`/admin/questions?category=${sub.id}`} className={styles.addQuestionsBtnSmall}>
                            + Add Qs
                          </Link>
                          <button
                            type="button"
                            className={styles.iconActionBtnSmall}
                            onClick={() =>
                              isJr
                                ? submitPending("update_category", {
                                    categoryId: sub.id,
                                    hidden: !sub.hidden,
                                  })
                                : updateCategory(sub.id, { hidden: !sub.hidden })
                            }
                            title={sub.hidden ? "Show" : "Hide"}
                          >
                            {sub.hidden ? "🙈" : "👁️"}
                          </button>
                          <button
                            type="button"
                            className={styles.iconActionBtnSmall}
                            onClick={() => openEdit(sub)}
                            title="Edit"
                          >
                            ✏️
                          </button>
                          <button
                            type="button"
                            className={`${styles.iconActionBtnSmall} ${styles.deleteActionBtn}`}
                            onClick={() => setConfirm(sub.id)}
                            title="Delete"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>

                      {confirm === sub.id && (
                        <div className={styles.confirmBar}>
                          <span>Delete &ldquo;{sub.topic}&rdquo;?</span>
                          <div style={{ display: "flex", gap: "8px" }}>
                            <button
                              className={styles.confirmYes}
                              onClick={() => handleDelete(sub.id)}
                            >
                              Delete
                            </button>
                            <button className={styles.confirmNo} onClick={() => setConfirm(null)}>
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}

                      {editingId === sub.id && (
                        <EditForm 
                          category={sub} 
                          onSave={handleSave} 
                          onCancel={() => setEditingId(null)} 
                          quizzes={quizzes}
                          settings={settings}
                          editingId={editingId}
                          isSubmitting={isSubmitting}
                          onOpenSubCatModal={setSubCatModalCategory}
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}

            </div>
          );
        })}

        {filteredCategories.length === 0 && editingId !== "new" && (
          <div className={styles.emptyState}>
            <p>No categories found matching your selected filter or search query.</p>
          </div>
        )}
      </div>

      {/* Set Manager Modal */}
      {setModalConfig && (
        <SetManagerModal
          isOpen={!!setModalConfig}
          onClose={() => setSetModalConfig(null)}
          initialCategory={setModalConfig.category}
          allCategories={quizzes || []}
          onRefresh={refreshQuizzes}
          initialTab={setModalConfig.tab || "review"}
        />
      )}

      {/* Sub-Category Manager Modal */}
      {subCatModalCategory && (
        <SubCategoryManagerModal
          isOpen={!!subCatModalCategory}
          onClose={() => setSubCatModalCategory(null)}
          category={subCatModalCategory}
          onUpdated={refreshQuizzes}
        />
      )}

      {/* Syllabus & Content Coverage Modal */}
      {coverageModalOpen && (
        <ContentCoverageModal
          isOpen={coverageModalOpen}
          onClose={() => setCoverageModalOpen(false)}
          initialCategory={coverageInitialCategory}
          allCategories={quizzes || []}
          onRefresh={refreshQuizzes}
        />
      )}

    </div>
  );
}
