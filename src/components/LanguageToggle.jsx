"use client";

import React from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';

export default function LanguageToggle() {
  const { language, toggleLanguage, isHindi, mounted } = useLanguage();

  if (!mounted) return null;

  return (
    <button
      onClick={toggleLanguage}
      className="relative flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-400 transition-all duration-300 group shadow-sm overflow-hidden"
      aria-label="Switch Language"
    >
      <div className="flex items-center gap-2 z-10">
        <span className={`text-[10px] font-black tracking-tighter ${!isHindi ? 'text-indigo-600' : 'text-slate-400'}`}>EN</span>
        <div className="w-[1px] h-3 bg-slate-300 dark:bg-slate-600" />
        <span className={`text-[11px] font-bold ${isHindi ? 'text-indigo-600' : 'text-slate-400'}`}>हि</span>
      </div>
      
      {/* Moving Background Glow */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 opacity-0 group-hover:opacity-100 transition-opacity"
        layoutId="toggleGlow"
      />
      
      {/* Active Indicator */}
      <motion.div
        className="absolute w-1/2 h-full bg-white dark:bg-slate-700 rounded-full shadow-sm border border-slate-200 dark:border-slate-600"
        initial={false}
        animate={{ x: isHindi ? '85%' : '-5%' }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        style={{ left: 0, zIndex: 0 }}
      />
    </button>
  );
}
