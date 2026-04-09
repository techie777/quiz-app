"use client";

import { useMemo, useState } from "react";
import { useData } from "@/context/DataContext";
import { useQuiz } from "@/context/QuizContext";
import ExitConfirmModal from "@/components/ExitConfirmModal";
import Image from "next/image";
import styles from "@/styles/QuizSuggestions.module.css";

function SuggestionImage({ src, alt, emoji }) {
  const [error, setError] = useState(false);

  if (!src || error) {
    return (
      <div className={styles.suggestionEmojiFallback}>
        {emoji || '📚'}
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={300}
      height={120}
      className={styles.suggestionImg}
      onError={() => setError(true)}
      style={{ objectFit: 'cover' }}
    />
  );
}

export default function QuizSuggestions({ currentCategory }) {
  const { quizzes } = useData();
  const { status, resetQuiz } = useQuiz();
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [pendingQuiz, setPendingQuiz] = useState(null);

  // Check if quiz is currently active
  const isQuizActive = status === 'active';

  // Get random suggested categories (exclude current category)
  const suggestedCategories = useMemo(() => {
    if (!quizzes.length || !currentCategory) return [];
    
    const availableQuizzes = quizzes.filter(q => 
      q.id !== currentCategory.id && 
      !q.hidden && 
      q.questions && 
      q.questions.length > 0
    );
    
    // Shuffle and take 4 random categories for better coverage
    const shuffled = [...availableQuizzes].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 4);
  }, [quizzes, currentCategory]);

  const handleQuizClick = (e, quiz) => {
    e.preventDefault();
    
    if (isQuizActive) {
      // Show warning modal if quiz is active
      setPendingQuiz(quiz);
      setShowWarningModal(true);
    } else {
      // Navigate directly if no active quiz
      window.location.href = `/category/${quiz.id}`;
    }
  };

  const handleConfirmSwitch = () => {
    // Reset current quiz and navigate to new quiz
    resetQuiz();
    if (pendingQuiz) {
      window.location.href = `/category/${pendingQuiz.id}`;
    }
  };

  const getQuizProgress = () => {
    // This would need to be passed as props or accessed from context
    // For now, we'll use a placeholder
    return 0;
  };

  const getQuizScore = () => {
    // This would need to be passed as props or accessed from context
    // For now, we'll use a placeholder
    return 0;
  };

  if (suggestedCategories.length === 0) return null;

  return (
    <>
      <div className={styles.suggestionsContainer}>
        <div className={styles.suggestionsHeader}>
          <h2 className={styles.suggestionsTitle}>
            🎯 You May Also Like
          </h2>
          <p className={styles.suggestionsSubtitle}>
            Discover more quizzes tailored for you
          </p>
        </div>
        
        <div className={styles.suggestionsGrid}>
          {suggestedCategories.map((quiz) => (
            <div
              key={quiz.id}
              className={styles.suggestionCard}
              onClick={(e) => handleQuizClick(e, quiz)}
            >
              <div className={styles.suggestionImage}>
                <SuggestionImage 
                  src={quiz.image} 
                  alt={quiz.topic} 
                  emoji={quiz.emoji} 
                />
              </div>
              
              <div className={styles.suggestionContent}>
                <h3 className={styles.suggestionQuizTitle}>{quiz.topic}</h3>
                <p className={styles.suggestionDescription}>
                  {quiz.description || 'Test your knowledge with this engaging quiz'}
                </p>
                <div className={styles.suggestionMeta}>
                  <span className={styles.suggestionQuestions}>
                    📝 {quiz.questions?.length || 0} questions
                  </span>
                  <span className={styles.suggestionDifficulty}>
                    {quiz.difficulty || 'Medium'}
                  </span>
                </div>
                <button className={styles.suggestionButton}>
                  Start Quiz →
                </button>
              </div>
            </div>
          ))}
        </div>
        
        <div className={styles.suggestionsFooter}>
          <a href="/" className={styles.browseAllLink}>
            🗺️ Browse All Categories
          </a>
        </div>
      </div>

      {/* Warning Modal for Quiz Switch */}
      <ExitConfirmModal
        isOpen={showWarningModal}
        onClose={() => setShowWarningModal(false)}
        onConfirm={handleConfirmSwitch}
        progress={getQuizProgress()}
        score={getQuizScore()}
        totalQuestions={currentCategory?.questions?.length || 0}
        customTitle="Switch Quiz?"
        customMessage="Are you sure you want to switch to another quiz? Your current progress will be lost."
        confirmText="Yes, Switch Quiz"
      />
    </>
  );
}
