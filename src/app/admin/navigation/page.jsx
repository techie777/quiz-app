"use client";

import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  Edit, 
  GripVertical, 
  Save, 
  X, 
  Eye, 
  EyeOff,
  ExternalLink,
  Check
} from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import styles from '@/styles/GovtExamManagement.module.css';

// --- Sortable Item Component ---
function SortableItem({ item, onEdit, onDelete, onToggleVisibility }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
    position: 'relative',
    background: isDragging ? '#f8fafc' : 'white',
    boxShadow: isDragging ? '0 10px 15px -3px rgba(0, 0, 0, 0.1)' : 'none',
  };

  return (
    <tr ref={setNodeRef} style={style} className={isDragging ? 'opacity-50' : ''}>
      <td className="p-3 w-10">
        <button
          type="button"
          className="cursor-grab active:cursor-grabbing p-2 text-slate-300 hover:text-indigo-500 transition-colors"
          {...attributes}
          {...listeners}
        >
          <GripVertical size={18} />
        </button>
      </td>
      <td className="p-3">
        <div className="flex items-center gap-3">
          <span className="text-2xl w-8 h-8 flex items-center justify-center bg-slate-50 rounded-lg">{item.icon}</span>
          <div>
            <div className="font-bold text-slate-800">{item.name}</div>
            <div className="text-[10px] font-mono text-slate-400">{item.href}</div>
          </div>
        </div>
      </td>
      <td className="p-3">
        <div className="text-xs text-slate-500 max-w-[200px] truncate">{item.description || '-'}</div>
      </td>
      <td className="p-3 w-24 text-center">
        <button 
          onClick={() => onToggleVisibility(item)}
          className={`p-2 rounded-full transition-colors ${item.isVisible ? 'text-emerald-500 bg-emerald-50' : 'text-slate-300 bg-slate-50'}`}
          title={item.isVisible ? "Visible" : "Hidden"}
        >
          {item.isVisible ? <Eye size={18}/> : <EyeOff size={18}/>}
        </button>
      </td>
      <td className="p-3 w-32">
        <div className="flex gap-2">
          <button 
            onClick={() => onEdit(item)}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
            title="Edit Nav Link"
          >
            <Edit size={16}/>
          </button>
          <button 
            onClick={() => onDelete(item.id)}
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
            title="Delete Nav Link"
          >
            <Trash2 size={16}/>
          </button>
        </div>
      </td>
    </tr>
  );
}

