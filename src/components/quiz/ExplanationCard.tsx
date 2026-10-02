"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, RotateCcw, RotateCw, Volume2, VolumeX, Shuffle, X, ArrowRight } from "lucide-react";
import { MascotProfile, getMascotForCategory, speakWithMascot, stopMascotSpeech } from "@/config/mascots";
import MascotPlayer, { MascotState } from "./MascotPlayer";

export interface ExplanationCardProps {
  question: any;
  userAnswerIndex: number | null | undefined;
  onNextQuestion: () => void;
  onClose?: () => void;
  categoryOrSlug?: any;
  tier?: string;
  isHindi?: boolean;
}

export default function ExplanationCard({
  question,
  userAnswerIndex,
  onNextQuestion,
  onClose,
  categoryOrSlug,
  tier,
  isHindi = true,
}: ExplanationCardProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const progressTimerRef = useRef<NodeJS.Timeout | null>(null);

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

  // Step 2 & Step 5 State Logic:
  // - Initial reaction on open: 'correct' or 'wrong'
  // - While speech is active: 'talking'
  // - When speech ends or pauses: 'idle'
  // - If speech is muted / fails: holds reaction then transitions to 'idle'
  const [mascotState, setMascotState] = useState<MascotState>(
    isCorrect ? "correct" : "wrong"
  );

  useEffect(() => {
    setMascotState(isCorrect ? "correct" : "wrong");
  }, [question?.id, isCorrect]);

  // Clean explanation text in active language (strictly NEVER shows English when UI is Hindi)
  const explanationText = useMemo(() => {
    if (!question) return "";

    let correctText = "";
    if (isHindi && question.optionsHi && question.correctAnswerIndex !== undefined && question.optionsHi[question.correctAnswerIndex]) {
      correctText = String(question.optionsHi[question.correctAnswerIndex]).trim();
    } else if (question.correctAnswer) {
      correctText = String(question.correctAnswer).trim();
    } else if (question.options && question.correctAnswerIndex !== undefined && question.options[question.correctAnswerIndex]) {
      correctText = String(question.options[question.correctAnswerIndex]).trim();
    }

    if (isHindi) {
      // 1. Check dedicated Hindi explanation fields
      const hiExp = question.explanationHi || question.explanation_hi;
      if (hiExp && typeof hiExp === "string" && hiExp.trim()) {
        return hiExp.trim();
      }
      // 2. Check general explanation field ONLY if it contains Devanagari (Hindi) script
      if (
        question.explanation &&
        typeof question.explanation === "string" &&
        /[\u0900-\u097F]/.test(question.explanation)
      ) {
        return question.explanation.trim();
      }
      // 3. Fallback: Clean Hindi template (NEVER show English explanation when UI is Hindi)
      return correctText
        ? `इस प्रश्न का सही उत्तर "${correctText}" है।`
        : "इस प्रश्न का सही उत्तर ऊपर दिया गया विकल्प है।";
    } else {
      // English mode
      const enExp = question.explanation || question.explanationEn || question.explanation_en;
      if (enExp && typeof enExp === "string" && enExp.trim()) {
        return enExp.trim();
      }
      return correctText
        ? `The correct answer is "${correctText}".`
        : "The correct answer is indicated in the options above.";
    }
  }, [question, isHindi]);

  // Full speech text combining peaceful host dialogue + explanation
  const fullSpeechText = useMemo(() => {
    if (isHindi) {
      if (isCorrect) {
        return `${mascot.dialogues.celebrating} ${mascot.dialogues.clapping}। ${explanationText}`;
      }
      return `${mascot.dialogues.disappointed}। ${explanationText}`;
    }
    // English mode
    if (isCorrect) {
      return `Well done! Correct answer. ${explanationText}`;
    }
    return `Don't worry! Let's review the explanation. ${explanationText}`;
  }, [isCorrect, isHindi, mascot, explanationText]);

  // Cleanup speech on unmount or question change
  useEffect(() => {
    return () => {
      stopMascotSpeech();
      setIsPlaying(false);
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    };
  }, [question?.id]);

  // Progress bar animation while speaking
  useEffect(() => {
    if (isPlaying) {
      setProgress(0);
      const estDurationMs = Math.max(5000, fullSpeechText.length * 85);
      const interval = 80;
      const step = (interval / estDurationMs) * 100;

      progressTimerRef.current = setInterval(() => {
        setProgress((prev) => (prev >= 98 ? 98 : prev + step));
      }, interval);
    } else {
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
      setProgress((prev) => (prev > 90 ? 100 : prev));
    }

    return () => {
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    };
  }, [isPlaying, fullSpeechText]);

  // Function to start speech audio with mascot lip/expression synchronization
  const startSpeech = useCallback(() => {
    if (isMuted) {
      setIsPlaying(false);
      return;
    }

    stopMascotSpeech();

    const success = speakWithMascot(
      fullSpeechText,
      mascot.ttsRate,
      mascot.ttsPitch,
      () => {
        setIsPlaying(true);
        // Do NOT interrupt the initial 'correct' or 'celebrate' clapping reaction!
        // Allow the reaction video/animation to finish, and onStateComplete will smoothly
        // transition to 'talking' because isPlaying is true.
        setMascotState((current) => {
          if (current === "correct" || current === "celebrate" || current === "wrong") {
            return current;
          }
          return "talking";
        });
      },
      () => {
        setIsPlaying(false);
        setProgress(100);
        setMascotState("idle");
      },
      isHindi ? "hi-IN" : "en-IN"
    );

    // If speech is not supported, blocked, or failed: do NOT crash, show explanation silently,
    // mascot stays in its reaction state (correct/wrong) then transitions to idle.
    if (!success) {
      setIsPlaying(false);
      setTimeout(() => {
        setMascotState("idle");
      }, 2400);
    }
  }, [isMuted, fullSpeechText, mascot.ttsRate, mascot.ttsPitch, isHindi]);

  // AUTOPLAY: Automatically speak the dialogue & explanation when popup opens
  useEffect(() => {
    const autoPlayTimer = setTimeout(() => {
      startSpeech();
    }, 300);

    return () => clearTimeout(autoPlayTimer);
  }, [question?.id, startSpeech]);

  // Audio Controls Handlers:
  // 1. Play / Pause (pauses both speech AND mascot animation)
  const handleTogglePlay = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (isPlaying) {
      stopMascotSpeech();
      setIsPlaying(false);
      setMascotState("idle");
    } else {
      if (isMuted) {
        setIsMuted(false);
      }
      startSpeech();
    }
  };

  // 2. Rewind 10s / Replay from start
  const handleRewind10 = (e: React.MouseEvent) => {
    e.stopPropagation();
    stopMascotSpeech();
    setIsPlaying(false);
    setProgress(0);
    setTimeout(() => {
      startSpeech();
    }, 80);
  };

  // 3. Shuffle / Replay
  const handleShuffle = (e: React.MouseEvent) => {
    e.stopPropagation();
    stopMascotSpeech();
    setIsPlaying(false);
    setProgress(0);
    setTimeout(() => {
      startSpeech();
    }, 80);
  };

  // 4. Forward 30s: if playing, finishes audio and rests mascot; if finished, advances to next question
  const handleForward30 = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isPlaying) {
      stopMascotSpeech();
      setIsPlaying(false);
      setProgress(100);
      setMascotState("idle");
    } else {
      handleNext();
    }
  };

  // 5. Volume / Mute toggle: Mute stops speech and keeps mascot visible in idle state
  const handleMuteToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isMuted) {
      stopMascotSpeech();
      setIsMuted(true);
      setIsPlaying(false);
      setMascotState("idle");
    } else {
      setIsMuted(false);
      startSpeech();
    }
  };

  const handleNext = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    stopMascotSpeech();
    setIsPlaying(false);
    if (onNextQuestion) onNextQuestion();
  };

  const handleDismiss = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    stopMascotSpeech();
    setIsPlaying(false);
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

        {/* Top Header Row: Status tag & Controls */}
        <div className="flex items-center justify-between px-3.5 sm:px-5 pt-1.5 pb-2">
          {/* Status pill tag (Clean, no character name in dialogue) */}
          <div className="flex items-center gap-2">
            <span className="px-2.5 sm:px-3 py-1 rounded-full text-[11px] sm:text-xs font-black uppercase tracking-wider bg-emerald-100/90 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 shadow-2xs">
              {isCorrect ? "✅ शाबाश! सही उत्तर" : "💡 समझें और सीखें"}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Next Question Pill Button */}
            <button
              type="button"
              onClick={handleNext}
              className="px-3 sm:px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-[11px] sm:text-xs font-black flex items-center gap-1 shadow-md shadow-indigo-500/20 transition-all cursor-pointer"
            >
              <span>{isHindi ? "अगला प्रश्न" : "Next"}</span>
              <ArrowRight size={13} />
            </button>

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
          Main Mint-Green Explanation Card:
          Layout:
          - Mascot on the LEFT (fixed at one place, smooth peaceful expression crossfades, head popping out slightly within card)
          - Explanation on the RIGHT (speech box with Lightbulb and Hindi text, NO mascot name in dialogue!)
        */}
        <div className="px-3 sm:px-4 pb-3">
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
              Fixed Mascot Character housed cleanly inside its frame without overflowing into badges or buttons!
            */}
            <div className="relative shrink-0 w-[110px] sm:w-[135px] h-[165px] sm:h-[190px] flex items-end justify-center rounded-2xl overflow-hidden">
              {/* Soft organic curved backdrop shape */}
              <div className="absolute inset-x-0 bottom-0 top-2 rounded-2xl bg-[#CEEBDD]/70 dark:bg-emerald-900/30" />

              {/* The Contained Mascot Character */}
              <div
                className="relative z-20 w-full h-full select-none cursor-pointer flex items-end justify-center rounded-2xl overflow-hidden"
                onClick={handleTogglePlay}
                title={`${mascot.name} - ${isPlaying ? "Tap to pause speech" : "Tap to hear explanation"}`}
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
                      if (isPlaying) {
                        setMascotState("talking");
                      } else {
                        setMascotState("idle");
                      }
                    }
                  }}
                />
              </div>
            </div>

            {/* 
              RIGHT COLUMN:
              Speech Card with Lightbulb 💡 and Hindi Explanation Text.
              (Character/mascot name REMOVED from the dialogue as requested!)
            */}
            <div className="flex-1 z-20 min-w-0">
              <div className="relative bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm rounded-2xl p-2.5 sm:p-4 shadow-sm border border-slate-200/80 dark:border-slate-800">
                {/* Speech tail pointing towards mascot on the left */}
                <div className="absolute -left-2 top-8 w-0 h-0 border-y-6 border-y-transparent border-r-8 border-r-white dark:border-r-slate-900" />

                {/* Header inside speech box: Lightbulb + स्पष्टीकरण: (NO mascot name!) */}
                <div className="flex items-center justify-between gap-1.5 mb-1.5 sm:mb-2">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <span className="text-lg sm:text-xl">💡</span>
                    <span className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-800 dark:text-slate-100">
                      {isHindi ? "स्पष्टीकरण:" : "Explanation:"}
                    </span>
                  </div>

                  {/* Equalizer Soundwave Bars when active */}
                  {isPlaying && (
                    <div className="flex items-end gap-0.5 h-3.5">
                      <span className="w-1 bg-orange-500 rounded-full animate-[pulse_0.5s_ease-in-out_infinite] h-2" />
                      <span className="w-1 bg-amber-500 rounded-full animate-[pulse_0.35s_ease-in-out_infinite] h-3.5" />
                      <span className="w-1 bg-rose-500 rounded-full animate-[pulse_0.45s_ease-in-out_infinite] h-2.5" />
                      <span className="w-1 bg-orange-500 rounded-full animate-[pulse_0.6s_ease-in-out_infinite] h-3" />
                    </div>
                  )}
                </div>

                {/* Explanation Hindi Text */}
                <p className="text-xs sm:text-sm font-medium leading-relaxed text-slate-800 dark:text-slate-100 m-0 max-h-[110px] sm:max-h-[135px] overflow-y-auto no-scrollbar">
                  {explanationText}
                </p>
              </div>
            </div>

          </div>
        </div>

        {/* 
          BOTTOM AUDIO PLAYER BAR:
          Exact reproduction of the reference video screenshot with:
          - Scrubber / Progress slider with orange thumb
          - Left: Shuffle
          - Rewind 10s
          - Center: Prominent Play/Pause button with vivid orange-magenta gradient ring
            (Shows PAUSE || while autoplaying as seen in Screenshot 4!)
          - Forward 30s
          - Right: Volume Mute/Unmute
        */}
        <div className="px-3.5 sm:px-5 pt-1 pb-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800/80">
          {/* Progress Timeline Scrubber Line */}
          <div
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const clickX = e.clientX - rect.left;
              const newProgress = Math.max(0, Math.min(100, (clickX / rect.width) * 100));
              setProgress(newProgress);
              handleTogglePlay();
            }}
            className="relative w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full mb-3 cursor-pointer overflow-visible"
          >
            {/* Active progress fill */}
            <div
              className="h-full bg-gradient-to-r from-orange-500 to-amber-500 rounded-full relative transition-all duration-150"
              style={{ width: `${progress}%` }}
            >
              {/* Orange circular thumb */}
              <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-3.5 h-3.5 rounded-full bg-orange-500 border-2 border-white shadow-md cursor-grab" />
            </div>
          </div>

          {/* Media Player Controls Row */}
          <div className="flex items-center justify-between px-2">
            {/* Shuffle / Replay */}
            <button
              type="button"
              onClick={handleShuffle}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
              title="Replay explanation"
            >
              <Shuffle size={17} />
            </button>

            {/* Rewind 10s */}
            <button
              type="button"
              onClick={handleRewind10}
              className="flex items-center justify-center p-2 text-slate-600 dark:text-slate-300 hover:text-indigo-600 transition-colors active:scale-90 cursor-pointer"
              title="Rewind / Replay (10s)"
            >
              <span className="relative flex items-center justify-center">
                <RotateCcw size={19} />
                <span className="absolute text-[8px] font-black -bottom-0.5">10</span>
              </span>
            </button>

            {/* 
              CENTER BIG PLAY/PAUSE BUTTON:
              Prominent button with vivid orange-magenta-purple gradient ring.
              Shows PAUSE (||) when speech is active, PLAY (▶) when paused.
            */}
            <button
              type="button"
              onClick={handleTogglePlay}
              className="relative p-1 rounded-full group active:scale-95 transition-transform cursor-pointer"
              style={{
                background: "linear-gradient(135deg, #F97316 0%, #D946EF 50%, #6366F1 100%)",
                boxShadow: isPlaying
                  ? "0 0 20px rgba(249, 115, 22, 0.45)"
                  : "0 4px 14px rgba(249, 115, 22, 0.3)",
              }}
              title={isPlaying ? "Pause Hindi TTS" : "Play Hindi TTS Explanation"}
            >
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-white dark:bg-slate-900 flex items-center justify-center transition-colors">
                {isPlaying ? (
                  <Pause size={20} className="text-orange-500 fill-orange-500" />
                ) : (
                  <Play size={20} className="text-orange-500 fill-orange-500 translate-x-0.5" />
                )}
              </div>
            </button>

            {/* Forward 30s / Skip to Next */}
            <button
              type="button"
              onClick={handleForward30}
              className="flex items-center justify-center p-2 text-slate-600 dark:text-slate-300 hover:text-indigo-600 transition-colors active:scale-90 cursor-pointer"
              title={isPlaying ? "Skip speech to end" : "Next Question (+30s)"}
            >
              <span className="relative flex items-center justify-center">
                <RotateCw size={19} />
                <span className="absolute text-[8px] font-black -bottom-0.5">30</span>
              </span>
            </button>

            {/* Volume / Mute Toggle */}
            <button
              type="button"
              onClick={handleMuteToggle}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
              title={isMuted ? "Unmute Speech" : "Mute Speech"}
            >
              {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} className={isPlaying ? "text-orange-500" : ""} />}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
