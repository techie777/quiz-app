"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

export default function SplashScreen({ onComplete }) {
  const [visible, setVisible] = useState(false);
  const { isHindi } = useLanguage();

  useEffect(() => {
    // Only show on cold start in the current session
    try {
      const shown = sessionStorage.getItem("quizweb_splash_shown");
      if (!shown) {
        setVisible(true);
        const timer = setTimeout(() => {
          setVisible(false);
          try {
            sessionStorage.setItem("quizweb_splash_shown", "true");
          } catch {}
          if (onComplete) onComplete();
        }, 1500); // 1.5s duration

        return () => clearTimeout(timer);
      }
    } catch {
      if (onComplete) onComplete();
    }
  }, [onComplete]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.35, ease: "easeInOut" } }}
          className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-gradient-to-br from-[#F8FAFC] via-[#EEF2FF] to-[#F1F5F9] select-none pointer-events-auto"
        >
          {/* Centered Sparkle Logo + Wordmark */}
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
            className="flex flex-col items-center gap-3"
          >
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#6366F1] to-[#8B5CF6] flex items-center justify-center text-white shadow-xl shadow-indigo-500/25 ring-4 ring-white">
              <Sparkles size={34} className="fill-white" />
            </div>

            <div className="text-center">
              <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center justify-center gap-1">
                <span>QuizWeb</span>
                <span className="w-2 h-2 rounded-full bg-indigo-600 inline-block mb-1" />
              </h1>
              <p className="text-xs sm:text-sm font-semibold text-slate-500 mt-1 tracking-wider uppercase">
                {isHindi ? "खेलें · सीखें · आगे बढ़ें" : "Play · Learn · Grow"}
              </p>
            </div>
          </motion.div>

          {/* Thin Animated Loading Bar */}
          <div className="absolute bottom-12 w-36 h-1 bg-slate-200/90 rounded-full overflow-hidden">
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: "100%" }}
              transition={{ repeat: Infinity, duration: 1.1, ease: "easeInOut" }}
              className="w-full h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full"
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
