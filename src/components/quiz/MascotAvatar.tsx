"use client";

import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { Volume2, VolumeX, Sparkles } from 'lucide-react';
import { MASCOTS, CharacterMood, MascotProfile, speakWithMascot, stopMascotSpeech } from '@/config/mascots';

import MascotPlayer, { MascotState, normalizeCharacterId } from './MascotPlayer';

export interface MascotAvatarProps {
  characterId?: string;
  mood?: CharacterMood;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showSpeechBubble?: boolean;
  speechText?: string;
  isSpeaking?: boolean;
  onClick?: () => void;
  className?: string;
  showNameTag?: boolean;
  interactive?: boolean;
  allowAudioClick?: boolean;
  language?: 'hi' | 'en';
}

const SIZE_CONFIGS = {
  xs: { px: 36, imgSize: 36, containerClass: 'w-9 h-9', bubbleText: 'text-[10px]' },
  sm: { px: 52, imgSize: 52, containerClass: 'w-13 h-13', bubbleText: 'text-xs' },
  md: { px: 72, imgSize: 72, containerClass: 'w-18 h-18', bubbleText: 'text-xs sm:text-sm' },
  lg: { px: 120, imgSize: 120, containerClass: 'w-28 h-28 sm:w-32 sm:h-32', bubbleText: 'text-sm' },
  xl: { px: 160, imgSize: 160, containerClass: 'w-36 h-36 sm:w-40 sm:h-40', bubbleText: 'text-sm sm:text-base' },
};

export default function MascotAvatar({
  characterId = 'sharma-sir',
  mood = 'idle',
  size = 'md',
  showSpeechBubble = false,
  speechText,
  isSpeaking: externalIsSpeaking,
  onClick,
  className = '',
  showNameTag = false,
  interactive = true,
  allowAudioClick = false,
  language = 'hi',
}: MascotAvatarProps) {
  const mascot: MascotProfile = useMemo(() => {
    return MASCOTS[characterId] || MASCOTS['sharma-sir'];
  }, [characterId]);

  const activeMood: CharacterMood = mood || 'idle';
  const [internalSpeaking, setInternalSpeaking] = useState(false);
  const isSpeaking = externalIsSpeaking !== undefined ? externalIsSpeaking : internalSpeaking;

  const sizeCfg = SIZE_CONFIGS[size] || SIZE_CONFIGS.md;
  const dialogueText = speechText || mascot.dialogues[activeMood] || mascot.dialogues.idle;

  const mappedState: MascotState = useMemo(() => {
    if (isSpeaking) return 'talking';
    if (activeMood === 'clapping') return 'correct';
    if (activeMood === 'disappointed') return 'wrong';
    if (activeMood === 'celebrating') return 'celebrate';
    if (activeMood === 'thinking') return 'thinking';
    return 'idle';
  }, [isSpeaking, activeMood]);

  const handleAudioToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isSpeaking) {
      stopMascotSpeech();
      setInternalSpeaking(false);
    } else {
      setInternalSpeaking(true);
      speakWithMascot(
        dialogueText,
        mascot.ttsRate,
        mascot.ttsPitch,
        () => setInternalSpeaking(true),
        () => setInternalSpeaking(false),
        language === 'hi' ? 'hi-IN' : 'en-IN'
      );
    }
  };

  const handleAvatarClick = () => {
    if (allowAudioClick) {
      if (isSpeaking) {
        stopMascotSpeech();
        setInternalSpeaking(false);
      } else {
        setInternalSpeaking(true);
        speakWithMascot(
          dialogueText,
          mascot.ttsRate,
          mascot.ttsPitch,
          () => setInternalSpeaking(true),
          () => setInternalSpeaking(false),
          language === 'hi' ? 'hi-IN' : 'en-IN'
        );
      }
    }
    if (onClick) onClick();
  };

  return (
    <div className={`relative inline-flex items-center gap-3 ${className}`}>
      {/* Avatar Graphic Container powered by MascotPlayer */}
      <div
        onClick={handleAvatarClick}
        style={{
          width: sizeCfg.px,
          height: sizeCfg.px,
        }}
        className={`relative shrink-0 flex items-end justify-center rounded-2xl select-none transition-all duration-300 ${
          interactive ? 'cursor-pointer hover:scale-105 active:scale-95' : ''
        }`}
        title={`${mascot.name} (${activeMood})`}
      >
        <MascotPlayer
          characterId={characterId}
          state={mappedState}
          size={sizeCfg.px}
          isMuted={true}
          allowAudioClick={false}
          language={language}
        />

        {/* Audio Wave Indicator when speaking */}
        {isSpeaking && (
          <div className="absolute -bottom-1 -right-1 z-20 flex items-center gap-0.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-1.5 py-0.5 rounded-full shadow-md animate-bounce">
            <span className="w-1 h-2.5 bg-indigo-500 rounded-full animate-pulse" />
            <span className="w-1 h-3.5 bg-indigo-600 rounded-full animate-pulse delay-75" />
            <span className="w-1 h-2 bg-indigo-500 rounded-full animate-pulse delay-150" />
          </div>
        )}
      </div>

      {/* Optional Speech Bubble with tail */}
      {showSpeechBubble && dialogueText && (
        <div className="relative z-20 max-w-xs sm:max-w-sm">
          {/* Speech Bubble Container */}
          <div className="relative bg-white/95 dark:bg-slate-800/95 backdrop-blur-md border border-slate-200/90 dark:border-slate-700/80 rounded-2xl px-3.5 py-2 sm:px-4 sm:py-2.5 shadow-lg shadow-slate-900/5 text-slate-800 dark:text-slate-100 animate-in fade-in slide-in-from-left-2 duration-200">
            {/* Triangular Tail pointing to avatar */}
            <div
              className="absolute -left-2 top-1/2 -translate-y-1/2 w-0 h-0 border-y-6 border-y-transparent border-r-8 border-r-white dark:border-r-slate-800 filter drop-shadow-[-1px_0_1px_rgba(0,0,0,0.05)]"
            />

            {/* Bubble Header: Name & Subject Tag */}
            <div className="flex items-center justify-between gap-2 mb-1">
              <span
                className="text-[11px] font-black uppercase tracking-wider"
                style={{ color: mascot.color }}
              >
                {mascot.nameHi || mascot.name}
              </span>

              {allowAudioClick && (
                <button
                  type="button"
                  onClick={handleAudioToggle}
                  className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-300 transition-colors"
                  title={isSpeaking ? 'बोलना रोकें' : 'सुनें'}
                >
                  {isSpeaking ? (
                    <VolumeX size={13} className="text-red-500 animate-pulse" />
                  ) : (
                    <Volume2 size={13} className="text-indigo-600 dark:text-indigo-400" />
                  )}
                </button>
              )}
            </div>

            {/* Dialogue text */}
            <p className={`${sizeCfg.bubbleText} font-semibold leading-snug m-0 text-slate-700 dark:text-slate-200`}>
              {dialogueText}
            </p>
          </div>
        </div>
      )}

      {/* Name Tag beneath avatar if requested */}
      {showNameTag && !showSpeechBubble && (
        <div className="flex flex-col">
          <span className="text-xs font-black text-slate-900 dark:text-white leading-tight">
            {mascot.nameHi || mascot.name}
          </span>
          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
            {mascot.subject}
          </span>
        </div>
      )}
    </div>
  );
}
