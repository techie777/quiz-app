"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuiz } from "@/context/QuizContext";
import { useLanguage } from "@/context/LanguageContext";
import toast from "react-hot-toast";

export default function PlayRedirectPage() {
  const router = useRouter();
  const { startMixedQuiz } = useQuiz();
  const { isHindi } = useLanguage();
  const [error, setError] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function launchQuickQuiz() {
      try {
        let preferredCats = "";
        try {
          const stored = localStorage.getItem("quiz_recent_categories");
          if (stored) {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed) && parsed.length > 0) {
              preferredCats = parsed.join(",");
            }
          }
        } catch {}

        const res = await fetch(`/api/quiz/quick-play?count=10&categories=${encodeURIComponent(preferredCats)}`, {
          cache: "no-store",
        });

        if (!res.ok) throw new Error("Failed to fetch questions");
        const data = await res.json();

        if (!data.questions || data.questions.length === 0) {
          throw new Error("No questions returned");
        }

        if (isMounted) {
          const title = isHindi ? "क्विक क्विज़" : "Quick Quiz";
          startMixedQuiz(data.questions, title, 30, "ALL", isHindi ? "hi" : "en");
          router.replace("/quiz/quick");
        }
      } catch (err) {
        console.error("Quick play error:", err);
        if (isMounted) {
          setError(true);
          toast.error(isHindi ? "क्विज़ लोड करने में विफल" : "Failed to start quick quiz");
          router.replace("/");
        }
      }
    }

    launchQuickQuiz();

    return () => {
      isMounted = false;
    };
  }, [router, startMixedQuiz, isHindi]);

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 bg-slate-950 text-white">
      <div className="flex flex-col items-center justify-center p-8 rounded-3xl bg-slate-900/90 border border-slate-800/80 backdrop-blur-md shadow-2xl space-y-4 max-w-sm w-full text-center">
        <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
        <p className="text-base font-bold text-white tracking-wide">
          {isHindi ? "क्विक क्विज़ शुरू हो रहा है..." : "Starting Quick Quiz..."}
        </p>
      </div>
    </div>
  );
}
