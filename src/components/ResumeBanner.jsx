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

  return (
    <AnimatePresence>
      <motion.div 
        className={styles.bannerContainer}
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 50, opacity: 0 }}
      >
        <div className={styles.bannerContent}>
          <div className={styles.info}>
            <span className={styles.badge}>ACTIVE SESSION</span>
            <p className={styles.text}>
              You have a quiz in progress! Would you like to continue?
            </p>
          </div>
          <div className={styles.actions}>
            <Link 
              href={`/quiz/${activeQuiz.quizId}`} 
              className={styles.resumeBtn}
            >
              🚀 Resume Quiz
            </Link>
            <button 
              className={styles.closeBtn}
              onClick={() => setIsVisible(false)}
            >
              ✕
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
