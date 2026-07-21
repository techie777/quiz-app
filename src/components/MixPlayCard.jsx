"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Sliders } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import styles from "@/styles/LandingPage.module.css";

import { getCardQuestionsList } from "./LandingPageClient";

const MIX_QUESTIONS_HI = [
  { text: "विश्व का सबसे बड़ा महाद्वीप कौन सा है?", options: ["एशिया (Asia)", "अफ्रीका (Africa)", "यूरोप (Europe)", "अमेरिका"] },
  { text: "कंप्यूटर की गति को मुख्य रूप से किसमें मापा जाता है?", options: ["GHz / MHz", "MB / GB", "Pixels", "Bytes"] },
  { text: "मानव शरीर में रक्तचाप (BP) को नियंत्रित करने वाली ग्रंथि?", options: ["एड्रेनल ग्रंथि", "थायरॉयड", "यकृत", "अग्न्याशय"] },
  { text: "नोबेल पुरस्कार पाने वाले प्रथम भारतीय कौन थे?", options: ["रवींद्रनाथ टैगोर", "सी.वी. रमन", "मदर टेरेसा", "अमर्त्य सेन"] }
];

const MIX_QUESTIONS_EN = [
  { text: "Which is the largest continent in the world?", options: ["Asia", "Africa", "Europe", "North America"] },
  { text: "Computer processing speed is primarily measured in?", options: ["GHz / MHz", "MB / GB", "Pixels", "Bytes"] },
  { text: "Which gland regulates blood pressure in the human body?", options: ["Adrenal Gland", "Thyroid", "Liver", "Pancreas"] },
  { text: "Who was the first Indian to receive a Nobel Prize?", options: ["Rabindranath Tagore", "C.V. Raman", "Mother Teresa", "Amartya Sen"] }
];

