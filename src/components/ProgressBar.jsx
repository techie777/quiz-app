"use client";

import styles from "@/styles/QuizEngine.module.css";

export default function ProgressBar({ current, total }) {
  const percentage = ((current) / total) * 100;

  return (
    <div className={styles.progressContainer}>
      <div className={styles.progressTrack}>
        <div
          className={styles.progressFill}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
