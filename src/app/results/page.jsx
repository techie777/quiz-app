"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useQuiz } from "@/context/QuizContext";
import { useData } from "@/context/DataContext";
import styles from "@/styles/ResultPage.module.css";

function getMotivation(percentage) {
  if (percentage === 100) return { text: "Perfect Score!", emoji: "🌟" };
  if (percentage >= 80) return { text: "Great Job!", emoji: "🎉" };
  if (percentage >= 60) return { text: "Good Effort!", emoji: "👍" };
  if (percentage >= 40) return { text: "Keep Practicing!", emoji: "💪" };
  return { text: "Don&apos;t Give Up!", emoji: "📚" };
}

const CONFETTI_COLORS = ["#4361ee", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#00e5ff"];

export default function ResultPage() {
  const router = useRouter();
  const { score, questions, answers, quizId, difficulty, timerSetting, language, resetQuiz, startQuiz } = useQuiz();
  const { quizzes } = useData();
  const [showReview, setShowReview] = useState(false);
  const [confetti, setConfetti] = useState([]);
  const [showPostQuizPopup, setShowPostQuizPopup] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const category = useMemo(() => {
    return (quizzes || []).find((q) => q.id === quizId);
  }, [quizzes, quizId]);

  const filteredQuizzes = useMemo(() => {
    if (!quizzes || !Array.isArray(quizzes)) return [];
    const validQuizzes = quizzes.filter(q => q && q.topic && !q.hidden);
    if (!searchQuery) return validQuizzes.slice(0, 10);
    const query = searchQuery.toLowerCase();
    return validQuizzes.filter(q => 
      (q.topic && q.topic.toLowerCase().includes(query)) ||
      (q.description && q.description.toLowerCase().includes(query))
    ).slice(0, 10);
  }, [quizzes, searchQuery]);

  // Show suggestions after 2.5 seconds
  useEffect(() => {
    if (questions && questions.length > 0) {
      const timer = setTimeout(() => {
        setShowPostQuizPopup(true);
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [questions]);

  const handleContinueNextSet = () => {
     router.push(`/category/${quizId}`);
   };

   const handleSuggestionClick = (suggestionId) => {
     setShowPostQuizPopup(false);
     router.push(`/category/${suggestionId}`);
   };

  const performance = useMemo(() => {
    if (!questions || questions.length === 0) return null;
    const total = questions.length;
    const correct = score;
    const skipped = total - answers.length;
    const wrong = total - correct - skipped;
    const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;

    return { correct, wrong, skipped, total, accuracy };
  }, [questions, score, answers]);

  const total = performance?.total || 0;
  const percentage = performance?.accuracy || 0;
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
              <div className={styles.stats}>
                <div className={styles.statItem}>
                  <span className={styles.statLabel}>Total</span>
                  <span className={styles.statValue}>{total}</span>
                </div>
                <div className={`${styles.statItem} ${styles.correct}`}>
                  <span className={styles.statLabel}>Correct</span>
                  <span className={styles.statValue}>{performance.correct}</span>
                </div>
                <div className={`${styles.statItem} ${styles.wrong}`}>
                  <span className={styles.statLabel}>Wrong</span>
                  <span className={styles.statValue}>{performance.wrong}</span>
                </div>
                <div className={`${styles.statItem} ${styles.skipped}`}>
                  <span className={styles.statLabel}>Skipped</span>
                  <span className={styles.statValue}>{performance.skipped}</span>
                </div>
              </div>
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
                {questions.map((question, index) => {
                  const answer = answers.find((a) => a.questionId === question.id);
                  const isAnswered = !!answer;
                  const isCorrect = answer?.isCorrect || false;
                  
                  const selectedOptionText = isAnswered && answer.selected !== null && answer.selected !== undefined 
                    ? question.options[answer.selected] 
                    : (answer?.selected === null ? "Timed Out" : "Skipped");
                  
                  return (
                    <div
                      key={question.id}
                      className={`${styles.reviewItem} ${
                        !isAnswered ? styles.reviewSkipped : (isCorrect ? styles.reviewCorrect : styles.reviewWrong)
                      }`}
                    >
                      <div className={styles.reviewHeader}>
                        <span className={styles.reviewNum}>Q{index + 1}</span>
                        <span className={`${styles.reviewBadge} ${!isAnswered ? styles.badgeSkipped : (isCorrect ? styles.badgeCorrect : styles.badgeWrong)}`}>
                          {!isAnswered ? "✗ Skipped" : (isCorrect ? "✓ Correct" : "✗ Wrong")}
                        </span>
                      </div>
                      <p className={styles.reviewQuestion}>{question.text}</p>
                      
                      <div className={styles.reviewAnswers}>
                        <p className={styles.yourAnswer}>
                          Your answer: <strong>{selectedOptionText}</strong>
                        </p>
                        <p className={styles.correctAnswer}>
                          Correct answer: <strong>{question.correctAnswer}</strong>
                        </p>
                      </div>
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

      {/* Post Quiz Suggestions Popup (shown after a delay) */}
      {showPostQuizPopup && (
        <div className={styles.modalOverlay}>
          <div className={styles.suggestionsPopup}>
            <button className={styles.closeBtn} onClick={() => setShowPostQuizPopup(false)}>✕</button>
            
            <div className={styles.popupHeader}>
              <h2 className={styles.popupTitle}>🎉 Great Job! What&apos;s Next?</h2>
              <div className={styles.searchBar}>
                <input 
                  type="text" 
                  placeholder="Search other quizzes..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={styles.searchInput}
                />
              </div>
            </div>

            <div className={styles.popupContent}>
              {quizId && (
                <button 
                  className={styles.nextSetBtn}
                  onClick={handleContinueNextSet}
                >
                  Continue Next Set of {category?.topic || 'this category'}
                </button>
              )}

              <div className={styles.suggestionsList}>
                <h3 className={styles.suggestionsLabel}>Recommended for you:</h3>
                <div className={styles.miniSuggestionsGrid}>
                  {filteredQuizzes.map(quiz => (
                    <div 
                      key={quiz.id} 
                      className={styles.miniSuggestionCard}
                      onClick={() => handleSuggestionClick(quiz.id)}
                    >
                      <span className={styles.miniSuggestionEmoji}>{quiz.emoji || '📚'}</span>
                      <span className={styles.miniSuggestionTitle}>{quiz.topic}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
