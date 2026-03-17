"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useData } from "@/context/DataContext";
import { useQuiz } from "@/context/QuizContext";
import QuizCard from "@/components/QuizCard";
import styles from "@/styles/QuizSelection.module.css";

const DIFFICULTIES = ["easy", "medium", "hard"];
const TIMER_OPTIONS = [
  { label: "No Timer", value: 0 },
  { label: "30 seconds", value: 30 },
  { label: "60 seconds", value: 60 },
  { label: "90 seconds", value: 90 },
];

export default function QuizSelection() {
  const router = useRouter();
  const { quizzes, settings } = useData();
  const { startQuiz } = useQuiz();
  const visibleQuizzes = useMemo(() => quizzes.filter((q) => !q.hidden), [quizzes]);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [difficulty, setDifficulty] = useState("easy");
  const [timer, setTimer] = useState(0);

  const handleCardClick = (quiz) => {
    setSelectedQuiz(quiz);
  };

  const handleStart = () => {
    if (!selectedQuiz) return;
    startQuiz(selectedQuiz.id, difficulty, timer);
    router.push(`/quiz/${selectedQuiz.id}`);
  };

  const closeModal = () => {
    setSelectedQuiz(null);
    setDifficulty("easy");
    setTimer(0);
  };

  return (
    <main className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Choose Your Category</h1>
        <p className={styles.subtitle}>Select a topic and customize your quiz</p>
      </div>

      <div className={styles.grid}>
        {visibleQuizzes.map((quiz) => (
          <QuizCard key={quiz.id} quiz={quiz} onClick={handleCardClick} />
        ))}
      </div>

      {/* Settings Modal */}
      {selectedQuiz && (
        <div className={styles.overlay} onClick={closeModal}>
          <div
            className={`${styles.modal} ${selectedQuiz.categoryClass}`}
            onClick={(e) => e.stopPropagation()}
          >
            <button className={styles.closeBtn} onClick={closeModal}>
              ✕
            </button>
            <div className={styles.modalHeader}>
              <span className={styles.modalEmoji}>{selectedQuiz.emoji}</span>
              <h2 className={styles.modalTitle}>{selectedQuiz.topic}</h2>
              <p className={styles.modalDesc}>{selectedQuiz.description}</p>
            </div>

            {/* Difficulty (toggleable from admin) */}
            {settings.difficultyEnabled && (
              <div className={styles.settingGroup}>
                <label className={styles.settingLabel}>Difficulty</label>
                <div className={styles.optionRow}>
                  {DIFFICULTIES.map((d) => (
                    <button
                      key={d}
                      className={`${styles.optionBtn} ${
                        difficulty === d ? styles.active : ""
                      }`}
                      onClick={() => setDifficulty(d)}
                    >
                      {d.charAt(0).toUpperCase() + d.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Timer */}
            <div className={styles.settingGroup}>
              <label className={styles.settingLabel}>Timer (per question)</label>
              <div className={styles.optionRow}>
                {TIMER_OPTIONS.map((t) => (
                  <button
                    key={t.value}
                    className={`${styles.optionBtn} ${
                      timer === t.value ? styles.active : ""
                    }`}
                    onClick={() => setTimer(t.value)}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <button className={`btn-primary ${styles.startBtn}`} onClick={handleStart}>
              🚀 Start Quiz
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
