"use client";

import React, { useState, useMemo } from "react";
import {
  Eye,
  EyeOff,
  CheckCircle2,
  Volume2,
  Play,
  Layers,
  Sparkles,
  HelpCircle,
  BookOpen,
  ArrowUp,
  Search,
} from "lucide-react";
import toast from "react-hot-toast";

export default function QuizReadModeView({
  questions = [],
  categoryTopic = "",
  setIndex = 1,
  language = "en",
  onSwitchToQuiz,
  onSwitchToFlashcard,
}) {
  const isHindi = language === "hi";

  // State to track which question indices have their answer revealed
  const [revealedMap, setRevealedMap] = useState({});
  const [searchQuery, setSearchQuery] = useState("");

  // Speak question aloud using browser speech synthesis
  const handleSpeak = (e, text) => {
    e.stopPropagation();
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = isHindi ? "hi-IN" : "en-US";
      utterance.rate = 0.95;
      window.speechSynthesis.speak(utterance);
    } catch {}
  };

  // Helper for question text
  const getQuestionText = (q) => {
    if (!q) return "";
    if (isHindi) {
      return q.textHi || q.text_hi || q.text || q.question || "";
    }
    return q.text || q.question || q.textHi || "";
  };

  // Helper for correct answer info
  const getCorrectAnswerInfo = (q) => {
    if (!q) return { answerText: "", correctIndex: -1 };
    const options = q.options || [];
    let correctIdx = -1;
    let answerText = "";

    if (typeof q.correctAnswer === "number") {
      correctIdx = q.correctAnswer;
      answerText = options[correctIdx] || "";
    } else if (typeof q.correctAnswer === "string") {
      answerText = q.correctAnswer;
      correctIdx = options.findIndex(
        (opt) => String(opt).trim().toLowerCase() === String(q.correctAnswer).trim().toLowerCase()
      );
    } else if (typeof q.answer === "string") {
      answerText = q.answer;
      correctIdx = options.findIndex(
        (opt) => String(opt).trim().toLowerCase() === String(q.answer).trim().toLowerCase()
      );
    } else if (typeof q.answerIndex === "number") {
      correctIdx = q.answerIndex;
      answerText = options[correctIdx] || "";
    }

    // Fallback if index not found
    if (correctIdx === -1 && typeof q.correct_index === "number") {
      correctIdx = q.correct_index;
      answerText = options[correctIdx] || "";
    }

    return { answerText, correctIndex: correctIdx };
  };

  // Helper for explanation
  const getExplanation = (q) => {
    if (!q) return "";
    if (isHindi) {
      return q.explanationHi || q.explanation_hi || q.explanation || "";
    }
    return q.explanation || q.explanationHi || "";
  };

  // Helper for difficulty pill
  const getDifficultyPill = (q) => {
    const diff = String(q?.difficulty || "medium").toLowerCase();
    if (diff === "easy" || q?.difficulty_level === 1) {
      return {
        label: isHindi ? "सरल" : "Easy",
        cls: "text-emerald-700 bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
      };
    }
    if (diff === "hard" || q?.difficulty_level === 3) {
      return {
        label: isHindi ? "कठिन" : "Hard",
        cls: "text-rose-700 bg-rose-100 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-800",
      };
    }
    return {
      label: isHindi ? "मध्यम" : "Medium",
      cls: "text-amber-700 bg-amber-100 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800",
    };
  };

  // Toggle single answer
  const toggleAnswer = (idx) => {
    setRevealedMap((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }));
  };

  // Check if all are revealed
  const allRevealed = useMemo(() => {
    if (questions.length === 0) return false;
    return questions.every((_, idx) => !!revealedMap[idx]);
  }, [questions, revealedMap]);

  // Toggle all answers at once
  const toggleAllAnswers = () => {
    if (allRevealed) {
      setRevealedMap({});
      toast.success(isHindi ? "सभी उत्तर छिपा दिए गए" : "All answers hidden");
    } else {
      const allMap = {};
      questions.forEach((_, idx) => {
        allMap[idx] = true;
      });
      setRevealedMap(allMap);
      toast.success(isHindi ? "सभी उत्तर दिखा दिए गए" : "All answers revealed");
    }
  };

  // Filter questions by search if provided
  const filteredQuestions = useMemo(() => {
    if (!searchQuery.trim()) return questions;
    const query = searchQuery.toLowerCase().trim();
    return questions.filter((q, idx) => {
      const qText = getQuestionText(q).toLowerCase();
      const options = (q.options || []).map((o) => String(o).toLowerCase()).join(" ");
      return (
        qText.includes(query) ||
        options.includes(query) ||
        String(idx + 1) === query
      );
    });
  }, [questions, searchQuery, isHindi]);

  return (
    <div className="w-full flex flex-col gap-4 animate-in fade-in duration-300">
      {/* Top Controls Header Bar */}
      <div className="w-full bg-white/95 dark:bg-slate-900/95 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-4 sm:p-5 shadow-sm backdrop-blur-md flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20">
            <BookOpen size={20} />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-tight">
              {isHindi ? "📖 अध्ययन एवं रीड मोड" : "📖 Study & Read Mode"}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {categoryTopic} • {isHindi ? `सेट ${setIndex}` : `Set ${setIndex}`} ({questions.length} {isHindi ? "प्रश्न" : "Questions"})
            </p>
          </div>
        </div>

        {/* Action Controls: Show/Hide All & Search */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {/* Quick Search */}
          <div className="relative flex-1 sm:w-56">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isHindi ? "प्रश्न खोजें..." : "Filter questions..."}
              className="w-full pl-8 pr-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                ✕
              </button>
            )}
          </div>

          {/* Toggle All Answers Button */}
          <button
            type="button"
            onClick={toggleAllAnswers}
            className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shrink-0 border shadow-xs ${
              allRevealed
                ? "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700 hover:bg-amber-100"
                : "bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600 shadow-emerald-600/20"
            }`}
          >
            {allRevealed ? (
              <>
                <EyeOff size={14} />
                <span>{isHindi ? "सभी उत्तर छिपाएं" : "Hide All Answers"}</span>
              </>
            ) : (
              <>
                <Eye size={14} />
                <span>{isHindi ? "सभी उत्तर देखें" : "View All Answers"}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Questions List (Ek ke neeche ek) */}
      <div className="flex flex-col gap-4">
        {filteredQuestions.length === 0 ? (
          <div className="p-8 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl text-slate-500 text-sm">
            {isHindi ? "कोई प्रश्न नहीं मिला" : "No questions matched your search"}
          </div>
        ) : (
          filteredQuestions.map((q, filteredIdx) => {
            const actualIdx = questions.indexOf(q);
            const qIndex = actualIdx !== -1 ? actualIdx : filteredIdx;
            const isRevealed = !!revealedMap[qIndex];
            const qText = getQuestionText(q);
            const { answerText, correctIndex } = getCorrectAnswerInfo(q);
            const explanation = getExplanation(q);
            const diffInfo = getDifficultyPill(q);
            const options = q.options || [];

            return (
              <div
                key={q.id || qIndex}
                id={`read-q-${qIndex + 1}`}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 rounded-3xl p-5 sm:p-6 shadow-sm transition-all"
              >
                {/* Question Top Meta */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-black text-xs flex items-center justify-center border border-slate-200 dark:border-slate-700 shrink-0">
                      Q{qIndex + 1}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-lg text-[11px] font-black uppercase tracking-wider border ${diffInfo.cls}`}
                    >
                      {diffInfo.label}
                    </span>
                  </div>

                  {/* Audio Speak */}
                  <button
                    type="button"
                    onClick={(e) => handleSpeak(e, qText)}
                    className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition-colors"
                    title={isHindi ? "प्रश्न सुनें" : "Listen to question"}
                    aria-label="Listen to question"
                  >
                    <Volume2 size={15} />
                  </button>
                </div>

                {/* Question Text */}
                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-relaxed mb-4">
                  {qText}
                </h3>

                {/* Four Options (A, B, C, D) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-4">
                  {options.map((opt, optIdx) => {
                    const optText = String(opt || "").trim();
                    const isOptionCorrect =
                      isRevealed &&
                      (optIdx === correctIndex ||
                        optText.toLowerCase() === String(answerText).toLowerCase());

                    return (
                      <div
                        key={optIdx}
                        className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-2.5 ${
                          isOptionCorrect
                            ? "bg-emerald-50 dark:bg-emerald-950/60 border-2 border-emerald-500 text-emerald-950 dark:text-emerald-100 font-extrabold shadow-xs"
                            : "bg-slate-50/70 dark:bg-slate-800/50 border-slate-200/80 dark:border-slate-700/60 text-slate-700 dark:text-slate-300"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span
                            className={`w-6 h-6 rounded-lg text-xs font-black flex items-center justify-center shrink-0 border ${
                              isOptionCorrect
                                ? "bg-emerald-600 text-white border-emerald-600"
                                : "bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600"
                            }`}
                          >
                            {["A", "B", "C", "D"][optIdx] || optIdx + 1}
                          </span>
                          <span className="text-xs sm:text-sm font-semibold truncate leading-tight">
                            {optText}
                          </span>
                        </div>

                        {isOptionCorrect && (
                          <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-black text-xs shrink-0">
                            <CheckCircle2 size={16} />
                            <span className="hidden sm:inline">
                              {isHindi ? "सही उत्तर" : "Correct"}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* View Answer / उत्तर देखें Button & Explanation Area */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-3">
                  <div className="flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => toggleAnswer(qIndex)}
                      className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 border shadow-xs active:scale-95 ${
                        isRevealed
                          ? "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700"
                          : "bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600 shadow-emerald-600/20"
                      }`}
                    >
                      {isRevealed ? (
                        <>
                          <EyeOff size={14} />
                          <span>{isHindi ? "उत्तर छिपाएं" : "Hide Answer"}</span>
                        </>
                      ) : (
                        <>
                          <Eye size={14} />
                          <span>{isHindi ? "उत्तर देखें" : "View Answer"}</span>
                        </>
                      )}
                    </button>

                    {isRevealed && (
                      <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 size={14} />
                        <span>
                          {isHindi ? "सही उत्तर:" : "Correct:"} Option{" "}
                          {["A", "B", "C", "D"][correctIndex] || ""} (
                          {answerText})
                        </span>
                      </span>
                    )}
                  </div>

                  {/* Revealed Explanation Box */}
                  {isRevealed && (
                    <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 animate-in fade-in duration-200 flex flex-col gap-1.5">
                      <div className="flex items-center gap-1.5 text-xs font-black text-emerald-800 dark:text-emerald-300">
                        <Sparkles size={14} />
                        <span>{isHindi ? "विस्तृत व्याख्या (Explanation):" : "Detailed Explanation:"}</span>
                      </div>
                      <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                        {explanation || (isHindi ? "इस प्रश्न के लिए कोई अतिरिक्त व्याख्या उपलब्ध नहीं है।" : "No additional explanation available for this question.")}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Bottom CTA Box: Test Yourself Now */}
      <div className="w-full bg-gradient-to-r from-indigo-50/80 via-purple-50/80 to-pink-50/80 dark:from-slate-900 dark:via-indigo-950/30 dark:to-slate-900 border border-indigo-200/80 dark:border-indigo-900/50 rounded-3xl p-6 sm:p-7 text-center shadow-sm flex flex-col items-center gap-4 mt-2">
        <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center text-xl shadow-md shadow-indigo-600/30">
          🎯
        </div>
        <div>
          <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
            {isHindi ? "सभी प्रश्न पढ़ लिए? अब अपनी तैयारी की परीक्षा लें!" : "Finished reading? Put your knowledge to the test!"}
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-md">
            {isHindi
              ? "क्विज़ मोड में लाइव टाइमर, स्कोर और मैस्कॉट के साथ खेलें या 3D फ्लिप कार्ड्स से याद करें।"
              : "Switch to Timed Quiz mode with XP & lifelines, or practice with 3D Flip Flashcards."}
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={onSwitchToQuiz}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs sm:text-sm shadow-md shadow-indigo-600/25 flex items-center gap-2 transition-all active:scale-95"
          >
            <Play size={15} fill="currentColor" />
            <span>{isHindi ? "🎯 क्विज़ टेस्ट शुरू करें" : "Start Timed Quiz"}</span>
          </button>

          <button
            type="button"
            onClick={onSwitchToFlashcard}
            className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-black text-xs sm:text-sm shadow-md shadow-purple-600/25 flex items-center gap-2 transition-all active:scale-95"
          >
            <Layers size={15} />
            <span>{isHindi ? "🗂️ फ़्लैशकार्ड्स से याद करें" : "Practice Flashcards"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
