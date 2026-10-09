"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { X, ArrowRight } from "lucide-react";
import { MascotProfile, getMascotForCategory, stopMascotSpeech } from "@/config/mascots";
import MascotPlayer, { MascotState } from "./MascotPlayer";

export interface ExplanationCardProps {
  question: any;
  userAnswerIndex: number | null | undefined;
  onNextQuestion: () => void;
  onClose?: () => void;
  onToggleFastMode?: () => void;
  categoryOrSlug?: any;
  tier?: string;
  isHindi?: boolean;
}

export default function ExplanationCard({
  question,
  userAnswerIndex,
  onNextQuestion,
  onClose,
  onToggleFastMode,
  categoryOrSlug,
  tier,
  isHindi = true,
}: ExplanationCardProps) {
  // Check if answered correctly
  const isCorrect = useMemo(() => {
    if (!question || userAnswerIndex === null || userAnswerIndex === undefined) return false;
    const selectedOptionText = String(question.options?.[userAnswerIndex] || "").trim();
    const correctAnswerText = String(question.correctAnswer || "").trim();
    return selectedOptionText === correctAnswerText;
  }, [question, userAnswerIndex]);

  // Designated mascot host
  const mascot: MascotProfile = useMemo(() => {
    return getMascotForCategory(categoryOrSlug, tier);
  }, [categoryOrSlug, tier]);

  // Mascot reaction state:
  // Shows 'correct' or 'wrong' reaction then rests quietly in 'idle'
  const [mascotState, setMascotState] = useState<MascotState>(
    isCorrect ? "correct" : "wrong"
  );

  useEffect(() => {
    setMascotState(isCorrect ? "correct" : "wrong");
  }, [question?.id, isCorrect]);

  // Detect whether active mode is Hindi based on prop, localStorage, or Devanagari text
  const isActuallyHindi = useMemo(() => {
    if (isHindi) return true;
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("app-language");
      if (stored === "hi") return true;
    }
    if (question && /[\u0900-\u097F]/.test(question.text || question.textHi || question.question || "")) {
      return true;
    }
    return false;
  }, [isHindi, question]);

  // Clean explanation text in active language (strictly NEVER shows English when UI is Hindi)
  const explanationText = useMemo(() => {
    if (!question) return "";

    let correctText = "";
    if (isActuallyHindi && question.optionsHi && question.correctAnswerIndex !== undefined && question.optionsHi[question.correctAnswerIndex]) {
      correctText = String(question.optionsHi[question.correctAnswerIndex]).trim();
    } else if (question.correctAnswer) {
      correctText = String(question.correctAnswer).trim();
    } else if (question.options && question.correctAnswerIndex !== undefined && question.options[question.correctAnswerIndex]) {
      correctText = String(question.options[question.correctAnswerIndex]).trim();
    }

    if (isActuallyHindi) {
      // 1. Check dedicated Hindi explanation fields (all common database schema keys)
      const hiExp = question.hindiExplanation || question.explanationHi || question.explanation_hi;
      if (hiExp && typeof hiExp === "string" && hiExp.trim()) {
        return hiExp.trim();
      }
      // 2. Check general explanation field (contains Devanagari Hindi script)
      if (
        question.explanation &&
        typeof question.explanation === "string" &&
        question.explanation.trim() &&
        /[\u0900-\u097F]/.test(question.explanation)
      ) {
        return question.explanation.trim();
      }
      // 3. Check notes or solution fields
      const altExp = question.notes || question.solution;
      if (altExp && typeof altExp === "string" && altExp.trim() && /[\u0900-\u097F]/.test(altExp)) {
        return altExp.trim();
      }
      // 4. Any explanation field present if non-empty
      if (question.explanation && typeof question.explanation === "string" && question.explanation.trim()) {
        return question.explanation.trim();
      }
      // 5. Fallback: Clean Hindi template
      return correctText
        ? `इस प्रश्न का सही उत्तर "${correctText}" है।`
        : "इस प्रश्न का सही उत्तर ऊपर दिया गया विकल्प है।";
    } else {
      // English mode
      const enExp = question.englishExplanation || question.explanationEn || question.explanation_en || question.explanation;
      if (enExp && typeof enExp === "string" && enExp.trim()) {
        return enExp.trim();
      }
      return correctText
        ? `The correct answer is "${correctText}".`
        : "The correct answer is indicated in the options above.";
    }
  }, [question, isActuallyHindi]);

  // Ensure speech synthesis is completely stopped whenever opened/unmounted
  useEffect(() => {
    stopMascotSpeech();
    return () => {
      stopMascotSpeech();
    };
  }, [question?.id]);

  const handleNext = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    stopMascotSpeech();
    if (onNextQuestion) onNextQuestion();
  };

  const handleDismiss = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    stopMascotSpeech();
    if (onClose) onClose();
    else if (onNextQuestion) onNextQuestion();
  };

  if (!question) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col justify-end bg-black/40 backdrop-blur-[2px] select-none"
      onClick={handleDismiss}
    >
      {/* 
        Bottom Sheet Popup Container:
        Framer-Motion smooth slide-up entrance from the bottom.
      */}
      <motion.div
        initial={{ y: "100%", opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: "100%", opacity: 0 }}
        transition={{ type: "spring", damping: 26, stiffness: 220 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-xl mx-auto bg-white dark:bg-slate-900 rounded-t-[32px] sm:rounded-t-[38px] shadow-2xl border-t border-slate-200/80 dark:border-slate-800"
        style={{
          boxShadow: "0 -12px 48px rgba(0, 0, 0, 0.22)",
        }}
      >
        {/* Top Drag Handle */}
        <div className="w-12 h-1 rounded-full bg-slate-300 dark:bg-slate-700 mx-auto mt-2.5 mb-1" />

        {/* Top Header Row: Status tag & Close button */}
        <div className="flex items-center justify-between px-3.5 sm:px-5 pt-1.5 pb-2">
          {/* Status pill tag */}
          <div className="flex items-center gap-2">
            <span className="px-2.5 sm:px-3 py-1 rounded-full text-[11px] sm:text-xs font-black uppercase tracking-wider bg-emerald-100/90 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 shadow-2xs">
              {isCorrect
                ? (isActuallyHindi ? "✅ शाबाश! सही उत्तर" : "✅ Well Done! Correct")
                : (isActuallyHindi ? "💡 समझें और सीखें" : "💡 Learn & Understand")}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Circular Close Button */}
            <button
              type="button"
              onClick={handleDismiss}
              className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-300 flex items-center justify-center transition-colors cursor-pointer"
              title="Close"
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* 
          Main Explanation Section:
          Layout:
          - Mascot on the LEFT
          - Explanation card on the RIGHT
        */}
        <div className="px-3 sm:px-4 pb-3 sm:pb-4">
          <div className="relative rounded-2xl bg-[#E8F6F0] dark:bg-emerald-950/30 border border-[#CEEBDD] dark:border-emerald-900/40 p-2.5 sm:p-4 overflow-visible min-h-[175px] sm:min-h-[200px] flex items-center justify-between gap-2 sm:gap-3">
            
            {/* Decorative Stars / Sparkles in background */}
            <div className="absolute top-3 right-6 text-emerald-600/25 dark:text-emerald-400/20 text-lg pointer-events-none select-none">
              ★
            </div>
            <div className="absolute top-6 right-20 text-amber-500/35 text-xs pointer-events-none select-none">
              ✦
            </div>

            {/* 
              LEFT COLUMN:
              Mascot Character housed cleanly inside its frame
            */}
            <div className="relative shrink-0 w-[110px] sm:w-[135px] h-[165px] sm:h-[190px] flex items-end justify-center rounded-2xl overflow-hidden">
              {/* Soft organic curved backdrop shape */}
              <div className="absolute inset-x-0 bottom-0 top-2 rounded-2xl bg-[#CEEBDD]/70 dark:bg-emerald-900/30" />

              {/* The Contained Mascot Character */}
              <div
                className="relative z-20 w-full h-full select-none flex items-end justify-center rounded-2xl overflow-hidden"
                title={mascot.name}
              >
                <MascotPlayer
                  characterId={mascot.id}
                  state={mascotState}
                  width={125}
                  height={175}
                  isMuted={true}
                  allowAudioClick={false}
                  language={isHindi ? "hi" : "en"}
                  onStateComplete={(s) => {
                    if (s === "correct" || s === "wrong" || s === "celebrate") {
                      setMascotState("idle");
                    }
                  }}
                />
              </div>
            </div>

            {/* 
              RIGHT COLUMN:
              Speech Card with Lightbulb 💡 and Hindi Explanation Text.
            */}
            <div className="flex-1 z-20 min-w-0">
              <div className="relative bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm rounded-2xl p-2.5 sm:p-4 shadow-sm border border-slate-200/80 dark:border-slate-800">
                {/* Speech tail pointing towards mascot on the left */}
                <div className="absolute -left-2 top-8 w-0 h-0 border-y-6 border-y-transparent border-r-8 border-r-white dark:border-r-slate-900" />

                {/* Header inside speech box: Lightbulb + स्पष्टीकरण: */}
                <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                  <span className="text-lg sm:text-xl">💡</span>
                  <span className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-800 dark:text-slate-100">
                    {isActuallyHindi ? "स्पष्टीकरण:" : "Explanation:"}
                  </span>
                </div>

                {/* Explanation Text */}
                <p className="text-xs sm:text-sm font-medium leading-relaxed text-slate-800 dark:text-slate-100 m-0 max-h-[120px] sm:max-h-[150px] overflow-y-auto no-scrollbar">
                  {explanationText}
                </p>
              </div>
            </div>

          </div>
        </div>

        {/* Footer actions: Fast Mode Toggle button and Next Button */}
        <div className="flex items-center justify-between px-3.5 sm:px-5 pb-4 pt-1.5 border-t border-slate-100 dark:border-slate-800/80 gap-2">
          {onToggleFastMode ? (
            <button
              type="button"
              onClick={onToggleFastMode}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] sm:text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700 transition-all cursor-pointer active:scale-95 shadow-2xs"
              title={isActuallyHindi ? "आगे से यह पॉपअप न दिखाएं (फास्ट मोड)" : "Don't show popup again (Fast Mode)"}
            >
              <span>⚡</span>
              <span>{isActuallyHindi ? "फास्ट मोड (पॉपअप बंद)" : "Fast Mode (No Popup)"}</span>
            </button>
          ) : <div />}

          <button
            type="button"
            onClick={handleNext}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs sm:text-sm font-black flex items-center gap-1.5 shadow-md shadow-indigo-500/25 transition-all cursor-pointer ml-auto"
          >
            <span>{isActuallyHindi ? "अगला प्रश्न" : "Next Question"}</span>
            <ArrowRight size={15} />
          </button>
        </div>
      </motion.div>
    </div>
  );
}
