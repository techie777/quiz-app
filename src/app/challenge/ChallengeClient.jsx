"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { parseChallengeCode } from "@/lib/gameLayer";
import { useQuiz } from "@/context/QuizContext";
import { useLanguage } from "@/context/LanguageContext";
import { useData } from "@/context/DataContext";
import { Swords, Trophy, ArrowRight, Sparkles, Loader2, Share2 } from "lucide-react";
import toast from "react-hot-toast";

export default function ChallengeClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { startMixedQuiz } = useQuiz();
  const { isHindi } = useLanguage();
  const { quizzes } = useData();

  const [loading, setLoading] = useState(false);
  const [challengeData, setChallengeData] = useState(null);

  useEffect(() => {
    const code = searchParams.get("code");
    if (code) {
      const parsed = parseChallengeCode(code);
      if (parsed) {
        setChallengeData(parsed);
        return;
      }
    }

    // Direct param fallbacks
    const cat = searchParams.get("cat") || "bollywood-gk";
    const score = parseInt(searchParams.get("score") || "8", 10);
    const total = parseInt(searchParams.get("total") || "10", 10);
    const name = searchParams.get("name") || "Quizzer";
    const seed = searchParams.get("seed") || "123456";

    setChallengeData({
      categorySlug: cat,
      categoryName: isHindi ? "क्विज़ मुकाबला" : "Quiz Challenge",
      challengerScore: score,
      totalQuestions: total,
      challengerName: name,
      seed,
    });
  }, [searchParams, isHindi]);

  const handleStartChallenge = async () => {
    if (!challengeData || loading) return;
    setLoading(true);

    try {
      // 1. Fetch matching category or questions
      const count = challengeData.totalQuestions || 10;
      const res = await fetch("/api/arena/select", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categories: [challengeData.categorySlug],
          count,
          seed: challengeData.seed,
          language: isHindi ? "hi" : "en",
        }),
      });

      let challengeQuestions = [];
      if (res.ok) {
        const json = await res.json();
        challengeQuestions = json.questions || [];
      }

      // Fallback: match from DataContext
      if (challengeQuestions.length === 0 && Array.isArray(quizzes)) {
        const match = quizzes.find(
          (q) => q.slug === challengeData.categorySlug || q.id === challengeData.categorySlug
        );
        if (match && Array.isArray(match.questions) && match.questions.length > 0) {
          challengeQuestions = match.questions.slice(0, count);
        }
      }

      if (challengeQuestions.length === 0) {
        throw new Error("Could not load challenge questions");
      }

      // Save active challenge for Head-to-Head results comparison
      try {
        sessionStorage.setItem(
          "quizweb_active_challenge",
          JSON.stringify({
            challengerName: challengeData.challengerName,
            challengerScore: challengeData.challengerScore,
            totalQuestions: challengeData.totalQuestions,
            categoryName: challengeData.categoryName,
          })
        );
      } catch {}

      const title = isHindi
        ? `चुनौती: ${challengeData.categoryName}`
        : `Challenge: ${challengeData.categoryName}`;

      startMixedQuiz(challengeQuestions, title, 20, "ALL", isHindi ? "hi" : "en");
      router.push("/quiz/arena");
    } catch (err) {
      console.error("Challenge launch error:", err);
      toast.error(isHindi ? "चुनौती लोड करने में विफल" : "Failed to load challenge");
      setLoading(false);
    }
  };

  if (!challengeData) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center select-none">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-3" />
        <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
          {isHindi ? "चुनौती लोड हो रही है..." : "Loading Challenge..."}
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto px-4 py-8 sm:py-12 select-none">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-6 sm:p-8 text-center shadow-xl shadow-purple-500/5 relative overflow-hidden">
        {/* Top Decorative Swords Badge */}
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-500 to-indigo-600 text-white mx-auto flex items-center justify-center shadow-lg shadow-purple-500/25 mb-4">
          <Swords size={32} />
        </div>

        {/* Challenge Header */}
        <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800 inline-block mb-2">
          {isHindi ? "⚔️ 1-ऑन-1 क्विज़ चुनौती" : "⚔️ 1v1 Quiz Challenge"}
        </span>

        <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-2">
          {challengeData.challengerName} {isHindi ? "ने आपको चुनौती दी है!" : "has challenged you!"}
        </h1>

        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mb-6 font-medium">
          {isHindi
            ? `विषय: ${challengeData.categoryName} में ${challengeData.totalQuestions} प्रश्नों का समान सेट!`
            : `Identical set of ${challengeData.totalQuestions} questions in ${challengeData.categoryName}!`}
        </p>

        {/* Challenger Score Box */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-50/80 via-purple-50/60 to-pink-50/80 dark:from-slate-800/80 dark:via-purple-950/30 dark:to-slate-800/80 border border-indigo-100 dark:border-slate-700 mb-6">
          <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
            {isHindi ? "पछाड़ देने वाला स्कोर (Score to Beat)" : "Score to Beat"}
          </span>
          <div className="flex items-baseline justify-center gap-1.5">
            <span className="text-4xl sm:text-5xl font-black text-purple-600 dark:text-purple-400">
              {challengeData.challengerScore}
            </span>
            <span className="text-2xl font-light text-slate-400">/</span>
            <span className="text-2xl font-bold text-slate-600 dark:text-slate-300">
              {challengeData.totalQuestions}
            </span>
          </div>
        </div>

        {/* Primary Accept Challenge Button */}
        <button
          type="button"
          onClick={handleStartChallenge}
          disabled={loading}
          className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-indigo-700 hover:from-purple-700 hover:to-indigo-800 text-white font-black text-sm sm:text-base shadow-lg shadow-purple-600/25 active:scale-95 transition-all flex items-center justify-center gap-2 mb-3 cursor-pointer"
        >
          {loading ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              <span>{isHindi ? "चुनौती तैयार हो रही है..." : "Preparing Duel..."}</span>
            </>
          ) : (
            <>
              <Sparkles size={18} className="fill-white" />
              <span>{isHindi ? "चुनौती स्वीकार करें व खेलें" : "Accept & Play Challenge"}</span>
              <ArrowRight size={18} />
            </>
          )}
        </button>

        {/* Home Link */}
        <button
          type="button"
          onClick={() => router.push("/")}
          className="text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
        >
          ← {isHindi ? "होम पर वापस जाएं" : "Back to Home"}
        </button>
      </div>
    </div>
  );
}
