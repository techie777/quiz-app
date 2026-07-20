"use client";

import { useState, useMemo, useCallback } from "react";
import { useData } from "@/context/DataContext";
import { useAdmin } from "@/context/AdminContext";
import styles from "@/styles/AdminQuestions.module.css";
import toast from "react-hot-toast";
import Select from "react-select";

// Pexels Image Picker Component
function PexelsImagePicker({ onSelect, onClose }) {
  const [query, setQuery] = useState("");
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const res = await fetch(`/api/admin/pexels?query=${encodeURIComponent(query.trim())}`);
      const data = await res.json();
      if (data.error) {
        toast.error(data.error);
        setPhotos([]);
      } else {
        setPhotos(data.photos || []);
      }
    } catch {
      toast.error("Failed to fetch images from Pexels");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
      zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center'
    }} onClick={onClose}>
      <div style={{
        background: 'var(--bg-primary, #fff)', borderRadius: '16px',
        padding: '24px', width: '90%', maxWidth: '800px', maxHeight: '85vh',
        overflow: 'auto', boxShadow: '0 25px 50px rgba(0,0,0,0.4)'
      }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>🔍 Search Pexels Images</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', color: 'var(--text-muted)' }}>✕</button>
        </div>

        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="e.g. Eiffel Tower, Taj Mahal, Amazon logo..."
            style={{
              flex: 1, padding: '10px 16px', borderRadius: '10px',
              border: '1.5px solid var(--card-border)', fontSize: '0.95rem',
              background: 'var(--bg-secondary)', color: 'var(--text-primary)'
            }}
            autoFocus
          />
          <button type="submit" style={{
            padding: '10px 22px', borderRadius: '10px', border: 'none',
            background: 'var(--accent, #4f46e5)', color: 'white',
            fontWeight: '700', cursor: 'pointer', fontSize: '0.95rem'
          }} disabled={loading}>
            {loading ? 'Searching...' : 'Search'}
          </button>
        </form>

        {loading && (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
            ⏳ Fetching images from Pexels...
          </div>
        )}

        {!loading && searched && photos.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
            No images found. Try a different search term.
          </div>
        )}

        {!loading && photos.length > 0 && (
          <>
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px'
            }}>
              {photos.map(photo => (
                <div
                  key={photo.id}
                  onClick={() => { onSelect(photo.url); onClose(); }}
                  style={{
                    cursor: 'pointer', borderRadius: '10px', overflow: 'hidden',
                    border: '2px solid transparent', transition: 'all 0.2s',
                    position: 'relative'
                  }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent, #4f46e5)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'transparent'}
                >
                  <img
                    src={photo.thumb}
                    alt={photo.alt || photo.photographer}
                    style={{ width: '100%', height: '130px', objectFit: 'cover', display: 'block' }}
                    loading="lazy"
                  />
                  <div style={{
                    padding: '6px 8px', fontSize: '0.7rem',
                    color: 'var(--text-muted)', background: 'var(--bg-secondary)'
                  }}>
                    📷 {photo.photographer}
                  </div>
                </div>
              ))}
            </div>
            <p style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '12px' }}>
              Photos provided by <a href="https://www.pexels.com" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)' }}>Pexels</a>
            </p>
          </>
        )}
      </div>
    </div>
  );
}

const EMPTY_Q = { text: "", options: ["", "", "", ""], correctAnswer: "", difficulty: "easy", image: "", explanation: "" };

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

