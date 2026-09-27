"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export const TIERS = {
  KIDS: "kids",
  STUDENTS: "students",
  ADULTS: "adults",
};

export const TIER_CONFIG = {
  kids: {
    id: "kids",
    label: "Kids",
    labelHi: "बच्चे",
    shortLabel: "Kids",
    shortLabelHi: "बच्चे",
    tagline: "Fun Quizzes & Brain Games",
    taglineHi: "रोमांचक क्विज़ और खेल",
    ageRange: "5-12 yrs",
    icon: "🧒",
    accentColor: "#f59e0b", // Warm Amber / Orange
    accentHover: "#d97706",
    accentLight: "rgba(245, 158, 11, 0.14)",
    accentBorder: "rgba(245, 158, 11, 0.35)",
    glowColor: "rgba(245, 158, 11, 0.25)",
    gradient: "linear-gradient(135deg, #fbbf24 0%, #f97316 100%)",
    greeting: {
      en: "Play, Learn & Explore! 🎈",
      hi: "खेलें, सीखें और मजे करें! 🎈",
    },
    subtitle: {
      en: "Exciting trivia, colorful puzzles, and playful brain challenges crafted for young minds.",
      hi: "रोमांचक पहेलियां और ज्ञानवर्धक गेम्स, विशेष रूप से नन्हें जिज्ञासुओं के लिए।",
    },
    badge: {
      en: "Kids Zone (Age 5-12)",
      hi: "किड्स ज़ोन (उम्र 5-12)",
    },
  },
  students: {
    id: "students",
    label: "Students",
    labelHi: "विद्यार्थी",
    shortLabel: "Students",
    shortLabelHi: "छात्र",
    tagline: "Academic Excellence & Skills",
    taglineHi: "स्कूल विषय और ज्ञान",
    ageRange: "13-18 yrs",
    icon: "🎒",
    accentColor: "#0ea5e9", // Sky / Vibrant Cyan
    accentHover: "#0284c7",
    accentLight: "rgba(14, 165, 233, 0.14)",
    accentBorder: "rgba(14, 165, 233, 0.35)",
    glowColor: "rgba(14, 165, 233, 0.25)",
    gradient: "linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)",
    greeting: {
      en: "Study Smart & Level Up! 📚",
      hi: "स्मार्ट पढ़ाई, बेहतर परिणाम! 📚",
    },
    subtitle: {
      en: "Reinforce school subjects, master daily science & math quizzes, and sharpen general knowledge.",
      hi: "स्कूल के विषयों, दैनिक क्विज़ और सामान्य ज्ञान में अपनी पकड़ मजबूत करें।",
    },
    badge: {
      en: "Students Hub (Class 6-12)",
      hi: "स्टूडेंट्स हब (कक्षा 6-12)",
    },
  },
  adults: {
    id: "adults",
    label: "Adults",
    labelHi: "वयस्क",
    shortLabel: "Adults",
    shortLabelHi: "वयस्क",
    tagline: "Trivia, GK & Exam Prep",
    taglineHi: "रोचक ट्रिविया व परीक्षा तैयारी",
    ageRange: "18+ yrs",
    icon: "🎯",
    accentColor: "#6366f1", // Flagship Indigo
    accentHover: "#4f46e5",
    accentLight: "rgba(99, 102, 241, 0.14)",
    accentBorder: "rgba(99, 102, 241, 0.35)",
    glowColor: "rgba(99, 102, 241, 0.25)",
    gradient: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
    greeting: {
      en: "Play, Learn & Test Your Knowledge 🎯",
      hi: "खेलें, सीखें और अपना ज्ञान परखें 🎯",
    },
    subtitle: {
      en: "Play trivia for fun, explore curious facts, or practice competitive exam mock tests.",
      hi: "रोचक ट्रिविया खेलें, नया ज्ञान सीखें या प्रतियोगी परीक्षा मॉक टेस्ट का अभ्यास करें।",
    },
    badge: {
      en: "General Quiz Hub & Exam Prep",
      hi: "सामान्य क्विज़ व परीक्षा तैयारी",
    },
  },
};

