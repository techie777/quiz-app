"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { WifiOff, RefreshCw, Sparkles, BookOpen, ArrowRight, Zap, CheckCircle2 } from "lucide-react";
import toast from "react-hot-toast";

export default function OfflinePage() {
  const [isChecking, setIsChecking] = useState(false);
  const [isOnline, setIsOnline] = useState(false);
  const [recentCategories, setRecentCategories] = useState([]);

  useEffect(() => {
    // Detect initial online state
    if (typeof window !== "undefined") {
      setIsOnline(navigator.onLine);

      // Load cached/recent categories from localStorage
      try {
        const stored = JSON.parse(localStorage.getItem("quiz_recent_categories") || "[]");
        setRecentCategories(stored.slice(0, 4));
      } catch {
        setRecentCategories([]);
      }
    }

    const handleOnline = () => {
      setIsOnline(true);
      toast.success("इंटरनेट कनेक्शन पुनः स्थापित हो गया! पेज लोड हो रहा है...");
      setTimeout(() => {
        window.location.reload();
      }, 1200);
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast.error("इंटरनेट कनेक्शन कट गया है।");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const checkConnection = async () => {
    setIsChecking(true);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      const res = await fetch("/api/health", {
        method: "HEAD",
        cache: "no-store",
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (res.ok) {
        setIsOnline(true);
        toast.success("कनेक्शन एक्टिव है! पेज रीलोड हो रहा है...");
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        toast.error("सर्वर से संपर्क नहीं हो पाया। कृपया पुनः प्रयास करें।");
      }
    } catch {
      toast.error("अभी इंटरनेट कनेक्शन अनुपलब्ध है।");
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div className="min-h-[75vh] flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Decorative background glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/10 dark:bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 translate-y-1/2 w-80 h-80 bg-amber-500/10 dark:bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md mx-auto text-center relative z-10 space-y-6">
        {/* Status Icon */}
        <div className="relative inline-flex items-center justify-center">
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-amber-500/20 via-rose-500/15 to-indigo-500/20 dark:from-amber-500/10 dark:to-indigo-500/10 border border-amber-500/30 dark:border-amber-500/20 flex items-center justify-center shadow-xl shadow-amber-500/10">
            {isOnline ? (
              <CheckCircle2 className="w-12 h-12 text-emerald-500 animate-in zoom-in-75 duration-300" />
            ) : (
              <WifiOff className="w-12 h-12 text-amber-500 dark:text-amber-400" />
            )}
          </div>
          <span className="absolute -bottom-1 -right-1 flex h-4 w-4">
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                isOnline ? "bg-emerald-400" : "bg-amber-400"
              }`}
            />
            <span
              className={`relative inline-flex rounded-full h-4 w-4 ${
                isOnline ? "bg-emerald-500" : "bg-amber-500"
              }`}
            />
          </span>
        </div>

        {/* Headings */}
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            {isOnline ? "कनेक्शन बहाल हो गया!" : "आप अभी ऑफ़लाइन हैं"}
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
            {isOnline
              ? "आपका डिवाइस इंटरनेट से जुड़ चुका है। कुछ ही पलों में पेज रीफ्रेश हो जाएगा।"
              : "इंटरनेट कनेक्शन बाधित है। चिंता न करें, आपका पिछला प्रोग्रेस आपके डिवाइस में सुरक्षित है।"}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            onClick={checkConnection}
            disabled={isChecking}
            className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-sm shadow-lg shadow-indigo-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
          >
            <RefreshCw className={`w-4 h-4 ${isChecking ? "animate-spin" : ""}`} />
            <span>{isChecking ? "जांच की जा रही है..." : "पुनः प्रयास करें (Retry)"}</span>
          </button>

          <Link
            href="/"
            className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-sm transition-all flex items-center justify-center gap-2"
          >
            होमपेज पर जाएं
          </Link>
        </div>

        {/* Offline Tips / Recent Topics */}
        {recentCategories.length > 0 && (
          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 text-left space-y-3 shadow-xs">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span>हाल ही में खोले गए विषय</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {recentCategories.map((slug) => (
                <Link
                  key={slug}
                  href={`/category/${slug}`}
                  className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 border border-slate-200/60 dark:border-slate-700/60 transition group flex items-center justify-between"
                >
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 capitalize truncate">
                    {slug.replace(/-/g, " ")}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Offline Security Note */}
        <div className="p-4 rounded-2xl bg-slate-100/60 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 space-y-1">
          <p className="font-semibold text-slate-700 dark:text-slate-300">💡 स्मार्ट ऑफ़लाइन सुरक्षा</p>
          <p>
            जैसे ही आपका नेटवर्क दोबारा कनेक्ट होगा, आपके पूरे अंक और हल किए गए क्विज़ अपने-आप सिंक हो जाएंगे।
          </p>
        </div>
      </div>
    </div>
  );
}
