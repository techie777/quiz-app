"use client";

import styles from "@/styles/QuizEngine.module.css";

export default function ProgressBar({ current, total, showPercentage = false }) {
  const percentage = total > 0 ? ((current) / total) * 100 : 0;

  return (
    <div className={styles.progressContainer}>
      <div className={styles.progressTrack}>
        <div
          className={styles.progressFill}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showPercentage && (
        <span className={styles.progressPercentage}>
          {Math.round(percentage)}%
        </span>
      )}
    </div>
  );
}
