"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useData } from "@/context/DataContext";
import { useQuiz } from "@/context/QuizContext";
import styles from "@/styles/DailyQuiz.module.css";

const TYPE_META = {
  "quiz-of-the-day": { label: "Quiz of the day", emoji: "🌟" },
  "daily-current-affairs": { label: "Daily current affairs", emoji: "🗞️" },
};

function today() {
  return new Date().toISOString().slice(0, 10);
}

export default function DailyQuizPage() {
  const params = useParams();
  const router = useRouter();
  const { settings } = useData();
  const { startQuizSet } = useQuiz();

  const type = String(params?.type || "");
  const meta = TYPE_META[type];
  const [date, setDate] = useState(today());
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (!meta) router.replace("/");
  }, [meta, router]);

  useEffect(() => {
    if (!meta) return;
    let cancelled = false;
    async function load() {
      setLoading(true);
      setMsg("");
      try {
        const [dailyRes, histRes] = await Promise.all([
          fetch(`/api/daily-quizzes?type=${encodeURIComponent(type)}&date=${encodeURIComponent(date)}`),
          fetch(`/api/daily-quizzes/history?type=${encodeURIComponent(type)}`),
        ]);
        if (!cancelled && dailyRes.ok) setData(await dailyRes.json());
        if (!cancelled && histRes.ok) setHistory(await histRes.json());
      } catch {
        if (!cancelled) setMsg("Failed to load.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [type, date, meta]);

  const playable = useMemo(() => {
    const qs = data?.questions || [];
    return Array.isArray(qs) && qs.length > 0 && data?.daily?.categoryId;
  }, [data]);

  const play = () => {
    if (!playable) return;
    const categoryId = data.daily.categoryId;
    const language = data?.category?.originalLang || "en";
    startQuizSet(categoryId, data.questions, 0, language);
    router.push(`/quiz/${categoryId}`);
  };

  const exportPdf = () => {
    if (!playable) return;
    window.open(`/daily/${encodeURIComponent(type)}/export?date=${encodeURIComponent(date)}`, "_blank");
  };

  if (!meta) return null;

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.loading}>Loading...</div>
      </div>
    );
  }

  const hasDaily = !!data?.daily;
  const questionCount = (data?.questions || []).length;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>
            {meta.emoji} {meta.label}
          </h1>
          <p className={styles.subtitle}>
            {hasDaily ? `${questionCount} questions` : "No quiz set for this date yet."}
          </p>
        </div>
        <div className={styles.headerActions}>
          <input className={styles.dateInput} type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          <button className="btn-secondary" type="button" onClick={() => setDate(today())}>
            Today
          </button>
          <button className="btn-primary" type="button" onClick={play} disabled={!playable}>
            ▶ Play
          </button>
          <button className="btn-secondary" type="button" onClick={exportPdf} disabled={!playable}>
            📄 Export PDF
          </button>
        </div>
      </div>

      {msg && <div className={styles.msg}>{msg}</div>}

      <div className={styles.body}>
        <div className={`${styles.panel} glass-card`}>
          <h2 className={styles.panelTitle}>Quiz</h2>
          {!hasDaily ? (
            <div className={styles.empty}>No questions for {date}. Try a past date from the right panel.</div>
          ) : (
            <div className={styles.qList}>
              {data.questions.map((q, idx) => (
                <div key={q.id} className={styles.qItem}>
                  <div className={styles.qTop}>
                    <span className={styles.qNum}>{idx + 1}</span>
                    <span className={styles.qText}>{q.text}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={`${styles.panel} glass-card`}>
          <h2 className={styles.panelTitle}>Past Days</h2>
          <div className={styles.historyList}>
            {history.map((h) => (
              <button
                key={h.date}
                type="button"
                className={`${styles.historyBtn} ${h.date === date ? styles.historyBtnActive : ""}`}
                onClick={() => setDate(h.date)}
              >
                <span>{h.date}</span>
                <span className={styles.historyCount}>{h.questionCount}</span>
              </button>
            ))}
            {history.length === 0 && <div className={styles.empty}>No saved days yet.</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
