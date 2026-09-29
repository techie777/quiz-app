"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, ArrowUp, User, Download, FileText, Lock, Crown, Share2, Swords } from "lucide-react";
import { useQuiz } from "@/context/QuizContext";
import { useSession } from "next-auth/react";
import { useData } from "@/context/DataContext";
import { useLanguage } from "@/context/LanguageContext";
import { useTier } from "@/context/TierContext";
import styles from "@/styles/ResultPage.module.css";
import { useMonetization } from "@/context/MonetizationContext";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import AdGate from "@/components/monetization/AdGate";
import { toPng } from "html-to-image";
import toast from "react-hot-toast";
import { updateBadgeStats } from "@/lib/badgeManager";
import { shareResult } from "@/lib/shareImage";
import { getTodayIST } from "@/lib/dailyQuizHelper";
import NextUpRecommendations from "@/components/NextUpRecommendations";
import { recordQuizCompletion, createChallengeCode } from "@/lib/gameLayer";
import GameResultsCard from "@/components/game/GameResultsCard";
import { showRewarded } from "@/lib/adProvider";
import ResultDonationCard from "@/components/monetization/ResultDonationCard";

function getMotivation(percentage, t) {
  if (percentage === 100) return { text: t('result.motivation.perfect'), emoji: "🌟" };
  if (percentage >= 80) return { text: t('result.motivation.great'), emoji: "🎉" };
  if (percentage >= 60) return { text: t('result.motivation.good'), emoji: "👍" };
  if (percentage >= 40) return { text: t('result.motivation.practice'), emoji: "💪" };
  return { text: t('result.motivation.keepGoing'), emoji: "📚" };
}

