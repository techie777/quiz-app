"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Sparkles, ChevronRight, Layers, Target, TrendingUp } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { useTier } from "@/context/TierContext";

export default function NextUpRecommendations({
  currentTopicId,
  currentCategoryId,
  currentSetIndex = 1,
  score = 0,
  total = 20,
  userId,
}) {
  const { isHindi } = useLanguage();
  const { tier } = useTier();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadRecommendations() {
      try {
        const params = new URLSearchParams({
          score: String(score),
          total: String(total),
          tier: tier || "adults",
          currentSetIndex: String(currentSetIndex),
        });
        if (currentTopicId) params.set("currentTopicId", String(currentTopicId));
        if (currentCategoryId) params.set("currentCategoryId", String(currentCategoryId));
        if (userId) params.set("userId", String(userId));

        const res = await fetch(`/api/recommendations?${params.toString()}`);
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (err) {
        console.warn("Recommendations fetch error:", err);
      } finally {
        setLoading(false);
      }
    }

    loadRecommendations();
  }, [currentTopicId, currentCategoryId, currentSetIndex, score, total, tier, userId]);

  if (loading) {
    return (
      <div className="w-full mt-10 p-4">
        <div className="h-6 w-36 bg-slate-800/80 rounded-lg animate-pulse mb-4" />
        <div className="flex gap-4 overflow-hidden">
          {[1, 2, 3].map((i) => (
            <div key={i} className="min-w-[240px] h-32 rounded-2xl bg-slate-900 border border-slate-800 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const cards = data?.cards || [];
  if (cards.length === 0) return null;

  const headline = isHindi && data?.headlineHi ? data.headlineHi : (data?.headline || "Next up");

  const diffColors = {
    easy: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    medium: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    hard: "bg-rose-500/10 text-rose-400 border-rose-500/20",
  };

  const badgeGradients = {
    indigo: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
    emerald: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    amber: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    rose: "bg-rose-500/10 text-rose-400 border-rose-500/20",
  };

  return (
    <div className="w-full mt-10 pt-8 border-t border-slate-800/80">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 px-1">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
            {headline}
          </h2>
        </div>
        <Link
          href="/quizzes"
          className="text-xs font-semibold text-slate-400 hover:text-indigo-400 transition-colors flex items-center gap-1"
        >
          <span>{isHindi ? "सभी देखें" : "Browse all"}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Horizontally scrollable snap container */}
      <div className="flex gap-4 overflow-x-auto pb-4 pt-1 snap-x snap-mandatory no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
        {cards.map((card) => {
          const title = isHindi && card.titleHi ? card.titleHi : card.title;
          const meta = isHindi && card.metaHi ? card.metaHi : card.meta;
          const badgeText = isHindi && card.badgeHi ? card.badgeHi : card.badge;
          const diffClass = diffColors[card.difficulty] || diffColors.medium;
          const badgeClass = badgeGradients[card.badgeColor] || badgeGradients.indigo;

          return (
            <Link
              key={card.id}
              href={card.href}
              className="group flex-shrink-0 w-[240px] sm:w-[260px] snap-start rounded-2xl bg-slate-900/90 hover:bg-slate-850 border border-slate-800/80 hover:border-indigo-500/40 p-4 transition-all duration-200 flex flex-col justify-between shadow-lg hover:shadow-xl"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-2xl">{card.icon || "📚"}</span>
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${badgeClass}`}>
                    {badgeText}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors line-clamp-2 leading-snug">
                  {title}
                </h3>
              </div>

              <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-800/60">
                <span className="text-xs text-slate-400 font-medium">
                  {meta}
                </span>
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${diffClass}`}>
                  {card.difficulty}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
