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
  
  const [formData, setFormData] = useState({});

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
    if (view.level === 'boards') setFormData({ name: "", slug: "", sortOrder: 0 });
    if (view.level === 'classes') setFormData({ number: "", boardId: view.path[0].id });
    if (view.level === 'subjects') setFormData({ name: "", slug: "", sortOrder: 0, classId: view.path[1].id });
    if (view.level === 'chapters') setFormData({ title: "", sortOrder: 0, subjectId: view.path[2].id });
    if (view.level === 'questions') setFormData({ type: "mcq", prompt: "", options: "[]", answer: "", explanation: "", chapterId: view.path[3].id });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const method = editingItem ? "PUT" : "POST";
    const typeMap = { boards: 'board', classes: 'class', subjects: 'subject', chapters: 'chapter', questions: 'question' };
    
    const payload = { ...formData, type: typeMap[view.level] };
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

  const handleDelete = async (id) => {
    if (!confirm("Are you sure? This will delete all child items too!")) return;
    const typeMap = { boards: 'board', classes: 'class', subjects: 'subject', chapters: 'chapter', questions: 'question' };
    try {
      const res = await fetch(`/api/admin/school-study?type=${typeMap[view.level]}&id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        toast.success("Deleted");
        fetchItems();
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
          <div style={{ display: 'flex', gap: '8px', marginTop: '8px', color: 'var(--text-secondary)', fontSize: '14px' }}>
            <span style={{ cursor: 'pointer', color: view.level === 'boards' ? 'var(--text-primary)' : 'var(--accent)' }} onClick={() => handleLevelUp(-1)}>All Boards</span>
            {view.path.map((p, i) => (
              <span key={p.id}>
                {" > "}
                <span style={{ cursor: 'pointer', color: i === view.path.length-1 ? 'var(--text-primary)' : 'var(--accent)' }} onClick={() => handleLevelUp(i)}>{p.name}</span>
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
            No {view.level} found here.
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
                    {view.level === 'questions' && `Type: ${item.type}`}
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
                  <button className={styles.editBtn} onClick={() => {
                    setEditingItem(item);
                    setFormData({ ...item });
                    setShowModal(true);
                  }}>✏️</button>
                  <button className={styles.deleteBtn} onClick={() => handleDelete(item.id)}>🗑️</button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '600px', padding: '24px', margin: '20px' }}>
            <h2>{editingItem ? 'Edit' : 'Add'} {renderLevelName().slice(0, -1)}</h2>
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '20px' }}>
              
              {view.level === 'boards' && (
                <>
                  <label>Board Name</label>
                  <input className="auth-input" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required placeholder="e.g., CBSE" />
                  <label>URL Slug</label>
                  <input className="auth-input" value={formData.slug} onChange={e => setFormData({...formData, slug: e.target.value})} required placeholder="e.g., cbse" />
                  <label>Sort Order</label>
                  <input type="number" className="auth-input" value={formData.sortOrder} onChange={e => setFormData({...formData, sortOrder: parseInt(e.target.value)})} />
                </>
              )}

              {view.level === 'classes' && (
                <>
                  <label>Class Number</label>
                  <input type="number" className="auth-input" value={formData.number} onChange={e => setFormData({...formData, number: parseInt(e.target.value)})} required placeholder="e.g., 10" />
                </>
              )}

              {view.level === 'subjects' && (
                <>
                  <label>Subject Name</label>
                  <input className="auth-input" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required placeholder="e.g., History" />
                  <label>URL Slug</label>
                  <input className="auth-input" value={formData.slug} onChange={e => setFormData({...formData, slug: e.target.value})} required placeholder="e.g., history" />
                  <label>Sort Order</label>
                  <input type="number" className="auth-input" value={formData.sortOrder} onChange={e => setFormData({...formData, sortOrder: parseInt(e.target.value)})} />
                </>
              )}

              {view.level === 'chapters' && (
                <>
                  <label>Chapter Title</label>
                  <input className="auth-input" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} required placeholder="e.g., The French Revolution" />
                  <label>Chapter Order (1, 2 = Free)</label>
                  <input type="number" className="auth-input" value={formData.sortOrder} onChange={e => setFormData({...formData, sortOrder: parseInt(e.target.value)})} />
                </>
              )}

              {view.level === 'questions' && (
                <>
                  <label>Question Type</label>
                  <select className="auth-input" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
                    <option value="mcq">MCQ</option>
                    <option value="fill_blank">Fill in the Blanks</option>
                    <option value="match_column">Match the Columns</option>
                    <option value="true_false">True or False</option>
                  </select>
                  <label>Prompt / Question</label>
                  <textarea className="auth-input" value={formData.prompt} onChange={e => setFormData({...formData, prompt: e.target.value})} required rows="3" />
                  
                  {formData.type === 'mcq' && (
                    <>
                      <label>Options (JSON array of strings)</label>
                      <input className="auth-input" value={formData.options} onChange={e => setFormData({...formData, options: e.target.value})} placeholder='["Option A", "Option B"]' />
                    </>
                  )}

                  <label>Correct Answer</label>
                  <input className="auth-input" value={formData.answer} onChange={e => setFormData({...formData, answer: e.target.value})} required />
                  
                  <label>Explanation (Optional)</label>
                  <textarea className="auth-input" value={formData.explanation} onChange={e => setFormData({...formData, explanation: e.target.value})} rows="2" />
                </>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
