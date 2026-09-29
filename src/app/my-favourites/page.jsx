"use client";

import { useState, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useData } from "@/context/DataContext";
import { useQuiz } from "@/context/QuizContext";
import { useLanguage } from "@/context/LanguageContext";
import {
  getLocalQuestionFavs,
  saveLocalQuestionFavs,
  getLocalCatFavs,
  saveLocalCatFavs,
  toggleQuestionFavourite,
} from "@/lib/favouritesHelper";
import { shareQuestion } from "@/lib/shareHelper";
import {
  Heart,
  Play,
  Share2,
  Trash2,
  Search,
  Sparkles,
  FileText,
  ArrowRight,
  BookOpen,
} from "lucide-react";
import toast from "react-hot-toast";
import styles from "@/styles/Notes.module.css";

function formatDate(d) {
  if (!d) return "";
  try {
    const [y, m, day] = String(d).split("-");
    const dt = new Date(Number(y), Number(m) - 1, Number(day));
    return dt.toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return d;
  }
}

export default function FavouritesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { quizzes } = useData();
  const { startMixedQuiz } = useQuiz();
  const { isHindi } = useLanguage();

  const [favourites, setFavourites] = useState([]);
  const [caFavourites, setCaFavourites] = useState([]);
  const [quizFavIds, setQuizFavIds] = useState([]);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [section, setSection] = useState("questions"); // "questions" | "categories" | "currentAffairs"
  const [loading, setLoading] = useState(true);
  const [reading, setReading] = useState(null);

  // Load favourites for both guests (localStorage) and signed-in users (API)
  useEffect(() => {
    let isMounted = true;

    if (status === "loading") return;

    if (status === "authenticated" && !session?.user?.isAdmin) {
      Promise.all([
        fetch("/api/favourites")
          .then((r) => (r.ok ? r.json() : []))
          .catch(() => []),
        fetch("/api/category-favourites")
          .then((r) => (r.ok ? r.json() : { ids: [] }))
          .catch(() => ({ ids: [] })),
        fetch("/api/current-affairs/favourites")
          .then((r) => (r.ok ? r.json() : { items: [] }))
          .catch(() => ({ items: [] })),
      ]).then(([apiFavs, apiCatFavs, apiCaFavs]) => {
        if (!isMounted) return;
        // Merge guest localStorage favourites with API favourites
        const localQuestions = getLocalQuestionFavs();
        const apiQuestionIds = new Set(
          (Array.isArray(apiFavs) ? apiFavs : []).map((f) => f.questionId || f.question?.id)
        );
        const mergedQuestions = [
          ...(Array.isArray(apiFavs) ? apiFavs : []),
          ...localQuestions
            .filter((lq) => !apiQuestionIds.has(lq.id || lq._id))
            .map((lq) => ({
              id: lq.id || lq._id,
              questionId: lq.id || lq._id,
              question: lq,
            })),
        ];

        const localCats = getLocalCatFavs();
        const apiIds = Array.isArray(apiCatFavs.ids) ? apiCatFavs.ids : [];
        const mergedCatIds = Array.from(new Set([...apiIds, ...localCats]));

        setFavourites(mergedQuestions);
        setQuizFavIds(mergedCatIds);
        setCaFavourites(Array.isArray(apiCaFavs.items) ? apiCaFavs.items : []);
        setLoading(false);
      });
    } else {
      // Guest mode
      const localQuestions = getLocalQuestionFavs();
      const localCats = getLocalCatFavs();
      setFavourites(
        localQuestions.map((lq) => ({
          id: lq.id || lq._id,
          questionId: lq.id || lq._id,
          question: lq,
        }))
      );
      setQuizFavIds(localCats);
      setLoading(false);
    }

    return () => {
      isMounted = false;
    };
  }, [status, session]);

  // Extract unique category tags
  const categories = useMemo(() => {
    const cats = {};
    favourites.forEach((f) => {
      const cat = f.question?.category;
      if (cat?.id) {
        cats[cat.id] = { id: cat.id, topic: cat.topic, emoji: cat.emoji || "📝" };
      }
    });
    return Object.values(cats);
  }, [favourites]);

  // Filtered Questions
  const filtered = useMemo(() => {
    return favourites.filter((f) => {
      const q = f.question;
      if (!q) return false;
      if (activeTab !== "all" && q.categoryId !== activeTab && q.category?.id !== activeTab) {
        return false;
      }
      if (search.trim()) {
        const s = search.toLowerCase();
        const text = (q.text || q.question || "").toLowerCase();
        const textHi = (q.textHi || "").toLowerCase();
        if (!text.includes(s) && !textHi.includes(s)) return false;
      }
      return true;
    });
  }, [favourites, activeTab, search]);

  // Filtered Categories
  const filteredQuizzes = useMemo(() => {
    const favs = quizzes.filter((q) => quizFavIds.includes(q.id) || quizFavIds.includes(q.slug));
    const s = search.trim().toLowerCase();
    if (!s) return favs;
    return favs.filter((q) => (q.topic || "").toLowerCase().includes(s));
  }, [quizzes, quizFavIds, search]);

  // Filtered Current Affairs
  const filteredCA = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return caFavourites;
    return caFavourites.filter((it) => {
      if (it.heading && String(it.heading).toLowerCase().includes(s)) return true;
      if (it.description && String(it.description).toLowerCase().includes(s)) return true;
      if (it.category && String(it.category).toLowerCase().includes(s)) return true;
      return false;
    });
  }, [caFavourites, search]);

  // Remove question favourite
  const handleRemove = async (questionId) => {
    // 1. Remove from local state
    setFavourites((prev) => prev.filter((f) => (f.questionId || f.id) !== questionId));

    // 2. Remove from localStorage
    const local = getLocalQuestionFavs();
    saveLocalQuestionFavs(local.filter((q) => (q.id || q._id) !== questionId));

    // 3. Remove from server if authenticated
    if (status === "authenticated" && session?.user && !session.user.isAdmin) {
      try {
        await fetch("/api/favourites", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ questionId }),
        });
      } catch {}
    }
    toast.success(isHindi ? "पसंदीदा से हटाया गया" : "Removed from favourites", { icon: "🗑️" });
  };

  // Remove category favourite
  const handleRemoveQuiz = async (categoryId) => {
    setQuizFavIds((prev) => prev.filter((id) => id !== categoryId));
    const local = getLocalCatFavs();
    saveLocalCatFavs(local.filter((id) => id !== categoryId));

    if (status === "authenticated" && session?.user && !session.user.isAdmin) {
      try {
        await fetch("/api/category-favourites", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ categoryId }),
        });
      } catch {}
    }
    toast.success(isHindi ? "श्रेणी हटाई गई" : "Category removed", { icon: "🗑️" });
  };

  // Remove Current Affairs favourite
  const handleRemoveCA = async (currentAffairId) => {
    try {
      await fetch("/api/current-affairs/favourites", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentAffairId }),
      });
      setCaFavourites((prev) => prev.filter((x) => x.id !== currentAffairId));
    } catch {}
  };

  // "Play Favourites" Practice Mode
  const handlePlayFavourites = () => {
    const listToPlay = filtered.length > 0 ? filtered : favourites;
    if (listToPlay.length === 0) {
      toast.error(isHindi ? "कोई पसंदीदा प्रश्न नहीं मिला" : "No favourite questions to play");
      return;
    }

    const normalizedQuestions = listToPlay.map((f, idx) => {
      const q = f.question || {};
      return {
        id: q.id || q._id || `fav-q-${idx}`,
        text: q.text || q.question || "",
        textHi: q.textHi || q.text_hi || "",
        options: Array.isArray(q.options) ? q.options : [],
        optionsHi: Array.isArray(q.optionsHi) ? q.optionsHi : [],
        correctAnswer: q.correctAnswer || (q.options ? q.options[0] : ""),
        difficulty: q.difficulty || "medium",
        explanation: q.explanation || "",
        explanationHi: q.explanationHi || "",
      };
    });

    const sessionTitle = isHindi ? "पसंदीदा प्रश्न अभ्यास" : "Favourite Questions Practice";
    startMixedQuiz(
      normalizedQuestions,
      sessionTitle,
      30,
      "ALL",
      isHindi ? "hi" : "en"
    );
    router.push("/quiz/mixed");
  };

  // Export PDF
  const handleExportPDF = async () => {
    try {
      const res = await fetch("/api/favourites/export");
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      let y = 20;

      doc.setFontSize(18);
      doc.setFont(undefined, "bold");
      doc.text(data.companyName || "QuizWeb", pageWidth / 2, y, { align: "center" });
      y += 8;
      doc.setFontSize(12);
      doc.setFont(undefined, "normal");
      doc.text("My Favourites - Saved Questions", pageWidth / 2, y, { align: "center" });
      y += 12;

      for (const cat of data.categories || []) {
        if (y > 260) {
          doc.addPage();
          y = 20;
        }
        doc.setFontSize(14);
        doc.setFont(undefined, "bold");
        doc.text(`${cat.topic}`, 14, y);
        y += 8;

        doc.setFontSize(10);
        doc.setFont(undefined, "normal");
        for (let i = 0; i < (cat.questions || []).length; i++) {
          if (y > 270) {
            doc.addPage();
            y = 20;
          }
          const q = cat.questions[i];
          const lines = doc.splitTextToSize(`${i + 1}. ${q.text}`, pageWidth - 28);
          doc.text(lines, 14, y);
          y += lines.length * 5;
          doc.setFont(undefined, "bold");
          doc.text(`Answer: ${q.correctAnswer}`, 20, y);
          doc.setFont(undefined, "normal");
          y += 8;
        }
        y += 4;
      }

      doc.save("quizweb-favourites.pdf");
      toast.success(isHindi ? "PDF डाउनलोड हो गई!" : "PDF downloaded successfully!");
    } catch {
      toast.error(isHindi ? "PDF निर्यात विफल रहा" : "PDF export failed");
    }
  };

  const getDifficultyBadge = (q) => {
    const rawDiff = String(q?.difficulty || "medium").toLowerCase();
    const isEasy = rawDiff === "easy" || q?.difficulty_level === 1;
    const isHard = rawDiff === "hard" || q?.difficulty_level === 3;
    const label = isEasy
      ? isHindi ? "सरल" : "Easy"
      : isHard
      ? isHindi ? "कठिन" : "Hard"
      : isHindi ? "मध्यम" : "Medium";
    const badgeStyle = isEasy
      ? "bg-[#DCFCE7] text-[#16A34A] border-[#86EFAC]"
      : isHard
      ? "bg-[#FEE2E2] text-[#DC2626] border-[#FCA5A5]"
      : "bg-[#FEF3C7] text-[#D97706] border-[#FDE68A]";

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${badgeStyle}`}>
        <span className="w-1.5 h-1.5 rounded-full bg-current" />
        <span>{label}</span>
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-slate-500">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-sm font-medium">{isHindi ? "पसंदीदा लोड हो रहे हैं..." : "Loading favourites..."}</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-5 sm:py-8 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-50 text-rose-600 text-xs font-bold border border-rose-200 mb-2">
            <Heart size={13} fill="currentColor" />
            <span>{isHindi ? "पसंदीदा संग्रह" : "Saved Collection"}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            {isHindi ? "मेरे पसंदीदा" : "My Favourites"}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            {section === "questions"
              ? isHindi
                ? `${favourites.length} पसंदीदा प्रश्न सहेजे गए हैं`
                : `${favourites.length} saved favourite questions`
              : section === "categories"
              ? isHindi
                ? `${quizFavIds.length} पसंदीदा श्रेणियां`
                : `${quizFavIds.length} saved quiz categories`
              : isHindi
              ? `${caFavourites.length} करंट अफेयर्स`
              : `${caFavourites.length} saved current affairs`}
          </p>
        </div>

        {/* Action Button: Play Favourites in Questions tab */}
        {section === "questions" && favourites.length > 0 && (
          <div className="flex items-center gap-2">
            <button
              onClick={handlePlayFavourites}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-extrabold text-sm shadow-md shadow-indigo-600/20 active:scale-95 transition-all"
            >
              <Play size={15} fill="currentColor" />
              <span>{isHindi ? "पसंदीदा खेलें" : "Play Favourites"}</span>
            </button>
            <button
              onClick={handleExportPDF}
              title={isHindi ? "पीडीएफ डाउनलोड करें" : "Export as PDF"}
              className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:border-indigo-400 transition-all shadow-xs"
            >
              <FileText size={16} />
            </button>
          </div>
        )}
      </div>

      {/* Primary Section Tabs: Questions | Categories | Current Affairs */}
      <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700">
        <button
          onClick={() => {
            setSection("questions");
            setActiveTab("all");
          }}
          className={`flex-1 py-2.5 text-xs sm:text-sm font-extrabold rounded-xl transition-all ${
            section === "questions"
              ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
          }`}
        >
          {isHindi ? `प्रश्न (${favourites.length})` : `Questions (${favourites.length})`}
        </button>
        <button
          onClick={() => {
            setSection("categories");
            setActiveTab("all");
          }}
          className={`flex-1 py-2.5 text-xs sm:text-sm font-extrabold rounded-xl transition-all ${
            section === "categories"
              ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
          }`}
        >
          {isHindi ? `श्रेणियां (${quizFavIds.length})` : `Categories (${quizFavIds.length})`}
        </button>
        {caFavourites.length > 0 && (
          <button
            onClick={() => {
              setSection("currentAffairs");
              setActiveTab("all");
            }}
            className={`flex-1 py-2.5 text-xs sm:text-sm font-extrabold rounded-xl transition-all ${
              section === "currentAffairs"
                ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
            }`}
          >
            {isHindi ? "करंट अफेयर्स" : "Current Affairs"}
          </button>
        )}
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={
            section === "questions"
              ? isHindi ? "सहेजे गए प्रश्नों में खोजें..." : "Search saved questions..."
              : isHindi ? "सहेजी गई श्रेणियों में खोजें..." : "Search saved categories..."
          }
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 text-sm focus:outline-none focus:border-indigo-500 transition-colors shadow-2xs"
        />
      </div>

      {/* --- Section 1: Questions Tab --- */}
      {section === "questions" && (
        <div className="space-y-4">
          {/* Category Filter Chips */}
          {categories.length > 1 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
              <button
                onClick={() => setActiveTab("all")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  activeTab === "all"
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300"
                }`}
              >
                {isHindi ? "सभी" : "All"}
              </button>
              {categories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setActiveTab(c.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                    activeTab === c.id
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300"
                  }`}
                >
                  {c.emoji} {c.topic}
                </button>
              ))}
            </div>
          )}

          {/* Empty State */}
          {favourites.length === 0 ? (
            <div className="text-center py-14 px-4 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 space-y-3">
              <div className="w-16 h-16 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-500 mx-auto flex items-center justify-center text-3xl">
                ❤️
              </div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                {isHindi ? "कोई पसंदीदा प्रश्न नहीं" : "No favourite questions yet"}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                {isHindi
                  ? "क्विज़ खेलते समय या सेट प्रिव्यू में ❤️ पर टैप करके महत्वपूर्ण प्रश्नों को सहेजें।"
                  : "Tap the ❤️ icon during quizzes or in set previews to bookmark questions for revision."}
              </p>
              <Link
                href="/arena"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm mt-2"
              >
                <Play size={13} fill="currentColor" />
                <span>{isHindi ? "क्विज़ खेलें" : "Play a Quiz"}</span>
              </Link>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-xs">
              {isHindi ? "कोई मेल खाता प्रश्न नहीं मिला" : "No questions match your filter"}
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((item, idx) => {
                const q = item.question || {};
                const qId = item.questionId || item.id;
                const displayText = (isHindi && q.textHi) ? q.textHi : q.text || q.question || "";
                const displayOpts = (isHindi && q.optionsHi && q.optionsHi.length > 0)
                  ? q.optionsHi
                  : q.options || [];

                return (
                  <div
                    key={qId || idx}
                    className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-indigo-300 transition-all space-y-3"
                  >
                    {/* Header: Difficulty + Category + Actions */}
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        {getDifficultyBadge(q)}
                        {q.category?.topic && (
                          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                            {q.category.emoji} {q.category.topic}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => shareQuestion({ question: q, isHindi })}
                          title={isHindi ? "साझा करें" : "Share"}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800 transition-all"
                        >
                          <Share2 size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemove(qId)}
                          title={isHindi ? "हटाएं" : "Remove"}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 transition-all"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    {/* Question Text */}
                    <p className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-snug">
                      {displayText}
                    </p>

                    {/* Options list with correct answer highlighted in green */}
                    {displayOpts.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
                        {displayOpts.map((opt, oIdx) => {
                          const isCorrect = String(opt).trim() === String(q.correctAnswer).trim();
                          return (
                            <div
                              key={oIdx}
                              className={`p-2 rounded-xl text-xs font-semibold border flex items-center justify-between ${
                                isCorrect
                                  ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800"
                                  : "bg-slate-50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 border-slate-100 dark:border-slate-800"
                              }`}
                            >
                              <span>{opt}</span>
                              {isCorrect && (
                                <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-emerald-200 dark:bg-emerald-800 text-emerald-900 dark:text-emerald-100 ml-2 shrink-0">
                                  ✓ {isHindi ? "उत्तर" : "Answer"}
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* --- Section 2: Categories Tab --- */}
      {section === "categories" && (
        <div className="space-y-4">
          {filteredQuizzes.length === 0 ? (
            <div className="text-center py-14 px-4 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 space-y-3">
              <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-500 mx-auto flex items-center justify-center text-3xl">
                📂
              </div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                {isHindi ? "कोई पसंदीदा श्रेणी नहीं" : "No favourite categories yet"}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                {isHindi
                  ? "श्रेणी कार्ड पर ❤️ दबाकर अपनी पसंदीदा श्रेणियों को यहाँ सहेजें।"
                  : "Tap the heart icon on any category card to bookmark it here for quick access."}
              </p>
              <Link
                href="/arena"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm mt-2"
              >
                <Sparkles size={13} />
                <span>{isHindi ? "श्रेणियां ब्राउज़ करें" : "Browse Categories"}</span>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {filteredQuizzes.map((cat) => (
                <div
                  key={cat.id}
                  className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md transition-all flex flex-col justify-between gap-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 text-2xl flex items-center justify-center shrink-0">
                        {cat.emoji || "📝"}
                      </div>
                      <div>
                        <h3 className="text-base font-extrabold text-slate-900 dark:text-white line-clamp-1">
                          {cat.topic}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {cat.questions?.length || 0} {isHindi ? "प्रश्न" : "Questions"}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveQuiz(cat.id)}
                      title={isHindi ? "हटाएं" : "Remove"}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 transition-all shrink-0"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <Link
                      href={`/category/${cat.id}`}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-sm transition-all"
                    >
                      <Play size={13} fill="currentColor" />
                      <span>{isHindi ? "क्विज़ खेलें" : "Play Category"}</span>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* --- Section 3: Current Affairs Tab --- */}
      {section === "currentAffairs" && (
        <div className="space-y-3">
          {filteredCA.map((it) => (
            <div
              key={it.id}
              className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2.5"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">{formatDate(it.date)}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveCA(it.id)}
                  className="p-1 text-slate-400 hover:text-rose-500"
                >
                  <Trash2 size={14} />
                </button>
              </div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                {it.heading}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                {it.description}
              </p>
              <button
                onClick={() => setReading(it)}
                className="text-xs font-bold text-indigo-600 hover:underline"
              >
                {isHindi ? "और पढ़ें →" : "Read more →"}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Current Affairs Modal */}
      {reading && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setReading(null)}
        >
          <div
            className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl p-6 space-y-4 max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">{formatDate(reading.date)}</span>
              <button
                onClick={() => setReading(null)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center"
              >
                ✕
              </button>
            </div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white">
              {reading.heading}
            </h2>
            {reading.image && (
              <img
                src={reading.image}
                alt=""
                className="w-full h-48 object-cover rounded-2xl"
              />
            )}
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
              {reading.description}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
