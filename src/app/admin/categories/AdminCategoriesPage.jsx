"use client";

import { useState, useRef } from "react";
import { useData } from "@/context/DataContext";
import { useAdmin } from "@/context/AdminContext";
import styles from "@/styles/AdminCategories.module.css";

const EMPTY_CAT = { id: "", topic: "", emoji: "", description: "", categoryClass: "", hidden: false, image: "", parentId: "", showSubCategoriesOnHome: false, storyText: "", storyImage: "", originalLang: "en", isTrending: false, chips: [] };

async function submitPending(type, payload) {
  const res = await fetch("/api/admin/pending", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type, payload }),
  });
  if (res.ok) alert("Your change has been submitted for approval.");
  else alert("Failed to submit change for approval.");
}

export default function AdminCategoriesPage() {
  const { quizzes, settings, addCategory, updateCategory, deleteCategory, reorderCategories } = useData();
  const { adminUser } = useAdmin();
  const isJr = adminUser?.role === "jr";
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_CAT);
  const [confirm, setConfirm] = useState(null);
  const dragItem = useRef(null);
  const dragOver = useRef(null);

  const openAdd = () => {
    setEditingId("new");
    setForm(EMPTY_CAT);
  };

  const openEdit = (cat) => {
    setForm({
      id: cat.id,
      topic: cat.topic,
      emoji: cat.emoji,
      description: cat.description,
      categoryClass: cat.categoryClass,
      hidden: !!cat.hidden,
      image: cat.image || "",
      parentId: cat.parentId || "",
      showSubCategoriesOnHome: !!cat.showSubCategoriesOnHome,
      storyText: cat.storyText || "",
      storyImage: cat.storyImage || "",
      originalLang: cat.originalLang || "en",
      isTrending: !!cat.isTrending,
      chips: Array.isArray(cat.chips) ? cat.chips : [],
    });
    setEditingId(cat.id);
  };

  const handleSave = async () => {
    if (!form.topic.trim() || !form.emoji.trim()) return;
    
    if (editingId !== "new") {
      const data = { 
        topic: form.topic, 
        emoji: form.emoji, 
        description: form.description, 
        categoryClass: form.categoryClass, 
        hidden: form.hidden, 
        image: form.image, 
        parentId: form.parentId || null, 
        showSubCategoriesOnHome: form.showSubCategoriesOnHome,
        storyText: form.storyText,
        storyImage: form.storyImage,
        originalLang: form.originalLang,
        isTrending: form.isTrending,
        chips: Array.isArray(form.chips) ? form.chips : [],
      };
      if (isJr) {
        await submitPending("update_category", { categoryId: editingId, ...data });
      } else {
        await updateCategory(editingId, data);
      }
    } else {
      const id = form.topic.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
      const data = { 
        id, 
        topic: form.topic, 
        emoji: form.emoji, 
        description: form.description, 
        categoryClass: form.categoryClass || `category-${id}`, 
        hidden: form.hidden, 
        image: form.image, 
        parentId: form.parentId || null, 
        showSubCategoriesOnHome: form.showSubCategoriesOnHome, 
        storyText: form.storyText,
        storyImage: form.storyImage,
        originalLang: form.originalLang,
        isTrending: form.isTrending,
        chips: Array.isArray(form.chips) ? form.chips : [],
        questions: [] 
      };
      if (isJr) {
        await submitPending("create_category", data);
      } else {
        await addCategory(data);
      }
    }
    setEditingId(null);
  };

  const handleDelete = async (id) => {
    if (isJr) {
      await submitPending("delete_category", { categoryId: id });
    } else {
      await deleteCategory(id);
    }
    setConfirm(null);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setForm({ ...form, image: ev.target.result });
    reader.readAsDataURL(file);
  };

  const handleStoryImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setForm({ ...form, storyImage: ev.target.result });
    reader.readAsDataURL(file);
  };

  const EditForm = ({ isNew = false }) => (
    <div className={styles.inlineForm}>
      <h2 className={styles.formTitle}>
        {isNew ? "Add Category" : "Edit Category"}
      </h2>
      <div className={styles.formGrid}>
        <div className={styles.field}>
          <label>Emoji</label>
          <input
            value={form.emoji}
            onChange={(e) => setForm({ ...form, emoji: e.target.value })}
            placeholder="e.g. 🔬"
            className={styles.input}
          />
        </div>
        <div className={styles.field}>
          <label>Topic Name</label>
          <input
            value={form.topic}
            onChange={(e) => setForm({ ...form, topic: e.target.value })}
            placeholder="e.g. Science"
            className={styles.input}
          />
        </div>
        <div className={styles.field}>
          <label>Description</label>
          <input
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Short description"
            className={styles.input}
          />
        </div>

        <div className={styles.field}>
          <label>Parent Category (Optional)</label>
          <select
            value={form.parentId}
            onChange={(e) => setForm({ ...form, parentId: e.target.value })}
            className={styles.input}
          >
            <option value="">None (Top Level)</option>
            {quizzes
              .filter((c) => c.id !== editingId && !c.parentId)
              .map((c) => (
                <option key={c.id} value={c.id}>
                  {c.emoji} {c.topic}
                </option>
              ))}
          </select>
        </div>

        <div className={styles.toggleField}>
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={form.showSubCategoriesOnHome}
              onChange={(e) => setForm({ ...form, showSubCategoriesOnHome: e.target.checked })}
            />
            Show sub-categories on home page
          </label>
        </div>
        <div className={styles.field}>
          <label>Category Image</label>
          <input type="file" accept="image/*" onChange={handleImageUpload} className={styles.fileInput} />
          {form.image && (
            <div className={styles.imagePreview}>
              <img src={form.image} alt="Preview" />
              <button type="button" className={styles.removeImg} onClick={() => setForm({ ...form, image: "" })}>✕ Remove</button>
            </div>
          )}
        </div>
        <div className={styles.field}>
          <label>Original Language</label>
          <select
            value={form.originalLang}
            onChange={(e) => setForm({ ...form, originalLang: e.target.value })}
            className={styles.input}
          >
            <option value="en">English</option>
            <option value="hi">Hindi</option>
          </select>
        </div>

        <div className={styles.field}>
          <label>Assign Chips</label>
          <div className={styles.chipsWrap}>
            {(function () {
              let list = [];
              try {
                list = JSON.parse(settings?.homeChips || "[]");
              } catch {
                list = [];
              }
              if (!Array.isArray(list) || list.length === 0) {
                list = ["Science", "History", "GK", "Quick 5 Min"];
              }
              return (Array.isArray(list) ? list : []).map((chip) => (
                <label key={chip} className={styles.chipCheck}>
                  <input
                    type="checkbox"
                    checked={Array.isArray(form.chips) && form.chips.includes(chip)}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setForm((prev) => {
                        const current = new Set(Array.isArray(prev.chips) ? prev.chips : []);
                        if (checked) current.add(chip);
                        else current.delete(chip);
                        return { ...prev, chips: Array.from(current) };
                      });
                    }}
                  />
                  <span>#{chip}</span>
                </label>
              ));
            })()}
          </div>
        </div>

        <div className={styles.checkboxField}>
          <label>
            <input
              type="checkbox"
              checked={form.isTrending}
              onChange={(e) => setForm({ ...form, isTrending: e.target.checked })}
            />
            <span>Mark as Trending 🔥</span>
          </label>
        </div>

        <div className={styles.checkboxField}>
          <label>
            <input
              type="checkbox"
              checked={form.hidden}
              onChange={(e) => setForm({ ...form, hidden: e.target.checked })}
            />
            <span>Hidden from public view</span>
          </label>
        </div>
      </div>

      <hr className={styles.divider} />
      <div className={styles.storySection}>
        <h3 className={styles.sectionTitle}>Informative Story Section</h3>
        <div className={styles.field}>
          <label>Story Image (Displayed in sidebar)</label>
          <input type="file" accept="image/*" onChange={handleStoryImageUpload} className={styles.fileInput} />
          {form.storyImage && (
            <div className={styles.imagePreview}>
              <img src={form.storyImage} alt="Story Preview" />
              <button type="button" className={styles.removeImg} onClick={() => setForm({ ...form, storyImage: "" })}>✕ Remove</button>
            </div>
          )}
        </div>
        <div className={styles.field}>
          <label>Story/Informative Text</label>
          <textarea
            value={form.storyText}
            onChange={(e) => setForm({ ...form, storyText: e.target.value })}
            placeholder="Add a short story or informative text about this quiz..."
            className={styles.textarea}
            rows={5}
          />
        </div>
      </div>

      <div className={styles.formActions}>
        <button className="btn-secondary" onClick={() => setEditingId(null)}>
          Cancel
        </button>
        <button className="btn-primary" onClick={handleSave}>
          {isNew ? "Add Category" : "Save Changes"}
        </button>
      </div>
    </div>
  );

  const handleDragEnd = () => {
    if (dragItem.current === null || dragOver.current === null) return;
    if (dragItem.current === dragOver.current) return;
    const items = [...quizzes];
    const [removed] = items.splice(dragItem.current, 1);
    items.splice(dragOver.current, 0, removed);
    reorderCategories(items);
    dragItem.current = null;
    dragOver.current = null;
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Categories</h1>
          <p className={styles.subtitle}>Manage quiz categories</p>
        </div>
        <button className="btn-primary" onClick={openAdd}>
          + Add Category
        </button>
      </div>

      <div className={styles.list}>
        {editingId === "new" && <EditForm isNew={true} />}
        {quizzes
          .filter((c) => !c.parentId)
          .map((cat, idx) => (
            <div key={cat.id}>
              <div
                className={`${styles.row} glass-card ${editingId === cat.id ? styles.editingRow : ""}`}
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
                    <span className={styles.emoji}>{cat.emoji}</span>
                  )}
                  <div>
                    <span className={styles.name}>
                      {cat.topic}
                      <span className={`${styles.langBadge} ${cat.originalLang === 'hi' ? styles.langHi : styles.langEn}`}>
                        {cat.originalLang === 'hi' ? 'HI' : 'EN'}
                      </span>
                    </span>
                    <span className={styles.desc}>{cat.description}</span>
                  </div>
                </div>
                <div className={styles.rowMeta}>
                  {cat.showSubCategoriesOnHome && (
                    <span className={styles.homeBadge} title="Sub-categories shown on home page">🏠</span>
                  )}
                  {cat.hidden && <span className={styles.hiddenBadge}>Hidden</span>}
                  {cat.isTrending && <span className={styles.trendingBadge}>🔥 Trending</span>}
                  <span className={styles.count}>{cat.questions.length} Q</span>
                  <div className={styles.actions}>
                    <button
                      className={styles.visibilityBtn}
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
                    <button className={styles.editBtn} onClick={() => openEdit(cat)}>
                      {editingId === cat.id ? "📂" : "✏️"}
                    </button>
                    <button
                      className={styles.deleteBtn}
                      onClick={() => setConfirm(cat.id)}
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                {confirm === cat.id && (
                  <div className={styles.confirmBar}>
                    <span>Delete "{cat.topic}" and all its questions?</span>
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

              {/* Inline Edit Form for Main Category */}
              {editingId === cat.id && <EditForm />}

              {/* Render sub-categories */}
              <div className={styles.subRows}>
                {quizzes
                  .filter((sub) => sub.parentId === cat.id)
                  .map((sub) => (
                    <div
                      key={sub.id}
                      className={`${styles.row} ${styles.subRow} glass-card ${editingId === sub.id ? styles.editingRow : ""}`}
                    >
                      <div className={styles.rowInfo}>
                        <span className={styles.subIndicator}>↳</span>
                        {sub.image ? (
                          <img src={sub.image} alt="" className={styles.rowImage} />
                        ) : (
                          <span className={styles.emoji}>{sub.emoji}</span>
                        )}
                        <div>
                          <span className={styles.name}>{sub.topic}</span>
                          <span className={styles.desc}>{sub.description}</span>
                        </div>
                      </div>
                      <div className={styles.rowMeta}>
                        {sub.hidden && (
                          <span className={styles.hiddenBadge}>Hidden</span>
                        )}
                        <span className={styles.count}>{sub.questions.length} Q</span>
                        <div className={styles.actions}>
                          <button
                            className={styles.visibilityBtn}
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
                          <button
                            className={styles.editBtn}
                            onClick={() => openEdit(sub)}
                          >
                            {editingId === sub.id ? "📂" : "✏️"}
                          </button>
                          <button
                            className={styles.deleteBtn}
                            onClick={() => setConfirm(sub.id)}
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                      {confirm === sub.id && (
                        <div className={styles.confirmBar}>
                          <span>Delete "{sub.topic}" and all its questions?</span>
                          <button
                            className={styles.confirmYes}
                            onClick={() => handleDelete(sub.id)}
                          >
                            Yes, Delete
                          </button>
                          <button
                            className={styles.confirmNo}
                            onClick={() => setConfirm(null)}
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                      {/* Inline Edit Form for Sub-Category */}
                      {editingId === sub.id && <EditForm />}
                    </div>
                  ))}
              </div>
            </div>
          ))}
        {quizzes.length === 0 && editingId !== "new" && (
          <p className={styles.empty}>No categories yet. Add one above!</p>
        )}
      </div>
    </div>
  );
}
