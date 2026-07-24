"use client";

import { useState, useRef, useMemo } from "react";
import Link from "next/link";
import { useData } from "@/context/DataContext";
import { useAdmin } from "@/context/AdminContext";
import styles from "@/styles/AdminCategories.module.css";
import toast from "react-hot-toast";

const EMPTY_CAT = { id: "", topic: "", topicHi: "", emoji: "", description: "", descriptionHi: "", categoryClass: "", hidden: false, image: "", parentId: "", showSubCategoriesOnHome: false, storyText: "", storyImage: "", originalLang: "en", isTrending: false, chips: [] };

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

const EditForm = ({ category, onSave, onCancel, isNew = false, quizzes = [], settings = {}, editingId }) => {
  const [form, setForm] = useState(category);

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
          <select
            value={form.parentId || ""}
            onChange={(e) => setForm({ ...form, parentId: e.target.value || null })}
            className={styles.select}
          >
            <option value="">None (Top Level Category)</option>
            {quizzes
              .filter((c) => c.id !== editingId && !c.parentId)
              .map((c) => (
                <option key={c.id} value={c.id}>
                  {c.emoji} {c.topic}
                </option>
              ))}
          </select>
        </div>

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
          <label>Category Thumbnail Image</label>
          <input type="file" accept="image/*" onChange={handleImageUpload} className={styles.fileInput} />
          {form.image && (
            <div className={styles.imagePreview}>
              <img src={form.image} alt="Preview" />
              <button type="button" className={styles.removeImg} onClick={() => setForm({ ...form, image: "" })}>✕ Remove</button>
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
        <button className="actionBtnSecondary" onClick={onCancel}>
          Cancel
        </button>
        <button className="actionBtnPrimary" onClick={() => onSave(form, isNew)}>
          {isNew ? "Create Category" : "Save Changes"}
        </button>
      </div>
    </div>
  );
};

export default function AdminCategoriesPage() {
  const { quizzes, settings, addCategory, updateCategory, deleteCategory, reorderCategories } = useData();
  const { adminUser } = useAdmin();
  const isJr = adminUser?.role === "jr";
  const allowed = adminUser?.role === "master" || adminUser?.permissions?.categories !== false;

  const [editingId, setEditingId] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [activeTab, setActiveTab] = useState("quizzes"); // "quizzes", "govt-exams", "image-quizzes"
  const [healthFilter, setHealthFilter] = useState("all"); // "all", "ready", "progress", "empty"
  const [search, setSearch] = useState("");

  const dragItem = useRef(null);
  const dragOver = useRef(null);

  // Health Metrics for Category Tab
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

    return { empty, progress, ready, total: quizzes.length };
  }, [quizzes]);

  // Main Categories Filtered
  const filteredCategories = useMemo(() => {
    return quizzes
      .filter((c) => !c.parentId)
      .filter((cat) => {
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
        const count = cat.questionCount || 0;
        if (healthFilter === "empty") return count === 0;
        if (healthFilter === "progress") return count > 0 && count < 20;
        if (healthFilter === "ready") return count >= 20;
        return true;
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
    try {
      if (!formData || !formData.topic) {
        toast.error("Topic title is required!");
        return;
      }

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
          } else {
            toast.error("Failed to update category.");
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
          } else {
            toast.error("Failed to create category.");
          }
        }
      }
    } catch (error) {
      console.error("[AdminCategories] handleSave error:", error);
      toast.error("An error occurred: " + error.message);
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
      
      {/* Header Banner */}
      <div className={styles.headerRow}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>Quiz Categories</h1>
          <p className={styles.subtitle}>
            Manage exam topics, sub-categories, language versions & set readiness
          </p>
        </div>
        <button className={styles.addBtn} onClick={openAdd}>
          <span>+ Add New Category</span>
        </button>
      </div>

      {/* Control & Filter Center */}
      <div className={styles.controlBar}>
        
        {/* Vertical Type Tabs */}
        <div className={styles.typeTabs}>
          <button 
            className={`${styles.typeTabBtn} ${activeTab === 'quizzes' ? styles.typeTabBtnActive : ''}`}
            onClick={() => setActiveTab("quizzes")}
          >
            <span>📝 Regular quizzes ({quizzes.filter(c => !(c.categoryClass || '').includes('govt-exam') && !(c.categoryClass || '').includes('image-quiz')).length})</span>
          </button>
          <button 
            className={`${styles.typeTabBtn} ${activeTab === 'govt-exams' ? styles.typeTabBtnActive : ''}`}
            onClick={() => setActiveTab("govt-exams")}
          >
            <span>🏛️ Govt Exams ({quizzes.filter(c => (c.categoryClass || '').includes('govt-exam')).length})</span>
          </button>
          <button 
            className={`${styles.typeTabBtn} ${activeTab === 'image-quizzes' ? styles.typeTabBtnActive : ''}`}
            onClick={() => setActiveTab("image-quizzes")}
          >
            <span>🖼️ Image Quizzes ({quizzes.filter(c => (c.categoryClass || '').includes('image-quiz')).length})</span>
          </button>
        </div>

        {/* Health & Search Controls */}
        <div className={styles.subFiltersRow}>
          <div className={styles.healthTabs}>
            <button
              className={`${styles.healthTabBtn} ${healthFilter === 'all' ? styles.healthTabBtnActive : ''}`}
              onClick={() => setHealthFilter("all")}
            >
              All ({healthStats.total})
            </button>
            <button
              className={`${styles.healthTabBtn} ${healthFilter === 'empty' ? styles.healthTabBtnActive : ''}`}
              onClick={() => setHealthFilter("empty")}
            >
              🔴 Empty ({healthStats.empty})
            </button>
            <button
              className={`${styles.healthTabBtn} ${healthFilter === 'progress' ? styles.healthTabBtnActive : ''}`}
              onClick={() => setHealthFilter("progress")}
            >
              🟡 In Progress ({healthStats.progress})
            </button>
            <button
              className={`${styles.healthTabBtn} ${healthFilter === 'ready' ? styles.healthTabBtnActive : ''}`}
              onClick={() => setHealthFilter("ready")}
            >
              🟢 Ready ({healthStats.ready})
            </button>
          </div>

          <input
            className={styles.searchInput}
            placeholder="Search category title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

      </div>

      {/* Categories List */}
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
          />
        )}

        {filteredCategories.map((cat, idx) => {
          const count = cat.questionCount || 0;
          const sets = Math.ceil(count / 20);

          let statusLabel = `${sets} ${sets === 1 ? 'SET' : 'SETS'} READY`;
          let pillClass = styles.pillReady;
          if (count === 0) {
            statusLabel = "NEEDS CONTENT";
            pillClass = styles.pillEmpty;
          } else if (count < 20) {
            statusLabel = "IN PROGRESS";
            pillClass = styles.pillWarning;
          }

          return (
            <div key={cat.id}>
              <div
                className={styles.row}
                draggable={editingId === null}
                onDragStart={() => (dragItem.current = idx)}
                onDragEnter={() => (dragOver.current = idx)}
                onDragEnd={handleDragEnd}
                onDragOver={(e) => e.preventDefault()}
              >
                <div className={styles.rowInfo}>
                  <span className={styles.dragHandle} title="Drag to reorder">
                    ☰
                  </span>
                  {cat.image ? (
                    <img src={cat.image} alt="" className={styles.rowImage} />
                  ) : (
                    <span className={styles.emoji}>{cat.emoji || "📁"}</span>
                  )}
                  
                  <div className={styles.nameGroup}>
                    <span className={styles.name}>
                      {cat.topic}
                      <span className={`${styles.langBadge} ${cat.originalLang === 'hi' ? styles.langHi : styles.langEn}`}>
                        {cat.originalLang === 'hi' ? 'HI' : 'EN'}
                      </span>
                    </span>
                    {cat.description && <span className={styles.desc}>{cat.description}</span>}
                  </div>
                </div>

                <div className={styles.rowMeta}>
                  {cat.showSubCategoriesOnHome && (
                    <span className={styles.homeBadge} title="Sub-categories shown on home page">🏠</span>
                  )}
                  {cat.isTrending && <span className={styles.trendingBadge}>🔥 Trending</span>}
                  
                  <span className={`${styles.statusPill} ${pillClass}`}>{statusLabel}</span>
                  <span className={styles.count}>{count} Qs</span>

                  <div className={styles.actions}>
                    <Link href={`/admin/questions?category=${cat.id}`} className={styles.addQBtn}>
                      <span>+ Add Qs</span>
                    </Link>
                    <button
                      className={styles.iconBtn}
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
                    <button className={styles.iconBtn} onClick={() => openEdit(cat)}>
                      ✏️
                    </button>
                    <button
                      className={`${styles.iconBtn} ${styles.deleteBtn}`}
                      onClick={() => setConfirm(cat.id)}
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                {confirm === cat.id && (
                  <div className={styles.confirmBar}>
                    <span>{`Delete "${cat.topic}" and all its questions?`}</span>
                    <button
                      className={styles.confirmYes}
                      onClick={() => handleDelete(cat.id)}
                    >
                      Yes, Delete
                    </button>
                    <button className={styles.confirmNo} onClick={() => setConfirm(null)}>
                      Cancel
                    </button>
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
                />
              )}

              {/* Render Sub-categories */}
              <div className={styles.subRows}>
                {quizzes
                  .filter((sub) => sub.parentId === cat.id)
                  .map((sub) => (
                    <div key={sub.id} className={`${styles.row} ${styles.subRow}`}>
                      <div className={styles.rowInfo}>
                        <span className={styles.subIndicator}>↳</span>
                        {sub.image ? (
                          <img src={sub.image} alt="" className={styles.rowImage} />
                        ) : (
                          <span className={styles.emoji}>{sub.emoji || "📁"}</span>
                        )}
                        <div className={styles.nameGroup}>
                          <span className={styles.name}>{sub.topic}</span>
                          {sub.description && <span className={styles.desc}>{sub.description}</span>}
                        </div>
                      </div>

                      <div className={styles.rowMeta}>
                        <span className={styles.count}>{sub.questionCount || 0} Qs</span>
                        <div className={styles.actions}>
                          <Link href={`/admin/questions?category=${sub.id}`} className={styles.addQBtn}>
                            <span>+ Add Qs</span>
                          </Link>
                          <button
                            className={styles.iconBtn}
                            onClick={() =>
                              isJr
                                ? submitPending("update_category", {
                                    categoryId: sub.id,
                                    hidden: !sub.hidden,
                                  })
                                : updateCategory(sub.id, { hidden: !sub.hidden })
                            }
                            title={sub.hidden ? "Show category" : "Hide category"}
                          >
                            {sub.hidden ? "🙈" : "👁️"}
                          </button>
                          <button className={styles.iconBtn} onClick={() => openEdit(sub)}>
                            ✏️
                          </button>
                          <button
                            className={`${styles.iconBtn} ${styles.deleteBtn}`}
                            onClick={() => setConfirm(sub.id)}
                          >
                            🗑️
                          </button>
                        </div>
                      </div>

                      {confirm === sub.id && (
                        <div className={styles.confirmBar}>
                          <span>{`Delete "${sub.topic}" and all its questions?`}</span>
                          <button
                            className={styles.confirmYes}
                            onClick={() => handleDelete(sub.id)}
                          >
                            Yes, Delete
                          </button>
                          <button className={styles.confirmNo} onClick={() => setConfirm(null)}>
                            Cancel
                          </button>
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
                        />
                      )}
                    </div>
                  ))}
              </div>

            </div>
          );
        })}

        {filteredCategories.length === 0 && editingId !== "new" && (
          <div className={styles.emptyState}>
            <p>No categories found matching your selected filter or search query.</p>
          </div>
        )}
      </div>

    </div>
  );
}
