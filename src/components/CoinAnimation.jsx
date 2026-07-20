"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Coins } from "lucide-react";

export default function CoinAnimation({ show, amount, isPro }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, scale: 0.5, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 1.5, y: -50 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[1000] pointer-events-none"
        >
          <div className={`flex items-center gap-3 px-8 py-4 rounded-2xl font-black text-2xl shadow-2xl ${
            isPro 
              ? "bg-gradient-to-r from-amber-400 to-orange-500 text-white" 
              : "bg-gradient-to-r from-emerald-400 to-green-500 text-white"
          }`}>
            <Coins size={32} className={isPro ? "text-amber-200" : "text-emerald-200"} />
            <span>+{amount}</span>
            <span className="text-sm font-bold opacity-80">coins</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
