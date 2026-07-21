"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useQuiz } from "@/context/QuizContext";
import { playCorrectSound, playWrongSound } from "@/lib/sounds";
import { shareQuestion } from "@/lib/shareImage";
import { Share2, Heart, X } from "lucide-react";
import Image from "next/image";
import styles from "@/styles/QuizEngine.module.css";
import { getDynamicExplanation } from "@/lib/explanationGenerator";
import CoinAnimation from "@/components/CoinAnimation";

export default function QuestionCard({
  question,
  // Cache bust
  onAnswer,
  userAnswer,
  showExplanation,
  onCloseExplanation,
  explanation,
  language = "en",
  disabled,
  showHint,
  removedOptions = [],
  audienceStats,
  favouriteIds,
  quizId,
}) {
  const isHindi = language === 'hi';
  const { data: session, status } = useSession();
  const router = useRouter();
  const { soundEnabled, quizSessionId, combo } = useQuiz();
  
  const [selected, setSelected] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const [fav, setFav] = useState(false);
  const [loginPrompt, setLoginPrompt] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [shakingType, setShakingType] = useState(""); // "", "shake", "megaShake"
  const [showCoinAnim, setShowCoinAnim] = useState(false);

  const isUser = session?.user && !session.user.isAdmin;

  // Update selected when userAnswer changes (navigation)
  useEffect(() => {
    if (userAnswer !== undefined) {
      setSelected(userAnswer);
      setRevealed(true);
    }
  }, [userAnswer]);

  // Reset selected & revealed when question or userAnswer changes
  useEffect(() => {
    if (userAnswer !== undefined) {
      setSelected(userAnswer);
      setRevealed(true);
    } else {
      setSelected(null);
      setRevealed(false);
    }
  }, [question?.id, userAnswer]);

  // 1. Sync fav state when favouriteIds or question.id changes
  useEffect(() => {
    if (favouriteIds && typeof favouriteIds.has === 'function' && question?.id) {
      setFav(favouriteIds.has(question.id));
    }
  }, [favouriteIds, question?.id]);

  // 2. Generate a stable shuffled order of indices for this question instance
  const shuffledOrder = useMemo(() => {
    if (!question || !Array.isArray(question.options)) return [0, 1, 2, 3];
    
    const indices = question.options.map((_, i) => i);
    const seedStr = String(question.id || question.text || '') + String(quizSessionId || '');
    let hash = 0;
    for (let k = 0; k < seedStr.length; k++) {
      hash = ((hash << 5) - hash) + seedStr.charCodeAt(k);
      hash |= 0;
    }
    let seedNum = Math.abs(hash) || 1;
    const seededRandom = () => {
      const x = Math.sin(seedNum++) * 10000;
      return x - Math.floor(x);
    };

    const shuffled = [...indices];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(seededRandom() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }, [question?.id, question?.text, quizSessionId]);

  // 3. Map current language options to the stable shuffled order
  const shuffledOptions = useMemo(() => {
    if (!question) return [];
    const opts = (isHindi && Array.isArray(question.optionsHi) && question.optionsHi.length > 0) 
      ? question.optionsHi 
      : question.options;
      
    if (!Array.isArray(opts)) return [];
    
    return shuffledOrder.map(originalIndex => ({
      text: opts[originalIndex] || "",
      index: originalIndex
    }));
  }, [shuffledOrder, isHindi, question]);

  // Hotkey Listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (revealed || disabled) return;
      const key = e.key.toUpperCase();
      const map = { 'A': 0, 'B': 1, 'C': 2, 'D': 3 };
      const displayIdx = map[key];
      if (displayIdx !== undefined && shuffledOptions[displayIdx]) {
        handleSelect(shuffledOptions[displayIdx].index);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [revealed, disabled, question, shuffledOptions]);

  const handleFavClick = async () => {
    if (disabled || !question) return;
    if (status !== "authenticated" || !isUser) {
      setLoginPrompt(true);
      return;
    }
    try {
      const res = await fetch("/api/favourites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId: question.id }),
      });
      if (res.ok) {
        const data = await res.json();
        setFav(data.favourited);
      }
    } catch {
      // Silently fail
    }
  };

  const handleShare = async () => {
    if (sharing || disabled || !question) return;
    setSharing(true);
    try {
      await shareQuestion(question, quizId);
    } catch {
      // Silently fail
    }
    setSharing(false);
  };

  const handleSelect = (originalIndex) => {
    if (revealed || disabled || !question) return;
    
    const isCorrect = originalIndex === question.correctAnswer;
    setSelected(originalIndex);
    setRevealed(true);

    if (soundEnabled) {
      if (isCorrect) playCorrectSound(combo);
      else playWrongSound();
    }

    if (isCorrect) {
      if (combo >= 20) setShakingType("megaShake");
      else if (combo >= 10) setShakingType("shake");
      
      // Show coin animation for correct answers
      const coinsEarned = session?.user?.isPro ? 4 : 1;
      setShowCoinAnim(true);
      setTimeout(() => setShowCoinAnim(false), 1500);
    }

    onAnswer(originalIndex);
  };

  if (!question) return null;

  return (
    <div className={`${styles.questionCard} ${shakingType ? styles[shakingType] : ""}`}>
      {/* Header with Category and Actions */}
      <div className={styles.questionHeader}>
        <span className={styles.categoryBadge}>
          {isHindi ? (question.category?.nameHi || question.category?.name) : question.category?.name}
        </span>
        <div className={styles.actionBtns}>
          <VoiceAnswerControl 
            onSelectOption={(idx) => handleSelect(shuffledOptions[idx]?.index)} 
            optionsCount={shuffledOptions.length}
            options={shuffledOptions.map(o => o.text)}
            isHindi={isHindi}
          />
          <button 
            onClick={handleShare} 
            disabled={sharing}
            className={styles.shareBtn}
            title="Share Question"
          >
            <Share2 className={sharing ? styles.spinning : ""} />
          </button>
          <button 
            onClick={handleFavClick} 
            className={`${styles.favBtn} ${fav ? styles.activeHeart : ""}`}
            title="Add to Favourites"
          >
            <Heart fill={fav ? "currentColor" : "none"} />
          </button>
        </div>
      </div>

      {/* Question Text */}
      <div className={styles.questionSection}>
        {!!(isHindi ? (question.textHi || question.text) : question.text) && (
          <h2 className={styles.questionText}>
            {isHindi ? (question.textHi || question.text) : question.text}
          </h2>
        )}
        {question.image && (
          <div className={styles.questionImageWrapper}>
            <Image 
              src={question.image} 
              alt="Question Visual" 
              width={600} 
              height={300} 
              className={styles.questionImage}
            />
          </div>
        )}
      </div>

      {/* Options Grid */}
      <div className={styles.optionsGrid}>
        {shuffledOptions.map((opt, i) => {
          const isSelected = selected === opt.index;
          const isCorrect = opt.index === question.correctAnswer;
          const isWrong = isSelected && !isCorrect;
          const isRemoved = removedOptions.includes(opt.index);

          let optionClass = styles.option;
          if (revealed) {
            if (isCorrect) optionClass += ` ${styles.correct}`;
            else if (isWrong) optionClass += ` ${styles.wrong}`;
            else optionClass += ` ${styles.dimmed}`;
          } else if (isSelected) {
            optionClass += ` ${styles.selected}`;
          }

          if (isRemoved) optionClass += ` ${styles.removed}`;

          return (
            <button
              key={i}
              onClick={() => handleSelect(opt.index)}
              disabled={revealed || disabled || isRemoved}
              className={optionClass}
            >
              <span className={styles.optionLetter}>{String.fromCharCode(65 + i)}</span>
              <span className={styles.optionText}>{opt.text}</span>
              
              {audienceStats && audienceStats[opt.index] !== undefined && (
                <div className={styles.pollBar} style={{ width: `${audienceStats[opt.index]}%` }}>
                  <span className={styles.pollLabel}>{audienceStats[opt.index]}%</span>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {revealed && !showExplanation && (
        <div className="mt-6 p-5 rounded-2xl bg-indigo-50/80 dark:bg-slate-800/90 border border-indigo-200/60 dark:border-indigo-900/40 shadow-sm animate-in fade-in duration-300">
          <div className="flex items-center gap-2 mb-2 font-black text-xs uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            <span>💡 {isHindi ? "स्पष्टीकरण एवं समीक्षा" : "Explanation & Review"}</span>
          </div>
          <p className="m-0 text-sm leading-relaxed text-slate-700 dark:text-slate-200 font-medium">
            {getDynamicExplanation(question, isHindi)}
          </p>
        </div>
      )}

      {/* Explanation Card + Source Link */}
      {showExplanation && (
        <div className={styles.explanationOverlay} onClick={() => onCloseExplanation?.()}>
          <div className={styles.centeredExplanationCard} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
              <h4 className={styles.explanationTitle}>
                💡 {isHindi ? "स्पष्टीकरण" : "Explanation"}
              </h4>
              <button
                onClick={() => onCloseExplanation?.()}
                className={styles.explanationCloseBtn}
                title={isHindi ? "बंद करें" : "Close"}
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>
            <p className={styles.explanationText} style={{ margin: 0, fontSize: "0.9rem", lineHeight: "1.4" }}>
              {getDynamicExplanation(question, isHindi)}
            </p>
          </div>
        </div>
      )}

      {/* Login Prompt Overlay */}
      {loginPrompt && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h3>{isHindi ? "लॉगिन आवश्यक" : "Login Required"}</h3>
            <p>{isHindi ? "पसंदीदा में जोड़ने के लिए कृपया लॉगिन करें।" : "Please login to add questions to your favourites."}</p>
            <div className={styles.modalActions}>
              <button onClick={() => router.push("/login")} className={styles.primaryBtn}>
                {isHindi ? "लॉगिन" : "Login"}
              </button>
              <button onClick={() => setLoginPrompt(false)} className={styles.secondaryBtn}>
                {isHindi ? "रद्द करें" : "Cancel"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Coin Animation */}
      <CoinAnimation 
        show={showCoinAnim} 
        amount={session?.user?.isPro ? 4 : 1} 
        isPro={session?.user?.isPro} 
      />
    </div>
  );
}
