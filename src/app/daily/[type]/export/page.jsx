"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import styles from "@/styles/DailyExport.module.css";

const TYPE_META = {
  "quiz-of-the-day": { label: "Quiz of the day", emoji: "🌟" },
  "daily-current-affairs": { label: "Daily current affairs", emoji: "🗞️" },
};

function today() {
  return new Date().toISOString().slice(0, 10);
}

export default function DailyExportPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const type = String(params?.type || "");
  const meta = TYPE_META[type];
  const date = searchParams.get("date") || today();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [settings, setSettings] = useState(null);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (!meta) return;
    let cancelled = false;
    async function load() {
      setLoading(true);
      setMsg("");
      try {
        const [dailyRes, settingsRes] = await Promise.all([
          fetch(`/api/daily-quizzes?type=${encodeURIComponent(type)}&date=${encodeURIComponent(date)}`),
          fetch("/api/settings"),
        ]);
        if (!cancelled && dailyRes.ok) setData(await dailyRes.json());
        if (!cancelled && settingsRes.ok) setSettings(await settingsRes.json());
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

  useEffect(() => {
    if (!meta) return;
    document.title = `${meta.label} - ${date}`;
  }, [meta, date]);

  const questions = useMemo(() => data?.questions || [], [data]);
  const companyName = settings?.companyName || "QuizWeb";
  const companyWebsite = settings?.companyWebsite || "";

  const printNow = () => {
    window.print();
  };

  if (!meta) {
    return (
      <div className={styles.page}>
        <div className={styles.toolbar}>
          <Link href="/" className={styles.backLink}>← Back</Link>
        </div>
        <div className={styles.card}>
          <div className={styles.title}>Not found</div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.toolbar}>
          <Link href={`/daily/${type}`} className={styles.backLink}>← Back</Link>
        </div>
        <div className={styles.card}>Loading…</div>
      </div>
    );
  }

  if (!data?.daily) {
    return (
      <div className={styles.page}>
        <div className={styles.toolbar}>
          <Link href={`/daily/${type}`} className={styles.backLink}>← Back</Link>
        </div>
        <div className={styles.card}>
          <div className={styles.title}>{meta.emoji} {meta.label}</div>
          <div className={styles.subTitle}>Date: {date}</div>
          <div className={styles.msg}>{msg || "No quiz set for this date yet."}</div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.toolbar}>
        <Link href={`/daily/${type}?date=${encodeURIComponent(date)}`} className={styles.backLink}>← Back</Link>
        <button type="button" className={styles.printBtn} onClick={printNow}>Print / Save PDF</button>
      </div>

      <article className={styles.sheet}>
        <header className={styles.sheetHeader}>
          <div className={styles.brand}>{companyName}</div>
          <div className={styles.sheetTitle}>{meta.emoji} {meta.label}</div>
          <div className={styles.sheetMeta}>Date: {date}</div>
        </header>

        <section className={styles.body}>
          {questions.map((q, idx) => (
            <div key={q.id} className={styles.qBlock}>
              <div className={styles.qText}>
                <span className={styles.qNum}>{idx + 1}.</span> {q.text}
              </div>
              {Array.isArray(q.options) && (
                <ul className={styles.opts}>
                  {q.options.map((o, i) => (
                    <li key={`${q.id}-${i}`}>{o}</li>
                  ))}
                </ul>
              )}
              <div className={styles.answer}><span>Answer:</span> {q.correctAnswer}</div>
            </div>
          ))}
        </section>

        <footer className={styles.sheetFooter}>
          <div>{companyWebsite}</div>
        </footer>
      </article>
    </div>
  );
}
