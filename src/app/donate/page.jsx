"use client";

import React, { useState } from "react";
import { Heart, Sparkles, ShieldCheck, Zap, Coffee, Gift, Trophy, ArrowRight, X } from "lucide-react";
import styles from "@/styles/Donation.module.css";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useSession } from "next-auth/react";
import { useMonetization } from "@/context/MonetizationContext";

export default function DonationPage() {
  const [showModal, setShowModal] = useState(false);
  const [selectedTier, setSelectedTier] = useState(null);
  const searchParams = useSearchParams();
  const router = useRouter();
  const action = searchParams.get("action");
  const targetId = searchParams.get("targetId");
  const { data: session } = useSession();
  const { refreshStatus } = useMonetization();
  const [isProcessing, setIsProcessing] = useState(false);

  const tiers = [
    { id: 'coffee', emoji: '☕', value: '$5', label: 'Cup of Coffee', desc: 'Sponsor a few hours of high-performance hosting.' },
    { id: 'book', emoji: '📚', value: '$25', label: 'Knowledge Pack', desc: 'Helps us add 100+ new verified quiz questions.' },
    { id: 'rocket', emoji: '🚀', value: '$50', label: 'Growth Catalyst', desc: 'Powers our new feature development for a week.' },
    { id: 'crown', emoji: '👑', value: '$150', label: 'Grand Patron', desc: 'Directly funds local community events and rewards.' }
  ];

  const handleDonate = async (tier) => {
    setSelectedTier(tier);
    setShowModal(true);

    // If this is a specific unlock action, process the mock payment
    if (action === "pro" || action === "mockpass") {
        if (!session) {
            toast.error("Please sign in to complete purchase");
            return;
        }

        setIsProcessing(true);
        try {
            const res = await fetch("/api/user/mock-purchase", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    type: action,
                    mockCategoryId: targetId
                })
            });

            if (res.ok) {
                toast.success("Payment Successful! Features unlocked.");
                refreshStatus(); // Refresh context
                setTimeout(() => {
                    router.back();
                }, 1500);
            } else {
                toast.error("Transaction failed");
            }
        } catch(err) {
            toast.error("Network error");
        } finally {
            setIsProcessing(false);
        }
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.hero}>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={styles.badge}
        >
          <Heart size={14} fill="currentColor" /> Support our Vision
        </motion.div>
        <h1 className={styles.title}>Keep Learning <br /> Free for Everyone</h1>
        <p className={styles.subtitle}>
          Your contribution helps us maintain server costs, verify content accuracy, and keep high-quality education accessible to millions.
        </p>
      </header>

      <main className={styles.contentRow}>
        <section className={styles.missionCard}>
          <span className={styles.missionIcon}>🌍</span>
          <h2 className={styles.missionTitle}>Our Mission</h2>
          <div className={styles.missionText}>
            <p className="mb-4 text-sm">
              QuizWeb was built on a simple idea: that knowledge shouldn&apos;t be behind a paywall. We provide professional-grade mock exams, career guidance, and daily learning tools for free.
            </p>
            <p className="mb-4 text-sm">
              However, maintaining a global platform at scale incurs significant infrastructure and content verification costs.
            </p>
            <div className="space-y-3 mt-6">
              <div className="flex items-center gap-3 text-sm font-bold text-slate-700">
                <ShieldCheck className="text-emerald-500" size={18} /> 100% Ad-Free Core Experience
              </div>
              <div className="flex items-center gap-3 text-sm font-bold text-slate-700">
                <ShieldCheck className="text-emerald-500" size={18} /> Expert-Verified Question Bank
              </div>
              <div className="flex items-center gap-3 text-sm font-bold text-slate-700">
                <ShieldCheck className="text-emerald-500" size={18} /> Multi-language Accessibility
              </div>
            </div>
          </div>
        </section>

        <section className={styles.tiersGrid}>
          {tiers.map((tier) => (
            <div key={tier.id} className={styles.tier} onClick={() => handleDonate(tier)}>
              <span className={styles.tierEmoji}>{tier.emoji}</span>
              <div className={styles.tierValue}>{tier.value}</div>
              <div className={styles.tierLabel}>{tier.label}</div>
              <div className={styles.tierAction}>Support Now</div>
            </div>
          ))}
          <div className={`${styles.tier} ${styles.customAmount}`} onClick={() => handleDonate({ label: "Custom Amount" })}>
            <div className={styles.tierLabel} style={{ marginBottom: 0 }}>Prefer a custom amount?</div>
          </div>
        </section>
      </main>

      <footer className={styles.footerNote}>
        <p>© 2026 QuizWeb International. Transforming digital education together.</p>
      </footer>

      {/* Placeholder Modal for Razorpay */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              onClick={() => setShowModal(false)}
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative bg-white rounded-[40px] shadow-2xl p-10 max-w-sm w-full text-center overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-orange-400 to-rose-400" />
              <button 
                onClick={() => setShowModal(false)}
                className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-100 transition"
              >
                <X size={20} />
              </button>
              
              <div className="w-20 h-20 bg-orange-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <Zap className="text-orange-500" size={40} />
              </div>
              
              <h3 className="text-2xl font-black text-slate-900 mb-2">
                {isProcessing ? "Processing..." : (action ? "Simulating Payment" : "Gateways Opening Soon!")}
              </h3>
              <p className="text-slate-500 text-sm leading-relaxed mb-8">
                {action 
                    ? "As our Razorpay account is pending, this dummy screen acts as your successful transaction. Unlocking features now..."
                    : "We are currently finalizing our **Razorpay Integration** to ensure your contributions are handled with maximum security."
                }
              </p>
              
              <div className="bg-slate-50 rounded-2xl p-4 text-xs font-bold text-slate-400 uppercase tracking-widest mb-8">
                Target: {action ? (action === "pro" ? "QuizWeb Pro Subscription - ₹11" : `Mock Exam Pass - ₹49`) : (selectedTier?.label || "Donation")}
              </div>

              {!action && (
                  <button 
                    onClick={() => setShowModal(false)}
                    className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition shadow-lg"
                  >
                    Got It, Thanks!
                  </button>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
