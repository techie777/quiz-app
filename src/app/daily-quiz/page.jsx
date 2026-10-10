"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTier } from "@/context/TierContext";
import { useLanguage } from "@/context/LanguageContext";
import { useQuiz } from "@/context/QuizContext";
import styles from "@/styles/PastDailyQuizzes.module.css";
import toast from "react-hot-toast";
import {
  Flame,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
  RotateCcw,
  Calendar,
  Layers,
  Award,
  BookOpen,
} from "lucide-react";

function getTodayString() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function DailyQuizHubPage() {
  const { tier } = useTier();
  const { isHindi } = useLanguage();
  const { startQuizSet } = useQuiz();
  const router = useRouter();

  const todayStr = useMemo(() => getTodayString(), []);

  const [days, setDays] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [playingDate, setPlayingDate] = useState(null);
  const [completedMap, setCompletedMap] = useState({});

  // Streak Calculation State
  const [streakCount, setStreakCount] = useState(1);

  // Load completed attempts & calculate streak from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("quizweb_daily_attempts");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const map = {};
          const completedDates = new Set();

          parsed.forEach((a) => {
            if (a.date) {
              map[a.date] = `${a.score || 0}/${a.total || (tier === "kids" ? 5 : 10)}`;
              completedDates.add(a.date);
            }
          });
          setCompletedMap(map);

          // Calculate consecutive streak days
          let streak = 0;
          let checkDate = new Date();

          // If today is completed or not completed, check backward
          if (!completedDates.has(todayStr)) {
            // Check if yesterday was completed
            checkDate.setDate(checkDate.getDate() - 1);
          }

          while (true) {
            const y = checkDate.getFullYear();
            const m = String(checkDate.getMonth() + 1).padStart(2, "0");
            const d = String(checkDate.getDate()).padStart(2, "0");
            const dateKey = `${y}-${m}-${d}`;

            if (completedDates.has(dateKey)) {
              streak++;
              checkDate.setDate(checkDate.getDate() - 1);
            } else {
              break;
            }
          }

          setStreakCount(Math.max(streak, completedDates.has(todayStr) ? 1 : 0));
        }
      }
    } catch (e) {
      console.warn("Error reading local attempts:", e);
    }
  }, [todayStr, tier]);

  // Fetch page of past days
  useEffect(() => {
    async function fetchPastDays() {
      if (page === 1) setLoading(true);
      else setLoadingMore(true);

      try {
        const res = await fetch(`/api/daily-quiz/past?tier=${encodeURIComponent(tier || "explorer")}&page=${page}`);
        if (res.ok) {
          const data = await res.json();
          if (page === 1) {
            setDays(data.days || []);
          } else {
            setDays((prev) => [...prev, ...(data.days || [])]);
          }
          setHasMore(Boolean(data.hasMore));
        }
      } catch (err) {
        console.error("Failed to load past daily quizzes:", err);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    }

    fetchPastDays();
  }, [tier, page]);

  // Start Playing Quiz on specified Date
  const handlePlayQuiz = async (dayItem) => {
    setPlayingDate(dayItem.date);
    try {
      const res = await fetch(
        `/api/daily-quiz?tier=${encodeURIComponent(tier || "explorer")}&date=${encodeURIComponent(dayItem.date)}`
      );
      if (!res.ok) throw new Error("Failed to fetch questions");
      const data = await res.json();

      const questions = data.questions || [];
      if (questions.length === 0) {
        toast.error(isHindi ? "इस तारीख के लिए प्रश्न उपलब्ध नहीं हैं।" : "No questions available for this date.");
        return;
      }

      const timerSecs = tier === "kids" ? 0 : 15;
      const categoryId = `daily-${tier}-${dayItem.date}`;
      const title = `${isHindi ? "दैनिक क्विज़" : "Daily Quiz"} • ${dayItem.date}`;

      const normalizedQuestions = questions.map((q) => ({
        ...q,
        categoryId,
      }));

      sessionStorage.setItem(
        "current_daily_quiz",
        JSON.stringify({
          tier,
          date: dayItem.date,
          dailyQuizId: data.daily?.id || categoryId,
          isToday: dayItem.isToday,
        })
      );

      startQuizSet(categoryId, normalizedQuestions, timerSecs, "en", 0, title, true);
      router.push(`/quiz/${categoryId}`);
    } catch (err) {
      console.error("Error starting daily quiz:", err);
      toast.error(isHindi ? "क्विज़ लोड करने में त्रुटि।" : "Error starting quiz. Please try again.");
    } finally {
      setPlayingDate(null);
    }
  };

  const isTodayCompleted = Boolean(completedMap[todayStr]);
  const todayScore = completedMap[todayStr];

  // 7-Day Mini Streak Tracker calculation
  const currentWeekDays = useMemo(() => {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 is Sun, 1 is Mon...
    const mondayDist = (dayOfWeek + 6) % 7;
    const monday = new Date(today);
    monday.setDate(today.getDate() - mondayDist);

    const week = [];
    const dayNamesEn = ["M", "T", "W", "T", "F", "S", "S"];
    const dayNamesHi = ["सोम", "मंगल", "बुध", "गुरु", "शुक्र", "शनि", "रवि"];

    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const dayNum = String(d.getDate()).padStart(2, "0");
      const dateKey = `${y}-${m}-${dayNum}`;

      week.push({
        dateStr: dateKey,
        dayLabel: isHindi ? dayNamesHi[i] : dayNamesEn[i],
        dayNum: d.getDate(),
        isToday: dateKey === todayStr,
        isCompleted: Boolean(completedMap[dateKey]),
        isPast: d < today && dateKey !== todayStr,
      });
    }

    return week;
  }, [todayStr, completedMap, isHindi]);

  const formatDateDisplay = (dateStr) => {
    try {
      const parts = dateStr.split("-").map(Number);
      if (parts.length !== 3) return dateStr;
      const [y, m, d] = parts;
      const date = new Date(y, m - 1, d);
      return date.toLocaleDateString(isHindi ? "hi-IN" : "en-US", {
        weekday: "short",
        day: "numeric",
        month: "short",
      });
    } catch {
      return dateStr;
    }
  };

  const todayItem = {
    date: todayStr,
    isToday: true,
    questionCount: tier === "kids" ? 5 : 10,
  };

  return (
    <div className={styles.container}>
      {/* 1. Header Row */}
      <div className={styles.header}>
        <Link href="/" className={styles.backBtn}>
          ← {isHindi ? "होम पर वापस" : "Back to Home"}
        </Link>
        <div className={styles.titleRow}>
          <h1 className={styles.title}>
            🔥 {isHindi ? "दैनिक क्विज़ चैलेंज" : "Daily Quiz Challenge"}
          </h1>
          <div className={styles.streakPill}>
            <Flame size={14} className="text-amber-200 fill-amber-200" />
            <span>
              {streakCount} {isHindi ? "दिनों की स्ट्रीक" : "Days Streak"}
            </span>
          </div>
        </div>
        <p className={styles.subtitle}>
          {isHindi
            ? "दैनिक अभ्यास करें, अपनी स्ट्रीक बनाए रखें और बोनस XP रिवॉर्ड जीतें।"
            : "Challenge your mind daily, maintain your streak, and earn bonus XP rewards."}
        </p>
      </div>

      {/* 2. TODAY'S LIVE HERO CHALLENGE CARD */}
      <div className={styles.todayHeroCard}>
        <div className={styles.todayHeroTop}>
          <span className={styles.todayDateBadge}>
            ✨ {isHindi ? "आज की लाइव चुनौती" : "Today's Live Challenge"}
          </span>
          <span className="text-xs font-bold text-slate-500">
            {formatDateDisplay(todayStr)}
          </span>
        </div>

        <h2 className={styles.todayHeadline}>
          {isHindi ? "आज का सामान्य ज्ञान व सामयिकी टेस्ट" : "Today's General Knowledge & Affairs"}
        </h2>

        <div className={styles.todayMetaList}>
          <div className={styles.todayMetaItem}>
            <Layers size={14} className="text-indigo-600" />
            <span>{tier === "kids" ? "5" : "10"} {isHindi ? "प्रश्न" : "Questions"}</span>
          </div>
          <div className={styles.todayMetaItem}>
            <Clock size={14} className="text-amber-600" />
            <span>{tier === "kids" ? (isHindi ? "बिना समय सीमा" : "Untimed") : (isHindi ? "15 सेकंड / प्रश्न" : "15s / Question")}</span>
          </div>
          <div className={styles.todayMetaItem}>
            <Award size={14} className="text-emerald-600" />
            <span>+50 XP {isHindi ? "रिवॉर्ड" : "Reward"}</span>
          </div>
        </div>

        {isTodayCompleted ? (
          <div className={styles.todayCompletedBanner}>
            <div className={styles.todayCompletedText}>
              <CheckCircle2 size={18} className="text-emerald-600" />
              <span>
                {isHindi ? "आज का क्विज़ पूर्ण! स्कोर:" : "Completed Today! Score:"} {todayScore}
              </span>
            </div>
            <button
              type="button"
              className={styles.replayBtn}
              onClick={() => handlePlayQuiz(todayItem)}
              disabled={playingDate === todayStr}
            >
              <RotateCcw size={13} />
              <span>{isHindi ? "पुनः खेलें" : "Replay"}</span>
            </button>
          </div>
        ) : (
          <button
            type="button"
            className={styles.todayActionBtn}
            onClick={() => handlePlayQuiz(todayItem)}
            disabled={playingDate === todayStr}
          >
            {playingDate === todayStr ? (
              <span>{isHindi ? "क्विज़ लोड हो रहा है..." : "Loading Challenge..."}</span>
            ) : (
              <>
                <span>⚡</span>
                <span>{isHindi ? "आज का क्विज़ खेलें (+50 XP)" : "Start Today's Quiz (+50 XP)"}</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        )}
      </div>

      {/* 3. 7-DAY MINI STREAK CALENDAR TRACKER */}
      <div className={styles.streakTrackerBox}>
        <div className={styles.streakTrackerHeader}>
          <div className={styles.streakTrackerTitle}>
            <Calendar size={14} className="text-indigo-600" />
            <span>{isHindi ? "इस सप्ताह की स्ट्रीक ट्रैकर" : "This Week's Streak Tracker"}</span>
          </div>
          <span className="text-[11px] font-bold text-slate-400">
            {streakCount > 0
              ? `${streakCount} ${isHindi ? "दिन सक्रिय" : "Days Active"}`
              : isHindi
              ? "आज शुरू करें"
              : "Start today"}
          </span>
        </div>

        <div className={styles.weekStreakDays}>
          {currentWeekDays.map((d) => (
            <div
              key={d.dateStr}
              className={`${styles.streakDayItem} ${d.isToday ? styles.streakDayActive : ""}`}
            >
              <span className={styles.streakDayLabel}>{d.dayLabel}</span>
              <div
                className={`${styles.streakDayStatus} ${
                  d.isCompleted
                    ? styles.statusDone
                    : d.isToday
                    ? styles.statusPending
                    : styles.statusMissed
                }`}
              >
                {d.isCompleted ? "✓" : d.isToday ? "🔥" : "•"}
              </div>
              <span className="text-[10px] font-black text-slate-700 dark:text-slate-300">
                {d.dayNum}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 4. PAST DAILY ARCHIVE LIST */}
      <div className={styles.sectionTitleRow}>
        <div className={styles.sectionTitle}>
          <span>📅</span>
          <span>{isHindi ? "पिछले दैनिक क्विज़ (अभ्यास हेतु)" : "Past Daily Challenges Archive"}</span>
        </div>
        <span className="text-xs font-bold text-slate-400">
          {days.length} {isHindi ? "दिन उपलब्ध" : "Days Available"}
        </span>
      </div>

      {loading ? (
        <div className="py-12 text-center text-xs font-bold text-slate-400 animate-pulse">
          {isHindi ? "पुराने क्विज़ लोड हो रहे हैं..." : "Loading past challenges..."}
        </div>
      ) : (
        <div className={styles.list}>
          {days
            .filter((item) => item.date !== todayStr) // Today is prominently showcased in Hero
            .map((item) => {
              const isCompleted = Boolean(completedMap[item.date]);
              const scoreDisplay = completedMap[item.date];

              return (
                <div key={item.date} className={styles.row}>
                  <div className={styles.rowLeft}>
                    <div className={styles.dateIcon}>📆</div>
                    <div>
                      <div className={styles.dateText}>{formatDateDisplay(item.date)}</div>
                      <div className={styles.metaText}>
                        {item.questionCount} {isHindi ? "प्रश्न" : "Questions"}
                      </div>
                    </div>
                  </div>

                  <div>
                    {isCompleted ? (
                      <div className="flex items-center gap-2">
                        <div className={styles.scoreBadge}>
                          <span>✓</span>
                          <span>{scoreDisplay}</span>
                        </div>
                        <button
                          type="button"
                          className={styles.playBtn}
                          style={{ padding: "0 10px", background: "transparent", border: "1px solid #cbd5e1", color: "#64748b" }}
                          onClick={() => handlePlayQuiz(item)}
                          disabled={playingDate === item.date}
                          title={isHindi ? "पुनः खेलें" : "Replay"}
                        >
                          <RotateCcw size={13} />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        className={styles.playBtn}
                        onClick={() => handlePlayQuiz(item)}
                        disabled={playingDate === item.date}
                      >
                        {playingDate === item.date ? (
                          <span>{isHindi ? "लोड..." : "Loading..."}</span>
                        ) : (
                          <>
                            <span>▶</span>
                            <span>{isHindi ? "खेलें" : "Play"}</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

          {hasMore && (
            <button
              type="button"
              className={styles.loadMoreBtn}
              onClick={() => setPage((p) => p + 1)}
              disabled={loadingMore}
            >
              {loadingMore
                ? isHindi
                  ? "लोड हो रहा है..."
                  : "Loading..."
                : isHindi
                ? "और पुराने दिन देखें (Load More)"
                : "Load More Days"}
            </button>
          )}
        </div>
      )}

      {/* 5. CROSS-PROMOTION BANNER TO DAILY CURRENT AFFAIRS */}
      <Link href="/daily-current-affairs" className={styles.caBanner}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500 text-white flex items-center justify-center text-lg shrink-0 shadow-sm">
            🗞️
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-black text-slate-900 leading-tight">
              {isHindi ? "आज के करंट अफेयर्स व समाचार पढ़ें" : "Read Today's Current Affairs & One-Liners"}
            </h4>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {isHindi
                ? "दैनिक परीक्षा-उन्मुख समाचार, वन-लाइनर और फ्लैशकार्ड्स।"
                : "Curated exam-oriented stories, one-liners & flashcard revision."}
            </p>
          </div>
        </div>
        <ArrowRight size={16} className="text-blue-600 shrink-0" />
      </Link>
    </div>
  );
}
