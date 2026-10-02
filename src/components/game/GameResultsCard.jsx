"use client";

import React, { useState } from "react";
import { 
  Swords, 
  Trophy, 
  Flame, 
  Shield, 
  Snowflake, 
  Sparkles, 
  Share2, 
  CheckCircle2, 
  Target, 
  Lightbulb, 
  Copy, 
  Check 
} from "lucide-react";
import toast from "react-hot-toast";

export default function GameResultsCard({
  gameResult,
  headToHead,
  onChallengeFriend,
  isHindi = true,
  score = 0,
  total = 0,
}) {
  const [copied, setCopied] = useState(false);

  if (!gameResult) return null;

  const {
    earnedXP = 0,
    breakdown = {},
    totalXP = 0,
    newLevel: rawNewLevel,
    leveledUp = false,
    streak: rawStreak,
    isDailyGoalMet = false,
    recapFacts = [],
    weakTopicHint = null,
  } = gameResult;

  const newLevel = {
    id: rawNewLevel?.id || 1,
    name: rawNewLevel?.name || "जिज्ञासु",
    nameEn: rawNewLevel?.nameEn || "Curious",
    color: rawNewLevel?.color || "#10B981",
    icon: rawNewLevel?.icon || "🌱",
    progressPct: typeof rawNewLevel?.progressPct === "number" ? rawNewLevel.progressPct : 0,
    xpToNext: rawNewLevel?.xpToNext ?? 500,
    isMaxLevel: Boolean(rawNewLevel?.isMaxLevel),
  };
  const streak = {
    count: rawStreak?.count ?? 1,
    freezes: rawStreak?.freezes ?? 1,
    protectedWithFreeze: Boolean(rawStreak?.protectedWithFreeze),
  };
  const safeRecapFacts = Array.isArray(recapFacts) ? recapFacts : [];

  const handleShareClick = async () => {
    if (onChallengeFriend) {
      await onChallengeFriend();
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  return (
    <div className="w-full space-y-4 my-6 select-none animate-in fade-in duration-300">
      {/* 1. Head-to-Head Duel Comparison Banner (when challenge is active) */}
      {headToHead && (
        <div className={`p-4 sm:p-5 rounded-2xl border ${
          headToHead.isWin
            ? "bg-emerald-50/90 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-100"
            : headToHead.isTie
            ? "bg-indigo-50/90 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-800 text-indigo-900 dark:text-indigo-100"
            : "bg-purple-50/90 dark:bg-purple-950/40 border-purple-300 dark:border-purple-800 text-purple-900 dark:text-purple-100"
        } shadow-sm transition-all`}>
          <div className="flex items-center gap-2 mb-2 font-black text-xs uppercase tracking-wider">
            <Swords size={16} />
            <span>{isHindi ? "⚔️ 1-ऑन-1 द्वंद्व परिणाम (Duel Outcome)" : "⚔️ 1v1 Duel Result"}</span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base sm:text-lg font-black tracking-tight">
                {headToHead.isWin
                  ? (isHindi ? `🎉 शानदार जीत! आपने ${headToHead.challengerName} को हरा दिया!` : `🎉 Victory! You defeated ${headToHead.challengerName}!`)
                  : headToHead.isTie
                  ? (isHindi ? `🤝 रोमांचक टाई मुकाबला! दोनों का स्कोर बराबर रहा!` : `🤝 Exciting Tie! You matched ${headToHead.challengerName}'s score!`)
                  : (isHindi ? `⚔️ कड़ा मुकाबला! ${headToHead.challengerName} इस बार आगे रहे!` : `⚔️ Close Match! ${headToHead.challengerName} took the win this time!`)}
              </h3>
              <p className="text-xs sm:text-sm font-semibold opacity-90 mt-0.5">
                {isHindi ? "आपका स्कोर" : "Your Score"}: <span className="font-black">{headToHead.userScore}/{headToHead.totalQuestions}</span>
                {" vs "}
                {headToHead.challengerName}: <span className="font-black">{headToHead.challengerScore}/{headToHead.totalQuestions}</span>
              </p>
            </div>

            <button
              type="button"
              onClick={handleShareClick}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-extrabold text-xs shadow-sm hover:opacity-90 active:scale-95 transition-all shrink-0"
            >
              <Share2 size={14} />
              <span>{isHindi ? "नया मुकाबला भेजें" : "Rematch / Share"}</span>
            </button>
          </div>
        </div>
      )}

      {/* 2. XP & 5-Tier Level Progression Card */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
        {/* Level Up Flash Indicator */}
        {leveledUp && (
          <div className="mb-3 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-orange-400 text-slate-900 text-xs font-black flex items-center gap-2 shadow-sm animate-bounce">
            <span>🎉</span>
            <span>{isHindi ? `बधाई! आप स्तर ${newLevel.id} (${newLevel.name}) पर पहुँच गए!` : `Level Up! You reached Level ${newLevel.id} (${newLevel.nameEn})!`}</span>
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            {/* Level Avatar Badge */}
            <div 
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-inner border border-slate-200 dark:border-slate-700"
              style={{ backgroundColor: `${newLevel.color}20` }}
            >
              <span>{newLevel.icon}</span>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                  {isHindi ? newLevel.name : newLevel.nameEn}
                </span>
                <span 
                  className="px-2 py-0.5 rounded-full text-[11px] font-black text-white"
                  style={{ backgroundColor: newLevel.color }}
                >
                  {isHindi ? `स्तर ${newLevel.id}` : `Level ${newLevel.id}`}
                </span>
              </div>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                {totalXP} {isHindi ? "ज्ञान अंक (XP)" : "Total XP"}
              </p>
            </div>
          </div>

          {/* Earned XP Pill */}
          <div className="self-start sm:self-auto px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs font-black flex items-center gap-1.5">
            <Sparkles size={14} className="text-amber-500" />
            <span>+{earnedXP} XP {isHindi ? "अर्जित" : "Earned"}</span>
          </div>
        </div>

        {/* Level Progress Bar */}
        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden mb-2">
          <div
            className="h-2.5 rounded-full transition-all duration-1000 ease-out"
            style={{ 
              width: `${newLevel.progressPct}%`,
              backgroundColor: newLevel.color || "#6366F1",
            }}
          />
        </div>

        <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-4">
          <span>{newLevel.progressPct}% {isHindi ? "प्रगति" : "Progress"}</span>
          <span>
            {newLevel.isMaxLevel
              ? (isHindi ? "सर्वोच्च स्तर (Grandmaster)" : "Max Level reached")
              : (isHindi ? `${newLevel.xpToNext} XP अगले स्तर के लिए` : `${newLevel.xpToNext} XP to next level`)}
          </span>
        </div>

        {/* Gamification Sub-Row: Streak & Daily Goal */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
          {/* Streak Badge */}
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 font-bold border border-amber-200/80 dark:border-amber-800">
            <Flame size={14} className="text-amber-500" />
            <span>{streak.count} {isHindi ? "दिन की स्ट्रीक" : "Day Streak"}</span>
            {streak.freezes > 0 && (
              <span className="text-[10px] opacity-80 inline-flex items-center gap-0.5 ml-1">
                <Snowflake size={11} className="text-sky-500" /> {streak.freezes}
              </span>
            )}
          </div>

          {/* Daily Goal Badge */}
          <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-bold border ${
            isDailyGoalMet
              ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700"
          }`}>
            <Target size={14} className={isDailyGoalMet ? "text-emerald-600" : "text-slate-400"} />
            <span>
              {isDailyGoalMet
                ? (isHindi ? "दैनिक लक्ष्य पूर्ण! ✨" : "Daily Goal Met! ✨")
                : (isHindi ? "दैनिक लक्ष्य: जारी रखें" : "Daily Goal in progress")}
            </span>
          </div>

          {/* Streak Freeze Alert if used */}
          {streak.protectedWithFreeze && (
            <div className="w-full mt-1 px-3 py-1 rounded-lg bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300 text-[11px] font-bold flex items-center gap-1.5 border border-sky-200 dark:border-sky-800">
              <Shield size={12} className="text-sky-500" />
              <span>{isHindi ? "स्ट्रीक फ़्रीज़ ने आज आपकी निरंतरता सुरक्षित रखी!" : "Streak Freeze preserved your streak today!"}</span>
            </div>
          )}
        </div>
      </div>

      {/* 3. 3-Fact Recap ("३ रोचक तथ्य / 3 Key Takeaways") */}
      {safeRecapFacts.length > 0 && (
        <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-50/70 via-white to-amber-50/40 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800/80 border border-indigo-100 dark:border-slate-800 shadow-sm text-left">
          <div className="flex items-center gap-2 mb-3">
            <span className="p-1.5 rounded-lg bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400">
              <Lightbulb size={16} />
            </span>
            <h4 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">
              {isHindi ? "३ रोचक तथ्य (Key Takeaways)" : "3 Key Takeaways from this Quiz"}
            </h4>
          </div>

          <div className="space-y-2">
            {safeRecapFacts.slice(0, 3).map((fact, idx) => (
              <div 
                key={idx}
                className="flex items-start gap-2.5 p-3 rounded-xl bg-white/90 dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700/60 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium"
              >
                <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-black text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <span className="flex-1">{fact}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. Weak-Topic Hint ("सुधार का सुझाव / Focus Area") */}
      {weakTopicHint && (
        <div className="p-4 rounded-2xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/60 text-left flex items-start gap-3 shadow-2xs">
          <span className="text-lg shrink-0 mt-0.5">🌱</span>
          <div className="text-xs sm:text-sm font-semibold text-amber-900 dark:text-amber-200 leading-relaxed">
            {weakTopicHint}
          </div>
        </div>
      )}

      {/* 5. Challenge a Friend Card (1v1 Seeded Duel) */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-purple-500/10 via-indigo-500/10 to-pink-500/10 dark:from-purple-950/40 dark:via-indigo-950/40 dark:to-pink-950/40 border border-purple-200/80 dark:border-purple-800/80 text-center relative overflow-hidden">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white mx-auto flex items-center justify-center mb-2 shadow-sm">
          <Swords size={20} />
        </div>

        <h4 className="text-sm sm:text-base font-black text-slate-900 dark:text-white mb-1">
          {isHindi ? "मित्र को 1-ऑन-1 चुनौती दें!" : "Challenge a Friend (1v1 Duel)!"}
        </h4>
        <p className="text-xs text-slate-600 dark:text-slate-400 max-w-sm mx-auto mb-4 font-medium">
          {isHindi
            ? `क्या आपका मित्र आपके ${total} में से ${score} अंक के स्कोर को हरा सकता है? लिंक साझा करें और देखें कौन जीतता है!`
            : `Think your friend can beat your score of ${score}/${total}? Share this seeded duel link to find out!`
          }
        </p>

        <button
          type="button"
          onClick={handleShareClick}
          className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-extrabold text-xs sm:text-sm shadow-md shadow-purple-600/20 active:scale-95 transition-all cursor-pointer"
        >
          {copied ? <Check size={16} /> : <Share2 size={16} />}
          <span>
            {copied
              ? (isHindi ? "चुनौती लिंक कॉपी हो गया!" : "Challenge Link Copied!")
              : (isHindi ? "व्हाट्सएप / मित्र को चुनौती भेजें" : "Share Challenge to Friend")}
          </span>
        </button>
      </div>
    </div>
  );
}
