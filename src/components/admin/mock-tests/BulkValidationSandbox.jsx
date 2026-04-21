"use client";

import React, { useState } from 'react';
import SideDrawer from './SideDrawer';
import { 
  CheckCircle2, 
  AlertCircle, 
  FileCheck, 
  Settings, 
  Rocket, 
  Trash2, 
  AlertTriangle,
  FileText,
  HelpCircle
} from 'lucide-react';

/**
 * BulkValidationSandbox Component
 * Pre-flight interface for validating and fixing Excel data before ingestion.
 */
export default function BulkValidationSandbox({ 
  isOpen, 
  onClose, 
  data, 
  onConfirm,
  sections 
}) {
  const [sandboxData, setSandboxData] = useState(data || []);
  const [activeErrorIdx, setActiveErrorIdx] = useState(null);

  // Simple validation logic
  const validationSummary = {
    total: sandboxData.length,
    valid: 0,
    errors: [],
    sectionsDetected: new Set()
  };

  sandboxData.forEach((q, idx) => {
    const errs = [];
    if (!q.text) errs.push("Missing Question Text");
    if (!q.options || q.options.length < 4) errs.push("Incomplete Options");
    if (q.answer === undefined || q.answer === null) errs.push("Missing Correct Answer");
    
    if (errs.length > 0) {
      validationSummary.errors.push({ idx, errs });
    } else {
      validationSummary.valid++;
    }
    if (q.sectionName) validationSummary.sectionsDetected.add(q.sectionName);
  });

  const handleUpdate = (idx, field, value) => {
    const next = [...sandboxData];
    next[idx][field] = value;
    setSandboxData(next);
  };

  return (
    <SideDrawer 
      isOpen={isOpen} 
      onClose={onClose} 
      title="High-Volume Ingester: Pre-flight Sandbox"
      maxWidth="1200px"
    >
      <div className="flex bg-slate-50 h-full">
        
        {/* Left: Validation Dashboard (30%) */}
        <div className="w-[30%] border-r border-slate-200 p-8 flex flex-col gap-6">
           <div className="p-6 bg-white rounded-3xl border border-slate-100 shadow-sm space-y-4">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Upload Summary</h4>
              <div className="grid grid-cols-2 gap-4">
                 <div className="bg-slate-50 p-4 rounded-2xl">
                    <span className="text-2xl font-black text-slate-800">{validationSummary.total}</span>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter mt-1">Found</p>
                 </div>
                 <div className="bg-emerald-50 p-4 rounded-2xl">
                    <span className="text-2xl font-black text-emerald-600">{validationSummary.valid}</span>
                    <p className="text-[9px] font-bold text-emerald-400 uppercase tracking-tighter mt-1">Ready</p>
                 </div>
              </div>
              <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 flex items-center justify-between">
                 <div>
                    <span className="text-2xl font-black text-amber-600">{validationSummary.errors.length}</span>
                    <p className="text-[9px] font-bold text-amber-500 uppercase tracking-tighter mt-1">Issues Found</p>
                 </div>
                 <AlertTriangle className="text-amber-400" size={32} />
              </div>
           </div>

           <div className="space-y-4">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Sections Mapping</h4>
              <div className="space-y-2">
                 {Array.from(validationSummary.sectionsDetected).map(name => {
                    const exists = sections.find(s => s.name === name);
                    return (
                      <div key={name} className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-100 italic">
                         <span className="text-xs font-bold text-slate-600">{name}</span>
                         {exists ? <CheckCircle2 size={14} className="text-emerald-500" /> : <AlertCircle size={14} className="text-rose-500" />}
                      </div>
                    );
                 })}
              </div>
           </div>

           <div className="mt-auto space-y-3">
              <button 
                disabled={validationSummary.errors.length > 0}
                onClick={() => onConfirm(sandboxData)}
                className={`w-full py-4 rounded-2xl font-black flex items-center justify-center gap-3 shadow-xl transition-all ${
                  validationSummary.errors.length === 0 
                  ? 'bg-indigo-600 text-white shadow-indigo-200 hover:bg-indigo-700 hover:-translate-y-1' 
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                }`}
              >
                <Rocket size={20} /> Ignite Batch Process
              </button>
              {validationSummary.errors.length > 0 && (
                <p className="text-[10px] text-center text-rose-500 font-bold uppercase tracking-widest italic">Fix all errors to proceed</p>
              )}
           </div>
        </div>

        {/* Right: Inline Batch Editor (70%) */}
        <div className="flex-1 p-8 flex flex-col gap-6 overflow-hidden">
           <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                 <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center font-bold">
                    <Settings size={16}/>
                 </div>
                 <h3 className="font-bold text-slate-700">Batch Error Reconciliation</h3>
              </div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Edit source data directly below</p>
           </div>

           <div className="bg-white border border-slate-200 rounded-3xl shadow-sm flex-1 overflow-hidden flex flex-col min-h-0">
              <div className="flex-1 overflow-y-auto custom-scrollbar">
                 <table className="w-full border-collapse">
                    <thead className="sticky top-0 z-20 bg-slate-50 border-b border-slate-100">
                       <tr>
                          <th className="p-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Row</th>
                          <th className="p-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                          <th className="p-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest w-[40%]">Question Text</th>
                          <th className="p-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Section</th>
                          <th className="p-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Correct</th>
                          <th className="p-4"></th>
                       </tr>
                    </thead>
                    <tbody>
                       {sandboxData.map((q, idx) => {
                          const error = validationSummary.errors.find(e => e.idx === idx);
                          return (
                            <tr key={idx} className={`border-b border-slate-50 transition-all ${error ? 'bg-rose-50/30' : 'hover:bg-slate-50/50'}`}>
                               <td className="p-4 font-mono text-[10px] text-slate-400">#{idx + 1}</td>
                               <td className="p-4">
                                  {error ? (
                                    <div className="flex items-center gap-2 group relative cursor-help">
                                       <AlertCircle size={14} className="text-rose-500" />
                                       <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block bg-slate-800 text-white p-2 rounded text-[9px] font-bold whitespace-nowrap z-30 shadow-xl">
                                          {error.errs.join(', ')}
                                       </div>
                                    </div>
                                  ) : (
                                    <CheckCircle2 size={14} className="text-emerald-400" />
                                  )}
                               </td>
                               <td className="p-4">
                                  <textarea 
                                    value={q.text} 
                                    onChange={(e) => handleUpdate(idx, 'text', e.target.value)}
                                    className="w-full bg-transparent border-none p-0 text-xs font-bold text-slate-700 focus:ring-0 resize-none"
                                    rows="2"
                                  />
                               </td>
                               <td className="p-4">
                                  <input 
                                    type="text" 
                                    value={q.sectionName || ''} 
                                    onChange={(e) => handleUpdate(idx, 'sectionName', e.target.value)}
                                    className="w-full bg-transparent border-none p-0 text-xs font-mono text-indigo-500 focus:ring-0"
                                  />
                               </td>
                               <td className="p-4 text-center">
                                  <input 
                                    type="number" 
                                    min="0" max="3"
                                    value={q.answer} 
                                    onChange={(e) => handleUpdate(idx, 'answer', parseInt(e.target.value))}
                                    className="w-10 bg-slate-50 border border-slate-100 rounded text-center text-xs font-black text-emerald-600 focus:bg-white transition"
                                  />
                               </td>
                               <td className="p-4">
                                  <button onClick={() => setSandboxData(prev => prev.filter((_, i) => i !== idx))} className="text-slate-300 hover:text-rose-500 transition">
                                     <Trash2 size={14} />
                                  </button>
                               </td>
                            </tr>
                          );
                       })}
                    </tbody>
                 </table>
              </div>
           </div>
        </div>

      </div>
    </SideDrawer>
  );
}
