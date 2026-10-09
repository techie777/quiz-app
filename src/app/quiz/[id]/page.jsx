"use client";

import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useQuiz } from "@/context/QuizContext";
import { useData } from "@/context/DataContext";
import { useUI } from "@/context/UIContext";
import QuestionCardV2 from "@/components/QuestionCardV2";
import ProgressBar from "@/components/ProgressBar";
import QuizSidebar from "@/components/QuizSidebar";
import QuizSuggestions from "@/components/QuizSuggestions";
import ExitConfirmModal from "@/components/ExitConfirmModal";
import EndQuizConfirmModal from "@/components/EndQuizConfirmModal";
import ErrorBoundary from "@/components/ErrorBoundary";
import {
  BookOpen,
  MoreHorizontal,
  Settings,
  Users,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  LogOut,
  ArrowLeft,
  ArrowRight,
  Heart,
  Layers,
  Zap,
  X,
} from "lucide-react";
import styles from "@/styles/QuizEngine.module.css";
import timerStyles from "@/styles/Timer.module.css";
import { initSounds, playCorrectSound, playWrongSound, playTickerSound } from "@/lib/sounds";
import toast from "react-hot-toast";
import { useTier } from "@/context/TierContext";
import { useEntitlement } from "@/context/EntitlementContext";
import MascotAvatar from "@/components/quiz/MascotAvatar";
import MascotPlayer from "@/components/quiz/MascotPlayer";
import MascotStreakToast from "@/components/quiz/MascotStreakToast";
import { getMascotForCategory, stopMascotSpeech } from "@/config/mascots";
import Link from "next/link";
import { showRewarded } from "@/lib/adProvider";
import SetPreviewModal from "@/components/SetPreviewModal";
import QuizFlashcardDeck from "@/components/quiz/QuizFlashcardDeck";
import QuizReadModeView from "@/components/quiz/QuizReadModeView";

