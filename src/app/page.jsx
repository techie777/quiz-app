"use client";

import Link from "next/link";
import { ArrowRight, Sparkles, SlidersHorizontal, BookOpen, Flame, Lock, Rocket, Play, Award, CheckCircle2, ShieldCheck, Zap, Globe } from "lucide-react";
import styles from "@/styles/HubPage.module.css";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useUI } from "@/context/UIContext";
import { useData } from "@/context/DataContext";
import { useLanguage } from "@/context/LanguageContext";
import MiniQuizPreview from "@/components/MiniQuizPreview";
import CAPreviewWidget from "@/components/CAPreviewWidget";

export default function MasterHubPage() {
  const { data: session } = useSession();
  const { openOnboarding } = useUI();
  const { settings } = useData();
  const { t, isHindi } = useLanguage();
  const [mounted, setMounted] = useState(false);
  const [interests, setInterests] = useState([]);
  const [isLoadingInterests, setIsLoadingInterests] = useState(false);
  const [trialPaper, setTrialPaper] = useState(null);

  useEffect(() => {
    setMounted(true);
    fetchTrialPaper();
  }, []);

  const fetchTrialPaper = async () => {
    try {
      const res = await fetch("/api/mock-tests/trial");
      if (res.ok) {
        const data = await res.json();
        if (data.trialPaper) {
          setTrialPaper(data.trialPaper);
        }
      }
    } catch (err) {
      console.error("Fetch trial paper error:", err);
    }
  };

  useEffect(() => {
    if (session?.user?.id) {
      fetchInterests();
    }
  }, [session]);

  const fetchInterests = async () => {
    setIsLoadingInterests(true);
    try {
      const res = await fetch("/api/user/interests");
      const data = await res.json();
      setInterests(data.interestedCategories || []);
    } catch (error) {
      console.error("Failed to fetch interests:", error);
    } finally {
      setIsLoadingInterests(false);
    }
  };

  return (
    <div className={styles.container}>
      <main className={styles.heroContent}>
        
        {/* Hero Header */}
        <div className={styles.heroHeader}>
          <div className={styles.heroBadge}>
            <Sparkles size={14} />
            <span>{isHindi ? "ऑल-इन-वन लर्निंग प्लेटफॉर्म" : "All-in-One Learning Hub"}</span>
          </div>
          <h1 className={styles.heroTitle}>
            {mounted ? (isHindi ? "अपनी तैयारी को नया स्तर दें" : "Master Exams & Daily Trivia") : "Master Exams & Daily Trivia"}
          </h1>
          <p className={styles.heroSubtitle}>
            Play, Practice & Master! खेल-खेल में ज्ञान बढ़ाएं, और हर सरकारी परीक्षा में अपनी जीत पक्की करें।
          </p>

          {/* Quick Vertical Navigation Bar */}
          <div className={styles.verticalNavPills}>
            <Link href="/quizzes" className={styles.navPill} style={{ background: "linear-gradient(135deg, rgba(16,185,129,0.15) 0%, rgba(34,197,94,0.15) 100%)", border: "1px solid rgba(16,185,129,0.35)" }}>
              <span>🧪</span>
              <span style={{ fontWeight: 800, color: "#15803d" }}>{isHindi ? "क्विज़ हब" : "Quiz Hub"}</span>
              <span className={`${styles.pillBadge} ${styles.pillBadgeActive}`} style={{ background: "#16a34a", color: "#ffffff" }}>{isHindi ? "सक्रिय" : "Active"}</span>
            </Link>

            <Link href="/daily-current-affairs" className={styles.navPill}>
              <span>📰</span>
              <span>{isHindi ? "करंट अफेयर्स" : "Current Affairs"}</span>
              <span className={`${styles.pillBadge} ${styles.pillBadgeActive}`}>{isHindi ? "सक्रिय" : "Active"}</span>
            </Link>

            <div className={`${styles.navPill} ${styles.navPillDisabled}`}>
              <span>💼</span>
              <span>{isHindi ? "करियर गाइड" : "Career Guide"}</span>
              <span className={`${styles.pillBadge} ${styles.pillBadgeSoon}`}>{isHindi ? "शीघ्र" : "Soon"}</span>
            </div>

            <Link href="/mock-tests" className={styles.navPill} style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(168,85,247,0.12) 100%)", border: "1px solid rgba(99,102,241,0.25)" }}>
              <span>🏆</span>
              <span style={{ fontWeight: 800, color: "#4f46e5" }}>{isHindi ? "मॉक टेस्ट सीरीज़" : "Mock Test Series"}</span>
              <span className={`${styles.pillBadge} ${styles.pillBadgeActive}`} style={{ background: "#6366f1", color: "#ffffff" }}>{isHindi ? "फ्लैगशिप" : "FLAGSHIP"}</span>
            </Link>
          </div>
        </div>

        {/* Multi-Vertical Responsive Grid */}
        <div className={styles.grid}>
          
          {/* Vertical 1: Quiz Hub */}
          <div className={`${styles.card} ${styles.cardQuiz}`}>
            <div>
              <div className={styles.cardHeader}>
                <div className={styles.cardIcon}>🧠</div>
                <span className={styles.cardBadge}>{isHindi ? "लोकप्रिय वर्टिकल" : "Popular"}</span>
              </div>
              <h2 className={styles.cardTitle}>{isHindi ? "क्विज़ हब" : "Quiz Hub"}</h2>
              <p className={styles.cardDescription}>
                {isHindi ? "50+ विषयों में इंटरएक्टिव क्विज़, रीड मोड और परीक्षा सेट हल करें।" : "Interactive quizzes, read mode cards & timed exam sets across 50+ subjects."}
              </p>
              
              <div className={styles.previewWrapperInline}>
                {mounted ? <MiniQuizPreview type="quiz" /> : <div className="animate-pulse bg-slate-100 dark:bg-slate-800 rounded-xl w-full h-[120px]" />}
              </div>
            </div>

            <Link href="/quizzes" className={styles.mainAction}>
              <span className={styles.viewAll}>
                {isHindi ? "क्विज़ खेलें" : "Explore Quiz Hub"} <ArrowRight size={18} />
              </span>
            </Link>
          </div>

          {/* Vertical 2: Current Affairs */}
          <div className={`${styles.card} ${styles.cardCA}`}>
            <div>
              <div className={styles.cardHeader}>
                <div className={styles.cardIcon}>📰</div>
                <span className={styles.cardBadge}>{isHindi ? "दैनिक अपडेट" : "Daily Live"}</span>
              </div>
              <h2 className={styles.cardTitle}>{isHindi ? "करंट अफेयर्स" : "Current Affairs"}</h2>
              <p className={styles.cardDescription}>
                {isHindi ? "दैनिक समसामयिकी समाचार, मासिक संग्रह और परीक्षा उपयोगी वन-लाइनर्स।" : "Daily news digests, calendar archives & exam-oriented current affairs notes."}
              </p>
              
              <div className={styles.previewWrapperInline}>
                {mounted ? <CAPreviewWidget /> : <div className="animate-pulse bg-slate-100 dark:bg-slate-800 rounded-xl w-full h-[120px]" />}
              </div>
            </div>

            <Link href="/daily-current-affairs" className={styles.mainAction}>
              <span className={styles.viewAll}>
                {isHindi ? "करंट अफेयर्स पढ़ें" : "Read Current Affairs"} <ArrowRight size={18} />
              </span>
            </Link>
          </div>

          {/* Vertical 3: Career Guide (Coming Soon) */}
          <div className={`${styles.card} ${styles.cardCareer}`}>
            <div>
              <div className={styles.cardHeader}>
                <div className={styles.cardIcon}>💼</div>
                <span className={styles.cardBadge}>{isHindi ? "जल्द आ रहा है" : "Coming Soon"}</span>
              </div>
              <h2 className={styles.cardTitle}>{isHindi ? "करियर गाइड" : "Career Guide"}</h2>
              <p className={styles.cardDescription}>
                {isHindi ? "परीक्षा रोडमैप, सरकारी नौकरी नोटिफिकेशन और करियर मार्गदर्शन।" : "Comprehensive exam roadmaps, job notifications, syllabus analysis & skill paths."}
              </p>
            </div>

            <div className={styles.mainAction}>
              <span className={styles.viewAll} style={{ opacity: 0.85 }}>
                <Lock size={16} /> {isHindi ? "शीघ्र उपलब्ध होगा" : "Coming Soon"}
              </span>
            </div>
          </div>

        </div>

        {/* 🌟 MOCK TEST SHOWCASE DIALOGUE (ALIGNED AFTER CAREER GUIDE) */}
        <div className={styles.mockTestShowcaseCard}>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            
            {/* Header Tag & Bilingual Badge */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "rgba(99, 102, 241, 0.1)", border: "1px solid rgba(99, 102, 241, 0.25)", padding: "3px 10px", borderRadius: "16px", fontSize: "0.72rem", fontWeight: 800, color: "#4f46e5" }}>
                <Zap size={13} />
                <span>{isHindi ? "🏆 ऑल इंडिया लाइव मॉक टेस्ट सीरीज़" : "🏆 ALL INDIA LIVE MOCK TEST SERIES"}</span>
              </div>
              <div style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 700, display: "flex", alignItems: "center", gap: "5px" }}>
                <Globe size={13} className="text-indigo-500" />
                <span>{isHindi ? "द्विभाषी (Hindi & English)" : "Bilingual (Hindi & English)"}</span>
              </div>
            </div>

            {/* Title & Description */}
            <div>
              <h2 style={{ fontSize: "1.15rem", fontWeight: 800, margin: "0 0 4px 0", lineHeight: 1.3, color: "var(--text-primary)" }}>
                {isHindi ? "सरकारी परीक्षा मॉक टेस्ट सीरीज़ (TCS पैटर्न)" : "Government Exam Mock Test Series (TCS Pattern)"}
              </h2>
              <p style={{ fontSize: "0.85rem", color: "#64748b", margin: 0, lineHeight: 1.4 }}>
                {isHindi
                  ? "TCS नवीन पैटर्न, लाइव टाइमर, नेगेटिव मार्किंग और ऑल इंडिया रैंक के साथ 100% फ्री प्रैक्टिस टेस्ट।"
                  : "Practice with real TCS exam pattern timer, section cutoff, negative marking & instant detailed solutions."}
              </p>
            </div>

            {/* 4 Data Points Priority Pills: SSC, Banking, Railway, Police */}
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              <span style={{ padding: "4px 10px", borderRadius: "8px", background: "#e0e7ff", border: "1px solid #c7d2fe", fontSize: "0.75rem", fontWeight: 800, color: "#3730a3" }}>
                🏛️ SSC (CGL, CHSL, CPO)
              </span>
              <span style={{ padding: "4px 10px", borderRadius: "8px", background: "#dcfce7", border: "1px solid #bbf7d0", fontSize: "0.75rem", fontWeight: 800, color: "#166534" }}>
                🏦 Banking (IBPS, SBI PO)
              </span>
              <span style={{ padding: "4px 10px", borderRadius: "8px", background: "#fef3c7", border: "1px solid #fde68a", fontSize: "0.75rem", fontWeight: 800, color: "#92400e" }}>
                🚆 Railway (RRB NTPC, ALP)
              </span>
              <span style={{ padding: "4px 10px", borderRadius: "8px", background: "#ffe4e6", border: "1px solid #fecdd3", fontSize: "0.75rem", fontWeight: 800, color: "#9f1239" }}>
                👮 Police & State Exams
              </span>
            </div>

            {/* Action Buttons */}
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginTop: "2px" }}>
              <Link
                href={trialPaper?.id ? `/mock-tests/paper/${trialPaper.id}/instructions` : "/mock-tests"}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "8px 18px",
                  borderRadius: "10px",
                  background: "#4f46e5",
                  color: "#ffffff",
                  fontWeight: 800,
                  fontSize: "0.82rem",
                  boxShadow: "0 2px 8px rgba(79, 70, 229, 0.25)",
                  textDecoration: "none"
                }}
              >
                <Play size={14} fill="#fff" />
                <span>{isHindi ? "फ्री लाइव ट्रायल टेस्ट दें" : "Start Free Trial Test"}</span>
              </Link>

              <Link
                href="/mock-tests"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "8px 16px",
                  borderRadius: "10px",
                  background: "var(--bg-secondary)",
                  border: "1px solid var(--card-border)",
                  color: "var(--text-primary)",
                  fontWeight: 700,
                  fontSize: "0.82rem",
                  textDecoration: "none"
                }}
              >
                <Award size={14} />
                <span>{isHindi ? "सभी परीक्षा टेस्ट सीरीज़ देखें" : "Explore All Test Series"}</span>
              </Link>
            </div>

          </div>
        </div>

        {/* Optional Personalization Prompt */}
        {mounted && session && interests.length === 0 && !isLoadingInterests && (
          <div className="mt-10 p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex-1">
              <h3 className="text-xl sm:text-2xl font-black text-white mb-2">{t('hub.personalize.title') || "Personalize Your Learning Experience"}</h3>
              <p className="text-slate-400 text-sm">{t('hub.personalize.desc') || "Select your favorite exam topics to get tailored recommendations."}</p>
            </div>
            <div className="flex gap-4">
              <button 
                onClick={openOnboarding}
                className="px-6 py-3.5 bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-black rounded-xl transition-all hover:scale-105 text-sm"
              >
                {t('hub.personalize.action') || "Customize Now"}
              </button>
            </div>
          </div>
        )}

        {/* Support / Donation Banner */}
        <Link href="/donate" className="block mt-12 p-1 rounded-3xl bg-gradient-to-r from-orange-400 to-rose-400 hover:scale-[1.01] transition-transform shadow-xl dark:shadow-none shadow-rose-100 group">
          <div className="bg-white dark:bg-slate-900 rounded-2xl px-6 sm:px-8 py-5 flex flex-col md:flex-row items-center justify-between gap-4 overflow-hidden relative">
            <div className="flex items-center gap-4 relative z-10">
              <div className="w-12 h-12 rounded-full bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center text-2xl group-hover:rotate-12 transition-transform">🧡</div>
              <div>
                <h3 className="text-lg font-black text-slate-800 dark:text-slate-100">{t('hub.support.title') || "Support Our Free Mission"}</h3>
                <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm max-w-md">{t('hub.support.desc') || "Help us keep quality educational content 100% free for students everywhere."}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 font-black text-rose-500 dark:text-rose-400 uppercase tracking-widest text-xs sm:text-sm relative z-10">
              {t('hub.support.action') || "Support Us"} <ArrowRight size={16} />
            </div>
            <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-rose-50 dark:bg-rose-900/10 rounded-full blur-2xl opacity-50" />
          </div>
        </Link>
      </main>
    </div>
  );
}
