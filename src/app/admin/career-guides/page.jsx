"use client";

import { useState, useEffect } from "react";
import styles from "@/styles/AdminCategories.module.css";
import { useAdmin } from "@/context/AdminContext";
import toast from "react-hot-toast";

// --- FULL PAGE EDITOR COMPONENT ---
function CareerGuideEditor({ initialData, onSave, onCancel }) {
  const isNew = !initialData?.id;
  
  const [formData, setFormData] = useState({
    name: initialData?.name || "", 
    slug: initialData?.slug || "", 
    category: initialData?.category || "Government Job", 
    description: initialData?.description || "", 
    icon: initialData?.icon || "🧭", 
    difficulty: initialData?.difficulty || "Medium", 
    competition: initialData?.competition || "High", 
    avgSalary: initialData?.avgSalary || "", 
    workType: initialData?.workType || "Field + Office",
    hidden: initialData?.hidden || false
  });

  const [sections, setSections] = useState(initialData?.sections || []);

  const addSection = (type) => {
    let defaultContent = "";
    if (type === "LIST" || type === "FAQs") defaultContent = "[]"; 

    setSections([...sections, { title: "New Section", type, content: defaultContent, sortOrder: sections.length + 1 }]);
  };

  const updateSection = (index, field, value) => {
    const newSecs = [...sections];
    newSecs[index][field] = value;
    setSections(newSecs);
  };

  const removeSection = (index) => {
    const newSecs = [...sections];
    newSecs.splice(index, 1);
    setSections(newSecs);
  };

  const moveSection = (index, direction) => {
    if (index === 0 && direction === -1) return;
    if (index === sections.length - 1 && direction === 1) return;
    const newSecs = [...sections];
    const temp = newSecs[index];
    newSecs[index] = newSecs[index + direction];
    newSecs[index + direction] = temp;
    setSections(newSecs);
  };

  const parseArrayInput = (content) => {
    try {
      const arr = JSON.parse(content);
      return Array.isArray(arr) ? arr.join('\n') : "";
    } catch {
      return content;
    }
  };

  const commitArrayInput = (index, textContent, type) => {
    if (type === "LIST") {
      const arr = textContent.split('\n').filter(s => s.trim() !== "");
      updateSection(index, "content", JSON.stringify(arr));
    }
  };

  const commitFaqInput = (index, textContent) => {
    // Basic string parser: parse pairs delimited by double-newlines, separated by question mark or similar
    // This is simplistic. For production UI, real FAQ rows are preferred.
    updateSection(index, "content", textContent);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.slug) {
      toast.error("Name and Slug are required.");
      return;
    }
    onSave({ ...formData, sections: sections, id: initialData?.id });
  };

  return (
    <div className="glass-card" style={{ padding: '32px', marginBottom: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
          {isNew ? 'Create New Career Guide' : `Editing Career: ${formData.name}`}
        </h2>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn-secondary" onClick={onCancel}>🔙 Back to List</button>
          <button className="btn-primary" onClick={handleSubmit}>💾 Save Configuration</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 3fr)', gap: '40px' }}>
        
        {/* Core Settings Sidebar */}
        <div style={{ background: 'var(--bg-secondary)', padding: '24px', borderRadius: '12px', height: 'fit-content' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 600, margin: '0 0 20px 0', borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>Core Identity</h3>
          
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '8px' }}>Guide Name (H1)</label>
            <input required type="text" className="auth-input" style={{ width: '100%' }} value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. IAS Officer"/>
          </div>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '8px' }}>URL Slug</label>
            <input required type="text" className="auth-input" style={{ width: '100%' }} value={formData.slug} onChange={e => setFormData({...formData, slug: e.target.value})} placeholder="e.g. ias-officer"/>
          </div>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '8px' }}>Icon / Emoji</label>
            <input type="text" className="auth-input" style={{ width: '100%' }} value={formData.icon} onChange={e => setFormData({...formData, icon: e.target.value})}/>
          </div>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '8px' }}>Category</label>
            <input type="text" className="auth-input" style={{ width: '100%' }} value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}/>
          </div>

          <h3 style={{ fontSize: '18px', fontWeight: 600, margin: '30px 0 20px 0', borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>At a Glance Stats</h3>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '8px' }}>Difficulty</label>
            <input type="text" className="auth-input" style={{ width: '100%' }} value={formData.difficulty} onChange={e => setFormData({...formData, difficulty: e.target.value})}/>
          </div>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '8px' }}>Competition</label>
            <input type="text" className="auth-input" style={{ width: '100%' }} value={formData.competition} onChange={e => setFormData({...formData, competition: e.target.value})}/>
          </div>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '8px' }}>Average Salary</label>
            <input type="text" className="auth-input" style={{ width: '100%' }} value={formData.avgSalary} onChange={e => setFormData({...formData, avgSalary: e.target.value})}/>
          </div>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '8px' }}>Work Type</label>
            <input type="text" className="auth-input" style={{ width: '100%' }} value={formData.workType} onChange={e => setFormData({...formData, workType: e.target.value})}/>
          </div>

          <div style={{ marginTop: '24px' }}>
             <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input type="checkbox" checked={formData.hidden} onChange={e => setFormData({...formData, hidden: e.target.checked})} style={{ width: '18px', height: '18px' }}/>
                <span style={{ fontWeight: 600 }}>Hide this guide from live website</span>
             </label>
          </div>
        </div>

        {/* Dynamic Canvas / Sections Area */}
        <div>
           <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>Hero Description (SEO & Intro)</label>
            <textarea required className="auth-input" style={{ width: '100%', resize: 'vertical', minHeight: '100px', fontSize: '15px', lineHeight: '1.5' }} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Detailed top-level description of this career path..."/>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '40px 0 20px 0' }}>
            <h3 style={{ fontSize: '20px', fontWeight: 700, margin: 0 }}>Dynamic Content Sections</h3>
            <div style={{ display: 'flex', gap: '8px' }}>
               <button type="button" className="btn-secondary" onClick={() => addSection('TEXT')} style={{ fontSize: '13px' }}>+ Text Block</button>
               <button type="button" className="btn-secondary" onClick={() => addSection('LIST')} style={{ fontSize: '13px' }}>+ List Block</button>
               <button type="button" className="btn-secondary" onClick={() => addSection('FAQs')} style={{ fontSize: '13px' }}>+ FAQs Block</button>
            </div>
          </div>

          {sections.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', background: 'var(--bg-secondary)', borderRadius: '12px', color: 'var(--text-muted)' }}>
                No custom sections added yet. Build the guide page by stacking blocks above.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {sections.map((section, idx) => (
                <div key={idx} style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.03)' }}>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flex: 1 }}>
                       <span style={{ fontWeight: 700, color: '#4361ee', background: '#e0e7ff', padding: '4px 8px', borderRadius: '4px', fontSize: '12px' }}>{section.type}</span>
                       <input type="text" className="auth-input" value={section.title} onChange={(e) => updateSection(idx, 'title', e.target.value)} style={{ flex: 1, padding: '8px', fontSize: '15px', fontWeight: 600 }} placeholder="Section Title (e.g. Roles & Responsibilities)" />
                    </div>
                    <div style={{ display: 'flex', gap: '4px', marginLeft: '12px' }}>
                       <button type="button" onClick={() => moveSection(idx, -1)} disabled={idx===0} style={{ padding: '6px 10px', background: 'var(--bg-secondary)', border: 'none', cursor: idx===0 ? 'not-allowed' : 'pointer', borderRadius: '4px' }}>↑</button>
                       <button type="button" onClick={() => moveSection(idx, 1)} disabled={idx===sections.length-1} style={{ padding: '6px 10px', background: 'var(--bg-secondary)', border: 'none', cursor: idx===sections.length-1 ? 'not-allowed' : 'pointer', borderRadius: '4px' }}>↓</button>
                       <button type="button" onClick={() => removeSection(idx)} style={{ padding: '6px 10px', background: '#fee2e2', color: '#dc2626', border: 'none', cursor: 'pointer', borderRadius: '4px', marginLeft: '6px' }}>Trash</button>
                    </div>
                  </div>

                  {section.type === "TEXT" && (
                     <textarea className="auth-input" value={section.content} onChange={(e) => updateSection(idx, 'content', e.target.value)} style={{ width: '100%', minHeight: '120px', resize: 'vertical', marginTop: '12px' }} placeholder="Write your paragraph(s) here. Standard newlines are respected." />
                  )}

                  {section.type === "LIST" && (
                    <div style={{ marginTop: '12px' }}>
                      <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>Enter list items below. Every new line creates a new bullet point.</p>
                      <textarea className="auth-input" value={parseArrayInput(section.content)} onChange={(e) => commitArrayInput(idx, e.target.value, "LIST")} style={{ width: '100%', minHeight: '120px', resize: 'vertical' }} placeholder="Bullet 1&#10;Bullet 2&#10;Bullet 3" />
                    </div>
                  )}

                  {section.type === "FAQs" && (
                    <div style={{ marginTop: '12px' }}>
                      <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>Strict JSON Array format required. E.g. [{`{"question": "Q1", "answer": "A1"}`}]</p>
                      <textarea className="auth-input" value={section.content} onChange={(e) => updateSection(idx, 'content', e.target.value)} style={{ width: '100%', minHeight: '120px', resize: 'vertical', fontFamily: 'monospace', fontSize: '13px' }} placeholder='[{"question": "How?", "answer": "Like this."}]' />
                    </div>
                  )}

                </div>
              ))}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}




