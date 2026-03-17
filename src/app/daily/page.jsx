"use client";

import Link from "next/link";
import styles from "@/styles/DailyHub.module.css";

export default function DailyHubPage() {
  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>📅 Daily Quiz</h1>
        <p className={styles.subtitle}>Choose what you want to play today, or pick a past date.</p>
      </div>

      <div className={styles.grid}>
        <Link href="/daily/quiz-of-the-day" className={`${styles.card} glass-card`}>
          <div className={styles.cardTop}>
            <span className={styles.emoji}>🌟</span>
            <span className={styles.tag}>Quiz of the day</span>
          </div>
          <div className={styles.desc}>Curated daily quiz with past & present days.</div>
        </Link>

        <Link href="/daily/daily-current-affairs" className={`${styles.card} glass-card`}>
          <div className={styles.cardTop}>
            <span className={styles.emoji}>🗞️</span>
            <span className={styles.tag}>Daily current affairs</span>
          </div>
          <div className={styles.desc}>Current affairs quiz with history + PDF export.</div>
        </Link>
      </div>
    </div>
  );
}