export default function NavigationManager() {
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLink, setEditingLink] = useState(null);
  const [form, setForm] = useState({ name: '', href: '', icon: '🏠', description: '', keywords: '', isVisible: true, sortOrder: 0 });
  const [isSaving, setIsSaving] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    fetchLinks();
  }, []);

  const fetchLinks = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/navigation?admin=true');
      if (res.ok) {
        const data = await res.json();
        setLinks(data);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      const oldIndex = links.findIndex((i) => i.id === active.id);
      const newIndex = links.findIndex((i) => i.id === over.id);
      const newLinks = arrayMove(links, oldIndex, newIndex);
      
      // Update local state first for immediate UI feedback
      setLinks(newLinks);

      // Persist to DB
      const items = newLinks.map((link, idx) => ({ id: link.id, sortOrder: idx }));
      try {
        await fetch('/api/navigation', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items })
        });
      } catch (e) {
        console.error("Failed to reorder:", e);
        fetchLinks(); // Revert on failure
      }
    }
  };

  const saveLink = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch('/api/navigation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingLink ? { ...form, id: editingLink.id } : form)
      });
      if (res.ok) {
        setIsModalOpen(false);
        fetchLinks();
      }
    } catch (e) { console.error(e); }
    finally { setIsSaving(false); }
  };

  const deleteLink = async (id) => {
    if (!confirm("Are you sure you want to delete this navigation link?")) return;
    try {
      await fetch(`/api/navigation?id=${id}`, { method: 'DELETE' });
      fetchLinks();
    } catch (e) { console.error(e); }
  };

  const toggleVisibility = async (item) => {
    try {
      await fetch('/api/navigation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...item, isVisible: !item.isVisible })
      });
      fetchLinks();
    } catch (e) { console.error(e); }
  };

  const openAddModal = () => {
    setEditingLink(null);
    setForm({ name: '', href: '', icon: '🏠', description: '', keywords: '', isVisible: true, sortOrder: links.length });
    setIsModalOpen(true);
  };

  const openEditModal = (link) => {
    setEditingLink(link);
    setForm(link);
    setIsModalOpen(true);
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Global Navigation Manager</h1>
          <p className={styles.subtitle}>Manage the site-wide menu, reorder items, and control visibility.</p>
        </div>
        <button className={styles.addBtn} onClick={openAddModal}>
          <Plus size={20} /> Add Nav Link
        </button>
      </header>

      {loading ? (
        <div className="p-20 text-center text-slate-400 font-bold uppercase tracking-widest text-sm">Synchronizing Navigation...</div>
      ) : (
        <div className={styles.tableContainer}>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b-2 border-slate-100 bg-slate-50/50">
                <th className="p-4 w-10"></th>
                <th className="p-4 text-xs font-black uppercase text-slate-400 tracking-wider">Menu Item</th>
                <th className="p-4 text-xs font-black uppercase text-slate-400 tracking-wider">Description</th>
                <th className="p-4 text-xs font-black uppercase text-slate-400 tracking-wider text-center">Status</th>
                <th className="p-4 text-xs font-black uppercase text-slate-400 tracking-wider">Actions</th>
              </tr>
            </thead>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={links.map(l => l.id)} strategy={verticalListSortingStrategy}>
                <tbody>
                  {links.map(link => (
                    <SortableItem 
                      key={link.id} 
                      item={link} 
                      onEdit={openEditModal} 
                      onDelete={deleteLink} 
                      onToggleVisibility={toggleVisibility}
                    />
                  ))}
                  {links.length === 0 && (
                    <tr>
                      <td colSpan="5" className="p-20 text-center text-slate-300 italic">No navigation links found. Add your first link to get started.</td>
                    </tr>
                  )}
                </tbody>
              </SortableContext>
            </DndContext>
          </table>
        </div>
      )}

      {/* Editor Modal */}
      {isModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal} style={{ maxWidth: '450px' }}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>{editingLink ? "✨ Update Link" : "🚀 New Menu Item"}</h2>
              <button className={styles.modalClose} onClick={() => setIsModalOpen(false)}><X /></button>
            </div>
            
            <form onSubmit={saveLink} className="p-6 space-y-5">
              <div className="grid grid-cols-4 gap-4">
                <div className="col-span-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 mb-1 block">Icon</label>
                  <input 
                    type="text" 
                    value={form.icon} 
                    onChange={e => setForm({...form, icon: e.target.value})}
                    placeholder="🏠"
                    required
                    className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-center text-xl focus:ring-2 focus:ring-indigo-100 outline-none"
                  />
                </div>
                <div className="col-span-3">
                  <label className="text-[10px] font-black uppercase text-slate-400 mb-1 block">Link Name</label>
                  <input 
                    type="text" 
                    value={form.name} 
                    onChange={e => setForm({...form, name: e.target.value})}
                    placeholder="e.g. Daily Quiz"
                    required
                    className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 focus:ring-2 focus:ring-indigo-100 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 mb-1 block">URL Path (Href)</label>
                <input 
                  type="text" 
                  value={form.href} 
                  onChange={e => setForm({...form, href: e.target.value})}
                  placeholder="/daily"
                  required
                  className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 focus:ring-2 focus:ring-indigo-100 outline-none font-mono text-sm"
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 mb-1 block">Short Description</label>
                <textarea 
                  value={form.description} 
                  onChange={e => setForm({...form, description: e.target.value})}
                  placeholder="Appears in mobile menu..."
                  rows="2"
                  className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 focus:ring-2 focus:ring-indigo-100 outline-none text-sm"
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 mb-1 block">Search Keywords (CSV)</label>
                <input 
                  type="text" 
                  value={form.keywords} 
                  onChange={e => setForm({...form, keywords: e.target.value})}
                  placeholder="quiz, daily, practice"
                  className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 focus:ring-2 focus:ring-indigo-100 outline-none text-xs"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input 
                  type="checkbox" 
                  id="visibility"
                  checked={form.isVisible} 
                  onChange={e => setForm({...form, isVisible: e.target.checked})}
                  className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="visibility" className="text-sm font-bold text-slate-600">Visible on Production</label>
              </div>

              <div className="flex gap-3 pt-4 border-t">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)} 
                  className="flex-1 p-3 rounded-xl text-slate-500 font-bold hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isSaving}
                  className="flex-1 p-3 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition shadow-lg shadow-indigo-200 flex items-center justify-center gap-2"
                >
                  {isSaving ? "Saving..." : <><Save size={18}/> Save Menu Item</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
