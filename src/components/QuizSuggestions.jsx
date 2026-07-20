"use client";

import { useMemo, useState } from "react";
import { useData } from "@/context/DataContext";
import { useQuiz } from "@/context/QuizContext";
import ExitConfirmModal from "@/components/ExitConfirmModal";
import Image from "next/image";
import { Heart, Share2 } from "lucide-react";
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

  const [visibleCount, setVisibleCount] = useState(4);

  // Get available categories excluding current
  const availableQuizzes = useMemo(() => {
    if (!quizzes || !quizzes.length) return [];
    
    return quizzes.filter(q => 
      (!currentCategory || q.id !== currentCategory.id) && 
      !q.hidden && 
      q.questions && 
      q.questions.length > 0
    );
  }, [quizzes, currentCategory]);

  const displayedCategories = useMemo(() => {
    return availableQuizzes.slice(0, visibleCount);
  }, [availableQuizzes, visibleCount]);

  const handleQuizClick = (e, quiz) => {
    e.preventDefault();
    
    if (isQuizActive) {
      // Show warning modal if quiz is active
      setPendingQuiz(quiz);
      setShowWarningModal(true);
    } else {
      // Navigate directly if no active quiz
      window.location.href = `/category/${quiz.slug || quiz.id}`;
    }
  };

  const handleConfirmSwitch = () => {
    // Reset current quiz and navigate to new quiz
    resetQuiz();
    if (pendingQuiz) {
      window.location.href = `/category/${pendingQuiz.slug || pendingQuiz.id}`;
    }
  };

  const handleLoadMore = () => {
    setVisibleCount(prev => Math.min(prev + 4, availableQuizzes.length));
  };

  if (availableQuizzes.length === 0) return null;

  const hasMore = visibleCount < availableQuizzes.length;

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
          {displayedCategories.map((quiz) => (
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
                <div className={styles.cardActions}>
                  <button 
                    className={styles.iconBtn} 
                    onClick={(e) => {
                      e.stopPropagation();
                      // Fav logic would go here
                    }}
                    title="Add to Favourites"
                  >
                    <Heart size={18} />
                  </button>
                  <button 
                    className={styles.iconBtn} 
                    onClick={(e) => {
                      e.stopPropagation();
                      if (navigator.share) {
                        navigator.share({
                          title: quiz.topic,
                          text: quiz.description,
                          url: `${window.location.origin}/category/${quiz.slug || quiz.id}`
                        });
                      }
                    }}
                    title="Share Quiz"
                  >
                    <Share2 size={18} />
                  </button>
                </div>
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
          {hasMore ? (
            <button 
              type="button" 
              onClick={handleLoadMore} 
              className={styles.browseAllLink}
            >
              🗺️ Browse All Categories ({availableQuizzes.length - visibleCount} more)
            </button>
          ) : (
            <div className={styles.allLoadedBadge}>
              ✨ All {availableQuizzes.length} categories loaded
            </div>
          )}
        </div>
      </div>

      {/* Warning Modal for Quiz Switch */}
      <ExitConfirmModal
        isOpen={showWarningModal}
        onClose={() => setShowWarningModal(false)}
        onConfirm={handleConfirmSwitch}
        progress={0}
        score={0}
        totalQuestions={currentCategory?.questions?.length || 0}
        customTitle="Switch Quiz?"
        customMessage="Are you sure you want to switch to another quiz? Your current progress will be lost."
        confirmText="Yes, Switch Quiz"
      />
    </>
  );
}
