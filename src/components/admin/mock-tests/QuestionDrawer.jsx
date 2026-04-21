"use client";

import React, { useState, useEffect, useCallback } from 'react';
import SideDrawer from './SideDrawer';
import { 
  Save, 
  Trash2, 
  Image as ImageIcon, 
  X, 
  CheckCircle, 
  Zap, 
  Monitor, 
  Type,
  Maximize2
} from 'lucide-react';

/**
 * QuestionDrawer Component
 * Focused workspace for rapid-fire question authoring with parallel bilingual inputs.
 */
export default function QuestionDrawer({
  isOpen,
  onClose,
  questionForm,
  setQuestionForm,
  sections,
  onSave,
  onImageUpload
}) {
  const [activeOption, setActiveOption] = useState(0);

  // Keyboard Shortcuts Handler
  const handleKeyDown = useCallback((e) => {
    // Ctrl + S to Save
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      onSave();
    }
    // Alt + 1-4 to focus Option Input
    if (e.altKey && ['1', '2', '3', '4'].includes(e.key)) {
      e.preventDefault();
      const idx = parseInt(e.key) - 1;
      document.getElementById(`opt-en-${idx}`)?.focus();
    }
  }, [onSave]);

  useEffect(() => {
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleKeyDown]);

  const handleUpdateOption = (idx, lang, val) => {
    const key = lang === 'en' ? 'options' : 'optionsHi';
    const next = [...questionForm[key]];
    next[idx] = val;
    setQuestionForm(prev => ({ ...prev, [key]: next }));
  };

  return (
    <SideDrawer 
      isOpen={isOpen} 
      onClose={onClose} 
      title={questionForm.id ? "Edit Question" : "Create New Question"}
      maxWidth="1100px"
    >
      <div className="flex flex-col h-full bg-slate-50/50">
        
        {/* Rapid Entry Banner */}
        <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 p-4 shrink-0 flex items-center justify-between text-white overflow-hidden relative">
          <div className="flex items-center gap-3 relative z-10">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
              <Zap size={16} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Focus Mode</p>
              <h4 className="text-xs font-bold leading-tight">Parallel Bilingual Entry Active</h4>
            </div>
          </div>
          <div className="flex gap-4 relative z-10">
             <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest bg-black/20 px-3 py-1.5 rounded-full border border-white/10">
                <Monitor size={12} /> <span className="opacity-60">Save:</span> <span className="text-amber-400">Ctrl + S</span>
             </div>
             <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest bg-black/20 px-3 py-1.5 rounded-full border border-white/10">
                <Type size={12} /> <span className="opacity-60">Focus:</span> <span className="text-amber-400">Alt + 1-4</span>
             </div>
          </div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-3xl pointer-events-none" />
        </div>

        {/* Form Body */}
        <div className="flex-1 overflow-y-auto p-10 space-y-12 pb-32 custom-scrollbar">
          
          {/* Main Question Text (Parallel) */}
          <section className="space-y-4">
             <div className="flex items-center justify-between mb-4">
               <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Question Workspace</h3>
               <div className="flex gap-4">
                  <select 
                    value={questionForm.sectionId} 
                    onChange={e => setQuestionForm(p => ({...p, sectionId: e.target.value}))}
                    className="text-xs font-bold border-none bg-indigo-50 text-indigo-600 rounded-lg px-3 py-1 focus:ring-0"
                  >
                    <option value="">Select Section</option>
                    {sections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                  <select 
                    value={questionForm.difficulty} 
                    onChange={e => setQuestionForm(p => ({...p, difficulty: e.target.value}))}
                    className="text-xs font-bold border-none bg-slate-100 text-slate-500 rounded-lg px-3 py-1 focus:ring-0"
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
               </div>
             </div>

             <div className="grid grid-cols-2 gap-10">
                <div className="space-y-4">
                   <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-600">English Text</label>
                      <span className="text-[9px] font-black text-blue-500 uppercase px-2 py-0.5 bg-blue-50 bg-opacity-50 border border-blue-100 rounded-full">Primary</span>
                   </div>
                   <textarea
                    autoFocus
                    value={questionForm.text}
                    onChange={e => setQuestionForm(p => ({...p, text: e.target.value}))}
                    placeholder="Type English question here..."
                    className="w-full p-5 bg-white border border-slate-200 rounded-3xl min-h-[160px] text-sm font-medium focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all resize-none shadow-sm"
                   />
                </div>
                <div className="space-y-4">
                   <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-600">Hindi Translation</label>
                      <span className="text-[9px] font-black text-rose-500 uppercase px-2 py-0.5 bg-rose-50 bg-opacity-50 border border-rose-100 rounded-full">Secondary</span>
                   </div>
                   <textarea
                    value={questionForm.textHi}
                    onChange={e => setQuestionForm(p => ({...p, textHi: e.target.value}))}
                    placeholder="हिंदी प्रश्न यहाँ लिखें..."
                    className="w-full p-5 bg-white border border-slate-200 rounded-3xl min-h-[160px] text-sm font-medium focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all resize-none shadow-sm"
                   />
                </div>
             </div>

             {/* Question Image */}
             <div className="p-6 bg-white border border-slate-100 rounded-3xl flex items-center gap-6 shadow-sm">
                <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 overflow-hidden relative group">
                   {questionForm.image ? (
                     <img src={questionForm.image} className="w-full h-full object-cover" />
                   ) : (
                     <ImageIcon size={24} />
                   )}
                   {questionForm.image && (
                     <button onClick={() => setQuestionForm(p => ({...p, image: ''}))} className="absolute inset-0 bg-rose-500/90 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <Trash2 size={20} />
                     </button>
                   )}
                </div>
                <div className="flex-1">
                   <h5 className="text-xs font-bold text-slate-700">Question Illustration</h5>
                   <p className="text-[10px] text-slate-400">Upload a diagram, math equation, or scenario image.</p>
                </div>
                <label className="px-6 py-2.5 bg-indigo-50 text-indigo-600 rounded-xl font-bold text-xs cursor-pointer hover:bg-indigo-100 transition">
                  <Monitor size={16} className="inline mr-2" /> {questionForm.image ? "Change Media" : "Upload Image"}
                  <input type="file" className="hidden" onChange={e => onImageUpload(e, 'question')} />
                </label>
             </div>
          </section>

          {/* Options Grid (Highly Compact) */}
          <section className="space-y-6">
             <div className="flex items-center gap-3">
               <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Options Configuration</h3>
               <div className="h-px bg-slate-100 flex-1" />
             </div>

             <div className="grid grid-cols-2 gap-x-12 gap-y-8">
                {[0, 1, 2, 3].map(idx => (
                  <div key={idx} className={`relative p-8 rounded-[2rem] border-2 transition-all ${questionForm.answer === idx ? 'border-emerald-500 bg-white shadow-xl shadow-emerald-500/10' : 'border-slate-100 bg-white hover:border-slate-200'}`}>
                    
                    {/* Correct Indicator & Radio */}
                    <div className="absolute -top-3 left-8 px-4 py-1.5 bg-white border-2 border-slate-100 rounded-full flex items-center gap-3 shadow-sm">
                       <span className={`text-[9px] font-black uppercase tracking-tighter ${questionForm.answer === idx ? 'text-emerald-500' : 'text-slate-400'}`}>Option {idx + 1}</span>
                       <input 
                        type="radio" 
                        id={`radio-${idx}`}
                        name="correct" 
                        checked={questionForm.answer === idx} 
                        onChange={() => setQuestionForm(p => ({...p, answer: idx}))}
                        className="w-4 h-4 accent-emerald-500 cursor-pointer" 
                      />
                    </div>

                    <div className="space-y-4">
                       <div className="grid grid-cols-2 gap-4">
                          <input 
                            id={`opt-en-${idx}`}
                            type="text" 
                            placeholder="Option (EN)" 
                            value={questionForm.options[idx]}
                            onChange={e => handleUpdateOption(idx, 'en', e.target.value)}
                            className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 text-xs font-bold focus:bg-white focus:border-indigo-500 transition-all outline-none"
                          />
                          <input 
                            type="text" 
                            placeholder="Option (HI)" 
                            value={questionForm.optionsHi[idx]}
                            onChange={e => handleUpdateOption(idx, 'hi', e.target.value)}
                            className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 text-xs font-bold focus:bg-white focus:border-indigo-500 transition-all outline-none"
                          />
                       </div>
                    </div>
                  </div>
                ))}
             </div>
          </section>

          {/* Solution Workspace */}
          <section className="space-y-6">
             <div className="flex items-center gap-3">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Solution Workspace</h3>
                <div className="h-px bg-slate-100 flex-1" />
             </div>
             <div className="grid grid-cols-2 gap-10">
                <textarea
                  value={questionForm.explanation}
                  onChange={e => setQuestionForm(p => ({...p, explanation: e.target.value}))}
                  placeholder="Solution in English..."
                  className="w-full p-5 bg-white border border-slate-100 rounded-3xl min-h-[140px] text-xs font-medium focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all resize-none shadow-sm"
                />
                <textarea
                  value={questionForm.explanationHi}
                  onChange={e => setQuestionForm(p => ({...p, explanationHi: e.target.value}))}
                  placeholder="हिंदी में हल यहाँ लिखें..."
                  className="w-full p-5 bg-white border border-slate-100 rounded-3xl min-h-[140px] text-xs font-medium focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all resize-none shadow-sm"
                />
             </div>
          </section>

        </div>

        {/* Sticky Action Footer */}
        <div className="shrink-0 p-8 border-t border-slate-100 bg-white/80 backdrop-blur-xl absolute bottom-0 left-0 right-0 flex items-center justify-between z-20">
           <button 
            type="button" 
            onClick={onClose} 
            className="px-10 py-3 rounded-2xl font-bold text-slate-400 hover:text-slate-600 transition h-14"
          >
            Discard
          </button>
          <div className="flex gap-4">
             <button 
              type="button" 
              onClick={onSave}
              className="bg-indigo-600 text-white px-12 py-3 rounded-2xl font-black shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition flex items-center gap-3 h-14 group"
            >
              <Save size={20} className="group-hover:scale-110 transition-transform" /> Save & Update Bank
            </button>
          </div>
        </div>

      </div>
    </SideDrawer>
  );
}
