"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  Volume2,
  VolumeX,
  Star,
  Flame,
  Calendar,
  Gift,
  Trophy,
  Home,
  Palette,
  Gamepad2,
  Award,
  User,
  X,
  Play,
  CheckCircle2,
  Lock,
  ChevronRight,
  ShieldCheck,
  Heart,
  ArrowRight,
} from "lucide-react";
import { useTier, TIERS } from "@/context/TierContext";
import { useLanguage } from "@/context/LanguageContext";
import { useQuiz } from "@/context/QuizContext";
import { useData } from "@/context/DataContext";
import { getTodayIST } from "@/lib/dailyQuizHelper";

// ── Playful Web Audio API Sound Synthesizer for Kids (Zero external assets needed) ──
export const playKidSound = (type = "pop", soundEnabled = true) => {
  if (!soundEnabled || typeof window === "undefined") return;
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;

    if (type === "pop") {
      osc.type = "triangle";
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(780, now + 0.12);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
      osc.start(now);
      osc.stop(now + 0.13);
    } else if (type === "win") {
      osc.type = "sine";
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.setValueAtTime(554.37, now + 0.08);
      osc.frequency.setValueAtTime(659.25, now + 0.16);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.32);
      osc.start(now);
      osc.stop(now + 0.34);
    } else if (type === "star") {
      osc.type = "sine";
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(1200, now + 0.18);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);
      osc.start(now);
      osc.stop(now + 0.19);
    }
  } catch (e) {
    // Audio context may require user tap on mobile
  }
};