// --- PRIMARY ADMIN INTERFACE ROOT ---
export default function CareerGuidesAdminPage() {
  const { adminUser } = useAdmin();
  const [guides, setGuides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingGuide, setEditingGuide] = useState(null); // null = List View, object = Full Page Editor

  const fetchGuides = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/career-guides");
      const data = await res.json();
      if (data.success) setGuides(data.guides);
    } catch (err) {
      console.error(err);
      toast.error("Failed fetching guides");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGuides();
  }, []);

  const handleSaveGuide = async (combinedData) => {
    const isNew = !combinedData.id;
    try {
      const res = await fetch("/api/admin/career-guides", {
        method: isNew ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(combinedData),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(isNew ? "Career Guide successfully created!" : "Career Guide explicitly updated!");
        setEditingGuide(null);
        fetchGuides();
      } else {
        toast.error("Error saving guide: " + data.message);
      }
    } catch (err) {
      console.error(err);
      toast.error("Network or parse error saving guide.");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you certain you want to permanently delete this Career Guide?")) return;
    try {
      const res = await fetch(`/api/admin/career-guides?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
         toast.success("Deleted successfully.");
         fetchGuides();
      }
    } catch (err) {
      toast.error("Failed to delete");
    }
  };

  if (loading) return <div className={styles.page}><p>Loading Application Data...</p></div>;

  // Swap entire viewport to Editor Mode if active
  if (editingGuide !== null) {
    return <CareerGuideEditor initialData={editingGuide === "NEW" ? null : editingGuide} onSave={handleSaveGuide} onCancel={() => setEditingGuide(null)} />;
  }

  // Map Standard List View
  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Career Guides Hub</h1>
          <p className={styles.subtitle}>Full scale dynamic page management</p>
        </div>
        <button className="btn-primary" onClick={() => setEditingGuide("NEW")}>
          + Create New Career Guide
        </button>
      </div>

      <div className={styles.list}>
        {guides.length === 0 ? (
          <div className="glass-card" style={{ padding: '24px', textAlign: 'center' }}>
            <p>No career guides found. Click the button above to start your foundation!</p>
          </div>
        ) : guides.map(g => (
          <div key={g.id} className={`${styles.row} glass-card`}>
            <div className={styles.rowInfo}>
              <span className={styles.emoji}>{g.icon}</span>
              <div>
                <span className={styles.name}>{g.name} <span style={{fontSize: '11px', color: '#888', marginLeft: '6px'}}>/{g.slug}</span></span>
                <span className={styles.desc}>{g.category} - {g.description.substring(0,80)}...</span>
              </div>
            </div>
            <div className={styles.rowMeta}>
              {g.hidden ? <span className={styles.hiddenBadge}>Hidden</span> : <span className={styles.trendingBadge}>Live</span>}
              <span className={styles.count}>{g.sections?.length || 0} Sec</span>
              <div className={styles.actions}>
                <button className={styles.editBtn} onClick={() => setEditingGuide(g)}>✏️ Edit Strategy</button>
                <button className={styles.deleteBtn} onClick={() => handleDelete(g.id)}>🗑️</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
