"use client";

import React, { useEffect, useState, useMemo } from "react";
import { Sparkles, Flame, Trophy } from "lucide-react";
import { MascotProfile, speakWithMascot, CharacterMood, getMascotForCategory } from "@/config/mascots";
import MascotAvatar from "./MascotAvatar";

export interface MascotStreakToastProps {
  streak: number;
  categoryOrSlug?: any;
  tier?: string;
  onDismiss?: () => void;
  soundEnabled?: boolean;
}

export default function MascotStreakToast({
  streak,
  categoryOrSlug,
  tier,
  onDismiss,
  soundEnabled = true,
}: MascotStreakToastProps) {
  const [visible, setVisible] = useState(true);

  const mascot: MascotProfile = useMemo(() => {
    return getMascotForCategory(categoryOrSlug, tier);
  }, [categoryOrSlug, tier]);

  const streakTitle = useMemo(() => {
    if (streak === 3) return "🔥 हैट्रिक! 3 सही उत्तर!";
    if (streak === 5) return "⚡ सुपर 5 स्ट्रीक! अद्भुत!";
    if (streak >= 10) return "👑 ऐतिहासिक 10 स्ट्रीक! चैंपियन!";
    return `🔥 लगातार ${streak} सही उत्तर!`;
  }, [streak]);

  const celebrationVoiceLine = useMemo(() => {
    return mascot.dialogues.celebrating;
  }, [mascot]);

  useEffect(() => {
    // Speak celebratory dialogue with mascot voice if sound enabled
    if (soundEnabled) {
      speakWithMascot(
        `${streakTitle}। ${celebrationVoiceLine}`,
        mascot.ttsRate,
        mascot.ttsPitch
      );
    }

    const timer = setTimeout(() => {
      setVisible(false);
      onDismiss?.();
    }, 3200);

    return () => clearTimeout(timer);
  }, [streak, soundEnabled, streakTitle, celebrationVoiceLine, mascot, onDismiss]);

  if (!visible) return null;

  return (
    <div
      onClick={() => {
        setVisible(false);
        onDismiss?.();
      }}
      className="fixed top-20 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm px-4 cursor-pointer animate-in fade-in zoom-in-95 duration-300"
    >
      <div className="relative rounded-3xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 p-1 shadow-2xl shadow-orange-500/30">
        <div className="rounded-[22px] bg-white dark:bg-slate-900 p-4 flex items-center gap-3.5 overflow-hidden relative">
          {/* Background sparkles */}
          <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full bg-amber-400/20 blur-xl pointer-events-none" />

          {/* Celebrating Mascot Avatar */}
          <div className="shrink-0 relative">
            <MascotAvatar
              characterId={mascot.id}
              mood="celebrating"
              size="md"
              interactive={false}
            />
          </div>

          {/* Text and Streak Pill */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-orange-100 dark:bg-orange-950 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-800 flex items-center gap-1">
                <Flame size={12} className="animate-bounce" />
                <span>Streak x{streak}</span>
              </span>
              <span className="text-[11px] font-extrabold text-slate-400">
                {mascot.nameHi || mascot.name}
              </span>
            </div>

            <h4 className="text-sm font-black text-slate-900 dark:text-white leading-tight truncate">
              {streakTitle}
            </h4>

            <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 mt-0.5 line-clamp-2 leading-snug">
              &ldquo;{celebrationVoiceLine}&rdquo;
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
