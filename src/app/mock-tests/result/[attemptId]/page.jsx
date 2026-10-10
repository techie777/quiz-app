"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import {
  Trophy,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Clock,
  Printer,
  RotateCcw,
  LayoutDashboard,
  Compass,
  ArrowRight,
  ShieldCheck,
  Award,
  Layers,
  ChevronDown,
} from "lucide-react";

export default function MockResultPage() {
  const { attemptId } = useParams();
  const router = useRouter();
  const { isHindi } = useLanguage();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);

  // Filter state for solution booklet: "ALL" | "CORRECT" | "INCORRECT" | "SKIPPED"
  const [filterType, setFilterType] = useState("ALL");
  const [solutionLang, setSolutionLang] = useState(isHindi ? "Hindi" : "English");

  useEffect(() => {
    async function fetchResult() {
      try {
        const res = await fetch(`/api/mock-tests/attempt/${attemptId}`);
        const data = await res.json();
        setResult(data);
      } catch (e) {
        console.error("Failed to fetch mock attempt result:", e);
      } finally {
        setLoading(false);
      }
    }
    fetchResult();
  }, [attemptId]);

  // Sectional performance calculation
  const sectionalStats = useMemo(() => {
    if (!result || !result.sections || result.sections.length === 0) return [];

    const posMark = Number(result.positiveMarking) || 1;
    const negMark = Number(result.negativeMarking) || 0.25;

    return result.sections.map((sec) => {
      const secQs = (result.questions || []).filter((q) => q.sectionId === sec.id);
      let correct = 0;
      let wrong = 0;
      let attempted = 0;

      secQs.forEach((q) => {
        if (q.userAnswer !== undefined && q.userAnswer !== null) {
          attempted++;
          if (q.userAnswer === q.correctAnswer) {
            correct++;
          } else {
            wrong++;
          }
        }
      });

      const rawScore = correct * posMark - wrong * negMark;

      return {
        id: sec.id,
        name: sec.name,
        total: secQs.length,
        attempted,
        correct,
        wrong,
        score: Math.max(0, Number(rawScore.toFixed(2))),
      };
    });
  }, [result]);

  // Filtered questions in booklet
  const filteredQuestions = useMemo(() => {
    if (!result || !result.questions) return [];
    return result.questions.filter((q) => {
      const isAttempted = q.userAnswer !== undefined && q.userAnswer !== null;
      const isCorrect = isAttempted && q.userAnswer === q.correctAnswer;
      const isWrong = isAttempted && q.userAnswer !== q.correctAnswer;
      const isSkipped = !isAttempted;

      if (filterType === "CORRECT") return isCorrect;
      if (filterType === "INCORRECT") return isWrong;
      if (filterType === "SKIPPED") return isSkipped;
      return true;
    });
  }, [result, filterType]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-center">
        <div>
          <div className="w-12 h-12 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm font-black text-slate-500 uppercase tracking-widest">
            {isHindi ? "स्कोरकार्ड तैयार किया जा रहा है..." : "Generating Scorecard & Analytics..."}
          </p>
        </div>
      </div>
    );
  }

  if (!result || result.error) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="text-6xl mb-4">⚠️</div>
        <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">
          {isHindi ? "रिज़ल्ट नहीं मिला" : "Result Not Found"}
        </h1>
        <p className="text-slate-500 mt-2 max-w-md text-sm font-medium">
          {isHindi
            ? "अनुरोधित स्कोरकार्ड प्राप्त नहीं हो सका। कृपया सुनिश्चित करें कि आप सही खाते से लॉगिन हैं।"
            : "The requested report could not be found. Please ensure you are logged in with the correct account."}
        </p>
        <Link
          href="/mock-tests"
          className="mt-8 px-8 py-3.5 bg-slate-900 text-white rounded-2xl font-bold uppercase tracking-wider hover:bg-black transition-all text-xs"
        >
          {isHindi ? "मॉक टेस्ट हब पर वापस जाएं" : "Back to Mock Tests"}
        </Link>
      </div>
    );
  }

  const accuracy =
    result.attemptedCount > 0
      ? ((result.correctCount / result.attemptedCount) * 100).toFixed(1)
      : 0;

  // SVG Circular Accuracy Ring math
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (accuracy / 100) * circumference;

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans pb-32 text-slate-900">
      {/* 🏛️ INSTITUTIONAL HEADER */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-50 print:hidden shadow-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 text-white w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center text-lg font-black italic shadow-sm">
              QW
            </div>
            <div className="h-6 w-px bg-slate-200 mx-1 hidden sm:block" />
            <div>
              <h1 className="text-xs sm:text-sm font-black text-slate-900 leading-none tracking-tight uppercase">
                {isHindi ? "राष्ट्रीय परीक्षा स्कोरकार्ड" : "National Testing Console"}
              </h1>
              <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-widest font-mono">
                {isHindi ? "रिपोर्ट आईडी" : "Report ID"}: {result.id.slice(-8).toUpperCase()}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3.5 sm:px-5 py-2 sm:py-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-[11px] font-black text-slate-700 uppercase tracking-wider transition-all active:scale-95"
            >
              <Printer size={14} />
              <span className="hidden sm:inline">{isHindi ? "प्रिंट / पीडीएफ" : "Generate PDF"}</span>
            </button>
            <Link
              href="/mock-tests"
              className="flex items-center gap-1.5 px-3.5 sm:px-5 py-2 sm:py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-[11px] font-black text-white uppercase tracking-wider transition-all shadow-sm"
            >
              <Compass size={14} />
              <span className="hidden sm:inline">{isHindi ? "सभी टेस्ट्स" : "All Tests"}</span>
            </Link>
          </div>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 md:px-6 py-6 sm:py-10">
        {/* 🃏 CANDIDATE CARD */}
        <div className="bg-white rounded-3xl sm:rounded-[2.5rem] p-6 sm:p-10 border border-slate-200 shadow-xl shadow-slate-200/50 mb-8 overflow-hidden relative">
          <div className="absolute top-0 right-0 p-8 opacity-[0.03] text-9xl pointer-events-none select-none">
            🏆
          </div>

          <div className="flex flex-col md:flex-row items-center gap-6 sm:gap-10">
            {/* Candidate Avatar Badge */}
            <div className="flex flex-col items-center gap-3">
              <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-indigo-50 border-4 border-white shadow-inner flex items-center justify-center text-5xl">
                👤
              </div>
              <div className="bg-emerald-600 px-3 py-1 rounded-full text-[10px] font-black text-white uppercase tracking-widest shadow-sm flex items-center gap-1">
                <ShieldCheck size={12} />
                <span>{isHindi ? "प्रमाणित" : "Verified"}</span>
              </div>
            </div>

            {/* Candidate & Exam Metadata */}
            <div className="flex-1 text-center md:text-left min-w-0">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-50 text-indigo-600 mb-2">
                <Award size={12} />
                <span>{result.examName}</span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-black text-slate-900 uppercase tracking-tighter leading-tight mb-2">
                {result.paperTitle}
              </h1>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-wider opacity-75">
                {isHindi ? "परीक्षा तिथि" : "Session Date"}:{" "}
                {new Date(result.completedAt || Date.now()).toLocaleDateString(undefined, {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })}
              </p>

              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5 mt-5">
                <div className="px-3 py-1.5 bg-slate-50 rounded-lg text-[10px] font-black text-slate-500 border border-slate-200">
                  {isHindi ? "श्रेणी: सरकारी मॉक टेस्ट" : "CAT: GOVT MOCK"}
                </div>
                <div className="px-3 py-1.5 bg-slate-50 rounded-lg text-[10px] font-black text-slate-500 border border-slate-200">
                  {isHindi ? "शेष समय" : "TIME LEFT"}: {(result.timeLeft / 60).toFixed(1)} {isHindi ? "मिनट" : "mins"}
                </div>
              </div>
            </div>

            {/* Circular Accuracy SVG Ring */}
            <div className="flex flex-col items-center shrink-0">
              <div className="relative w-32 h-32 flex items-center justify-center">
                <svg className="w-32 h-32 transform -rotate-90">
                  <circle
                    cx="64"
                    cy="64"
                    r={radius}
                    stroke="#e2e8f0"
                    strokeWidth="10"
                    fill="transparent"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r={radius}
                    stroke="#4f46e5"
                    strokeWidth="10"
                    fill="transparent"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-out"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-2xl font-black text-slate-900 leading-none">{accuracy}%</span>
                  <span className="text-[9px] font-black text-slate-400 uppercase mt-1">
                    {isHindi ? "सटीकता" : "Accuracy"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 📊 KPI METRICS GRID */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5 mb-8">
          <KPIBox
            title={isHindi ? "कुल प्राप्तांक" : "Total Score"}
            value={result.score.toFixed(2)}
            sub={`${isHindi ? "पूर्णांक" : "Out of"} ${result.totalMarks}`}
            color="text-indigo-600"
            badge="🏆"
          />
          <KPIBox
            title={isHindi ? "सही उत्तर" : "Correct Ans"}
            value={result.correctCount}
            sub={`${isHindi ? "प्रश्न" : "Questions"}`}
            color="text-emerald-600"
            badge="✅"
          />
          <KPIBox
            title={isHindi ? "गलत उत्तर" : "Incorrect Ans"}
            value={result.wrongCount}
            sub={`${isHindi ? "प्रश्न (-अंक)" : "Questions"}`}
            color="text-rose-600"
            badge="❌"
          />
          <KPIBox
            title={isHindi ? "कुल प्रयास" : "Attempted"}
            value={result.attemptedCount}
            sub={`${isHindi ? "कुल में से" : "Total"} ${result.totalQuestions}`}
            color="text-slate-700"
            badge="📝"
          />
        </div>

        {/* 📋 SECTIONAL TABLE (MULTI-SECTION ANALYSIS) */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden mb-8">
          <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers size={16} className="text-indigo-600" />
              <h3 className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-wider">
                {isHindi ? "खंडवार प्रदर्शन सारांश" : "Sectional Score Summary"}
              </h3>
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase italic">
              {isHindi ? "प्रोविज़नल मूल्यांकन" : "Provisional Evaluation"}
            </span>
          </div>

          <div className="overflow-x-auto p-4 sm:p-6">
            <table className="w-full text-left border-collapse min-w-[500px]">
              <thead>
                <tr className="border-b-2 border-slate-900">
                  <th className="pb-3 text-[10px] font-black text-slate-400 uppercase tracking-widest pr-4">
                    {isHindi ? "खंड / विषय" : "Section / Subject"}
                  </th>
                  <th className="pb-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center px-3">
                    {isHindi ? "सही" : "Correct"}
                  </th>
                  <th className="pb-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center px-3">
                    {isHindi ? "गलत" : "Incorrect"}
                  </th>
                  <th className="pb-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center px-3">
                    {isHindi ? "हल किए" : "Attempted"}
                  </th>
                  <th className="pb-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right pl-4">
                    {isHindi ? "प्राप्तांक" : "Score"}
                  </th>
                </tr>
              </thead>
              <tbody className="text-xs sm:text-sm font-bold text-slate-800">
                {sectionalStats.length > 0 ? (
                  sectionalStats.map((sec) => (
                    <tr key={sec.id} className="hover:bg-slate-50/50 border-b border-slate-100 transition-colors">
                      <td className="py-4 pr-4 font-black text-slate-900">{sec.name}</td>
                      <td className="py-4 px-3 text-center text-emerald-600">+{sec.correct}</td>
                      <td className="py-4 px-3 text-center text-rose-500">-{sec.wrong}</td>
                      <td className="py-4 px-3 text-center text-slate-600">
                        {sec.attempted} / {sec.total}
                      </td>
                      <td className="py-4 pl-4 text-right font-black text-indigo-600">{sec.score}</td>
                    </tr>
                  ))
                ) : (
                  <tr className="hover:bg-slate-50/50 border-b border-slate-100 transition-colors">
                    <td className="py-4 pr-4 font-black text-slate-900">{result.paperTitle}</td>
                    <td className="py-4 px-3 text-center text-emerald-600">+{result.correctCount}</td>
                    <td className="py-4 px-3 text-center text-rose-500">-{result.wrongCount}</td>
                    <td className="py-4 px-3 text-center text-slate-600">
                      {result.attemptedCount} / {result.totalQuestions}
                    </td>
                    <td className="py-4 pl-4 text-right font-black text-indigo-600">{result.score.toFixed(2)}</td>
                  </tr>
                )}
                {/* Overall Summary Row */}
                <tr className="bg-slate-50/80 font-black">
                  <td className="py-4 pr-4 uppercase text-slate-900">{isHindi ? "कुल योग" : "Total Combined"}</td>
                  <td className="py-4 px-3 text-center text-emerald-600">+{result.correctCount}</td>
                  <td className="py-4 px-3 text-center text-rose-500">-{result.wrongCount}</td>
                  <td className="py-4 px-3 text-center text-slate-900">
                    {result.attemptedCount} / {result.totalQuestions}
                  </td>
                  <td className="py-4 pl-4 text-right text-base text-indigo-700 font-black">
                    {result.score.toFixed(2)} / {result.totalMarks}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* 📚 SOLUTIONS SECTION (WITH FILTER PILLS & LANGUAGE SWITCHER) */}
        {result.showSolutions && result.questions && result.questions.length > 0 && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
              <div>
                <h3 className="text-base sm:text-lg font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                  <span>📖</span>
                  <span>{isHindi ? "डिजिटल प्रश्न व समाधान बुकलेट" : "Digital Question Booklet & Solutions"}</span>
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  {isHindi
                    ? "प्रत्येक प्रश्न का सही उत्तर और विस्तृत तार्किक व्याख्या देखें"
                    : "Review correct answers and detailed step-by-step explanations"}
                </p>
              </div>

              {/* Language Switcher for Booklet */}
              <div className="flex items-center gap-2 self-start sm:self-auto">
                <span className="text-[10px] font-black uppercase text-slate-400">
                  {isHindi ? "भाषा" : "Lang"}:
                </span>
                <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setSolutionLang("English")}
                    className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all ${
                      solutionLang === "English"
                        ? "bg-white text-indigo-600 shadow-2xs"
                        : "text-slate-600"
                    }`}
                  >
                    English
                  </button>
                  <button
                    type="button"
                    onClick={() => setSolutionLang("Hindi")}
                    className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all ${
                      solutionLang === "Hindi"
                        ? "bg-white text-indigo-600 shadow-2xs"
                        : "text-slate-600"
                    }`}
                  >
                    हिन्दी
                  </button>
                </div>
              </div>
            </div>

            {/* Filter Tabs: ALL | CORRECT | INCORRECT | SKIPPED */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 -mt-2">
              <button
                type="button"
                onClick={() => setFilterType("ALL")}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                  filterType === "ALL"
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                {isHindi ? "सभी प्रश्न" : "All"} ({result.questions.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterType("CORRECT")}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                  filterType === "CORRECT"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "bg-white border border-slate-200 text-emerald-700 hover:bg-emerald-50"
                }`}
              >
                ✅ {isHindi ? "सही" : "Correct"} ({result.correctCount})
              </button>
              <button
                type="button"
                onClick={() => setFilterType("INCORRECT")}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                  filterType === "INCORRECT"
                    ? "bg-rose-600 text-white shadow-sm"
                    : "bg-white border border-slate-200 text-rose-700 hover:bg-rose-50"
                }`}
              >
                ❌ {isHindi ? "गलत" : "Incorrect"} ({result.wrongCount})
              </button>
              <button
                type="button"
                onClick={() => setFilterType("SKIPPED")}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                  filterType === "SKIPPED"
                    ? "bg-slate-700 text-white shadow-sm"
                    : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                ⚪ {isHindi ? "अनुत्तरित" : "Skipped"} (
                {result.questions.length - result.attemptedCount})
              </button>
            </div>

            {/* Question Cards List */}
            {filteredQuestions.length === 0 ? (
              <div className="py-16 text-center rounded-3xl bg-white border border-slate-200">
                <span className="text-3xl mb-2 block">🎯</span>
                <p className="text-sm font-bold text-slate-600">
                  {isHindi ? "इस फ़िल्टर में कोई प्रश्न नहीं है।" : "No questions found under this filter."}
                </p>
              </div>
            ) : (
              filteredQuestions.map((q, idx) => {
                const isAttempted = q.userAnswer !== undefined && q.userAnswer !== null;
                const isCorrect = isAttempted && q.userAnswer === q.correctAnswer;
                const isSkipped = !isAttempted;

                const qText =
                  solutionLang === "Hindi" && q.textHi ? q.textHi : q.text;
                const optionsList =
                  solutionLang === "Hindi" && q.optionsHi && q.optionsHi.length > 0
                    ? q.optionsHi
                    : q.options || [];
                const explanationText =
                  solutionLang === "Hindi" && q.explanationHi
                    ? q.explanationHi
                    : q.explanation;

                return (
                  <div
                    key={q.id}
                    className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs hover:border-slate-300 transition-all"
                  >
                    <div className="flex items-center justify-between px-6 py-3.5 bg-slate-50/70 border-b border-slate-100">
                      <span className="text-xs font-black text-slate-700 uppercase">
                        {isHindi ? "प्रश्न" : "Question"} {idx + 1}
                      </span>
                      {isSkipped ? (
                        <span className="text-[10px] font-black text-slate-500 uppercase bg-slate-200/60 px-2.5 py-1 rounded-full">
                          {isHindi ? "अनुत्तरित (SKIPPED)" : "NOT ANSWERED"}
                        </span>
                      ) : isCorrect ? (
                        <span className="text-[10px] font-black text-emerald-700 uppercase bg-emerald-100 px-2.5 py-1 rounded-full flex items-center gap-1">
                          <CheckCircle2 size={12} />
                          <span>{isHindi ? "सही उत्तर (+ अंक)" : "CORRECT (+ MARKS)"}</span>
                        </span>
                      ) : (
                        <span className="text-[10px] font-black text-rose-700 uppercase bg-rose-100 px-2.5 py-1 rounded-full flex items-center gap-1">
                          <XCircle size={12} />
                          <span>{isHindi ? "गलत प्रयास (- अंक)" : "WRONG ATTEMPT"}</span>
                        </span>
                      )}
                    </div>

                    <div className="p-6 sm:p-8">
                      <p className="text-slate-900 font-bold text-base sm:text-lg mb-6 leading-relaxed">
                        {qText}
                      </p>

                      {/* Options Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {optionsList.map((opt, i) => {
                          const isRight = i === q.correctAnswer;
                          const isYours = i === q.userAnswer;

                          return (
                            <div
                              key={i}
                              className={`p-4 rounded-2xl border flex items-center justify-between text-xs sm:text-sm font-bold transition-all ${
                                isRight
                                  ? "bg-emerald-50 border-emerald-300 text-emerald-950"
                                  : isYours && !isCorrect
                                  ? "bg-rose-50 border-rose-300 text-rose-950"
                                  : "bg-white border-slate-200 text-slate-600 opacity-80"
                              }`}
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <span
                                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black shrink-0 ${
                                    isRight
                                      ? "bg-emerald-600 text-white"
                                      : isYours && !isCorrect
                                      ? "bg-rose-600 text-white"
                                      : "bg-slate-100 text-slate-600"
                                  }`}
                                >
                                  {String.fromCharCode(65 + i)}
                                </span>
                                <span className="truncate">{opt}</span>
                              </div>
                              <div className="shrink-0 ml-2">
                                {isRight && (
                                  <span className="text-xs font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                                    ✓ {isHindi ? "सही उत्तर" : "Correct"}
                                  </span>
                                )}
                                {isYours && !isCorrect && (
                                  <span className="text-xs font-black text-rose-700 bg-rose-100 px-2 py-0.5 rounded-md">
                                    ✗ {isHindi ? "आपका चयन" : "Your Pick"}
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Explanation Callout */}
                      {explanationText && (
                        <div className="mt-6 p-5 sm:p-6 bg-slate-900 rounded-2xl shadow-md text-slate-100">
                          <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                            <span>💡</span>
                            <span>{isHindi ? "तार्किक व्याख्या व हल" : "Logical Solution & Explanation"}:</span>
                          </p>
                          <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-medium whitespace-pre-wrap">
                            {explanationText}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* 🚀 ACTION CALLOUT FOOTER */}
        <div className="mt-14 border-t-2 border-slate-200 pt-8 flex flex-col items-center text-center">
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-6">
            {isHindi ? "स्कोरकार्ड समाप्त • अगली कार्यवाही चुनें" : "End of Provisional Report Panel"}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 w-full max-w-xl">
            {result.paperId && (
              <Link
                href={`/mock-tests/paper/${result.paperId}/instructions?mode=fresh`}
                className="flex-1 min-w-[200px] py-4 px-6 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black text-xs uppercase tracking-wider shadow-lg shadow-indigo-100 transition-all flex items-center justify-center gap-2"
              >
                <RotateCcw size={15} />
                <span>{isHindi ? "पुनः टेस्ट दें (Re-take Test)" : "Re-attempt Test"}</span>
              </Link>
            )}

            <Link
              href="/school-study/dashboard"
              className="flex-1 min-w-[200px] py-4 px-6 bg-slate-900 hover:bg-black text-white rounded-2xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2"
            >
              <LayoutDashboard size={15} />
              <span>{isHindi ? "लर्निंग डैशबोर्ड देखें" : "View Dashboard"}</span>
            </Link>

            <Link
              href="/mock-tests"
              className="w-full sm:w-auto py-4 px-6 bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 rounded-2xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2"
            >
              <Compass size={15} />
              <span>{isHindi ? "अन्य मॉक टेस्ट्स" : "All Mock Tests"}</span>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

function KPIBox({ title, value, sub, color, badge }) {
  return (
    <div className="p-5 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200 bg-white group hover:-translate-y-1 transition-all duration-300 shadow-xs hover:shadow-md">
      <div className="flex items-center justify-between mb-2">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{title}</p>
        <span className="text-base">{badge}</span>
      </div>
      <div className={`text-2xl sm:text-3xl font-black ${color} tracking-tight`}>{value}</div>
      <p className="text-[11px] font-bold text-slate-400 mt-1">{sub}</p>
    </div>
  );
}