// Persistent-Fix Local Timer Component
const QuizTimerComponent = ({ seconds, onExpire, onTimeLow, questionKey, isPaused }) => {
  const [timeLeft, setTimeLeft] = useState(seconds);
  const timerRef = useRef(null);

  useEffect(() => {
    setTimeLeft(seconds);
  }, [questionKey, seconds]);

  useEffect(() => {
    if (isPaused) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    if (timeLeft <= 0) {
      onExpire();
      return;
    }
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        if (prev <= 6) { // Plays at 5, 4, 3, 2, 1
          playTickerSound();
          onTimeLow?.();
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [timeLeft === 0, questionKey, isPaused, onExpire]);

  const progress = (timeLeft / seconds) * 100;
  const radius = 24;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;
  const isTimeLow = timeLeft <= 5;
  const displayMins = String(Math.floor(timeLeft / 60)).padStart(2, "0");
  const displaySecs = String(timeLeft % 60).padStart(2, "0");

  // Shift colour purple -> amber -> red as time runs low
  let ringColor = "#8b5cf6"; // purple
  if (timeLeft <= 5 || (seconds > 0 && timeLeft / seconds <= 0.25)) {
    ringColor = "#ef4444"; // red
  } else if (timeLeft <= 10 || (seconds > 0 && timeLeft / seconds <= 0.5)) {
    ringColor = "#f59e0b"; // amber
  }

  return (
    <div className={`${timerStyles.timerContainer} ${isTimeLow ? timerStyles.low : ""}`}>
      <svg className={timerStyles.timerRing} width="60" height="60">
        <circle className={timerStyles.ringTrack} cx="30" cy="30" r={radius} />
        <circle
          className={timerStyles.ringFill}
          cx="30" cy="30" r={radius}
          style={{
            stroke: ringColor,
            strokeDasharray: circumference,
            strokeDashoffset: isNaN(offset) ? 0 : offset
          }}
        />
      </svg>
      <div className={timerStyles.timeDisplay} style={{ color: ringColor }}>
        {displayMins}:{displaySecs}
      </div>
    </div>
  );
};

// Ad Simulation Overlay Component
const AdOverlay = ({ onComplete }) => {
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => setCountdown(c => c - 1), 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  return (
    <div className={styles.adOverlay}>
      <div className={`${styles.adContent} glass-card`}>
        <div className={styles.adHeader}>
          <span className={styles.adBadge}>ADVERTISEMENT</span>
          <div className={styles.adTimer}>
            {countdown > 0 ? `Wait ${countdown}s` : (
              <button className={styles.adCloseBtn} onClick={onComplete}>
                Close ×
              </button>
            )}
          </div>
        </div>
        <div className={styles.adBody}>
          <div className={styles.adPlaceholder}>
             <h3>Unlock Lifeline</h3>
             <p>Support us by watching this short ad simulation.</p>
             <div className={styles.adVisual}>
                <div className={styles.adPulse} />
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function QuizEngine() {
  return (
    <ErrorBoundary>
      <QuizEngineContent />
    </ErrorBoundary>
  );
}

function QuizEngineContent() {
  const router = useRouter();
  console.log("Quiz Console Initializing...");
  const params = useParams();
  const searchParams = useSearchParams();
  const setQueryParam = searchParams?.get("set");
  const { data: session } = useSession();
  const { quizzes } = useData();
  const { tier } = useTier();
  const { recordFirstAnswer } = useEntitlement();
  
  const {
    quizId,
    quizSlug,
    selectedSetIndex,
    status,
    questions,
    originalQuestions,
    currentIndex,
    score,
    timerSetting,
    startQuiz,
    startQuizSet,
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
    setLanguage,
    translateTarget,
    translatedStory,
    fontScale,
    toggleFontSize,
    finishQuiz,
    updateScore,
    goToQuestion,
    resetQuiz,
    answers,
    isMixedMode,
    mixedSectionName,
  } = useQuiz();

  const [favouriteIds, setFavouriteIds] = useState(null);
  const [showStory, setShowStory] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);
  const [showReadModal, setShowReadModal] = useState(false);
  const initialMode = searchParams?.get("mode") || "quiz";
  const [activeMode, setActiveMode] = useState(
    initialMode === "flashcard" ? "flashcard" : initialMode === "read" ? "read" : "quiz"
  );
  const [referrer, setReferrer] = useState(null);
  
  // New feature states
  const [showHint, setShowHint] = useState(false);
  const [used5050, setUsed5050] = useState(false);
  const [usedAskAudience, setUsedAskAudience] = useState(false);
  const [removedOptions, setRemovedOptions] = useState([]);
  const [audienceStats, setAudienceStats] = useState(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [explanationMode, setExplanationMode] = useState("overlay");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("quiz_explanation_pref");
      if (saved) setExplanationMode(saved);
    }
  }, []);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportData, setReportData] = useState({ questionId: null, issue: '' });
  const [celebrationAnimation, setCelebrationAnimation] = useState(false);
  const [questionTransition, setQuestionTransition] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showEndConfirmModal, setShowEndConfirmModal] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());
  const [searchQuestion, setSearchQuestion] = useState("");
  const [showingAd, setShowingAd] = useState(false);
  const [adCallback, setAdCallback] = useState(null);
  const [showMidQuizGate, setShowMidQuizGate] = useState(false);
  const [showResultGate, setShowResultGate] = useState(false);
  const [midQuizPassed, setMidQuizPassed] = useState(false);
  const [resultGatePassed, setResultGatePassed] = useState(false);
  const [lifelineEffect, setLifelineEffect] = useState(null); // '5050' or 'poll'
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const moreMenuRef = useRef(null);

  // Mascot interactive host state (Step 2: State Logic)
  const [mascotState, setMascotState] = useState('idle');
  const [consecutiveStreak, setConsecutiveStreak] = useState(0);
  const [showStreakToast, setShowStreakToast] = useState(false);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target)) {
        setShowMoreMenu(false);
      }
    };
    if (showMoreMenu) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [showMoreMenu]);
  
  // Prevent body scroll when in fullscreen
  useEffect(() => {
    if (isFullscreen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isFullscreen]);

  // Track free usage per session
  const [freeLifelinesUsed, setFreeLifelinesUsed] = useState({
    "50/50": false,
    "poll": false
  });

  const category = useMemo(() => {
    if (isMixedMode) return null;
    return (quizzes || []).find((q) => q.id === params?.id || q.slug === params?.id);
  }, [quizzes, params?.id, isMixedMode]);

  const mascot = useMemo(() => {
    return getMascotForCategory(category || quizSlug || params?.id, tier);
  }, [category, quizSlug, params?.id, tier]);

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
    if (isMixedMode) {
      if (language === "hi") return `मेगा मिक्स: ${mixedSectionName} - चुनौती`;
      return `Mega Mix: ${mixedSectionName} - Challenge`;
    }
    if (language === "hi") return `${category?.topic} - संक्षिप्त कहानी`;
    return `${category?.topic} - Short Story`;
  }, [category?.topic, language, isMixedMode, mixedSectionName]);

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

  const seedParam = searchParams?.get("seed");
  const challengerScoreParam = searchParams?.get("challengerScore");
  const challengerNameParam = searchParams?.get("challengerName") || "Friend";

  const [activeChallengeScore, setActiveChallengeScore] = useState(() => {
    if (challengerScoreParam) return Number(challengerScoreParam);
    if (typeof window !== "undefined") {
      try {
        const stored = JSON.parse(sessionStorage.getItem("quizweb_active_challenge") || "null");
        return stored?.challengerScore !== undefined ? Number(stored.challengerScore) : null;
      } catch { return null; }
    }
    return null;
  });

  const [isAutoLoading, setIsAutoLoading] = useState(false);
  const [autoLoadFailed, setAutoLoadFailed] = useState(false);

  // Auto-load set or quiz if accessed directly via URL, challenge link, or after browser refresh
  useEffect(() => {
    if (status !== "idle" || (questions && questions.length > 0) || isAutoLoading || autoLoadFailed || !params?.id) {
      return;
    }

    let isMounted = true;
    async function loadQuizDirectly() {
      setIsAutoLoading(true);
      try {
        const lang = language || (typeof window !== "undefined" && localStorage.getItem("app-language")) || "hi";
        // 1. Try fetching set questions
        const setRes = await fetch(`/api/gk/topic-sets?setId=${encodeURIComponent(params.id)}&language=${lang}`);
        if (setRes.ok) {
          const setData = await setRes.json();
          if (setData.questions && setData.questions.length > 0 && isMounted) {
            const seedNum = seedParam ? Number(seedParam) : undefined;
            if (challengerScoreParam) {
              try {
                sessionStorage.setItem("quizweb_active_challenge", JSON.stringify({
                  challengerScore: Number(challengerScoreParam),
                  challengerName: challengerNameParam,
                  totalQuestions: setData.questions.length,
                  setId: params.id,
                }));
                setActiveChallengeScore(Number(challengerScoreParam));
              } catch {}
            }
            startQuizSet(
              setData.set.id,
              setData.questions,
              30,
              lang,
              setData.set.number,
              setData.set.title || `Set ${setData.set.number}`,
              true,
              seedNum,
              setData.set.subjectId,
              setData.set.topicId
            );
            return;
          }
        }

        // 2. Try fetching category quiz questions
        const catRes = await fetch(`/api/categories/${encodeURIComponent(params.id)}`);
        if (catRes.ok) {
          const catData = await catRes.json();
          if (catData.questions && catData.questions.length > 0 && isMounted) {
            const seedNum = seedParam ? Number(seedParam) : undefined;
            if (setQueryParam) {
              const setIdx = Math.max(1, parseInt(setQueryParam, 10) || 1);
              const setSize = 20;
              const sliceStart = (setIdx - 1) * setSize;
              const setQuestions = catData.questions.slice(sliceStart, sliceStart + setSize);
              startQuizSet(
                catData.id || params.id,
                setQuestions.length > 0 ? setQuestions : catData.questions,
                30,
                lang,
                setIdx,
                `${catData.topic || "Quiz"} Set ${setIdx}`,
                true,
                seedNum
              );
            } else {
              startQuiz(params.id, "easy", 0, lang, true, seedNum);
            }
            return;
          }
        }

        if (isMounted) setAutoLoadFailed(true);
      } catch (err) {
        console.error("Direct quiz load error:", err);
        if (isMounted) setAutoLoadFailed(true);
      } finally {
        if (isMounted) setIsAutoLoading(false);
      }
    }

    loadQuizDirectly();
    return () => { isMounted = false; };
  }, [status, questions, params?.id, language, setQueryParam, seedParam, challengerScoreParam, challengerNameParam, startQuizSet, startQuiz, isAutoLoading, autoLoadFailed]);

  // Only redirect if status is idle, not currently auto-loading, and auto-load failed
  useEffect(() => {
    if (status === "idle" && autoLoadFailed) {
      const timer = setTimeout(() => {
        router.replace("/");
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [status, autoLoadFailed, router]);

  // Fullscreen effect
  useEffect(() => {
    const handleFullscreenChange = () => {
      setFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, [setFullscreen]);

  const activeSet = selectedSetIndex || Number(setQueryParam) || Math.floor((currentIndex || 0) / 20) + 1 || 1;
  const effectiveSetId = `${category?.slug || params?.id || "set"}_${activeSet}`;
  const isAdTier = tier === "explorer" || tier === "adults";
  const isDaily = String(quizId || "").startsWith("daily-") || String(category?.topic || "").includes("Daily");
  const isLockedSet = typeof window !== 'undefined' && (
    sessionStorage.getItem(`quiz_unlocked_via_ad_${effectiveSetId}`) === "true" ||
    sessionStorage.getItem("quiz_unlocked_via_ad") === effectiveSetId ||
    sessionStorage.getItem("current_quiz_is_locked") === "true" ||
    activeSet > 2
  );
  const requiresAdGates = isAdTier && !isDaily && isLockedSet;

  const QuizEngineTimer = QuizTimerComponent;
  const moveToNextQuestion = useCallback(() => {
    const totalQ = questions?.length || 0;
    const isHalfway = totalQ >= 10 && currentIndex === Math.floor(totalQ / 2) - 1;

    if (isHalfway && requiresAdGates && !midQuizPassed) {
      if (pauseQuiz) pauseQuiz();
      setShowMidQuizGate(true);
      return;
    }

    if (currentIndex < totalQ - 1) {
      goToQuestion(currentIndex + 1);
    } else {
      if (requiresAdGates && !resultGatePassed) {
        if (pauseQuiz) pauseQuiz();
        setShowResultGate(true);
        return;
      }
      finishQuiz();
      router.replace("/results");
    }
  }, [currentIndex, questions?.length, goToQuestion, finishQuiz, router, requiresAdGates, midQuizPassed, resultGatePassed, pauseQuiz]);

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

  useEffect(() => {
    setQuestionStartTime(Date.now());
    setIsSubmitting(false);
    setShowExplanation(false);
    if (explanationTimerRef.current) {
      clearTimeout(explanationTimerRef.current);
      explanationTimerRef.current = null;
    }
    setMascotState('idle');
    stopMascotSpeech();
  }, [currentIndex]);

  useEffect(() => {
    return () => {
      stopMascotSpeech();
    };
  }, []);

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
    setShowExitModal(false);
    if (typeof document !== "undefined" && document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
    resetQuiz();
    if (referrer) {
      router.push(referrer);
    } else {
      const categoryId = category?.slug || params?.id;
      if (categoryId && categoryId !== "arena" && categoryId !== "quick" && categoryId !== "mix" && categoryId !== "mixed") {
        router.push(`/category/${categoryId}`);
      } else if (categoryId === "arena") {
        router.push('/arena');
      } else {
        router.push('/');
      }
    }
  }, [resetQuiz, referrer, router, params?.id, category]);

  const handleSwitchMode = useCallback((mode) => {
    setActiveMode(mode);
    setShowReadModal(false);
    if (typeof window !== "undefined" && params?.id) {
      const activeSet = selectedSetIndex || Number(setQueryParam) || 1;
      window.history.replaceState(null, "", `/quiz/${params.id}?set=${activeSet}&mode=${mode}`);
    }
  }, [params?.id, selectedSetIndex, setQueryParam]);

  const handleGoToReadMode = useCallback(() => {
    handleSwitchMode("read");
  }, [handleSwitchMode]);

  // Sync mode from searchParams
  useEffect(() => {
    const modeParam = searchParams?.get("mode");
    if (modeParam === "read") {
      setActiveMode("read");
      setShowReadModal(false);
    } else if (modeParam === "flashcard") {
      setActiveMode("flashcard");
      setShowReadModal(false);
    } else if (modeParam === "quiz") {
      setActiveMode("quiz");
      setShowReadModal(false);
    }
  }, [searchParams]);

  // Ensure set and mode query parameters are always visible in the URL bar
  useEffect(() => {
    if (typeof window !== 'undefined' && params?.id) {
      const activeSet = selectedSetIndex || Number(setQueryParam) || Math.floor((currentIndex || 0) / 20) + 1 || 1;
      const expectedSearch = `?set=${activeSet}&mode=${activeMode}`;
      if (!window.location.search.includes("set=") || !window.location.search.includes("mode=")) {
        window.history.replaceState(null, "", `/quiz/${params.id}${expectedSearch}`);
      }
    }
  }, [params?.id, selectedSetIndex, setQueryParam, currentIndex, activeMode]);

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
    setIsEnding(true);
    
    // Check if user has answered at least one question
    const attemptedCount = (answers || []).length;
    
    if (attemptedCount > 0) {
      finishQuiz();
      router.replace("/results"); // Replace to prevent back button returning here
    } else {
      // If no questions attempted, just exit to home
      resetQuiz();
      router.replace("/");
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else if (document.exitFullscreen) {
      document.exitFullscreen();
    }
  };

  // Function to trigger ad simulation before lifeline
  const triggerAd = (callback) => {
    setAdCallback(() => callback);
    setShowingAd(true);
    pauseQuiz();
  };

  const handleAdComplete = () => {
    setShowingAd(false);
    resumeQuiz();
    if (adCallback) adCallback();
    setAdCallback(null);
  };

  // Hint System
  const useHint = () => {
    setShowHint(true);
    toast.success(tier === "kids" ? "Hint Unlocked! 💡" : "Hint Unlocked! (-5 points)", { icon: '💡' });
    if (tier !== "kids" && score > 5) updateScore(-5);
  };

  const triggerLifelineEffect = (type) => {
    setLifelineEffect(type);
    setTimeout(() => setLifelineEffect(null), 1500);
  };

  // 50/50 Lifeline
  const use5050 = () => {
    if (used5050) return;
    
    const execute5050 = () => {
      const currentQ = questions[currentIndex];
      if (!currentQ) return;
      const correctAnswerText = String(currentQ.correctAnswer || "").trim();
      const correctAnswerIndex = currentQ.options.findIndex(option => 
        String(option || "").trim() === correctAnswerText
      );
      const wrongAnswers = currentQ.options.map((_, idx) => idx).filter(idx => idx !== correctAnswerIndex);
      const toRemove = wrongAnswers.sort(() => Math.random() - 0.5).slice(0, 2);
      setUsed5050(true);
      if (tier !== "kids") updateScore(-3);
      setRemovedOptions(toRemove);
      setFreeLifelinesUsed(prev => ({ ...prev, "50/50": true }));
      triggerLifelineEffect('5050');
      toast.success(tier === "kids" ? "50:50 Helper Activated! ✂️" : "50:50 Activated! (-3 points)", { icon: '✂️' });
    };

    // Rule: 1 free per session. If used already, triggers Ad.
    if (!freeLifelinesUsed["50/50"]) {
       execute5050();
    } else {
       triggerAd(execute5050);
    }
  };

  // Ask Audience
  const handleAskAudience = () => {
    if (usedAskAudience) return;
    
    const executePoll = () => {
      const currentQ = questions[currentIndex];
      if (!currentQ) return;
      const correctAnswerText = String(currentQ.correctAnswer || "").trim();
      const correctAnswerIndex = currentQ.options.findIndex(option => 
        String(option || "").trim() === correctAnswerText
      );
      const stats = currentQ.options.map((_, idx) => {
        if (idx === correctAnswerIndex) return Math.floor(Math.random() * 30) + 40;
        return Math.floor(Math.random() * 20) + 5;
      });
      const total = stats.reduce((sum, val) => sum + val, 0);
      const normalizedStats = stats.map(val => Math.round((val / total) * 100));
      setAudienceStats(normalizedStats);
      setUsedAskAudience(true);
      if (tier !== "kids") updateScore(-3);
      setFreeLifelinesUsed(prev => ({ ...prev, "poll": true }));
      triggerLifelineEffect('poll');
      toast.success(tier === "kids" ? "Friends Poll Live! 👥" : "Audience Poll Live! (-3 points)", { icon: '👥' });
    };

    // Rule: 1 free per session.
    if (!freeLifelinesUsed["poll"]) {
      executePoll();
    } else {
      triggerAd(executePoll);
    }
  };

  const triggerCelebration = () => {
    setCelebrationAnimation(true);
    setTimeout(() => setCelebrationAnimation(false), 1000);
  };

  const triggerQuestionTransition = () => {
    setQuestionTransition(true);
    setTimeout(() => setQuestionTransition(false), 200); 
  };

  const explanationTimerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (explanationTimerRef.current) clearTimeout(explanationTimerRef.current);
    };
  }, []);

  const handleCloseExplanation = useCallback(() => {
    stopMascotSpeech();
    setMascotState('idle');
    if (explanationTimerRef.current) {
      clearTimeout(explanationTimerRef.current);
      explanationTimerRef.current = null;
    }
    setShowHint(false);
    setUsed5050(false);
    setUsedAskAudience(false);
    setShowExplanation(false);
    setAudienceStats(null);
    setRemovedOptions([]);
    triggerQuestionTransition();
    moveToNextQuestion();
  }, [moveToNextQuestion]);

  const handleToggleFastMode = useCallback(() => {
    setExplanationMode("fast");
    if (typeof window !== "undefined") {
      localStorage.setItem("quiz_explanation_pref", "fast");
    }
    toast.success(
      language === "hi"
        ? "⚡ फास्ट मोड चालू! व्याख्या देखने के लिए कभी भी 'पीछे' जा सकते हैं।"
        : "⚡ Fast Mode on! Press 'Back' anytime to review explanation.",
      { icon: "⚡", duration: 3000 }
    );
    handleCloseExplanation();
  }, [handleCloseExplanation, language]);

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
    
    // Step 2 State Logic:
    // 5-correct streak: celebrate (once)
    // Correct answer: correct (play once), then talking while explanation is read, then idle
    // Wrong answer: wrong (play once, encouraging not mocking), then talking, then idle
    if (isCorrect) {
      setConsecutiveStreak(prev => {
        const next = prev + 1;
        if (next >= 5) {
          setMascotState('celebrate');
        } else {
          setMascotState('correct');
        }
        return next;
      });
    } else {
      setMascotState('wrong');
      setConsecutiveStreak(0);
    }

    submitAnswer(currentQuestion.id, answerIndex);

    // Clear any active explanation timers
    if (explanationTimerRef.current) clearTimeout(explanationTimerRef.current);

    if (explanationMode === "overlay") {
      explanationTimerRef.current = setTimeout(() => {
        setShowExplanation(true);
      }, 550);
    } else {
      // Fast mode: auto-advance to next question after 1400ms, or user taps Next/Back
      explanationTimerRef.current = setTimeout(() => {
        moveToNextQuestion();
      }, 1400);
    }

    // Master prompt Step 10: "A set counts once the user answers its first question. Daily Quiz and Learn content are exempt."
    if ((answers || []).length === 0) {
      const activeSet = selectedSetIndex || Number(setQueryParam) || Math.floor((currentIndex || 0) / 20) + 1 || 1;
      const targetSetId = `${quizSlug || params?.id || quizId}-${activeSet}`;
      recordFirstAnswer?.({ setId: targetSetId, categoryId: quizSlug || params?.id, setIndex: activeSet });
    }

    // Play sounds if enabled
    if (soundEnabled) {
      if (isCorrect) {
        playCorrectSound();
      } else {
        playWrongSound();
      }
    }

    const isLastQuestion = currentIndex >= (questions?.length || 0) - 1;

    if (isLastQuestion) {
      toast.success(
        language === "hi" 
          ? "🎉 दौर समाप्त! आपके परिणाम अनलॉक किए जा रहे हैं..." 
          : "🎉 Challenge Complete! Unlocking your results...", 
        { icon: "🏁", duration: 2500 }
      );
    }
  }, [currentIndex, questions, submitAnswer, soundEnabled, isSubmitting, language, explanationMode, moveToNextQuestion]);

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

  // Navigation handlers for Sidebar
  const handleNavigate = useCallback((index) => {
    goToQuestion(index);
    setQuestionTransition(true);
    setTimeout(() => setQuestionTransition(false), 300);
  }, [goToQuestion]);

  const handleBack = useCallback(() => {
    if (currentIndex > 0) handleNavigate(currentIndex - 1);
  }, [currentIndex, handleNavigate]);

  const handleResume = useCallback(() => {
    if (currentIndex < questions.length - 1) handleNavigate(currentIndex + 1);
  }, [currentIndex, questions.length, handleNavigate]);

  const startTime = useMemo(() => Date.now(), []);

  const { engineTheme } = useUI();
  const themeClasses = {
    indigo: "theme-pattern-indigo",
    midnight: "theme-pattern-midnight text-white",
    sunset: "theme-pattern-sunset",
    emerald: "theme-pattern-emerald",
  };

  // Task 3.6: Themed loading screen with animations
  if (status === "idle" || !questions || questions.length === 0) {
    const loadingText = language === "hi" ? "प्रश्नोत्तरी लोड हो रही है..." : "Loading GK Test Engine...";
    const subText = language === "hi" ? "प्रश्नों को तैयार और शफल किया जा रहा है" : "Preparing questions & shuffling options...";
    return (
      <div className={`min-h-screen w-full flex flex-col items-center justify-center p-4 transition-all duration-500 ${themeClasses[engineTheme] || themeClasses.indigo}`}>
        <div className="relative flex flex-col items-center justify-center p-8 rounded-3xl bg-slate-900/95 border border-indigo-500/30 backdrop-blur-xl shadow-2xl space-y-5 max-w-sm w-full text-center overflow-hidden">
          {/* Ambient Glow */}
          <div className="absolute -top-12 -left-12 w-32 h-32 bg-indigo-500/20 rounded-full blur-2xl" />
          <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-purple-500/20 rounded-full blur-2xl" />
          
          {/* Animated Themed Icon / Ring */}
          <div className="relative w-20 h-20 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin" />
            <div className="absolute inset-2 rounded-full border-2 border-purple-500/20 border-b-purple-400 animate-spin" style={{ animationDirection: "reverse", animationDuration: "1.5s" }} />
            <span className="text-3xl select-none animate-pulse">🎯</span>
          </div>

          <div className="space-y-1 z-10">
            <h3 className="text-lg font-black text-white tracking-wide">{loadingText}</h3>
            <p className="text-xs font-medium text-slate-400">{subText}</p>
          </div>

          {/* Bouncing dots */}
          <div className="flex items-center justify-center gap-1.5 pt-1">
            <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: "0ms" }} />
            <div className="w-2 h-2 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: "150ms" }} />
            <div className="w-2 h-2 rounded-full bg-pink-500 animate-bounce" style={{ animationDelay: "300ms" }} />
          </div>
        </div>
      </div>
    );
  }

  // Guard against crash if status is active but questions are missing
  if (status === "active" && (!questions || questions.length === 0)) {
    return (
      <div className={`min-h-screen w-full flex flex-col items-center justify-center p-4 transition-all duration-500 ${themeClasses[engineTheme] || themeClasses.indigo}`}>
        <div className="flex flex-col items-center justify-center p-8 rounded-3xl bg-slate-900/90 border border-slate-800/80 backdrop-blur-md shadow-2xl space-y-4 max-w-sm w-full text-center">
          <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
          <p className="text-base font-bold text-white tracking-wide">{language === "hi" ? "प्रश्नोत्तरी तैयार की जा रही है..." : "Preparing quiz..."}</p>
        </div>
      </div>
    );
  }

  const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
  const displayTime = `${String(Math.floor(elapsedSeconds / 60)).padStart(2, "0")}:${String(elapsedSeconds % 60).padStart(2, "0")}`;

  return (
    <div className={`min-h-screen w-full transition-all duration-500 ${themeClasses[engineTheme] || themeClasses.indigo}`}>
      {isTranslating && (
        <div className={styles.translatingOverlay}>
          <div className={styles.translatingContent}>
            <div className={styles.translatingLoader}>
              <div className={styles.translatingCircle} />
              <span className={styles.translatingBrain}>🧠</span>
            </div>
            <div className={styles.translatingText}>
              {translateTarget === "hi" ? "अनुवाद किया जा रहा है..." : "Translating..."}
            </div>
            <div className={styles.translatingSub}>
              {translateTarget === "hi" ? "हिंदी संस्करण तैयार हो रहा है" : "Preparing English Version"}
            </div>
          </div>
        </div>
      )}
      <main
        className={`${styles.page} ${isFullscreen ? `${styles.fullscreen} ${themeClasses[engineTheme] || themeClasses.indigo}` : ""}`}
        style={{ ["--quizFontScale"]: String(fontScale || 1) }}
      >
        <div className={styles.mainLayout}>
          <div className={styles.quizArea}>
            {/* Task 3.7: 1v1 Challenger Banner */}
            {activeChallengeScore !== null && (
              <div className="w-full max-w-xl mx-auto mb-3 p-3 bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-red-500/20 border border-amber-500/40 rounded-2xl flex items-center justify-between gap-3 text-amber-200 text-xs sm:text-sm font-black shadow-lg backdrop-blur-md animate-pulse">
                <div className="flex items-center gap-2">
                  <span className="text-xl">⚔️</span>
                  <span>{language === "hi" ? `दोस्त की चुनौती: ${activeChallengeScore}/${questions.length} स्कोर किया!` : `Friend's Challenge: Scored ${activeChallengeScore}/${questions.length}!`}</span>
                </div>
                <span className="px-2.5 py-1 bg-amber-500 text-slate-950 font-black rounded-lg text-xs uppercase tracking-wider shrink-0">
                  {language === "hi" ? "हराओ इन्हें!" : "Beat Them!"}
                </span>
              </div>
            )}

            {/* Top Bar */}
            <div className={styles.topBar}>
              <div className={styles.topLeft}>
                {/* Back / Exit Quiz Button */}
                <button
                  type="button"
                  onClick={handleExitQuiz}
                  className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-slate-100 hover:bg-rose-50 dark:bg-slate-800 dark:hover:bg-rose-950/40 text-slate-600 hover:text-rose-600 dark:text-slate-300 dark:hover:text-rose-400 border border-slate-200/90 hover:border-rose-300 dark:border-slate-700 dark:hover:border-rose-800 transition-all shrink-0 active:scale-95 shadow-2xs cursor-pointer mr-0.5"
                  title={language === "hi" ? "क्विज़ छोड़ें / वापस जाएं" : "Exit Quiz / Go Back"}
                  aria-label="Exit Quiz"
                >
                  <ArrowLeft size={18} strokeWidth={2.4} />
                </button>
                <span className={styles.questionNumberBadge}>
                  Q{currentIndex + 1}/{questions.length}
                </span>
                <div className={styles.scoreInfo}>
                  <span className={styles.streakCount}>
                    {score} {language === "hi" ? "सही" : "Correct"}
                  </span>
                </div>
              </div>

              <div className={styles.topCenter} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', flexShrink: 0 }}>
                {tier !== "kids" && timerSetting > 0 && status === "active" && currentQuestion && (
                  <div className="shrink-0 flex items-center">
                    <QuizTimerComponent
                      seconds={timerSetting}
                      onExpire={handleTimerExpire}
                      onTimeLow={() => {
                        if (!showExplanation && !isSubmitting) {
                          setMascotState('thinking');
                        }
                      }}
                      questionKey={currentQuestion.id}
                      isPaused={isPaused || showStory || showExplanation || activeMode !== "quiz"}
                    />
                  </div>
                )}
              </div>

              <div className={styles.topRight}>
                <div className={styles.topRightControls}>
                  {/* Small Support Us tab at the top while playing (Rule E3 / Task 5.3) */}
                  {tier !== "kids" && (
                    <a
                      href="/support"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-black text-rose-500 hover:text-rose-600 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 transition-all shadow-2xs mr-1"
                      title={language === "hi" ? "QuizWeb का समर्थन करें" : "Support QuizWeb"}
                    >
                      <Heart size={11} fill="currentColor" />
                      <span>{language === "hi" ? "सहयोग" : "Support"}</span>
                    </a>
                  )}

                  {/* 50/50 Core Lifeline Button */}
                  <button
                    type="button"
                    className={`${styles.lifeline5050Btn} ${used5050 ? styles.disabled : ""}`}
                    onClick={use5050}
                    disabled={used5050}
                    title={tier === "kids" ? (language === "hi" ? "50/50 मदद" : "50/50 Helper") : "50/50 Lifeline (-3 points)"}
                  >
                    <span className={styles.lifelineIcon}>✂️</span>
                    <span className={styles.lifelineLabel}>50:50</span>
                  </button>

                  {/* Settings Menu Button */}
                  <div className={styles.moreMenuContainer} ref={moreMenuRef}>
                    <button
                      type="button"
                      className={`${styles.moreMenuBtn} ${showMoreMenu ? styles.active : ""} shrink-0 aspect-square`}
                      onClick={() => setShowMoreMenu(prev => !prev)}
                      title={language === "hi" ? "सेटिंग्स" : "Settings"}
                      aria-label="Settings"
                      aria-expanded={showMoreMenu}
                    >
                      <Settings size={18} />
                    </button>

                    {showMoreMenu && (
                      <div className={styles.moreDropdownMenu}>
                        <button
                          type="button"
                          className={styles.menuItem}
                          onClick={() => {
                            setShowMoreMenu(false);
                            handleAskAudience();
                          }}
                          disabled={usedAskAudience}
                        >
                          <Users size={16} />
                          <span>{language === "hi" ? "ऑडियंस पोल" : "Ask Audience"}</span>
                        </button>

                        <button
                          type="button"
                          className={styles.menuItem}
                          onClick={() => {
                            setShowMoreMenu(false);
                            handleGoToReadMode();
                          }}
                        >
                          <BookOpen size={16} />
                          <span>{language === "hi" ? "रीड मोड" : "Read Mode"}</span>
                        </button>

                        <button
                          type="button"
                          className={styles.menuItem}
                          onClick={() => {
                            setShowMoreMenu(false);
                            handleSwitchMode(activeMode === "flashcard" ? "quiz" : "flashcard");
                          }}
                        >
                          <Layers size={16} />
                          <span>{activeMode === "flashcard" ? (language === "hi" ? "क्विज़ मोड" : "Quiz Mode") : (language === "hi" ? "फ़्लैशकार्ड्स मोड" : "Flashcards Mode")}</span>
                        </button>

                        <button
                          type="button"
                          className={styles.menuItem}
                          onClick={() => {
                            toggleSound();
                          }}
                        >
                          {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
                          <span>{soundEnabled ? (language === "hi" ? "ध्वनि: चालू" : "Sound: On") : (language === "hi" ? "ध्वनि: बंद" : "Sound: Off")}</span>
                        </button>

                        <button
                          type="button"
                          className={styles.menuItem}
                          onClick={() => {
                            setShowMoreMenu(false);
                            toggleFullscreen();
                          }}
                        >
                          {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                          <span>{isFullscreen ? (language === "hi" ? "फुलस्क्रीन से बाहर" : "Exit Fullscreen") : (language === "hi" ? "फुलस्क्रीन" : "Fullscreen")}</span>
                        </button>

                        <button
                          type="button"
                          className={styles.menuItem}
                          onClick={() => {
                            const nextMode = explanationMode === "overlay" ? "fast" : "overlay";
                            setExplanationMode(nextMode);
                            if (typeof window !== "undefined") {
                              localStorage.setItem("quiz_explanation_pref", nextMode);
                            }
                            toast.success(
                              nextMode === "overlay"
                                ? (language === "hi" ? "📖 व्याख्या पॉपअप चालू" : "📖 Explanation Overlay On")
                                : (language === "hi" ? "⚡ फास्ट मोड चालू (पॉपअप बंद)" : "⚡ Fast Mode On (Popup Off)"),
                              { icon: nextMode === "overlay" ? "📖" : "⚡" }
                            );
                          }}
                        >
                          {explanationMode === "overlay" ? <Zap size={16} /> : <BookOpen size={16} />}
                          <span>
                            {explanationMode === "overlay"
                              ? (language === "hi" ? "व्याख्या पॉपअप: चालू" : "Explanation Popup: On")
                              : (language === "hi" ? "व्याख्या पॉपअप: बंद (फास्ट)" : "Explanation Popup: Off (Fast)")}
                          </span>
                        </button>

                        {tier !== "kids" && (
                          <a
                            href="/support"
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`${styles.menuItem} text-rose-500 hover:text-rose-600`}
                            onClick={() => setShowMoreMenu(false)}
                          >
                            <Heart size={16} fill="currentColor" />
                            <span>{language === "hi" ? "QuizWeb को सहयोग करें" : "Support QuizWeb"}</span>
                          </a>
                        )}

                        <div className={styles.menuDivider} />

                        <button
                          type="button"
                          className={`${styles.menuItem} ${styles.menuItemDanger}`}
                          onClick={() => {
                            setShowMoreMenu(false);
                            handleEndQuiz();
                          }}
                        >
                          <LogOut size={16} />
                          <span>{language === "hi" ? "क्विज़ समाप्त करें" : "End Quiz"}</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Mode Switcher Pill */}
            <div className="w-full flex items-center justify-between gap-2 my-2.5 px-0.5">
              <div className="inline-flex items-center p-1 rounded-2xl bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 backdrop-blur-md shadow-xs">
                <button
                  type="button"
                  onClick={() => handleSwitchMode("quiz")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                    activeMode === "quiz"
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  <span>🎯</span>
                  <span>{language === "hi" ? "क्विज़" : "Quiz"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSwitchMode("flashcard")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                    activeMode === "flashcard"
                      ? "bg-purple-600 text-white shadow-sm"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  <span>🗂️</span>
                  <span>{language === "hi" ? "फ़्लैशकार्ड्स" : "Flashcards"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSwitchMode("read")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                    activeMode === "read"
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  <span>📖</span>
                  <span>{language === "hi" ? "रीड मोड" : "Read"}</span>
                </button>
              </div>
            </div>

            {/* Mode Content: Read Mode OR Flashcard Deck OR Timed Quiz */}
            {activeMode === "read" ? (
              <QuizReadModeView
                questions={originalQuestions && originalQuestions.length > 0 ? originalQuestions : questions}
                categoryTopic={category?.topic || mixedSectionName || "Quiz"}
                setIndex={selectedSetIndex || Number(setQueryParam) || 1}
                language={language}
                onSwitchToQuiz={() => handleSwitchMode("quiz")}
                onSwitchToFlashcard={() => handleSwitchMode("flashcard")}
              />
            ) : activeMode === "flashcard" ? (
              <>
                <ProgressBar current={currentIndex} total={questions.length} showPercentage={false} />
                <QuizFlashcardDeck
                  questions={questions}
                  currentIndex={currentIndex}
                  onIndexChange={(newIdx) => {
                    goToQuestion?.(newIdx);
                  }}
                  categoryTopic={category?.topic || mixedSectionName || "Quiz"}
                  language={language}
                  onSwitchToQuiz={() => handleSwitchMode("quiz")}
                  onSwitchToRead={() => handleSwitchMode("read")}
                  onFinish={handleEndQuiz}
                />
              </>
            ) : (
              <>
                <ProgressBar current={currentIndex} total={questions.length} showPercentage={false} />
                {currentQuestion && (
                  <div className={`${isPaused || showStory ? styles.pausedContent : ""} ${questionTransition ? styles.transitioning : ""}`}>
                    <QuestionCardV2
                      key={currentQuestion.id}
                      question={currentQuestion}
                      onAnswer={handleSubmitAnswer}
                      favouriteIds={favouriteIds}
                      quizId={params?.id}
                      categoryName={
                        category?.topic ||
                        (category ? (language === "hi" ? category.nameHi || category.name : category.name || category.nameHi) : "") ||
                        mixedSectionName ||
                        ""
                      }
                      disabled={isPaused || showStory || status === "finished"}
                      userAnswer={currentQuestion.userAnswer}
                      showHint={showHint}
                      removedOptions={removedOptions}
                      audienceStats={audienceStats}
                      showExplanation={showExplanation}
                      onCloseExplanation={handleCloseExplanation}
                      onOpenExplanation={() => setShowExplanation(true)}
                      onToggleFastMode={handleToggleFastMode}
                      explanation={currentQuestion.explanation}
                      language={language}
                    />
                  </div>
                )}

                {/* Bottom Bar: ONLY Back and Next */}
                <div className={styles.quizBottomBar}>
                  <button
                    type="button"
                    className={styles.bottomNavBtn}
                    onClick={handleBack}
                    disabled={currentIndex === 0}
                    aria-label={language === "hi" ? "पिछला प्रश्न" : "Previous Question"}
                  >
                    <ArrowLeft size={18} />
                    <span>{language === "hi" ? "पीछे" : "Back"}</span>
                  </button>

                  <button
                    type="button"
                    className={`${styles.bottomNavBtn} ${styles.bottomNextBtn}`}
                    onClick={moveToNextQuestion}
                    aria-label={currentIndex >= questions.length - 1 ? (language === "hi" ? "समाप्त करें" : "Finish") : (language === "hi" ? "आगे" : "Next")}
                  >
                    <span>{currentIndex >= questions.length - 1 ? (language === "hi" ? "समाप्त करें" : "Finish") : (language === "hi" ? "आगे" : "Next")}</span>
                    <ArrowRight size={18} />
                  </button>
                </div>
              </>
            )}

            {/* Celebration Animation */}
            {celebrationAnimation && (
              <div className={styles.celebrationOverlay}>
                <div className={styles.celebrationEffect}>
                  🎉 Correct! 🎉
                </div>
              </div>
            )}

            {/* Lifeline Animation Effect */}
            {lifelineEffect && (
              <div className={styles.lifelineOverlay}>
                <div className={styles.lifelineAnimation}>
                  {lifelineEffect === '5050' ? '✂️ 50:50 Activated' : '👥 Audience Poll Live'}
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
          onNavigate={handleNavigate}
          onBack={handleBack}
          onResume={handleResume}
          onExit={handleEndQuiz}
          startTime={startTime}
          answers={answers}
          TimerComponent={QuizTimerComponent}
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
        progress={questions?.length ? Math.round(((currentIndex + 1) / questions.length) * 100) : 0}
        score={score}
        totalQuestions={questions?.length || 20}
      />

      {/* End Quiz Confirmation Modal */}
      <EndQuizConfirmModal
        isOpen={showEndConfirmModal}
        onClose={() => setShowEndConfirmModal(false)}
        onConfirm={confirmEndQuiz}
        answeredCount={answers ? answers.filter((a) => a !== undefined && a !== null).length : 0}
        totalQuestions={questions?.length || 20}
      />

      {isEnding && (
        <div className={styles.modalOverlay} style={{ zIndex: 10005, flexDirection: 'column', gap: '16px' }}>
          <div className={styles.spinner}></div>
          <p style={{ fontWeight: 'bold', fontSize: '1.2rem', color: 'var(--text-primary)' }}>
            Processing results...
          </p>
        </div>
      )}

      {/* Mid-Quiz Rewarded Ad Gate */}
      {showMidQuizGate && (
        <div
          role="dialog"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 99999,
            background: "rgba(15, 23, 42, 0.8)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
          }}
        >
          <div
            style={{
              background: "#FFFFFF",
              borderRadius: "20px",
              padding: "24px",
              maxWidth: "360px",
              width: "100%",
              textAlign: "center",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.2)",
            }}
          >
            <div style={{ fontSize: "36px", marginBottom: "12px" }}>🎯</div>
            <h3 style={{ fontSize: "18px", fontWeight: 700, color: "#1E293B", marginBottom: "6px" }}>
              {language === "hi" ? "आधा रास्ता तय हुआ!" : "Halfway There!"}
            </h3>
            <p style={{ fontSize: "13px", color: "#64748B", marginBottom: "20px", lineHeight: 1.5 }}>
              {language === "hi"
                ? "क्विज़ जारी रखने के लिए एक छोटा विज्ञापन देखें।"
                : "Watch a short ad to continue this quiz set."}
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <button
                type="button"
                onClick={() => {
                  showRewarded({
                    trigger: "mid",
                    tier,
                    setId: effectiveSetId,
                    onReward: () => {
                      setShowMidQuizGate(false);
                      setMidQuizPassed(true);
                      if (resumeQuiz) resumeQuiz();
                      goToQuestion(currentIndex + 1);
                    },
                    onDismiss: () => {
                      setShowMidQuizGate(false);
                      setMidQuizPassed(true);
                      if (resumeQuiz) resumeQuiz();
                      goToQuestion(currentIndex + 1);
                    },
                  });
                }}
                style={{
                  width: "100%",
                  padding: "12px",
                  background: "#4F46E5",
                  color: "#FFFFFF",
                  border: "none",
                  borderRadius: "12px",
                  fontWeight: 600,
                  fontSize: "14px",
                  cursor: "pointer",
                  minHeight: "44px",
                }}
              >
                {language === "hi" ? "छोटा विज्ञापन देखें (5s)" : "Watch a short ad to continue"}
              </button>

              <Link
                href="/pro"
                style={{
                  width: "100%",
                  padding: "12px",
                  background: "#EEF2FF",
                  color: "#4F46E5",
                  border: "1px solid #C7D2FE",
                  borderRadius: "12px",
                  fontWeight: 600,
                  fontSize: "14px",
                  textAlign: "center",
                  textDecoration: "none",
                  minHeight: "44px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {language === "hi" ? "गो प्रो, कोई विज्ञापन नहीं" : "Go Pro, no ads"}
              </Link>

              <button
                type="button"
                onClick={() => {
                  setShowMidQuizGate(false);
                  setMidQuizPassed(true);
                  if (resumeQuiz) resumeQuiz();
                  goToQuestion(currentIndex + 1);
                }}
                style={{
                  width: "100%",
                  padding: "10px",
                  background: "#F1F5F9",
                  color: "#334155",
                  border: "1px solid #CBD5E1",
                  borderRadius: "12px",
                  fontWeight: 600,
                  fontSize: "13px",
                  cursor: "pointer",
                  minHeight: "40px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                }}
              >
                <span>⏩</span>
                <span>{language === "hi" ? "विज्ञापन छोड़ें और आगे बढ़ें" : "Skip Ad & Continue Quiz"}</span>
              </button>

              <button
                type="button"
                onClick={confirmExitQuiz}
                style={{
                  background: "none",
                  border: "none",
                  color: "#94A3B8",
                  fontSize: "12px",
                  cursor: "pointer",
                  padding: "8px",
                }}
              >
                {language === "hi" ? "क्विज़ छोड़ें" : "Exit Quiz"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Result Rewarded Ad Gate */}
      {showResultGate && (
        <div
          role="dialog"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 99999,
            background: "rgba(15, 23, 42, 0.8)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
          }}
        >
          <div
            style={{
              background: "#FFFFFF",
              borderRadius: "20px",
              padding: "24px",
              maxWidth: "360px",
              width: "100%",
              textAlign: "center",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.2)",
            }}
          >
            <div style={{ fontSize: "36px", marginBottom: "12px" }}>🏆</div>
            <h3 style={{ fontSize: "18px", fontWeight: 700, color: "#1E293B", marginBottom: "6px" }}>
              {language === "hi" ? "क्विज़ संपन्न!" : "Quiz Complete!"}
            </h3>
            <p style={{ fontSize: "13px", color: "#64748B", marginBottom: "20px", lineHeight: 1.5 }}>
              {language === "hi"
                ? "अपना परिणाम देखने के लिए एक छोटा विज्ञापन देखें।"
                : "Watch a short ad to see your result."}
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <button
                type="button"
                onClick={() => {
                  showRewarded({
                    trigger: "result",
                    tier,
                    setId: effectiveSetId,
                    onReward: async () => {
                      await fetch("/api/attempts/verify-result", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ setId: effectiveSetId, tier, passGate: "result" }),
                      }).catch(() => {});
                      setShowResultGate(false);
                      setResultGatePassed(true);
                      finishQuiz();
                      router.replace("/results");
                    },
                    onDismiss: async () => {
                      setShowResultGate(false);
                      setResultGatePassed(true);
                      finishQuiz();
                      router.replace("/results");
                    },
                  });
                }}
                style={{
                  width: "100%",
                  padding: "12px",
                  background: "#10B981",
                  color: "#FFFFFF",
                  border: "none",
                  borderRadius: "12px",
                  fontWeight: 600,
                  fontSize: "14px",
                  cursor: "pointer",
                  minHeight: "44px",
                }}
              >
                {language === "hi" ? "परिणाम देखने के लिए विज्ञापन देखें" : "Watch a short ad to see your result"}
              </button>

              <Link
                href="/pro"
                style={{
                  width: "100%",
                  padding: "12px",
                  background: "#EEF2FF",
                  color: "#4F46E5",
                  border: "1px solid #C7D2FE",
                  borderRadius: "12px",
                  fontWeight: 600,
                  fontSize: "14px",
                  textAlign: "center",
                  textDecoration: "none",
                  minHeight: "44px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {language === "hi" ? "गो प्रो, कोई विज्ञापन नहीं" : "Go Pro, no ads"}
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Ad Simulation Overlay */}
      {showingAd && <AdOverlay onComplete={handleAdComplete} />}

      {/* Read Mode is now directly rendered in-page by QuizReadModeView without any dialog popup */}
    </main>
    </div>
  );
}
