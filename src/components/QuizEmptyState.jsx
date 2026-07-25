"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Sparkles, Bell, ArrowRight, BookOpen, Clock, ShieldCheck, CheckCircle2 } from "lucide-react";
import toast from "react-hot-toast";
import styles from "./QuizEmptyState.module.css";

export default function QuizEmptyState({ topic = "Quiz", isHindi = false }) {
  const [requested, setRequested] = useState(false);
  const [loadingReq, setLoadingReq] = useState(false);

  const handleRequestUpdate = async () => {
    setLoadingReq(true);
    try {
      await fetch("/api/quiz-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic }),
      });
      setRequested(true);
      toast.success(
        isHindi 
          ? "धन्यवाद! एडमिन टीम को इस क्विज़ को प्राथमिकता देने की सूचना भेज दी गई है।" 
          : "Notification sent! The editorial team has been requested to prioritize this quiz."
      );
    } catch {
      toast.error("Failed to notify admin. Please try again.");
    } finally {
      setLoadingReq(false);
    }
  };

  return (
    <div className={styles.emptyContainer}>
      <motion.div 
        className={styles.emptyCard}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        {/* Status Pill Badge */}
        <div className={styles.statusBadge}>
          <span className={styles.pulseDot}></span>
          <Sparkles className={styles.badgeIcon} size={15} />
          <span>{isHindi ? "सामग्री अपडेट जारी है" : "Content Update In Progress"}</span>
        </div>

        {/* Hero Visual Icon Container */}
        <div className={styles.illustrationWrapper}>
          <div className={styles.glowAura}></div>
          <motion.div 
            className={styles.iconCircle}
            animate={{ y: [0, -8, 0] }}
            transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
          >
            <BookOpen size={48} className={styles.heroIcon} />
          </motion.div>
          
          {/* Floating Accents */}
          <motion.div 
            className={`${styles.floatingDot} ${styles.dot1}`}
            animate={{ scale: [1, 1.2, 1], opacity: [0.6, 1, 0.6] }}
            transition={{ repeat: Infinity, duration: 3, delay: 0.2 }}
          />
          <motion.div 
            className={`${styles.floatingDot} ${styles.dot2}`}
            animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0.9, 0.5] }}
            transition={{ repeat: Infinity, duration: 2.5, delay: 0.5 }}
          />
        </div>

        {/* Main Headings */}
        <h2 className={styles.title}>
          {isHindi ? (
            <>
              <span className={styles.topicHighlight}>{topic}</span> के प्रश्न जल्द लाइव होंगे!
            </>
          ) : (
            <>
              Fresh Questions for <span className={styles.topicHighlight}>{topic}</span> Arriving Soon!
            </>
          )}
        </h2>

        <p className={styles.subtitle}>
          {isHindi 
            ? `व्यवस्थापक और विषय विशेषज्ञ वर्तमान में '${topic}' के लिए उच्च गुणवत्ता वाले परीक्षा-उपयोगी प्रश्नों का संग्रह तैयार कर रहे हैं। शीघ्र ही नया प्रैक्टिस सेट उपलब्ध होगा!`
            : `Our editorial team is actively curating & verifying top-tier questions for '${topic}'. The quiz data will be published by the admin very soon!`
          }
        </p>

        {/* What to Expect Grid */}
        <div className={styles.featureGrid}>
          <div className={styles.featureItem}>
            <ShieldCheck className={styles.featureIcon} size={20} />
            <div>
              <h4>{isHindi ? "सत्यापित प्रश्न" : "100% Verified Content"}</h4>
              <p>{isHindi ? "त्रुटिहीन उत्तर एवं स्पष्टीकरण" : "Accurate answers with detailed explanations"}</p>
            </div>
          </div>

          <div className={styles.featureItem}>
            <Clock className={styles.featureIcon} size={20} />
            <div>
              <h4>{isHindi ? "टाइम्ड मोड" : "Speed & Accuracy"}</h4>
              <p>{isHindi ? "परीक्षा के माहौल जैसी तैयारी" : "Custom time limits for exam practice"}</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className={styles.actionRow}>
          <button 
            className={`${styles.requestBtn} ${requested ? styles.requested : ""}`}
            onClick={handleRequestUpdate}
            disabled={requested}
          >
            {requested ? (
              <>
                <CheckCircle2 size={18} />
                <span>{isHindi ? "अनुरोध दर्ज किया गया" : "Priority Request Logged"}</span>
              </>
            ) : (
              <>
                <Bell size={18} />
                <span>{isHindi ? "एडमिन को सूचित करें (Fast Track)" : "Notify Admin to Priority Add"}</span>
              </>
            )}
          </button>

          <Link href="/" className={styles.exploreBtn}>
            <span>{isHindi ? "अन्य लोकप्रिय क्विज़ देखें" : "Explore Active Quizzes"}</span>
            <ArrowRight size={18} />
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
