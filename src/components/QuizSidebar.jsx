"use client";

import { useMemo, useState, useEffect } from "react";
import { useQuiz } from "@/context/QuizContext";
import { useData } from "@/context/DataContext";
import styles from "@/styles/QuizSidebar.module.css";

export default function QuizSidebar({ 
  category, 
  questions, 
  currentIndex, 
  score, 
  timerSetting, 
  isPaused, 
  pauseQuiz, 
  resumeQuiz,
  onNavigate,
  onBack,
  onResume,
  onExit,
  startTime,
  answers,
  TimerComponent
}) {
  const { status } = useQuiz();
  // State for elapsed time
  const [elapsed, setElapsed] = useState(0);

  // Sync elapsed time
  useEffect(() => {
    if (status !== 'active' || isPaused) return;
    const interval = setInterval(() => {
      setElapsed(Math.round((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime, status, isPaused]);

  // Hotkeys for sidebar navigation (Arrow Left/Right)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft' && currentIndex > 0) onBack();
      if (e.key === 'ArrowRight' && currentIndex < questions.length - 1) onResume();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, questions.length, onBack, onResume]);

  // Calculate progress
  const progress = useMemo(() => {
    return questions.length > 0 ? Math.round(((currentIndex + 1) / questions.length) * 100) : 0;
  }, [currentIndex, questions.length]);

  const displayTime = useMemo(() => {
    const min = Math.floor(elapsed / 60);
    const sec = elapsed % 60;
    return `${min}:${sec.toString().padStart(2, "0")}s`;
  }, [elapsed]);

  return (
    <aside className={styles.sidebar}>
      {/* Neural Performance Ring Overlay */}
      {status === 'active' && (
        <div className={styles.performanceStats}>
          <div className={styles.streakInfo}>
            <span className={styles.streakEmoji}>🔥</span>
            <span className={styles.streakCount}>{score} Correct</span>
          </div>
          <div className={styles.timerDisplay}>
            {TimerComponent && (
              <TimerComponent 
                seconds={timerSetting} 
                onExpire={() => console.log('Time up!')}
                isPaused={isPaused}
                questionKey={currentIndex}
              />
            )}
          </div>
        </div>
      )}

      {/* Mission Map Navigation */}
      <div className={styles.missionMap}>
        <div className={styles.missionHeader}>
          <div className={styles.navControls}>
            <button 
              className={styles.navBtn} 
              onClick={onBack} 
              disabled={currentIndex === 0}
              title="Previous Question (Arrow Left)"
            >
              <span className={styles.navIcon}>←</span>
              <span>Back</span>
            </button>
            <div className={styles.missionCounter}>
              <span className={styles.missionLabel}>Mission</span>
              <span className={styles.missionValue}>Q{currentIndex + 1} / {questions.length}</span>
            </div>
            <button 
              className={styles.navBtn} 
              onClick={onResume} 
              disabled={currentIndex === questions.length - 1}
              title="Next Question (Arrow Right)"
            >
              <span>Next</span>
              <span className={styles.navIcon}>→</span>
            </button>
          </div>
        </div>
        <div className={styles.nodeGrid}>
          {questions.map((question, index) => {
            const isCurrent = index === currentIndex;
            const isAnswered = question.userAnswer !== undefined;
            const isCorrect = isAnswered && String(question.options[question.userAnswer]).trim() === String(question.correctAnswer).trim();
            
            let nodeClass = styles.node;
            if (isCurrent) nodeClass += ` ${styles.activeNode}`;
            if (isAnswered) {
              nodeClass += isCorrect ? ` ${styles.correctNode}` : ` ${styles.wrongNode}`;
            }

            return (
              <button
                key={index}
                className={nodeClass}
                onClick={() => onNavigate(index)}
                title={`Question ${index + 1}`}
              >
                {index + 1}
                {isAnswered && (
                  <span className={styles.nodeStatus}>
                    {isCorrect ? "✓" : "✗"}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <div className={styles.mapFooter}>
          <span className={styles.mapTime}>✓ {Array.isArray(answers) ? answers.filter(a => a.isCorrect).length : 0}</span>
          <span className={styles.mapTime}>⌛ {displayTime}</span>
        </div>
      </div>

      {/* Tactical Actions */}
      <div className={styles.actions}>
        <button className={styles.actionBtn} onClick={() => console.log('Notes')}>
          <span className={styles.btnEmoji}>📝</span> Notes
        </button>
        <button className={styles.actionBtn} onClick={() => console.log('Report')}>
          <span className={styles.btnEmoji}>💡</span> Hint
        </button>
        <button className={`${styles.actionBtn} ${styles.exitBtn}`} onClick={onExit}>
          <span className={styles.btnEmoji}>🚨</span> Exit
        </button>
      </div>
    </aside>
  );
}
