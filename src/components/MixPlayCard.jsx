"use client";

import React from "react";
import { motion } from "framer-motion";
import { Sparkles, PlayCircle } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import styles from "@/styles/LandingPage.module.css";

const MixPlayCard = ({ sectionName, onOpenModal }) => {
  const { t, isHindi } = useLanguage();
  
  return (
    <motion.div
      className={`${styles.subSectionCard} ${styles.mixPlayCard}`}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -8, transition: { duration: 0.2 } }}
      onClick={() => onOpenModal(sectionName)}
    >
      <div className={styles.mixCardGradient} />
      
      <div className={styles.subSectionCardContent}>
        <div className={styles.mixIconWrapper}>
           <Sparkles className={styles.mixIcon} size={28} />
        </div>
        
        <h4 className={styles.mixCardTitle}>
          {t('quizzes.mix.title') || "Mega Mix Challenge"}
        </h4>
        <p className={styles.mixCardDescription}>
          {isHindi ? (
            <><strong>{sectionName}</strong> की सभी श्रेणियों के मिश्रित प्रश्न</>
          ) : (
            <>Mix questions from all categories in <strong>{sectionName}</strong></>
          )}
        </p>
        
        <div className={styles.mixCardFooter}>
          <button className={styles.mixPlayBtn}>
            <PlayCircle size={20} />
            {t('quizzes.mix.play') || "Configure & Play"}
          </button>
        </div>
      </div>
      
      {/* Decorative Bubble UI - Brand Matched */}
      <div className={styles.mixCardBubble} />
    </motion.div>
  );
};

export default MixPlayCard;
