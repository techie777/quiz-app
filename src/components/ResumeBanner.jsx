"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import styles from "@/styles/ResumeBanner.module.css";

const STORAGE_KEY = 'global_quiz_state';

export default function ResumeBanner() {
  const router = useRouter();
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check for active quiz in localStorage
    const checkState = () => {
      // Don't show on quiz pages
      if (window.location.pathname.startsWith('/quiz')) {
        setIsVisible(false);
        return;
      }

      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed.status === 'active' && parsed.quizId) {
            setActiveQuiz(parsed);
            setIsVisible(true);
          } else {
            setIsVisible(false);
          }
        } catch (e) {
          console.error("Failed to parse quiz state for banner", e);
        }
      }
    };

    checkState();
    
    // Listen for storage changes (in case of multi-tab)
    window.addEventListener('storage', checkState);
    return () => window.removeEventListener('storage', checkState);
  }, []);

  if (!isVisible || !activeQuiz) return null;

  // Calculate progress based on state
  const totalQuestions = activeQuiz.questions?.length || 0;
  const answeredCount = activeQuiz.answers?.length || 0;
  const progressPercent = totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0;
  const quizTitle = activeQuiz.categoryName || activeQuiz.mixedSectionName || "Quiz Session";

  return (
    <AnimatePresence>
      <motion.div 
        className={styles.bannerContainer}
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
      >
        <button 
          className={styles.closeBtn}
          onClick={() => setIsVisible(false)}
          title="Dismiss"
        >
          ✕
        </button>

        <div className={styles.bannerContent}>
          <div className={styles.info}>
            <div className={styles.topRow}>
              <span className={styles.badge}>In Progress</span>
            </div>
            <h4 className={styles.title}>Resume your quiz</h4>
            <p className={styles.subtitle}>{quizTitle} {activeQuiz.selectedSetIndex && `• Set ${activeQuiz.selectedSetIndex}`}</p>
          </div>

          <div className={styles.progressContainer}>
            <div className={styles.progressLabel}>
              <span>{answeredCount} of {totalQuestions} Questions Completed</span>
            </div>
            <div className={styles.progressBar}>
              <motion.div 
                className={styles.progressFill}
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
            </div>
          </div>

          <div className={styles.actions}>
            <Link 
              href={`/quiz/${activeQuiz.quizId}`} 
              className={styles.resumeBtn}
            >
              🚀 Resume Quiz
            </Link>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
