"use client";

import React from 'react';
import { Eye, Edit, Trash2, CheckCircle, HelpCircle, Image as ImageIcon } from 'lucide-react';

/**
 * QuestionPreview Component
 * Renders a high-resolution, scrollable preview of a question for the detail pane.
 */
export default function QuestionPreview({ question, onEdit, onDelete }) {
  if (!question) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-4">
        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center">
          <Eye size={32} />
        </div>
        <p className="font-bold uppercase tracking-widest text-[10px]">Select a question to see live preview</p>
      </div>
    );
  }

  const options = JSON.parse(question.options || '[]');
  const optionsHi = JSON.parse(question.optionsHi || '[]');

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header Actions */}
      <div className="p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-md z-10">
        <div className="flex items-center gap-3">
          <span className="bg-indigo-600 text-white w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm shadow-lg shadow-indigo-100 italic">
            Q
          </span>
          <div>
            <h3 className="font-bold text-slate-800 text-sm">Question Detail</h3>
            <p className="text-[10px] text-slate-400 font-mono tracking-tight lowercase">ID: {question.id.substring(0, 8)}...</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => onEdit(question)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl font-bold text-xs hover:bg-indigo-100 transition shadow-sm"
          >
            <Edit size={14} /> Full Edit
          </button>
          <button 
            onClick={() => onDelete(question.id)}
            className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Preview Content */}
      <div className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-10">
        
        {/* Bilingual Text */}
        <div className="grid grid-cols-2 gap-8">
          <div className="space-y-3">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full" /> English
            </h4>
            <div className="text-slate-700 font-bold leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-100 min-h-[100px]">
              {question.text}
            </div>
          </div>
          <div className="space-y-3">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-rose-500 rounded-full" /> Hindi
            </h4>
            <div className="text-slate-700 font-bold leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-100 min-h-[100px]">
              {question.textHi || <span className="text-slate-300 italic">No translation added</span>}
            </div>
          </div>
        </div>

        {/* Media */}
        {question.image && (
          <div className="space-y-3">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Question Media</h4>
            <div className="relative aspect-video max-w-sm overflow-hidden rounded-3xl border-4 border-white shadow-xl">
              <img src={question.image} alt="Question" className="w-full h-full object-contain bg-slate-100 p-2" />
            </div>
          </div>
        )}

        {/* Options Grid */}
        <div className="space-y-4">
          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Response Grid (Options)</h4>
          <div className="grid grid-cols-1 gap-3">
            {options.map((opt, idx) => (
              <div 
                key={idx} 
                className={`flex flex-col p-4 rounded-2xl border-2 transition-all ${
                  question.answer === idx 
                    ? 'border-emerald-500 bg-emerald-50/50 shadow-sm' 
                    : 'border-slate-50 hover:border-slate-100 bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-[10px] font-black uppercase tracking-widest ${question.answer === idx ? 'text-emerald-600' : 'text-slate-300'}`}>
                    Option {idx + 1}
                  </span>
                  {question.answer === idx && (
                    <span className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-500 text-white rounded-full text-[9px] font-black uppercase tracking-widest shadow-lg shadow-emerald-100">
                      <CheckCircle size={10} /> Correct Answer
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className={`text-sm font-bold ${question.answer === idx ? 'text-emerald-900' : 'text-slate-700'}`}>{opt}</div>
                  <div className={`text-sm font-bold ${question.answer === idx ? 'text-emerald-900' : 'text-slate-700'}`}>{optionsHi[idx]}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Explanation */}
        {(question.explanation || question.explanationHi) && (
          <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 space-y-4">
            <h4 className="flex items-center gap-2 text-[10px] font-black text-indigo-400 uppercase tracking-widest">
              <HelpCircle size={14} /> Solution Explanation
            </h4>
            <div className="grid grid-cols-2 gap-6">
              <div className="text-xs text-slate-600 leading-normal font-medium">{question.explanation}</div>
              <div className="text-xs text-slate-600 leading-normal font-medium">{question.explanationHi}</div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
