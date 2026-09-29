"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Play,
  Eye,
  Share2,
  Star,
  CheckCircle2,
  RefreshCw,
  Sparkles,
  ChevronRight,
  BookOpen,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { useQuiz } from "@/context/QuizContext";
import { shareQuiz } from "@/lib/shareHelper";
import SetPreviewModal from "@/components/SetPreviewModal";
import toast, { Toaster } from "react-hot-toast";

export default function GkTopicSetsPage() {
  const params = useParams();
  const router = useRouter();
  const { isHindi } = useLanguage();
  const { startQuizSet } = useQuiz();

  const rawCategory = params.category || "india";
  const categoryTitle = rawCategory.toLowerCase().includes("world") ? "World GK" : "India GK";
  const topicId = params.topicId;

  const [topicData, setTopicData] = useState(null);
  const [sets, setSets] = useState([]);
  const [loading, setLoading] = useState(true);

  // Preview modal state
  const [previewModalData, setPreviewModalData] = useState(null);
  const [loadingPreviewId, setLoadingPreviewId] = useState(null);

  const currentLang = isHindi ? "hi" : "en";

  useEffect(() => {
    let isCancelled = false;
    async function loadTopicSets() {
      setLoading(true);
      try {
        let deviceId = "";
        try {
          deviceId = localStorage.getItem("quizweb_device_id") || "";
        } catch {}

        const res = await fetch(
          `/api/gk/topic-sets?topicId=${encodeURIComponent(topicId)}&language=${currentLang}&deviceId=${deviceId}`
        );
        const data = await res.json();
        if (!isCancelled && res.ok) {
          setTopicData(data.topic);
          setSets(data.sets || []);
        }
      } catch (err) {
        console.error("Failed to load topic sets:", err);
      } finally {
        if (!isCancelled) setLoading(false);
      }
    }
    loadTopicSets();
    return () => {
      isCancelled = true;
    };
  }, [topicId, currentLang]);

  const handlePlaySet = async (setDoc) => {
    try {
      const res = await fetch(`/api/gk/topic-sets?setId=${setDoc.id}&language=${currentLang}`);
      const data = await res.json();
      if (!res.ok || !data.questions || data.questions.length === 0) {
        toast.error(isHindi ? "प्रश्न लोड करने में त्रुटि" : "Could not load questions for this set");
        return;
      }

      const topicName = isHindi && topicData?.nameHi ? topicData.nameHi : topicData?.name || "GK Topic";
      startQuizSet(
        setDoc.id,
        data.questions,
        30,
        currentLang,
        setDoc.number,
        topicName
      );
      router.push(`/quiz/${setDoc.id}`);
    } catch (err) {
      toast.error(isHindi ? "क्विज़ शुरू करने में त्रुटि" : "Failed to launch quiz set");
    }
  };

  const handleOpenPreview = async (setDoc) => {
    setLoadingPreviewId(setDoc.id);
    try {
      const res = await fetch(`/api/gk/topic-sets?setId=${setDoc.id}&language=${currentLang}`);
      const data = await res.json();
      if (res.ok && data.questions) {
        setPreviewModalData({
          set: {
            ...setDoc,
            index: setDoc.number,
            questions: data.questions,
          },
          categoryTopic: topicData?.name || categoryTitle,
        });
      } else {
        toast.error("Could not load preview");
      }
    } catch {
      toast.error("Preview failed");
    } finally {
      setLoadingPreviewId(null);
    }
  };

  const topicName = isHindi && topicData?.nameHi ? topicData.nameHi : topicData?.name || "GK Topic";
  const completedSets = sets.filter((s) => s.completed).length;
  const progressPct = sets.length > 0 ? Math.round((completedSets / sets.length) * 100) : 0;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-24 text-slate-900 dark:text-white select-none">
      <Toaster position="top-center" />

      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-black text-slate-700 dark:text-slate-200 transition-colors"
          >
            <ArrowLeft size={14} />
            <span>{isHindi ? "पीछे जाएं" : "Back"}</span>
          </button>

          <span className="text-xs font-black text-purple-600 dark:text-purple-400">
            {categoryTitle}
          </span>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-5 space-y-5">
        {/* Topic Header Hero Card */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-2xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 flex items-center justify-center text-3xl shrink-0">
              {topicData?.icon || "🏛️"}
            </div>
            <div>
              <span className="text-[10px] font-black uppercase text-purple-600 tracking-wider">
                {categoryTitle} · {isHindi ? "विषय" : "Topic"}
              </span>
              <h1 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white leading-snug">
                {topicName}
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                {sets.length} {isHindi ? "सेट्स" : "Sets"} · {sets.length * 20} {isHindi ? "प्रश्न" : "Questions"}
              </p>
            </div>
          </div>

          {/* Progress Pill */}
          <div className="w-full sm:w-auto p-3 rounded-2xl bg-purple-50 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900/40">
            <div className="flex items-center justify-between gap-4 text-xs font-black text-purple-900 dark:text-purple-200 mb-1">
              <span>{isHindi ? "प्रगति" : "Progress"}</span>
              <span>{completedSets} / {sets.length} {isHindi ? "पूर्ण" : "done"}</span>
            </div>
            <div className="w-36 h-2 rounded-full bg-purple-200/60 dark:bg-purple-800/40 overflow-hidden">
              <div
                className="h-full bg-purple-600 rounded-full transition-all duration-300"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        </div>

        {/* Sets List */}
        {loading ? (
          <div className="py-20 text-center space-y-2">
            <RefreshCw size={24} className="animate-spin mx-auto text-purple-600" />
            <p className="text-xs font-bold text-slate-400">Loading sets...</p>
          </div>
        ) : sets.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-xs font-bold bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800">
            {isHindi ? "इस भाषा में अभी कोई सेट उपलब्ध नहीं है" : "No sets available in this language yet"}
          </div>
        ) : (
          <div className="space-y-3">
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-500">
              {isHindi ? "अभ्यास सेट्स (20 प्रश्न प्रति सेट)" : "Practice Sets (20 Qs each)"}
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {sets.map((s) => (
                <div
                  key={s.id}
                  className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 hover:border-slate-300 transition-all flex flex-col justify-between space-y-3"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                        <span>{isHindi ? `सेट ${s.number}` : `Set ${s.number}`}</span>
                        {s.completed && <CheckCircle2 size={13} className="text-emerald-500" />}
                      </span>

                      <div className="flex items-center gap-1 text-[10px] text-slate-400 font-bold">
                        <div className="flex items-center gap-0.5 text-amber-500">
                          {[1, 2, 3].map((starIdx) => (
                            <Star
                              key={starIdx}
                              size={11}
                              fill={starIdx <= (s.stars || 0) ? "currentColor" : "none"}
                              strokeWidth={2}
                            />
                          ))}
                        </div>
                        {s.bestScore > 0 && <span>· {s.bestScore}/20</span>}
                      </div>
                    </div>

                    {/* Tags line */}
                    <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 line-clamp-1">
                      {s.tags?.length > 0 ? s.tags.join(" · ") : topicName}
                    </p>

                    {/* Difficulty Mix Bar (7/7/6) */}
                    <div className="w-full h-1.5 rounded-full overflow-hidden flex bg-slate-100 dark:bg-slate-800 mt-2">
                      <div style={{ width: `${((s.mix?.easy || 0) / 20) * 100}%` }} className="bg-emerald-500 h-full" />
                      <div style={{ width: `${((s.mix?.medium || 0) / 20) * 100}%` }} className="bg-amber-500 h-full" />
                      <div style={{ width: `${((s.mix?.hard || 0) / 20) * 100}%` }} className="bg-rose-500 h-full" />
                      <div style={{ width: `${((s.mix?.expert || 0) / 20) * 100}%` }} className="bg-purple-600 h-full" />
                    </div>
                  </div>

                  {/* Action Row */}
                  <div className="flex items-center justify-between gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                    <button
                      type="button"
                      onClick={() => handleOpenPreview(s)}
                      disabled={loadingPreviewId === s.id}
                      className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
                      title="Preview Questions"
                    >
                      <Eye size={13} />
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        shareQuiz({
                          id: s.id,
                          title: `${topicName} Set ${s.number}`,
                          description: `Solve 20 questions in ${topicName}!`,
                        });
                      }}
                      className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
                      title="Share"
                    >
                      <Share2 size={13} />
                    </button>

                    <button
                      type="button"
                      onClick={() => handlePlaySet(s)}
                      className="flex-1 py-1.5 px-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-black transition-all flex items-center justify-center gap-1.5 shadow-2xs"
                    >
                      <span>{s.completed ? (isHindi ? "पुनः खेलें" : "Replay") : (isHindi ? "शुरू करें" : "Start")}</span>
                      <ChevronRight size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Set Preview Modal */}
      {previewModalData && (
        <SetPreviewModal
          isOpen={Boolean(previewModalData)}
          onClose={() => setPreviewModalData(null)}
          set={previewModalData.set}
          categoryTopic={previewModalData.categoryTopic}
          onStartSet={() => {
            const s = previewModalData.set;
            setPreviewModalData(null);
            handlePlaySet(s);
          }}
        />
      )}
    </div>
  );
}
