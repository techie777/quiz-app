"use client";

import React, { useState, useMemo } from "react";
import { Volume2, VolumeX, Sparkles, BookOpen, Award } from "lucide-react";
import { MascotProfile, getMascotForCategory, speakWithMascot, stopMascotSpeech } from "@/config/mascots";
import MascotAvatar from "./MascotAvatar";

export interface CategoryMascotHeaderProps {
  category: any;
  tier?: string;
  isHindi?: boolean;
}

export default function CategoryMascotHeader({
  category,
  tier,
  isHindi = true,
}: CategoryMascotHeaderProps) {
  const [isSpeaking, setIsSpeaking] = useState(false);

  const mascot: MascotProfile = useMemo(() => {
    return getMascotForCategory(category, tier);
  }, [category, tier]);

  const idleLine = useMemo(() => {
    return mascot.dialogues.idle;
  }, [mascot]);

  const handleSpeakToggle = () => {
    if (isSpeaking) {
      stopMascotSpeech();
      setIsSpeaking(false);
    } else {
      setIsSpeaking(true);
      speakWithMascot(
        `नमस्ते! मैं हूँ ${mascot.nameHi || mascot.name}। ${idleLine}`,
        mascot.ttsRate,
        mascot.ttsPitch,
        () => setIsSpeaking(true),
        () => setIsSpeaking(false)
      );
    }
  };

  if (!category) return null;

  return (
    <div className="w-full mb-8 rounded-3xl bg-gradient-to-br from-white via-indigo-50/40 to-white dark:from-slate-900 dark:via-slate-800/60 dark:to-slate-900 border border-slate-200/90 dark:border-slate-800 p-4 sm:p-6 shadow-sm overflow-hidden relative">
      {/* Background themed accent glow */}
      <div
        className="absolute -top-12 -right-12 w-48 h-48 rounded-full blur-3xl opacity-20 pointer-events-none"
        style={{ backgroundColor: mascot.color }}
      />

      <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start justify-between gap-5">
        {/* Left: Mascot Avatar + Speech Bubble */}
        <div className="flex items-center gap-4">
          <div className="shrink-0 relative">
            <MascotAvatar
              characterId={mascot.id}
              mood={isSpeaking ? "clapping" : "idle"}
              size="lg"
              isSpeaking={isSpeaking}
              allowAudioClick={true}
              onClick={handleSpeakToggle}
            />
          </div>

          <div className="flex-1">
            {/* Host Identity Tag */}
            <div className="flex items-center gap-2 mb-1">
              <span
                className="px-2.5 py-0.5 rounded-full text-xs font-black"
                style={{
                  backgroundColor: mascot.badgeBg,
                  color: mascot.color,
                }}
              >
                {isHindi ? `विषय गाइड • ${mascot.nameHi}` : `Host • ${mascot.name}`}
              </span>
              <span className="text-[11px] font-bold text-slate-400">
                {mascot.tagline}
              </span>
            </div>

            {/* Mascot Motivational Dialogue Speech Bubble */}
            <div className="relative bg-white/90 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl p-3 sm:p-3.5 shadow-sm inline-block">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs sm:text-sm font-semibold leading-relaxed text-slate-800 dark:text-slate-100 m-0">
                  &ldquo;{idleLine}&rdquo;
                </p>

                {/* Speaker button */}
                <button
                  type="button"
                  onClick={handleSpeakToggle}
                  className={`p-1.5 rounded-full transition-all shrink-0 ${
                    isSpeaking
                      ? "bg-rose-500 text-white animate-pulse"
                      : "bg-slate-100 dark:bg-slate-700 hover:bg-indigo-100 text-indigo-600 dark:text-indigo-400"
                  }`}
                  title={isSpeaking ? "आवाज़ रोकें" : "गुरूजी की आवाज़ सुनें (TTS)"}
                >
                  {isSpeaking ? <VolumeX size={15} /> : <Volume2 size={15} />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right / Stats summary chip */}
        <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-2 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-200/60 dark:border-slate-800">
          <div className="flex items-center gap-1.5 text-xs font-black text-slate-700 dark:text-slate-300">
            <Award size={15} className="text-amber-500" />
            <span>{category.topic}</span>
          </div>
          <span className="text-[11px] font-bold text-slate-400">
            {isHindi ? "सेट चुनकर अभ्यास शुरू करें" : "Select a set to begin"}
          </span>
        </div>
      </div>
    </div>
  );
}
