"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useQuiz } from "@/context/QuizContext";
import { useData } from "@/context/DataContext";
import Timer from "@/components/Timer";
import QuestionCard from "@/components/QuestionCard";
import ProgressBar from "@/components/ProgressBar";
import QuizSidebar from "@/components/QuizSidebar";
import QuizSuggestions from "@/components/QuizSuggestions";
import ExitConfirmModal from "@/components/ExitConfirmModal";
import styles from "@/styles/QuizEngine.module.css";
import { initSounds, playCorrectSound, playWrongSound } from "@/lib/sounds";

export default function QuizEngine() {
  const router = useRouter();
  const params = useParams();
  const { data: session } = useSession();
  const { quizzes } = useData();
  
  const {
    status,
    questions,
    currentIndex,
    score,
    timerSetting,
    submitAnswer,
    isPaused,
    pauseQuiz,
    resumeQuiz,
    soundEnabled,
    toggleSound,
    isFullscreen,
    setFullscreen,
    isTranslating,
    language,
    translateTarget,
    translatedStory,
    toggleLanguage,
    fontScale,
    toggleFontSize,
    finishQuiz,
    updateScore,
    goToQuestion,
    resetQuiz,
    answers,
  } = useQuiz();

  const [favouriteIds, setFavouriteIds] = useState(null);
  const [showStory, setShowStory] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);
  const [referrer, setReferrer] = useState(null);
  
  // New feature states
  const [showHint, setShowHint] = useState(false);
  const [used5050, setUsed5050] = useState(false);
  const [usedAskAudience, setUsedAskAudience] = useState(false);
  const [removedOptions, setRemovedOptions] = useState([]);
  const [audienceStats, setAudienceStats] = useState(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportData, setReportData] = useState({ questionId: null, issue: '' });
  const [celebrationAnimation, setCelebrationAnimation] = useState(false);
  const [questionTransition, setQuestionTransition] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showEndConfirmModal, setShowEndConfirmModal] = useState(false);
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());

  const category = useMemo(() => {
    return (quizzes || []).find((q) => q.id === params?.id);
  }, [quizzes, params?.id]);

  const storyTextToDisplay = useMemo(() => {
    return translatedStory || category?.storyText;
  }, [translatedStory, category?.storyText]);

  const storyPreviewText = useMemo(() => {
    const raw = storyTextToDisplay?.trim();
    if (!raw) return "";
    return raw.replace(/\n+/g, " ");
  }, [storyTextToDisplay]);

  const hasStory = useMemo(() => {
    return !!(storyTextToDisplay?.trim() || category?.storyImage);
  }, [storyTextToDisplay, category?.storyImage]);

  const storyHeading = useMemo(() => {
    if (language === "hi") return `${category?.topic} - संक्षिप्त कहानी`;
    return `${category?.topic} - Short Story`;
  }, [category?.topic, language]);

  const sidebarTitle = useMemo(() => {
    if (language === "hi") return "प्रश्नोत्तरी कहानी पढ़ें";
    return "Read Quiz Story";
  }, [language]);

  const sidebarHint = useMemo(() => {
    if (language === "hi") return "पढ़ने के लिए क्लिक करें";
    return "Click to pause and read";
  }, [language]);

  const continueBtnText = useMemo(() => {
    if (language === "hi") return "प्रश्नोत्तरी जारी रखें";
    return "Continue Quiz";
  }, [language]);

  // Initialize sounds
  useEffect(() => {
    initSounds();
  }, []);

  // Load user's favourite question IDs once
  useEffect(() => {
    if (session?.user && !session.user.isAdmin) {
      fetch("/api/favourites")
        .then((r) => r.ok ? r.json() : [])
        .then((data) => {
          const ids = new Set(data.map((f) => f.questionId));
          setFavouriteIds(ids);
        })
        .catch(() => setFavouriteIds(new Set()));
    }
  }, [session]);

  // Redirect if quiz is finished or idle
  useEffect(() => {
    // Only redirect if status is idle and we're not just mounting
    const timer = setTimeout(() => {
      if (status === "idle") {
        router.replace("/");
      }
    }, 2000); 
    
    return () => clearTimeout(timer);
  }, [status, router]);

  // Fullscreen effect
  useEffect(() => {
    const handleFullscreenChange = () => {
      setFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, [setFullscreen]);

  // Manually move to next question
  const moveToNextQuestion = useCallback(() => {
    if (currentIndex < (questions?.length || 0) - 1) {
      goToQuestion(currentIndex + 1);
    } else {
      finishQuiz();
      router.push("/results"); // Redirect immediately
    }
  }, [currentIndex, questions?.length, goToQuestion, finishQuiz, router]);

  // Initialize quiz start time
  useEffect(() => {
    if (!window.quizStartTime && status === 'active') {
      window.quizStartTime = Date.now();
    }
    
    // Set up global function for next question
    window.onNextQuestion = () => {
      // Reset lifelines for next question
      setShowHint(false);
      setUsed5050(false);
      setUsedAskAudience(false);
      setShowExplanation(false);
      setAudienceStats(null);
      setRemovedOptions([]);
      
      // Move to next question
      moveToNextQuestion();
    };
    
    return () => {
      delete window.onNextQuestion;
    };
  }, [status, currentIndex, questions?.length, moveToNextQuestion]);

  // Reset question start time when question changes
  useEffect(() => {
    setQuestionStartTime(Date.now());
    setIsSubmitting(false);
    
    // Reset revealed state for new question
    if (window.QuestionCardRef) {
      window.QuestionCardRef.resetQuestion();
    }
  }, [currentIndex]);

  // Capture referrer on component mount
  useEffect(() => {
    const referrerUrl = document.referrer;
    const fromStorage = sessionStorage.getItem('quizReferrer');
    
    if (fromStorage) {
      setReferrer(fromStorage);
      sessionStorage.removeItem('quizReferrer');
    } else if (referrerUrl && referrerUrl.includes(window.location.origin)) {
      setReferrer(referrerUrl);
    } else {
      setReferrer('/');
    }
  }, []);

  // Navigation handlers for sidebar
  const handleGoBack = useCallback(() => {
    if (currentIndex > 0) {
      goToQuestion(currentIndex - 1);
    }
  }, [currentIndex, goToQuestion]);

  const handleNavigateToQuestion = useCallback((questionIndex) => {
    if (questionIndex <= currentIndex) {
      goToQuestion(questionIndex);
    }
  }, [currentIndex, goToQuestion]);

  const handleResumeQuiz = useCallback(() => {
    // Find the next unanswered question
    const nextUnansweredIndex = questions.findIndex((q, index) => 
      index > currentIndex && q.userAnswer === undefined
    );
    
    if (nextUnansweredIndex !== -1) {
      goToQuestion(nextUnansweredIndex);
    } else if (currentIndex < questions.length - 1) {
      // If no unanswered questions found, go to next question
      goToQuestion(currentIndex + 1);
    }
  }, [currentIndex, questions, goToQuestion]);

  const handleExitQuiz = useCallback(() => {
    setShowExitModal(true);
  }, []);

  const confirmExitQuiz = useCallback(() => {
    resetQuiz();
    if (referrer) {
      router.push(referrer);
    } else {
      const categoryId = params?.id;
      if (categoryId) router.push(`/category/${categoryId}`);
      else router.push('/');
    }
  }, [resetQuiz, referrer, router, params?.id]);

  // Set up global navigation handlers
  useEffect(() => {
    window.onGoBack = handleGoBack;
    window.onNavigateToQuestion = handleNavigateToQuestion;
    window.onResumeQuiz = handleResumeQuiz;
    window.onExitQuiz = handleExitQuiz;
    
    return () => {
      delete window.onGoBack;
      delete window.onNavigateToQuestion;
      delete window.onResumeQuiz;
      delete window.onExitQuiz;
    };
  }, [handleGoBack, handleNavigateToQuestion, handleResumeQuiz, handleExitQuiz]);



  const handleEndQuiz = () => {
    setShowEndConfirmModal(true);
  };

  const confirmEndQuiz = () => {
    setShowEndConfirmModal(false);
    
    // Check if user has answered at least one question
    const attemptedCount = (answers || []).length;
    
    if (attemptedCount > 0) {
      finishQuiz();
      router.push("/results"); // Redirect immediately
    } else {
      // If no questions attempted, just exit to home
      resetQuiz();
      router.push("/");
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else if (document.exitFullscreen) {
      document.exitFullscreen();
    }
  };

  // Hint System
  const useHint = () => {
    setShowHint(true);
    if (score > 5) updateScore(-5);
  };

  // 50/50 Lifeline
  const use5050 = () => {
    if (used5050) return;
    const currentQuestion = questions[currentIndex];
    if (!currentQuestion) return;
    const correctAnswerText = String(currentQuestion.correctAnswer || "").trim();
    const correctAnswerIndex = currentQuestion.options.findIndex(option => 
      String(option || "").trim() === correctAnswerText
    );
    const wrongAnswers = currentQuestion.options.map((_, idx) => idx).filter(idx => idx !== correctAnswerIndex);
    const toRemove = wrongAnswers.sort(() => Math.random() - 0.5).slice(0, 2);
    setUsed5050(true);
    updateScore(-3);
    setRemovedOptions(toRemove);
  };

  // Ask Audience
  const useAskAudience = () => {
    if (usedAskAudience) return;
    const currentQuestion = questions[currentIndex];
    if (!currentQuestion) return;
    const correctAnswerText = String(currentQuestion.correctAnswer || "").trim();
    const correctAnswerIndex = currentQuestion.options.findIndex(option => 
      String(option || "").trim() === correctAnswerText
    );
    const stats = currentQuestion.options.map((_, idx) => {
      if (idx === correctAnswerIndex) return Math.floor(Math.random() * 30) + 40;
      return Math.floor(Math.random() * 20) + 5;
    });
    const total = stats.reduce((sum, val) => sum + val, 0);
    const normalizedStats = stats.map(val => Math.round((val / total) * 100));
    setAudienceStats(normalizedStats);
    setUsedAskAudience(true);
    updateScore(-3);
  };

  const triggerCelebration = () => {
    setCelebrationAnimation(true);
    setTimeout(() => setCelebrationAnimation(false), 1000);
  };

  const triggerQuestionTransition = () => {
    setQuestionTransition(true);
    setTimeout(() => setQuestionTransition(false), 200); 
  };

  const handleSubmitAnswer = useCallback((answerIndex) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    
    const currentQuestion = questions[currentIndex];
    if (!currentQuestion) {
      setIsSubmitting(false);
      return;
    }
    
    // Normalize comparison for score calculation
    const selectedOptionText = answerIndex !== null ? String(currentQuestion.options[answerIndex] || "").trim() : "";
    const correctAnswerText = String(currentQuestion.correctAnswer || "").trim();
    const isCorrect = selectedOptionText === correctAnswerText;
    
    setShowExplanation(true);
    submitAnswer(currentQuestion.id, answerIndex);

    // Play sounds if enabled
    if (soundEnabled) {
      if (isCorrect) {
        playCorrectSound();
      } else {
        playWrongSound();
      }
    }

    setTimeout(() => {
      setShowHint(false);
      setUsed5050(false);
      setUsedAskAudience(false);
      setShowExplanation(false);
      setAudienceStats(null);
      setRemovedOptions([]);
      triggerQuestionTransition();
      moveToNextQuestion();
    }, 2000);
  }, [currentIndex, questions, submitAnswer, soundEnabled, moveToNextQuestion, showExplanation, isSubmitting]);

  const handleToggleStory = () => {
    if (!showStory) {
      pauseQuiz();
      setShowStory(true);
    } else {
      resumeQuiz();
      setShowStory(false);
    }
  };

  const currentQuestion = useMemo(() => {
    if (!questions || questions.length === 0) return null;
    
    // During active play, return current question
    if (status === "active") {
      return questions[currentIndex] || null;
    }
    
    // When finished, fallback to the last question so we can still render the background UI
    return questions[questions.length - 1];
  }, [questions, currentIndex, status]);

  const handleTimerExpire = useCallback(() => {
    if (status === "active") handleSubmitAnswer(null);
  }, [status, handleSubmitAnswer]);

  // Early return while loading or redirecting
  if (status === "idle" || !questions || questions.length === 0 || isTranslating) {
    const target = translateTarget || language;
    const loadingText = isTranslating
      ? target === "hi" ? "प्रश्नोत्तरी का हिंदी में अनुवाद किया जा रहा है..." : "Translating quiz to English..."
      : language === "hi" ? "प्रश्नोत्तरी लोड हो रही है..." : "Loading quiz...";
    return (
      <div className={styles.page}>
        <div className={styles.loadingContainer}>
          <p>{loadingText}</p>
          {isTranslating && <div className={styles.spinner}></div>}
        </div>
      </div>
    );
  }

  // Guard against crash if status is active but questions are missing
  if (status === "active" && (!questions || questions.length === 0)) {
    return (
      <div className={styles.page}>
        <div className={styles.loadingContainer}>
          <p>{language === "hi" ? "प्रश्नोत्तरी तैयार की जा रही है..." : "Preparing quiz..."}</p>
          <div className={styles.spinner}></div>
        </div>
      </div>
    );
  }

  return (
    <main
      className={`${styles.page} ${isFullscreen ? styles.fullscreen : ""}`}
      style={{ ["--quizFontScale"]: String(fontScale || 1) }}
    >
      <div className={styles.mainLayout}>
        <div className={styles.quizArea}>
          {/* Top Bar */}
          <div className={styles.topBar}>
            <div className={styles.topLeft}>
              <div className={styles.scoreInfo}>
                <span className={styles.scoreLabel}>{language === "hi" ? "स्कोर" : "Score"}</span>
                <span className={styles.scoreValue}>{score}</span>
              </div>
            </div>
            <div className={styles.topCenter}>
              {timerSetting > 0 && status === "active" && currentQuestion && (
                <Timer
                  seconds={timerSetting}
                  onExpire={handleTimerExpire}
                  questionKey={currentQuestion.id}
                  isPaused={isPaused || showStory}
                />
              )}
            </div>
            <div className={styles.topRight}>
              <div className={styles.topRightContent}>
                <span className={styles.questionCounter}>
                  {language === "hi" ? "प्रश्न" : "Question"} {currentIndex + 1} / {questions.length}
                </span>
                <button
                  className={styles.endQuizBtn}
                  onClick={handleEndQuiz}
                  title="End Quiz and see results"
                >
                  End Quiz
                </button>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className={styles.controls}>
            {/* 1. 50/50 Lifeline */}
            <button
              className={`${styles.controlBtn} ${used5050 ? styles.disabled : ""}`}
              onClick={use5050}
              disabled={used5050}
              title="50/50 Lifeline (-3 points)"
              data-icon="50/50"
            >
              50/50
            </button>
            
            {/* 2. Ask Audience */}
            <button
              className={`${styles.controlBtn} ${usedAskAudience ? styles.disabled : ""}`}
              onClick={useAskAudience}
              disabled={usedAskAudience}
              title="Ask Audience (-3 points)"
              data-icon="👥"
            >
              👥
            </button>
            
            {/* 3. Language Toggle */}
            <button
              className={`${styles.controlBtn} ${isTranslating ? styles.loading : ""}`}
              onClick={() => toggleLanguage(category?.storyText)}
              title={language === "hi" ? "Switch to English" : "Switch to Hindi"}
              data-icon="🌐"
              disabled={isTranslating}
            >
              {isTranslating ? "⌛" : "🌐"}
            </button>

            {/* 4. Font Size */}
            <button
              className={styles.controlBtn}
              onClick={toggleFontSize}
              title="Adjust font size"
              data-icon="Aa"
            >
              Aa
            </button>
            
            {/* 5. Sound Toggle */}
            <button 
              className={`${styles.controlBtn} ${!soundEnabled ? styles.disabled : ""}`} 
              onClick={toggleSound}
              title={soundEnabled ? "Disable Sound" : "Enable Sound"}
              data-icon={soundEnabled ? "🔊" : "🔇"}
            >
              {soundEnabled ? "🔊" : "🔇"}
            </button>
            
            {/* 6. Fullscreen Toggle */}
            <button 
              className={styles.controlBtn} 
              onClick={toggleFullscreen}
              title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
              data-icon={isFullscreen ? "↙️" : "↗️"}
            >
              {isFullscreen ? "↙️" : "↗️"}
            </button>
          </div>

          {/* Progress */}
          <ProgressBar current={currentIndex} total={questions.length} showPercentage={true} />

          {/* Question */}
          {currentQuestion && (
            <div className={`${isPaused || showStory ? styles.pausedContent : ""} ${questionTransition ? styles.transitioning : ""}`}>
              <QuestionCard
                key={currentQuestion.id}
                question={currentQuestion}
                onAnswer={handleSubmitAnswer}
                favouriteIds={favouriteIds}
                quizId={params?.id}
                disabled={isPaused || showStory || status === "finished"}
                userAnswer={currentQuestion.userAnswer}
                showHint={showHint}
                removedOptions={removedOptions}
                audienceStats={audienceStats}
                showExplanation={showExplanation}
                explanation={currentQuestion.explanation}
              />
            </div>
          )}

          {/* Celebration Animation */}
          {celebrationAnimation && (
            <div className={styles.celebrationOverlay}>
              <div className={styles.celebrationEffect}>
                🎉 Correct! 🎉
              </div>
            </div>
          )}
        </div>

        {/* Quiz Sidebar */}
        <QuizSidebar
          category={category}
          questions={questions}
          currentIndex={currentIndex}
          score={score}
          timerSetting={timerSetting}
          isPaused={isPaused || showStory}
          pauseQuiz={pauseQuiz}
          resumeQuiz={resumeQuiz}
        />
      </div>

      {/* Story Overlay */}
      {showStory && (
        <div className={styles.storyOverlay} onClick={handleToggleStory}>
          <div className={`${styles.storyModal} glass-card`} onClick={(e) => e.stopPropagation()}>
            <button className={styles.closeBtn} onClick={handleToggleStory}>✕</button>
            <div className={styles.storyContent}>
              {category?.storyImage && (
                <img src={category.storyImage} alt="Story" className={styles.storyImage} />
              )}
              <h2 className={styles.storyHeading}>{storyHeading}</h2>
              <div className={styles.storyText}>
                {storyTextToDisplay?.split('\n').map((line, i) => (
                  <p key={i}>{line}</p>
                ))}
              </div>
              <button className={`btn-primary ${styles.continueBtn}`} onClick={handleToggleStory}>
                {continueBtnText}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Exit Confirmation Modal */}
      <ExitConfirmModal
        isOpen={showExitModal}
        onClose={() => setShowExitModal(false)}
        onConfirm={confirmExitQuiz}
        progress={questions.length > 0 ? Math.round(((currentIndex + 1) / questions.length) * 100) : 0}
        score={score}
        totalQuestions={questions.length}
      />

      {/* End Quiz Confirmation Modal */}
      {showEndConfirmModal && (
        <div className={styles.modalOverlay}>
          <div className={`${styles.exitModal} glass-card`}>
            <h2 className={styles.exitModalTitle}>⚠️ End Quiz?</h2>
            <p className={styles.exitModalText}>
              Are you sure you want to end the quiz now? 
              <br />
              { (answers || []).length > 0 
                ? `You have answered ${answers.length} question${answers.length === 1 ? '' : 's'}. Your results will be calculated.`
                : "You haven&apos;t answered any questions yet. Ending now will return you to the home page."
              }
            </p>
            <div className={styles.exitModalActions}>
              <button className={styles.exitModalCancel} onClick={() => setShowEndConfirmModal(false)}>
                Cancel
              </button>
              <button className={styles.exitModalConfirm} onClick={confirmEndQuiz}>
                Yes, End Quiz
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quiz Suggestions - Below Console */}
      <QuizSuggestions currentCategory={category} />
    </main>
  );
}
