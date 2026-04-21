"use client";

import React from 'react';
import SideDrawer from './SideDrawer';
import { Save } from 'lucide-react';

/**
 * CategoryDrawer Component
 * Simple drawer for editing top-level Main Categories.
 */
export default function CategoryDrawer({ isOpen, onClose, categoryForm, setCategoryForm, onSave }) {
  return (
    <SideDrawer 
      isOpen={isOpen} 
      onClose={onClose} 
      title={categoryForm.id ? "Edit Main Category" : "Create Main Category"}
      maxWidth="450px"
    >
      <form onSubmit={onSave} className="space-y-6 flex flex-col h-full">
        <div className="space-y-4 flex-1">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Category Name</label>
            <input 
              type="text" 
              value={categoryForm.name} 
              onChange={e => {
                const val = e.target.value;
                const slug = val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
                setCategoryForm(prev => ({...prev, name: val, slug}));
              }} 
              required 
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" 
              placeholder="e.g. SSC Exams"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">URL Slug</label>
            <input 
              type="text" 
              value={categoryForm.slug} 
              onChange={e => setCategoryForm(prev => ({...prev, slug: e.target.value}))} 
              required 
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl" 
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Emoji Icon</label>
              <input 
                type="text" 
                value={categoryForm.icon} 
                onChange={e => setCategoryForm(prev => ({...prev, icon: e.target.value}))} 
                required 
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-center text-2xl" 
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sort Order</label>
              <input 
                type="number" 
                value={categoryForm.sortOrder} 
                onChange={e => setCategoryForm(prev => ({...prev, sortOrder: parseInt(e.target.value)}))} 
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-center font-bold" 
              />
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 bg-white pt-6 border-t border-slate-100 -mx-8 -mb-8 mt-auto flex items-center justify-end gap-3 p-8 z-10">
          <button type="button" onClick={onClose} className="px-6 py-2.5 rounded-xl font-bold text-slate-400 hover:text-slate-600 transition-colors">Cancel</button>
          <button type="submit" className="bg-indigo-600 text-white px-8 py-2.5 rounded-xl font-black shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition flex items-center gap-2">
            <Save size={18} /> Save Category
          </button>
        </div>
      </form>
    </SideDrawer>
  );
}
