"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useQuiz } from "@/context/QuizContext";
import { useData } from "@/context/DataContext";
import Timer from "@/components/Timer";
import QuestionCard from "@/components/QuestionCard";
import ProgressBar from "@/components/ProgressBar";
import styles from "@/styles/QuizEngine.module.css";

export default function QuizEngine() {
  const router = useRouter();
  const params = useParams();
  const { data: session } = useSession();
  const { quizzes } = useData();
  const [favouriteIds, setFavouriteIds] = useState(null);
  const [showStory, setShowStory] = useState(false);

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
  } = useQuiz();

  const category = useMemo(() => {
    return quizzes.find((q) => q.id === params?.id);
  }, [quizzes, params?.id]);

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

  // Redirect if no active quiz
  useEffect(() => {
    if (status === "idle") {
      router.replace("/");
    }
    if (status === "finished") {
      router.replace("/results");
    }
  }, [status, router]);

  // Fullscreen effect
  useEffect(() => {
    const handleFullscreenChange = () => {
      setFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, [setFullscreen]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

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

  const handleToggleStory = () => {
    if (!showStory) {
      pauseQuiz();
      setShowStory(true);
    } else {
      resumeQuiz();
      setShowStory(false);
    }
  };

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

  if (status !== "active" || questions.length === 0 || isTranslating) {
    const target = translateTarget || language;
    const loadingText = isTranslating
      ? target === "hi"
        ? "प्रश्नोत्तरी का हिंदी में अनुवाद किया जा रहा है..."
        : "Translating quiz to English..."
      : language === "hi"
        ? "प्रश्नोत्तरी लोड हो रही है..."
        : "Loading quiz...";

    return (
      <div className={styles.loading}>
        <div className={styles.loadingContent}>
          <p>{loadingText}</p>
          {isTranslating && <div className={styles.spinner}></div>}
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];

  const handleAnswer = (selected) => {
    submitAnswer(currentQuestion.id, selected);
  };

  const handleTimerExpire = () => {
    submitAnswer(currentQuestion.id, null);
  };

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
              {timerSetting > 0 && (
                <Timer
                  seconds={timerSetting}
                  onExpire={handleTimerExpire}
                  questionKey={currentQuestion.id}
                  isPaused={isPaused || showStory}
                />
              )}
            </div>
            <div className={styles.topCenter}>
              <span className={styles.questionCounter}>
                {language === "hi" ? "प्रश्न" : "Question"} {currentIndex + 1} / {questions.length}
              </span>
            </div>
            <div className={styles.topRight}>
              <div className={styles.controls}>
                <button
                  className={styles.controlBtn}
                  onClick={toggleFontSize}
                  title="Adjust font size"
                >
                  A
                </button>
                <button
                  className={styles.controlBtn}
                  onClick={() => toggleLanguage(storyTextToDisplay)}
                  title={language === "hi" ? "Switch to English" : "Switch to Hindi"}
                >
                  {language === "hi" ? "EN" : "हि"}
                </button>
                <button 
                  className={`${styles.controlBtn} ${!soundEnabled ? styles.disabled : ""}`} 
                  onClick={toggleSound}
                  title={soundEnabled ? "Disable Sound" : "Enable Sound"}
                >
                  {soundEnabled ? "🔊" : "🔇"}
                </button>
                <button 
                  className={styles.controlBtn} 
                  onClick={toggleFullscreen}
                  title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
                >
                  {isFullscreen ? "↙️" : "↗️"}
                </button>
              </div>
              <div className={styles.scoreInfo}>
                <span className={styles.scoreLabel}>{language === "hi" ? "स्कोर" : "Score"}</span>
                <span className={styles.scoreValue}>{score}</span>
              </div>
            </div>
          </div>

          {/* Progress */}
          <ProgressBar current={currentIndex} total={questions.length} />

          {/* Question */}
          <div className={isPaused || showStory ? styles.pausedContent : ""}>
            <QuestionCard
              key={currentQuestion.id}
              question={currentQuestion}
              onAnswer={handleAnswer}
              favouriteIds={favouriteIds}
              quizId={params?.id}
              disabled={isPaused || showStory}
            />
          </div>
        </div>

        {/* Story Sidebar */}
        {hasStory && (
          <aside className={styles.sidebar}>
            <div className={`${styles.storyCard} glass-card`}>
              {category?.storyImage && (
                <img
                  src={category.storyImage}
                  alt=""
                  className={styles.storyPreviewImage}
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              )}
              <div className={styles.storyPreviewBody}>
                <h3 className={styles.storyTitle}>{sidebarTitle}</h3>
                {storyPreviewText ? (
                  <p className={styles.storyPreviewText}>{storyPreviewText}</p>
                ) : (
                  <p className={styles.storyHint}>{sidebarHint}</p>
                )}
                <button
                  type="button"
                  className={styles.knowMoreBtn}
                  onClick={handleToggleStory}
                >
                  Know More
                </button>
              </div>
            </div>
          </aside>
        )}
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
    </main>
  );
}
