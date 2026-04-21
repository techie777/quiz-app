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
import DraggableRow from './DraggableRow';
import QuestionPreview from './QuestionPreview';
import { Search, Filter, Layers, ListFilter, Trash2, Move, LayoutGrid } from 'lucide-react';

/**
 * QuestionBankManager Component
 * Enterprise-grade split-screen view for managing large question datasets.
 */
export default function QuestionBankManager({ 
  questions, 
  sections,
  onReorder, 
  onEdit, 
  onDelete,
  onBulkDelete,
  onBulkMove,
  selectedPaperTitle
}) {
  const [selectedQuestionId, setSelectedQuestionId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [filterSectionId, setFilterSectionId] = useState('all');

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIdx = questions.findIndex(i => i.id === active.id);
    const newIdx = questions.findIndex(i => i.id === over.id);
    
    const newList = arrayMove(questions, oldIdx, newIdx);
    onReorder(newList);
  };

  const filteredQuestions = questions.filter(q => {
    const matchesSearch = q.text.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         q.textHi?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSection = filterSectionId === 'all' || q.sectionId === filterSectionId;
    return matchesSearch && matchesSection;
  });

  const selectedQuestion = questions.find(q => q.id === selectedQuestionId);

  const toggleSelect = (id) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredQuestions.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredQuestions.map(q => q.id)));
    }
  };

  return (
    <div className="flex bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm h-[750px]">
      
      {/* LEFT: Master List (40%) */}
      <div className="w-[40%] flex flex-col border-r border-slate-100 bg-slate-50/20">
        
        {/* List Header */}
        <div className="p-6 border-b border-slate-100 bg-white space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">List View</h3>
            <span className="text-[10px] font-bold text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-full">{filteredQuestions.length} Questions</span>
          </div>
          
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" size={16} />
            <input 
              type="text" 
              placeholder="Filter list..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-sm font-medium"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            <button 
              onClick={() => setFilterSectionId('all')}
              className={`px-3 py-1 rounded-full text-[10px] whitespace-nowrap font-black uppercase transition-all ${filterSectionId === 'all' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
            >
              All
            </button>
            {sections.map(s => (
              <button 
                key={s.id}
                onClick={() => setFilterSectionId(s.id)}
                className={`px-3 py-1 rounded-full text-[10px] whitespace-nowrap font-black uppercase transition-all ${filterSectionId === s.id ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
              >
                {s.name}
              </button>
            ))}
          </div>
        </div>

        {/* Bulk Actions (Conditional) */}
        {selectedIds.size > 0 && (
          <div className="px-6 py-3 bg-indigo-600 flex items-center justify-between text-white shadow-lg animate-in fade-in slide-in-from-top-4">
            <span className="text-[10px] font-black uppercase tracking-widest">{selectedIds.size} Selected</span>
            <div className="flex items-center gap-1">
              <button onClick={() => onBulkMove(Array.from(selectedIds))} className="p-1.5 hover:bg-white/20 rounded-lg transition" title="Change Section"><Move size={14}/></button>
              <button onClick={() => onBulkDelete(Array.from(selectedIds))} className="p-1.5 hover:bg-white/20 rounded-lg transition" title="Delete Selection"><Trash2 size={14}/></button>
            </div>
          </div>
        )}

        {/* Scrollable Questions List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-50/50 sticky top-0 z-10 border-b border-slate-100">
                <th className="w-10 p-4">
                   <input 
                    type="checkbox" 
                    checked={selectedIds.size === filteredQuestions.length && filteredQuestions.length > 0}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" 
                  />
                </th>
                <th className="py-3 px-2 text-[10px] font-black uppercase tracking-widest text-slate-400">Snippet</th>
              </tr>
            </thead>
            <tbody>
              {filteredQuestions.map((q, idx) => (
                <tr 
                  key={q.id}
                  onClick={() => setSelectedQuestionId(q.id)}
                  className={`group cursor-pointer transition-all border-b border-slate-50/50 ${selectedQuestionId === q.id ? 'bg-indigo-50/40' : 'hover:bg-white bg-transparent'}`}
                >
                  <td className="p-4" onClick={(e) => e.stopPropagation()}>
                    <input 
                      type="checkbox" 
                      checked={selectedIds.has(q.id)}
                      onChange={() => toggleSelect(q.id)}
                      className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" 
                    />
                  </td>
                  <td className="py-3 px-2">
                    <div className="space-y-1">
                      <div className={`text-xs font-bold transition-colors ${selectedQuestionId === q.id ? 'text-indigo-600' : 'text-slate-700 group-hover:text-slate-900'}`}>
                        {idx + 1}. {q.text.substring(0, 60)}...
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[8px] font-black uppercase text-slate-300 tracking-tighter bg-slate-50 px-1.5 rounded border border-slate-100">
                          {sections.find(s => s.id === q.sectionId)?.name || 'General'}
                        </span>
                        {q.image && <span className="text-[8px] font-black uppercase text-indigo-400">Media ✓</span>}
                      </div>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredQuestions.length === 0 && (
                <tr>
                  <td colSpan="2" className="py-20 text-center">
                    <Layers size={32} className="mx-auto text-slate-200 mb-3" />
                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">No questions found</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* RIGHT: Detail Preview (60%) */}
      <div className="flex-1 bg-white flex flex-col">
        <QuestionPreview 
          question={selectedQuestion} 
          onEdit={onEdit}
          onDelete={onDelete}
        />
      </div>

    </div>
  );
}
