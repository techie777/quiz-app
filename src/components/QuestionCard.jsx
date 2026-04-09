"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useQuiz } from "@/context/QuizContext";
import { playCorrectSound, playWrongSound } from "@/lib/sounds";
import { shareQuestion } from "@/lib/shareImage";
import Image from "next/image";
import styles from "@/styles/QuizEngine.module.css";

export default function QuestionCard({ 
  question, 
  onAnswer, 
  favouriteIds, 
  quizId, 
  disabled, 
  userAnswer, 
  showHint, 
  removedOptions = [], 
  audienceStats, 
  showExplanation, 
  explanation 
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { soundEnabled } = useQuiz();
  const [selected, setSelected] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const [fav, setFav] = useState(false);
  const [loginPrompt, setLoginPrompt] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [shaking, setShaking] = useState(false);
  const isUser = session?.user && !session.user.isAdmin;

  // Update selected when userAnswer changes (navigation)
  useEffect(() => {
    if (userAnswer !== undefined) {
      setSelected(userAnswer);
      setRevealed(true);
    }
  }, [userAnswer]);

  // Check if this question is already favourited
  useEffect(() => {
    if (favouriteIds && question) {
      setFav(favouriteIds.has(question.id));
    }
  }, [question?.id, favouriteIds, question]);

  // Set up ref for external access
  useEffect(() => {
    window.QuestionCardRef = {
      resetQuestion: () => {
        setSelected(null);
        setRevealed(false);
        setShaking(false);
      }
    };
    
    return () => {
      delete window.QuestionCardRef;
    };
  }, []);

  // Hotkey Listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (revealed || disabled) return;
      const key = e.key.toUpperCase();
      const map = { 'A': 0, 'B': 1, 'C': 2, 'D': 3 };
      if (map[key] !== undefined && question.options[map[key]]) {
        handleSelect(map[key]);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [revealed, disabled, question]);

  const handleFavClick = async () => {
    if (disabled || !question) return;
    // If not logged in, show login prompt
    if (status !== "authenticated" || !isUser) {
      setLoginPrompt(true);
      return;
    }
    // Toggle favourite
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

  const handleSelect = (optionIndex) => {
    if (revealed || disabled || !question) return;
    
    // Normalize comparison
    const selectedOptionText = String(question.options[optionIndex] || "").trim();
    const correctAnswerText = String(question.correctAnswer || "").trim();
    const isCorrect = selectedOptionText === correctAnswerText;
    
    // Set selected and revealed immediately for live feedback
    setSelected(optionIndex);
    setRevealed(true);
    
    // ONLY sound feedback
    if (soundEnabled) {
      if (isCorrect) {
        playCorrectSound();
      } else {
        playWrongSound();
        setShaking(true);
        setTimeout(() => setShaking(false), 500);
      }
    }
    onAnswer(optionIndex);
  };

  const getOptionClass = (optionIndex) => {
    // Always return base option class
    let className = styles.option;
    
    if (!revealed || !question) return className;
    
    // Normalize comparison for Hindi and other characters
    const selectedOptionText = String(question.options[optionIndex] || "").trim();
    const correctAnswerText = String(question.correctAnswer || "").trim();
    const isCorrect = selectedOptionText === correctAnswerText;
    
    if (isCorrect) {
      className += ` ${styles.correct} correct-answer`;
    } else if (optionIndex === selected && !isCorrect) {
      className += ` ${styles.wrong} wrong-answer`;
    }
    
    return className;
  };

  const getOptionStyle = (optionIndex) => {
    // We already apply styles via CSS classes in getOptionClass
    // This can be used for dynamic styles if needed, but for now we keep it minimal
    if (!revealed) return {};
    return {};
  };

  const getOptionIndicator = (optionIndex) => {
    if (!revealed || !question) return null;
    // Normalize comparison
    const selectedOptionText = String(question.options[optionIndex] || "").trim();
    const correctAnswerText = String(question.correctAnswer || "").trim();
    const isCorrect = selectedOptionText === correctAnswerText;
    
    if (isCorrect) return '✓';
    if (optionIndex === selected && !isCorrect) return '✗';
    return null;
  };

  // Guard against missing question
  if (!question) return null;

  return (
    <div className={`${styles.questionSection} ${shaking ? "animate-vibrate" : ""}`}>
      <div className={styles.questionCard}>
        <div className={styles.questionHeader}>
          <p className={styles.questionText}>{question.text}</p>
          <div className={styles.actionBtns}>
            <button
              className={styles.favBtn}
              onClick={handleFavClick}
              title="Favourite"
            >
              {fav ? "❤️" : "🤍"}
            </button>
            <button
              className={styles.shareBtn}
              onClick={handleShare}
              disabled={sharing}
              title="Share this question"
            >
              {sharing ? "⏳" : "📤"}
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

      {/* Login prompt for favourite */}
      {loginPrompt && (
        <div className={styles.loginPrompt}>
          <p>Sign in to save favourites</p>
          <div className={styles.loginPromptBtns}>
            <button
              className="btn-primary"
              onClick={() => router.push("/signin")}
            >
              Sign In
            </button>
            <button
              className="btn-secondary"
              onClick={() => setLoginPrompt(false)}
            >
              Dismiss
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
            {question.options.map((option, idx) => (
              <div key={idx} className={styles.audienceBar}>
                <div className={styles.audienceBarFill} style={{ width: `${audienceStats[idx]}%` }}>
                  <span className={styles.audiencePercent}>{audienceStats[idx]}%</span>
                </div>
                <span className={styles.audienceOption}>{option}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className={styles.optionsGrid}>
        {question.options.map((option, idx) => {
          const isRemoved = removedOptions.includes(idx);
          const hotkeys = ['A', 'B', 'C', 'D'];
          
          if (isRemoved) return null;
          
          return (
            <button
              key={idx}
              data-option-index={idx}
              className={`${getOptionClass(idx)} ${isRemoved ? styles.removed : ''} ${audienceStats ? styles.withAudience : ''}`}
              style={getOptionStyle(idx)}
              onClick={() => handleSelect(idx)}
              disabled={revealed || disabled}
            >
              <div className={styles.optionContent}>
                <span className={styles.hotkey}>{hotkeys[idx]}</span>
                <span className={styles.optionText}>{option}</span>
              </div>
              
              {revealed && (
                <span className={styles.optionIndicator}>
                  {getOptionIndicator(idx)}
                </span>
              )}
              {audienceStats && (
                <span className={styles.audienceBadge}>{audienceStats[idx]}%</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Explanation Display */}
      {showExplanation && explanation && (
        <div className={styles.explanationBox}>
          <div className={styles.explanationHeader}>
            <span>📚 Explanation</span>
          </div>
          <p className={styles.explanationText}>{explanation}</p>
        </div>
      )}
    </div>
  );
}
