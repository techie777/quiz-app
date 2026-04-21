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
          className="relative bg-white w-full max-w-sm rounded-[32px] shadow-2xl overflow-hidden text-center p-6"
        >
          {/* Top accent */}
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-orange-400 to-rose-500" />
          
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 transition text-slate-400 hover:text-rose-500"
            title="Close"
          >
            <X size={18} strokeWidth={3} />
          </button>

          <div className="w-16 h-16 bg-orange-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Zap className="text-orange-500 animate-pulse" size={32} />
          </div>

          <h3 className="text-xl font-black text-slate-900 mb-1">{title}</h3>
          <p className="text-slate-500 text-[12px] mb-6 px-4 leading-normal">
            Support us to keep learning free for everyone. Watch this short update to continue.
          </p>

          {/* Ad Simulation Slot */}
          <div className="bg-slate-50 rounded-2xl p-4 mb-6 border-2 border-dashed border-slate-200 flex flex-col items-center justify-center">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Ad Simulation</div>
            <div className="flex items-center gap-3">
              <Sparkles className="text-orange-300" size={16} />
              <div className="text-lg font-black text-slate-300">Google Ads</div>
              <Sparkles className="text-orange-300" size={16} />
            </div>
          </div>

          <div className="space-y-3">
            {!canSkip ? (
              <div className="w-full py-3 bg-slate-50 text-slate-400 rounded-xl font-bold text-sm flex items-center justify-center gap-2">
                <Clock size={16} /> Continue in {timeLeft}s...
              </div>
            ) : (
              <button 
                onClick={onComplete}
                className="w-full py-3.5 bg-emerald-500 text-white rounded-xl font-black text-sm hover:bg-emerald-600 transition shadow-lg shadow-emerald-100 active:scale-95"
              >
                Claim & Continue
              </button>
            )}

            <Link
              href="/pro"
              onClick={onClose}
              className="flex items-center justify-center gap-2 text-[12px] font-bold text-rose-500 hover:text-rose-600 transition pt-1 group"
            >
              <Heart size={12} fill="currentColor" /> 
              Skip with Pro
            </Link>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-50 flex items-center justify-center gap-4 text-[9px] font-black uppercase tracking-widest text-slate-200">
             <div className="flex items-center gap-1"><ShieldCheck size={10} /> Secure</div>
             <div className="flex items-center gap-1"><Zap size={10} /> Instant</div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
