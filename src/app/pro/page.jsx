"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  Sparkles,
  Shield,
  Zap,
  Lock,
  CreditCard,
  Crown,
  Coins,
  FileText,
  Award,
  Ban,
  HelpCircle,
  CheckCircle2,
  QrCode,
  Smartphone,
  X,
  ExternalLink,
  Copy,
} from "lucide-react";
import { PRO_PLANS } from "@/lib/monetizationConfig";
import { useTier } from "@/context/TierContext";
import { useLanguage } from "@/context/LanguageContext";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";

export default function ProPricingPage() {
  const router = useRouter();
  const { tier } = useTier();
  const { isHindi } = useLanguage();
  const { data: session } = useSession();

  // Default to student pass (₹11) or best value
  const [selectedPlanId, setSelectedPlanId] = useState("plan_student_11");
  const [loading, setLoading] = useState(false);

  // Parent Math Verification Modal
  const [showParentGate, setShowParentGate] = useState(false);
  const [parentMathAnswer, setParentMathAnswer] = useState("");
  const [mathProblem, setMathProblem] = useState({ q: "8 × 7", a: 56 });

  // In-App Simulated UPI / Checkout Modal
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState("pay"); // 'pay' | 'processing' | 'success'
  const [activePaymentMethod, setActivePaymentMethod] = useState("upi"); // 'upi' | 'qr' | 'card'
  const [simulatedOrderId, setSimulatedOrderId] = useState(null);

  const isKidsOrStudents = tier === "kids" || tier === "students";
  const selectedPlan = PRO_PLANS.find((p) => p.id === selectedPlanId) || PRO_PLANS[0];

  const handleSelectPlan = (planId) => {
    setSelectedPlanId(planId);
  };

  const startCheckout = async () => {
    if (isKidsOrStudents && !showParentGate) {
      const num1 = Math.floor(Math.random() * 6) + 4;
      const num2 = Math.floor(Math.random() * 7) + 3;
      setMathProblem({ q: `${num1} × ${num2}`, a: num1 * num2 });
      setParentMathAnswer("");
      setShowParentGate(true);
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/checkout/razorpay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId: selectedPlanId, type: "subscription" }),
      });
      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to initialize payment");
      }

      // Check if real window.Razorpay SDK is active
      if (typeof window !== "undefined" && window.Razorpay && !data.key?.includes("mock")) {
        const options = {
          key: data.key,
          amount: data.order.amount,
          currency: data.order.currency,
          name: "QuizWeb Pro",
          description: `Subscription Pass (${data.order.planId})`,
          order_id: data.order.id,
          handler: async function (response) {
            await activateSubscription(response.razorpay_payment_id, data.order.id);
          },
          prefill: {
            name: data.user.name,
            email: data.user.email,
          },
          theme: { color: "#4F46E5" },
        };
        const rzp = new window.Razorpay(options);
        rzp.open();
      } else {
        // Open rich simulated in-app UPI / Card checkout modal
        setSimulatedOrderId(data.order?.id || `sim_ord_${Date.now()}`);
        setCheckoutStep("pay");
        setShowCheckoutModal(true);
      }
    } catch (err) {
      toast.error(err.message || "Payment initialization failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSimulatePaymentSuccess = async () => {
    setCheckoutStep("processing");

    setTimeout(async () => {
      await activateSubscription(`sim_pay_${Date.now()}`, simulatedOrderId);
      setCheckoutStep("success");
    }, 1200);
  };

  const activateSubscription = async (paymentId, orderId) => {
    try {
      const devId = typeof window !== "undefined" ? localStorage.getItem("quiz_device_id") || "guest" : "guest";
      const res = await fetch("/api/subscriptions/activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: selectedPlanId,
          paymentId,
          orderId,
          deviceId: devId,
        }),
      });
      const result = await res.json();
      if (result.success) {
        if (typeof window !== "undefined") {
          localStorage.setItem("user_is_pro", "true");
          window.dispatchEvent(new CustomEvent("subscriptionUpdated", { detail: { isPro: true, planId: selectedPlanId } }));
        }
        toast.success(isHindi ? "बधाई! आपका प्रो VIP पास सक्रिय हो गया है! 🎉" : "Welcome to QuizWeb Pro! 🎉");
      } else {
        toast.error(result.error || "Activation failed");
      }
    } catch (e) {
      toast.error("Error activating subscription");
    }
  };

  const handleParentGateSubmit = (e) => {
    e.preventDefault();
    if (parseInt(parentMathAnswer, 10) === mathProblem.a) {
      setShowParentGate(false);
      startCheckout();
    } else {
      toast.error(isHindi ? "गलत उत्तर। कृपया अभिभावक से सहायता लें।" : "Incorrect answer. Please ask a parent or guardian to assist.");
      setParentMathAnswer("");
    }
  };

  const VIP_FEATURES = [
    {
      icon: Coins,
      title: "4x Coin Multiplier",
      titleHi: "4x सिक्का मल्टीप्लायर",
      badge: "Instant Rewards",
      badgeHi: "रिवॉर्ड्स",
      desc: "Earn 4 coins instead of 1 on every correct answer. Reach ₹50 & ₹100 vouchers 4x faster!",
      descHi: "प्रत्येक सही उत्तर पर 1 के बजाय 4 सिक्के पाएं। Amazon Pay व Flipkart वाउचर 4 गुना तेज़ी से रिडीम करें!",
      color: "from-amber-400 to-orange-500",
      textColor: "text-amber-500",
      bgLight: "bg-amber-50 dark:bg-amber-950/40",
    },
    {
      icon: FileText,
      title: "Unlimited Full Mock Tests",
      titleHi: "अनलिमिटेड फुल मॉक टेस्ट",
      badge: "Full Papers",
      badgeHi: "सभी पेपर्स",
      desc: "Unrestricted access to all UPSC, SSC, Railways & State full mock exams with detailed answer keys.",
      descHi: "UPSC, SSC, रेलवे व राज्य परीक्षाओं के सभी फुल मॉक टेस्ट, सेक्शनल कटऑफ और संपूर्ण हल अनलॉक।",
      color: "from-indigo-500 to-purple-600",
      textColor: "text-indigo-500",
      bgLight: "bg-indigo-50 dark:bg-indigo-950/40",
    },
    {
      icon: Crown,
      title: "Golden VIP Crown Badge",
      titleHi: "गोल्डन VIP क्राउन बैज",
      badge: "Status",
      badgeHi: "प्रतिष्ठा",
      desc: "Stand out on Global Leaderboards, 1v1 Arena and Profile with an exclusive golden crown flair.",
      descHi: "ग्लोबल लीडरबोर्ड, जीके एरीना और अपनी प्रोफाइल पर चमचमाते गोल्डन VIP बैज के साथ अलग पहचान बनाएं।",
      color: "from-yellow-400 to-amber-600",
      textColor: "text-amber-500",
      bgLight: "bg-yellow-50 dark:bg-yellow-950/40",
    },
    {
      icon: Ban,
      title: "100% Ad-Free Experience",
      titleHi: "100% शून्य विज्ञापन",
      badge: "Zen Focus",
      badgeHi: "एकाग्रता",
      desc: "Zero banners, zero interruptions. Pure uninterrupted flow during tests and study revision.",
      descHi: "बिना किसी रुकावट या विज्ञापन के शांतिपूर्ण अध्ययन। पढ़ाई और मॉक टेस्ट में 100% एकाग्रता।",
      color: "from-emerald-400 to-teal-600",
      textColor: "text-emerald-500",
      bgLight: "bg-emerald-50 dark:bg-emerald-950/40",
    },
    {
      icon: Zap,
      title: "Arena Priority Matchmaking",
      titleHi: "एरीना प्रायोरिटी मैचमेकिंग",
      badge: "Speed",
      badgeHi: "त्वरित",
      desc: "Skip waiting queues in Live GK Arena duels and jump directly into battle with elite players.",
      descHi: "जीके एरीना 1v1 मुकाबलों में बिना इंतज़ार किए तुरंत देश भर के शीर्ष प्रतिस्पर्धियों से जुड़ें।",
      color: "from-rose-400 to-pink-600",
      textColor: "text-pink-500",
      bgLight: "bg-pink-50 dark:bg-pink-950/40",
    },
    {
      icon: Award,
      title: "Instant Detailed Solutions",
      titleHi: "त्वरित विस्तृत प्रश्न हल",
      badge: "Deep Study",
      badgeHi: "गहन अध्ययन",
      desc: "Access in-depth step-by-step reasoning, facts, and syllabus tips for every single quiz question.",
      descHi: "प्रत्येक प्रश्न के पीछे के तथ्य, व्याख्याएं, और परीक्षा-उपयोगी ट्रिक्स तुरंत पढ़ें।",
      color: "from-blue-400 to-cyan-600",
      textColor: "text-blue-500",
      bgLight: "bg-blue-50 dark:bg-blue-950/40",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 py-6 sm:py-10 px-4 sm:px-6 pb-24 transition-colors">
      <div className="max-w-4xl mx-auto">
        {/* Top Header Navigation */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors shadow-xs"
          >
            <ArrowLeft size={14} />
            <span>{isHindi ? "होम" : "Home"}</span>
          </Link>

          <div className="flex items-center gap-2">
            <Link
              href="/wallet"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400 text-xs font-black hover:bg-amber-500/20 transition-all shadow-xs"
            >
              <Coins size={14} className="text-amber-500" />
              <span>{isHindi ? "वॉलेट देखें" : "View Wallet"}</span>
            </Link>
          </div>
        </div>

        {/* Hero Banner: Glassmorphic VIP Showcase */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-950 p-6 sm:p-10 text-white shadow-2xl border-2 border-indigo-500/30 mb-10 transition-all">
          {/* Ambient Lighting Background */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/15 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-purple-500/15 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left">
            <div className="flex-1">
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-amber-400/20 border border-amber-400/40 text-amber-300 text-xs font-black uppercase tracking-wider mb-3">
                <Crown size={14} className="text-amber-400" />
                <span>{isHindi ? "अनलिमिटेड VIP पास" : "UNLIMITED VIP PASS"}</span>
              </div>

              <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-tight mb-2.5">
                {isHindi ? (
                  <>
                    हर विषय में बनें अव्वल, <br className="hidden sm:inline" />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-300 to-amber-400">
                      मात्र ₹11/माह में प्रो मेंबर बनें!
                    </span>
                  </>
                ) : (
                  <>
                    Supercharge Your Learning with <br className="hidden sm:inline" />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-300 to-amber-400">
                      QuizWeb Pro Pass (₹11/mo)
                    </span>
                  </>
                )}
              </h1>

              <p className="text-xs sm:text-sm text-indigo-200/90 max-w-xl font-medium leading-relaxed mb-6">
                {isHindi
                  ? "4x कॉइन मल्टीप्लायर के साथ असली वाउचर्स तेज़ी से जीतें, सभी फुल मॉक टेस्ट्स अनलॉक करें, और बिना किसी रुकावट के असीमित अभ्यास करें।"
                  : "Earn 4x coins on quizzes to redeem brand gift cards, unlock full exam mock papers, and enjoy an uninterrupted, ad-free learning journey."}
              </p>

              {/* Quick Feature Highlights */}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5 text-xs font-bold text-white/95">
                <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/15">
                  🪙 {isHindi ? "4x सिक्के हर सवाल पर" : "4x Coins Per Answer"}
                </span>
                <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/15">
                  📝 {isHindi ? "सभी मॉक टेस्ट अनलॉक" : "All Mock Tests"}
                </span>
                <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-300">
                  ✓ {isHindi ? "कोई स्वतः नवीनीकरण नहीं" : "No Auto-Renew Trap"}
                </span>
              </div>
            </div>

            {/* Giant Crown Visual Hero Card */}
            <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-3xl bg-gradient-to-br from-amber-400/20 to-indigo-500/20 backdrop-blur-md border border-white/20 flex flex-col items-center justify-center p-4 text-center shrink-0 shadow-2xl">
              <span className="text-5xl sm:text-6xl select-none mb-1">👑</span>
              <span className="text-xs font-black uppercase tracking-wider text-amber-300">
                PRO MEMBER
              </span>
              <span className="text-[10px] text-white/80">From ₹11/mo</span>
            </div>
          </div>
        </div>

        {/* 6 Core VIP Features Grid */}
        <div className="mb-12">
          <div className="text-center mb-6">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              {isHindi ? "प्रो मेंबरशिप में क्या-क्या मिलेगा?" : "Everything Included in Pro"}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              {isHindi ? "एक छोटा निवेश, आपके सीखने और रिवॉर्ड्स जीतने की गति को चार गुना बढ़ा देगा" : "A pocket-friendly pass designed specifically for aspirants and learners across India"}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {VIP_FEATURES.map((feature, i) => {
              const IconComp = feature.icon;
              return (
                <div
                  key={i}
                  className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3.5">
                      <div className={`w-11 h-11 rounded-2xl ${feature.bgLight} flex items-center justify-center ${feature.textColor}`}>
                        <IconComp size={22} />
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {isHindi ? feature.badgeHi : feature.badge}
                      </span>
                    </div>

                    <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white mb-1.5">
                      {isHindi ? feature.titleHi : feature.title}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      {isHindi ? feature.descHi : feature.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Plan Selector Section */}
        <div className="mb-10">
          <div className="text-center mb-6">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              {isHindi ? "अपनी सुविधानुसार प्लान चुनें" : "Select Your Pro Plan"}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              {isHindi ? "कोई छुपे हुए शुल्क नहीं · एकमुश्त भुगतान · कोई ऑटो-डेबिट नहीं" : "One-time payment • No auto-deduction • Full transparency"}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {PRO_PLANS.filter((p) => p.id !== "plan_1m").map((plan) => {
              const isSelected = selectedPlanId === plan.id;

              return (
                <div
                  key={plan.id}
                  onClick={() => handleSelectPlan(plan.id)}
                  className={`relative p-5 rounded-3xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? "bg-white dark:bg-slate-900 border-indigo-600 dark:border-indigo-500 shadow-xl shadow-indigo-600/15 scale-[1.02]"
                      : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 opacity-90 hover:opacity-100"
                  }`}
                >
                  {/* Badge */}
                  {plan.badge && (
                    <span
                      className={`absolute -top-3 right-4 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider text-white shadow-sm ${
                        plan.isBestValue ? "bg-emerald-600" : "bg-gradient-to-r from-orange-500 to-amber-500"
                      }`}
                    >
                      {isHindi && plan.badgeHi ? plan.badgeHi : plan.badge}
                    </span>
                  )}

                  <div>
                    {/* Radio Indicator */}
                    <div className="flex items-center justify-between mb-3">
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                          isSelected ? "border-indigo-600 bg-indigo-600" : "border-slate-300 dark:border-slate-600"
                        }`}
                      >
                        {isSelected && <Check size={12} className="text-white" strokeWidth={3} />}
                      </div>
                      <span className="text-[11px] font-bold text-slate-400">
                        {plan.durationDays} {isHindi ? "दिन" : "days"}
                      </span>
                    </div>

                    <h3 className="text-sm font-black text-slate-900 dark:text-white mb-0.5">
                      {isHindi && plan.nameHi ? plan.nameHi : plan.name}
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-4 leading-tight">
                      {isHindi && plan.taglineHi ? plan.taglineHi : plan.tagline}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-black text-slate-900 dark:text-white">
                        ₹{plan.price}
                      </span>
                      <span className="text-xs font-bold text-slate-400">
                        /{plan.durationDays === 30 ? (isHindi ? "माह" : "mo") : plan.durationDays === 365 ? (isHindi ? "वर्ष" : "yr") : (isHindi ? "पास" : "pass")}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Payment Methods Info Banner */}
        <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200/60 dark:border-indigo-800/40 text-center mb-6 flex flex-wrap items-center justify-center gap-4 text-xs font-bold text-slate-600 dark:text-slate-300">
          <span className="inline-flex items-center gap-1.5">
            <Smartphone size={16} className="text-indigo-600 dark:text-indigo-400" />
            <span>UPI (GPay, PhonePe, Paytm, BHIM)</span>
          </span>
          <span>•</span>
          <span className="inline-flex items-center gap-1.5">
            <QrCode size={16} className="text-indigo-600 dark:text-indigo-400" />
            <span>Instant QR Code Scan</span>
          </span>
          <span>•</span>
          <span className="inline-flex items-center gap-1.5">
            <CreditCard size={16} className="text-indigo-600 dark:text-indigo-400" />
            <span>Debit / Credit Cards</span>
          </span>
        </div>

        {/* Big Checkout CTA Button */}
        <div className="max-w-md mx-auto text-center mb-8">
          <button
            onClick={startCheckout}
            disabled={loading}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-black text-base uppercase tracking-wider shadow-xl shadow-indigo-600/30 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? (
              <span>{isHindi ? "प्रक्रिया जारी है..." : "Processing..."}</span>
            ) : (
              <>
                <Crown size={20} className="text-amber-300" />
                <span>
                  {isHindi
                    ? `अभी प्रो एक्टिवेट करें • मात्र ₹${selectedPlan.price}`
                    : `Get Pro Now • Just ₹${selectedPlan.price}`}
                </span>
              </>
            )}
          </button>

          <p className="text-[11px] text-slate-400 mt-3 flex items-center justify-center gap-1.5">
            <Shield size={13} className="text-emerald-500" />
            <span>{isHindi ? "256-बिट सुरक्षित भुगतान · 100% संतुष्टि गारंटी" : "256-bit Secure Checkout • 100% Satisfaction Guarantee"}</span>
          </p>
        </div>
      </div>

      {/* Parental Gate Modal for Kids/Students */}
      {showParentGate && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md transition-opacity">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-center relative transition-transform">
              <div className="w-14 h-14 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 mx-auto flex items-center justify-center text-3xl mb-3 shadow-inner">
                👨‍👩‍👧
              </div>

              <h3 className="text-lg font-black mb-1">
                {isHindi ? "अभिभावक (Parent) सत्यापन" : "Parent Verification"}
              </h3>

              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                {isHindi
                  ? "सुरक्षित भुगतान के लिए कृपया यह गणितीय प्रश्न हल करें:"
                  : "Please ask a parent or guardian to solve this problem to proceed:"}
              </p>

              <form onSubmit={handleParentGateSubmit}>
                <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mb-3 py-2 px-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  {mathProblem.q} = ?
                </div>

                <input
                  type="number"
                  value={parentMathAnswer}
                  onChange={(e) => setParentMathAnswer(e.target.value)}
                  placeholder={isHindi ? "उत्तर दर्ज करें" : "Enter answer"}
                  autoFocus
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-center text-lg font-bold mb-4 outline-none focus:ring-2 focus:ring-indigo-500"
                />

                <div className="flex gap-2.5">
                  <button
                    type="button"
                    onClick={() => setShowParentGate(false)}
                    className="flex-1 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs uppercase tracking-wider"
                  >
                    {isHindi ? "रद्द करें" : "Cancel"}
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-wider shadow-md shadow-indigo-600/30"
                  >
                    {isHindi ? "आगे बढ़ें" : "Continue"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      {/* Modern In-App UPI & Card Checkout Modal */}
      {showCheckoutModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md transition-opacity">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white relative transition-transform">
              <button
                onClick={() => setShowCheckoutModal(false)}
                className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <X size={18} />
              </button>

              {checkoutStep === "pay" && (
                <div>
                  <div className="text-center mb-5">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-black uppercase mb-1">
                      <Crown size={14} />
                      <span>{isHindi && selectedPlan.nameHi ? selectedPlan.nameHi : selectedPlan.name}</span>
                    </div>
                    <div className="text-3xl font-black text-indigo-600 dark:text-indigo-400 mt-1">
                      ₹{selectedPlan.price}
                    </div>
                    <p className="text-[11px] text-slate-400">
                      {isHindi ? "एकमुश्त भुगतान · 30 दिन की वैधता" : "One-time payment • Full access unlocked"}
                    </p>
                  </div>

                  {/* Payment Method Switch Tabs */}
                  <div className="flex gap-2 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800 mb-5">
                    <button
                      onClick={() => setActivePaymentMethod("upi")}
                      className={`flex-1 py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
                        activePaymentMethod === "upi"
                          ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-sm"
                          : "text-slate-500"
                      }`}
                    >
                      <Smartphone size={14} />
                      <span>UPI Apps</span>
                    </button>

                    <button
                      onClick={() => setActivePaymentMethod("qr")}
                      className={`flex-1 py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
                        activePaymentMethod === "qr"
                          ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-sm"
                          : "text-slate-500"
                      }`}
                    >
                      <QrCode size={14} />
                      <span>Scan QR</span>
                    </button>
                  </div>

                  {/* UPI Apps View */}
                  {activePaymentMethod === "upi" && (
                    <div className="space-y-3 mb-6">
                      <div className="grid grid-cols-2 gap-2.5">
                        <div className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex items-center gap-2.5">
                          <span className="text-xl">🟢</span>
                          <span className="text-xs font-black">Google Pay</span>
                        </div>
                        <div className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex items-center gap-2.5">
                          <span className="text-xl">🟣</span>
                          <span className="text-xs font-black">PhonePe</span>
                        </div>
                        <div className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex items-center gap-2.5">
                          <span className="text-xl">🔵</span>
                          <span className="text-xs font-black">Paytm UPI</span>
                        </div>
                        <div className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex items-center gap-2.5">
                          <span className="text-xl">🟠</span>
                          <span className="text-xs font-black">BHIM UPI</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* QR Code View */}
                  {activePaymentMethod === "qr" && (
                    <div className="text-center p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 mb-6">
                      <div className="w-36 h-36 mx-auto bg-white p-3 rounded-2xl border shadow-inner flex items-center justify-center mb-2">
                        <QrCode size={110} className="text-slate-900" />
                      </div>
                      <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                        {isHindi ? "किसी भी UPI ऐप से स्कैन करके ₹" + selectedPlan.price + " पे करें" : "Scan via any UPI App to pay ₹" + selectedPlan.price}
                      </span>
                    </div>
                  )}

                  {/* Confirm & Complete Payment Button */}
                  <button
                    onClick={handleSimulatePaymentSuccess}
                    className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-sm uppercase tracking-wider shadow-lg shadow-emerald-600/25 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <CheckCircle2 size={18} />
                    <span>
                      {isHindi
                        ? `भुगतान स्वीकृत करें (Pay ₹${selectedPlan.price})`
                        : `Approve & Pay ₹${selectedPlan.price}`}
                    </span>
                  </button>
                </div>
              )}

              {checkoutStep === "processing" && (
                <div className="text-center py-8">
                  <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                  <h3 className="text-base font-black mb-1">
                    {isHindi ? "भुगतान की पुष्टि की जा रही है..." : "Verifying Payment..."}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {isHindi ? "कृपया विंडो बंद न करें" : "Please wait while we activate your Pro pass"}
                  </p>
                </div>
              )}

              {checkoutStep === "success" && (
                <div className="text-center py-4">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center text-3xl mb-3 shadow-lg shadow-emerald-500/20">
                    🎉
                  </div>
                  <h3 className="text-xl font-black mb-1">
                    {isHindi ? "बधाई! आप अब प्रो VIP सदस्य हैं" : "Congratulations! Pro Activated"}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
                    {isHindi
                      ? "आपके सभी फीचर्स सक्रिय हो चुके हैं — 4x कॉइन मल्टीप्लायर, अनलिमिटेड फुल मॉक टेस्ट्स और शून्य विज्ञापन।"
                      : "Your 4x Coin Multiplier, Unlimited Mock Tests and VIP status are now active across your account."}
                  </p>

                  <button
                    onClick={() => {
                      setShowCheckoutModal(false);
                      router.push("/");
                    }}
                    className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-wider shadow-md shadow-indigo-600/30"
                  >
                    {isHindi ? "सीखना शुरू करें (Start Learning)" : "Start Exploring"}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
    </div>
  );
}
