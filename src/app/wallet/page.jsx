"use client";

import { useState, useEffect } from "react";
import { useSession, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Coins,
  Wallet,
  TrendingUp,
  History,
  Gift,
  Calendar,
  Check,
  Crown,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Copy,
  ExternalLink,
  ShieldCheck,
  Award,
  Zap,
  BookOpen,
  X,
  AlertCircle,
  LogIn
} from "lucide-react";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";

const COIN_TO_RUPEE = 0.01; // 1000 coins = ₹10

const VOUCHERS = [
  { id: 1, name: "Amazon Pay Voucher", nameHi: "अमेज़न पे वाउचर", amount: 50, coins: 5000, icon: "🛒", brand: "amazon" },
  { id: 2, name: "Amazon Pay Voucher", nameHi: "अमेज़न पे वाउचर", amount: 100, coins: 10000, icon: "🛒", brand: "amazon" },
  { id: 3, name: "Flipkart Voucher", nameHi: "फ्लिपकार्ट वाउचर", amount: 50, coins: 5000, icon: "📦", brand: "flipkart" },
  { id: 4, name: "BookMyShow / Food Voucher", nameHi: "बुकमाईशो / फूड वाउचर", amount: 100, coins: 10000, icon: "🎬", brand: "entertainment" },
];

const INITIAL_GUEST_WALLET = {
  coinBalance: 350,
  totalCoinsEarned: 350,
  isPro: false,
  isGuest: true,
};