export default function AdminQuestionsPage() {
  const { quizzes, addQuestion, updateQuestion, deleteQuestion, bulkDeleteQuestions, refreshQuizzes } = useData();
  const { adminUser } = useAdmin();
  const isJr = adminUser?.role === "jr";
  const allowed = adminUser?.role === "master" || adminUser?.permissions?.questions !== false;
  const [filterCat, setFilterCat] = useState("all");
  const [filterDiff, setFilterDiff] = useState("all");
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCat, setEditingCat] = useState(null);
  const [editingQ, setEditingQ] = useState(null);
  const [form, setForm] = useState(EMPTY_Q);
  const [formCatId, setFormCatId] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  const [duplicateMatches, setDuplicateMatches] = useState({}); // { qId: { matchId, text, score } }
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [showOnlyDupes, setShowOnlyDupes] = useState(false);
  const [showPexelsPicker, setShowPexelsPicker] = useState(false);
  const [catTab, setCatTab] = useState("quizzes");
  const [catSearch, setCatSearch] = useState("");

  // Build flat list
  const allQuestions = useMemo(() => {
    const list = [];
    quizzes.forEach((cat) =>
      cat.questions.forEach((q) =>
        list.push({ ...q, categoryId: cat.id, categoryTopic: cat.topic, categoryEmoji: cat.emoji })
      )
    );
    return list;
  }, [quizzes]);

  const filtered = useMemo(() => {
    return allQuestions.filter((q) => {
      if (filterCat !== "all" && q.categoryId !== filterCat) return false;
      if (filterDiff !== "all" && q.difficulty !== filterDiff) return false;
      if (search && !q.text.toLowerCase().includes(search.toLowerCase())) return false;
      if (showOnlyDupes && !duplicateMatches[q.id]) return false;
      return true;
    });
  }, [allQuestions, filterCat, filterDiff, search, showOnlyDupes, duplicateMatches]);

  const startFuzzyScan = async () => {
    setIsScanning(true);
    setScanProgress(0);
    const matches = {};
    const total = allQuestions.length;
    
    // Pre-processing: tokenize all questions
    const tokenized = allQuestions.map(q => ({
      id: q.id,
      text: q.text,
      words: new Set(q.text.toLowerCase().replace(/[?.,!]/g, "").split(/\s+/).filter(w => w.length > 1))
    }));

    const CHUNK_SIZE = 50;
    
    for (let i = 0; i < total; i++) {
      const q1 = tokenized[i];
      if (q1.words.size === 0) continue;

      for (let j = i + 1; j < total; j++) {
        const q2 = tokenized[j];
        if (q2.words.size === 0) continue;

        // Jaccard-like similarity Score
        let intersection = 0;
        q1.words.forEach(w => { if (q2.words.has(w)) intersection++; });
        
        const minLen = Math.min(q1.words.size, q2.words.size);
        const score = intersection / minLen;

        if (score >= 0.7) {
          matches[q1.id] = { matchId: q2.id, text: q2.text, score: Math.round(score * 100) };
          matches[q2.id] = { matchId: q1.id, text: q1.text, score: Math.round(score * 100) };
        }
      }

      // Batch UI updates and avoid freezing
      if (i % CHUNK_SIZE === 0) {
        setScanProgress(Math.round((i / total) * 100));
        await new Promise(r => setTimeout(r, 0));
      }
    }

    setDuplicateMatches(matches);
    setIsScanning(false);
    setScanProgress(100);
    if (Object.keys(matches).length > 0) {
      toast.success(`Scan complete! Found ${Object.keys(matches).length / 2} potential duplicate pairs.`);
      setShowOnlyDupes(true);
    } else {
      toast.success("Scan complete! No duplicates found.");
    }
  };

  if (!allowed) {
    return (
      <div className={styles.page}>
        <p>Access denied.</p>
      </div>
    );
  }

  const openAdd = () => {
    setEditingQ(null);
    setEditingCat(null);
    setForm(EMPTY_Q);
    setFormCatId(quizzes[0]?.id || "");
    setModalOpen(true);
  };

  const openEdit = (q) => {
    setEditingQ(q);
    setEditingCat(q.categoryId);
    setFormCatId(q.categoryId);
    setForm({
      text: q.text,
      options: [...q.options],
      correctAnswer: q.correctAnswer,
      difficulty: q.difficulty,
      image: q.image || "",
      explanation: q.explanation || "",
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    console.log("[AdminQuestions] handleSave called", { editingQ: !!editingQ, formCatId });
    try {
      if ((!form.text.trim() && !form.image) || !form.correctAnswer || !formCatId) {
        toast.error("Please provide either question text or an image, along with category and answer.");
        return;
      }
      if (form.options.some((o) => !o.trim())) {
        toast.error("All 4 options must be filled.");
        return;
      }

      if (editingQ) {
        const data = { 
          text: form.text, 
          options: form.options, 
          correctAnswer: form.correctAnswer, 
          difficulty: form.difficulty, 
          image: form.image || null,
          explanation: form.explanation || null
        };
        if (isJr) {
          console.log("[AdminQuestions] Submitting pending update");
          await submitPending("update_question", { categoryId: editingCat, questionId: editingQ.id, ...data });
          setModalOpen(false);
        } else {
          console.log("[AdminQuestions] Updating question directly:", editingQ.id);
          const success = await updateQuestion(editingCat, editingQ.id, data);
          if (success) {
            toast.success("Question updated successfully!");
            setModalOpen(false);
          } else {
            toast.error("Failed to update question.");
          }
        }
      } else {
        const data = { 
          text: form.text, 
          options: form.options, 
          correctAnswer: form.correctAnswer, 
          difficulty: form.difficulty, 
          image: form.image || null,
          explanation: form.explanation || null
        };
        if (isJr) {
          console.log("[AdminQuestions] Submitting pending creation");
          await submitPending("create_question", { categoryId: formCatId, ...data });
          setModalOpen(false);
        } else {
          console.log("[AdminQuestions] Creating question directly in category:", formCatId);
          const success = await addQuestion(formCatId, data);
          if (success) {
            toast.success("Question created successfully!");
            setModalOpen(false);
          } else {
            toast.error("Failed to create question. Please check server logs.");
          }
        }
      }
    } catch (error) {
      console.error("[AdminQuestions] handleSave error:", error);
      toast.error("An unexpected error occurred: " + error.message);
    }
  };

  const handleDelete = async (catId, qId) => {
    if (confirm("Are you sure you want to delete this question?")) {
      if (isJr) {
        await submitPending("delete_question", { categoryId: catId, questionId: qId });
      } else {
        const success = await deleteQuestion(catId, qId);
        if (success) toast.success("Question deleted successfully!");
        else toast.error("Failed to delete question.");
      }
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (confirm(`Are you sure you want to delete ${selectedIds.length} questions?`)) {
      const success = await bulkDeleteQuestions(selectedIds);
      if (success) {
        toast.success(`Deleted ${selectedIds.length} questions.`);
        setSelectedIds([]);
      } else {
        toast.error("Failed to delete questions.");
      }
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filtered.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filtered.map(q => q.id));
    }
  };

  const setOption = (index, value) => {
    const opts = [...form.options];
    opts[index] = value;
    setForm({ ...form, options: opts });
  };

  const handleQImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setForm({ ...form, image: ev.target.result });
    reader.readAsDataURL(file);
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Questions</h1>
          <p className={styles.subtitle}>{filtered.length} of {allQuestions.length} questions</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button
            style={{ padding: '8px 14px', borderRadius: '8px', border: '1.5px solid var(--card-border)', background: 'transparent', color: 'var(--text-secondary)', fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem' }}
            onClick={async () => { await refreshQuizzes(); }}
            title="Refresh question list"
          >
            🔄 Refresh
          </button>
          <button className="btn-primary" onClick={openAdd}>
            + Add Question
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className={styles.filters}>
        <input
          className={styles.searchInput}
          placeholder="Search questions..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div style={{ flex: 1, minWidth: '250px' }}>
          <Select
            options={[
              { value: "all", label: "All Categories" },
              ...quizzes.map((c) => ({ value: c.id, label: `${c.emoji} ${c.topic}` }))
            ]}
            value={{ 
              value: filterCat, 
              label: filterCat === "all" ? "All Categories" : (quizzes.find(c => c.id === filterCat) ? `${quizzes.find(c => c.id === filterCat).emoji} ${quizzes.find(c => c.id === filterCat).topic}` : "All Categories") 
            }}
            onChange={(selected) => setFilterCat(selected.value)}
            className="react-select-container"
            classNamePrefix="react-select"
            styles={{
              control: (base) => ({
                ...base,
                borderRadius: '8px',
                borderColor: 'var(--card-border)',
                minHeight: '42px',
                background: 'var(--bg-secondary)',
              }),
              menu: (base) => ({
                ...base,
                zIndex: 9999
              }),
              singleValue: (base) => ({
                ...base,
                color: 'var(--text-primary)',
              }),
              input: (base) => ({
                ...base,
                color: 'var(--text-primary)',
              })
            }}
          />
        </div>
        <select
          className={styles.select}
          value={filterDiff}
          onChange={(e) => setFilterDiff(e.target.value)}
        >
          <option value="all">All Difficulties</option>
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>

        <button 
          onClick={startFuzzyScan} 
          disabled={isScanning}
          className={`${styles.scanBtn} ${isScanning ? styles.scanning : ''}`}
        >
          {isScanning ? `Scanning ${scanProgress}%...` : '🔍 Scan Duplicates'}
        </button>

        {Object.keys(duplicateMatches).length > 0 && (
          <label className={styles.dupeToggle}>
            <input 
              type="checkbox" 
              checked={showOnlyDupes} 
              onChange={e => setShowOnlyDupes(e.target.checked)} 
            />
            Duplicates Only
          </label>
        )}
      </div>

      {/* Selection Status Bar */}
      <div className={`${styles.selectActions} ${selectedIds.length > 0 ? styles.activeSelection : ''}`}>
        <label className={styles.checkboxLabel}>
          <input 
            type="checkbox" 
            className={styles.mainCheckbox}
            checked={filtered.length > 0 && selectedIds.length === filtered.length}
            onChange={toggleSelectAll}
          />
          <span className={styles.selectionText}>
            {selectedIds.length > 0 ? `${selectedIds.length} questions selected` : 'Select All Questions'}
          </span>
        </label>
        {selectedIds.length > 0 && !isJr && (
          <button className={styles.bulkDeleteBtn} onClick={handleBulkDelete}>
            🗑️ Delete Selected
          </button>
        )}
      </div>

      {/* Question List */}
      <div className={styles.list}>
        {filtered.map((q) => {
          const match = duplicateMatches[q.id];
          return (
          <div key={q.id} className={`${styles.row} glass-card ${selectedIds.includes(q.id) ? styles.rowSelected : ''} ${match ? styles.rowDuplicate : ''}`}>
            <div className={styles.rowSelector}>
              <input 
                type="checkbox" 
                checked={selectedIds.includes(q.id)}
                onChange={() => toggleSelect(q.id)}
              />
            </div>
            <div className={styles.rowContent}>
              <div className={styles.rowTop}>
                <div className={styles.rowBadges}>
                  <span className={styles.catBadge}>
                    {q.categoryEmoji} {q.categoryTopic}
                  </span>
                  <span className={`${styles.diffBadge} ${styles[q.difficulty]}`}>
                    {q.difficulty}
                  </span>
                  {match && (
                    <span className={styles.dupeBadge}>
                      Potential Duplicate ({match.score}%)
                    </span>
                  )}
                </div>
                <div className={styles.rowActions}>
                  <button className={styles.editBtn} onClick={() => openEdit(q)} title="Edit">
                    ✏️ Edit
                  </button>
                  <button
                    className={styles.deleteBtn}
                    onClick={() => handleDelete(q.categoryId, q.id)}
                    title="Delete"
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>
              <p className={styles.questionText}>{q.text}</p>
              {match && (
                <div className={styles.matchBox}>
                   <div className={styles.matchLabel}>SIMILAR TO:</div>
                   <div className={styles.matchText}>{match.text}</div>
                </div>
              )}
              {q.image && <img src={q.image} alt="" className={styles.questionImg} />}
              <div className={styles.optionsList}>
                {q.options.map((opt, i) => (
                  <span
                    key={i}
                    className={`${styles.optTag} ${opt === q.correctAnswer ? styles.correctTag : ""}`}
                  >
                    {opt}
                    {opt === q.correctAnswer && " ✓"}
                  </span>
                ))}
              </div>
            </div>
          </div>
          );
        })}
        {filtered.length === 0 && (
          <p className={styles.empty}>No questions match your filters.</p>
        )}
      </div>

      {/* Add/Edit Modal */}
      {modalOpen && (
        <div className={styles.overlay} onClick={() => setModalOpen(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2 className={styles.modalTitle}>
              {editingQ ? "Edit Question" : "Add Question"}
            </h2>

            <div className={styles.field}>
              <label>Category</label>
              {editingQ ? (
                <input
                  className={styles.input}
                  value={quizzes.find(c => c.id === formCatId)?.topic || formCatId}
                  disabled
                />
              ) : (
                <div style={{ border: '1.5px solid var(--card-border)', borderRadius: '12px', overflow: 'hidden' }}>
                  {/* Tabs */}
                  <div style={{ display: 'flex', borderBottom: '1.5px solid var(--card-border)', background: 'var(--bg-secondary)' }}>
                    {[
                      { key: 'quizzes', label: '📝 Quizzes' },
                      { key: 'govt', label: '🏛️ Govt' },
                      { key: 'image', label: '🖼️ Image' },
                    ].map(tab => (
                      <button
                        key={tab.key}
                        type="button"
                        onClick={() => { setCatTab(tab.key); setCatSearch(''); }}
                        style={{
                          flex: 1, padding: '8px 4px', border: 'none', fontSize: '0.78rem', fontWeight: 700,
                          background: catTab === tab.key ? 'var(--accent, #4f46e5)' : 'transparent',
                          color: catTab === tab.key ? 'white' : 'var(--text-secondary)',
                          cursor: 'pointer', transition: 'all 0.2s'
                        }}
                      >{tab.label}</button>
                    ))}
                  </div>
                  {/* Search */}
                  <div style={{ padding: '8px', borderBottom: '1px solid var(--card-border)' }}>
                    <input
                      type="text"
                      value={catSearch}
                      onChange={e => setCatSearch(e.target.value)}
                      placeholder="Search category..."
                      style={{
                        width: '100%', padding: '6px 10px', borderRadius: '8px',
                        border: '1px solid var(--card-border)', fontSize: '0.85rem',
                        background: 'var(--bg-primary)', color: 'var(--text-primary)', boxSizing: 'border-box'
                      }}
                    />
                  </div>
                  {/* Category List */}
                  <div style={{ maxHeight: '180px', overflowY: 'auto', padding: '4px' }}>
                    {quizzes
                      .filter(c => {
                        const cls = c.categoryClass || '';
                        if (catTab === 'govt') return cls.includes('govt-exam');
                        if (catTab === 'image') return cls.includes('image-quiz');
                        return !cls.includes('govt-exam') && !cls.includes('image-quiz');
                      })
                      .filter(c => !catSearch || c.topic.toLowerCase().includes(catSearch.toLowerCase()))
                      .map(c => (
                        <div
                          key={c.id}
                          onClick={() => setFormCatId(c.id)}
                          style={{
                            padding: '7px 10px', borderRadius: '8px', cursor: 'pointer',
                            fontSize: '0.87rem', fontWeight: formCatId === c.id ? 700 : 400,
                            background: formCatId === c.id ? 'var(--accent, #4f46e5)' : 'transparent',
                            color: formCatId === c.id ? 'white' : 'var(--text-primary)',
                            transition: 'all 0.15s', marginBottom: '2px'
                          }}
                        >
                          {c.emoji} {c.topic}
                          {c.parentId && <span style={{ fontSize: '0.72rem', opacity: 0.7, marginLeft: 4 }}>↳ sub</span>}
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>

            <div className={styles.field}>
              <label>Question Text</label>
              <textarea
                className={styles.textarea}
                value={form.text}
                onChange={(e) => setForm({ ...form, text: e.target.value })}
                placeholder="Enter the question"
                rows={3}
              />
            </div>

            <div className={styles.field}>
              <label>Options (4 required)</label>
              {form.options.map((opt, i) => (
                <input
                  key={i}
                  className={styles.input}
                  value={opt}
                  onChange={(e) => setOption(i, e.target.value)}
                  placeholder={`Option ${i + 1}`}
                  style={{ marginBottom: 8 }}
                />
              ))}
            </div>

            <div className={styles.field}>
              <label>Correct Answer</label>
              <select
                className={styles.select}
                value={form.correctAnswer}
                onChange={(e) => setForm({ ...form, correctAnswer: e.target.value })}
              >
                <option value="">Select correct answer</option>
                {form.options.filter(Boolean).map((opt, i) => (
                  <option key={i} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.field}>
              <label>Difficulty</label>
              <select
                className={styles.select}
                value={form.difficulty}
                onChange={(e) => setForm({ ...form, difficulty: e.target.value })}
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>

            <div className={styles.field}>
              <label>Explanation</label>
              <textarea
                className={styles.textarea}
                value={form.explanation || ""}
                onChange={(e) => setForm({ ...form, explanation: e.target.value })}
                placeholder="Enter explanation for the correct answer..."
                rows={3}
              />
            </div>

            <div className={styles.field}>
              <label>Question Image (optional)</label>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '8px' }}>
                <input type="file" accept="image/*" onChange={handleQImageUpload} className={styles.fileInput} style={{ flex: 1 }} />
                <button
                  type="button"
                  onClick={() => setShowPexelsPicker(true)}
                  style={{
                    padding: '8px 14px', borderRadius: '8px', border: '1.5px solid var(--accent, #4f46e5)',
                    background: 'transparent', color: 'var(--accent, #4f46e5)',
                    fontWeight: '700', cursor: 'pointer', fontSize: '0.85rem',
                    whiteSpace: 'nowrap'
                  }}
                >
                  🖼️ Pexels
                </button>
              </div>
              {form.image && (
                <div className={styles.imgPreviewWrap}>
                  <img src={form.image} alt="Preview" className={styles.imgPreview} />
                  <button type="button" className={styles.removeImgBtn} onClick={() => setForm({ ...form, image: "" })}>✕ Remove</button>
                </div>
              )}
            </div>

            <div className={styles.modalActions}>
              <button className="btn-secondary" onClick={() => setModalOpen(false)}>
                Cancel
              </button>
              <button className="btn-primary" onClick={handleSave}>
                {editingQ ? "Save Changes" : "Add Question"}
              </button>
            </div>
           </div>
        </div>
      )}

      {/* Pexels Image Picker */}
      {showPexelsPicker && (
        <PexelsImagePicker
          onSelect={(url) => setForm({ ...form, image: url })}
          onClose={() => setShowPexelsPicker(false)}
        />
      )}
    </div>
  );
}
