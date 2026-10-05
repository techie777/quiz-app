"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Gamepad2,
  Calendar,
  Newspaper,
  Sparkles,
  CheckCircle2,
  BookOpen,
  X,
  ChevronRight,
  Flame,
  Zap,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

export default function PlayMenuModal({ isOpen, onClose }) {
  const router = useRouter();
  const { isHindi } = useLanguage();

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose?.();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Lock background scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const playFeatures = [
    {
      id: "play-quiz",
      title: isHindi ? "क्विज़ खेलें" : "Play Quiz",
      titleEn: "Play Quiz",
      badge: isHindi ? "1000+ क्विज़" : "1000+ Quizzes",
      desc: isHindi
        ? "सभी श्रेणियों में टाइमर, स्कोर और मैस्कॉट के साथ खेलें"
        : "Timed quizzes across science, history, tech & more",
      href: "/quizzes",
      emoji: "🎯",
      icon: Gamepad2,
      gradient: "from-indigo-500 to-purple-600",
      bgSoft: "bg-indigo-50/70 dark:bg-indigo-950/30 hover:border-indigo-500/60",
      accentColor: "text-indigo-600 dark:text-indigo-400",
    },
    {
      id: "daily-quiz",
      title: isHindi ? "दैनिक क्विज़" : "Daily Quiz",
      titleEn: "Daily Quiz",
      badge: isHindi ? "रोज़ाना नया" : "Daily Streak",
      desc: isHindi
        ? "प्रतिदिन 10 नए प्रश्न हल करें और अपनी स्ट्रीक बनाएं"
        : "10 fresh daily questions to test your knowledge",
      href: "/daily-quiz/past",
      emoji: "🔥",
      icon: Flame,
      gradient: "from-amber-500 to-orange-600",
      bgSoft: "bg-amber-50/70 dark:bg-amber-950/30 hover:border-amber-500/60",
      accentColor: "text-amber-600 dark:text-amber-400",
    },
    {
      id: "current-affairs",
      title: isHindi ? "दैनिक करेंट अफेयर्स" : "Daily Current Affairs",
      titleEn: "Current Affairs",
      badge: isHindi ? "आज के समाचार" : "Today's News",
      desc: isHindi
        ? "प्रतियोगी परीक्षाओं के लिए दैनिक समसामयिकी व तथ्य"
        : "Daily news, national & international exam updates",
      href: "/daily-current-affairs",
      emoji: "📰",
      icon: Newspaper,
      gradient: "from-blue-500 to-cyan-600",
      bgSoft: "bg-blue-50/70 dark:bg-blue-950/30 hover:border-blue-500/60",
      accentColor: "text-blue-600 dark:text-blue-400",
    },
    {
      id: "fun-facts",
      title: isHindi ? "रोचक तथ्य" : "Fun Facts",
      titleEn: "Fun Facts",
      badge: isHindi ? "3D कार्ड्स" : "3D Flip Cards",
      desc: isHindi
        ? "3D फ्लिप कार्ड्स में ज्ञानवर्धक और हैरान करने वाले तथ्य"
        : "Bite-sized astonishing facts on tactile 3D cards",
      href: "/fun-facts",
      emoji: "💡",
      icon: Sparkles,
      gradient: "from-emerald-500 to-teal-600",
      bgSoft: "bg-emerald-50/70 dark:bg-emerald-950/30 hover:border-emerald-500/60",
      accentColor: "text-emerald-600 dark:text-emerald-400",
    },
    {
      id: "true-false",
      title: isHindi ? "सही या गलत" : "True & False",
      titleEn: "True & False",
      badge: isHindi ? "क्विक टेस्ट" : "Rapid Fire",
      desc: isHindi
        ? "तेज़ गति से तथ्यों की सच्चाई परखें और स्कोर बढ़ाएं"
        : "Rapid-fire true or false facts challenge",
      href: "/true-false",
      emoji: "⚡",
      icon: Zap,
      gradient: "from-rose-500 to-pink-600",
      bgSoft: "bg-rose-50/70 dark:bg-rose-950/30 hover:border-rose-500/60",
      accentColor: "text-rose-600 dark:text-rose-400",
    },
    {
      id: "my-books",
      title: isHindi ? "मेरी पुस्तकें" : "My Books",
      titleEn: "My Books",
      badge: isHindi ? "ई-बुक्स शेल्फ" : "E-Books",
      desc: isHindi
        ? "डिजिटल सामान्य ज्ञान पुस्तकें, ऑडियो रीडर और नोट्स"
        : "Interactive GK books, smart audio reader & notes",
      href: "/gk-book",
      emoji: "📖",
      icon: BookOpen,
      gradient: "from-violet-500 to-purple-700",
      bgSoft: "bg-purple-50/70 dark:bg-purple-950/30 hover:border-purple-500/60",
      accentColor: "text-purple-600 dark:text-purple-400",
    },
  ];

  const handleSelectFeature = (href) => {
    onClose?.();
    router.push(href);
  };

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/70 backdrop-blur-md select-none animate-in fade-in duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="play-menu-title"
    >
      <div
        className="w-full max-w-xl max-h-[92vh] sm:max-h-[88vh] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-t-[32px] sm:rounded-3xl p-5 sm:p-7 shadow-2xl relative flex flex-col gap-4 overflow-hidden animate-in slide-in-from-bottom-8 sm:zoom-in-95 duration-250"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="flex items-start justify-between gap-3 pr-2">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 text-white flex items-center justify-center text-xl shadow-lg shadow-indigo-500/25 shrink-0">
              ▶
            </div>
            <div>
              <h2
                id="play-menu-title"
                className="text-lg sm:text-xl font-black text-slate-900 dark:text-white leading-tight"
              >
                {isHindi ? "आप क्या खेलना चाहते हैं?" : "What would you like to play?"}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {isHindi
                  ? "अपनी पसंद का गेम या लर्निंग मोड चुनें"
                  : "Choose your favorite learning game or quiz mode"}
              </p>
            </div>
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center transition-colors shrink-0"
            aria-label="Close"
          >
            <X size={17} />
          </button>
        </div>

        {/* 6 Features Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 overflow-y-auto pr-1 py-1 max-h-[60vh] sm:max-h-[55vh]">
          {playFeatures.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => handleSelectFeature(item.href)}
              className={`w-full text-left p-3.5 sm:p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800 ${item.bgSoft} transition-all duration-150 flex items-start gap-3 group active:scale-[0.98] shadow-xs hover:shadow-md`}
            >
              {/* Emoji / Icon Badge */}
              <div
                className={`w-11 h-11 rounded-2xl bg-gradient-to-tr ${item.gradient} text-white flex items-center justify-center text-xl shadow-md shrink-0 group-hover:scale-105 transition-transform`}
              >
                <span>{item.emoji}</span>
              </div>

              {/* Text Info */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1 mb-0.5">
                  <span className="font-extrabold text-sm text-slate-900 dark:text-white truncate">
                    {item.title}
                  </span>
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-white/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60 shrink-0">
                    {item.badge}
                  </span>
                </div>
                <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                  {item.desc}
                </p>
              </div>

              {/* Arrow */}
              <ChevronRight
                size={16}
                className="text-slate-400 group-hover:text-slate-800 dark:group-hover:text-white group-hover:translate-x-1 transition-all shrink-0 mt-2"
              />
            </button>
          ))}
        </div>

        {/* Modal Footer Tip */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-1.5 text-[11px]">
            <span>💡</span>
            <span>
              {isHindi
                ? "आप कभी भी होमपेज या नेविगेशन से इन्हें खेल सकते हैं।"
                : "You can access these anytime from the navigation bar."}
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white px-2 py-1 rounded-lg"
          >
            {isHindi ? "बंद करें" : "Close"}
          </button>
        </div>
      </div>
    </div>
  );
}
