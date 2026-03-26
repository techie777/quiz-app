"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuiz } from "@/context/QuizContext";
import { useData } from "@/context/DataContext";
import styles from "@/styles/ResultPage.module.css";

function getMotivation(percentage) {
  if (percentage === 100) return { text: "Perfect Score!", emoji: "🌟" };
  if (percentage >= 80) return { text: "Great Job!", emoji: "🎉" };
  if (percentage >= 60) return { text: "Good Effort!", emoji: "👍" };
  if (percentage >= 40) return { text: "Keep Practicing!", emoji: "💪" };
  return { text: "Don't Give Up!", emoji: "📚" };
}

const CONFETTI_COLORS = ["#4361ee", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#00e5ff"];

export default function ResultPage() {
  const router = useRouter();
  const { score, questions, answers, quizId, difficulty, timerSetting, language, resetQuiz, startQuiz } = useQuiz();
  const { quizzes } = useData();
  const [showReview, setShowReview] = useState(false);
  const [confetti, setConfetti] = useState([]);

  const total = questions.length;
  const percentage = total > 0 ? Math.round((score / total) * 100) : 0;
  const motivation = getMotivation(percentage);

  // Always call this hook - handle redirection logic inside
  useEffect(() => {
    if (total === 0) {
      router.replace("/");
    }
  }, [total, router]);

  // Always call this hook - handle confetti logic inside
  useEffect(() => {
    if (total === 0) return;
    const pieces = Array.from({ length: 40 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 2,
      duration: 2 + Math.random() * 2,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      rotation: Math.random() * 360,
    }));
    setConfetti(pieces);
  }, [total]);

  const handlePlayAgain = () => {
    startQuiz(quizId, difficulty, timerSetting, language);
    router.push(`/quiz/${quizId}`);
  };

  const handleBackToQuizzes = () => {
    resetQuiz();
    router.push(`/category/${quizId}`);
  };

  // Always return JSX - never return null or conditionally skip hooks
  return (
    <main className={styles.page}>
      {total === 0 ? (
        // Empty state - always render this when no results
        <div className={styles.scoreCard}>
          <h1>Loading...</h1>
          <p>Redirecting to home...</p>
        </div>
      ) : (
        // Full results
        <div className={styles.resultContainer}>
          {/* Left Sidebar: You May Like */}
          <aside className={styles.sidebarLeft}>
            <h3 className={styles.sidebarTitle}>You May Like</h3>
            <div className={styles.suggestedList}>
              {quizzes.slice(0, 3).map(quiz => (
                <div key={quiz.id} className={styles.suggestedCard} onClick={() => router.push(`/category/${quiz.id}`)}>
                  <span className={styles.suggestedEmoji}>{quiz.emoji || "📝"}</span>
                  <div className={styles.suggestedInfo}>
                    <span className={styles.suggestedName}>{quiz.topic}</span>
                    <span className={styles.suggestedQuestions}>{quiz.questions.length} Qs</span>
                  </div>
                </div>
              ))}
            </div>
          </aside>

          {/* Center: Main Content */}
          <div className={styles.mainContent}>
            {/* Confetti */}
            <div className={styles.confettiContainer}>
              {confetti.map((piece) => (
                <div
                  key={piece.id}
                  className={styles.confettiPiece}
                  style={{
                    left: `${piece.left}%`,
                    animationDelay: `${piece.delay}s`,
                    animationDuration: `${piece.duration}s`,
                    backgroundColor: piece.color,
                    transform: `rotate(${piece.rotation}deg)`,
                  }}
                />
              ))}
            </div>

            {/* Score Card */}
            <div className={`${styles.scoreCard} glass-card`}>
              <div className={styles.trophy}>🏆</div>
              <h1 className={styles.heading}>Quiz Completed!</h1>
              <div className={styles.scoreCircle}>
                <span className={styles.scoreNum}>{score}</span>
                <span className={styles.scoreDivider}>/</span>
                <span className={styles.scoreTotal}>{total}</span>
              </div>
              <div className={styles.motivation}>
                <span>{motivation.emoji}</span>
                <span>{motivation.text}</span>
              </div>
              <div className={styles.percentage}>{percentage}%</div>
            </div>

            {/* Action Buttons */}
            <div className={styles.actions}>
              <button className="btn-primary" onClick={handlePlayAgain}>
                🔄 Play Again
              </button>
              <button
                className="btn-secondary"
                onClick={() => setShowReview(!showReview)}
              >
                {showReview ? "Hide Answers" : "📋 View Answers"}
              </button>
              <button className="btn-secondary" onClick={handleBackToQuizzes}>
                ← Back to Quizzes
              </button>
            </div>

            {/* Answer Review */}
            {showReview && (
              <div className={styles.review}>
                <h2 className={styles.reviewTitle}>Answer Review</h2>
                {answers.map((answer, index) => {
                  const question = questions.find((q) => q.id === answer.questionId);
                  if (!question) return null;
                  
                  const selectedOptionText = answer.selected !== null && answer.selected !== undefined 
                    ? question.options[answer.selected] 
                    : "No answer";
                  
                  return (
                    <div
                      key={answer.questionId}
                      className={`${styles.reviewItem} ${
                        answer.isCorrect ? styles.reviewCorrect : styles.reviewWrong
                      }`}
                    >
                      <div className={styles.reviewHeader}>
                        <span className={styles.reviewNum}>Q{index + 1}</span>
                        <span className={styles.reviewBadge}>
                          {answer.isCorrect ? "✓ Correct" : "✗ Wrong"}
                        </span>
                      </div>
                      <p className={styles.reviewQuestion}>{question.text}</p>
                      {!answer.isCorrect && (
                        <div className={styles.reviewAnswers}>
                          <p className={styles.yourAnswer}>
                            Your answer: <strong>{selectedOptionText}</strong>
                          </p>
                          <p className={styles.correctAnswer}>
                            Correct answer: <strong>{answer.correct}</strong>
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Sidebar: Suggested Quizzes */}
          <aside className={styles.sidebarRight}>
            <h3 className={styles.sidebarTitle}>Suggested Quizzes</h3>
            <div className={styles.suggestedList}>
              {quizzes.slice(3, 6).map(quiz => (
                <div key={quiz.id} className={styles.suggestedCard} onClick={() => router.push(`/category/${quiz.id}`)}>
                  <span className={styles.suggestedEmoji}>{quiz.emoji || "🔥"}</span>
                  <div className={styles.suggestedInfo}>
                    <span className={styles.suggestedName}>{quiz.topic}</span>
                    <span className={styles.suggestedQuestions}>{quiz.questions.length} Qs</span>
                  </div>
                </div>
              ))}
            </div>
          </aside>
        </div>
      )}
    </main>
  );
}
