"use client";

import { useState, useEffect, useRef } from "react";
import styles from "@/styles/Timer.module.css";

export default function Timer({ seconds, onExpire, questionKey, isPaused }) {
  const [timeLeft, setTimeLeft] = useState(seconds);
  const timerRef = useRef(null);

  // Reset timer when question changes
  useEffect(() => {
    setTimeLeft(seconds);
  }, [questionKey, seconds]);

  useEffect(() => {
    if (isPaused) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    if (timeLeft <= 0) {
      onExpire();
      return;
    }

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [timeLeft === 0, questionKey, isPaused]); // eslint-disable-line react-hooks/exhaustive-deps

  const isLow = timeLeft <= 5;
  const mins = String(Math.floor(timeLeft / 60)).padStart(2, "0");
  const secs = String(timeLeft % 60).padStart(2, "0");

  return (
    <div className={`${styles.timer} ${isLow ? styles.low : ""}`}>
      <span className={styles.icon}>⏱️</span>
      <span className={styles.time}>
        {mins}:{secs}
      </span>
    </div>
  );
}
