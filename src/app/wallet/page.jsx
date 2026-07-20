"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Coins, Wallet, TrendingUp, History, Gift, Calendar, Check, Crown, Sparkles, ArrowRight } from "lucide-react";
import Link from "next/link";
import styles from "@/styles/Wallet.module.css";

export default function WalletPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [walletData, setWalletData] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [dailyStreak, setDailyStreak] = useState(null);
  const [canClaim, setCanClaim] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [loading, setLoading] = useState(true);

  const COIN_TO_RUPEE = 0.01; // 1000 coins = ₹10

  useEffect(() => {
    if (status === "unauthenticated") router.push("/");
    if (status === "authenticated") {
      fetchWalletData();
    }
  }, [status, router]);

  const fetchWalletData = async () => {
    try {
      const [walletRes, txRes, streakRes] = await Promise.all([
        fetch("/api/wallet"),
        fetch("/api/wallet/transactions"),
        fetch("/api/wallet/streak")
      ]);

      const wallet = await walletRes.json();
      const tx = await txRes.json();
      const streak = await streakRes.json();

      setWalletData(wallet);
      setTransactions(tx.transactions || []);
      setDailyStreak(streak);

      // Check if can claim today (no claim in last 24 hours)
      if (streak.lastClaimAt) {
        const lastClaim = new Date(streak.lastClaimAt);
        const now = new Date();
        const hoursSinceClaim = (now - lastClaim) / (1000 * 60 * 60);
        setCanClaim(hoursSinceClaim >= 24);
      } else {
        setCanClaim(true);
      }
    } catch (error) {
      console.error("Failed to fetch wallet data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleClaimDaily = async () => {
    if (!canClaim || claiming) return;
    setClaiming(true);

    try {
      const res = await fetch("/api/wallet/claim", { method: "POST" });
      const data = await res.json();

      if (res.ok) {
        setWalletData(data.wallet);
        setDailyStreak(data.streak);
        setTransactions([data.transaction, ...transactions]);
        setCanClaim(false);
      } else {
        alert(data.error || "Failed to claim daily reward");
      }
    } catch (error) {
      alert("Connection error. Please try again.");
    } finally {
      setClaiming(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-400">Loading wallet...</div>
      </div>
    );
  }

  const rupeeValue = (walletData?.coinBalance || 0) * COIN_TO_RUPEE;
  const vouchers = [
    { id: 1, name: "Amazon Pay Voucher", amount: 50, coins: 5000, icon: "🛒" },
    { id: 2, name: "Amazon Pay Voucher", amount: 100, coins: 10000, icon: "🛒" },
    { id: 3, name: "Flipkart Voucher", amount: 50, coins: 5000, icon: "📦" },
    { id: 4, name: "Flipkart Voucher", amount: 100, coins: 10000, icon: "📦" },
  ];

  return (
    <main className="min-h-screen bg-slate-50 py-12 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-black text-slate-900 mb-2 flex items-center gap-3">
            <Wallet className="text-indigo-600" size={40} />
            My Wallet
          </h1>
          <p className="text-slate-500 font-medium">Earn coins, redeem rewards, and track your progress</p>
        </div>

        {/* Balance Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-[2.5rem] p-8 text-white shadow-2xl mb-8 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-4">
              <Coins className="text-amber-300" size={24} />
              <span className="text-sm font-bold uppercase tracking-widest text-indigo-200">Coin Balance</span>
            </div>
            
            <div className="flex items-end gap-4 mb-6">
              <span className="text-6xl font-black">{walletData?.coinBalance || 0}</span>
              <span className="text-2xl font-bold text-indigo-200 mb-2">coins</span>
            </div>

            <div className="flex items-center gap-6">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl px-6 py-4">
                <div className="text-xs font-bold uppercase tracking-widest text-indigo-200 mb-1">Value</div>
                <div className="text-2xl font-black">₹{rupeeValue.toFixed(2)}</div>
              </div>
              
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl px-6 py-4">
                <div className="text-xs font-bold uppercase tracking-widest text-indigo-200 mb-1">Total Earned</div>
                <div className="text-2xl font-black">{walletData?.totalCoinsEarned || 0}</div>
              </div>

              {session?.user?.isPro && (
                <div className="bg-amber-400/20 backdrop-blur-sm rounded-2xl px-6 py-4 border border-amber-400/30">
                  <div className="flex items-center gap-2">
                    <Crown className="text-amber-300" size={20} />
                    <span className="text-sm font-bold uppercase tracking-widest text-amber-200">4x Multiplier Active</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Daily Streak */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-1"
          >
            <div className="bg-white rounded-[2rem] p-6 shadow-lg border border-slate-100 h-full">
              <div className="flex items-center gap-3 mb-6">
                <Calendar className="text-indigo-600" size={24} />
                <h2 className="text-xl font-black text-slate-900">Daily Streak</h2>
              </div>

              <div className="text-center mb-6">
                <div className="text-6xl font-black text-indigo-600 mb-2">{dailyStreak?.streakCount || 0}</div>
                <div className="text-sm font-bold text-slate-400 uppercase tracking-widest">Consecutive Days</div>
              </div>

              <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-6 mb-6 border border-amber-200">
                <div className="flex items-center justify-center gap-2 mb-3">
                  <Sparkles className="text-amber-500" size={20} />
                  <span className="text-sm font-bold text-amber-700 uppercase tracking-widest">Daily Reward</span>
                </div>
                <div className="text-4xl font-black text-amber-600 text-center">+50 Coins</div>
              </div>

              <button
                onClick={handleClaimDaily}
                disabled={!canClaim || claiming}
                className={`w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all ${
                  canClaim
                    ? "bg-indigo-600 text-white hover:bg-indigo-700 hover:scale-[1.02] active:scale-[0.98] shadow-xl shadow-indigo-200"
                    : "bg-slate-100 text-slate-400 cursor-not-allowed"
                }`}
              >
                {claiming ? "Claiming..." : canClaim ? "Claim Daily Reward" : "Already Claimed Today"}
              </button>

              {!canClaim && dailyStreak?.lastClaimAt && (
                <div className="text-center mt-4 text-xs font-bold text-slate-400">
                  Next claim available in {Math.max(0, 24 - (new Date() - new Date(dailyStreak.lastClaimAt)) / (1000 * 60 * 60)).toFixed(1)} hours
                </div>
              )}
            </div>
          </motion.div>

          {/* Transaction History */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-2"
          >
            <div className="bg-white rounded-[2rem] p-6 shadow-lg border border-slate-100 h-full">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <History className="text-indigo-600" size={24} />
                  <h2 className="text-xl font-black text-slate-900">Transaction History</h2>
                </div>
                <Link href="/wallet/transactions" className="text-sm font-bold text-indigo-600 hover:text-indigo-700">
                  View All
                </Link>
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto">
                {transactions.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 font-medium">
                    No transactions yet. Start earning coins!
                  </div>
                ) : (
                  transactions.slice(0, 10).map((tx) => (
                    <div key={tx.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                          tx.amount > 0 ? "bg-emerald-100" : "bg-rose-100"
                        }`}>
                          {tx.type === "CORRECT_ANSWER" && <Check className={tx.amount > 0 ? "text-emerald-600" : "text-rose-600"} size={20} />}
                          {tx.type === "DAILY_LOGIN" && <Calendar className={tx.amount > 0 ? "text-emerald-600" : "text-rose-600"} size={20} />}
                          {tx.type === "REDEMPTION" && <Gift className={tx.amount > 0 ? "text-emerald-600" : "text-rose-600"} size={20} />}
                          {tx.type === "BONUS" && <Sparkles className={tx.amount > 0 ? "text-emerald-600" : "text-rose-600"} size={20} />}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900">{tx.description || tx.type}</div>
                          <div className="text-xs text-slate-400">
                            {new Date(tx.createdAt).toLocaleDateString()} at {new Date(tx.createdAt).toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                      <div className={`font-black text-lg ${tx.amount > 0 ? "text-emerald-600" : "text-rose-600"}`}>
                        {tx.amount > 0 ? "+" : ""}{tx.amount}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Rewards Marketplace */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-8"
        >
          <div className="flex items-center gap-3 mb-6">
            <Gift className="text-indigo-600" size={28} />
            <h2 className="text-2xl font-black text-slate-900">Rewards Marketplace</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {vouchers.map((voucher) => {
              const progress = Math.min(100, ((walletData?.coinBalance || 0) / voucher.coins) * 100);
              const canRedeem = (walletData?.coinBalance || 0) >= voucher.coins;

              return (
                <div key={voucher.id} className="bg-white rounded-[2rem] p-6 shadow-lg border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all">
                  <div className="text-5xl mb-4 text-center">{voucher.icon}</div>
                  <h3 className="font-black text-slate-900 text-center mb-1">{voucher.name}</h3>
                  <div className="text-3xl font-black text-indigo-600 text-center mb-4">₹{voucher.amount}</div>

                  <div className="mb-4">
                    <div className="flex justify-between text-xs font-bold text-slate-400 mb-2">
                      <span>Progress</span>
                      <span>{progress.toFixed(0)}%</span>
                    </div>
                    <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  <div className="text-center mb-4">
                    <span className="text-sm font-bold text-slate-400">Requires </span>
                    <span className="text-lg font-black text-slate-900">{voucher.coins}</span>
                    <span className="text-sm font-bold text-slate-400"> coins</span>
                  </div>

                  <button
                    disabled={!canRedeem}
                    className={`w-full py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${
                      canRedeem
                        ? "bg-indigo-600 text-white hover:bg-indigo-700"
                        : "bg-slate-100 text-slate-400 cursor-not-allowed"
                    }`}
                  >
                    {canRedeem ? "Redeem Now" : "Keep Earning"}
                  </button>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Pro Upgrade CTA */}
        {!session?.user?.isPro && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-8 bg-gradient-to-r from-slate-900 to-slate-800 rounded-[2rem] p-8 text-white relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Crown className="text-amber-400" size={24} />
                  <span className="text-sm font-bold uppercase tracking-widest text-amber-400">Upgrade to Pro</span>
                </div>
                <h3 className="text-2xl font-black mb-2">Earn 4x Coins on Every Correct Answer</h3>
                <p className="text-slate-400 font-medium">Get ₹11/month access to Pro features and accelerate your coin earnings</p>
              </div>
              
              <Link
                href="/pro"
                className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-indigo-700 transition flex items-center gap-2 shadow-xl shadow-indigo-950/50"
              >
                Upgrade Now <ArrowRight size={18} />
              </Link>
            </div>
          </motion.div>
        )}
      </div>
    </main>
  );
}
