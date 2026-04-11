"use client";

import React, { useState, useEffect } from "react";
import { X, Zap, Heart, Sparkles, Clock, ShieldCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

/**
 * AdGate Component
 * Mandates a 5-second wait for non-pro users.
 * @param {boolean} isOpen - Controls visibility
 * @param {function} onClose - Called when user cancels
 * @param {function} onComplete - Called when ad finish/pro skip is used
 * @param {string} title - Optional title (e.g. "Unlocking Lifeline")
 */
export default function AdGate({ isOpen, onClose, onComplete, title = "Unlocking Premimum Content" }) {
  const [timeLeft, setTimeLeft] = useState(5);
  const [canSkip, setCanSkip] = useState(false);

  useEffect(() => {
    let timer;
    if (isOpen && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setCanSkip(true);
    }
    return () => clearInterval(timer);
  }, [isOpen, timeLeft]);

  // Reset timer on re-open
  useEffect(() => {
    if (isOpen) {
      setTimeLeft(5);
      setCanSkip(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-slate-900/40 backdrop-blur-xl"
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="relative bg-white w-full max-w-md rounded-[40px] shadow-2xl overflow-hidden text-center p-8"
        >
          {/* Top accent */}
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-orange-400 to-rose-500" />
          
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-100 transition"
          >
            <X size={20} className="text-slate-400" />
          </button>

          <div className="w-20 h-20 bg-orange-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <Zap className="text-orange-500 animate-pulse" size={40} />
          </div>

          <h3 className="text-2xl font-black text-slate-900 mb-2">{title}</h3>
          <p className="text-slate-500 text-sm mb-8 leading-relaxed">
            Support our mission to keep high-quality learning free for millions. Watch this short update to continue.
          </p>

          {/* Ad Simulation Slot */}
          <div className="bg-slate-50 rounded-3xl p-6 mb-8 border-2 border-dashed border-slate-200 aspect-video flex flex-col items-center justify-center">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Advertisement Simulation</div>
            <div className="flex items-center gap-4">
              <Sparkles className="text-orange-300" />
              <div className="text-xl font-black text-slate-300">Google AdSense</div>
              <Sparkles className="text-orange-300" />
            </div>
          </div>

          <div className="space-y-4">
            {!canSkip ? (
              <div className="w-full py-4 bg-slate-100 text-slate-500 rounded-2xl font-bold flex items-center justify-center gap-2">
                <Clock size={18} /> Continue in {timeLeft}s...
              </div>
            ) : (
              <button 
                onClick={onComplete}
                className="w-full py-4 bg-emerald-500 text-white rounded-2xl font-bold hover:bg-emerald-600 transition shadow-lg shadow-emerald-100"
              >
                Claim & Continue
              </button>
            )}

            <Link
              href="/pro"
              onClick={onClose}
              className="flex items-center justify-center gap-2 text-sm font-bold text-rose-500 hover:text-rose-600 transition pt-2 group"
            >
              <Heart size={14} fill="currentColor" className="group-hover:scale-125 transition-transform" /> 
              Skip all ads forever with Pro
            </Link>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-center gap-6 text-[10px] font-black uppercase tracking-widest text-slate-300">
             <div className="flex items-center gap-1"><ShieldCheck size={12} /> Secure</div>
             <div className="flex items-center gap-1"><Zap size={12} /> Instant Unlock</div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