export const STUDENT_GRADE_OPTIONS = [
  "Class 6 — CBSE",
  "Class 7 — CBSE",
  "Class 8 — CBSE",
  "Class 9 — CBSE",
  "Class 10 — CBSE",
  "Class 11 — CBSE (Science)",
  "Class 11 — CBSE (Commerce)",
  "Class 12 — CBSE (Science)",
  "Class 12 — CBSE (Commerce)",
  "Class 9 — ICSE",
  "Class 10 — ICSE",
  "Class 10 — State Board",
  "Class 12 — State Board",
];

const STORAGE_KEY = "quizweb_experience_tier";
const ONBOARDED_KEY = "quizweb_tier_onboarded";
const GRADE_STORAGE_KEY = "quizweb_student_grade";

const TierContext = createContext(null);

export function TierProvider({ children }) {
  const [tier, setTierState] = useState(TIERS.ADULTS);
  const [hasSavedTier, setHasSavedTier] = useState(false);
  const [studentGrade, setStudentGradeState] = useState(STUDENT_GRADE_OPTIONS[3]); // Default "Class 9 — CBSE"
  const [isTierModalOpen, setIsTierModalOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const savedTier = localStorage.getItem(STORAGE_KEY);
      const savedGrade = localStorage.getItem(GRADE_STORAGE_KEY);

      if (savedTier && Object.values(TIERS).includes(savedTier)) {
        setTierState(savedTier);
        setHasSavedTier(true);
      } else {
        setHasSavedTier(false);
      }

      if (savedGrade && STUDENT_GRADE_OPTIONS.includes(savedGrade)) {
        setStudentGradeState(savedGrade);
      }
    } catch (e) {
      console.error("[TierContext] Error reading from localStorage:", e);
      setHasSavedTier(false);
    }
  }, []);

  const selectTier = (newTier) => {
    if (!Object.values(TIERS).includes(newTier)) return;
    setTierState(newTier);
    setHasSavedTier(true);
    try {
      localStorage.setItem(STORAGE_KEY, newTier);
      localStorage.setItem(ONBOARDED_KEY, "true");
    } catch (e) {
      console.error("[TierContext] Error writing to localStorage:", e);
    }
  };

  const setStudentGrade = (newGrade) => {
    if (!STUDENT_GRADE_OPTIONS.includes(newGrade)) return;
    setStudentGradeState(newGrade);
    try {
      localStorage.setItem(GRADE_STORAGE_KEY, newGrade);
    } catch (e) {
      console.error("[TierContext] Error writing student grade to localStorage:", e);
    }
  };

  const openTierModal = () => setIsTierModalOpen(true);

  const closeTierModal = () => {
    setIsTierModalOpen(false);
    try {
      localStorage.setItem(ONBOARDED_KEY, "true");
    } catch (e) {
      console.error("[TierContext] Error updating onboarded status:", e);
    }
  };

  // Sync data-tier attribute with document root for styling hooks
  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.setAttribute("data-tier", tier);
    }
  }, [tier]);

  const currentConfig = TIER_CONFIG[tier] || TIER_CONFIG.adults;

  return (
    <TierContext.Provider
      value={{
        tier,
        hasSavedTier,
        setTier: selectTier,
        studentGrade,
        setStudentGrade,
        studentGradeOptions: STUDENT_GRADE_OPTIONS,
        currentConfig,
        tierConfig: TIER_CONFIG,
        isTierModalOpen,
        openTierModal,
        closeTierModal,
        mounted,
      }}
    >
      {children}
    </TierContext.Provider>
  );
}

export function useTier() {
  const context = useContext(TierContext);
  if (!context) {
    throw new Error("useTier must be used within a TierProvider");
  }
  return context;
}