export default function KidsZoneView() {
  const router = useRouter();
  const { setTier } = useTier();
  const { isHindi } = useLanguage();
  const { startQuizSet } = useQuiz();
  const { quizzes } = useData();

  // Global App States
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [stars, setStars] = useState(240);
  const [loadingDaily, setLoadingDaily] = useState(false);

  // Modals
  const [isModeModalOpen, setIsModeModalOpen] = useState(false);
  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);
  const [isStickerModalOpen, setIsStickerModalOpen] = useState(false);
  const [isDiyQuizOpen, setIsDiyQuizOpen] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState(null);

  const todayIST = getTodayIST();

  const handleStartDailyAdventureRef = useRef(null);

  // Load persistent stars & sound preference
  useEffect(() => {
    try {
      const savedStars = localStorage.getItem("quiz_kids_stars");
      if (savedStars) setStars(parseInt(savedStars, 10));

      const savedSound = localStorage.getItem("quiz_kids_sound");
      if (savedSound !== null) setSoundEnabled(savedSound === "true");
    } catch {}

    // Listen for custom events from Bottom Navigation Bar
    const handleOpenStickers = () => {
      setIsStickerModalOpen(true);
    };
    const handleKidsPlay = () => {
      handleStartDailyAdventureRef.current?.();
    };

    window.addEventListener("open-kids-stickers", handleOpenStickers);
    window.addEventListener("kids-play-quest", handleKidsPlay);
    return () => {
      window.removeEventListener("open-kids-stickers", handleOpenStickers);
      window.removeEventListener("kids-play-quest", handleKidsPlay);
    };
  }, []);

  const triggerTapSound = (type = "pop") => {
    playKidSound(type, soundEnabled);
  };

  const handleToggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    if (next) playKidSound("pop", true);
    try {
      localStorage.setItem("quiz_kids_sound", next.toString());
    } catch {}
  };

  const addStars = (amt) => {
    setStars((prev) => {
      const updated = prev + amt;
      try {
        localStorage.setItem("quiz_kids_stars", updated.toString());
      } catch {}
      return updated;
    });
  };

  // Sticker Album collection
  const stickers = [
    { id: "sheru", name: isHindi ? "शेरू बब्बर शेर" : "Sheru the Lion", emoji: "🦁", unlocked: true, rarity: isHindi ? "दुर्लभ (Rare)" : "Rare" },
    { id: "rocket", name: isHindi ? "सुपर रॉकेट" : "Super Rocket", emoji: "🚀", unlocked: true, rarity: isHindi ? "आम (Common)" : "Common" },
    { id: "dino", name: isHindi ? "टी-रेक्स डायनासोर" : "T-Rex Dino", emoji: "🦖", unlocked: true, rarity: isHindi ? "चमकीला (Epic)" : "Epic" },
    { id: "wand", name: isHindi ? "जादुई छड़ी" : "Magic Wand", emoji: "🪄", unlocked: true, rarity: isHindi ? "आम (Common)" : "Common" },
    { id: "rainbow", name: isHindi ? "इंद्रधनुष" : "Rainbow Star", emoji: "🌈", unlocked: false, rarity: isHindi ? "पौराणिक (Legendary)" : "Legendary", requirement: isHindi ? "डे 5 पूरा करें" : "Complete Day 5" },
    { id: "crown", name: isHindi ? "गोल्डन मुकुट" : "Golden Crown", emoji: "👑", unlocked: false, rarity: isHindi ? "स्पेशल" : "Special", requirement: isHindi ? "500 स्टार्स" : "500 Stars" },
  ];

  // 6 Tactile Topic Adventure Tiles with 48px+ Illustrations
  const topics = [
    {
      id: "animals",
      title: isHindi ? "जानवर और जंगल" : "Animals & Wildlife",
      subtitle: isHindi ? "जंगली जीव, पक्षी और पेड़" : "Wild animals, birds & nature",
      tag: isHindi ? "10 मजेदार सवाल" : "10 Fun Questions",
      emoji: "🦁",
      bgGradient: "from-amber-400 via-orange-400 to-amber-500",
      shadowColor: "border-b-4 border-amber-600",
      badgeBg: "bg-amber-900/30 text-amber-100",
      sparkleEmoji: "🌿",
      targetSlug: "nature-animals",
    },
    {
      id: "space",
      title: isHindi ? "अंतरिक्ष और रॉकेट" : "Space & Stars",
      subtitle: isHindi ? "चाँद, सूरज, तारे और ग्रह" : "Moon, sun, planets & galaxy",
      tag: isHindi ? "10 रोमांचक सवाल" : "10 Space Quests",
      emoji: "🚀",
      bgGradient: "from-indigo-500 via-purple-500 to-indigo-600",
      shadowColor: "border-b-4 border-indigo-700",
      badgeBg: "bg-indigo-950/30 text-indigo-100",
      sparkleEmoji: "✨",
      targetSlug: "science--discovery",
    },
    {
      id: "fairy",
      title: isHindi ? "जादुई कहानियां" : "Stories & Fairy Tales",
      subtitle: isHindi ? "परियों, कार्टून और किस्से" : "Fairy tales, comics & fun",
      tag: isHindi ? "10 प्यारी पहेलियां" : "10 Sweet Stories",
      emoji: "🏰",
      bgGradient: "from-pink-400 via-rose-400 to-pink-500",
      shadowColor: "border-b-4 border-rose-600",
      badgeBg: "bg-rose-950/30 text-rose-100",
      sparkleEmoji: "🧚",
      targetSlug: "entertainment",
    },
    {
      id: "puzzles",
      title: isHindi ? "दिमागी पहेलियां" : "Brain Riddles & Logic",
      subtitle: isHindi ? "चुनौतीपूर्ण और मजेदार सोच" : "Puzzles & mental gymnastics",
      tag: isHindi ? "10 मजेदार पहेलियां" : "10 Brain Teasers",
      emoji: "🧩",
      bgGradient: "from-emerald-400 via-teal-400 to-emerald-500",
      shadowColor: "border-b-4 border-teal-600",
      badgeBg: "bg-teal-950/30 text-teal-100",
      sparkleEmoji: "💡",
      targetSlug: "general-knowledge",
    },
    {
      id: "world",
      title: isHindi ? "हमारी दुनिया" : "Our World & Wonders",
      subtitle: isHindi ? "देश, महासागर और प्रकृति" : "Countries, oceans & flags",
      tag: isHindi ? "10 ज्ञानवर्धक सवाल" : "10 World Wonders",
      emoji: "🌍",
      bgGradient: "from-cyan-400 via-sky-500 to-blue-500",
      shadowColor: "border-b-4 border-blue-700",
      badgeBg: "bg-blue-950/30 text-blue-100",
      sparkleEmoji: "🗺️",
      targetSlug: "world-gk",
    },
    {
      id: "rhymes",
      title: isHindi ? "बालगीत और संगीत" : "Songs & Rhymes",
      subtitle: isHindi ? "गाने, वाद्य और कविताएँ" : "Nursery rhymes & melody",
      tag: isHindi ? "10 सुरीले सवाल" : "10 Musical Riddles",
      emoji: "🎵",
      bgGradient: "from-violet-400 via-purple-400 to-fuchsia-500",
      shadowColor: "border-b-4 border-purple-700",
      badgeBg: "bg-purple-950/30 text-purple-100",
      sparkleEmoji: "🎧",
      targetSlug: "entertainment",
    },
  ];

  const handleSelectTopic = (topic) => {
    triggerTapSound("star");
    setSelectedTopic(topic);
  };

  const handleLaunchTopicQuiz = (topic) => {
    triggerTapSound("win");
    addStars(50);
    setSelectedTopic(null);

    // Look for matching category in quizzes or fallback
    const matched = (quizzes || []).find((q) =>
      (q?.slug || "").includes(topic.targetSlug) ||
      (q?.topic || "").toLowerCase().includes(topic.id)
    );
    const dest = matched?.slug ? `/category/${matched.slug}` : `/category/${topic.targetSlug}`;
    router.push(dest);
  };

  // Launch Real Daily Kids Quiz
  const handleStartDailyAdventure = async () => {
    if (loadingDaily) return;
    setLoadingDaily(true);
    triggerTapSound("pop");

    try {
      const res = await fetch(`/api/daily-quiz?tier=kids&date=${encodeURIComponent(todayIST)}`);
      if (!res.ok) throw new Error("Failed to load daily quest");
      const data = await res.json();
      const questions = data.questions || [];

      if (questions.length === 0) {
        router.push("/category/nature-animals");
        return;
      }

      const categoryId = `daily-kids-${todayIST}`;
      const title = isHindi ? `दैनिक किड्स मिशन · ${todayIST}` : `Daily Kids Quest · ${todayIST}`;
      const normalized = questions.map((q) => ({ ...q, categoryId }));

      sessionStorage.setItem("current_daily_quiz", JSON.stringify({
        tier: "kids",
        date: todayIST,
        dailyQuizId: data.daily?.id || categoryId,
        isToday: true,
      }));

      startQuizSet(categoryId, normalized, 0, "en", 0, title, true);
      router.push(`/quiz/${categoryId}`);
    } catch {
      router.push("/category/nature-animals");
    } finally {
      setLoadingDaily(false);
    }
  };
  handleStartDailyAdventureRef.current = handleStartDailyAdventure;

  return (
    <div className="w-full flex flex-col items-center select-none text-slate-800 pb-32">
      {/* Maximum Mobile Frame Container */}
      <div className="w-full max-w-[440px] space-y-4">

        {/* ================= 1. CHEERFUL KIDS HEADER BAR ================= */}
        <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b-2 border-amber-200 px-3.5 py-2.5 rounded-2xl flex items-center justify-between shadow-xs">
          {/* Logo with Magic Sparkles */}
          <div
            className="flex items-center gap-1.5 cursor-pointer"
            onClick={() => triggerTapSound("pop")}
          >
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-amber-400 to-pink-500 flex items-center justify-center text-white shadow-md border-b-2 border-amber-600 active:scale-95 transition-transform">
              <Sparkles className="w-5 h-5 fill-yellow-200 text-white animate-spin" style={{ animationDuration: "8s" }} />
            </div>
            <span className="text-xl font-black tracking-tight text-slate-900">
              Quiz<span className="text-amber-500">Web</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Star Bank (XP / Reward Coins) */}
            <div
              onClick={() => {
                triggerTapSound("win");
                addStars(5);
              }}
              title={isHindi ? "स्टार बैंक (टैप करें!)" : "Star Bank (Tap for bonus!)"}
              className="flex items-center gap-1 bg-amber-100 border-2 border-amber-300 px-2.5 py-1 rounded-full shadow-2xs active:scale-90 transition-transform cursor-pointer"
            >
              <Star className="w-4 h-4 text-amber-500 fill-amber-400 animate-bounce" style={{ animationDuration: "2s" }} />
              <span className="text-xs font-black text-amber-900">{stars}</span>
            </div>

            {/* Sound FX Toggle */}
            <button
              onClick={handleToggleSound}
              className={`w-8 h-8 rounded-xl flex items-center justify-center border-2 transition-all active:scale-90 cursor-pointer ${
                soundEnabled
                  ? "bg-emerald-100 border-emerald-300 text-emerald-800"
                  : "bg-slate-100 border-slate-300 text-slate-400"
              }`}
              title={soundEnabled ? (isHindi ? "आवाज़ चालू" : "Sound On") : (isHindi ? "आवाज़ बंद" : "Sound Off")}
              aria-label="Toggle sound"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Parent Mode Switcher Button */}
            <button
              onClick={() => {
                triggerTapSound("pop");
                setIsModeModalOpen(true);
              }}
              className="text-[11px] font-black text-slate-700 bg-white hover:bg-slate-100 border-2 border-slate-200/90 active:scale-95 px-2.5 py-1.5 rounded-xl shadow-2xs flex items-center gap-1 transition cursor-pointer"
            >
              <span>{isHindi ? "मोड बदलें" : "Switch Mode"}</span>
            </button>
          </div>
        </header>

        {/* Profile Pill Subheader Bar (Clean, no duplicate stacked badges!) */}
        <div className="bg-amber-100/70 border border-amber-200/90 rounded-2xl px-4 py-2 flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-2">
            <span className="text-xl">🧒</span>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black text-amber-950">
                {isHindi ? "नन्हे उस्ताद (Kids Zone)" : "Little Explorer"}
              </span>
              <span className="text-[10px] font-bold bg-amber-200/80 text-amber-900 px-2 py-0.2 rounded-full">
                5–12 {isHindi ? "वर्ष" : "yrs"}
              </span>
            </div>
          </div>
          <span className="text-[11px] font-bold text-amber-800 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>{isHindi ? "100% सुरक्षित" : "100% Kid-Safe"}</span>
          </span>
        </div>

        {/* ================= 2. DAILY QUEST HERO CARD ================= */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-400 via-orange-400 to-amber-500 p-4 sm:p-5 text-white shadow-xl shadow-amber-400/25 border-b-4 border-amber-600">
          {/* Ambient Sparkle Decor */}
          <div className="absolute top-1 right-2 text-3xl opacity-30 select-none animate-pulse">✨</div>
          <div className="absolute -bottom-4 -left-4 text-4xl opacity-25 select-none">🎈</div>

          <div className="flex items-start justify-between relative z-10">
            <div className="space-y-1">
              {/* Punchy Badge */}
              <div className="inline-flex items-center gap-1 bg-amber-900/30 backdrop-blur-xs text-amber-100 text-[11px] font-black px-2.5 py-0.5 rounded-full border border-amber-200/30">
                <Sparkles className="w-3 h-3 text-yellow-300" />
                <span>{isHindi ? "आज का जादुई मिशन" : "Today's Quest"}</span>
              </div>
              <h2 className="text-lg font-black tracking-tight text-white drop-shadow-xs">
                {isHindi ? "दैनिक किड्स क्विज़" : "Daily Kids Quiz"}
              </h2>
              <p className="text-xs font-bold text-amber-100">
                {isHindi ? "10 आसान सवाल • पाओ 50 🌟 स्टार्स!" : "10 fun questions • Win 50 🌟 stars!"}
              </p>
            </div>

            {/* Friendly Mascot Sheru 🐯 */}
            <div
              onClick={() => {
                triggerTapSound("win");
                addStars(10);
              }}
              className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-xs border-2 border-white/40 flex flex-col items-center justify-center text-3xl shadow-inner active:scale-90 transition-transform cursor-pointer"
              title={isHindi ? "शेरू (टैप करें!)" : "Sheru the Tiger"}
            >
              <span>🐯</span>
              <span className="text-[9px] font-black tracking-tight text-white mt-0.5">
                {isHindi ? "शेरू" : "Sheru"}
              </span>
            </div>
          </div>

          {/* Bottom Actions Row: Unified Bouncy 3D Play Button + Past Archive Button */}
          <div className="flex items-center gap-2.5 mt-4 relative z-10">
            {/* Tactile Big 3D Play Button */}
            <button
              onClick={handleStartDailyAdventure}
              disabled={loadingDaily}
              className="flex-1 py-3 px-4 rounded-2xl bg-white hover:bg-amber-50 text-amber-900 font-black text-sm border-b-4 border-amber-300 shadow-md active:translate-y-1 active:border-b-0 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-amber-700 text-amber-700" />
              <span>{loadingDaily ? (isHindi ? "लोड हो रहा है..." : "Loading...") : (isHindi ? "अभी खेलें ▶" : "Play Quest ▶")}</span>
            </button>

            {/* Archive / Calendar Button */}
            <button
              onClick={() => {
                triggerTapSound("pop");
                setIsArchiveModalOpen(true);
              }}
              className="py-3 px-3.5 rounded-2xl bg-amber-600/40 hover:bg-amber-600/60 text-white font-bold text-xs border border-white/30 backdrop-blur-xs flex items-center justify-center gap-1.5 active:scale-95 transition cursor-pointer"
              title={isHindi ? "पुराने क्विज़ देखें" : "View Past Quizzes"}
            >
              <Calendar className="w-4 h-4 text-white" />
              <span>{isHindi ? "पुराने" : "Past"}</span>
            </button>
          </div>
        </section>

        {/* ================= 3. 5-DAY GAMIFIED STREAK & TREASURE MAP ================= */}
        <section className="bg-white rounded-3xl p-4 border-2 border-amber-200/90 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-500 flex items-center justify-center text-white shadow-xs">
                <Flame className="w-5 h-5 fill-yellow-200 text-yellow-100 animate-pulse" />
              </div>
              <div>
                <h3 className="text-xs font-black text-slate-900 flex items-center gap-1">
                  <span>{isHindi ? "3 दिन की स्ट्रीक! 🌟" : "3 Day Streak! 🌟"}</span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.2 rounded-full">
                    {isHindi ? "सक्रिय" : "Active"}
                  </span>
                </h3>
                <p className="text-[11px] text-slate-500 font-medium">
                  {isHindi ? "रोज़ खेलें और जादुई स्टिकर्स अनलॉक करें!" : "Play daily to unlock magical stickers!"}
                </p>
              </div>
            </div>

            {/* Sticker Book Button */}
            <button
              onClick={() => {
                triggerTapSound("win");
                setIsStickerModalOpen(true);
              }}
              className="flex items-center gap-1 text-[11px] font-black text-amber-800 bg-amber-100 hover:bg-amber-200 active:scale-95 px-2.5 py-1.5 rounded-xl border border-amber-300 transition cursor-pointer"
            >
              <Gift className="w-3.5 h-3.5 text-amber-700" />
              <span>{isHindi ? "स्टिकर" : "Stickers"}</span>
            </button>
          </div>

          {/* 5-Day Milestone Path */}
          <div className="bg-amber-50/70 rounded-2xl p-2.5 border border-amber-200 flex items-center justify-between">
            {/* Day 1: Done */}
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 rounded-full bg-emerald-500 text-white font-bold flex items-center justify-center text-xs shadow-xs border-2 border-emerald-600">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-bold text-slate-600 mt-1">{isHindi ? "डे 1" : "Day 1"}</span>
            </div>

            <div className="h-0.5 flex-1 bg-emerald-400 mx-1" />

            {/* Day 2: Done */}
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 rounded-full bg-emerald-500 text-white font-bold flex items-center justify-center text-xs shadow-xs border-2 border-emerald-600">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-bold text-slate-600 mt-1">{isHindi ? "डे 2" : "Day 2"}</span>
            </div>

            <div className="h-0.5 flex-1 bg-amber-400 mx-1" />

            {/* Day 3: Active Today */}
            <div className="flex flex-col items-center">
              <div className="w-9 h-9 rounded-full bg-amber-400 text-amber-950 font-black flex items-center justify-center text-sm shadow-md border-2 border-amber-600 animate-bounce" style={{ animationDuration: "2.5s" }}>
                ⭐
              </div>
              <span className="text-[10px] font-black text-amber-900 mt-0.5">{isHindi ? "आज" : "Today"}</span>
            </div>

            <div className="h-0.5 flex-1 bg-slate-300 mx-1" />

            {/* Day 4: Upcoming */}
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-400 font-bold flex items-center justify-center text-xs border border-slate-300">
                🪙
              </div>
              <span className="text-[10px] font-bold text-slate-400 mt-1">{isHindi ? "डे 4" : "Day 4"}</span>
            </div>

            <div className="h-0.5 flex-1 bg-slate-300 mx-1" />

            {/* Day 5: Big Mystery Chest */}
            <div
              onClick={() => {
                triggerTapSound("pop");
                alert(isHindi ? "🎁 डे 5 पूरा करने पर आपको मिलेगा जादुई 'इंद्रधनुष स्टिकर'!" : "🎁 Complete Day 5 to unlock the Legendary Rainbow Dino Sticker!");
              }}
              className="flex flex-col items-center cursor-pointer active:scale-90 transition-transform"
            >
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-purple-500 to-pink-500 text-white font-bold flex items-center justify-center text-base shadow-sm border-2 border-purple-600">
                🎁
              </div>
              <span className="text-[10px] font-extrabold text-purple-700 mt-0.5">{isHindi ? "बड़ा गिफ्ट" : "Big Gift"}</span>
            </div>
          </div>
        </section>

        {/* ================= 4. KIDS TOPIC ADVENTURE ISLAND ================= */}
        <section id="kids-topics" className="space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
              <span>{isHindi ? "पसंदीदा विषय चुनें" : "Pick Your Adventure"}</span>
              <span className="text-base">🎨</span>
            </h2>
            <span
              className="text-[11px] font-bold text-indigo-600 cursor-pointer"
              onClick={() => triggerTapSound("pop")}
            >
              {isHindi ? "बड़ी रंगीन टाइलें 👇" : "Chunky Tiles 👇"}
            </span>
          </div>

          {/* 2-Column Playful Bouncy Grid */}
          <div className="grid grid-cols-2 gap-3">
            {topics.map((topic) => (
              <div
                key={topic.id}
                onClick={() => handleSelectTopic(topic)}
                className={`relative rounded-3xl p-4 bg-gradient-to-br ${topic.bgGradient} ${topic.shadowColor} text-white shadow-lg cursor-pointer flex flex-col justify-between active:translate-y-1 active:border-b-0 transition-all group overflow-hidden`}
              >
                {/* Decorative background circle */}
                <div className="absolute -top-6 -right-6 w-20 h-20 bg-white/10 rounded-full blur-xs pointer-events-none" />

                {/* Top Bar inside card */}
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full backdrop-blur-xs ${topic.badgeBg}`}>
                    {topic.tag}
                  </span>
                  <span className="text-sm group-hover:rotate-12 transition-transform">
                    {topic.sparkleEmoji}
                  </span>
                </div>

                {/* Centered Large 3D Emoji Icon (48px+) */}
                <div className="my-2 flex items-center justify-center">
                  <span className="text-5xl drop-shadow-md group-hover:scale-110 transition-transform duration-200">
                    {topic.emoji}
                  </span>
                </div>

                {/* Title and Tap indicator */}
                <div className="mt-2 text-center">
                  <h3 className="font-black text-white text-sm leading-tight drop-shadow-xs">
                    {topic.title}
                  </h3>
                  <p className="text-[10px] font-bold text-white/80 mt-0.5 line-clamp-1">
                    {topic.subtitle}
                  </p>
                  <div className="mt-2 inline-flex items-center gap-1 text-[11px] font-black bg-white/20 px-2.5 py-0.5 rounded-full backdrop-blur-xs">
                    <span>{isHindi ? "खेलें" : "Play"}</span>
                    <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ================= 5. SECONDARY PLAY CARDS ================= */}
        {/* DIY Little Quiz Maker */}
        <div
          onClick={() => {
            triggerTapSound("pop");
            setIsDiyQuizOpen(true);
          }}
          className="bg-gradient-to-r from-violet-500 via-purple-600 to-indigo-600 rounded-3xl p-4 text-white shadow-md border-b-4 border-indigo-800 cursor-pointer active:translate-y-1 active:border-b-0 transition-all flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-xs border border-white/30 flex items-center justify-center text-2xl shadow-inner shrink-0">
              🪄
            </div>
            <div>
              <span className="text-[10px] font-black bg-yellow-400 text-yellow-950 px-2 py-0.2 rounded-full uppercase">
                DIY QUIZ
              </span>
              <h4 className="text-sm font-black text-white mt-0.5">
                {isHindi ? "नन्हा क्विज़ मेकर" : "Little Quiz Maker"}
              </h4>
              <p className="text-[11px] text-purple-100">
                {isHindi
                  ? "अपनी पसंद के 5 सवाल खुद चुनें और मम्मी-पापा से पूछें!"
                  : "Pick 5 favorite questions and challenge mom & dad!"}
              </p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-purple-200 shrink-0" />
        </div>

        {/* Parents & Teachers Support Ribbon */}
        <div className="bg-white rounded-3xl p-4 border-2 border-rose-100 shadow-2xs space-y-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-rose-100 flex items-center justify-center text-rose-600 shrink-0">
              <Heart className="w-4 h-4 fill-rose-500 text-rose-500" />
            </div>
            <div>
              <h4 className="text-xs font-black text-slate-800">
                {isHindi ? "माता-पिता व शिक्षकों के लिए" : "For Parents & Teachers"}
              </h4>
              <p className="text-[10px] text-slate-500">
                {isHindi
                  ? "QuizWeb 100% सुरक्षित और बच्चों के लिए विज्ञापन-मुक्त है।"
                  : "QuizWeb is 100% kid-safe and ad-free."}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              triggerTapSound("pop");
              alert(isHindi ? "❤️ धन्यवाद! QuizWeb बाल-शिक्षा को निःशुल्क और सुरक्षित बनाए रखने के लिए समर्पित है।" : "❤️ Thank you! QuizWeb is committed to free, safe kid learning.");
            }}
            className="w-full py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-black rounded-xl border border-rose-200 transition cursor-pointer"
          >
            ❤️ {isHindi ? "इस मिशन का समर्थन करें" : "Support Our Free Mission"}
          </button>
        </div>

      </div>

      {/* ================= MODAL 1: PARENT MODE SWITCHER ================= */}
      {isModeModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm p-5 space-y-4 shadow-2xl border-2 border-slate-100 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">🔄</span>
                <h3 className="font-black text-sm text-slate-900">
                  {isHindi ? "क्विज़ मोड बदलें" : "Switch Quiz Mode"}
                </h3>
              </div>
              <button
                onClick={() => setIsModeModalOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              {[
                { tierId: TIERS.KIDS, name: isHindi ? "🧒 बच्चे (किड्स ज़ोन)" : "🧒 Kids Zone (5–12 yrs)", desc: isHindi ? "आयु 5–12 वर्ष (वर्तमान सक्रिय)" : "Ages 5-12 (Currently active)", current: true },
                { tierId: TIERS.STUDENTS, name: isHindi ? "🎓 विद्यार्थी (School Students)" : "🎓 School Students (Class 6-12)", desc: isHindi ? "कक्षा 6 से 12 तक (NCERT तैयारी)" : "Class 6-12 curriculum", current: false },
                { tierId: TIERS.ADULTS, name: isHindi ? "🧭 सामान्य ज्ञान (General GK)" : "🧭 General Knowledge Explorer", desc: isHindi ? "40+ विषय और प्रतियोगी परीक्षाएं" : "40+ topics & trivia", current: false },
                { tierId: TIERS.ARENA, name: isHindi ? "⚡ GK टेस्ट इंजन" : "⚡ Mock Engine", desc: isHindi ? "कस्टम टाइमर और टेस्ट सेट" : "Custom mocks & timer", current: false },
              ].map((m, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    triggerTapSound("pop");
                    setIsModeModalOpen(false);
                    if (!m.current) {
                      setTier(m.tierId);
                      if (m.tierId === TIERS.STUDENTS) router.push("/school-study");
                      else if (m.tierId === TIERS.ARENA) router.push("/arena");
                      else if (m.tierId === TIERS.ADULTS) router.push("/");
                    }
                  }}
                  className={`w-full p-3 rounded-2xl text-left border-2 transition-all flex items-center justify-between cursor-pointer ${
                    m.current
                      ? "border-amber-400 bg-amber-50 text-amber-950 font-black"
                      : "border-slate-200 bg-white hover:bg-slate-50 text-slate-800"
                  }`}
                >
                  <div>
                    <p className="text-xs font-bold">{m.name}</p>
                    <p className="text-[10px] text-slate-500">{m.desc}</p>
                  </div>
                  {m.current && <CheckCircle2 className="w-4 h-4 text-amber-600" />}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL 2: STICKER ALBUM ================= */}
      {isStickerModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm p-5 space-y-4 shadow-2xl border-2 border-amber-300 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-amber-100 pb-2">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🎁</span>
                <div>
                  <h3 className="font-black text-sm text-slate-900">
                    {isHindi ? "मेरा स्टिकर एल्बम" : "My Sticker Album"}
                  </h3>
                  <p className="text-[10px] text-slate-500 font-bold">4/6 {isHindi ? "स्टिकर अनलॉक" : "Stickers Unlocked"}</p>
                </div>
              </div>
              <button
                onClick={() => setIsStickerModalOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Stickers Grid */}
            <div className="grid grid-cols-3 gap-2.5">
              {stickers.map((stk) => (
                <div
                  key={stk.id}
                  onClick={() => {
                    if (stk.unlocked) {
                      triggerTapSound("pop");
                      alert(`🌟 ${stk.name} (${stk.rarity})`);
                    }
                  }}
                  className={`rounded-2xl p-2.5 flex flex-col items-center justify-center text-center border-2 transition ${
                    stk.unlocked
                      ? "bg-amber-50/80 border-amber-200 cursor-pointer active:scale-95"
                      : "bg-slate-100 border-slate-200 opacity-60"
                  }`}
                >
                  <span className="text-3xl mb-1">{stk.unlocked ? stk.emoji : "🔒"}</span>
                  <span className="text-[10px] font-black text-slate-800 line-clamp-1">{stk.name}</span>
                  <span className="text-[8px] font-bold text-amber-700 mt-0.5">{stk.rarity}</span>
                </div>
              ))}
            </div>

            <div className="p-2.5 bg-amber-50 rounded-2xl border border-amber-200 text-center text-[11px] font-bold text-amber-900">
              ✨ {isHindi ? "हर 3 क्विज़ पूरे करने पर 1 नया सरप्राइज स्टिकर मिलता है!" : "Complete 3 daily quizzes to unlock a surprise sticker!"}
            </div>

            <button
              onClick={() => setIsStickerModalOpen(false)}
              className="w-full py-2.5 bg-amber-400 hover:bg-amber-500 text-amber-950 font-black text-xs rounded-xl border-b-2 border-amber-600 cursor-pointer"
            >
              {isHindi ? "शानदार! (बंद करें)" : "Awesome! (Close)"}
            </button>
          </div>
        </div>
      )}

      {/* ================= MODAL 3: TOPIC PLAY DIALOG ================= */}
      {selectedTopic && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm p-5 space-y-4 shadow-2xl border-2 border-amber-300 text-center animate-in zoom-in-95 duration-150">
            <div className="w-16 h-16 mx-auto rounded-3xl bg-amber-100 border-2 border-amber-300 flex items-center justify-center text-4xl shadow-sm">
              {selectedTopic.emoji}
            </div>

            <div>
              <span className="text-[10px] font-black bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                {selectedTopic.tag}
              </span>
              <h3 className="font-black text-base text-slate-900 mt-1">
                {selectedTopic.title}
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                {selectedTopic.subtitle}
              </p>
            </div>

            <div className="bg-amber-50 rounded-2xl p-3 border border-amber-200 text-xs text-amber-900 space-y-1">
              <div className="flex justify-between font-bold">
                <span>{isHindi ? "प्रश्नों की संख्या:" : "Questions:"}</span>
                <span>{isHindi ? "10 आसान सवाल" : "10 easy questions"}</span>
              </div>
              <div className="flex justify-between font-bold">
                <span>{isHindi ? "जीतने पर स्टार्स:" : "Reward:"}</span>
                <span className="text-emerald-700">+50 ⭐ {isHindi ? "स्टार्स" : "Stars"}</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setSelectedTopic(null)}
                className="flex-1 py-3 rounded-2xl border-2 border-slate-200 text-xs font-black text-slate-700 cursor-pointer"
              >
                {isHindi ? "बाद में" : "Later"}
              </button>
              <button
                onClick={() => handleLaunchTopicQuiz(selectedTopic)}
                className="flex-1 py-3 rounded-2xl bg-amber-400 hover:bg-amber-500 text-amber-950 font-black text-xs border-b-4 border-amber-600 shadow-md active:translate-y-1 active:border-b-0 cursor-pointer"
              >
                {isHindi ? "शुरू करें 🚀" : "Start 🚀"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL 4: ARCHIVE DATES ================= */}
      {isArchiveModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm p-5 space-y-3 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-black text-sm text-slate-900 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-amber-500" />
                <span>{isHindi ? "पुराने दैनिक क्विज़" : "Past Daily Quizzes"}</span>
              </h3>
              <button
                onClick={() => setIsArchiveModalOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1.5">
              {[
                { date: isHindi ? "कल (Yesterday)" : "Yesterday", score: "9/10 ⭐", status: isHindi ? "हल किया" : "Solved" },
                { date: "13 Oct 2026", score: "10/10 🌟", status: isHindi ? "पूर्ण" : "Completed" },
                { date: "12 Oct 2026", score: "8/10 ⭐", status: isHindi ? "हल किया" : "Solved" },
                { date: "11 Oct 2026", score: isHindi ? "अपूर्ण" : "Incomplete", status: isHindi ? "दोबारा खेलें" : "Play Again" },
              ].map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs font-bold">
                  <span>{item.date}</span>
                  <span className="text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">{item.score}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL 5: DIY QUIZ MAKER ================= */}
      {isDiyQuizOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm p-5 space-y-3 shadow-2xl text-center">
            <span className="text-4xl">🪄</span>
            <h3 className="font-black text-base text-slate-900">
              {isHindi ? "नन्हा क्विज़ मेकर" : "Little Quiz Maker"}
            </h3>
            <p className="text-xs text-slate-500">
              {isHindi
                ? "क्या आप अपने मम्मी-पापा या दोस्तों से 5 आसान पहेलियां पूछना चाहते हैं?"
                : "Want to create 5 fun riddles for your friends or family?"}
            </p>
            <div className="p-3 bg-purple-50 rounded-2xl border border-purple-200 text-xs text-purple-900 font-bold">
              🦁 {isHindi ? "जानवर, 🚀 अंतरिक्ष या 🧩 पहेलियां चुनकर अपना 5 प्रश्नों का सेट तैयार करें!" : "Pick animals, space, or riddles to build your 5-question quest!"}
            </div>
            <button
              onClick={() => {
                triggerTapSound("pop");
                setIsDiyQuizOpen(false);
                router.push("/category/nature-animals");
              }}
              className="w-full py-2.5 bg-purple-600 text-white font-black text-xs rounded-xl border-b-2 border-purple-800 cursor-pointer"
            >
              {isHindi ? "क्विज़ बनाएं और शुरू करें 🚀" : "Create Quest & Play 🚀"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