const INITIAL_GUEST_TRANSACTIONS = [
  {
    id: "tx-welcome",
    type: "BONUS",
    description: "Welcome Bonus for New Learner",
    descriptionHi: "नए शिक्षार्थी के लिए स्वागत बोनस",
    amount: 250,
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
  },
  {
    id: "tx-streak-init",
    type: "DAILY_LOGIN",
    description: "Day 1 Login Reward",
    descriptionHi: "प्रथम दिन लॉगिन पुरस्कार",
    amount: 100,
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
];

export default function WalletPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { isHindi } = useLanguage();

  const [walletData, setWalletData] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [dailyStreak, setDailyStreak] = useState(null);
  const [canClaim, setCanClaim] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [loading, setLoading] = useState(true);

  // Filter state for transaction history
  const [txFilter, setTxFilter] = useState("all"); // 'all' | 'earned' | 'redeemed'
  const [expandedTx, setExpandedTx] = useState(false);

  // Voucher redemption modal state
  const [selectedVoucher, setSelectedVoucher] = useState(null);
  const [redeeming, setRedeeming] = useState(false);
  const [redeemedCode, setRedeemedCode] = useState(null);
  const [copiedCode, setCopiedCode] = useState(false);

  // Notification Toast state
  const [toastMsg, setToastMsg] = useState(null);

  const showToast = (text, type = "success") => {
    setToastMsg({ text, type });
    setTimeout(() => setToastMsg(null), 3500);
  };

  useEffect(() => {
    if (status === "authenticated") {
      fetchServerWalletData();
    } else if (status === "unauthenticated") {
      loadGuestWalletData();
    }
  }, [status]);

  const loadGuestWalletData = () => {
    if (typeof window === "undefined") return;
    try {
      const savedWallet = localStorage.getItem("quizweb_guest_wallet");
      const savedTx = localStorage.getItem("quizweb_guest_transactions");
      const savedStreakDate = localStorage.getItem("quizweb_guest_streak_claimed");

      const parsedWallet = savedWallet ? JSON.parse(savedWallet) : INITIAL_GUEST_WALLET;
      const parsedTx = savedTx ? JSON.parse(savedTx) : INITIAL_GUEST_TRANSACTIONS;

      setWalletData(parsedWallet);
      setTransactions(parsedTx);

      // Streak check
      const streakCount = parseInt(localStorage.getItem("quizweb_daily_streak_v2") || "1", 10);
      setDailyStreak({
        streakCount: Math.max(1, streakCount),
        lastClaimAt: savedStreakDate || null,
      });

      if (savedStreakDate) {
        const lastClaim = new Date(savedStreakDate);
        const hours = (new Date() - lastClaim) / (1000 * 60 * 60);
        setCanClaim(hours >= 24);
      } else {
        setCanClaim(true);
      }
    } catch (e) {
      setWalletData(INITIAL_GUEST_WALLET);
      setTransactions(INITIAL_GUEST_TRANSACTIONS);
      setDailyStreak({ streakCount: 1, lastClaimAt: null });
      setCanClaim(true);
    } finally {
      setLoading(false);
    }
  };

  const fetchServerWalletData = async () => {
    try {
      const [walletRes, txRes, streakRes] = await Promise.all([
        fetch("/api/wallet"),
        fetch("/api/wallet/transactions"),
        fetch("/api/wallet/streak"),
      ]);

      if (walletRes.ok && txRes.ok && streakRes.ok) {
        const wallet = await walletRes.json();
        const tx = await txRes.json();
        const streak = await streakRes.json();

        setWalletData({ ...wallet, isGuest: false });
        setTransactions(tx.transactions || []);
        setDailyStreak(streak);

        if (streak.lastClaimAt) {
          const lastClaim = new Date(streak.lastClaimAt);
          const hoursSinceClaim = (new Date() - lastClaim) / (1000 * 60 * 60);
          setCanClaim(hoursSinceClaim >= 24);
        } else {
          setCanClaim(true);
        }
      } else {
        // Fallback to guest wallet if database route returns error
        loadGuestWalletData();
      }
    } catch (error) {
      console.warn("Server wallet unavailable, loading local state:", error);
      loadGuestWalletData();
    } finally {
      setLoading(false);
    }
  };

  const handleClaimDaily = async () => {
    if (!canClaim || claiming) return;
    setClaiming(true);

    try {
      if (status === "authenticated" && !walletData?.isGuest) {
        const res = await fetch("/api/wallet/claim", { method: "POST" });
        const data = await res.json();

        if (res.ok) {
          setWalletData({ ...data.wallet, isGuest: false });
          setDailyStreak(data.streak);
          setTransactions([data.transaction, ...transactions]);
          setCanClaim(false);
          showToast(isHindi ? "🎉 +50 सिक्के आपके वॉलेट में जोड़े गए!" : "🎉 +50 Coins claimed successfully!");

          if (typeof window !== "undefined") {
            window.dispatchEvent(
              new CustomEvent("coinBalanceUpdate", {
                detail: { coinBalance: data.wallet.coinBalance, coinsEarned: 50 },
              })
            );
          }
        } else {
          showToast(data.error || (isHindi ? "इनाम प्राप्त नहीं हो सका" : "Failed to claim reward"), "error");
        }
      } else {
        // Guest mode claim
        const bonusAmount = 50;
        const now = new Date();
        const newBalance = (walletData?.coinBalance || 0) + bonusAmount;
        const newTotal = (walletData?.totalCoinsEarned || 0) + bonusAmount;
        const newWallet = {
          ...walletData,
          coinBalance: newBalance,
          totalCoinsEarned: newTotal,
        };

        const newTx = {
          id: "tx-" + Date.now(),
          type: "DAILY_LOGIN",
          description: "Daily Streak Check-in",
          descriptionHi: "दैनिक उपस्थिति रिवॉर्ड",
          amount: bonusAmount,
          createdAt: now.toISOString(),
        };

        const updatedTxList = [newTx, ...transactions];

        setWalletData(newWallet);
        setTransactions(updatedTxList);
        setCanClaim(false);
        setDailyStreak((prev) => ({
          streakCount: (prev?.streakCount || 1) + 1,
          lastClaimAt: now.toISOString(),
        }));

        if (typeof window !== "undefined") {
          localStorage.setItem("quizweb_guest_wallet", JSON.stringify(newWallet));
          localStorage.setItem("quizweb_guest_transactions", JSON.stringify(updatedTxList));
          localStorage.setItem("quizweb_guest_streak_claimed", now.toISOString());
          window.dispatchEvent(
            new CustomEvent("coinBalanceUpdate", {
              detail: { coinBalance: newBalance, coinsEarned: bonusAmount },
            })
          );
        }

        showToast(isHindi ? "🎉 +50 सिक्के जोड़े गए! (दैनिक बोनस)" : "🎉 +50 Coins claimed! (Daily Bonus)");
      }
    } catch (error) {
      showToast(isHindi ? "कनेक्शन त्रुटि, पुनः प्रयास करें।" : "Connection error. Please try again.", "error");
    } finally {
      setClaiming(false);
    }
  };

  const handleOpenRedeemModal = (voucher) => {
    setSelectedVoucher(voucher);
    setRedeemedCode(null);
    setCopiedCode(false);
  };

  const handleConfirmRedeem = () => {
    if (!selectedVoucher) return;
    const currentBalance = walletData?.coinBalance || 0;
    if (currentBalance < selectedVoucher.coins) {
      showToast(isHindi ? "अपर्याप्त सिक्के!" : "Insufficient coins!", "error");
      return;
    }

    setRedeeming(true);

    setTimeout(() => {
      // Generate a realistic gift code
      const randStr = () => Math.random().toString(36).substring(2, 6).toUpperCase();
      const prefix = selectedVoucher.brand === "amazon" ? "AMZ" : selectedVoucher.brand === "flipkart" ? "FLP" : "GIFT";
      const generatedCode = `${prefix}-${randStr()}-${randStr()}-${randStr()}`;

      const newBalance = currentBalance - selectedVoucher.coins;
      const newWallet = { ...walletData, coinBalance: newBalance };

      const redemptionTx = {
        id: "tx-red-" + Date.now(),
        type: "REDEMPTION",
        description: `Redeemed ${selectedVoucher.name} ₹${selectedVoucher.amount}`,
        descriptionHi: `${selectedVoucher.nameHi} ₹${selectedVoucher.amount} रिडीम किया`,
        amount: -selectedVoucher.coins,
        createdAt: new Date().toISOString(),
      };

      const updatedTx = [redemptionTx, ...transactions];

      setWalletData(newWallet);
      setTransactions(updatedTx);
      setRedeemedCode(generatedCode);
      setRedeeming(false);

      if (typeof window !== "undefined") {
        if (walletData?.isGuest) {
          localStorage.setItem("quizweb_guest_wallet", JSON.stringify(newWallet));
          localStorage.setItem("quizweb_guest_transactions", JSON.stringify(updatedTx));
        }
        window.dispatchEvent(
          new CustomEvent("coinBalanceUpdate", {
            detail: { coinBalance: newBalance, coinsEarned: -selectedVoucher.coins },
          })
        );
      }

      showToast(isHindi ? "🎉 वाउचर सफलतापूर्वक रिडीम किया गया!" : "🎉 Voucher successfully redeemed!");
    }, 700);
  };

  const copyVoucherCode = () => {
    if (!redeemedCode) return;
    navigator.clipboard.writeText(redeemedCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
    showToast(isHindi ? "कोड क्लिपबोर्ड पर कॉपी किया गया!" : "Code copied to clipboard!");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <div className="text-sm font-bold text-slate-500 dark:text-slate-400">
          {isHindi ? "वॉलेट लोड हो रहा है..." : "Loading wallet..."}
        </div>
      </div>
    );
  }

  const rupeeValue = (walletData?.coinBalance || 0) * COIN_TO_RUPEE;

  const filteredTransactions = transactions.filter((tx) => {
    if (txFilter === "earned") return tx.amount > 0;
    if (txFilter === "redeemed") return tx.amount < 0;
    return true;
  });

  const displayedTransactions = expandedTx
    ? filteredTransactions
    : filteredTransactions.slice(0, 6);

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 py-8 sm:py-12 px-4 sm:px-6 transition-colors">
      <div className="max-w-6xl mx-auto">
        {/* Toast Notification */}
        <AnimatePresence>
          {toastMsg && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`fixed top-5 left-1/2 -translate-x-1/2 z-[100] px-5 py-3 rounded-2xl shadow-2xl text-sm font-black flex items-center gap-2 border backdrop-blur-md ${
                toastMsg.type === "error"
                  ? "bg-rose-500/90 text-white border-rose-400/30"
                  : "bg-emerald-600/95 text-white border-emerald-400/30"
              }`}
            >
              {toastMsg.type === "error" ? <AlertCircle size={18} /> : <Sparkles size={18} />}
              <span>{toastMsg.text}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Top Navigation & Breadcrumbs */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors shadow-xs"
            >
              <ArrowLeft size={14} />
              <span>{isHindi ? "होम" : "Home"}</span>
            </Link>

            <Link
              href="/rewards"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/40 text-xs font-bold text-amber-700 dark:text-amber-300 hover:bg-amber-100 transition-colors shadow-xs"
            >
              <Award size={14} />
              <span>{isHindi ? "रिवॉर्ड्स व बैज हब" : "Rewards & Badges Hub"}</span>
            </Link>
          </div>

          {/* Guest Sync Banner or Pro Badge */}
          {walletData?.isGuest ? (
            <button
              onClick={() => signIn("google")}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800/40 text-xs font-black text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-all shadow-xs"
            >
              <LogIn size={14} />
              <span>{isHindi ? "सिक्के सिंक करने के लिए लॉगिन करें" : "Sign In to Sync Coins"}</span>
            </button>
          ) : session?.user?.isPro ? (
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs font-black">
              <Crown size={14} />
              <span>{isHindi ? "प्रो मेंबर (4x सिक्के सक्रिय)" : "PRO Member (4x Multiplier)"}</span>
            </div>
          ) : null}
        </div>

        {/* Header Title */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white mb-2 flex items-center gap-3">
            <span className="p-2.5 rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/25">
              <Wallet size={28} />
            </span>
            <span>{isHindi ? "मेरा सिक्का वॉलेट" : "My Coin Wallet"}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
            {isHindi
              ? "क्विज़ हल करके सिक्के कमाएं, वास्तविक वाउचर्स रिडीम करें और दैनिक स्ट्रीक बढ़ाएं"
              : "Earn coins by solving quizzes, redeem real gift cards, and maintain your streak"}
          </p>
        </div>

        {/* Balance Showcase Card */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 rounded-3xl p-6 sm:p-8 text-white shadow-2xl shadow-indigo-600/20 mb-8 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

          <div className="relative z-10">
            <div className="flex items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-400/20 flex items-center justify-center text-amber-300">
                  <Coins size={18} />
                </div>
                <span className="text-xs font-black uppercase tracking-wider text-indigo-200">
                  {isHindi ? "उपलब्ध सिक्का शेष" : "Available Coin Balance"}
                </span>
              </div>

              {walletData?.isGuest && (
                <span className="px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-sm text-[10px] font-black uppercase tracking-wider text-indigo-100">
                  {isHindi ? "गेस्ट मोड (लोकल)" : "Guest Mode (Local)"}
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-baseline gap-3 mb-6">
              <span className="text-5xl sm:text-6xl font-black tracking-tight drop-shadow-sm">
                {(walletData?.coinBalance || 0).toLocaleString()}
              </span>
              <span className="text-xl sm:text-2xl font-bold text-indigo-200">
                {isHindi ? "सिक्के" : "coins"}
              </span>
            </div>

            {/* Sub-KPI Row */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 pt-4 border-t border-white/15">
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 sm:p-4 border border-white/10">
                <div className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-indigo-200 mb-1">
                  {isHindi ? "रुपये में मूल्य" : "Approx Value"}
                </div>
                <div className="text-xl sm:text-2xl font-black text-amber-300">
                  ₹{rupeeValue.toFixed(2)}
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 sm:p-4 border border-white/10">
                <div className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-indigo-200 mb-1">
                  {isHindi ? "कुल अर्जित सिक्के" : "Lifetime Earned"}
                </div>
                <div className="text-xl sm:text-2xl font-black text-white">
                  {(walletData?.totalCoinsEarned || 0).toLocaleString()}
                </div>
              </div>

              <div className="col-span-2 sm:col-span-1 bg-white/10 backdrop-blur-md rounded-2xl p-3 sm:p-4 border border-white/10 flex flex-col justify-center">
                <div className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-indigo-200 mb-1">
                  {isHindi ? "कन्वर्ज़न दर" : "Conversion"}
                </div>
                <div className="text-xs sm:text-sm font-black text-indigo-100">
                  1,000 Coins = ₹10
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* 2-Column Section: Daily Streak Box + Transaction History */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 mb-10">
          {/* Daily Streak Card */}
          <motion.div
            initial={{ opacity: 0, x: -15 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-1"
          >
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-xl border border-slate-200/80 dark:border-slate-800 h-full flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-orange-100 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400">
                      <Calendar size={20} />
                    </div>
                    <h2 className="text-lg font-black text-slate-900 dark:text-white">
                      {isHindi ? "दैनिक स्ट्रीक चेक-इन" : "Daily Streak Check-in"}
                    </h2>
                  </div>
                </div>

                <div className="text-center py-4 mb-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                  <div className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-amber-500 mb-1">
                    🔥 {dailyStreak?.streakCount || 1}
                  </div>
                  <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    {isHindi ? "लगातार दिन सक्रिय" : "Consecutive Active Days"}
                  </div>
                </div>

                <div className="bg-gradient-to-br from-amber-500/10 via-orange-500/10 to-amber-500/5 rounded-2xl p-4 mb-5 border border-amber-500/20 text-center">
                  <div className="flex items-center justify-center gap-1.5 mb-1 text-amber-700 dark:text-amber-300 text-xs font-black uppercase tracking-wider">
                    <Sparkles size={16} />
                    <span>{isHindi ? "आज का बोनस" : "Today's Bonus"}</span>
                  </div>
                  <div className="text-2xl font-black text-amber-600 dark:text-amber-400">
                    +50 {isHindi ? "सिक्के" : "Coins"}
                  </div>
                </div>
              </div>

              <div>
                <button
                  onClick={handleClaimDaily}
                  disabled={!canClaim || claiming}
                  className={`w-full py-3.5 rounded-2xl font-black text-xs sm:text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                    canClaim
                      ? "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg shadow-indigo-600/30 active:scale-98 cursor-pointer"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed"
                  }`}
                >
                  {claiming ? (
                    <span>{isHindi ? "क्लेम हो रहा है..." : "Claiming..."}</span>
                  ) : canClaim ? (
                    <>
                      <Sparkles size={16} />
                      <span>{isHindi ? "दैनिक 50 सिक्के क्लेम करें" : "Claim 50 Coins"}</span>
                    </>
                  ) : (
                    <>
                      <Check size={16} />
                      <span>{isHindi ? "आज का बोनस क्लेम हो चुका है" : "Already Claimed Today"}</span>
                    </>
                  )}
                </button>

                {!canClaim && dailyStreak?.lastClaimAt && (
                  <div className="text-center mt-3 text-[11px] font-bold text-slate-400">
                    {isHindi ? "अगला क्लेम 24 घंटे बाद उपलब्ध होगा" : "Next claim resets in ~24 hours"}
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          {/* Transaction History Card */}
          <motion.div
            initial={{ opacity: 0, x: 15 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-2"
          >
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-xl border border-slate-200/80 dark:border-slate-800 h-full flex flex-col justify-between">
              <div>
                <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-indigo-100 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
                      <History size={20} />
                    </div>
                    <h2 className="text-lg font-black text-slate-900 dark:text-white">
                      {isHindi ? "सिक्का इतिहास" : "Transaction History"}
                    </h2>
                  </div>

                  {/* Filter Pills */}
                  <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80">
                    <button
                      onClick={() => setTxFilter("all")}
                      className={`px-3 py-1 rounded-lg text-xs font-black transition-all ${
                        txFilter === "all"
                          ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs"
                          : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                      }`}
                    >
                      {isHindi ? "सभी" : "All"}
                    </button>
                    <button
                      onClick={() => setTxFilter("earned")}
                      className={`px-3 py-1 rounded-lg text-xs font-black transition-all ${
                        txFilter === "earned"
                          ? "bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-300 shadow-xs"
                          : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                      }`}
                    >
                      {isHindi ? "कमाए गए" : "Earned"}
                    </button>
                    <button
                      onClick={() => setTxFilter("redeemed")}
                      className={`px-3 py-1 rounded-lg text-xs font-black transition-all ${
                        txFilter === "redeemed"
                          ? "bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-300 shadow-xs"
                          : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                      }`}
                    >
                      {isHindi ? "रिडीम" : "Redeemed"}
                    </button>
                  </div>
                </div>

                {/* Transaction Rows */}
                <div className="space-y-2.5 max-h-[340px] overflow-y-auto pr-1">
                  {displayedTransactions.length === 0 ? (
                    <div className="text-center py-12 text-slate-400 dark:text-slate-500 font-medium text-xs">
                      {isHindi ? "कोई लेनदेन नहीं मिला।" : "No transactions found in this category."}
                    </div>
                  ) : (
                    displayedTransactions.map((tx) => {
                      const isPositive = tx.amount > 0;
                      return (
                        <div
                          key={tx.id}
                          className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 transition border border-slate-100 dark:border-slate-800"
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                                isPositive
                                  ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400"
                                  : "bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400"
                              }`}
                            >
                              {isPositive ? <Check size={18} /> : <Gift size={18} />}
                            </div>
                            <div>
                              <div className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                                {isHindi && tx.descriptionHi ? tx.descriptionHi : tx.description || tx.type}
                              </div>
                              <div className="text-[10px] text-slate-400 dark:text-slate-500">
                                {new Date(tx.createdAt).toLocaleDateString()} •{" "}
                                {new Date(tx.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                              </div>
                            </div>
                          </div>

                          <div
                            className={`font-black text-sm sm:text-base shrink-0 ${
                              isPositive
                                ? "text-emerald-600 dark:text-emerald-400"
                                : "text-rose-600 dark:text-rose-400"
                            }`}
                          >
                            {isPositive ? "+" : ""}
                            {tx.amount.toLocaleString()}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {filteredTransactions.length > 6 && (
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-center">
                  <button
                    onClick={() => setExpandedTx(!expandedTx)}
                    className="text-xs font-black text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    {expandedTx
                      ? isHindi
                        ? "कम देखें (Show Less)"
                        : "Show Less"
                      : isHindi
                      ? `सभी ${filteredTransactions.length} लेनदेन देखें`
                      : `View all ${filteredTransactions.length} transactions`}
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Quick Ways to Earn Coins Grid */}
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="text-amber-500" size={22} />
            <h2 className="text-xl font-black text-slate-900 dark:text-white">
              {isHindi ? "सिक्के कैसे कमाएं? (Quick Ways to Earn)" : "Quick Ways to Earn Coins"}
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              href="/daily-quiz"
              className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-600 shadow-md hover:-translate-y-1 transition-all group"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-2xl">⚡</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-xs font-black">
                  +50 Coins
                </span>
              </div>
              <h3 className="text-xs font-black text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                {isHindi ? "दैनिक क्विज़" : "Daily Quiz Challenge"}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                {isHindi ? "हर रोज़ 5 त्वरित सवालों का सही जवाब दें" : "Solve 5 quick questions every morning"}
              </p>
            </Link>

            <Link
              href="/arena"
              className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-600 shadow-md hover:-translate-y-1 transition-all group"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-2xl">⚔️</span>
                <span className="px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-xs font-black">
                  +75 Coins
                </span>
              </div>
              <h3 className="text-xs font-black text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                {isHindi ? "GK एरीना लाइव बैटल" : "GK Arena 1v1 Battle"}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                {isHindi ? "दूसरे प्रतियोगी को हराकर जीत का इनाम पाएं" : "Defeat rivals in rapid real-time match"}
              </p>
            </Link>

            <Link
              href="/mock-tests"
              className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-600 shadow-md hover:-translate-y-1 transition-all group"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-2xl">📝</span>
                <span className="px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 text-xs font-black">
                  +100 Coins
                </span>
              </div>
              <h3 className="text-xs font-black text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                {isHindi ? "फुल मॉक टेस्ट" : "Full Mock Exam"}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                {isHindi ? "पूरा परीक्षा पेपर हल करके बड़ा इनाम पाएं" : "Complete full exam paper simulation"}
              </p>
            </Link>

            <Link
              href="/rewards"
              className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-600 shadow-md hover:-translate-y-1 transition-all group"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-2xl">🏆</span>
                <span className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 text-xs font-black">
                  +250 Coins
                </span>
              </div>
              <h3 className="text-xs font-black text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                {isHindi ? "अचीवमेंट बैज अनलॉक" : "Unlock Milestones"}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                {isHindi ? "नए बैज और स्टिकर्स हासिल करके बोनस लें" : "Complete special challenges and earn trophies"}
              </p>
            </Link>
          </div>
        </div>

        {/* Rewards Marketplace (Vouchers) */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mb-10"
        >
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-indigo-100 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
                <Gift size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white">
                  {isHindi ? "रिवॉर्ड्स वाउचर स्टोर" : "Rewards Marketplace"}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {isHindi ? "अपने सिक्कों को ब्रांडेड गिफ्ट वाउचर्स में बदलें" : "Convert your earned coins into instant digital vouchers"}
                </p>
              </div>
            </div>

            <div className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-3 py-1.5 rounded-xl border border-indigo-200 dark:border-indigo-800">
              {isHindi ? "1,000 सिक्के = ₹10 वाउचर" : "1,000 Coins = ₹10 Voucher"}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {VOUCHERS.map((voucher) => {
              const currentBalance = walletData?.coinBalance || 0;
              const progress = Math.min(100, (currentBalance / voucher.coins) * 100);
              const canRedeem = currentBalance >= voucher.coins;

              return (
                <div
                  key={voucher.id}
                  className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-xl border border-slate-200/80 dark:border-slate-800 hover:shadow-2xl hover:-translate-y-1.5 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="text-5xl mb-4 text-center select-none">{voucher.icon}</div>
                    <h3 className="font-black text-sm text-slate-900 dark:text-white text-center mb-1">
                      {isHindi ? voucher.nameHi : voucher.name}
                    </h3>
                    <div className="text-3xl font-black text-indigo-600 dark:text-indigo-400 text-center mb-4">
                      ₹{voucher.amount}
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-4">
                      <div className="flex justify-between text-[11px] font-bold text-slate-400 dark:text-slate-500 mb-1.5">
                        <span>{isHindi ? "प्रगति" : "Progress"}</span>
                        <span>{progress.toFixed(0)}%</span>
                      </div>
                      <div className="h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>

                    <div className="text-center mb-5">
                      <span className="text-xs font-bold text-slate-400 dark:text-slate-500">
                        {isHindi ? "आवश्यक: " : "Requires "}
                      </span>
                      <span className="text-sm font-black text-slate-900 dark:text-white">
                        {voucher.coins.toLocaleString()}
                      </span>
                      <span className="text-xs font-bold text-slate-400 dark:text-slate-500">
                        {" "}
                        {isHindi ? "सिक्के" : "coins"}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleOpenRedeemModal(voucher)}
                    className={`w-full py-3 rounded-2xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
                      canRedeem
                        ? "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-md shadow-indigo-600/30 active:scale-98 cursor-pointer"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700/60"
                    }`}
                  >
                    {canRedeem ? (
                      <>
                        <Sparkles size={14} />
                        <span>{isHindi ? "अभी रिडीम करें" : "Redeem Now"}</span>
                      </>
                    ) : (
                      <span>
                        {isHindi
                          ? `${(voucher.coins - currentBalance).toLocaleString()} सिक्के और चाहिए`
                          : `Need ${(voucher.coins - currentBalance).toLocaleString()} more`}
                      </span>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Pro Upgrade CTA */}
        {!session?.user?.isPro && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden border border-indigo-900/50 shadow-2xl"
          >
            <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/15 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 text-xs font-black uppercase tracking-wider mb-2">
                  <Crown size={14} />
                  <span>{isHindi ? "प्रो मेंबरशिप" : "Pro Membership"}</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black mb-1.5">
                  {isHindi
                    ? "प्रत्येक सही उत्तर पर 4x सिक्के अर्जित करें"
                    : "Earn 4x Coins on Every Correct Answer"}
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 max-w-xl font-medium">
                  {isHindi
                    ? "प्रो एक्सेस प्राप्त करें, असीमित मॉक टेस्ट अनलॉक करें और वाउचर के लिए सिक्के 4 गुना तेजी से कमाएं।"
                    : "Supercharge your coin earnings and unlock unlimited full-length mock tests with Pro."}
                </p>
              </div>

              <Link
                href="/pro"
                className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 font-black text-xs sm:text-sm uppercase tracking-wider shadow-lg shadow-orange-500/25 active:scale-95 transition-all shrink-0"
              >
                <span>{isHindi ? "अपग्रेड करें" : "Upgrade to Pro"}</span>
                <ArrowRight size={16} />
              </Link>
            </div>
          </motion.div>
        )}
      </div>

      {/* Voucher Redemption Modal */}
      <AnimatePresence>
        {selectedVoucher && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white relative"
            >
              {/* Close Button */}
              <button
                onClick={() => setSelectedVoucher(null)}
                className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <X size={18} />
              </button>

              {!redeemedCode ? (
                /* Step 1: Confirmation & Details */
                <div>
                  <div className="text-center mb-5">
                    <div className="text-5xl mb-2">{selectedVoucher.icon}</div>
                    <h3 className="text-xl font-black">
                      {isHindi ? selectedVoucher.nameHi : selectedVoucher.name}
                    </h3>
                    <div className="text-3xl font-black text-indigo-600 dark:text-indigo-400 mt-1">
                      ₹{selectedVoucher.amount}
                    </div>
                  </div>

                  <div className="space-y-3 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl mb-6 border border-slate-100 dark:border-slate-800 text-xs">
                    <div className="flex justify-between font-bold">
                      <span className="text-slate-500 dark:text-slate-400">
                        {isHindi ? "वर्तमान शेष:" : "Current Balance:"}
                      </span>
                      <span>{(walletData?.coinBalance || 0).toLocaleString()} Coins</span>
                    </div>
                    <div className="flex justify-between font-bold">
                      <span className="text-slate-500 dark:text-slate-400">
                        {isHindi ? "वाउचर की लागत:" : "Voucher Cost:"}
                      </span>
                      <span className="text-rose-500">-{selectedVoucher.coins.toLocaleString()} Coins</span>
                    </div>
                    <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between font-black text-sm">
                      <span>{isHindi ? "शेष सिक्के:" : "Remaining Balance:"}</span>
                      <span className="text-indigo-600 dark:text-indigo-400">
                        {Math.max(0, (walletData?.coinBalance || 0) - selectedVoucher.coins).toLocaleString()} Coins
                      </span>
                    </div>
                  </div>

                  {(walletData?.coinBalance || 0) >= selectedVoucher.coins ? (
                    <button
                      onClick={handleConfirmRedeem}
                      disabled={redeeming}
                      className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-black text-sm uppercase tracking-wider shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {redeeming ? (
                        <span>{isHindi ? "वाउचर जनरेट हो रहा है..." : "Generating Code..."}</span>
                      ) : (
                        <>
                          <Check size={18} />
                          <span>{isHindi ? "पुष्टि करें और रिडीम करें" : "Confirm & Redeem"}</span>
                        </>
                      )}
                    </button>
                  ) : (
                    <div className="text-center">
                      <p className="text-xs text-rose-500 font-bold mb-3">
                        {isHindi
                          ? `आपको ${selectedVoucher.coins - (walletData?.coinBalance || 0)} सिक्के और चाहिए!`
                          : `You need ${selectedVoucher.coins - (walletData?.coinBalance || 0)} more coins!`}
                      </p>
                      <Link
                        href="/daily-quiz"
                        onClick={() => setSelectedVoucher(null)}
                        className="inline-flex items-center justify-center gap-2 w-full py-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 font-black text-xs uppercase tracking-wider"
                      >
                        <Zap size={14} />
                        <span>{isHindi ? "क्विज़ खेलकर सिक्के कमाएं" : "Play Quiz to Earn"}</span>
                      </Link>
                    </div>
                  )}
                </div>
              ) : (
                /* Step 2: Instant Code Celebration */
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center text-3xl mb-3 shadow-lg shadow-emerald-500/20">
                    🎉
                  </div>
                  <h3 className="text-xl font-black mb-1">
                    {isHindi ? "बधाई! आपका वाउचर तैयार है" : "Success! Voucher Generated"}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">
                    {isHindi
                      ? `${selectedVoucher.nameHi} का डिजिटल गिफ्ट कोड नीचे दिया गया है:`
                      : `Your unique ${selectedVoucher.name} gift code is ready to use:`}
                  </p>

                  {/* Gift Card Code Box */}
                  <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800 border-2 border-dashed border-indigo-400 dark:border-indigo-500/50 mb-5 flex items-center justify-between gap-3">
                    <span className="font-mono text-base sm:text-lg font-black tracking-wider text-indigo-600 dark:text-indigo-400 select-all">
                      {redeemedCode}
                    </span>
                    <button
                      onClick={copyVoucherCode}
                      className="px-3 py-1.5 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition text-xs font-black flex items-center gap-1.5 shrink-0"
                    >
                      {copiedCode ? <Check size={14} /> : <Copy size={14} />}
                      <span>{copiedCode ? (isHindi ? "कॉपी हुआ!" : "Copied!") : (isHindi ? "कॉपी" : "Copy")}</span>
                    </button>
                  </div>

                  <p className="text-[11px] text-slate-400 mb-6">
                    {isHindi
                      ? "यह कोड 1 वर्ष के लिए वैध है। इसे अपने Amazon/Flipkart वॉलेट में 'Add Gift Card' में पेस्ट करें।"
                      : "Valid for 12 months. Apply under 'Add Gift Card / Voucher' in your merchant account."}
                  </p>

                  <button
                    onClick={() => setSelectedVoucher(null)}
                    className="w-full py-3 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black text-xs uppercase tracking-wider"
                  >
                    {isHindi ? "बंद करें" : "Done"}
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </main>
  );
}
