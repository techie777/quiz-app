"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useQuiz } from "@/context/QuizContext";
import { playCorrectSound, playWrongSound, playTapSound, playStreakSound, triggerHaptic } from "@/lib/sounds";
import { shareQuestion } from "@/lib/shareHelper";
import { toggleQuestionFavourite, isQuestionFavourited } from "@/lib/favouritesHelper";
import { Share2, Heart, X, ArrowRight } from "lucide-react";
import Image from "next/image";
import styles from "@/styles/QuizEngine.module.css";
import { getDynamicExplanation } from "@/lib/explanationGenerator";
import ExplanationCard from "@/components/quiz/ExplanationCard";
import { useTier } from "@/context/TierContext";
import confetti from "canvas-confetti";
import { MAIN_CATEGORIES } from "@/lib/mainCategoriesConfig";

export default function QuestionCardV2({
  question,
  onAnswer,
  userAnswer,
  showExplanation,
  onCloseExplanation,
  onOpenExplanation,
  onToggleFastMode,
  explanation,
  language = "en",
  disabled,
  showHint,
  removedOptions = [],
  audienceStats,
  favouriteIds,
  quizId,
  categoryName,
}) {
  const isHindi = language === 'hi' || (typeof window !== "undefined" && localStorage.getItem("app-language") === "hi") || (Boolean(question && /[\u0900-\u097F]/.test(question.text || question.textHi || question.question || "")));
  const { data: session, status } = useSession();
  const router = useRouter();
  const { soundEnabled, quizSessionId, combo } = useQuiz();
  const { tier } = useTier();
  
  const [selected, setSelected] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const [fav, setFav] = useState(false);
  const [loginPrompt, setLoginPrompt] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [shakingType, setShakingType] = useState("");
  const [zoomedImage, setZoomedImage] = useState(false);

  const isTestMode = useMemo(() => {
    if (typeof window === "undefined") return false;
    try {
      return sessionStorage.getItem("arena_session_mode") === "test";
    } catch {
      return false;
    }
  }, [quizSessionId]);

  // Smooth explanation centered display without layout shifts or screen scrolling
  useEffect(() => {
    // ScrollIntoView removed to prevent unwanted screen jump on answer selection
  }, [showExplanation]);

  const isUser = session?.user && !session.user.isAdmin;

  // Update selected & revealed when question or userAnswer changes (navigation)
  useEffect(() => {
    if (userAnswer !== undefined) {
      setSelected(userAnswer);
      if (!isTestMode) {
        setRevealed(true);
      }
    } else {
      setSelected(null);
      setRevealed(false);
    }
  }, [question?.id, userAnswer, isTestMode]);

  // Sync fav state (supports authenticated set & local guest storage)
  useEffect(() => {
    if (!question) return;
    const qId = question.id || question._id;
    if (favouriteIds && typeof favouriteIds.has === "function" && qId) {
      setFav(favouriteIds.has(qId));
    } else if (qId) {
      setFav(isQuestionFavourited(qId));
    }
  }, [favouriteIds, question]);

  // Options parsing: options are deterministically shuffled by QuizContext with the seed
  const shuffledOptions = useMemo(() => {
    if (!question) return [];
    
    // Get the display options array (fallback to English if Hindi array is empty/invalid)
    const displayOpts = (isHindi && Array.isArray(question.optionsHi) && question.optionsHi.length > 0)
      ? question.optionsHi
      : (question.options || []);
      
    // Maintain the synchronized, seeded option order from QuizContext
    return displayOpts.map((text, idx) => ({
      text: text || "",
      originalIndex: idx
    }));
  }, [question?.id, isHindi, question?.options, question?.optionsHi]);

  // Hotkey Listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (revealed || disabled) return;
      const key = e.key.toUpperCase();
      const map = { 'A': 0, 'B': 1, 'C': 2, 'D': 3 };
      const displayIdx = map[key];
      if (displayIdx !== undefined && shuffledOptions[displayIdx]) {
        handleSelect(shuffledOptions[displayIdx].originalIndex);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [revealed, disabled, question, shuffledOptions]);

  const handleFavClick = async () => {
    if (disabled || !question) return;
    await toggleQuestionFavourite({
      question,
      isAuthenticated: status === "authenticated" && isUser,
      isHindi,
      onStateChange: (newFav) => setFav(newFav),
    });
  };

  const handleShare = async () => {
    if (sharing || disabled || !question) return;
    setSharing(true);
    try {
      await shareQuestion({ question, isHindi });
    } catch {
      // Silently fail
    }
    setSharing(false);
  };

  const handleSelect = (originalIndex) => {
    if (revealed || disabled || !question) return;
    
    // Tap bubble sound and tactile vibration on selection
    if (soundEnabled) playTapSound();
    triggerHaptic(15);

    const selectedOptionText = String(question.options[originalIndex] || "").trim();
    const correctAnswerText = String(question.correctAnswer || "").trim();
    const isCorrect = selectedOptionText === correctAnswerText;
    
    setSelected(originalIndex);

    if (!isTestMode) {
      setRevealed(true);

      if (isCorrect) {
        if (soundEnabled) {
          if (combo >= 2) {
            playStreakSound(combo);
          } else {
            playCorrectSound();
          }
        }
        triggerHaptic(20);
        try {
          confetti({
            particleCount: 65,
            spread: 75,
            origin: { y: 0.65 },
            colors: ["#22C55E", "#3B82F6", "#F59E0B", "#EC4899", "#8B5CF6", "#10B981"],
            disableForReducedMotion: true,
          });
        } catch {}
      } else {
        if (soundEnabled) playWrongSound();
        triggerHaptic(35);
        setShakingType("animate-vibrate");
        setTimeout(() => setShakingType(""), 500);
      }
    }

    onAnswer(originalIndex);
  };

  if (!question) return null;

  const rawDiff = String(question?.difficulty || "medium").toLowerCase();
  const isEasy = rawDiff === "easy" || rawDiff === "1";
  const isHard = rawDiff === "hard" || rawDiff === "3";
  const isExpert = rawDiff === "expert" || rawDiff === "4";
  const diffLabel = isExpert
    ? (isHindi ? "विशेषज्ञ" : "Expert")
    : isEasy
    ? (isHindi ? "सरल" : "Easy")
    : isHard
    ? (isHindi ? "कठिन" : "Hard")
    : (isHindi ? "मध्यम" : "Medium");
  const diffBadgeStyle = isExpert
    ? "bg-[#EDE9FE] text-[#7C3AED] border-[#C4B5FD]"
    : isEasy
    ? "bg-[#DCFCE7] text-[#16A34A] border-[#86EFAC]"
    : isHard
    ? "bg-[#FEE2E2] text-[#DC2626] border-[#FCA5A5]"
    : "bg-[#FEF3C7] text-[#D97706] border-[#FDE68A]";

  // Derive category display label
  const categoryLabel = useMemo(() => {
    // 1. Direct on question object
    const rawCat = isHindi
      ? (question?.categoryNameHi || question?.categoryName || question?.topicNameHi || question?.topicName || question?.category || question?.topic || question?.subTopic)
      : (question?.categoryName || question?.topicName || question?.category || question?.topic || question?.subTopic);
    
    // Look up canonical mapping from MAIN_CATEGORIES if rawCat is a slug or id
    const candidateSlug = String(rawCat || question?.categoryId || quizId || "").toLowerCase().trim();
    if (candidateSlug) {
      const match = MAIN_CATEGORIES.find(
        (c) =>
          c.slug?.toLowerCase() === candidateSlug ||
          String(c.id) === candidateSlug ||
          (c.name && c.name.toLowerCase() === candidateSlug) ||
          (c.nameHi && c.nameHi.toLowerCase() === candidateSlug)
      );
      if (match) {
        return isHindi ? (match.nameHi || match.name) : (match.name || match.nameHi);
      }
    }
    
    if (rawCat && typeof rawCat === "string" && rawCat.trim() && !/^[0-9a-fA-F]{24}$/.test(rawCat)) {
      return rawCat.trim();
    }

    // 2. Prop categoryName if passed
    if (categoryName && typeof categoryName === "string" && categoryName.trim() && !/^[0-9a-fA-F]{24}$/.test(categoryName)) {
      const matchProp = MAIN_CATEGORIES.find(
        (c) =>
          c.slug?.toLowerCase() === categoryName.toLowerCase().trim() ||
          (c.name && c.name.toLowerCase() === categoryName.toLowerCase().trim())
      );
      if (matchProp) {
        return isHindi ? (matchProp.nameHi || matchProp.name) : (matchProp.name || matchProp.nameHi);
      }
      return categoryName.trim();
    }

    // 3. From quizId if it matches MAIN_CATEGORIES
    if (quizId && quizId !== "arena") {
      const match = MAIN_CATEGORIES.find(
        (c) => c.slug?.toLowerCase() === String(quizId).toLowerCase() || String(c.id) === String(quizId)
      );
      if (match) {
        return isHindi ? (match.nameHi || match.name) : match.name;
      }
    }

    return null;
  }, [question, isHindi, quizId, categoryName]);

  return (
    <div className={`${styles.questionSection} ${shakingType ? styles[shakingType] || shakingType : ""}`}>
      <div className={styles.questionCard}>
        {/* Top Difficulty Badge Row + Centered Category Badge + Favourite & Share Actions (Right) */}
        <div className="flex items-center justify-between w-full mb-3 gap-2">
          {/* Difficulty Badge (Left) */}
          <div className="flex items-center shrink-0">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${diffBadgeStyle}`}>
              <span className="w-1.5 h-1.5 rounded-full bg-current" />
              <span>{diffLabel}</span>
            </span>
          </div>

          {/* Centered Category Badge (in small neat font, nicely placed in center of this row) */}
          {categoryLabel ? (
            <div className="flex-1 flex justify-center px-1 min-w-0">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-semibold bg-indigo-50/90 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200/70 dark:border-indigo-800/60 truncate select-none shadow-2xs">
                <span className="text-[9px]">🏷️</span>
                <span className="truncate max-w-[130px] sm:max-w-[200px]">{categoryLabel}</span>
              </span>
            </div>
          ) : (
            <div className="flex-1" />
          )}

          {/* Favourite & Share Actions (Right, Icon-only without text) */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={handleFavClick}
              title={isHindi ? (fav ? "पसंदीदा से हटाएं" : "पसंदीदा में जोड़ें") : (fav ? "Remove from favourites" : "Add to favourites")}
              className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl border transition-all active:scale-95 flex items-center justify-center cursor-pointer ${
                fav
                  ? "bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800"
                  : "bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 border-slate-200/80 dark:border-slate-700 hover:text-rose-500 hover:border-rose-200"
              }`}
            >
              <Heart size={14} fill={fav ? "#ef4444" : "none"} color={fav ? "#ef4444" : "currentColor"} />
            </button>
            <button
              type="button"
              onClick={handleShare}
              disabled={sharing}
              title={isHindi ? "साझा करें" : "Share this question"}
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 border border-slate-200/80 dark:border-slate-700 hover:text-indigo-600 hover:border-indigo-200 active:scale-95 transition-all flex items-center justify-center cursor-pointer"
            >
              <Share2 size={14} />
            </button>
          </div>
        </div>

        <div className={styles.questionHeader}>
          {!!(isHindi ? (question.textHi || question.text) : question.text) ? (
            <p className={styles.questionText}>
              {isHindi ? (question.textHi || question.text) : question.text}
            </p>
          ) : (
            <div style={{ flex: 1 }} />
          )}
        </div>
        {/* Fixed Aspect Ratio Frame (16:10) for Question Media with Tap-to-Zoom (Phase E4) */}
        {(() => {
          const mediaObj = question.media || (question.image ? { type: "image", url: question.image, alt: question.text } : null);
          if (!mediaObj?.url) return null;

          return (
            <div className="relative w-full aspect-[16/10] max-h-[260px] rounded-2xl bg-slate-100 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700/80 overflow-hidden my-3 flex items-center justify-center group/img select-none">
              <img
                src={mediaObj.url}
                alt={mediaObj.alt || question.text || "Question visual"}
                className="w-full h-full object-contain p-2 transition-transform duration-300 group-hover/img:scale-[1.02] cursor-zoom-in"
                onClick={() => setZoomedImage(true)}
                loading="lazy"
              />
              <button
                type="button"
                onClick={() => setZoomedImage(true)}
                className="absolute bottom-2 right-2 px-2.5 py-1 rounded-lg bg-black/65 hover:bg-black/85 backdrop-blur-md text-white text-[11px] font-black uppercase tracking-wider flex items-center gap-1 shadow-md transition-all cursor-pointer"
                aria-label={isHindi ? "ज़ूम करें" : "Zoom image"}
              >
                <span>🔍</span>
                <span>{isHindi ? "ज़ूम करें" : "Zoom"}</span>
              </button>
              {mediaObj.credit && (
                <span className="absolute bottom-2 left-2 text-[9px] text-slate-500 dark:text-slate-400 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xs px-2 py-0.5 rounded shadow-2xs">
                  © {mediaObj.credit}
                </span>
              )}
            </div>
          );
        })()}
      </div>

      {/* Lightbox Fullscreen Zoom Modal (Phase E4) */}
      {zoomedImage && (() => {
        const mediaObj = question.media || (question.image ? { type: "image", url: question.image, alt: question.text } : null);
        if (!mediaObj?.url) return null;

        return (
          <div
            className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 select-none animate-in fade-in duration-200"
            onClick={() => setZoomedImage(false)}
          >
            <button
              type="button"
              onClick={() => setZoomedImage(false)}
              className="absolute top-4 right-4 p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-lg transition-colors cursor-pointer"
              aria-label="Close zoom"
            >
              <X size={22} />
            </button>
            <img
              src={mediaObj.url}
              alt={mediaObj.alt || "Question zoomed image"}
              className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        );
      })()}

      {loginPrompt && (
        <div className={styles.loginPrompt}>
          <p>{isHindi ? "पसंदीदा में जोड़ने के लिए कृपया लॉगिन करें।" : "Sign in to save favourites"}</p>
          <div className={styles.loginPromptBtns}>
            <button onClick={() => router.push("/login")} className="btn-primary">
              {isHindi ? "लॉगिन" : "Sign In"}
            </button>
            <button onClick={() => setLoginPrompt(false)} className="btn-secondary">
              {isHindi ? "रद्द करें" : "Dismiss"}
            </button>
          </div>
        </div>
      )}

      {showHint && (
        <div className={styles.hintBox}>
          <div className={styles.hintHeader}>
            <span>💡 Hint</span>
            <span className={styles.hintPenalty}>-5 points</span>
          </div>
          <p className={styles.hintText}>
            {question.hint || "Think carefully about the question and try to eliminate the obviously wrong options."}
          </p>
        </div>
      )}

      {audienceStats && (
        <div className={styles.audienceBox}>
          <div className={styles.audienceHeader}>
            <span>👥 Audience Poll</span>
            <span className={styles.audiencePenalty}>-3 points</span>
          </div>
          <div className={styles.audienceChart}>
            {shuffledOptions.map((opt, displayIdx) => (
              <div key={displayIdx} className={styles.audienceBar}>
                <div className={styles.audienceBarFill} style={{ '--percent': audienceStats[opt.originalIndex] || 0 }}>
                  <span className={styles.audiencePercent}>{audienceStats[opt.originalIndex] || 0}%</span>
                </div>
                <span className={styles.audienceOption}>{opt.text}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Options: Support image-grid layout (Phase E4) or default text layout */}
      {question.optionLayout === "image-grid" ? (
        <div className="grid grid-cols-2 gap-3 mb-4">
          {shuffledOptions.map((opt, displayIdx) => {
            const originalIndex = opt.originalIndex;
            const isRemoved = removedOptions.includes(originalIndex);
            const hotkeys = ['A', 'B', 'C', 'D'];
            if (isRemoved) return null;
            const isSelected = selected === originalIndex;
            let isCorrect = false;

            let borderClass = "border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-indigo-500/60 shadow-xs";
            if (isSelected) {
              borderClass = "border-indigo-600 ring-2 ring-indigo-500/40 bg-indigo-50/30 dark:bg-indigo-950/30";
            }

            if (revealed) {
              const selectedOptionText = String(question.options[originalIndex] || "").trim();
              const correctAnswerText = String(question.correctAnswer || "").trim();
              isCorrect = selectedOptionText === correctAnswerText;
              if (isCorrect) {
                borderClass = "border-emerald-500 ring-2 ring-emerald-500/40 bg-emerald-50/30 dark:bg-emerald-950/30";
              } else if (isSelected && !isCorrect) {
                borderClass = "border-rose-500 ring-2 ring-rose-500/40 bg-rose-50/30 dark:bg-rose-950/30";
              }
            }

            return (
              <button
                key={displayIdx}
                type="button"
                className={`relative rounded-2xl border p-2 flex flex-col items-center justify-between text-center transition-all duration-200 cursor-pointer overflow-hidden active:scale-98 ${borderClass}`}
                onClick={() => handleSelect(originalIndex)}
                disabled={revealed || disabled}
              >
                <span className="absolute top-2 left-2 w-6 h-6 rounded-full bg-slate-900/80 text-white text-[11px] font-black flex items-center justify-center shadow-xs z-10">
                  {hotkeys[displayIdx]}
                </span>

                {revealed && (
                  <span className="absolute top-2 right-2 z-10">
                    {isCorrect ? (
                      <span className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs font-black shadow-xs">✓</span>
                    ) : isSelected ? (
                      <span className="w-6 h-6 rounded-full bg-rose-500 text-white flex items-center justify-center text-xs font-black shadow-xs">✗</span>
                    ) : null}
                  </span>
                )}

                {opt.imageUrl ? (
                  <div className="w-full aspect-[4/3] rounded-xl bg-slate-100 dark:bg-slate-800 overflow-hidden mb-2 flex items-center justify-center">
                    <img src={opt.imageUrl} alt={opt.text} className="w-full h-full object-contain p-1" />
                  </div>
                ) : (
                  <div className="w-full aspect-[4/3] rounded-xl bg-slate-100 dark:bg-slate-800/80 mb-2 flex items-center justify-center text-base sm:text-lg font-black text-slate-800 dark:text-slate-100">
                    {opt.text}
                  </div>
                )}
                <span className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">{opt.text}</span>
              </button>
            );
          })}
        </div>
      ) : (
        <div className={styles.optionsGrid}>
          {shuffledOptions.map((opt, displayIdx) => {
            const originalIndex = opt.originalIndex;
            const isRemoved = removedOptions.includes(originalIndex);
            const hotkeys = ['A', 'B', 'C', 'D'];
            if (isRemoved) return null;
            let className = styles.option;
            let isCorrect = false;
            const isSelected = selected === originalIndex;

            if (isSelected) {
              className += ` ${styles.selected}`;
            }

            if (revealed) {
              const selectedOptionText = String(question.options[originalIndex] || "").trim();
              const correctAnswerText = String(question.correctAnswer || "").trim();
              isCorrect = selectedOptionText === correctAnswerText;
              if (isCorrect) className += ` ${styles.correct} correct-answer`;
              else if (isSelected && !isCorrect) className += ` ${styles.wrong} wrong-answer`;
            }

            return (
              <button
                key={displayIdx}
                type="button"
                className={`${className} ${audienceStats ? styles.withAudience : ''}`}
                onClick={() => handleSelect(originalIndex)}
                disabled={revealed || disabled}
              >
                <div className={styles.optionLeft}>
                  <span className={styles.letterBadge}>{hotkeys[displayIdx]}</span>
                  <span className={styles.optionText}>{opt.text}</span>
                </div>
                <div className={styles.optionRight}>
                  {revealed ? (
                    <div className={`${styles.optionIndicator} ${isCorrect ? styles.indicatorCorrect : (isSelected ? styles.indicatorWrong : '')}`}>
                      {isCorrect ? '✓' : (isSelected ? '✗' : null)}
                    </div>
                  ) : (
                    <div className={`${styles.radioCircle} ${isSelected ? styles.radioSelected : ''}`}>
                      {isSelected && <span className={styles.radioDot} />}
                    </div>
                  )}
                  {audienceStats && (
                    <span className={styles.audienceBadge}>{audienceStats[originalIndex] || 0}%</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {revealed && !showExplanation && (
        <div className="mt-6 p-5 rounded-2xl bg-indigo-50/80 dark:bg-slate-800/90 border border-indigo-200/60 dark:border-indigo-900/40 shadow-sm animate-in fade-in duration-300">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2 font-black text-xs uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              <span>💡 {isHindi ? "स्पष्टीकरण एवं समीक्षा" : "Explanation & Review"}</span>
            </div>
            {onOpenExplanation && (
              <button
                type="button"
                onClick={onOpenExplanation}
                className="text-[11px] font-bold text-indigo-600 dark:text-indigo-300 hover:text-indigo-700 dark:hover:text-white transition-colors flex items-center gap-1 cursor-pointer bg-indigo-100/60 dark:bg-indigo-900/40 px-2.5 py-1 rounded-lg"
              >
                <span>🎙️ {isHindi ? "विस्तृत मैस्कॉट व्याख्या" : "Detailed Dialogue"}</span>
              </button>
            )}
          </div>
          <p className="m-0 text-sm leading-relaxed text-slate-700 dark:text-slate-200 font-medium">
            {getDynamicExplanation(question, isHindi)}
          </p>
        </div>
      )}

      {showExplanation && (
        <ExplanationCard
          question={question}
          userAnswerIndex={selected}
          onNextQuestion={onCloseExplanation}
          onClose={onCloseExplanation}
          onToggleFastMode={onToggleFastMode}
          categoryOrSlug={quizId}
          tier={tier}
          isHindi={isHindi}
        />
      )}
    </div>
  );
}
