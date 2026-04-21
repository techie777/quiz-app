"use client";

import React from 'react';
import { ChevronRight, ChevronDown, GripVertical, Settings, Trash2, Edit } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

/**
 * TreeRow Component
 * Renders a row in the hierarchical table with DnD support and expansion.
 */
export default function TreeRow({ 
  id, 
  level = 0, 
  isExpanded, 
  onToggle, 
  hasChildren, 
  title, 
  subtitle, 
  icon, 
  stats, 
  status, 
  onEdit, 
  onDelete,
  selectable = false,
  isSelected = false,
  onSelect
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 100 : 'auto',
    position: isDragging ? 'relative' : 'initial',
  };

  const paddingLeft = level * 24 + 12;

  return (
    <tr 
      ref={setNodeRef} 
      style={style}
      className={`group transition-colors ${isDragging ? 'bg-slate-50 opacity-50' : 'hover:bg-slate-50/80'} ${level === 0 ? 'border-b border-slate-100' : 'bg-slate-50/30'}`}
    >
      {/* DnD Handle */}
      <td className="w-10">
        <button
          type="button"
          className="cursor-grab active:cursor-grabbing p-2 text-slate-300 hover:text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity"
          {...attributes}
          {...listeners}
        >
          <GripVertical size={18} />
        </button>
      </td>

      {/* Select Checkbox (Optional) */}
      {selectable && (
        <td className="w-10">
           <input 
             type="checkbox" 
             checked={isSelected} 
             onChange={(e) => onSelect(e.target.checked)}
             className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
           />
        </td>
      )}

      {/* Expand/Collapse and Title */}
      <td>
        <div className="flex items-center gap-2" style={{ paddingLeft }}>
          {hasChildren ? (
            <button 
              onClick={onToggle}
              className="p-1 hover:bg-slate-200 rounded transition-colors text-slate-400"
            >
              {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
            </button>
          ) : (
            <div className="w-7" /> // Placeholder to align items without children
          )}
          
          <div className="flex items-center gap-3">
            <span className="text-xl">{icon}</span>
            <div>
              <div className={`font-bold ${level === 0 ? 'text-slate-800' : 'text-slate-600'}`}>{title}</div>
              {subtitle && <div className="text-[10px] text-slate-400 font-mono tracking-tight lowercase">{subtitle}</div>}
            </div>
          </div>
        </div>
      </td>

      {/* Stats (Dynamic) */}
      <td className="text-center font-bold text-indigo-600 text-sm">
        {stats?.mockCount ?? '-'}
      </td>
      <td className="text-center font-bold text-emerald-600 text-sm">
        {stats?.pypCount ?? '-'}
      </td>

      {/* Status */}
      <td>
        {status !== undefined && (
          <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] uppercase tracking-wider ${status ? 'text-slate-400 bg-slate-100' : 'text-emerald-600 bg-emerald-50'}`}>
            {status ? 'Draft' : 'Active'}
          </span>
        )}
      </td>

      {/* Actions */}
      <td className="w-24 px-4">
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button 
            onClick={onEdit}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Edit"
          >
            <Edit size={16} />
          </button>
          <button 
            onClick={onDelete}
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Delete"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </td>
    </tr>
  );
}