const MixPlayCard = ({ sectionName, quizzes, onOpenModal, isCompact = false }) => {
  const { t, isHindi } = useLanguage();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Dynamically extract and interleave questions across ALL categories in THIS section!
  const questionsList = React.useMemo(() => {
    if (Array.isArray(quizzes) && quizzes.length > 0) {
      const categoryQuestionsMap = [];
      quizzes.forEach((quiz) => {
        const qList = getCardQuestionsList(quiz, isHindi);
        if (Array.isArray(qList) && qList.length > 0) {
          categoryQuestionsMap.push(qList);
        }
      });

      if (categoryQuestionsMap.length > 0) {
        const interleaved = [];
        let maxLen = 0;
        categoryQuestionsMap.forEach(arr => { if (arr.length > maxLen) maxLen = arr.length; });
        for (let idx = 0; idx < maxLen; idx++) {
          for (let c = 0; c < categoryQuestionsMap.length; c++) {
            if (categoryQuestionsMap[c][idx]) {
              interleaved.push(categoryQuestionsMap[c][idx]);
            }
          }
        }
        if (interleaved.length > 0) {
          return interleaved;
        }
      }
    }
    return isHindi ? MIX_QUESTIONS_HI : MIX_QUESTIONS_EN;
  }, [quizzes, isHindi]);

  // Pick a random mix question from any of the section's categories on mount/render
  useEffect(() => {
    if (questionsList.length > 0) {
      const randIdx = Math.floor(Math.random() * questionsList.length);
      setCurrentIndex(randIdx);
    }
  }, [questionsList]);

  // Auto rotate ONLY on mobile view (Static on Desktop)
  useEffect(() => {
    if (!isMobile || questionsList.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % questionsList.length);
    }, 3600);
    return () => clearInterval(interval);
  }, [isMobile, questionsList.length]);

  const currentQ = questionsList[currentIndex] || questionsList[0];

  if (isCompact) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="group bg-gradient-to-r from-purple-500/5 via-indigo-500/5 to-purple-500/5 dark:from-purple-950/20 dark:to-indigo-950/20 p-3 sm:p-3.5 rounded-2xl border border-purple-200 dark:border-purple-900/50 hover:border-purple-400 dark:hover:border-purple-600 shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer flex items-center justify-between gap-3"
        onClick={() => onOpenModal(sectionName)}
        title={t('quizzes.mix.title') || "Mega Mix Challenge"}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-purple-100 dark:bg-purple-900/40 text-xl font-black text-purple-600 dark:text-purple-300 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform border border-purple-200 dark:border-purple-800/40">
            ✨
          </div>
          <div className="min-w-0">
            <h4 className="text-sm sm:text-base font-extrabold text-purple-950 dark:text-purple-100 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors truncate">
              {t('quizzes.mix.title') || "Mega Mix Challenge"}
            </h4>
            <p className="text-xs font-semibold text-purple-600/80 dark:text-purple-400/80 truncate mt-0.5">
              🔥 500+ {isHindi ? 'मिक्स प्रश्न' : 'Random Mix'}
            </p>
          </div>
        </div>

        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          <span className="text-[11px] font-black text-purple-600 dark:text-purple-400 tracking-tight">
            500+ Qs
          </span>
          <button
            type="button"
            className="px-3 py-1.5 sm:px-4 sm:py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs sm:text-sm font-extrabold shadow-sm hover:shadow-purple-500/25 hover:scale-105 transition-all flex items-center gap-1.5"
            onClick={(e) => {
              e.stopPropagation();
              onOpenModal(sectionName);
            }}
          >
            <span>{isHindi ? "क्विज़ खेलें" : "Play Quiz"}</span>
            <span className="text-xs font-bold">→</span>
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className={styles.subSectionCard}
      style={{
        background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.04) 0%, rgba(99, 102, 241, 0.04) 100%)',
        borderColor: 'rgba(168, 85, 247, 0.4)',
      }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className={styles.subSectionCardImage} style={{ background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.12), rgba(99, 102, 241, 0.12))' }}>
        <span className={styles.subSectionCardEmoji}>
          ✨
        </span>
        <div style={{ position: 'absolute', top: '8px', right: '8px', padding: '4px 8px', borderRadius: '100px', background: 'rgba(168, 85, 247, 0.15)', color: '#9333ea', fontWeight: '800', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Sparkles size={12} />
          MIX
        </div>
      </div>

      <div className={styles.subSectionCardContent}>
        <h4 className={styles.subSectionCardTitle} style={{ color: '#7e22ce' }}>
          {t('quizzes.mix.title') || "Mega Mix Challenge"}
        </h4>

        <div className={styles.subSectionCardFooter}>
          <span className={styles.subSectionCardCount} style={{ color: '#9333ea', fontWeight: '700' }}>
            🔥 500+ {isHindi ? 'मिक्स प्रश्न' : 'Random Mix'}
          </span>
        </div>

        {/* Dynamic Question & 4 Options Preview */}
        <div style={{ margin: '8px 0 10px 0', minHeight: '106px', position: 'relative' }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={isMobile ? currentIndex : "static-desktop"}
              initial={isMobile ? { opacity: 0, y: 6 } : false}
              animate={{ opacity: 1, y: 0 }}
              exit={isMobile ? { opacity: 0, y: -6 } : false}
              transition={{ duration: 0.35 }}
            >
              <p style={{
                fontSize: '0.95rem',
                color: 'var(--text-primary)',
                margin: '0 0 10px 0',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                lineHeight: '1.45',
                fontWeight: '600'
              }}>
                {currentQ.text}
              </p>
              {currentQ.options && Array.isArray(currentQ.options) && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                  {currentQ.options.slice(0, 4).map((opt, i) => (
                    <div key={i} style={{
                      fontSize: '0.85rem',
                      padding: '8px 10px',
                      background: 'rgba(168, 85, 247, 0.08)',
                      border: '1px solid rgba(168, 85, 247, 0.2)',
                      borderRadius: '10px',
                      color: 'var(--text-primary)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      textAlign: 'center',
                      fontWeight: '600'
                    }}>
                      {opt}
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className={styles.setCardActions}>
          <button
            className={styles.playQuizButton}
            style={{ background: 'linear-gradient(135deg, #a855f7 0%, #6366f1 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onOpenModal(sectionName);
            }}
          >
            <Sliders size={15} />
            {t('quizzes.mix.play') || "Configure & Play"}
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default MixPlayCard;
