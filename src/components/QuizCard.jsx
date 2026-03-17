"use client";

import styles from "@/styles/QuizCard.module.css";

export default function QuizCard({ quiz, onClick }) {
  const questionCount = quiz.questions.length;

  return (
    <button
      className={`${styles.card} glass-card ${quiz.categoryClass}`}
      onClick={() => onClick(quiz)}
    >
      <div className={styles.iconWrapper} style={{ background: "var(--cat-bg)" }}>
        <span className={styles.emoji}>{quiz.emoji}</span>
      </div>
      <h3 className={styles.topic}>{quiz.topic}</h3>
      <p className={styles.count}>{questionCount} questions</p>
    </button>
  );
}
