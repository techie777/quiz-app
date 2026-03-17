"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useQuiz } from "@/context/QuizContext";
import { playCorrectSound, playWrongSound } from "@/lib/sounds";
import { shareQuestion } from "@/lib/shareImage";
import styles from "@/styles/QuizEngine.module.css";

export default function QuestionCard({ question, onAnswer, favouriteIds, quizId, disabled }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { soundEnabled } = useQuiz();
  const [selected, setSelected] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const [fav, setFav] = useState(false);
  const [loginPrompt, setLoginPrompt] = useState(false);
  const [sharing, setSharing] = useState(false);
  const isUser = session?.user && !session.user.isAdmin;

  // Check if this question is already favourited
  useEffect(() => {
    if (favouriteIds) {
      setFav(favouriteIds.has(question.id));
    }
  }, [question.id, favouriteIds]);

  const handleFavClick = async () => {
    if (disabled) return;
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
    if (sharing || disabled) return;
    setSharing(true);
    try {
      await shareQuestion(question, quizId);
    } catch {
      // Silently fail
    }
    setSharing(false);
  };

  const handleSelect = (option) => {
    if (revealed || disabled) return;
    setSelected(option);
    setRevealed(true);

    // Play sound effect
    if (soundEnabled) {
      if (option === question.correctAnswer) {
        playCorrectSound();
      } else {
        playWrongSound();
      }
    }

    setTimeout(() => {
      onAnswer(option);
      setSelected(null);
      setRevealed(false);
    }, 1000);
  };

  const getOptionClass = (option) => {
    if (!revealed) return styles.option;
    if (option === question.correctAnswer) return `${styles.option} ${styles.correct}`;
    if (option === selected && option !== question.correctAnswer)
      return `${styles.option} ${styles.wrong}`;
    return styles.option;
  };

  return (
    <div className={styles.questionSection}>
      <div className={`${styles.questionCard} glass-card`}>
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
          <img src={question.image} alt="" className={styles.questionImage} />
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

      <div className={styles.optionsGrid}>
        {question.options.map((option) => (
          <button
            key={option}
            className={getOptionClass(option)}
            onClick={() => handleSelect(option)}
            disabled={revealed}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}
