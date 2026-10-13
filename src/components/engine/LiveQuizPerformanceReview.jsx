"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import LiveQuizPdfExportModal from '@/components/engine/LiveQuizPdfExportModal';

/**
 * LiveQuizPerformanceReview Component
 * Displays a live summary dashboard (Attempted, Correct, Incorrect, Skipped),
 * detailed review cards for past attempted questions, and PDF export functionality.
 */
export default function LiveQuizPerformanceReview({ 
  questionHistory = [], 
  totalQuestions = 10,
  currentIndex = 0,
  sessionData = {},
  categoryInfo = {},
  allQuestions = [],
  score = 0,
  highestStreak = 0
}) {
  const [activeFilter, setActiveFilter] = useState('ALL'); // 'ALL' | 'CORRECT' | 'INCORRECT' | 'SKIPPED'
  const [expandedIndex, setExpandedIndex] = useState(null);
  const [showPdfModal, setShowPdfModal] = useState(false);

  // Computed Metrics
  const attemptedCount = questionHistory.filter(q => !q.isSkipped).length;
  const correctCount = questionHistory.filter(q => q.isCorrect).length;
  const incorrectCount = questionHistory.filter(q => !q.isSkipped && !q.isCorrect).length;
  const skippedCount = questionHistory.filter(q => q.isSkipped).length;
  
  const accuracy = attemptedCount > 0 ? Math.round((correctCount / attemptedCount) * 100) : 0;
  const completionPercent = totalQuestions > 0 ? Math.min(100, Math.round((questionHistory.length / totalQuestions) * 100)) : 0;

  // Filtered list of history items
  const filteredHistory = questionHistory.filter(item => {
    if (activeFilter === 'CORRECT') return item.isCorrect;
    if (activeFilter === 'INCORRECT') return !item.isSkipped && !item.isCorrect;
    if (activeFilter === 'SKIPPED') return item.isSkipped;
    return true;
  });

  return (
    <div className="w-full max-w-4xl mx-auto mt-6 sm:mt-8 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
      
      {/* 📊 MAIN SUMMARY DASHBOARD CARD */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-4 sm:p-6 space-y-4 sm:space-y-5 overflow-hidden relative">
        {/* Top subtle decorative gradient bar */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-indigo-500 via-emerald-400 to-amber-400" />

        {/* Dashboard Header */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-indigo-50 border border-indigo-200/70 text-indigo-600 flex items-center justify-center text-lg sm:text-xl shadow-2xs">
              📊
            </div>
            <div>
              <h4 className="text-sm sm:text-base font-black text-slate-900 tracking-tight flex items-center gap-1.5">
                <span>लाइव प्रदर्शन सारांश</span>
                <span className="text-[11px] font-bold text-slate-400">({questionHistory.length}/{totalQuestions} प्रश्न)</span>
              </h4>
              <p className="text-[11px] sm:text-xs font-semibold text-slate-500">
                आपके द्वारा अब तक हल किए गए प्रश्नों की लाइव रिपोर्ट
              </p>
            </div>
          </div>

          {/* Actions & Pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {highestStreak > 1 && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-700 text-xs font-black shadow-2xs animate-in zoom-in-90 duration-200">
                <span>🔥 स्ट्रीक:</span>
                <span className="tabular-nums">{highestStreak}x</span>
              </span>
            )}
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-indigo-50 border border-indigo-200/80 text-indigo-700 text-xs font-black shadow-2xs">
              <span>🎯 सटीकता:</span>
              <span className="tabular-nums">{accuracy}%</span>
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold tabular-nums">
              <span>{completionPercent}% पूर्ण</span>
            </span>

            {/* 📥 PDF Export Button */}
            <button
              type="button"
              onClick={() => setShowPdfModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white text-xs font-black shadow-xs active:scale-95 transition-all cursor-pointer"
              title="प्रश्नोत्तरी एवं परिणाम पीडीएफ एक्सपोर्ट करें (Export PDF)"
            >
              <span>📥</span>
              <span>पीडीएफ एक्सपोर्ट (PDF)</span>
            </button>
          </div>
        </div>

        {/* 🎛️ 4 RECTANGULAR DASHBOARD METRIC TILES */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
          
          {/* Tile 1: कुल प्रयास (Attempted) */}
          <div className="bg-slate-50/80 hover:bg-slate-50 rounded-2xl p-3 sm:p-3.5 border border-slate-200/80 transition-all flex items-center justify-between gap-2 shadow-2xs">
            <div>
              <p className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-tight">कुल प्रयास</p>
              <p className="text-lg sm:text-2xl font-black text-slate-900 tabular-nums leading-tight mt-0.5">
                {attemptedCount}
              </p>
              <p className="text-[9px] sm:text-[10px] font-semibold text-slate-400">अटेम्प्ट किए</p>
            </div>
            <div className="w-8 h-8 rounded-xl bg-indigo-100/70 text-indigo-600 flex items-center justify-center text-sm font-black shrink-0">
              📝
            </div>
          </div>

          {/* Tile 2: सही उत्तर (Correct) */}
          <div className="bg-emerald-50/70 hover:bg-emerald-50 rounded-2xl p-3 sm:p-3.5 border border-emerald-200/80 transition-all flex items-center justify-between gap-2 shadow-2xs">
            <div>
              <p className="text-[10px] sm:text-[11px] font-bold text-emerald-800 uppercase tracking-tight">सही उत्तर</p>
              <p className="text-lg sm:text-2xl font-black text-emerald-600 tabular-nums leading-tight mt-0.5">
                {correctCount}
              </p>
              <p className="text-[9px] sm:text-[10px] font-semibold text-emerald-600/80">+{correctCount} अंक मिले</p>
            </div>
            <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center text-sm font-black shrink-0 shadow-xs">
              ✓
            </div>
          </div>

          {/* Tile 3: गलत उत्तर (Incorrect) */}
          <div className="bg-rose-50/70 hover:bg-rose-50 rounded-2xl p-3 sm:p-3.5 border border-rose-200/80 transition-all flex items-center justify-between gap-2 shadow-2xs">
            <div>
              <p className="text-[10px] sm:text-[11px] font-bold text-rose-800 uppercase tracking-tight">गलत उत्तर</p>
              <p className="text-lg sm:text-2xl font-black text-rose-600 tabular-nums leading-tight mt-0.5">
                {incorrectCount}
              </p>
              <p className="text-[9px] sm:text-[10px] font-semibold text-rose-600/80">चूक गए</p>
            </div>
            <div className="w-8 h-8 rounded-xl bg-rose-500 text-white flex items-center justify-center text-sm font-black shrink-0 shadow-xs">
              ✗
            </div>
          </div>

          {/* Tile 4: छोड़े गए / समय समाप्त (Skipped) */}
          <div className="bg-amber-50/70 hover:bg-amber-50 rounded-2xl p-3 sm:p-3.5 border border-amber-200/80 transition-all flex items-center justify-between gap-2 shadow-2xs">
            <div>
              <p className="text-[10px] sm:text-[11px] font-bold text-amber-800 uppercase tracking-tight">छोड़े गए</p>
              <p className="text-lg sm:text-2xl font-black text-amber-600 tabular-nums leading-tight mt-0.5">
                {skippedCount}
              </p>
              <p className="text-[9px] sm:text-[10px] font-semibold text-amber-600/80">समय समाप्त</p>
            </div>
            <div className="w-8 h-8 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center text-sm font-black shrink-0 shadow-xs">
              ⏳
            </div>
          </div>

        </div>

        {/* 🌈 MULTI-SEGMENT LIVE PROGRESS BAR */}
        <div className="space-y-1.5 pt-1">
          <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden flex">
            {/* Correct Segment */}
            {correctCount > 0 && (
              <div 
                className="bg-emerald-500 h-full transition-all duration-500" 
                style={{ width: `${(correctCount / totalQuestions) * 100}%` }}
                title={`सही: ${correctCount}`}
              />
            )}
            {/* Incorrect Segment */}
            {incorrectCount > 0 && (
              <div 
                className="bg-rose-500 h-full transition-all duration-500" 
                style={{ width: `${(incorrectCount / totalQuestions) * 100}%` }}
                title={`गलत: ${incorrectCount}`}
              />
            )}
            {/* Skipped Segment */}
            {skippedCount > 0 && (
              <div 
                className="bg-amber-400 h-full transition-all duration-500" 
                style={{ width: `${(skippedCount / totalQuestions) * 100}%` }}
                title={`छोड़े गए: ${skippedCount}`}
              />
            )}
          </div>
          
          <div className="flex items-center justify-between text-[10px] sm:text-[11px] font-bold text-slate-400 px-0.5">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span> सही ({correctCount})
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-rose-500"></span> गलत ({incorrectCount})
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-400"></span> छोड़े गए ({skippedCount})
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-slate-200"></span> शेष ({Math.max(0, totalQuestions - questionHistory.length)})
            </span>
          </div>
        </div>

      </div>


      {/* 📜 DETAILED REVIEW OF PAST ATTEMPTED QUESTIONS */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-4 sm:p-6 space-y-4">
        
        {/* Section Header & Filter Badges */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-base sm:text-lg">📋</span>
            <h5 className="text-xs sm:text-sm font-black text-slate-900 tracking-tight">
              पिछले प्रश्नों का विस्तृत विवरण (Attempted Questions)
            </h5>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1 flex-wrap">
            <button
              type="button"
              onClick={() => setActiveFilter('ALL')}
              className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeFilter === 'ALL'
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              सभी ({questionHistory.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('CORRECT')}
              className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeFilter === 'CORRECT'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
              }`}
            >
              ✓ सही ({correctCount})
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('INCORRECT')}
              className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeFilter === 'INCORRECT'
                  ? 'bg-rose-600 text-white shadow-2xs'
                  : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
              }`}
            >
              ✗ गलत ({incorrectCount})
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('SKIPPED')}
              className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeFilter === 'SKIPPED'
                  ? 'bg-amber-500 text-white shadow-2xs'
                  : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
              }`}
            >
              ⏳ छोड़े गए ({skippedCount})
            </button>
          </div>
        </div>

        {/* Empty State: When no questions have been answered yet */}
        {questionHistory.length === 0 ? (
          <div className="py-8 sm:py-10 px-4 text-center space-y-2.5 bg-slate-50/70 rounded-2xl border border-dashed border-slate-200">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center text-2xl mx-auto">
              🎯
            </div>
            <p className="text-xs sm:text-sm font-bold text-slate-700">
              अभी तक कोई प्रश्न हल नहीं किया गया है
            </p>
            <p className="text-[11px] text-slate-500 max-w-sm mx-auto leading-relaxed">
              जैसे ही आप वर्तमान प्रश्न का उत्तर देंगे, उसका पूरा विश्लेषण, आपका चुना हुआ विकल्प और सही उत्तर यहाँ लाइव दिखाई देगा।
            </p>
          </div>
        ) : filteredHistory.length === 0 ? (
          <div className="py-6 px-4 text-center space-y-1 bg-slate-50 rounded-2xl border border-slate-100">
            <p className="text-xs font-bold text-slate-600">इस फिल्टर में कोई प्रश्न नहीं है</p>
            <p className="text-[10px] text-slate-400">अन्य फिल्टर पर क्लिक करें।</p>
          </div>
        ) : (
          /* List of past questions */
          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-0.5 custom-scrollbar">
            {filteredHistory.map((item, idx) => {
              const isItemExpanded = expandedIndex === item.index || expandedIndex === null;

              return (
                <div 
                  key={item.index ?? idx}
                  className={`rounded-2xl p-3.5 sm:p-4 border transition-all ${
                    item.isCorrect
                      ? 'bg-emerald-50/30 border-emerald-200/90 hover:border-emerald-300'
                      : item.isSkipped
                      ? 'bg-amber-50/30 border-amber-200/90 hover:border-amber-300'
                      : 'bg-rose-50/30 border-rose-200/90 hover:border-rose-300'
                  }`}
                >
                  {/* Top Row: Question Number, Status Tag, Difficulty */}
                  <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-slate-800 bg-white border border-slate-200/80 px-2 py-0.5 rounded-lg shadow-2xs">
                        प्रश्न {item.questionNumber}
                      </span>
                      
                      {/* Status Badge */}
                      {item.isCorrect ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-black bg-emerald-500 text-white px-2.5 py-0.5 rounded-lg shadow-2xs">
                          ✓ सही (+1 अंक)
                        </span>
                      ) : item.isSkipped ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-black bg-amber-500 text-slate-950 px-2.5 py-0.5 rounded-lg shadow-2xs">
                          ⏳ समय समाप्त (छोड़ा गया)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-black bg-rose-500 text-white px-2.5 py-0.5 rounded-lg shadow-2xs">
                          ✗ गलत (0 अंक)
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {item.timeTaken && (
                        <span className="text-[10px] font-bold text-slate-500 bg-white px-2 py-0.5 rounded-md border border-slate-200/70 font-mono">
                          ⏱️ {item.timeTaken}s
                        </span>
                      )}
                      <span className="text-[10px] font-bold text-slate-500 bg-white px-2 py-0.5 rounded-md border border-slate-200/70">
                        {item.difficulty === 'hard' ? 'कठिन' : item.difficulty === 'medium' ? 'मध्यम' : 'सरल'}
                      </span>
                    </div>
                  </div>

                  {/* Question Text */}
                  <p className="text-xs sm:text-sm font-bold text-slate-900 leading-snug mb-3">
                    {item.questionText}
                  </p>

                  {/* Answer Comparison Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    
                    {/* Card 1: आपका उत्तर (User Answer) */}
                    <div className={`p-2.5 rounded-xl border flex items-start gap-2 ${
                      item.isCorrect
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                        : item.isSkipped
                        ? 'bg-amber-50 border-amber-300 text-amber-950'
                        : 'bg-rose-50 border-rose-300 text-rose-950'
                    }`}>
                      <span className="font-bold shrink-0 text-sm">
                        {item.isCorrect ? '✓' : item.isSkipped ? '⏳' : '✗'}
                      </span>
                      <div className="min-w-0">
                        <span className="text-[10px] font-bold block uppercase tracking-wider opacity-75">
                          आपका उत्तर:
                        </span>
                        <span className="font-bold break-words leading-tight block mt-0.5">
                          {item.isSkipped 
                            ? 'उत्तर नहीं दिया (समय समाप्त)' 
                            : (item.selectedOption || 'अज्ञात विकल्प')}
                        </span>
                      </div>
                    </div>

                    {/* Card 2: सही उत्तर (Correct Answer - shown if user was wrong or skipped) */}
                    {(!item.isCorrect || item.isSkipped) && (
                      <div className="p-2.5 rounded-xl border bg-emerald-50 border-emerald-300 text-emerald-950 flex items-start gap-2">
                        <span className="font-bold shrink-0 text-sm text-emerald-600">💡</span>
                        <div className="min-w-0">
                          <span className="text-[10px] font-bold block uppercase tracking-wider text-emerald-700">
                            सही उत्तर:
                          </span>
                          <span className="font-black text-emerald-900 break-words leading-tight block mt-0.5">
                            {item.correctAnswer}
                          </span>
                        </div>
                      </div>
                    )}

                  </div>

                  {/* Optional Explanation */}
                  {item.explanation && (
                    <div className="mt-2.5 p-2.5 bg-indigo-50/70 border border-indigo-200/80 rounded-xl text-[11px] text-indigo-950 leading-relaxed">
                      <span className="font-bold text-indigo-700 block mb-0.5">💡 व्याख्या (Explanation):</span>
                      <span>{item.explanation}</span>
                    </div>
                  )}

                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* 📄 LIVE QUIZ PDF EXPORT & PREVIEW MODAL */}
      <LiveQuizPdfExportModal
        isOpen={showPdfModal}
        onClose={() => setShowPdfModal(false)}
        sessionData={sessionData}
        categoryInfo={categoryInfo}
        questionHistory={questionHistory}
        allQuestions={allQuestions}
        score={score}
        totalQuestions={totalQuestions}
      />

    </div>
  );
}
