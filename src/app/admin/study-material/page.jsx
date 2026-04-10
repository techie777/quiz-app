"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from '@/styles/GovtExamManagement.module.css';

export default function StudyMaterialManager() {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [form, setForm] = useState({ id: '', name: '', slug: '', image: '', description: '', authors: 'Admin', alignedTo: '' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/study-materials');
      if (res.ok) setMaterials(await res.json());
    } catch (e) {
      console.error(e);
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
        setIsModalOpen(false);
        fetchData();
      } else {
        alert("Failed to save material");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const deleteMaterial = async (id) => {
    if (!confirm('Are you sure you want to delete this FlexBook? This will also delete all subjects and chapters inside it!')) return;
    await fetch(`/api/admin/study-materials?id=${id}`, { method: 'DELETE' });
    fetchData();
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Study Material Library</h1>
          <p className={styles.subtitle}>Manage FlexBooks, Subjects, and Chapters.</p>
        </div>
      </header>

      <div className="mb-4 flex justify-end">
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
        <div className="p-10 text-center text-slate-500 font-bold">Loading Library...</div>
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
                        <td><strong>{mat.name}</strong><br/><small className="text-slate-400">/{mat.slug}</small></td>
                        <td>{mat.alignedTo || 'Any'}</td>
                        <td>{mat._count?.subjects || 0}</td>
                        <td>
                           <div className="flex gap-2">
                             <Link href={`/admin/study-material/${mat.id}`} className="bg-[#059669] hover:bg-[#047857] text-white px-3 py-1 rounded transition">
                               Manage Content
                             </Link>
                             <button 
                                className="text-blue-600 hover:bg-blue-50 px-3 py-1 rounded transition"
                                onClick={() => {
                                   setForm(mat);
                                   setIsModalOpen(true);
                                }}
                             >
                               Settings
                             </button>
                             <button className="text-red-600 hover:bg-red-50 px-3 py-1 rounded transition" onClick={() => deleteMaterial(mat.id)}>
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
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className={styles.formGroup}>
                     <label>Book Title</label>
                     <input type="text" value={form.name} onChange={e => setForm(prev => ({...prev, name: e.target.value}))} required className={styles.input} />
                  </div>
                  <div className={styles.formGroup}>
                     <label>Slug (URL Friendly)</label>
                     <input type="text" value={form.slug} onChange={e => setForm(prev => ({...prev, slug: e.target.value}))} required className={styles.input} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-4">
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
                   <input type="url" value={form.image} onChange={e => setForm(prev => ({...prev, image: e.target.value}))} className={styles.input} placeholder="https://..." />
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

    </div>
  );
}
