"use client";

import React from 'react';
import { ChevronRight } from 'lucide-react';
import styles from '@/styles/GovtExamManagement.module.css';

/**
 * HorizontalFilterBar Component
 * Professional, single-line selector for handling exam hierarchies.
 */
export default function HorizontalFilterBar({ 
  categories, 
  exams, 
  selectedCategoryId, 
  selectedExamId, 
  onCategoryChange, 
  onExamChange,
  activeCount 
}) {
  return (
    <div className={styles.filterBar}>
      <div className={styles.filterBreadcrumb}>
        {/* Main Category Selector */}
        <select 
          value={selectedCategoryId} 
          onChange={(e) => onCategoryChange(e.target.value)}
          className={styles.filterSelect}
        >
          <option value="">Select Category</option>
          {categories.map(cat => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>

        <div className={styles.chevronIndicator}>
          <ChevronRight size={16} />
        </div>

        {/* Sub-Category (Exam) Selector */}
        <select 
          value={selectedExamId} 
          onChange={(e) => onExamChange(e.target.value)}
          disabled={!selectedCategoryId}
          className={styles.filterSelect}
        >
          <option value="">Select Exam</option>
          {exams
            .filter(ex => ex.categoryId === selectedCategoryId)
            .map(ex => (
              <option key={ex.id} value={ex.id}>{ex.name}</option>
            ))}
        </select>
      </div>

      {/* Inline Stats Badge */}
      <div className={styles.activeTestsBadge}>
        <div className={styles.badgeDot} />
        <span className="text-[10px] font-black uppercase text-emerald-700 tracking-widest">
          {activeCount} Active Tests
        </span>
      </div>
    </div>
  );
}
