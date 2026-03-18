"use client";

import { useData } from "@/context/DataContext";
import Link from "next/link";
import styles from "@/styles/DailyIndex.module.css";

const ITEMS = [
  { 
    id: "quiz-of-the-day", 
    label: "Quiz of the day", 
    emoji: "🌟", 
    desc: "A hand-picked selection of questions to start your day.",
    categoryId: "65f1a2b3c4d5e6f7a8b9c0d9"
  },
  { 
    id: "daily-current-affairs", 
    label: "Daily current affairs", 
    emoji: "🗞️", 
    desc: "Stay updated with the latest news and events.",
    categoryId: "65f1a2b3c4d5e6f7a8b9c0e1"
  },
];

export default function DailyIndexPage() {
  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Daily Quizzes</h1>
      <p className={styles.subtitle}>Test your knowledge every day with our curated quizzes</p>

      <div className={styles.grid}>
        {ITEMS.map((item) => (
          <Link key={item.id} href={`/daily/${item.id}`} className={`${styles.card} glass-card`}>
            <div className={styles.cardTop}>
              <div className={styles.emoji}>{item.emoji}</div>
              <h2 className={styles.tag}>{item.label}</h2>
            </div>
            <p className={styles.desc}>{item.desc}</p>
            <div className={styles.cardAction}>
              <span>View Quiz</span>
              <span className={styles.arrow}>→</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