const CONFETTI_COLORS = ["#4361ee", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#00e5ff"];

export default function ResultPage() {
  const router = useRouter();
  const { isPro } = useMonetization();
  const { data: authSession } = useSession();
  const { t, isHindi } = useLanguage();
  const { tier } = useTier();
  const { 
    score, 
    questions, 
    answers, 
    quizId, 
    difficulty, 
    timerSetting, 
    language, 
    selectedSetIndex, 
    resetQuiz, 
    startQuiz, 
    startQuizSet,
    startMixedQuiz,
    isMixedMode,
    mixedSectionName,
    quizSlug,
    categoryName: quizCategoryName,
    timeTaken,
    startTime,
    maxCombo
  } = useQuiz();
  const { quizzes } = useData();
  const [showReview, setShowReview] = useState(true);
  const [reviewFilterTab, setReviewFilterTab] = useState("all");
  const [confetti, setConfetti] = useState([]);
  const [showPostQuizPopup, setShowPostQuizPopup] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAllQuizzes, setShowAllQuizzes] = useState(false);
  const [showGateAd, setShowGateAd] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [isLaunchingNextSet, setIsLaunchingNextSet] = useState(false);
  const [gameResult, setGameResult] = useState(null);
  const [headToHead, setHeadToHead] = useState(null);
  const gameRecordedRef = useRef(false);
  const resultCardRef = useRef(null);

  const isExplorer = tier === "adults" || (tier !== "kids" && tier !== "students");
  const isAdTier = tier === "adults" || tier === "explorer";
  const [reviewGateUnlocked, setReviewGateUnlocked] = useState(false);
  const totalQuestions = questions?.length || 0;
  const finalTimeTaken = timeTaken || (startTime ? Math.max(1, Math.round((Date.now() - startTime) / 1000)) : 0);

  const category = useMemo(() => {
    if (isMixedMode) return null;
    return (quizzes || []).find((q) => q.id === quizId || q.slug === quizSlug || q.slug === quizId);
  }, [quizzes, quizId, quizSlug, isMixedMode]);

  const [isDailyQuiz, setIsDailyQuiz] = useState(false);

  useEffect(() => {
    let meta = null;
    try {
      const metaStr = sessionStorage.getItem("current_daily_quiz");
      if (metaStr) meta = JSON.parse(metaStr);
    } catch {}

    const isDaily = Boolean(
      meta ||
      String(quizId || "").startsWith("daily-") ||
      String(quizCategoryName || "").includes("Daily Quiz") ||
      String(quizCategoryName || "").includes("दैनिक क्विज़")
    );

    setIsDailyQuiz(isDaily);

    if (isDaily && score !== undefined && totalQuestions > 0) {
      const quizDate = meta?.date || getTodayIST();
      const quizTier = meta?.tier || tier;
      const isToday = meta?.isToday !== false;

      // Save locally to localStorage
      try {
        const existing = JSON.parse(localStorage.getItem("quizweb_daily_attempts") || "[]");
        const filtered = Array.isArray(existing) ? existing.filter(a => !(a.date === quizDate && a.tier === quizTier)) : [];
        filtered.push({
          date: quizDate,
          tier: quizTier,
          score,
          total: totalQuestions,
          timeTaken: finalTimeTaken,
          completedAt: new Date().toISOString(),
          playedOnDay: isToday,
        });
        localStorage.setItem("quizweb_daily_attempts", JSON.stringify(filtered));

        if (isToday) {
          const streakData = JSON.parse(localStorage.getItem("quizweb_daily_streak") || "{}");
          const currentCount = streakData.count || 0;
          if (streakData.lastPlayedDate !== quizDate) {
            localStorage.setItem("quizweb_daily_streak", JSON.stringify({
              count: currentCount + 1,
              lastPlayedDate: quizDate,
            }));
          }
        }
      } catch {}

      // Send to server
      fetch("/api/daily-quiz/attempt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tier: quizTier,
          date: quizDate,
          dailyQuizId: meta?.dailyQuizId || quizId,
          score,
          total: totalQuestions,
          timeTaken: finalTimeTaken,
        }),
      }).catch((e) => console.error("Daily attempt post error:", e));
    }
  }, [quizId, quizCategoryName, score, totalQuestions, finalTimeTaken, tier]);

  // Step 9: Game Layer Recording (XP, 5-tier Levels, Streak Freeze, 3-Fact Recap, Weak-Topic Hints)
  useEffect(() => {
    if (totalQuestions > 0 && !gameRecordedRef.current) {
      gameRecordedRef.current = true;

      // Check 1v1 Head-to-Head Duel challenge
      try {
        const chalData = JSON.parse(sessionStorage.getItem("quizweb_active_challenge") || "null");
        if (chalData) {
          setHeadToHead({
            challengerName: chalData.challengerName || "Friend",
            challengerScore: Number(chalData.challengerScore) || 0,
            userScore: score,
            totalQuestions: chalData.totalQuestions || totalQuestions,
            isWin: score > Number(chalData.challengerScore),
            isTie: score === Number(chalData.challengerScore),
          });
          sessionStorage.removeItem("quizweb_active_challenge");
        }
      } catch {}

      const res = recordQuizCompletion({
        score,
        total: totalQuestions,
        maxCombo: maxCombo || 0,
        questions,
        userAnswers: answers,
        categoryName: (isHindi && category?.topicHi) ? category.topicHi : (quizCategoryName || category?.topic || (isHindi ? "क्विज़" : "Quiz")),
        isHindi,
      });
      setGameResult(res);
    }
  }, [totalQuestions, score, maxCombo, questions, answers, isHindi, quizCategoryName, category]);

  const handleChallengeFriend = async () => {
    try {
      const topicSlug = quizSlug || quizId || "general";
      const topicName = (isHindi && category?.topicHi) ? category.topicHi : (quizCategoryName || category?.topic || "Quiz");
      const playerName = authSession?.user?.name || (isHindi ? "आपका दोस्त" : "Your Friend");
      
      const code = createChallengeCode({
        categorySlug: topicSlug,
        categoryName: topicName,
        score,
        total: totalQuestions,
        playerName,
      });
      
      const challengeUrl = `${window.location.origin}/challenge?code=${code}`;
      const shareText = isHindi
        ? `🎯 मैंने "${topicName}" क्विज़ में ${totalQuestions} में से ${score} अंक प्राप्त किए! क्या तुम मुझे हरा सकते हो? चुनौती स्वीकार करो:`
        : `🎯 I scored ${score}/${totalQuestions} in the "${topicName}" quiz! Think you can beat me? Accept the duel:`;

      if (navigator.share) {
        await navigator.share({
          title: isHindi ? "क्विज़ मुकाबला चुनौती" : "Quiz Duel Challenge",
          text: shareText,
          url: challengeUrl,
        });
      } else {
        await navigator.clipboard.writeText(`${shareText}\n${challengeUrl}`);
        toast.success(isHindi ? "चुनौती लिंक कॉपी हो गया! व्हाट्सएप पर शेयर करें।" : "Challenge link copied to clipboard!");
      }
    } catch (err) {
      if (err?.name !== "AbortError") {
        toast.error(isHindi ? "शेयर करने में विफल" : "Failed to share challenge");
      }
    }
  };

  const formatQuizTime = (seconds, hindiMode) => {
    if (!seconds || seconds <= 0) return hindiMode ? "0 से." : "0s";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins === 0) {
      return hindiMode ? `${secs} से.` : `${secs}s`;
    }
    return hindiMode ? `${mins} मि. ${secs} से.` : `${mins}m ${secs}s`;
  };

  // Instant route prefetching for seamless continuation
  useEffect(() => {
    if (quizSlug || quizId) {
      router.prefetch(`/category/${quizSlug || quizId}`);
      router.prefetch(`/quiz/${quizSlug || quizId}`);
    }
  }, [quizSlug, quizId, router]);

  useEffect(() => {
    if (authSession?.user && !authSession.user.isAdmin) {
      fetch("/api/user/profile")
        .then((r) => r.json())
        .then((data) => {
          setUserProfile(data);
        })
        .catch(() => {});
    }
  }, [authSession]);

  const filteredQuizzes = useMemo(() => {
    if (!quizzes || !Array.isArray(quizzes)) return [];
    const validQuizzes = quizzes.filter(q => q && q.topic && !q.hidden);
    
    const query = searchQuery.toLowerCase();
    return validQuizzes.filter(q => 
      (q.topic && q.topic.toLowerCase().includes(query)) ||
      (q.description && q.description.toLowerCase().includes(query))
    ).slice(0, 50);
  }, [quizzes, searchQuery]);

  // Show suggestions 5 seconds after results are revealed (post-ad)
  useEffect(() => {
    if (questions && questions.length > 0) {
      const pct = Math.round((score / questions.length) * 100);
      updateBadgeStats({
        quizCount: 1,
        perfectCount: pct === 100 ? 1 : 0,
        totalQuestions: questions.length,
        categoryId: quizId || quizCategoryName || "general"
      });

      if (!showGateAd && !isExplorer) {
        const timer = setTimeout(() => {
          setShowPostQuizPopup(true);
        }, 7000);
        return () => clearTimeout(timer);
      }
    }
  }, [questions, showGateAd, score, quizId, quizCategoryName, isExplorer]);

  const handleContinueNextSet = async () => {
    if (isLaunchingNextSet) return;

    if (isMixedMode) {
      router.push("/");
      return;
    }

    setIsLaunchingNextSet(true);
    const nextSetIndex = (selectedSetIndex || 1) + 1;
    const CHUNK_SIZE = 20;
    const startIndex = (nextSetIndex - 1) * CHUNK_SIZE;
    const catTarget = category || (quizzes || []).find((q) => q.id === quizId || q.slug === quizSlug || q.slug === quizId);

    let allQs = catTarget?.questions || [];

    // If questions list is empty or doesn't have enough questions for next set, fetch full category from API
    if (!allQs || allQs.length <= startIndex) {
      try {
        const targetId = catTarget?.slug || quizSlug || quizId;
        if (targetId) {
          const res = await fetch(`/api/categories/${targetId}`);
          if (res.ok) {
            const fullData = await res.json();
            if (fullData && Array.isArray(fullData.questions)) {
              allQs = fullData.questions;
            }
          }
        }
      } catch (err) {
        console.error("Failed to fetch next set questions:", err);
      }
    }

    const nextQuestions = allQs.slice(startIndex, startIndex + CHUNK_SIZE);

    if (nextQuestions.length > 0) {
      const topicSuffix = ` Set ${nextSetIndex}`;
      const topicTitle = (catTarget?.topic || quizCategoryName || "Quiz") + topicSuffix;

      startQuizSet(catTarget?.id || quizId, nextQuestions, timerSetting, language, nextSetIndex, topicTitle, true);
      router.prefetch(`/quiz/${catTarget?.slug || quizSlug || quizId}`);
      router.push(`/quiz/${catTarget?.slug || quizSlug || quizId}`);
    } else {
      // If no more sets exist, redirect to category sets page
      setIsLaunchingNextSet(false);
      resetQuiz();
      router.push(`/category/${catTarget?.slug || quizSlug || quizId}`);
    }
  };

   const handleSuggestionClick = (suggestionId) => {
     setShowPostQuizPopup(false);
      const suggestion = quizzes.find(q => q.id === suggestionId);
      router.push(`/category/${suggestion?.slug || suggestionId}`);

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
  const motivation = getMotivation(percentage, t);

  const starCount = useMemo(() => {
    if (percentage >= 80) return 3;
    if (percentage >= 50) return 2;
    return 1;
  }, [percentage]);

  const [displayScore, setDisplayScore] = useState(0);
  useEffect(() => {
    let current = 0;
    const target = score || 0;
    if (target === 0) {
      setDisplayScore(0);
      return;
    }
    const duration = 800;
    const step = Math.max(16, Math.floor(duration / target));
    const timer = setInterval(() => {
      current += 1;
      setDisplayScore(current);
      if (current >= target) clearInterval(timer);
    }, step);
    return () => clearInterval(timer);
  }, [score]);

  const friendlyHeadline = useMemo(() => {
    if (percentage >= 80) return isHindi ? "शानदार प्रदर्शन!" : "Great job!";
    if (percentage >= 50) return isHindi ? "अच्छा प्रयास!" : "Good effort!";
    return isHindi ? "अभ्यास जारी रखें!" : "Keep practising!";
  }, [percentage, isHindi]);

  const difficultyBreakdown = useMemo(() => {
    const counts = {
      easy: { correct: 0, total: 0 },
      medium: { correct: 0, total: 0 },
      hard: { correct: 0, total: 0 },
    };
    (questions || []).forEach((q) => {
      const rawDiff = String(q?.difficulty || "medium").toLowerCase();
      const diffKey = (rawDiff === "easy" || q?.difficulty_level === 1)
        ? "easy"
        : (rawDiff === "hard" || q?.difficulty_level === 3)
        ? "hard"
        : "medium";
      counts[diffKey].total += 1;
      const ans = (answers || []).find((a) => a.questionId === q.id || a.questionId === q._id);
      if (ans?.isCorrect) {
        counts[diffKey].correct += 1;
      }
    });
    return counts;
  }, [questions, answers]);

  // Award stars and stickers for Kids tier
  useEffect(() => {
    if (tier === "kids" && questions && questions.length > 0) {
      if (typeof window !== "undefined") {
        const curStars = parseInt(localStorage.getItem("kids_stars_count") || "12", 10);
        const newStars = curStars + starCount;
        localStorage.setItem("kids_stars_count", String(newStars));
        
        let curStickers = ["super_star", "rocket_kid", "dino_explorer"];
        try {
          const parsed = JSON.parse(localStorage.getItem("kids_stickers_unlocked") || "[]");
          if (Array.isArray(parsed)) {
            curStickers = Array.from(new Set([...curStickers, ...parsed]));
          }
        } catch (e) {}

        if (starCount === 3 && !curStickers.includes("super_star")) curStickers.push("super_star");
        if (percentage >= 50 && !curStickers.includes("lion_champ")) curStickers.push("lion_champ");
        if (percentage === 100 && !curStickers.includes("golden_cup")) curStickers.push("golden_cup");
        localStorage.setItem("kids_stickers_unlocked", JSON.stringify(curStickers));
      }
    }
  }, [tier, questions, starCount, percentage]);

  // Record Arena attempts & question history with spaced repetition
  useEffect(() => {
    if (!questions || questions.length === 0) return;
    const isArena = Boolean(
      String(quizId || "").includes("arena") ||
      String(quizCategoryName || "").includes("Arena") ||
      String(quizCategoryName || "").includes("एरिना")
    );

    if (isArena) {
      const attempts = questions.map((q) => {
        const userAns = (answers || []).find((a) => a.questionId === q.id || a.questionId === q._id);
        const isCorrect = userAns ? Boolean(userAns.isCorrect) : false;
        return {
          questionId: q.id || q._id,
          isCorrect,
          userAnswer: userAns?.selected,
          timeTaken: Math.max(1, Math.round(finalTimeTaken / questions.length)) || 1,
          topicId: q.topicId || q.topic_id,
          categoryId: q.categoryId || q.category_id,
        };
      });

      fetch("/api/arena/history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: authSession?.user?.id || "guest",
          attempts,
          quizType: "arena",
        }),
      }).catch((e) => console.error("Arena history post error:", e));
    }
  }, [questions, answers, quizId, quizCategoryName, finalTimeTaken, authSession]);

  // Always call this hook - handle redirection logic inside
  useEffect(() => {
    if (total === 0) {
      router.replace("/");
    }
  }, [total, router]);

  // Confetti triggers for percentage >= 70
  useEffect(() => {
    if (total === 0 || percentage < 70) return;
    const pieces = Array.from({ length: 45 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 1.5,
      duration: 2 + Math.random() * 2,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      rotation: Math.random() * 360,
    }));
    setConfetti(pieces);
  }, [total, percentage]);

  const handlePlayAgain = () => {
    if (isMixedMode) {
      startMixedQuiz(questions, mixedSectionName, timerSetting, difficulty, language);
      router.push("/quiz/mix");
      return;
    }
    startQuizSet(quizId, questions, timerSetting, language);
    router.push(`/quiz/${quizId}`);
  };

  const handleBackToQuizzes = () => {
    // User requested "Continue to next set should directly start the next set of quiz"
    if (isMixedMode) {
      startMixedQuiz(questions, mixedSectionName, timerSetting, difficulty, language);
      router.push("/quiz/mix");
      return;
    }
    
    // FETCH NEXT SET LOGIC
    const nextSetIndex = (selectedSetIndex || 1) + 1;
    const CHUNK_SIZE = 20;
    const startIndex = (nextSetIndex - 1) * CHUNK_SIZE;
    
    if (category && category.questions && category.questions.length > startIndex) {
      const nextQuestions = category.questions.slice(startIndex, startIndex + CHUNK_SIZE);
      startQuizSet(quizId, nextQuestions, timerSetting, language, nextSetIndex, category.topic);
      router.push(`/quiz/${quizId}`);
    } else {
      // If no next set exists, just go back to category page
      resetQuiz();
      router.push(`/category/${quizSlug || quizId}`);
    }
  };

  const handleExportPDF = () => {
    if (!isPro) {
        toast.error(t('result.export.proOnly'));
        return;
    }

    const doc = new jsPDF();
    doc.setFontSize(22);
    doc.text(t('result.export.reportTitle'), 105, 20, { align: "center" });
    
    doc.setFontSize(14);
    doc.text(`${t('result.export.category')}: ${category?.topic || "General"}`, 20, 40);
    doc.text(`${t('result.stats.total')}: ${score} / ${total}`, 20, 50);
    doc.text(`${t('result.accuracy')}: ${percentage}%`, 20, 60);

    const tableData = [];
    questions.forEach((q, i) => {
        const answer = answers.find(a => a.questionId === q.id);
        const selected = answer && answer.selected !== null ? q.options[answer.selected] : "N/A";
        tableData.push([i + 1, q.text, q.correctAnswer, selected, answer?.isCorrect ? t('result.review.badgeCorrect') : t('result.review.badgeWrong')]);
    });

    autoTable(doc, {
        startY: 70,
        head: [['#', t('result.review.question'), t('result.review.correct'), t('result.review.yourAnswer'), t('result.status')]],
        body: tableData,
    });

    doc.save(`Quiz-Report-${quizId || 'General'}.pdf`);
  };

  const renderAnswerReview = () => (
    <div id="review-section" className={styles.review}>
      <div className={styles.reviewHeaderMain}>
        <div className={styles.reviewTitleRow}>
          <h2 className={styles.reviewTitle}>
            <span>📋</span>
            <span>{isHindi ? 'उत्तर समीक्षा' : 'Answer Review'}</span>
          </h2>
          
          {/* Filter Tabs */}
          <div className={styles.reviewFilterTabs}>
            <button 
              className={`${styles.filterBtn} ${reviewFilterTab === 'all' ? styles.filterBtnActive : ''}`}
              onClick={() => setReviewFilterTab('all')}
            >
              {isHindi ? 'सभी' : 'All'} ({questions.length})
            </button>
            <button 
              className={`${styles.filterBtn} ${reviewFilterTab === 'wrong' ? styles.filterBtnActive : ''}`}
              onClick={() => setReviewFilterTab('wrong')}
            >
              ❌ {isHindi ? 'गलत' : 'Wrong'} ({performance?.wrong || 0})
            </button>
            <button 
              className={`${styles.filterBtn} ${reviewFilterTab === 'correct' ? styles.filterBtnActive : ''}`}
              onClick={() => setReviewFilterTab('correct')}
            >
              ✓ {isHindi ? 'सही' : 'Correct'} ({performance?.correct || 0})
            </button>
            <button 
              className={`${styles.filterBtn} ${reviewFilterTab === 'skipped' ? styles.filterBtnActive : ''}`}
              onClick={() => setReviewFilterTab('skipped')}
            >
              ⏱️ {isHindi ? 'छूटे' : 'Skipped'} ({performance?.skipped || 0})
            </button>
          </div>
        </div>
      </div>

      {questions
        .map((question, index) => ({ question, originalIndex: index }))
        .filter(({ question }) => {
          const answer = answers.find((a) => a.questionId === question.id);
          const isAnswered = !!answer;
          const isCorrect = answer?.isCorrect || false;
          
          if (reviewFilterTab === 'wrong') return isAnswered && !isCorrect;
          if (reviewFilterTab === 'correct') return isAnswered && isCorrect;
          if (reviewFilterTab === 'skipped') return !isAnswered;
          return true;
        })
        .map(({ question, originalIndex }) => {
          const answer = answers.find((a) => a.questionId === question.id);
          const isAnswered = !!answer;
          const isCorrect = answer?.isCorrect || false;

          // Get user selected option text
          let userSelectedText = "";
          if (!isAnswered || answer?.selected === null || answer?.selected === undefined) {
            userSelectedText = isHindi ? "उत्तर नहीं दिया / समय समाप्त" : "Skipped / Timed Out";
          } else if (isHindi && Array.isArray(question.optionsHi) && question.optionsHi[answer.selected]) {
            userSelectedText = question.optionsHi[answer.selected];
          } else if (Array.isArray(question.options) && question.options[answer.selected]) {
            userSelectedText = question.options[answer.selected];
          } else {
            userSelectedText = String(answer.selected);
          }

          // Get correct option text
          let correctOptionText = "";
          if (isHindi && Array.isArray(question.optionsHi)) {
            const correctIdx = question.options.findIndex(opt => String(opt).trim() === String(question.correctAnswer).trim());
            if (correctIdx !== -1 && question.optionsHi[correctIdx]) {
              correctOptionText = question.optionsHi[correctIdx];
            }
          }
          if (!correctOptionText) {
            correctOptionText = question.correctAnswer || (question.options ? question.options[0] : "");
          }

          return (
            <div
              key={question.id || originalIndex}
              className={`${styles.reviewItem} ${
                !isAnswered ? styles.reviewSkipped : (isCorrect ? styles.reviewCorrect : styles.reviewWrong)
              }`}
            >
              {/* Question Top Bar */}
              <div className={styles.reviewHeader}>
                <div className="flex items-center gap-2">
                  <span className={styles.reviewNumPill}>
                    {isHindi ? `प्रश्न ${originalIndex + 1}` : `Question ${originalIndex + 1}`}
                  </span>
                  {question.difficulty && (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      question.difficulty.toLowerCase() === 'easy' ? 'bg-[#DCFCE7] text-[#16A34A] border-[#86EFAC]' :
                      question.difficulty.toLowerCase() === 'hard' ? 'bg-[#FEE2E2] text-[#DC2626] border-[#FCA5A5]' :
                      question.difficulty.toLowerCase() === 'expert' ? 'bg-[#EDE9FE] text-[#7C3AED] border-[#C4B5FD]' :
                      'bg-[#FEF3C7] text-[#D97706] border-[#FDE68A]'
                    }`}>
                      {question.difficulty.toUpperCase()}
                    </span>
                  )}
                </div>
                
                <span className={`${styles.statusBadge} ${
                  !isAnswered 
                    ? styles.statusBadgeSkipped 
                    : (isCorrect ? styles.statusBadgeCorrect : styles.statusBadgeWrong)
                }`}>
                  {!isAnswered 
                    ? (isHindi ? '⏱️ छूटा हुआ' : '⏱️ Skipped')
                    : (isCorrect ? (isHindi ? '✓ सही उत्तर' : '✓ Correct') : (isHindi ? '✕ गलत उत्तर' : '✕ Incorrect'))
                  }
                </span>
              </div>

              {/* Question Body */}
              <h4 className={styles.reviewQuestion}>
                {(isHindi && question.textHi) ? question.textHi : question.text}
              </h4>
              
              {/* Answer Comparison Cards */}
              <div className={styles.answerGrid}>
                {/* User Answer Card */}
                <div className={`${styles.answerCard} ${
                  !isAnswered 
                    ? styles.answerCardSkipped 
                    : (isCorrect ? styles.answerCardUserCorrect : styles.answerCardUserWrong)
                }`}>
                  <span className={`${styles.answerLabel} ${
                    !isAnswered 
                      ? styles.answerLabelSkipped 
                      : (isCorrect ? styles.answerLabelUserCorrect : styles.answerLabelUserWrong)
                  }`}>
                    {!isAnswered 
                      ? (isHindi ? '⏱️ आपका चयन' : '⏱️ Your Choice')
                      : (isCorrect ? (isHindi ? '✓ आपका उत्तर (सही)' : '✓ Your Answer (Correct)') : (isHindi ? '❌ आपका उत्तर' : '❌ Your Answer'))
                    }
                  </span>
                  <span className={styles.answerText}>{userSelectedText}</span>
                </div>

                {/* Correct Answer Card (shown when user was incorrect or skipped) */}
                {(!isCorrect || !isAnswered) && (
                  <div className={`${styles.answerCard} ${styles.answerCardCorrect}`}>
                    <span className={`${styles.answerLabel} ${styles.answerLabelCorrect}`}>
                      💡 {isHindi ? 'सही उत्तर' : 'Correct Answer'}
                    </span>
                    <span className={styles.answerText}>{correctOptionText}</span>
                  </div>
                )}
              </div>

              {/* Explanation / Jawab Logic */}
              {(question.explanation || (isHindi && question.explanationHi)) && (
                <div className="mt-4 p-4 rounded-xl bg-indigo-50/60 dark:bg-slate-800/80 border border-indigo-100 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                  <span className="font-black text-indigo-600 dark:text-indigo-400 block mb-1 uppercase tracking-wider text-[11px]">
                    💡 {isHindi ? "व्याख्या:" : "Explanation:"}
                  </span>
                  {isAdTier && !isDailyQuiz && !isPro && !reviewGateUnlocked ? (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-2.5 bg-white/90 dark:bg-slate-900/90 rounded-xl border border-indigo-200 dark:border-slate-600 mt-1">
                      <span className="text-slate-700 dark:text-slate-300 font-semibold text-xs">
                        🔒 {isHindi ? "पूरी व्याख्याएं लॉक हैं।" : "Full explanations are locked."}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          showRewarded({
                            trigger: "review",
                            tier,
                            setId: quizSlug || quizId,
                            onReward: () => {
                              setReviewGateUnlocked(true);
                              toast.success(isHindi ? "सभी व्याख्याएं अनलॉक हो गईं!" : "Explanations unlocked!");
                            },
                          });
                        }}
                        className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition-all cursor-pointer min-h-[36px]"
                      >
                        {isHindi ? "छोटा विज्ञापन देखें (अनलॉक)" : "Watch short ad to unlock"}
                      </button>
                    </div>
                  ) : (
                    isHindi && question.explanationHi ? question.explanationHi : question.explanation
                  )}
                </div>
              )}

              {/* Exam Tags */}
              {((question.examTags && question.examTags.length > 0) || (Array.isArray(question.exam) && question.exam.length > 0)) && (
                <div className="flex flex-wrap items-center gap-1.5 mt-3">
                  {(question.examTags || question.exam).map((tag, tIdx) => (
                    <span key={tIdx} className="px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200/60 dark:border-purple-800 text-[10px] font-bold">
                      🏷️ {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {/* Back to top button at the end of review list */}
        <div className="flex justify-center mt-6 mb-4">
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-extrabold text-xs sm:text-sm border border-indigo-200 dark:border-indigo-800 shadow-sm transition-all active:scale-95 cursor-pointer"
          >
            <ArrowUp size={16} />
            <span>{isHindi ? "वापस ऊपर जाएं (शीर्ष)" : "Back to Top"}</span>
          </button>
        </div>
    </div>
  );

  // Always return JSX - never return null or conditionally skip hooks
  return (
    <main className={styles.page}>
      {total === 0 || (showGateAd && !isPro) ? (
        // Loading / Gated state
        <div className={styles.loadingContainer}>
          <div className={styles.spinner}></div>
          <h1>{showGateAd ? t('result.unlocking') : (total === 0 ? (isHindi ? "कोई क्विज़ परिणाम नहीं मिला" : "No Quiz Results Found") : t('result.loading'))}</h1>
          <p>{showGateAd ? t('result.supportUs') : (total === 0 ? (isHindi ? "कृपया होम पेज से कोई नया क्विज़ खेलें।" : "Please start a quiz from the home page.") : t('result.analyzing'))}</p>
          {total === 0 && (
            <div className="mt-4">
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
              >
                <span>{isHindi ? "होम पेज पर जाएं" : "Back to Home"}</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          )}
        </div>
      ) : isExplorer ? (
        // STEP 12: EXPLORER RESULT SCREEN
        <div className={styles.explorerWrapper}>
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

          {/* Phase D5 Redesigned Clean Results Score Card */}
          <div id="result-card" ref={resultCardRef} className="w-full max-w-xl mx-auto bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-6 sm:p-8 text-center shadow-lg shadow-indigo-500/5 relative overflow-hidden">
            {/* Top Trophy */}
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 mx-auto flex items-center justify-center text-3xl mb-3 shadow-inner">
              🏆
            </div>

            {/* Star Rating (1–3) */}
            <div className="flex items-center justify-center gap-1.5 mb-1 select-none">
              {[1, 2, 3].map((starIdx) => (
                <span
                  key={starIdx}
                  className={`text-2xl sm:text-3xl transition-all duration-300 ${
                    starIdx <= starCount
                      ? "text-amber-400 drop-shadow-sm scale-110"
                      : "text-slate-300 dark:text-slate-700 opacity-40"
                  }`}
                >
                  ★
                </span>
              ))}
            </div>

            {/* Friendly Headline by Score Band */}
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mb-2">
              {friendlyHeadline}
            </h2>

            {/* Score with Animated Count-up */}
            <div className="flex items-baseline justify-center gap-2 mb-2 select-none">
              <span className="text-5xl sm:text-6xl font-black text-indigo-600 dark:text-indigo-400 leading-none">
                {displayScore}
              </span>
              <span className="text-2xl sm:text-3xl font-light text-slate-400">/</span>
              <span className="text-2xl sm:text-3xl font-bold text-slate-600 dark:text-slate-300">
                {total}
              </span>
            </div>

            {/* Accuracy Badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 mb-4">
              <span>{motivation.emoji}</span>
              <span>{percentage}% {isHindi ? "सटीकता" : "Accuracy"}</span>
            </div>

            {/* Accuracy Progress Bar & Difficulty Breakdown */}
            <div className="w-full max-w-sm mx-auto mb-5 space-y-2.5">
              <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-indigo-600 h-2.5 rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${percentage}%` }}
                />
              </div>

              {/* Difficulty Breakdown Chips (Section 0 token colors) */}
              <div className="flex items-center justify-center gap-2 flex-wrap text-[11px] font-bold">
                {difficultyBreakdown.easy.total > 0 && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#DCFCE7] text-[#16A34A] border border-[#86EFAC]">
                    <span className="w-1.5 h-1.5 rounded-full bg-current" />
                    <span>{isHindi ? "सरल" : "Easy"}: {difficultyBreakdown.easy.correct}/{difficultyBreakdown.easy.total}</span>
                  </span>
                )}
                {difficultyBreakdown.medium.total > 0 && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#FEF3C7] text-[#D97706] border border-[#FDE68A]">
                    <span className="w-1.5 h-1.5 rounded-full bg-current" />
                    <span>{isHindi ? "मध्यम" : "Medium"}: {difficultyBreakdown.medium.correct}/{difficultyBreakdown.medium.total}</span>
                  </span>
                )}
                {difficultyBreakdown.hard.total > 0 && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#FEE2E2] text-[#DC2626] border border-[#FCA5A5]">
                    <span className="w-1.5 h-1.5 rounded-full bg-current" />
                    <span>{isHindi ? "कठिन" : "Hard"}: {difficultyBreakdown.hard.correct}/{difficultyBreakdown.hard.total}</span>
                  </span>
                )}
              </div>
            </div>

            {/* Stat Row of 4 Small Cards: Correct · Wrong · Skipped · Time taken (plus XP for Students) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-6 text-center">
              <div className="p-3 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800">
                <span className="text-[10px] font-extrabold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider block mb-0.5">
                  {isHindi ? "सही" : "Correct"}
                </span>
                <span className="text-lg sm:text-xl font-black text-emerald-600 dark:text-emerald-400">
                  ✓ {performance?.correct || 0}
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-rose-50/80 dark:bg-rose-950/30 border border-rose-200/80 dark:border-rose-800">
                <span className="text-[10px] font-extrabold text-rose-700 dark:text-rose-400 uppercase tracking-wider block mb-0.5">
                  {isHindi ? "गलत" : "Wrong"}
                </span>
                <span className="text-lg sm:text-xl font-black text-rose-600 dark:text-rose-400">
                  ✕ {performance?.wrong || 0}
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800">
                <span className="text-[10px] font-extrabold text-amber-700 dark:text-amber-400 uppercase tracking-wider block mb-0.5">
                  {isHindi ? "छूटे" : "Skipped"}
                </span>
                <span className="text-lg sm:text-xl font-black text-amber-600 dark:text-amber-400">
                  ⏱️ {performance?.skipped || 0}
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/30 border border-indigo-200/80 dark:border-indigo-800 flex flex-col justify-center">
                <span className="text-[10px] font-extrabold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider block mb-0.5">
                  {tier === "students" ? (isHindi ? "समय / XP" : "Time / XP") : (isHindi ? "समय" : "Time")}
                </span>
                <span className="text-sm sm:text-base font-black text-indigo-600 dark:text-indigo-400 truncate">
                  {formatQuizTime(finalTimeTaken, isHindi)}
                  {tier === "students" && ` (+${(performance?.correct || 0) * 10} XP)`}
                </span>
              </div>
            </div>

            {/* Max 3 Buttons: Primary Review Answers, Secondary Next Set / Play Again, Tertiary Share Result */}
            <div className="flex flex-col gap-2.5">
              {/* Button 1: Primary Review Answers */}
              <button
                type="button"
                onClick={() => {
                  setShowReview(true);
                  const el = document.getElementById("review-section");
                  if (el) {
                    el.scrollIntoView({ behavior: "smooth" });
                  }
                }}
                className="w-full min-h-[50px] rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-sm sm:text-base shadow-md shadow-indigo-600/20 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <FileText size={18} />
                <span>{t('result.review.title') || (isHindi ? "उत्तर समीक्षा देखें" : "Review Answers")}</span>
              </button>

              {/* Button 2: Secondary Next Set / Play Again */}
              <button
                id="result-next-set-btn"
                onClick={selectedSetIndex ? handleContinueNextSet : handlePlayAgain}
                disabled={isLaunchingNextSet}
                className="w-full min-h-[46px] rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 font-extrabold text-xs sm:text-sm border border-slate-200 dark:border-slate-700 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                {isLaunchingNextSet ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className={styles.btnSpinnerSmall} />
                    <span>{isHindi ? "लोड हो रहा है..." : "Launching..."}</span>
                  </span>
                ) : selectedSetIndex ? (
                  <span className="flex items-center justify-center gap-2">
                    <span>{t('result.actions.nextSet') || (isHindi ? "अगला सेट खेलें" : "Next Set")}</span>
                    <ArrowRight size={16} />
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <ArrowRight size={16} />
                    <span>{isHindi ? "फिर से खेलें" : "Play Again"}</span>
                  </span>
                )}
              </button>

              {/* Button 3: Tertiary Share Result */}
              <button
                type="button"
                onClick={async () => {
                  const performShare = async () => {
                    const topicName = quizCategoryName || category?.topic || mixedSectionName || "QuizWeb";
                    await shareResult({
                      score,
                      total,
                      percentage,
                      topic: topicName,
                      quizId: quizSlug || quizId,
                    });
                  };

                  if (isAdTier && !isDailyQuiz && !isPro) {
                    showRewarded({
                      trigger: "share",
                      tier,
                      setId: quizSlug || quizId,
                      onReward: performShare,
                    });
                  } else {
                    await performShare();
                  }
                }}
                className="w-full min-h-[44px] rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs hover:border-indigo-400 transition-all flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
              >
                <Share2 size={15} />
                <span>{isHindi ? "परिणाम साझा करें" : "Share Result"}</span>
              </button>

              {/* Small Link: Back to Home */}
              <button
                onClick={() => {
                  resetQuiz();
                  router.push("/");
                }}
                className="text-xs font-bold text-slate-500 hover:text-indigo-600 transition-colors pt-2"
              >
                ← {t('result.actions.backToHome') || (isHindi ? "होम पर जाएं" : "Back to Home")}
              </button>
            </div>

            {/* Daily Quiz Extra Links & Guest Streak Hint */}
            {isDailyQuiz && (
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-center">
                <Link
                  href={`/daily-quiz/past?tier=${tier}`}
                  className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1.5"
                >
                  <span>📅</span>
                  <span>{isHindi ? "पुराने दैनिक क्विज़ खेलें" : "Play past quizzes"}</span>
                  <span>→</span>
                </Link>
                {!authSession?.user && (
                  <p className="text-[11px] text-amber-500 font-bold mt-1">
                    ⭐ {isHindi ? "अपनी स्ट्रीक सुरक्षित रखने के लिए साइन इन करें" : "Sign in to keep your streak"}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Dismissible Donation Appeal Card (Students, Explorer, Arena; once a day; never Kids) */}
          <div className="w-full max-w-xl mx-auto px-2">
            <ResultDonationCard />
          </div>

          {/* Game Layer: XP Progression, Streak Freeze, 3-Fact Recap, Weak-Topic Hint, 1v1 Challenge */}
          <div className="w-full max-w-xl mx-auto">
            <GameResultsCard
              gameResult={gameResult}
              headToHead={headToHead}
              onChallengeFriend={handleChallengeFriend}
              isHindi={isHindi}
              score={score}
              total={totalQuestions}
            />
          </div>

          {/* Answer Review Below the Fold */}
          <div className={styles.explorerReviewSection}>
            {renderAnswerReview()}
          </div>
        </div>
      ) : (
        // KIDS & STUDENTS ORIGINAL LAYOUT
        <div className={styles.resultContainer}>
          {/* Left Sidebar: You May Like */}
          <aside className={styles.sidebarLeft}>
            <h3 className={styles.sidebarTitle}>{t('result.sidebar.youMayLike')}</h3>
            <div className={styles.suggestedList}>
              {quizzes.slice(0, 3).map(quiz => (
                <div key={quiz.id} className={styles.suggestedCard} onClick={() => router.push(`/category/${quiz.slug || quiz.id}`)}>
                  <span className={styles.suggestedEmoji}>{quiz.emoji || "📝"}</span>
                  <div className={styles.suggestedInfo}>
                    <span className={styles.suggestedName}>
                      {isHindi && quiz.topicHi ? quiz.topicHi : quiz.topic}
                    </span>
                    <span className={styles.suggestedQuestions}>{quiz.questionCount || 0} {isHindi ? 'प्रश्न' : 'Qs'}</span>
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
            <div id="result-card" ref={resultCardRef} className={`${styles.scoreCard} glass-card`}>
              {(quizId || isMixedMode) && (
                <div className={styles.nextSetTeaser} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: '16px' }}>
                  <button className={styles.nextSetLink} onClick={handleContinueNextSet} disabled={isLaunchingNextSet} style={isLaunchingNextSet ? { opacity: 0.85, cursor: "wait" } : {}}>
                    {isLaunchingNextSet ? (
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ display: "inline-block", width: "14px", height: "14px", border: "2px solid white", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.6s linear infinite" }} />
                        <span>{isHindi ? 'लोड हो रहा है...' : 'Launching Set...'}</span>
                      </span>
                    ) : isMixedMode ? (
                      `${t('result.actions.backTo')} ${mixedSectionName} ${t('common.categories') || 'Categories'}`
                    ) : (
                      `${t('result.actions.continue')} ${(isHindi && category?.topicHi) ? category.topicHi : (category?.topic || t('result.actions.nextSet'))} (${selectedSetIndex ? `${t('live.lobby.selection.set')} ${selectedSetIndex + 1}` : t('common.next')})`
                    )}
                  </button>
                    <button onClick={async () => {
                        const topicName = quizCategoryName || category?.topic || mixedSectionName || 'QuizWeb';
                        await shareResult({
                          score,
                          total,
                          percentage,
                          topic: topicName,
                          quizId: quizSlug || quizId
                        });
                    }} className="flex items-center gap-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-widest hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-all ml-auto">
                        <Share2 size={14} /> {t('common.share')}
                    </button>
                </div>
              )}

              {/* Challenge a Friend Section */}
              <div className="mb-8 p-4 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-xl shadow-indigo-500/20 transform hover:scale-[1.02] transition-all">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-xl">⚔️</div>
                    <div>
                      <h4 className="text-sm font-black uppercase tracking-widest">{t('result.challenge.title') || 'Challenge a Friend'}</h4>
                      <p className="text-[10px] opacity-90 font-bold">{t('result.challenge.subtitle') || 'Prove you are the smartest in your group!'}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      const shareText = `🔥 I just scored ${score}/${total} (${percentage}%) on the ${quizCategoryName || category?.topic || 'QuizWeb'} quiz! Can you beat me?\n\nChallenge link: ${window.location.origin}${quizSlug || quizId ? `/category/${quizSlug || quizId}` : '/'}`;
                      window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, '_blank');
                    }}
                    className="px-4 py-2 bg-white text-indigo-600 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-indigo-50 transition-colors shadow-lg"
                  >
                    {t('result.challenge.btn')}
                  </button>
                </div>
              </div>
              
              {/* User Avatar & Name */}
              {authSession?.user && (
                <div className="flex flex-col items-center mb-6 animate-in fade-in zoom-in duration-500">
                  <div className="w-16 h-16 rounded-full border-4 border-indigo-500/20 p-1 mb-2">
                    <div className="w-full h-full rounded-full bg-indigo-100 flex items-center justify-center overflow-hidden">
                      {(userProfile?.avatar || authSession.user.image) ? (
                        <img 
                          src={userProfile?.avatar || authSession.user.image} 
                          alt="Profile" 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User size={32} className="text-indigo-500" />
                      )}
                    </div>
                  </div>
                  <span className="text-sm font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest">
                    {userProfile?.name || authSession.user.name}
                  </span>
                </div>
              )}

              {tier === "kids" ? (
                /* Kids Scoring Feedback: Stars & Sticker Celebration (Requirement 5) */
                <div className="flex flex-col items-center justify-center my-6 select-none text-center">
                  <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-950/40 flex items-center justify-center text-3xl mb-3 shadow-inner">
                    ⭐
                  </div>

                  <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mb-2">
                    {starCount === 3
                      ? (isHindi ? "शानदार खेल! 🌟" : "Superb Job! 🌟")
                      : (isHindi ? "बहुत बढ़िया! 🚀" : "Awesome Play! 🚀")}
                  </h1>

                  {/* Star Rating Display */}
                  <div className="flex items-center justify-center gap-2 mb-4">
                    {[1, 2, 3].map((starIdx) => {
                      const isFilled = starIdx <= starCount;
                      return (
                        <span
                          key={starIdx}
                          className={`text-5xl sm:text-6xl transition-transform duration-300 transform ${
                            isFilled
                              ? "scale-110 drop-shadow-[0_4px_12px_rgba(251,191,36,0.6)] animate-pulse"
                              : "opacity-25 filter grayscale"
                          }`}
                        >
                          ⭐
                        </span>
                      );
                    })}
                  </div>

                  {/* Encouraging Kid Badge */}
                  <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400 text-white font-black text-sm sm:text-base shadow-lg shadow-orange-500/20 mb-3">
                    <span>{starCount === 3 ? "🏆" : starCount === 2 ? "🚀" : "🎨"}</span>
                    <span>
                      {starCount === 3
                        ? (isHindi ? "सुपर स्टार चैंपियन!" : "Super Star Champion!")
                        : starCount === 2
                        ? (isHindi ? "अंतरिक्ष खोजकर्ता!" : "Space Explorer!")
                        : (isHindi ? "साहसी खिलाड़ी!" : "Nice Try, Keep Shining!")}
                    </span>
                  </div>

                  {/* Cheerful Motivation Message */}
                  <p className="text-sm font-bold text-slate-600 dark:text-slate-300 max-w-xs mb-4 leading-relaxed">
                    {starCount === 3
                      ? (isHindi ? "वाह! आपने 3 चमकदार स्टार्स जीते और नया स्टिकर अनलॉक किया!" : "Woohoo! You earned 3 shiny stars and unlocked a new sticker badge!")
                      : starCount === 2
                      ? (isHindi ? "बहुत बढ़िया! आपने 2 चमकदार स्टार्स जीते!" : "Awesome play! You unlocked 2 shiny stars!")
                      : (isHindi ? "शाबाश! सीखने के लिए 1 स्टार मिला!" : "Good effort! You earned a star for playing!")}
                  </p>

                  {/* Link to Rewards to see stickers */}
                  <Link
                    href="/rewards"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 text-xs font-black hover:scale-105 transition-all shadow-sm"
                  >
                    <span>🎁</span>
                    <span>{isHindi ? "स्टिकर एल्बम में देखें" : "View in Sticker Album"}</span>
                    <span>→</span>
                  </Link>
                </div>
              ) : (
                /* Students Numeric Scoring Feedback */
                <>
                  <div className={styles.trophy}>🏆</div>
                  <h1 className={styles.heading}>{t('result.title')}</h1>
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
                      <span className={styles.statLabel}>{t('result.stats.total')}</span>
                      <span className={styles.statValue}>{total}</span>
                    </div>
                    <div className={`${styles.statItem} ${styles.correct}`}>
                      <span className={styles.statLabel}>{t('result.stats.correct')}</span>
                      <span className={styles.statValue}>{performance?.correct}</span>
                    </div>
                    <div className={`${styles.statItem} ${styles.wrong}`}>
                      <span className={styles.statLabel}>{t('result.stats.wrong')}</span>
                      <span className={styles.statValue}>{performance?.wrong}</span>
                    </div>
                    <div className={`${styles.statItem} ${styles.skipped}`}>
                      <span className={styles.statLabel}>{t('result.stats.skipped')}</span>
                      <span className={styles.statValue}>{performance?.skipped}</span>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Action Buttons: One Primary "Next Set", One Secondary "Back to Home" */}
            <div className={styles.actions}>
              <div className="flex flex-col sm:flex-row gap-3 w-full">
                <button
                  className="btn-primary flex-1 whitespace-nowrap text-base font-bold py-3.5 shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2"
                  onClick={handleContinueNextSet}
                  disabled={isLaunchingNextSet}
                >
                  {isLaunchingNextSet ? (
                    <span>{isHindi ? "लोड हो रहा है..." : "Launching..."}</span>
                  ) : (
                    <span>{isHindi ? "अगला सेट खेलें →" : "Next Set →"}</span>
                  )}
                </button>

                <button
                  className="btn-secondary flex-1 whitespace-nowrap text-base font-semibold py-3.5"
                  onClick={() => router.push("/")}
                >
                  {isHindi ? "होम पर जाएं" : "Back to Home"}
                </button>
              </div>

              <div className="flex items-center justify-center gap-3 w-full mt-3">
                <button
                  className="text-xs font-semibold text-slate-400 hover:text-indigo-400 py-1 px-3 rounded-lg transition-colors"
                  onClick={() => setShowReview(!showReview)}
                >
                  {showReview ? (isHindi ? "समीक्षा छुपाएं" : "Hide Review") : (isHindi ? "📋 उत्तर समीक्षा देखें" : "📋 View Answer Review")}
                </button>
                <span className="text-slate-600">·</span>
                <button
                  className="text-xs font-semibold text-slate-400 hover:text-indigo-400 py-1 px-3 rounded-lg transition-colors"
                  onClick={handlePlayAgain}
                >
                  🔄 {isHindi ? "पुनः खेलें" : "Play Again"}
                </button>
              </div>

              {/* Daily Quiz Extra Links & Guest Streak Hint */}
              {isDailyQuiz && (
                <div style={{ marginTop: '16px', textAlign: 'center' }}>
                  <Link
                    href={`/daily-quiz/past?tier=${tier}`}
                    className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1.5"
                  >
                    <span>📅</span>
                    <span>{isHindi ? "पुराने दैनिक क्विज़ खेलें" : "Play past quizzes"}</span>
                    <span>→</span>
                  </Link>
                  {!authSession?.user && (
                    <p style={{ fontSize: '11px', color: '#f59e0b', marginTop: '6px', fontWeight: 'bold' }}>
                      ⭐ {isHindi ? "अपनी स्ट्रीक सुरक्षित रखने के लिए साइन इन करें" : "Sign in to keep your streak"}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Game Layer: XP Progression, Streak Freeze, 3-Fact Recap, Weak-Topic Hint, 1v1 Challenge */}
            <div className="w-full max-w-xl mx-auto">
              <GameResultsCard
                gameResult={gameResult}
                headToHead={headToHead}
                onChallengeFriend={handleChallengeFriend}
                isHindi={isHindi}
                score={score}
                total={totalQuestions}
              />
            </div>

            {/* Answer Review below actions */}
            {showReview && renderAnswerReview()}

            {/* Smart Next Up Recommendations */}
            <NextUpRecommendations
              currentTopicId={questions?.[0]?.topicId || questions?.[0]?.topic_id}
              currentCategoryId={quizId || category?.id}
              currentSetIndex={selectedSetIndex || 1}
              score={score}
              total={total}
              userId={authSession?.user?.id}
            />

            {/* Post-Quiz Donation Prompt */}
            <Link href="/donate" className="block mt-8 mb-4 p-1 rounded-2xl bg-gradient-to-r from-rose-100 to-rose-50 dark:from-rose-900/20 dark:to-rose-800/10 border border-rose-200 dark:border-rose-800/30 hover:scale-[1.01] transition-transform group">
              <div className="bg-white dark:bg-slate-900/50 rounded-xl px-6 py-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">☕</div>
                  <div>
                    <h4 className="text-sm font-black text-slate-800 dark:text-slate-200">{t('result.donate.title')}</h4>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">{t('result.donate.subtitle')}</p>
                  </div>
                </div>
                <div className="hidden sm:flex items-center gap-2 text-rose-500 dark:text-rose-400 font-black text-xs uppercase tracking-widest">
                  {t('result.donate.btn')} <ArrowRight size={14} />
                </div>
              </div>
            </Link>
          </div>
        </div>
      )}

      {/* Post Quiz Suggestions Popup (shown after a delay, non-explorer only) */}
      {!isExplorer && showPostQuizPopup && (
        <div className={styles.modalOverlay}>
          <div className={styles.suggestionsPopup}>
            <button className={styles.closeBtn} onClick={() => setShowPostQuizPopup(false)}>✕</button>
            
            <div className={styles.popupHeader}>
              <h2 className={styles.popupTitle}>{t('result.popup.title')}</h2>
               <div className={styles.searchBar}>
                 <input 
                   type="text" 
                   placeholder={t('result.popup.searchPlaceholder')} 
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
                  {t('result.popup.continuePrefix')} {(isHindi && category?.topicHi) ? category.topicHi : (category?.topic || t('result.popup.thisCategory'))}
                </button>
              )}

              <div className={styles.suggestionsList}>
                 <h3 className={styles.suggestionsLabel}>
                   {t('result.popup.exploreAll')}
                 </h3>
                <div className={styles.miniSuggestionsGrid}>
                  {filteredQuizzes.map(quiz => (
                    <div 
                      key={quiz.id} 
                      className={styles.miniSuggestionCard}
                      onClick={() => handleSuggestionClick(quiz.id)}
                    >
                      <span className={styles.miniSuggestionEmoji}>{quiz.emoji || '📚'}</span>
                      <span className={styles.miniSuggestionTitle}>
                        {isHindi && quiz.topicHi ? quiz.topicHi : quiz.topic}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <AdGate 
         isOpen={showGateAd && total > 0 && !isPro}
         onClose={() => setShowGateAd(false)}
         onComplete={() => setShowGateAd(false)}
         title={t('result.unlocking')}
      />
    </main>
  );
}
