"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Zap, Play, Volume2, VolumeX, Flame, Timer, Award } from "lucide-react";
import { MASCOTS, speakWithMascot, stopMascotSpeech } from "@/config/mascots";
import MascotAvatar from "./MascotAvatar";

export interface CoachVikramDailyCardProps {
  isHindi?: boolean;
}

export default function CoachVikramDailyCard({ isHindi = true }: CoachVikramDailyCardProps) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const mascot = MASCOTS["coach-vikram"];

  const handleAudioToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isSpeaking) {
      stopMascotSpeech();
      setIsSpeaking(false);
    } else {
      setIsSpeaking(true);
      speakWithMascot(
        `अरे चैंपियंस! मैं हूँ कोच विक्रम। ${mascot.dialogues.idle}`,
        mascot.ttsRate,
        mascot.ttsPitch,
        () => setIsSpeaking(true),
        () => setIsSpeaking(false)
      );
    }
  };

  return (
    <div className="w-full mb-8 rounded-3xl bg-gradient-to-r from-orange-500 via-amber-500 to-rose-500 p-1 shadow-xl shadow-orange-500/20 group">
      <div className="rounded-[22px] bg-white dark:bg-slate-900 p-5 sm:p-6 flex flex-col md:flex-row items-center justify-between gap-5 relative overflow-hidden">
        {/* Dynamic decorative background elements */}
        <div className="absolute -top-10 -right-10 w-36 h-36 rounded-full bg-orange-400/10 blur-2xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-36 h-36 rounded-full bg-amber-400/10 blur-2xl pointer-events-none" />

        {/* Left Side: Coach Vikram Avatar with Whistle & Stopwatch */}
        <div className="flex items-center gap-4.5 w-full md:w-auto">
          <div className="shrink-0 relative">
            <MascotAvatar
              characterId="coach-vikram"
              mood={isSpeaking ? "clapping" : "idle"}
              size="lg"
              isSpeaking={isSpeaking}
              allowAudioClick={true}
              onClick={() => {}}
            />
          </div>

          <div className="flex-1">
            {/* Tag Badge */}
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-orange-100 dark:bg-orange-950/80 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-800 flex items-center gap-1">
                <Flame size={12} className="animate-bounce" />
                <span>{isHindi ? "दैनिक क्विज़ • लाइव" : "Daily Quiz • Live"}</span>
              </span>

              <span className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <Timer size={12} className="text-orange-500" />
                <span>{isHindi ? "स्पीड टेस्ट" : "Speed Challenge"}</span>
              </span>
            </div>

            {/* Title */}
            <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white leading-tight">
              {isHindi ? "आज का दैनिक क्विज़ चैलेंज" : "Today's Daily Speed Quiz"}
            </h3>

            {/* Coach Speech Quote */}
            <div className="mt-2 relative bg-orange-50/70 dark:bg-slate-800/80 border border-orange-100 dark:border-orange-900/40 rounded-2xl px-3.5 py-2 flex items-center justify-between gap-3">
              <p className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 m-0">
                &ldquo;{mascot.dialogues.idle}&rdquo;
              </p>

              {/* TTS Listen Button */}
              <button
                type="button"
                onClick={handleAudioToggle}
                className={`p-1.5 rounded-full transition-all shrink-0 ${
                  isSpeaking
                    ? "bg-rose-500 text-white animate-pulse"
                    : "bg-white dark:bg-slate-700 hover:bg-orange-100 text-orange-600 dark:text-orange-400 shadow-sm"
                }`}
                title={isSpeaking ? "आवाज़ रोकें" : "कोच की आवाज़ सुनें"}
              >
                {isSpeaking ? <VolumeX size={15} /> : <Volume2 size={15} />}
              </button>
            </div>
          </div>
        </div>

        {/* Right Side: Quick Play Action CTA */}
        <div className="flex sm:flex-col items-center sm:items-end justify-between w-full md:w-auto gap-3 shrink-0">
          <div className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-slate-400">
            <Award size={14} className="text-amber-500" />
            <span>{isHindi ? "+50 XP और स्ट्रीक बोनस" : "+50 XP & Streak Bonus"}</span>
          </div>

          <Link
            href="/quizzes"
            className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 active:scale-95 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-orange-500/25 transition-all text-center"
          >
            <Play size={16} fill="currentColor" />
            <span>{isHindi ? "दैनिक क्विज़ शुरू करें" : "Start Daily Quiz"}</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
