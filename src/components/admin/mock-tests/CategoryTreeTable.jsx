"use client";

import React, { useState } from 'react';
import { 
  DndContext, 
  closestCenter, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors 
} from '@dnd-kit/core';
import { 
  arrayMove, 
  SortableContext, 
  sortableKeyboardCoordinates, 
  verticalListSortingStrategy 
} from '@dnd-kit/sortable';
import TreeRow from './TreeRow';
import { Search, Filter, Layers } from 'lucide-react';

/**
 * CategoryTreeTable Component
 * The main hierarchical table that displays Categories and their nested Exams.
 */
export default function CategoryTreeTable({ 
  categories, 
  exams, 
  onReorder, 
  onEditCategory, 
  onDeleteCategory, 
  onEditExam, 
  onDeleteExam,
  onBulkAction
}) {
  const [expandedIds, setExpandedIds] = useState(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState(new Set());

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Toggle category expansion
  const toggleExpand = (id) => {
    const next = new Set(expandedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpandedIds(next);
  };

  // Toggle selection for bulk actions
  const toggleSelect = (id, checked) => {
    const next = new Set(selectedIds);
    if (checked) next.add(id);
    else next.delete(id);
    setSelectedIds(next);
  };

  const handleDragEnd = (event, type, parentId = null) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    let list = type === 'categories' 
      ? categories 
      : exams.filter(ex => ex.categoryId === parentId);
    
    const oldIdx = list.findIndex(i => i.id === active.id);
    const newIdx = list.findIndex(i => i.id === over.id);
    
    const newList = arrayMove(list, oldIdx, newIdx);
    onReorder(type === 'categories' ? 'category' : 'exam', newList);
  };

  // Filtering logic
  const filteredCategories = categories.filter(cat => {
    const matchesCat = cat.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesChild = exams.some(ex => ex.categoryId === cat.id && ex.name.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCat || matchesChild;
  });

  return (
    <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
      {/* Search & Bulk Action Bar */}
      <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex flex-wrap items-center justify-between gap-4">
        <div className="relative group max-w-md w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
          <input 
            type="text" 
            placeholder="Search categories or exams (SSC, CGL...)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
          />
        </div>

        <div className="flex items-center gap-3">
          {selectedIds.size > 0 && (
            <div className="flex items-center gap-2 pr-4 border-r border-slate-200">
               <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{selectedIds.size} Selected</span>
               <button 
                 onClick={() => onBulkAction('toggleStatus', Array.from(selectedIds))}
                 className="px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-bold hover:bg-indigo-100 transition"
               >
                 Toggle Status
               </button>
            </div>
          )}
          <button className="flex items-center gap-2 px-4 py-2 text-slate-500 hover:text-slate-800 transition">
            <Filter size={18} />
            <span className="font-bold text-sm">Filters</span>
          </button>
        </div>
      </div>

      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-slate-50/50 border-b border-slate-100 border-t border-slate-100">
            <th className="w-10"></th>
            <th className="w-10"></th>
            <th className="py-4 px-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Hierarchy (Category / Exam)</th>
            <th className="py-4 px-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-center">Mocks</th>
            <th className="py-4 px-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-center">PYPs</th>
            <th className="py-4 px-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Status</th>
            <th className="py-4 px-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Actions</th>
          </tr>
        </thead>
        <DndContext 
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={(e) => handleDragEnd(e, 'categories')}
        >
          <SortableContext 
            items={filteredCategories.map(c => c.id)}
            strategy={verticalListSortingStrategy}
          >
            <tbody className="divide-y divide-slate-100">
              {filteredCategories.map(cat => (
                <React.Fragment key={cat.id}>
                  {/* Category Row */}
                  <TreeRow 
                    id={cat.id}
                    level={0}
                    title={cat.name}
                    subtitle={cat.slug}
                    icon={cat.icon || "📚"}
                    hasChildren={exams.some(ex => ex.categoryId === cat.id)}
                    isExpanded={expandedIds.has(cat.id)}
                    onToggle={() => toggleExpand(cat.id)}
                    onEdit={() => onEditCategory(cat)}
                    onDelete={() => onDeleteCategory(cat.id)}
                  />

                  {/* Sub-category Rows (Rendered if expanded) */}
                  {expandedIds.has(cat.id) && (
                    <DndContext 
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={(e) => handleDragEnd(e, 'exams', cat.id)}
                    >
                      <SortableContext 
                        items={exams.filter(ex => ex.categoryId === cat.id).map(ex => ex.id)}
                        strategy={verticalListSortingStrategy}
                      >
                        {exams
                          .filter(ex => ex.categoryId === cat.id)
                          .map(ex => (
                            <TreeRow 
                              key={ex.id}
                              id={ex.id}
                              level={1}
                              title={ex.name}
                              subtitle={`/${ex.slug}`}
                              icon={ex.emoji || "📝"}
                              stats={{ mockCount: ex.mockCount || 0, pypCount: ex.pypCount || 0 }}
                              status={ex.hidden}
                              onEdit={() => onEditExam(ex)}
                              onDelete={() => onDeleteExam(ex.id)}
                              selectable={true}
                              isSelected={selectedIds.has(ex.id)}
                              onSelect={(checked) => toggleSelect(ex.id, checked)}
                            />
                          ))}
                      </SortableContext>
                    </DndContext>
                  )}
                </React.Fragment>
              ))}
              
              {filteredCategories.length === 0 && (
                <tr>
                  <td colSpan="7" className="py-20 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-16 h-16 bg-slate-50 rounded-3xl flex items-center justify-center text-slate-300">
                        <Layers size={32} />
                      </div>
                      <div className="text-slate-400 font-bold uppercase tracking-widest text-xs">
                        {searchQuery ? `No results for "${searchQuery}"` : "Add your first main category to get started"}
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </SortableContext>
        </DndContext>
      </table>
    </div>
  );
}
