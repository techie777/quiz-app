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

export default function QuestionCardV2({
  question,
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
  const [shakingType, setShakingType] = useState("");

  const isUser = session?.user && !session.user.isAdmin;

  // Update selected when userAnswer changes (navigation)
  useEffect(() => {
    if (userAnswer !== undefined) {
      setSelected(userAnswer);
      setRevealed(true);
    }
  }, [userAnswer]);

  // Sync fav state
  useEffect(() => {
    if (favouriteIds && typeof favouriteIds.has === 'function' && question?.id) {
      setFav(favouriteIds.has(question.id));
    }
  }, [favouriteIds, question?.id]);

  // Options parsing & shuffling
  const shuffledOptions = useMemo(() => {
    if (!question) return [];
    
    // Get the display options array (fallback to English if Hindi array is empty/invalid)
    const displayOpts = (isHindi && Array.isArray(question.optionsHi) && question.optionsHi.length > 0)
      ? question.optionsHi
      : (question.options || []);
      
    // Create an array of indices based on the ACTUAL length of display options
    const indices = displayOpts.map((_, i) => i);
    
    // Shuffle the indices
    const shuffled = [...indices];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    
    // Return mapped options with their original index for correct answer checking
    return shuffled.map(idx => ({
      text: displayOpts[idx] || "",
      originalIndex: idx
    }));
  }, [question?.id, isHindi]); // Re-shuffle ONLY when question changes

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
    
    const selectedOptionText = String(question.options[originalIndex] || "").trim();
    const correctAnswerText = String(question.correctAnswer || "").trim();
    const isCorrect = selectedOptionText === correctAnswerText;
    
    setSelected(originalIndex);
    setRevealed(true);

    if (soundEnabled) {
      if (isCorrect) playCorrectSound(combo);
      else {
        playWrongSound();
        setShakingType("animate-vibrate");
        setTimeout(() => setShakingType(""), 500);
      }
    }

    onAnswer(originalIndex);
  };

  if (!question) return null;

  return (
    <div className={`${styles.questionSection} ${shakingType ? styles[shakingType] || shakingType : ""}`}>
      <div className={styles.questionCard}>
        <div className={styles.questionHeader}>
          <p className={styles.questionText}>
            {isHindi ? (question.textHi || question.text) : question.text}
          </p>
          <div className={styles.actionBtns}>
            <button
              className={styles.favBtn}
              onClick={handleFavClick}
              title="Favourite"
            >
              <Heart size={18} fill={fav ? "currentColor" : "none"} color={fav ? "#ef4444" : "currentColor"} />
            </button>
            <button
              className={styles.shareBtn}
              onClick={handleShare}
              disabled={sharing}
              title="Share this question"
            >
              <Share2 size={18} />
            </button>
          </div>
        </div>
        {question.image && (
          <div className={styles.imageWrapper}>
            <Image 
              src={question.image} 
              alt={question.text || "Question image"} 
              width={600}
              height={300}
              className={styles.questionImage}
              style={{ objectFit: 'contain', width: '100%', height: 'auto' }}
              priority={true}
            />
          </div>
        )}
      </div>

      {/* Login Prompt Overlay */}
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

      {/* Hint Display */}
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

      {/* Ask Audience Results */}
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

      <div className={styles.optionsGrid}>
        {shuffledOptions.map((opt, displayIdx) => {
          const originalIndex = opt.originalIndex;
          const isRemoved = removedOptions.includes(originalIndex);
          const hotkeys = ['A', 'B', 'C', 'D'];
          
          if (isRemoved) return null;
          
          // Class calculation exactly matching old file
          let className = styles.option;
          let isCorrect = false;
          
          if (revealed) {
            const selectedOptionText = String(question.options[originalIndex] || "").trim();
            const correctAnswerText = String(question.correctAnswer || "").trim();
            isCorrect = selectedOptionText === correctAnswerText;
            
            if (isCorrect) {
              className += ` ${styles.correct} correct-answer`;
            } else if (originalIndex === selected && !isCorrect) {
              className += ` ${styles.wrong} wrong-answer`;
            }
          }
          
          return (
            <button
              key={displayIdx}
              className={`${className} ${audienceStats ? styles.withAudience : ''}`}
              onClick={() => handleSelect(originalIndex)}
              disabled={revealed || disabled}
            >
              <div className={styles.optionContent}>
                <span className={styles.hotkey}>{hotkeys[displayIdx]}</span>
                <p className={styles.optionText}>{opt.text}</p>
              </div>
              
              {revealed && (
                <div className={styles.optionIndicator}>
                  {isCorrect ? '✓' : (selected === originalIndex ? '✗' : null)}
                </div>
              )}
              {audienceStats && (
                <span className={styles.audienceBadge}>{audienceStats[originalIndex] || 0}%</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Explanation Display */}
      {showExplanation && explanation && (
        <div className={styles.explanationBox}>
          <div className={styles.explanationHeader}>
            <span>📚 {isHindi ? "स्पष्टीकरण" : "Explanation"}</span>
          </div>
          <p className={styles.explanationText}>{explanation}</p>
        </div>
      )}
    </div>
  );
}
