"use client";

import { useState, useEffect } from "react";
import styles from "@/styles/AdminCategories.module.css";
import { useAdmin } from "@/context/AdminContext";
import toast from "react-hot-toast";

export default function SchoolStudyAdminPage() {
  const { adminUser } = useAdmin();
  const [view, setView] = useState({ level: 'boards', id: null, path: [] });
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [deletingItem, setDeletingItem] = useState(null); // { id, name }
  
  const [formData, setFormData] = useState({});
  const [mcqOptions, setMcqOptions] = useState(["", "", "", ""]);

  const fetchItems = async () => {
    setLoading(true);
    let url = `/api/admin/school-study?type=${view.level}`;
    if (view.level === 'classes') url += `&boardId=${view.path[0].id}`;
    if (view.level === 'subjects') url += `&classId=${view.path[1].id}`;
    if (view.level === 'chapters') url += `&subjectId=${view.path[2].id}`;
    if (view.level === 'questions') url += `&chapterId=${view.path[3].id}`;

    try {
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setItems(data[view.level]);
      }
    } catch (err) {
      toast.error("Failed to fetch items");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [view]);

  const handleLevelDown = (item, nextLevel) => {
    setView({
      level: nextLevel,
      id: item.id,
      path: [...view.path, { id: item.id, name: item.name || `Class ${item.number}` || item.title }]
    });
  };

  const handleLevelUp = (index) => {
    if (index === -1) {
      setView({ level: 'boards', id: null, path: [] });
    } else {
      const newPath = view.path.slice(0, index + 1);
      const levels = ['boards', 'classes', 'subjects', 'chapters', 'questions'];
      setView({
        level: levels[index + 1],
        id: newPath[index].id,
        path: newPath
      });
    }
  };

  const openAddModal = () => {
    setEditingItem(null);
    setMcqOptions(["", "", "", ""]);
    if (view.level === 'boards') setFormData({ name: "", slug: "", sortOrder: 0 });
    if (view.level === 'classes') setFormData({ number: "", boardId: view.path[0].id });
    if (view.level === 'subjects') setFormData({ name: "", slug: "", sortOrder: 0, classId: view.path[1].id });
    if (view.level === 'chapters') setFormData({ title: "", sortOrder: 0, subjectId: view.path[2].id });
    if (view.level === 'questions') {
      setFormData({ type: "mcq", prompt: "", options: "[]", answer: "", explanation: "", chapterId: view.path[3].id });
      setMcqOptions(["", "", "", ""]);
    }
    setShowModal(true);
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setFormData({ ...item });
    if (view.level === 'questions') {
      try {
        const parsed = JSON.parse(item.options || "[]");
        if (Array.isArray(parsed) && parsed.length > 0) {
          while (parsed.length < 4) parsed.push("");
          setMcqOptions(parsed.slice(0, 4));
        } else {
          setMcqOptions(["", "", "", ""]);
        }
      } catch {
        setMcqOptions(["", "", "", ""]);
      }
    }
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const method = editingItem ? "PUT" : "POST";
    const typeMap = { boards: 'board', classes: 'class', subjects: 'subject', chapters: 'chapter', questions: 'question' };
    
    let processedFormData = { ...formData };
    if (view.level === 'questions' && formData.type === 'mcq') {
      const cleanOptions = mcqOptions.map(o => o.trim()).filter(Boolean);
      if (cleanOptions.length < 2) {
        toast.error("Please enter at least 2 non-empty options for the MCQ");
        return;
      }
      processedFormData.options = JSON.stringify(cleanOptions);
      if (!processedFormData.answer || !cleanOptions.includes(processedFormData.answer)) {
        processedFormData.answer = cleanOptions[0]; // fallback to first option
      }
    }

    const payload = { ...processedFormData, type: typeMap[view.level] };
    if (editingItem) payload.id = editingItem.id;

    try {
      const res = await fetch("/api/admin/school-study", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Saved successfully");
        setShowModal(false);
        fetchItems();
      } else {
        toast.error(data.message || "Error saving");
      }
    } catch (err) {
      toast.error("Network error");
    }
  };

  const confirmDelete = async () => {
    if (!deletingItem) return;
    const typeMap = { boards: 'board', classes: 'class', subjects: 'subject', chapters: 'chapter', questions: 'question' };
    try {
      const res = await fetch(`/api/admin/school-study?type=${typeMap[view.level]}&id=${deletingItem.id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        toast.success("Deleted successfully");
        setDeletingItem(null);
        fetchItems();
      } else {
        toast.error(data.message || "Delete failed");
      }
    } catch (err) {
      toast.error("Delete failed");
    }
  };

  const renderLevelName = () => {
    return view.level.charAt(0).toUpperCase() + view.level.slice(1);
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>School Study Management</h1>
          <div style={{ display: 'flex', gap: '8px', marginTop: '8px', color: 'var(--text-secondary)', fontSize: '14px', alignItems: 'center' }}>
            <span style={{ cursor: 'pointer', color: view.level === 'boards' ? 'var(--text-primary)' : 'var(--accent)', fontWeight: 700 }} onClick={() => handleLevelUp(-1)}>All Boards</span>
            {view.path.map((p, i) => (
              <span key={p.id}>
                {" › "}
                <span style={{ cursor: 'pointer', color: i === view.path.length-1 ? 'var(--text-primary)' : 'var(--accent)', fontWeight: 700 }} onClick={() => handleLevelUp(i)}>{p.name}</span>
              </span>
            ))}
          </div>
        </div>
        <button className="btn-primary" onClick={openAddModal}>
          + Add {renderLevelName().slice(0, -1)}
        </button>
      </div>

      <div className={styles.list}>
        {loading ? (
          <p>Loading items...</p>
        ) : items.length === 0 ? (
          <div className="glass-card" style={{ padding: '40px', textAlign: 'center' }}>
            No {view.level} found here. Click &quot;+ Add {renderLevelName().slice(0, -1)}&quot; above to create one.
          </div>
        ) : (
          items.map(item => (
            <div key={item.id} className={`${styles.row} glass-card`}>
              <div className={styles.rowInfo}>
                <span className={styles.emoji}>
                  {view.level === 'boards' ? "🏛️" : 
                   view.level === 'classes' ? "🎒" : 
                   view.level === 'subjects' ? "📚" : 
                   view.level === 'chapters' ? "📖" : "❓"}
                </span>
                <div>
                  <span className={styles.name}>
                    {item.name || (item.number ? `Class ${item.number}` : item.title) || (item.prompt?.substring(0, 50) + "...")}
                  </span>
                  <span className={styles.desc}>
                    {view.level === 'boards' && `${item._count?.classes || 0} Classes`}
                    {view.level === 'classes' && `${item._count?.subjects || 0} Subjects`}
                    {view.level === 'subjects' && `${item._count?.chapters || 0} Chapters`}
                    {view.level === 'chapters' && `${item._count?.questions || 0} Questions`}
                    {view.level === 'questions' && `Type: ${item.type} | Answer: ${item.answer}`}
                  </span>
                </div>
              </div>
              <div className={styles.rowMeta}>
                {view.level !== 'questions' && (
                  <button className="btn-secondary" onClick={() => {
                    const nextMap = { boards: 'classes', classes: 'subjects', subjects: 'chapters', chapters: 'questions' };
                    handleLevelDown(item, nextMap[view.level]);
                  }}>
                    Manage ➔
                  </button>
                )}
                <div className={styles.actions}>
                  <button className={styles.editBtn} onClick={() => openEditModal(item)} title="Edit">✏️</button>
                  <button
                    className={styles.deleteBtn}
                    onClick={() => setDeletingItem({ id: item.id, name: item.name || item.title || (item.number ? `Class ${item.number}` : 'Question') })}
                    title="Delete"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Editor Modal */}
      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px' }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '640px', maxHeight: '90vh', overflowY: 'auto', padding: '24px', background: 'var(--card-bg, #fff)', border: '1px solid var(--card-border, #e2e8f0)', borderRadius: '16px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 800, margin: '0 0 16px 0', color: 'var(--text-primary)' }}>
              {editingItem ? 'Edit' : 'Add'} {renderLevelName().slice(0, -1)}
            </h2>
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              
              {view.level === 'boards' && (
                <>
                  <label style={{ fontWeight: 600, fontSize: '13px' }}>Board Name</label>
                  <input className="auth-input" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} required placeholder="e.g., CBSE, ICSE, UP Board" />
                  <label style={{ fontWeight: 600, fontSize: '13px' }}>Slug</label>
                  <input className="auth-input" value={formData.slug || ''} onChange={e => setFormData({...formData, slug: e.target.value})} placeholder="e.g., cbse" />
                  <label style={{ fontWeight: 600, fontSize: '13px' }}>Sort Order</label>
                  <input type="number" className="auth-input" value={formData.sortOrder || 0} onChange={e => setFormData({...formData, sortOrder: parseInt(e.target.value) || 0})} />
                </>
              )}

              {view.level === 'classes' && (
                <>
                  <label style={{ fontWeight: 600, fontSize: '13px' }}>Class / Grade Number (e.g., 9, 10, 11, 12)</label>
                  <input type="number" className="auth-input" value={formData.number || ''} onChange={e => setFormData({...formData, number: parseInt(e.target.value) || 0})} required placeholder="e.g., 10" />
                </>
              )}

              {view.level === 'subjects' && (
                <>
                  <label style={{ fontWeight: 600, fontSize: '13px' }}>Subject Name</label>
                  <input className="auth-input" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} required placeholder="e.g., Science, Mathematics, History" />
                  <label style={{ fontWeight: 600, fontSize: '13px' }}>Slug</label>
                  <input className="auth-input" value={formData.slug || ''} onChange={e => setFormData({...formData, slug: e.target.value})} placeholder="e.g., science" />
                  <label style={{ fontWeight: 600, fontSize: '13px' }}>Sort Order</label>
                  <input type="number" className="auth-input" value={formData.sortOrder || 0} onChange={e => setFormData({...formData, sortOrder: parseInt(e.target.value) || 0})} />
                </>
              )}

              {view.level === 'chapters' && (
                <>
                  <label style={{ fontWeight: 600, fontSize: '13px' }}>Chapter Title</label>
                  <input className="auth-input" value={formData.title || ''} onChange={e => setFormData({...formData, title: e.target.value})} required placeholder="e.g., The French Revolution" />
                  <label style={{ fontWeight: 600, fontSize: '13px' }}>Chapter Order (Sort Index)</label>
                  <input type="number" className="auth-input" value={formData.sortOrder || 0} onChange={e => setFormData({...formData, sortOrder: parseInt(e.target.value) || 0})} />
                </>
              )}

              {view.level === 'questions' && (
                <>
                  <label style={{ fontWeight: 600, fontSize: '13px' }}>Question Type</label>
                  <select className="auth-input" value={formData.type || 'mcq'} onChange={e => setFormData({...formData, type: e.target.value})}>
                    <option value="mcq">MCQ (Multiple Choice)</option>
                    <option value="true_false">True or False</option>
                    <option value="fill_blank">Fill in the Blanks</option>
                    <option value="match_column">Match the Columns</option>
                  </select>

                  <label style={{ fontWeight: 600, fontSize: '13px' }}>Prompt / Question Statement</label>
                  <textarea className="auth-input" value={formData.prompt || ''} onChange={e => setFormData({...formData, prompt: e.target.value})} required rows="3" placeholder="Enter question..." />
                  
                  {/* Interactive MCQ Option Builder */}
                  {formData.type === 'mcq' && (
                    <div style={{ background: 'var(--bg-secondary, #f8fafc)', padding: '16px', borderRadius: '12px', border: '1px solid var(--card-border, #e2e8f0)', marginTop: '4px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <span style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text-primary)' }}>
                          Options & Correct Answer
                        </span>
                        <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                          Click radio button to mark correct answer
                        </span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {mcqOptions.map((opt, idx) => {
                          const optionLabel = String.fromCharCode(65 + idx); // A, B, C, D
                          const isCorrect = formData.answer === opt && opt.trim() !== "";
                          return (
                            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', padding: '6px 8px', borderRadius: '8px', background: isCorrect ? '#ecfdf5' : 'transparent', border: isCorrect ? '1.5px solid #10b981' : '1px solid var(--card-border, #cbd5e1)' }}>
                                <input
                                  type="radio"
                                  name="mcqCorrectAnswer"
                                  checked={isCorrect}
                                  onChange={() => {
                                    if (opt.trim()) {
                                      setFormData(prev => ({ ...prev, answer: opt.trim() }));
                                    }
                                  }}
                                  style={{ accentColor: '#10b981', cursor: 'pointer' }}
                                />
                                <span style={{ marginLeft: '6px', fontWeight: 700, fontSize: '12px', color: isCorrect ? '#065f46' : 'inherit' }}>
                                  {optionLabel}
                                </span>
                              </label>
                              <input
                                className="auth-input"
                                style={{ flex: 1 }}
                                value={opt}
                                onChange={(e) => {
                                  const newVal = e.target.value;
                                  const nextOpts = [...mcqOptions];
                                  const oldVal = nextOpts[idx];
                                  nextOpts[idx] = newVal;
                                  setMcqOptions(nextOpts);
                                  if (formData.answer === oldVal && oldVal.trim()) {
                                    setFormData(prev => ({ ...prev, answer: newVal.trim() }));
                                  }
                                }}
                                placeholder={`Option ${optionLabel}`}
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <label style={{ fontWeight: 600, fontSize: '13px' }}>Correct Answer Value</label>
                  <input
                    className="auth-input"
                    value={formData.answer || ''}
                    onChange={e => setFormData({...formData, answer: e.target.value})}
                    required
                    placeholder="Correct answer string"
                  />
                  
                  <label style={{ fontWeight: 600, fontSize: '13px' }}>Explanation (Optional)</label>
                  <textarea className="auth-input" value={formData.explanation || ''} onChange={e => setFormData({...formData, explanation: e.target.value})} rows="2" placeholder="Explanation for student review..." />
                </>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* In-App Delete Confirmation Modal */}
      {deletingItem && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px' }}>
          <div style={{ background: 'var(--card-bg, #fff)', maxWidth: '420px', width: '100%', borderRadius: '16px', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)', border: '1px solid var(--card-border, #e2e8f0)', textAlign: 'center' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 8px 0', color: 'var(--text-primary)' }}>
              Delete {renderLevelName().slice(0, -1)}?
            </h3>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: '0 0 20px 0' }}>
              Are you sure you want to delete <strong>&ldquo;{deletingItem.name}&rdquo;</strong>?
              {view.level !== 'questions' && " This will also delete all child items under it!"}
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
              <button
                type="button"
                onClick={() => setDeletingItem(null)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                style={{ padding: '8px 18px', borderRadius: '8px', border: 'none', background: '#ef4444', color: '#fff', fontWeight: 700, cursor: 'pointer' }}
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
