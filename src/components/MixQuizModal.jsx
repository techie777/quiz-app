"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Play, Settings, Clock, BarChart, ClipboardList } from "lucide-react";
import styles from "@/styles/LandingPage.module.css";
import { useQuiz } from "@/context/QuizContext";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

const MixQuizModal = ({ isOpen, onClose, sectionName }) => {
  const { startMixedQuiz } = useQuiz();
  const router = useRouter();
  
  const [qCount, setQCount] = useState(20);
  const [difficulty, setDifficulty] = useState("all");
  const [timer, setTimer] = useState(20);
  const [loading, setLoading] = useState(false);

  const presets = [10, 20, 30, 50];

  const handlePlay = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/quiz/mix?sectionName=${encodeURIComponent(sectionName)}&limit=${qCount}&difficulty=${difficulty}`);
      if (!res.ok) throw new Error("Failed to fetch mix");
      
      const data = await res.json();
      if (!data.questions || data.questions.length === 0) {
        toast.error("No questions found for these settings.");
        setLoading(false);
        return;
      }

      // Start the quiz with settings
      startMixedQuiz(data.questions, sectionName, timer, difficulty);
      
      // Navigate to a special mix route or the standard quiz route with flags?
      // Our standard engine handles mixed mode now via context.
      // We push to /quiz/mixed (or any ID that doesn't conflict)
      router.push("/quiz/mix");
      onClose();
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className={styles.modalOverlay} onClick={onClose}>
        <motion.div 
          className={`${styles.mixModal} glass-card`} 
          onClick={(e) => e.stopPropagation()}
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
        >
          <div className={styles.modalHeader}>
             <div className={styles.modalTitleArea}>
                <Settings className={styles.modalIcon} size={24} />
                <h3>Random Rumble Settings</h3>
             </div>
             <button className={styles.closeBtn} onClick={onClose}><X size={20} /></button>
          </div>

          <div className={styles.modalBody}>
             <p className={styles.modalSubtitle}>Configure your custom round for <strong>{sectionName}</strong></p>

             {/* Question Count */}
             <div className={styles.settingGroup}>
                <label className={styles.settingLabel}>
                   <ClipboardList size={18} />
                   Number of Questions
                </label>
                <div className={styles.presetGrid}>
                   {presets.map(num => (
                      <button 
                         key={num}
                         className={`${styles.presetBtn} ${qCount === num ? styles.active : ""}`}
                         onClick={() => setQCount(num)}
                      >
                         {num}
                      </button>
                   ))}
                </div>
                <div className={styles.sliderContainer}>
                   <input 
                      type="range" 
                      min="10" 
                      max="100" 
                      step="5"
                      value={qCount}
                      onChange={(e) => setQCount(parseInt(e.target.value))}
                      className={styles.rangeSlider}
                   />
                   <span className={styles.sliderValue}>{qCount} Questions</span>
                </div>
             </div>

             {/* Difficulty */}
             <div className={styles.settingGroup}>
                <label className={styles.settingLabel}>
                   <BarChart size={18} />
                   Difficulty Level
                </label>
                <div className={styles.difficultyTabs}>
                   {["all", "easy", "medium", "hard"].map(level => (
                      <button 
                         key={level}
                         className={`${styles.diffTab} ${difficulty === level ? styles.active : ""}`}
                         onClick={() => setDifficulty(level)}
                      >
                         {level.toUpperCase()}
                      </button>
                   ))}
                </div>
             </div>

             {/* Timer */}
             <div className={styles.settingGroup}>
                <label className={styles.settingLabel}>
                   <Clock size={18} />
                   Time Per Question
                </label>
                <div className={styles.sliderContainer}>
                   <input 
                      type="range" 
                      min="10" 
                      max="60" 
                      step="5"
                      value={timer}
                      onChange={(e) => setTimer(parseInt(e.target.value))}
                      className={styles.rangeSlider}
                   />
                   <span className={styles.sliderValue}>{timer} Seconds</span>
                </div>
             </div>
          </div>

          <div className={styles.modalFooter}>
             <button 
                className={`${styles.playBtn} ${loading ? styles.loading : ""}`}
                onClick={handlePlay}
                disabled={loading}
             >
                {loading ? "Preparing..." : (
                   <>
                      <Play size={20} />
                      Start Challenge
                   </>
                )}
             </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default MixQuizModal;
