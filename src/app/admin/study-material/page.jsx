"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from '@/styles/GovtExamManagement.module.css';
import toast from 'react-hot-toast';

export default function StudyMaterialManager() {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  
  const [form, setForm] = useState({ id: '', name: '', slug: '', image: '', description: '', authors: 'Admin', alignedTo: '' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/study-materials');
      if (res.ok) {
        setMaterials(await res.json());
      } else {
        toast.error("Failed to load study materials");
      }
    } catch (e) {
      console.error(e);
      toast.error("Network error loading materials");
    } finally {
      setLoading(false);
    }
  };

  const saveMaterial = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/study-materials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      if (res.ok) {
        toast.success(form.id ? "FlexBook updated!" : "FlexBook created!");
        setIsModalOpen(false);
        fetchData();
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || "Failed to save material");
      }
    } catch (e) {
      console.error(e);
      toast.error("Error saving FlexBook");
    }
  };

  const confirmDeleteMaterial = async () => {
    if (!deletingId) return;
    try {
      const res = await fetch(`/api/admin/study-materials?id=${deletingId}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success("FlexBook deleted");
        setDeletingId(null);
        fetchData();
      } else {
        toast.error("Failed to delete FlexBook");
      }
    } catch {
      toast.error("Network error deleting FlexBook");
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Study Material Library</h1>
          <p className={styles.subtitle}>Manage FlexBooks, Subjects, and Chapters.</p>
        </div>
      </header>

      <div style={{ marginBottom: "16px", display: "flex", justifyContent: "flex-end" }}>
         <button 
            className={styles.addBtn}
            onClick={() => {
              setForm({ id: '', name: '', slug: '', image: '', description: '', authors: 'Admin', alignedTo: '' });
              setIsModalOpen(true);
            }}
         >
            + Create New FlexBook
         </button>
      </div>

      {loading ? (
        <div style={{ padding: "40px", textAlign: "center", color: "var(--text-secondary, #64748b)", fontWeight: 700 }}>
          Loading Library...
        </div>
      ) : (
         <div className={styles.tableContainer}>
            <table className={styles.table}>
               <thead>
                  <tr>
                     <th>Book Name</th>
                     <th>Aligned To</th>
                     <th>Subjects</th>
                     <th>Actions</th>
                  </tr>
               </thead>
               <tbody>
                  {materials.map(mat => (
                     <tr key={mat.id}>
                        <td><strong>{mat.name}</strong><br/><small style={{ opacity: 0.6 }}>/{mat.slug}</small></td>
                        <td>{mat.alignedTo || 'Any'}</td>
                        <td>{mat._count?.subjects || 0}</td>
                        <td>
                           <div style={{ display: "flex", gap: "8px" }}>
                             <Link href={`/admin/study-material/${mat.id}`} style={{ background: "#059669", color: "#fff", padding: "4px 12px", borderRadius: "6px", textDecoration: "none", fontSize: "13px", fontWeight: 700 }}>
                               Manage Content
                             </Link>
                             <button 
                                style={{ color: "#2563eb", background: "rgba(37, 99, 235, 0.1)", border: "none", padding: "4px 10px", borderRadius: "6px", cursor: "pointer", fontWeight: 600, fontSize: "13px" }}
                                onClick={() => {
                                   setForm(mat);
                                   setIsModalOpen(true);
                                }}
                             >
                               Settings
                             </button>
                             <button 
                                style={{ color: "#dc2626", background: "rgba(220, 38, 38, 0.1)", border: "none", padding: "4px 10px", borderRadius: "6px", cursor: "pointer", fontWeight: 600, fontSize: "13px" }}
                                onClick={() => setDeletingId(mat.id)}
                             >
                               Delete
                             </button>
                           </div>
                        </td>
                     </tr>
                  ))}
               </tbody>
            </table>
         </div>
      )}

      {/* Editor Modal */}
      {isModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent} style={{ maxWidth: '600px' }}>
             <h2 className={styles.modalTitle}>{form.id ? "Edit FlexBook Info" : "Create New FlexBook"}</h2>
             <form onSubmit={saveMaterial}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                  <div className={styles.formGroup}>
                     <label>Book Title</label>
                     <input type="text" value={form.name} onChange={e => setForm(prev => ({...prev, name: e.target.value}))} required className={styles.input} />
                  </div>
                  <div className={styles.formGroup}>
                     <label>Slug (URL Friendly)</label>
                     <input type="text" value={form.slug} onChange={e => setForm(prev => ({...prev, slug: e.target.value}))} required className={styles.input} />
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                  <div className={styles.formGroup}>
                     <label>Authors</label>
                     <input type="text" value={form.authors} onChange={e => setForm(prev => ({...prev, authors: e.target.value}))} className={styles.input} />
                  </div>
                  <div className={styles.formGroup}>
                     <label>Aligned To (e.g. SSC CGL)</label>
                     <input type="text" value={form.alignedTo} onChange={e => setForm(prev => ({...prev, alignedTo: e.target.value}))} className={styles.input} />
                  </div>
                </div>
                <div className={styles.formGroup}>
                   <label>Cover Image URL (Optional)</label>
                   <input type="text" value={form.image} onChange={e => setForm(prev => ({...prev, image: e.target.value}))} className={styles.input} placeholder="https://..." />
                </div>
                <div className={styles.formGroup}>
                   <label>Description</label>
                   <textarea value={form.description} onChange={e => setForm(prev => ({...prev, description: e.target.value}))} className={styles.textarea} rows="3"></textarea>
                </div>
                
                <div className={styles.actionButtons}>
                   <button type="button" onClick={() => setIsModalOpen(false)} className={styles.cancelBtn}>Cancel</button>
                   <button type="submit" className={styles.saveBtn}>Save Book</button>
                </div>
             </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation In-App Modal */}
      {deletingId && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent} style={{ maxWidth: '420px', textAlign: 'center' }}>
            <h3 style={{ fontSize: "18px", fontWeight: 800, marginBottom: "8px", color: "var(--text-primary)" }}>
              Delete FlexBook?
            </h3>
            <p style={{ color: "var(--text-secondary)", fontSize: "14px", marginBottom: "20px" }}>
              Are you sure? This will delete this FlexBook along with all subjects and chapters inside it.
            </p>
            <div style={{ display: "flex", justifyContent: "center", gap: "12px" }}>
              <button onClick={() => setDeletingId(null)} className={styles.cancelBtn}>
                Cancel
              </button>
              <button onClick={confirmDeleteMaterial} style={{ background: "#dc2626", color: "#fff", border: "none", padding: "8px 18px", borderRadius: "8px", fontWeight: 700, cursor: "pointer" }}>
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
