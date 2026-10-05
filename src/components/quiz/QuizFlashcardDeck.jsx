"use client";

import React, { useState, useMemo } from "react";
import FlashDeck from "@/components/flashcards/FlashDeck";
import {
  RotateCw,
  ArrowLeft,
  ArrowRight,
  Volume2,
  CheckCircle2,
  BookOpen,
  Play,
  RotateCcw,
  Sparkles,
  HelpCircle,
} from "lucide-react";
import toast from "react-hot-toast";

export default function QuizFlashcardDeck({
  questions = [],
  currentIndex = 0,
  onIndexChange,
  categoryTopic = "",
  language = "en",
  onSwitchToQuiz,
  onSwitchToRead,
  onFinish,
}) {
  const isHindi = language === "hi";
  const [isFlipped, setIsFlipped] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  const totalCards = questions.length;
  const currentCard = questions[currentIndex] || null;

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

  // Helper for correct answer text
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
      correctIdx = options.findIndex((opt) => String(opt).trim().toLowerCase() === String(q.correctAnswer).trim().toLowerCase());
    } else if (typeof q.answer === "string") {
      answerText = q.answer;
      correctIdx = options.findIndex((opt) => String(opt).trim().toLowerCase() === String(q.answer).trim().toLowerCase());
    } else if (typeof q.answerIndex === "number") {
      correctIdx = q.answerIndex;
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

  // Helper for difficulty badge
  const getDifficultyPill = (q) => {
    const diff = String(q?.difficulty || "medium").toLowerCase();
    if (diff === "easy" || q?.difficulty_level === 1) {
      return { label: isHindi ? "सरल" : "Easy", color: "text-emerald-700 bg-emerald-100 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300" };
    }
    if (diff === "hard" || q?.difficulty_level === 3) {
      return { label: isHindi ? "कठिन" : "Hard", color: "text-rose-700 bg-rose-100 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300" };
    }
    return { label: isHindi ? "मध्यम" : "Medium", color: "text-amber-700 bg-amber-100 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300" };
  };

  if (!questions || questions.length === 0) {
    return (
      <div className="py-12 text-center text-slate-500">
        {isHindi ? "कोई फ़्लैशकार्ड उपलब्ध नहीं हैं।" : "No flashcards available in this set."}
      </div>
    );
  }

  // Completion Screen
  if (isCompleted) {
    return (
      <div className="w-full max-w-md mx-auto my-6 p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl text-center flex flex-col items-center gap-4 animate-in fade-in zoom-in-95">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 text-white flex items-center justify-center text-3xl shadow-lg shadow-indigo-500/30">
          🎉
        </div>
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            {isHindi ? "सभी फ़्लैशकार्ड्स पूरे हुए!" : "Set Complete!"}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            {isHindi
              ? `आपने इस सेट के सभी ${totalCards} फ़्लैशकार्ड्स का पुनरीक्षण कर लिया है।`
              : `You've reviewed all ${totalCards} flashcards in this set.`}
          </p>
        </div>

        <div className="w-full flex flex-col gap-2.5 mt-2">
          {onSwitchToQuiz && (
            <button
              onClick={onSwitchToQuiz}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-md shadow-indigo-500/20 active:scale-98 transition-all"
            >
              <Play size={16} fill="currentColor" />
              <span>{isHindi ? "अब क्विज़ टेस्ट दें (Time Test)" : "Take Quiz Test Now"}</span>
            </button>
          )}

          {onSwitchToRead && (
            <button
              onClick={onSwitchToRead}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all"
            >
              <BookOpen size={16} />
              <span>{isHindi ? "रीड मोड में पूरा सेट देखें" : "Open Full Read Mode"}</span>
            </button>
          )}

          <button
            onClick={() => {
              setIsCompleted(false);
              onIndexChange?.(0);
              setIsFlipped(false);
            }}
            className="w-full py-2.5 px-4 rounded-xl text-slate-500 hover:text-slate-700 dark:text-slate-400 font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
          >
            <RotateCcw size={14} />
            <span>{isHindi ? "फ़्लैशकार्ड्स दोबारा देखें" : "Review Flashcards Again"}</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-lg mx-auto flex flex-col items-center">
      {/* FlashDeck Component with Front & Back Renderers */}
      <FlashDeck
        cards={questions}
        currentIndex={currentIndex}
        isFlipped={isFlipped}
        onFlipChange={setIsFlipped}
        onIndexChange={(nextIdx) => {
          if (nextIdx >= totalCards) {
            setIsCompleted(true);
            onFinish?.();
          } else {
            onIndexChange?.(nextIdx);
          }
        }}
        renderFront={(card, idx) => {
          const qText = getQuestionText(card);
          const diffBadge = getDifficultyPill(card);

          return (
            <div className="w-full h-full p-5 sm:p-6 flex flex-col justify-between select-none">
              {/* Top Meta Bar */}
              <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-full text-xs font-black bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/50">
                    Q{idx + 1}/{totalCards}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${diffBadge.color}`}>
                    {diffBadge.label}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={(e) => handleSpeak(e, qText)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800 transition-colors"
                  title="Speak question"
                  aria-label="Speak question"
                >
                  <Volume2 size={18} />
                </button>
              </div>

              {/* Center Question Text */}
              <div className="my-auto py-4 text-center">
                <p className="text-base sm:text-lg md:text-xl font-bold text-slate-800 dark:text-slate-100 leading-snug">
                  {qText}
                </p>
              </div>

              {/* Bottom Flip Hint */}
              <div className="text-center pt-3 border-t border-slate-100 dark:border-slate-800">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-500 dark:text-indigo-400 animate-pulse">
                  <RotateCw size={13} />
                  <span>{isHindi ? "उत्तर देखने के लिए कार्ड पर टैप करें" : "Tap card to flip & reveal answer"}</span>
                </span>
              </div>
            </div>
          );
        }}
        renderBack={(card, idx) => {
          const { answerText, correctIndex } = getCorrectAnswerInfo(card);
          const explanation = getExplanation(card);
          const options = card.options || [];

          return (
            <div className="w-full h-full p-5 sm:p-6 flex flex-col justify-between select-none bg-gradient-to-b from-emerald-50/40 via-white to-white dark:from-emerald-950/20 dark:via-slate-900 dark:to-slate-900 overflow-y-auto">
              {/* Top Answer Badge */}
              <div className="flex items-center justify-between border-b border-emerald-100 dark:border-emerald-900/40 pb-2.5">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200">
                  <CheckCircle2 size={14} className="text-emerald-600 dark:text-emerald-400" />
                  <span>{isHindi ? "सही उत्तर (Correct Answer)" : "Correct Answer"}</span>
                </span>
                <span className="text-xs font-bold text-slate-400">
                  Q{idx + 1}/{totalCards}
                </span>
              </div>

              {/* Correct Option Highlight */}
              <div className="my-3">
                <div className="p-3 sm:p-3.5 rounded-xl bg-emerald-500/10 border-2 border-emerald-500/30 text-emerald-900 dark:text-emerald-100 font-extrabold text-sm sm:text-base flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs shrink-0 font-black">
                    ✓
                  </span>
                  <span>{answerText || (isHindi ? "उत्तर देखें" : "Answer")}</span>
                </div>

                {/* Option list context */}
                {options.length > 0 && (
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {options.map((opt, oIdx) => {
                      const isCorrect = oIdx === correctIndex || opt === answerText;
                      return (
                        <span
                          key={oIdx}
                          className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${
                            isCorrect
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200 font-bold"
                              : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 opacity-60"
                          }`}
                        >
                          {String.fromCharCode(65 + oIdx)}. {opt}
                        </span>
                      );
                    })}
                  </div>
                )}

                {/* Detailed Explanation */}
                {explanation && (
                  <div className="mt-3 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-left">
                    <div className="text-[11px] font-extrabold text-indigo-600 dark:text-indigo-400 mb-0.5">
                      💡 {isHindi ? "व्याख्या / स्पष्टीकरण:" : "Explanation:"}
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-4">
                      {explanation}
                    </p>
                  </div>
                )}
              </div>

              {/* Bottom Flip Back Hint */}
              <div className="text-center pt-2 border-t border-slate-100 dark:border-slate-800">
                <span className="text-[11px] font-bold text-slate-400 flex items-center justify-center gap-1">
                  <span>👆 {isHindi ? "पलटने के लिए टैप करें | आगे बढ़ने के लिए स्वाइप करें" : "Tap card to flip back | Swipe to advance"}</span>
                </span>
              </div>
            </div>
          );
        }}
      />

      {/* External Controls: Prev, Flip, Next */}
      <div className="w-full flex items-center justify-between gap-3 mt-4 px-4 max-w-sm">
        <button
          type="button"
          onClick={() => {
            if (currentIndex > 0) {
              setIsFlipped(false);
              onIndexChange?.(currentIndex - 1);
            }
          }}
          disabled={currentIndex === 0}
          className="p-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 shadow-sm disabled:opacity-30 disabled:pointer-events-none hover:bg-slate-50 transition-all flex items-center gap-1.5 font-bold text-xs"
        >
          <ArrowLeft size={16} />
          <span>{isHindi ? "पिछला" : "Prev"}</span>
        </button>

        <button
          type="button"
          onClick={() => setIsFlipped((prev) => !prev)}
          className="flex-1 py-3 px-4 rounded-2xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/80 dark:border-indigo-800 font-extrabold text-xs sm:text-sm shadow-sm transition-all flex items-center justify-center gap-2"
        >
          <RotateCw size={15} />
          <span>{isFlipped ? (isHindi ? "प्रश्न देखें" : "Show Question") : (isHindi ? "उत्तर देखें" : "Flip Answer")}</span>
        </button>

        <button
          type="button"
          onClick={() => {
            if (currentIndex < totalCards - 1) {
              setIsFlipped(false);
              onIndexChange?.(currentIndex + 1);
            } else {
              setIsCompleted(true);
              onFinish?.();
            }
          }}
          className="p-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20 transition-all flex items-center gap-1.5 font-extrabold text-xs"
        >
          <span>{currentIndex >= totalCards - 1 ? (isHindi ? "समाप्त" : "Finish") : (isHindi ? "आगे" : "Next")}</span>
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}
