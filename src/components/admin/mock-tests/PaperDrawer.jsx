"use client";

import React from 'react';
import SideDrawer from './SideDrawer';
import { Save, FileText, Clock, Target, Calendar, HelpCircle } from 'lucide-react';
import styles from '@/styles/GovtExamManagement.module.css';

/**
 * PaperDrawer Component
 * Professional IA workspace for Mock Test Settings.
 */
export default function PaperDrawer({ 
  isOpen, 
  onClose, 
  form, 
  setForm, 
  paperForm,
  setPaperForm,
  onSave, 
  isLoading 
}) {
  const activeForm = form || paperForm || {};
  const activeSetForm = setForm || setPaperForm || (() => {});

  return (
    <SideDrawer 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Edit Mock Test Settings" 
      maxWidth="800px"
    >
      <div className="flex flex-col h-full">
        
        {/* Form Grid */}
        <div className="flex-1 p-10 space-y-10 overflow-y-auto custom-scrollbar pb-32">
          <div className={styles.proGrid}>
            
            {/* Row 1: Title (Full Width) */}
            <div className={`${styles.formGroup} ${styles.fullWidth}`}>
              <label className="flex items-center gap-2">
                <FileText size={16} className="text-slate-400" /> Paper Title
              </label>
              <input 
                type="text" 
                value={activeForm.title || ''} 
                onChange={e => activeSetForm(p => ({...p, title: e.target.value}))}
                className={styles.input}
                placeholder="e.g., SSC CGL 2024 Tier-I Official Mock #01"
              />
            </div>

            {/* Row 2: Slug (Full Width) */}
            <div className={`${styles.formGroup} ${styles.fullWidth}`}>
              <label>Unique URL Slug</label>
              <input 
                type="text" 
                value={activeForm.slug || ''} 
                onChange={e => activeSetForm(p => ({...p, slug: e.target.value}))}
                className={styles.input}
                placeholder="ssc-cgl-2024-tier1-full-01"
              />
            </div>

            {/* Row 3: Time | Max Marks */}
            <div className={styles.formGroup}>
              <label className="flex items-center gap-2">
                <Clock size={16} className="text-slate-400" /> Time (Mins)
              </label>
              <input 
                type="number" 
                value={activeForm.timeLimit || 60} 
                onChange={e => activeSetForm(p => ({...p, timeLimit: parseInt(e.target.value) || 0}))}
                className={styles.input}
              />
            </div>
            <div className={styles.formGroup}>
              <label className="flex items-center gap-2">
                <Target size={16} className="text-slate-400" /> Max Marks
              </label>
              <input 
                type="number" 
                value={activeForm.totalMarks || 100} 
                onChange={e => activeSetForm(p => ({...p, totalMarks: parseFloat(e.target.value) || 0}))}
                className={styles.input}
              />
            </div>

            {/* Row 4: Correct (+) | Negative (-) */}
            <div className={styles.formGroup}>
              <label>Correct Mark (+)</label>
              <input 
                type="number" 
                step="0.01"
                value={activeForm.positiveMarking || 1.0} 
                onChange={e => activeSetForm(p => ({...p, positiveMarking: parseFloat(e.target.value) || 0}))}
                className={styles.input}
              />
            </div>
            <div className={styles.formGroup}>
              <label>Negative Mark (-)</label>
              <input 
                type="number" 
                step="0.01"
                value={activeForm.negativeMarking || 0.25} 
                onChange={e => activeSetForm(p => ({...p, negativeMarking: parseFloat(e.target.value) || 0}))}
                className={styles.input}
              />
            </div>

            {/* Row 5: Paper Type | Year */}
            <div className={styles.formGroup}>
              <label>Paper Type</label>
              <select 
                value={activeForm.paperType || 'MOCK'} 
                onChange={e => activeSetForm(p => ({...p, paperType: e.target.value}))}
                className={styles.input}
              >
                <option value="MOCK">Official Mock</option>
                <option value="PYP">Previous Year Paper</option>
              </select>
            </div>
            <div className={styles.formGroup}>
              <label className="flex items-center gap-2">
                <Calendar size={16} className="text-slate-400" /> Test Year
              </label>
              <input 
                type="number" 
                value={activeForm.year || ''} 
                onChange={e => activeSetForm(p => ({...p, year: parseInt(e.target.value) || 0}))}
                className={styles.input}
                placeholder="2024"
              />
            </div>

            {/* Row 6: Instructions (Full Width) */}
            <div className={`${styles.formGroup} ${styles.fullWidth}`}>
              <div className={styles.shadedBlock}>
                <label className="flex items-center gap-2 mb-4 font-black uppercase text-[10px] tracking-widest text-slate-400">
                  <HelpCircle size={14} /> Exam Instructions
                </label>
                <textarea 
                  value={activeForm.instructions || ''} 
                  onChange={e => activeSetForm(p => ({...p, instructions: e.target.value}))}
                  className={styles.textarea}
                  rows={5}
                  placeholder="Detailed instructions for students..."
                />
              </div>
            </div>

            {/* Row 7: Toggles */}
            <div className="flex gap-10 mt-4">
              <label className="flex items-center gap-3 cursor-pointer group">
                <input 
                  type="checkbox" 
                  checked={!!activeForm.isLive} 
                  onChange={e => activeSetForm(p => ({...p, isLive: e.target.checked}))}
                  className="w-5 h-5 accent-emerald-500 rounded-lg cursor-pointer"
                />
                <span className="text-sm font-bold text-slate-600 group-hover:text-slate-900 transition-colors">Active / Live</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer group">
                <input 
                  type="checkbox" 
                  checked={!!activeForm.showSolutions} 
                  onChange={e => activeSetForm(p => ({...p, showSolutions: e.target.checked}))}
                  className="w-5 h-5 accent-indigo-500 rounded-lg cursor-pointer"
                />
                <span className="text-sm font-bold text-slate-600 group-hover:text-slate-900 transition-colors">Show Solutions</span>
              </label>
            </div>

          </div>
        </div>

        {/* Sticky Footer */}
        <div className={styles.stickyDrawerFooter}>
          <button 
            type="button" 
            onClick={onClose} 
            className={styles.cancelButton}
            style={{ padding: '0.75rem 2rem' }}
          >
            Cancel
          </button>
          <button 
            type="button" 
            onClick={onSave}
            disabled={isLoading}
            className={styles.submitButton}
            style={{ padding: '0.75rem 3rem' }}
          >
            {isLoading ? "Saving..." : "Update Mock Test"}
          </button>
        </div>

      </div>
    </SideDrawer>
  );
}
