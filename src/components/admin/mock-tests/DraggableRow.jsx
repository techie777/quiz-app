"use client";

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';

/**
 * DraggableRow Component
 * A reusable wrapper for table rows that enables drag-and-drop reordering.
 */
export default function DraggableRow({ id, children, className }) {
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
    background: isDragging ? '#f8fafc' : 'transparent',
    boxShadow: isDragging ? '0 10px 15px -3px rgba(0, 0, 0, 0.1)' : 'none',
  };

  return (
    <tr ref={setNodeRef} style={style} className={className}>
      <td className="w-10">
        <button
          type="button"
          className="cursor-grab active:cursor-grabbing p-2 text-slate-300 hover:text-indigo-400 transition-colors"
          {...attributes}
          {...listeners}
        >
          <GripVertical size={18} />
        </button>
      </td>
      {children}
    </tr>
  );
}
