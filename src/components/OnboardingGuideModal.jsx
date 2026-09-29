"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  GraduationCap,
  Compass,
  Zap,
  Play,
  Heart,
  Share2,
  ArrowRight,
  Check,
  X,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

export default function OnboardingGuideModal({ isOpen, onClose }) {
  const { isHindi } = useLanguage();
  const [currentSlide, setCurrentSlide] = useState(0);

  const SLIDES = [
    {
      id: "kids",
      title: isHindi ? "1. बच्चे (Kids · आयु 5-12 वर्ष)" : "1. Kids (Ages 5–12)",
      desc: isHindi
        ? "रंगीन पिक्चर-टाइल क्विज़, बिना किसी टाइमर का दबाव और चमचमाते स्टार स्टिकर इनाम!"
        : "Playful picture-tile quizzes, zero timer pressure, and fun star sticker rewards.",
      icon: Sparkles,
      iconBg: "bg-amber-100 text-amber-600",
      accentBg: "from-amber-500/10 via-amber-500/5 to-transparent",
      badgeColor: "bg-amber-100 text-amber-800 border-amber-200",
      badge: isHindi ? "आयु 5–12" : "AGE 5–12",
    },
    {
      id: "students",
      title: isHindi ? "2. विद्यार्थी (Students · कक्षा 6-12)" : "2. Students (Class 6–12)",
      desc: isHindi
        ? "कक्षा-वार पाठ्यक्रम क्विज़, दैनिक स्ट्रीक, ज्ञान अंक (XP) और मजेदार फन ज़ोन।"
        : "Class-wise curriculum quizzes, daily streaks, XP progression, and rapid Fun Zone trivia.",
      icon: GraduationCap,
      iconBg: "bg-teal-100 text-teal-700",
      accentBg: "from-teal-500/10 via-teal-500/5 to-transparent",
      badgeColor: "bg-teal-100 text-teal-800 border-teal-200",
      badge: isHindi ? "कक्षा 6–12" : "CLASS 6–12",
    },
    {
      id: "explorer",
      title: isHindi ? "3. एक्सप्लोरर (Explorer · सभी के लिए)" : "3. Explorer (For Everyone)",
      desc: isHindi
        ? "जीके (India GK व World GK मास्टर पाथ), दैनिक करेंट अफेयर्स, सरकारी परीक्षा (SSC, Railway) तैयारी व सीखो हब।"
        : "Complete GK Tab (India GK & World GK Master Paths), daily brief, competitive exam prep (SSC, Railway) & Seekho hub.",
      icon: Compass,
      iconBg: "bg-indigo-100 text-indigo-600",
      accentBg: "from-indigo-500/10 via-indigo-500/5 to-transparent",
      badgeColor: "bg-indigo-100 text-indigo-800 border-indigo-200",
      badge: isHindi ? "India GK · World GK" : "INDIA & WORLD GK",
    },
    {
      id: "arena",
      title: isHindi ? "4. क्विज़ एरिना (Quiz Arena)" : "4. Quiz Arena (Custom Engine)",
      desc: isHindi
        ? "अपनी पसंद का क्विज़ बनाएं: श्रेणियां, प्रश्नों की संख्या, कठिनाई स्तर और टाइमर खुद सेट करें।"
        : "Build your own custom quiz: pick categories, question count, difficulty, and timer in 2 taps.",
      icon: Zap,
      iconBg: "bg-violet-100 text-violet-600",
      accentBg: "from-violet-500/10 via-violet-500/5 to-transparent",
      badgeColor: "bg-violet-100 text-violet-800 border-violet-200",
      badge: isHindi ? "कस्टम क्विज़" : "CUSTOM BUILDER",
    },
    {
      id: "play",
      title: isHindi ? "5. खेलें, पसंदीदा बनाएं व शेयर करें" : "5. Play, Favourite & Share",
      desc: isHindi
        ? "नीचे दिया गया मुख्य Play बटन तुरंत क्विज़ शुरू करता है। प्रश्नों को ❤️ पसंदीदा बनाएं और मित्रों को चुनौती दें।"
        : "Tap the center Play button anytime to start. ❤️ Favourite questions to revise & challenge friends with deep links.",
      icon: Play,
      iconBg: "bg-rose-100 text-rose-600",
      accentBg: "from-rose-500/10 via-rose-500/5 to-transparent",
      badgeColor: "bg-rose-100 text-rose-800 border-rose-200",
      badge: isHindi ? "विशेषताएं" : "KEY FEATURES",
    },
  ];

  const handleFinish = () => {
    try {
      localStorage.setItem("onboardingSeen", "true");
    } catch {}
    if (onClose) onClose();
  };

  const handleNext = () => {
    if (currentSlide < SLIDES.length - 1) {
      setCurrentSlide((prev) => prev + 1);
    } else {
      handleFinish();
    }
  };

  if (!isOpen) return null;

  const slide = SLIDES[currentSlide];
  const Icon = slide.icon;

  return (
    <div className="fixed inset-0 z-[99990] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm select-none">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col justify-between p-6 sm:p-7 min-h-[420px]"
      >
        {/* Top Header: Badge + Skip */}
        <div className="flex items-center justify-between gap-2 mb-4">
          <span
            className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${slide.badgeColor}`}
          >
            {slide.badge}
          </span>
          <button
            type="button"
            onClick={handleFinish}
            className="text-xs font-bold text-slate-400 hover:text-slate-700 px-2 py-1 rounded-lg transition-colors"
          >
            {isHindi ? "छोड़ें (Skip)" : "Skip"}
          </button>
        </div>

        {/* Slide Content with Animated Transitions */}
        <AnimatePresence mode="wait">
          <motion.div
            key={slide.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
            className="flex-1 flex flex-col items-center justify-center text-center my-3"
          >
            {/* Illustrated Icon Tile */}
            <div
              className={`w-20 h-20 rounded-3xl flex items-center justify-center shadow-md mb-5 ${slide.iconBg} ring-8 ring-slate-50`}
            >
              <Icon size={38} className="stroke-[2.2]" />
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mb-2">
              {slide.title}
            </h2>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-xs font-medium">
              {slide.desc}
            </p>
          </motion.div>
        </AnimatePresence>

        {/* Bottom Navigation: Pagination Dots + Next / Get Started */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-4 mt-2">
          {/* 5 Dots Indicator */}
          <div className="flex items-center gap-1.5">
            {SLIDES.map((s, idx) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setCurrentSlide(idx)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  currentSlide === idx
                    ? "w-6 bg-indigo-600"
                    : "w-2 bg-slate-200 hover:bg-slate-300"
                }`}
                aria-label={`Slide ${idx + 1}`}
              />
            ))}
          </div>

          {/* Action Button */}
          <button
            type="button"
            onClick={handleNext}
            className="px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-md shadow-indigo-500/25 transition-transform active:scale-95"
          >
            <span>
              {currentSlide === SLIDES.length - 1
                ? isHindi
                  ? "शुरू करें"
                  : "Get Started"
                : isHindi
                ? "आगे"
                : "Next"}
            </span>
            <ArrowRight size={14} />
          </button>
        </div>
      </motion.div>
    </div>
  );
}
