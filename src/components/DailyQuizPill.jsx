"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useData } from "@/context/DataContext";
import { useTier } from "@/context/TierContext";
import { useLanguage } from "@/context/LanguageContext";
import { useQuiz } from "@/context/QuizContext";
import { getTodayIST, normalizeDailyTier } from "@/lib/dailyQuizHelper";
import styles from "@/styles/DailyQuizPill.module.css";
import toast from "react-hot-toast";

export default function DailyQuizPill({ tier: propTier }) {
  const { tier: contextTier } = useTier();
  const { modules } = useData();
  const { isHindi } = useLanguage();
  const { startQuizSet } = useQuiz();
  const router = useRouter();

  const activeTier = normalizeDailyTier(propTier || contextTier);
  const tierKey = activeTier === "adults" ? "explorer" : activeTier;

  // Check if daily quiz is enabled for this tier in module feature flags
  const isEnabled = modules?.dailyQuiz?.[tierKey] !== false;

  const [loading, setLoading] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [scoreDisplay, setScoreDisplay] = useState("");
  const [streakCount, setStreakCount] = useState(0);

  const todayIST = getTodayIST();

  useEffect(() => {
    // Check localStorage for today's attempt and streak
    try {
      const savedStreak = localStorage.getItem("quizweb_daily_streak");
      if (savedStreak) {
        const parsed = JSON.parse(savedStreak);
        if (parsed.count) setStreakCount(parsed.count);
      }

      const savedAttempts = localStorage.getItem("quizweb_daily_attempts");
      if (savedAttempts) {
        const attempts = JSON.parse(savedAttempts);
        if (Array.isArray(attempts)) {
          const todayAttempt = attempts.find(
            (a) => a.date === todayIST && normalizeDailyTier(a.tier) === activeTier
          );
          if (todayAttempt) {
            setCompleted(true);
            setScoreDisplay(`${todayAttempt.score || 0}/${todayAttempt.total || (activeTier === "kids" ? 5 : 10)}`);
          }
        }
      }
    } catch {}
  }, [todayIST, activeTier]);

  if (!isEnabled) return null;

  const handleStartDailyQuiz = async () => {
    if (loading) return;
    setLoading(true);

    try {
      const res = await fetch(`/api/daily-quiz?tier=${encodeURIComponent(activeTier)}&date=${encodeURIComponent(todayIST)}`);
      if (!res.ok) throw new Error("Failed to load questions");
      const data = await res.json();

      const questions = data.questions || [];
      if (questions.length === 0) {
        toast.error(isHindi ? "आज के प्रश्न लोड नहीं हो सके।" : "Could not load today's questions.");
        return;
      }

      const timerSecs = activeTier === "kids" ? 0 : 15;
      const categoryId = `daily-${activeTier}-${todayIST}`;
      const title = `${isHindi ? "दैनिक क्विज़" : "Daily Quiz"} · ${todayIST}`;

      const normalizedQuestions = questions.map((q) => ({
        ...q,
        categoryId,
      }));

      // Store daily quiz metadata for the result screen
      sessionStorage.setItem("current_daily_quiz", JSON.stringify({
        tier: activeTier,
        date: todayIST,
        dailyQuizId: data.daily?.id || categoryId,
        isToday: true,
      }));

      startQuizSet(categoryId, normalizedQuestions, timerSecs, "en", 0, title, true);
      router.push(`/quiz/${categoryId}`);
    } catch (err) {
      console.error("[DailyQuizPill] Start error:", err);
      toast.error(isHindi ? "क्विज़ लोड करने में त्रुटि" : "Error starting quiz. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── KIDS TIER VARIANT ──
  if (activeTier === "kids") {
    return (
      <div className={styles.kidsWrapper}>
        <button
          id="kids-daily-quiz-btn"
          className={styles.kidsPillButton}
          onClick={handleStartDailyQuiz}
          disabled={loading}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "1.4rem" }}>⭐</span>
            <span className={styles.kidsPillTitle}>
              {isHindi ? "दैनिक क्विज़ (Daily Quiz)" : "Daily Quiz"}
            </span>
          </div>

          <div className={styles.kidsPillBadge}>
            {loading
              ? (isHindi ? "लोड..." : "Loading...")
              : completed
              ? `✓ ${scoreDisplay || "5/5"}`
              : (isHindi ? "खेलें (Play)" : "Play ▶")}
          </div>
        </button>

        <Link
          href={`/daily-quiz/past?tier=kids`}
          className={styles.kidsHistoryBtn}
          title={isHindi ? "पुराने क्विज़" : "Past Quizzes"}
        >
          <span style={{ fontSize: "1.1rem" }}>📅</span>
          <span>{isHindi ? "पुराने" : "Past"}</span>
        </Link>
      </div>
    );
  }

  // ── STUDENTS & EXPLORER STANDARD VARIANT ──
  return (
    <div className={styles.wrapper}>
      <button
        id="daily-quiz-pill-btn"
        className={styles.pillButton}
        onClick={handleStartDailyQuiz}
        disabled={loading}
      >
        <div className={styles.pillLeft}>
          <span className={styles.fireIcon}>🔥</span>
          <span className={styles.pillTitle}>
            {isHindi ? "दैनिक क्विज़" : "Daily Quiz"}
          </span>
          {streakCount > 0 && (
            <span className={styles.streakBadge} title="Streak">
              ⚡ {streakCount}
            </span>
          )}
        </div>

        <div>
          {loading ? (
            <span className={styles.actionTagPlay}>
              {isHindi ? "लोड..." : "Loading..."}
            </span>
          ) : completed ? (
            <span className={styles.actionTagDone}>
              ✓ {scoreDisplay || "Done"}
            </span>
          ) : (
            <span className={styles.actionTagPlay}>
              {isHindi ? "खेलें" : "Play"} ▶
            </span>
          )}
        </div>
      </button>

      <Link
        id="daily-quiz-past-btn"
        href={`/daily-quiz/past?tier=${activeTier}`}
        className={styles.historyButton}
        title={isHindi ? "पुराने दैनिक क्विज़" : "Past Daily Quizzes"}
      >
        <span>📅</span>
        <span>{isHindi ? "पुराने" : "Past"}</span>
      </Link>
    </div>
  );
}
