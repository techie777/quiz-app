"use client";

import { useMemo } from "react";
import { useQuiz } from "@/context/QuizContext";
import { useData } from "@/context/DataContext";
import Timer from "@/components/Timer";
import styles from "@/styles/QuizSidebar.module.css";

export default function QuizSidebar({ category, questions, currentIndex, score, timerSetting, isPaused, pauseQuiz, resumeQuiz }) {
  const { status } = useQuiz();

  // Calculate progress
  const progress = useMemo(() => {
    return questions.length > 0 ? Math.round(((currentIndex + 1) / questions.length) * 100) : 0;
  }, [currentIndex, questions.length]);

  // Calculate estimated time remaining
  const avgTimePerQuestion = 20; // seconds
  const remainingQuestions = Math.max(0, questions.length - currentIndex - 1);
  const estimatedRemainingTime = remainingQuestions * avgTimePerQuestion;

  // Format time
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle exit quiz
  const handleExitQuiz = () => {
    if (window.onExitQuiz) {
      window.onExitQuiz();
    }
  };

  return (
    <aside className={styles.quizSidebar}>
      {/* Compact Header */}
      <div className={styles.compactHeader}>
        <div className={styles.quizInfo}>
          <span className={styles.quizEmoji}>{category?.emoji || '📝'}</span>
          <div className={styles.quizDetails}>
            <h3 className={styles.quizTitle}>{category?.topic || 'Quiz'}</h3>
            <span className={styles.quizMeta}>{questions.length} Questions</span>
          </div>
        </div>
        <div className={styles.scoreDisplay}>
          <span className={styles.scoreValue}>{score}</span>
          <span className={styles.scoreLabel}>Score</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className={styles.compactProgress}>
        <div className={styles.progressBar}>
          <div 
            className={styles.progressFill} 
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className={styles.progressText}>{progress}%</span>
      </div>

      {/* Timer Section */}
      {timerSetting && timerSetting !== 'off' && (
        <div className={styles.compactTimer}>
          <div className={styles.timerHeader}>
            <span className={styles.timerLabel}>Time</span>
            <button
              className={styles.pauseButton}
              onClick={isPaused ? resumeQuiz : pauseQuiz}
              disabled={status !== 'active'}
            >
              {isPaused ? '▶️' : '⏸️'}
            </button>
          </div>
          <div className={styles.timerDisplay}>
            <Timer 
              seconds={timerSetting} 
              onExpire={() => console.log('Time up!')}
              isPaused={isPaused}
              questionKey={currentIndex}
            />
          </div>
        </div>
      )}

      {/* Navigation Controls */}
      <div className={styles.navigationControls}>
        <button
          className={styles.navButton}
          onClick={() => {
            if (window.onGoBack) window.onGoBack();
          }}
          disabled={currentIndex === 0}
          title="Go back to previous question"
        >
          ← Back
        </button>
        
        <div className={styles.questionIndicator}>
          <span className={styles.questionText}>Q{currentIndex + 1}/{questions.length}</span>
        </div>
        
        {currentIndex < questions.length - 1 && (
          <button
            className={styles.navButton}
            onClick={() => {
              if (window.onResumeQuiz) window.onResumeQuiz();
            }}
            title="Continue to next question"
          >
            Resume →
          </button>
        )}
      </div>

      {/* Compact Question Grid */}
      <div className={styles.compactNavigation}>
        <h4 className={styles.sectionTitle}>Questions</h4>
        <div className={styles.miniQuestionGrid}>
          {questions.map((question, index) => {
            const isAnswered = question.userAnswer !== undefined;
            const isCurrent = index === currentIndex;
            // Normalize comparison for Sidebar indicators
            const isCorrect = isAnswered && 
              String(question.options[question.userAnswer] || "").trim() === String(question.correctAnswer || "").trim();
            const canNavigate = index <= currentIndex;
            
            return (
              <button
                key={question.id}
                className={`${styles.miniQuestionButton} ${
                  isCurrent ? styles.current : ''
                } ${
                  isAnswered ? `${styles.answered} ${isCorrect ? styles.correct : styles.incorrect}` : ''
                } ${
                  !canNavigate ? styles.disabled : ''
                }`}
                disabled={!canNavigate}
                onClick={() => {
                  if (canNavigate && window.onNavigateToQuestion) {
                    window.onNavigateToQuestion(index);
                  }
                }}
                title={`Q${index + 1}${isAnswered ? (isCorrect ? ' ✓ Correct' : ' ✗ Wrong') : (isCurrent ? ' 👁 Current' : ' - Upcoming')}`}
              >
                {index + 1}
                {isCurrent && !isAnswered && (
                  <span className={styles.answerIndicator}>
                    👁
                  </span>
                )}
                {isAnswered && (
                  <span className={styles.answerIndicator}>
                    {isCorrect ? '✓' : '✗'}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        
        {/* Quick Stats */}
        <div className={styles.quickStats}>
          <span className={styles.statItem}>
            ✓ {questions.filter(q => q.userAnswer !== undefined && 
                String(q.options[q.userAnswer] || "").trim() === String(q.correctAnswer || "").trim()).length}
          </span>
          <span className={styles.statItem}>
            ✗ {questions.filter(q => q.userAnswer !== undefined && 
                String(q.options[q.userAnswer] || "").trim() !== String(q.correctAnswer || "").trim()).length}
          </span>
          <span className={styles.statItem}>
            ⏱ {Math.round((Date.now() - (window.quizStartTime || Date.now())) / 1000)}s
          </span>
        </div>
      </div>

      /* Quick Actions */
      <div className={styles.quickActions}>
        <button className={styles.actionButton}>
          📝 Notes
        </button>
        <button className={styles.actionButton}>
          💡 Hint
        </button>
        <button 
          className={`${styles.actionButton} ${styles.exitButton}`}
          onClick={handleExitQuiz}
        >
          🏠 Exit
        </button>
      </div>
    </aside>
  );
}
