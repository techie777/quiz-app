"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTier } from "@/context/TierContext";
import { useLanguage } from "@/context/LanguageContext";
import { useQuiz } from "@/context/QuizContext";
import styles from "@/styles/PastDailyQuizzes.module.css";
import toast from "react-hot-toast";

export default function PastDailyQuizzesPage() {
  const { tier } = useTier();
  const { isHindi } = useLanguage();
  const { startQuizSet } = useQuiz();
  const router = useRouter();

  const [days, setDays] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [playingDate, setPlayingDate] = useState(null);
  const [completedMap, setCompletedMap] = useState({});

  // Load completed attempts from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("quizweb_daily_attempts");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const map = {};
          parsed.forEach((a) => {
            if (a.date) {
              map[a.date] = `${a.score || 0}/${a.total || 10}`;
            }
          });
          setCompletedMap(map);
        }
      }
    } catch {}
  }, []);

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

  const handlePlayPastQuiz = async (dayItem) => {
    setPlayingDate(dayItem.date);
    try {
      const res = await fetch(`/api/daily-quiz?tier=${encodeURIComponent(tier || "explorer")}&date=${encodeURIComponent(dayItem.date)}`);
      if (!res.ok) throw new Error("Failed to fetch questions");
      const data = await res.json();

      const questions = data.questions || [];
      if (questions.length === 0) {
        toast.error(isHindi ? "इस तारीख के लिए प्रश्न उपलब्ध नहीं हैं।" : "No questions available for this date.");
        return;
      }

      const timerSecs = tier === "kids" ? 0 : 15;
      const categoryId = `daily-${tier}-${dayItem.date}`;
      const title = `${isHindi ? "दैनिक क्विज़" : "Daily Quiz"} · ${dayItem.date}`;

      const normalizedQuestions = questions.map((q) => ({
        ...q,
        categoryId,
      }));

      // Store daily quiz metadata for the result screen
      sessionStorage.setItem("current_daily_quiz", JSON.stringify({
        tier,
        date: dayItem.date,
        dailyQuizId: data.daily?.id || categoryId,
        isToday: dayItem.isToday,
      }));

      startQuizSet(categoryId, normalizedQuestions, timerSecs, "en", 0, title, true);
      router.push(`/quiz/${categoryId}`);
    } catch (err) {
      console.error("Error starting past quiz:", err);
      toast.error(isHindi ? "क्विज़ लोड करने में त्रुटि" : "Error starting quiz. Please try again.");
    } finally {
      setPlayingDate(null);
    }
  };

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
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Link href="/" className={styles.backBtn}>
          ← {isHindi ? "होम पर वापस" : "Back to Home"}
        </Link>
        <h1 className={styles.title}>
          📅 {isHindi ? "पुराने दैनिक क्विज़" : "Past Daily Quizzes"}
        </h1>
        <p className={styles.subtitle}>
          {isHindi
            ? "पिछले दैनिक क्विज़ कभी भी अभ्यास के लिए खेलें।"
            : "Replay and practice past daily challenges anytime."}
        </p>

        <div className={styles.streakNotice}>
          <span>💡</span>
          <span>
            {isHindi
              ? "ध्यान दें: केवल आज के दिन खेला गया क्विज़ आपकी स्ट्रीक बढ़ाता है।"
              : "Rule: Only quizzes played on the actual day count towards your streak."}
          </span>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "40px 0", color: "#94a3b8", fontWeight: "bold" }}>
          {isHindi ? "लोड हो रहा है..." : "Loading past quizzes..."}
        </div>
      ) : days.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px 0", color: "#94a3b8" }}>
          {isHindi ? "कोई पुराना क्विज़ नहीं मिला।" : "No past quizzes found."}
        </div>
      ) : (
        <div className={styles.list}>
          {days.map((item) => {
            const isCompleted = Boolean(completedMap[item.date]);
            const scoreDisplay = completedMap[item.date];

            return (
              <div key={item.date} className={styles.row}>
                <div className={styles.rowLeft}>
                  <div className={styles.dateIcon}>
                    {item.isToday ? "🔥" : "📆"}
                  </div>
                  <div>
                    <div className={styles.dateText}>
                      {formatDateDisplay(item.date)}
                      {item.isToday && (
                        <span style={{ marginLeft: "8px", fontSize: "0.75rem", color: "#ea580c", fontWeight: "bold" }}>
                          ({isHindi ? "आज" : "Today"})
                        </span>
                      )}
                    </div>
                    <div className={styles.metaText}>
                      {item.questionCount} {isHindi ? "प्रश्न" : "Questions"}
                    </div>
                  </div>
                </div>

                <div>
                  {isCompleted ? (
                    <div className={styles.scoreBadge}>
                      <span>✓</span>
                      <span>{scoreDisplay}</span>
                    </div>
                  ) : (
                    <button
                      className={styles.playBtn}
                      onClick={() => handlePlayPastQuiz(item)}
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
              className={styles.loadMoreBtn}
              onClick={() => setPage((p) => p + 1)}
              disabled={loadingMore}
            >
              {loadingMore
                ? (isHindi ? "लोड हो रहा है..." : "Loading...")
                : (isHindi ? "और देखें (Load More)" : "Load More Days")}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
