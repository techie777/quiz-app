"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Play, Sparkles, BookOpen, Layers, CheckCircle, ChevronRight, Loader2, ArrowRight } from "lucide-react";
import { useQuiz } from "@/context/QuizContext";
import { useLanguage } from "@/context/LanguageContext";
import toast from "react-hot-toast";

export default function HubSetsClient({
  sets = [],
  title,
  titleHi,
  description,
  descriptionHi,
  slug,
  type = "topic",
  questionCount = 0,
}) {
  const router = useRouter();
  const { startQuizSet } = useQuiz();
  const { isHindi } = useLanguage();
  const [loadingSetId, setLoadingSetId] = useState(null);

  const displayTitle = isHindi && titleHi ? titleHi : title;
  const displayDesc = isHindi && descriptionHi ? descriptionHi : description;

  const handlePlaySet = async (quizSet) => {
    if (loadingSetId) return;
    setLoadingSetId(quizSet._id);

    try {
      const res = await fetch(`/api/sets?setId=${quizSet._id}`);
      if (!res.ok) throw new Error("Failed to load set questions");
      const data = await res.json();

      if (!data.set || !Array.isArray(data.set.questions) || data.set.questions.length === 0) {
        throw new Error("No questions available in this set");
      }

      const questions = data.set.questions;
      const targetLang = isHindi ? "hi" : "en";
      const setDisplayName = isHindi ? (quizSet.titleHi || `सेट ${quizSet.setIndex}`) : (quizSet.title || `Set ${quizSet.setIndex}`);
      const categoryName = `${displayTitle} · ${setDisplayName}`;

      startQuizSet(
        slug,
        questions,
        30,
        targetLang,
        quizSet.setIndex,
        categoryName,
        true
      );

      router.push(`/quiz/${slug}`);
    } catch (err) {
      console.error("Failed to start set:", err);
      toast.error(isHindi ? "सेट लोड करने में विफल" : "Failed to start quiz set");
      setLoadingSetId(null);
    }
  };

  const handlePlayFirstSet = () => {
    if (sets.length > 0) {
      handlePlaySet(sets[0]);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-8">
      {/* Top Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900/95 to-slate-950 border border-slate-800/80 p-6 sm:p-10 shadow-2xl backdrop-blur-xl mb-10">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-12 -ml-12 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isHindi ? "प्रश्नोत्तरी हब" : "Quiz Hub"}</span>
              <span>·</span>
              <span className="capitalize">{type}</span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight leading-tight">
              {title}
              {titleHi && (
                <span className="block text-xl sm:text-2xl text-slate-400 font-medium mt-1">
                  {titleHi}
                </span>
              )}
            </h1>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              {displayDesc}
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2 text-xs sm:text-sm text-slate-400">
              <span className="flex items-center gap-1.5 font-medium">
                <Layers className="w-4 h-4 text-indigo-400" />
                {sets.length} {isHindi ? "सेट उपलब्ध" : "Sets Available"}
              </span>
              <span className="flex items-center gap-1.5 font-medium">
                <BookOpen className="w-4 h-4 text-emerald-400" />
                {questionCount || sets.length * 20} {isHindi ? "कुल प्रश्न" : "Total Questions"}
              </span>
              <span className="flex items-center gap-1.5 font-medium text-amber-400">
                <CheckCircle className="w-4 h-4" />
                20 Qs {isHindi ? "प्रति सेट" : "Per Set"}
              </span>
            </div>
          </div>

          {/* Primary Action Button */}
          {sets.length > 0 ? (
            <div className="flex-shrink-0">
              <button
                onClick={handlePlayFirstSet}
                disabled={loadingSetId !== null}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-indigo-500 via-indigo-600 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold text-base shadow-xl shadow-indigo-500/25 transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50"
              >
                {loadingSetId === sets[0]._id ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Play className="w-5 h-5 fill-white" />
                )}
                <span>{isHindi ? "यह क्विज़ खेलें" : "Play this quiz"}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : null}
        </div>
      </div>

      {/* Sets List Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <span>{isHindi ? "उपलब्ध प्रश्न सेट" : "Available Question Sets"}</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
              {sets.length}
            </span>
          </h2>
          <span className="text-xs text-slate-400">
            {isHindi ? "7 आसान · 7 मध्यम · 6 कठिन" : "7 Easy · 7 Medium · 6 Hard"}
          </span>
        </div>

        {sets.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-800 p-12 text-center bg-slate-900/40">
            <BookOpen className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-300">
              {isHindi ? "और प्रश्न सेट जल्द आ रहे हैं" : "More sets coming soon"}
            </h3>
            <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
              {isHindi
                ? "इस विषय पर नए प्रश्नों का संग्रह तैयार किया जा रहा है। आप अन्य विषयों के क्विज़ आज़मा सकते हैं।"
                : "Questions for this topic are being curated. In the meantime, explore other topics in QuizWeb!"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sets.map((s) => {
              const isCurrentLoading = loadingSetId === s._id;
              const setLabel = isHindi ? (s.titleHi || `सेट ${s.setIndex}`) : (s.title || `Set ${s.setIndex}`);
              const bd = s.difficultyBreakdown || { easy: 7, medium: 7, hard: 6 };

              return (
                <div
                  key={s._id}
                  className="group relative rounded-2xl bg-slate-900/80 hover:bg-slate-850 border border-slate-800/80 hover:border-indigo-500/40 p-5 transition-all duration-200 flex flex-col justify-between shadow-lg"
                >
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-base font-bold text-white group-hover:text-indigo-300 transition-colors">
                          {setLabel}
                        </span>
                        <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                          {s.questionCount || 20} Qs
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        {isHindi
                          ? `संतुलित परीक्षा स्तर: ${bd.easy} आसान · ${bd.medium} मध्यम · ${bd.hard} कठिन`
                          : `Balanced Exam Format: ${bd.easy} Easy · ${bd.medium} Med · ${bd.hard} Hard`}
                      </p>
                    </div>

                    <div className="w-8 h-8 rounded-full bg-slate-800/60 group-hover:bg-indigo-500/20 text-slate-400 group-hover:text-indigo-400 flex items-center justify-center flex-shrink-0 transition-colors">
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-800/60">
                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                      <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
                      <span>{isHindi ? "सत्यापित प्रश्न" : "Verified Questions"}</span>
                    </div>

                    <button
                      onClick={() => handlePlaySet(s)}
                      disabled={loadingSetId !== null}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-indigo-600 text-white text-xs font-semibold transition-all duration-150 disabled:opacity-50"
                    >
                      {isCurrentLoading ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Play className="w-3.5 h-3.5 fill-white" />
                      )}
                      <span>{isHindi ? "खेलें" : "Play"}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
