"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, CheckCircle2, XCircle, Lightbulb } from "lucide-react";

export default function ReadingCard({
  question,
  index,
  isHindi = false,
  subjectName = "",
  forceReveal = false,
}) {
  const [isRevealed, setIsRevealed] = useState(forceReveal);
  const [selectedOpt, setSelectedOpt] = useState(null);

  React.useEffect(() => {
    setIsRevealed(forceReveal);
  }, [forceReveal]);

  if (!question) return null;

  // Determine language text
  const qText = isHindi && question.textHi ? question.textHi : question.text;
  
  // Normalize options array
  let opts = [];
  if (Array.isArray(question.options)) {
    opts = question.options;
  } else if (typeof question.options === "string") {
    try {
      opts = JSON.parse(question.options);
    } catch {
      opts = [];
    }
  }

  if (isHindi && question.optionsHi) {
    let optsHi = [];
    if (Array.isArray(question.optionsHi)) {
      optsHi = question.optionsHi;
    } else if (typeof question.optionsHi === "string") {
      try {
        optsHi = JSON.parse(question.optionsHi);
      } catch {
        optsHi = [];
      }
    }
    if (optsHi.length === opts.length && optsHi.length > 0) {
      opts = optsHi;
    }
  }

  // Deterministic shuffle to avoid hydration mismatch and predictable answers
  const finalOpts = React.useMemo(() => {
    if (!opts || opts.length === 0) return [];
    const hashString = (str) => {
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        hash = Math.imul(31, hash) + str.charCodeAt(i) | 0;
      }
      return hash;
    };
    let seed = hashString((question.text || "quiz") + (question.id || ""));
    const random = () => {
      const x = Math.sin(seed++) * 10000;
      return x - Math.floor(x);
    };
    
    const result = [...opts];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }, [opts, question.text, question.id]);

  // Find correct answer index based on ORIGINAL opts, then map to shuffled finalOpts
  let correctIndex = -1;
  const rawCorrect = question.correctAnswer;
  
  let correctText = null;
  if (typeof rawCorrect === "number") {
    if (rawCorrect >= 0 && rawCorrect < opts.length) {
      correctText = opts[rawCorrect];
    }
  } else if (typeof rawCorrect === "string") {
    if (!isNaN(parseInt(rawCorrect)) && parseInt(rawCorrect) >= 0 && parseInt(rawCorrect) < opts.length) {
      correctText = opts[parseInt(rawCorrect)];
    } else {
      correctText = rawCorrect;
    }
  }

  if (correctText !== null) {
    correctIndex = finalOpts.findIndex(
      (o) => String(o).trim().toLowerCase() === String(correctText).trim().toLowerCase()
    );
  }

  const explanationText =
    isHindi && question.explanationHi ? question.explanationHi : question.explanation;

  return (
    <div className="bg-white dark:bg-slate-900/90 rounded-2xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-all duration-200">
      {/* Card Header: Badge Index & Subject context */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <span className="bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 text-xs font-black px-3 py-1 rounded-lg border border-indigo-200/60 dark:border-indigo-800">
            #{index + 1}
          </span>
          {subjectName && (
            <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 truncate max-w-[200px]">
              {subjectName}
            </span>
          )}
        </div>

        {/* Reveal Answer Button */}
        <button
          type="button"
          onClick={() => setIsRevealed(!isRevealed)}
          className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all ${
            isRevealed
              ? "bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-300/60 dark:border-emerald-800"
              : "bg-indigo-50 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 border border-indigo-100 dark:border-slate-700"
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
              <span>{isHindi ? "उत्तर देखें" : "Reveal Answer"}</span>
            </>
          )}
        </button>
      </div>

      {/* Question Text */}
      <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 leading-relaxed mb-5">
        {qText}
      </h3>

      {/* 4 Options (Vertical Layout) */}
      <div className="space-y-2.5 mb-4">
        {finalOpts.map((option, optIdx) => {
          const isCorrect = isRevealed && optIdx === correctIndex;
          const isSelectedWrong = isRevealed && selectedOpt === optIdx && optIdx !== correctIndex;
          const optLetter = String.fromCharCode(65 + optIdx); // A, B, C, D

          let containerClasses = "bg-slate-50/70 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-100 dark:hover:bg-slate-800";
          let badgeClasses = "bg-slate-200/80 dark:bg-slate-700 text-slate-700 dark:text-slate-300";

          if (isCorrect) {
            containerClasses = "bg-emerald-50 dark:bg-emerald-950/60 border-emerald-400 dark:border-emerald-600 text-emerald-950 dark:text-emerald-100 font-bold shadow-sm";
            badgeClasses = "bg-emerald-600 text-white";
          } else if (isSelectedWrong) {
            containerClasses = "bg-rose-50 dark:bg-rose-950/60 border-rose-400 dark:border-rose-600 text-rose-950 dark:text-rose-100 font-bold shadow-sm";
            badgeClasses = "bg-rose-600 text-white";
          }

          return (
            <button
              key={optIdx}
              onClick={() => {
                if (!isRevealed) {
                  setSelectedOpt(optIdx);
                  setIsRevealed(true);
                }
              }}
              className={`w-full p-3.5 rounded-xl border transition-all flex items-center justify-between text-sm sm:text-base text-left ${containerClasses}`}
              disabled={isRevealed && selectedOpt !== null}
            >
              <div className="flex items-center gap-3">
                <span
                  className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black flex-shrink-0 transition-colors ${badgeClasses}`}
                >
                  {optLetter}
                </span>
                <span>{option}</span>
              </div>

              {isCorrect && (
                <span className="flex items-center gap-1 text-xs font-black text-emerald-600 dark:text-emerald-400 bg-emerald-100/80 dark:bg-emerald-900/60 px-2.5 py-1 rounded-lg">
                  <CheckCircle2 size={14} /> {isHindi ? "सही" : "Correct"}
                </span>
              )}

              {isSelectedWrong && (
                <span className="flex items-center gap-1 text-xs font-black text-rose-600 dark:text-rose-400 bg-rose-100/80 dark:bg-rose-900/60 px-2.5 py-1 rounded-lg">
                  <XCircle size={14} /> {isHindi ? "गलत" : "Wrong"}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Answer & Explanation Box (Shown when Revealed) */}
      <AnimatePresence>
        {isRevealed && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-emerald-50 via-teal-50 to-indigo-50 dark:from-emerald-950/40 dark:via-slate-900 dark:to-indigo-950/40 border border-emerald-200/80 dark:border-emerald-800/80">
              <div className="flex items-center gap-2 text-xs font-black text-emerald-700 dark:text-emerald-300 uppercase tracking-wider mb-2">
                <Lightbulb size={16} className="text-amber-500" />
                <span>{isHindi ? "सही उत्तर और व्याख्या" : "Correct Answer & Logic"}</span>
              </div>
              <p className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-1">
                {correctIndex >= 0 ? (
                  <>
                    <span className="text-emerald-600 dark:text-emerald-400">
                      Option ({String.fromCharCode(65 + correctIndex)}):
                    </span>{" "}
                    {finalOpts[correctIndex]}
                  </>
                ) : (
                  rawCorrect || "N/A"
                )}
              </p>
              {explanationText && (
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium mt-2 pt-2 border-t border-emerald-200/50 dark:border-emerald-900/50">
                  {explanationText}
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
