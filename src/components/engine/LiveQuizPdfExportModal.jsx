"use client";

import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import toast from 'react-hot-toast';

/**
 * LiveQuizPdfExportModal Component
 * Previews and exports the Live Quiz Play Questions, Results, Dashboard Tracker,
 * Category Details, and Play Again QR Code in a high-resolution PDF document.
 */
export default function LiveQuizPdfExportModal({
  isOpen,
  onClose,
  sessionData = {},
  categoryInfo = {},
  questionHistory = [],
  allQuestions = [],
  score = 0,
  totalQuestions = 10
}) {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const printDocRef = useRef(null);

  const sessionId = sessionData.sessionId || sessionData.code || 'BTLB83R';
  const categoryName = categoryInfo?.nameHi || categoryInfo?.name || sessionData.missionName || sessionData.categoryName || 'सामान्य ज्ञान (General Knowledge)';
  const setIndex = sessionData.setIndex || 1;
  const playUrl = typeof window !== 'undefined' ? `${window.location.origin}/live/${sessionId}` : `https://quizweb.com/live/${sessionId}`;

  // Metrics
  const attemptedCount = questionHistory.filter(q => !q.isSkipped).length;
  const correctCount = questionHistory.filter(q => q.isCorrect).length;
  const incorrectCount = questionHistory.filter(q => !q.isSkipped && !q.isCorrect).length;
  const skippedCount = questionHistory.filter(q => q.isSkipped).length;
  const accuracy = attemptedCount > 0 ? Math.round((correctCount / attemptedCount) * 100) : 0;

  // Generate QR Code on mount or url change
  useEffect(() => {
    let isMounted = true;
    QRCode.toDataURL(playUrl, {
      width: 200,
      margin: 1,
      color: {
        dark: '#1e1b4b',
        light: '#ffffff'
      }
    }).then(url => {
      if (isMounted) setQrCodeDataUrl(url);
    }).catch(err => {
      console.error('Failed to generate QR code', err);
    });

    return () => { isMounted = false; };
  }, [playUrl]);

  if (!isOpen) return null;

  // Build full questions list for report:
  // If user attempted questions, merge history with allQuestions
  const reportQuestions = (allQuestions.length > 0 ? allQuestions : questionHistory.map(h => ({
    text: h.questionText,
    options: h.options,
    correctAnswer: h.correctAnswer,
    explanation: h.explanation,
    difficulty: h.difficulty
  }))).map((q, idx) => {
    const historyItem = questionHistory.find(h => h.index === idx);
    const isAnswered = !!historyItem;
    const isSkipped = historyItem?.isSkipped;
    const isCorrect = historyItem?.isCorrect;
    const selectedOption = historyItem?.selectedOption;

    return {
      number: idx + 1,
      text: q.text || q.question || historyItem?.questionText || `प्रश्न #${idx + 1}`,
      options: Array.isArray(q.options) ? q.options : (historyItem?.options || []),
      correctAnswer: q.correctAnswer || historyItem?.correctAnswer,
      explanation: q.explanation || q.explanationHi || historyItem?.explanation,
      difficulty: q.difficulty || historyItem?.difficulty || 'medium',
      timeTaken: historyItem?.timeTaken,
      isAnswered,
      isSkipped,
      isCorrect,
      selectedOption
    };
  });

  const currentDateFormatted = new Date().toLocaleDateString('hi-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  // Handle PDF Export
  const handleDownloadPdf = async () => {
    if (!printDocRef.current) return;
    setIsExporting(true);
    const toastId = toast.loading('पीडीएफ तैयार हो रहा है... कृपया प्रतीक्षा करें ✨');

    try {
      const { toPng } = await import('html-to-image');
      const { jsPDF } = await import('jspdf');

      const element = printDocRef.current;
      
      // Render clean high-res snapshot
      const dataUrl = await toPng(element, {
        quality: 0.95,
        pixelRatio: 2,
        backgroundColor: '#ffffff',
        cacheBust: true
      });

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = 210; // mm
      const pageHeight = 297; // mm
      
      // Create image object to measure aspect ratio
      const img = new Image();
      img.src = dataUrl;
      await new Promise(resolve => { img.onload = resolve; });

      const imgWidth = pageWidth;
      const imgHeight = (img.height * pageWidth) / img.width;

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(dataUrl, 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position -= pageHeight;
        pdf.addPage();
        pdf.addImage(dataUrl, 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
        heightLeft -= pageHeight;
      }

      pdf.save(`QuizWeb-Report-${sessionId}.pdf`);
      toast.success('पीडीएफ सफलतापूर्वक डाउनलोड हो गया! 📄✨', { id: toastId });
    } catch (err) {
      console.error('PDF export error:', err);
      toast.error('पीडीएफ एक्सपोर्ट में त्रुटि हुई। कृपया दोबारा प्रयास करें।', { id: toastId });
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-[1000000] flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200 pointer-events-auto">
      
      {/* Modal Container */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-4xl w-full h-[90vh] flex flex-col overflow-hidden text-slate-800 animate-in zoom-in-95 duration-200">
        
        {/* Top Control Bar */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 bg-slate-50/80 shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black text-sm shadow-xs">
              📄
            </span>
            <div>
              <h3 className="font-black text-sm sm:text-base text-slate-900 leading-tight">
                लाइव क्विज़ पीडीएफ रिपोर्ट (Live Quiz PDF Report)
              </h3>
              <p className="text-[11px] text-slate-500 font-semibold">
                प्रश्नोत्तरी परिणाम, डैशबोर्ड एवं स्कैन QR कोड सारांश
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isExporting}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 shadow-sm active:scale-95 ${
                isExporting 
                  ? 'bg-slate-300 text-slate-600 cursor-not-allowed' 
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/20'
              }`}
            >
              <span>{isExporting ? '⏳' : '📥'}</span>
              <span>{isExporting ? 'डाउनलोड हो रहा है...' : 'पीडीएफ डाउनलोड (Download PDF)'}</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="hidden sm:flex items-center gap-1 px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              <span>🖨️</span>
              <span>प्रिंट</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center text-sm font-bold cursor-pointer transition-all"
              title="बंद करें (Close)"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Scrollable Printable Document Preview Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-100 custom-scrollbar flex justify-center">
          
          {/* 📄 THE ACTUAL PRINTABLE / EXPORTABLE DOCUMENT (A4 Proportionate: 794px width) */}
          <div 
            ref={printDocRef}
            id="quiz-pdf-document"
            className="w-full max-w-[794px] bg-white rounded-2xl shadow-md p-6 sm:p-8 space-y-6 text-slate-900 border border-slate-200/80 my-auto"
            style={{ minHeight: '1123px' }}
          >
            
            {/* 1. Header Banner & Branding */}
            <div className="border-b-2 border-indigo-600/90 pb-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black text-sm">
                    QW
                  </div>
                  <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                    QuizWeb लाइव मुकाबला रिपोर्ट
                  </h1>
                </div>
                <p className="text-xs text-slate-500 font-bold">
                  ऑफिशियल क्विज़ परफॉरमेंस, स्कोरकार्ड एवं उत्तर-समीक्षा रिपोर्ट
                </p>
                
                {/* Meta Details Pill Row */}
                <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] font-bold text-slate-600">
                  <span className="bg-slate-100 px-2.5 py-0.5 rounded-lg border border-slate-200/70">
                    रूम: <strong className="text-indigo-600 font-mono">#{sessionId}</strong>
                  </span>
                  <span className="bg-slate-100 px-2.5 py-0.5 rounded-lg border border-slate-200/70">
                    सेट: <strong className="text-slate-800">#{setIndex}</strong>
                  </span>
                  <span className="bg-slate-100 px-2.5 py-0.5 rounded-lg border border-slate-200/70">
                    तारीख: <strong>{currentDateFormatted}</strong>
                  </span>
                  <span className="bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-lg border border-indigo-200/80">
                    श्रेणी: <strong>{categoryName}</strong>
                  </span>
                </div>
              </div>

              {/* Scannable QR Code Box */}
              <div className="flex flex-row sm:flex-col items-center bg-indigo-50/60 p-3 rounded-2xl border border-indigo-200/80 text-center shrink-0 gap-2.5 sm:gap-1.5 self-center sm:self-auto">
                {qrCodeDataUrl ? (
                  <img 
                    src={qrCodeDataUrl} 
                    alt="Play Again QR Code" 
                    className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl border border-white shadow-xs bg-white p-1"
                  />
                ) : (
                  <div className="w-20 h-20 sm:w-24 sm:h-24 bg-white rounded-xl border border-slate-200 flex items-center justify-center text-xs text-slate-400 font-bold">
                    QR कोड
                  </div>
                )}
                <div className="text-left sm:text-center">
                  <span className="text-[10px] font-black text-indigo-800 block uppercase tracking-tight">
                    📱 स्कैन करके दोबारा खेलें
                  </span>
                  <span className="text-[8px] font-mono text-slate-500 block truncate max-w-[130px]">
                    {playUrl}
                  </span>
                </div>
              </div>

            </div>


            {/* 2. Results / Dashboard Summary Tracker */}
            <div className="bg-slate-50 rounded-2xl border border-slate-200/90 p-4 sm:p-5 space-y-3.5">
              <div className="flex items-center justify-between border-b border-slate-200/80 pb-2.5">
                <span className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <span>📊</span>
                  <span>लाइव परिणाम एवं ट्रैकर (Performance Tracker)</span>
                </span>
                <span className="text-xs font-black bg-indigo-600 text-white px-3 py-1 rounded-xl shadow-2xs">
                  स्कोर: {score} अंक • सटीकता: {accuracy}%
                </span>
              </div>

              {/* 4 Summary Metric Tiles */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                
                <div className="bg-white p-3 rounded-xl border border-slate-200 text-center">
                  <span className="text-[10px] font-bold text-slate-500 block uppercase">कुल प्रश्न</span>
                  <span className="text-xl font-black text-slate-900 leading-tight block mt-0.5">
                    {totalQuestions}
                  </span>
                  <span className="text-[9px] font-bold text-slate-400">प्रयास: {attemptedCount}</span>
                </div>

                <div className="bg-emerald-50/80 p-3 rounded-xl border border-emerald-200 text-center">
                  <span className="text-[10px] font-bold text-emerald-800 block uppercase">✓ सही उत्तर</span>
                  <span className="text-xl font-black text-emerald-600 leading-tight block mt-0.5">
                    {correctCount}
                  </span>
                  <span className="text-[9px] font-bold text-emerald-700/80">+{correctCount} अंक</span>
                </div>

                <div className="bg-rose-50/80 p-3 rounded-xl border border-rose-200 text-center">
                  <span className="text-[10px] font-bold text-rose-800 block uppercase">✗ गलत उत्तर</span>
                  <span className="text-xl font-black text-rose-600 leading-tight block mt-0.5">
                    {incorrectCount}
                  </span>
                  <span className="text-[9px] font-bold text-rose-700/80">0 अंक</span>
                </div>

                <div className="bg-amber-50/80 p-3 rounded-xl border border-amber-200 text-center">
                  <span className="text-[10px] font-bold text-amber-800 block uppercase">⏳ छोड़े गए</span>
                  <span className="text-xl font-black text-amber-600 leading-tight block mt-0.5">
                    {skippedCount}
                  </span>
                  <span className="text-[9px] font-bold text-amber-700/80">समय समाप्त</span>
                </div>

              </div>
            </div>


            {/* 3. Detailed Questions Review List */}
            <div className="space-y-4 pt-1">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <h2 className="text-xs sm:text-sm font-black text-slate-900 flex items-center gap-1.5">
                  <span>📝</span>
                  <span>प्रश्नोत्तरी एवं उत्तर विवरण (Questions & Answers Breakdown)</span>
                </h2>
                <span className="text-xs font-bold text-slate-500">
                  कुल {reportQuestions.length} प्रश्न
                </span>
              </div>

              {/* List of Questions */}
              <div className="space-y-3.5">
                {reportQuestions.map((q) => (
                  <div 
                    key={q.number}
                    className={`rounded-2xl p-4 border transition-all ${
                      q.isCorrect 
                        ? 'bg-emerald-50/20 border-emerald-200/90' 
                        : q.isSkipped 
                        ? 'bg-amber-50/20 border-amber-200/90' 
                        : q.isAnswered 
                        ? 'bg-rose-50/20 border-rose-200/90' 
                        : 'bg-slate-50/40 border-slate-200'
                    }`}
                  >
                    {/* Top Question Row */}
                    <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black bg-white px-2.5 py-0.5 rounded-lg border border-slate-200 text-slate-800 shadow-2xs">
                          प्रश्न {q.number}
                        </span>

                        {/* Status Badge */}
                        {q.isCorrect ? (
                          <span className="text-[10px] font-black bg-emerald-500 text-white px-2 py-0.5 rounded-md shadow-2xs">
                            ✓ सही उत्तर (+1 अंक)
                          </span>
                        ) : q.isSkipped ? (
                          <span className="text-[10px] font-black bg-amber-500 text-slate-950 px-2 py-0.5 rounded-md shadow-2xs">
                            ⏳ समय समाप्त / छोड़ा गया
                          </span>
                        ) : q.isAnswered ? (
                          <span className="text-[10px] font-black bg-rose-500 text-white px-2 py-0.5 rounded-md shadow-2xs">
                            ✗ गलत उत्तर (0 अंक)
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold bg-slate-200 text-slate-600 px-2 py-0.5 rounded-md">
                            उत्तर लंबित (Pending)
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-bold">
                        {q.timeTaken && <span>⏱️ {q.timeTaken}s</span>}
                        <span>•</span>
                        <span>{q.difficulty === 'hard' ? 'कठिन' : q.difficulty === 'medium' ? 'मध्यम' : 'सरल'}</span>
                      </div>
                    </div>

                    {/* Question Content */}
                    <p className="text-xs sm:text-sm font-bold text-slate-900 leading-snug mb-3">
                      {q.text}
                    </p>

                    {/* Options Grid (A, B, C, D) */}
                    {Array.isArray(q.options) && q.options.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px] mb-3">
                        {q.options.map((opt, optIdx) => {
                          const letter = String.fromCharCode(65 + optIdx);
                          const isCorrectOpt = opt === q.correctAnswer;
                          const isSelectedOpt = opt === q.selectedOption;

                          let optStyle = "bg-white border-slate-200 text-slate-700";
                          if (isCorrectOpt) {
                            optStyle = "bg-emerald-50 border-emerald-400 text-emerald-950 font-bold";
                          } else if (isSelectedOpt && !q.isCorrect) {
                            optStyle = "bg-rose-50 border-rose-400 text-rose-950 font-bold";
                          }

                          return (
                            <div 
                              key={optIdx}
                              className={`p-2 rounded-xl border flex items-center justify-between gap-2 ${optStyle}`}
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 font-black flex items-center justify-center text-[10px] shrink-0">
                                  {letter}
                                </span>
                                <span className="truncate">{opt}</span>
                              </div>
                              {isCorrectOpt && <span className="text-emerald-600 font-black text-xs shrink-0">✓</span>}
                              {isSelectedOpt && !isCorrectOpt && <span className="text-rose-600 font-black text-xs shrink-0">✗</span>}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Answer Comparison Summary */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                      <div className={`p-2.5 rounded-xl border ${
                        q.isCorrect 
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-950' 
                          : q.isSkipped 
                          ? 'bg-amber-50 border-amber-300 text-amber-950' 
                          : 'bg-rose-50 border-rose-300 text-rose-950'
                      }`}>
                        <span className="text-[10px] font-bold block uppercase opacity-75">आपका उत्तर:</span>
                        <span className="font-bold block mt-0.5">
                          {q.isSkipped ? 'समय समाप्त (छोड़ा गया)' : (q.selectedOption || 'उत्तर नहीं दिया')}
                        </span>
                      </div>

                      {(!q.isCorrect || q.isSkipped) && (
                        <div className="p-2.5 rounded-xl border bg-emerald-50 border-emerald-300 text-emerald-950">
                          <span className="text-[10px] font-bold block uppercase text-emerald-700">सही उत्तर:</span>
                          <span className="font-black text-emerald-950 block mt-0.5">
                            {q.correctAnswer}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Explanation */}
                    {q.explanation && (
                      <div className="mt-2.5 p-2.5 bg-indigo-50/70 border border-indigo-200/80 rounded-xl text-[11px] text-indigo-950 leading-relaxed">
                        <span className="font-bold text-indigo-800 block mb-0.5">💡 व्याख्या (Explanation):</span>
                        <span>{q.explanation}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>


            {/* 4. Footer */}
            <div className="border-t-2 border-slate-200 pt-4 flex flex-col sm:flex-row items-center justify-between text-[10px] font-bold text-slate-400 gap-2">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>QuizWeb Live Quiz Arena • सभी अधिकार सुरक्षित</span>
              </div>
              <div className="text-center sm:text-right">
                <span>लिंक: {playUrl}</span>
              </div>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
