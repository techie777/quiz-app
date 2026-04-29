"use client";

import { useState, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useQuiz } from "@/context/QuizContext";
import { playCorrectSound, playWrongSound } from "@/lib/sounds";
import { shareQuestion } from "@/lib/shareImage";
import { Share2, Heart } from "lucide-react";
import Image from "next/image";
import styles from "@/styles/QuizEngine.module.css";

export default function QuestionCard({
  question,
  // Cache bust
  onAnswer,
  userAnswer,
  showExplanation,
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

  const isUser = session?.user && !session.user.isAdmin;

  // Update selected when userAnswer changes (navigation)
  useEffect(() => {
    if (userAnswer !== undefined) {
      setSelected(userAnswer);
      setRevealed(true);
    }
  }, [userAnswer]);

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
    // Fisher-Yates shuffle with fixed seed (question id + session id)
    // We'll use a simple deterministic shuffle based on the IDs
    const seed = (question.id || 0) + (quizSessionId || 0);
    const seededRandom = () => {
      const x = Math.sin(seed) * 10000;
      return x - Math.floor(x);
    };

    const shuffled = [...indices];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(seededRandom() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }, [question?.id, quizSessionId]);

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
        <h2 className={styles.questionText}>
          {isHindi ? (question.textHi || question.text) : question.text}
        </h2>
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

      {/* Explanation Footer */}
      {revealed && showExplanation && explanation && (
        <div className={styles.explanationBox}>
          <h4 className={styles.explanationTitle}>
            {isHindi ? "स्पष्टीकरण" : "Explanation"}
          </h4>
          <p className={styles.explanationText}>{explanation}</p>
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
    </div>
  );
}
