"use client";
import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Trash2 } from 'lucide-react';
import styles from '@/styles/GovtExamManagement.module.css';

export default function WizardSectionRow({ id, index, section, onChange, onRemove, isLast }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className={styles.compactSectionRow}
    >
      <div className="grid grid-cols-12 gap-4 items-center">
        <div className="col-span-1 flex justify-center">
           <button {...attributes} {...listeners} className="cursor-grab text-slate-300 hover:text-slate-500">
             <GripVertical size={18} />
           </button>
        </div>
        <div className="col-span-4">
          <input
            type="text"
            value={section.name}
            onChange={e => onChange(index, 'name', e.target.value)}
            className={styles.input}
            placeholder="e.g. Quantitative Aptitude"
            style={{ padding: '0.4rem 0.75rem', fontSize: '0.85rem' }}
          />
        </div>
        <div className="col-span-2">
          <input
            type="number"
            value={section.timeLimit}
            onChange={e => onChange(index, 'timeLimit', parseInt(e.target.value) || 0)}
            className={styles.input}
            style={{ padding: '0.4rem 0.75rem', fontSize: '0.85rem' }}
          />
        </div>
        <div className="col-span-2">
          <input
            type="number"
            value={section.totalMarks}
            onChange={e => onChange(index, 'totalMarks', parseInt(e.target.value) || 0)}
            className={styles.input}
            style={{ padding: '0.4rem 0.75rem', fontSize: '0.85rem' }}
          />
        </div>
        <div className="col-span-2">
          <input
            type="number"
            value={section.totalQuestions}
            onChange={e => onChange(index, 'totalQuestions', parseInt(e.target.value) || 0)}
            className={styles.input}
            style={{ padding: '0.4rem 0.75rem', fontSize: '0.85rem' }}
          />
        </div>
        <div className="col-span-1 flex justify-center">
          <button
            onClick={() => onRemove(index)}
            className="text-slate-300 hover:text-rose-500 transition"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
