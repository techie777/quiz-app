"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import { useData } from "@/context/DataContext";
import {
  Compass,
  Sparkles,
  BookOpen,
  Zap,
  ArrowLeft,
  ChevronRight,
  Search,
} from "lucide-react";
import ExamModeSwitcher from "@/components/govt-exam/ExamModeSwitcher";
import SubjectIndexTree from "@/components/govt-exam/SubjectIndexTree";
import DigitalBookReader from "@/components/govt-exam/DigitalBookReader";
import ExplorerHomeSection from "@/components/home/ExplorerHomeSection";

// Helper to structure quizzes into hierarchical sections for Read Mode (SubjectIndexTree)
function categorizeQuizzes(quizzes, sections) {
  const sectionMap = new Map();
  const matchedQuizIds = new Set();

  (sections || []).forEach((section) => {
    const nameKey = (section.name || "").trim();
    if (!nameKey) return;

    if (!sectionMap.has(nameKey)) {
      sectionMap.set(nameKey, {
        id: section.id,
        name: section.name,
        nameHi: section.nameHi,
        subSections: [],
      });
    }

    const sectionData = sectionMap.get(nameKey);

    (section.subSections || []).forEach((subSection) => {
      const quizIds = subSection.quizIds || [];
      const subSectionQuizzes = quizzes.filter((quiz) =>
        quizIds.includes(quiz.id)
      );

      if (subSectionQuizzes.length > 0) {
        subSectionQuizzes.forEach((q) => matchedQuizIds.add(q.id));

        const subTitleKey = (subSection.name || "").trim();
        const existingSub = sectionData.subSections.find(
          (s) => (s.title || "").trim() === subTitleKey
        );

        if (existingSub) {
          const existingIds = new Set(existingSub.quizzes.map((q) => q.id));
          subSectionQuizzes.forEach((q) => {
            if (!existingIds.has(q.id)) existingSub.quizzes.push(q);
          });
        } else {
          sectionData.subSections.push({
            title: subSection.name,
            titleHi: subSection.nameHi,
            quizzes: [...subSectionQuizzes],
            order: subSection.order || 0,
          });
        }
      }
    });
  });

  const categorized = Array.from(sectionMap.values()).filter(
    (s) => s.subSections.length > 0
  );
  categorized.forEach((s) => s.subSections.sort((a, b) => a.order - b.order));

  // Collect quizzes that are not in any section
  const uncategorized = quizzes.filter((quiz) => !matchedQuizIds.has(quiz.id));
  if (uncategorized.length > 0) {
    const imageQuizzes = uncategorized.filter((q) =>
      q.categoryClass?.includes("image-quiz")
    );
    const govtQuizzes = uncategorized.filter((q) =>
      q.categoryClass?.includes("govt-exam")
    );
    const others = uncategorized.filter(
      (q) =>
        !q.categoryClass?.includes("image-quiz") &&
        !q.categoryClass?.includes("govt-exam")
    );

    if (imageQuizzes.length > 0) {
      categorized.push({
        id: "uncategorized_image",
        name: "Image Quizzes",
        nameHi: "चित्र क्विज़",
        subSections: [
          {
            title: "Image Categories",
            titleHi: "चित्र श्रेणियां",
            quizzes: imageQuizzes,
            order: 998,
          },
        ],
      });
    }

    if (govtQuizzes.length > 0) {
      categorized.push({
        id: "uncategorized_govt",
        name: "Govt Exam Preparation",
        nameHi: "सरकारी परीक्षा की तैयारी",
        subSections: [
          {
            title: "Govt Exams",
            titleHi: "सरकारी परीक्षा",
            quizzes: govtQuizzes,
            order: 999,
          },
        ],
      });
    }

    if (others.length > 0) {
      categorized.push({
        id: "uncategorized_others",
        name: "General Knowledge (GK)",
        nameHi: "सामान्य ज्ञान (GK)",
        subSections: [
          {
            title: "General Knowledge Topics",
            titleHi: "सामान्य ज्ञान विषय",
            quizzes: others,
            order: 1000,
          },
        ],
      });
    }
  }

  return categorized;
}

export default function SamanyaGyanClient({ initialCategories = [] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isHindi } = useLanguage();
  const { quizzes, loaded: dataLoaded } = useData();

  const modeQuery = searchParams?.get("mode");
  const catQuery =
    searchParams?.get("cat") ||
    searchParams?.get("chapter") ||
    searchParams?.get("topic");

  const [examMode, setExamMode] = useState(
    modeQuery === "read" ? "read" : "quiz"
  );
  const [selectedReadChapter, setSelectedReadChapter] = useState(null);
  const [selectedReadSubject, setSelectedReadSubject] = useState(null);
  const [sections, setSections] = useState([]);

  // Fetch sections for Read Mode SubjectIndexTree
  useEffect(() => {
    let isMounted = true;
    fetch("/api/sections", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (isMounted && Array.isArray(data)) {
          setSections(data);
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, []);

  // Merge quizzes
  const allCategories = useMemo(() => {
    if (Array.isArray(quizzes) && quizzes.length > 0) {
      return quizzes;
    }
    return Array.isArray(initialCategories) ? initialCategories : [];
  }, [quizzes, initialCategories]);

  // Handle URL chapter deep-link for Read Mode
  useEffect(() => {
    if (catQuery && allCategories.length > 0) {
      const qLower = catQuery.toLowerCase().trim();
      const matched = allCategories.find(
        (c) =>
          (c.slug && c.slug.toLowerCase() === qLower) ||
          (c.id && c.id.toLowerCase() === qLower) ||
          (c.topic && c.topic.toLowerCase() === qLower)
      );
      if (matched) {
        setSelectedReadChapter(matched);
        setExamMode("read");
      }
    }
  }, [catQuery, allCategories]);

  // Build categorized sections for Read Mode
  const categorizedQuizzes = useMemo(() => {
    const list = categorizeQuizzes(allCategories, sections);
    const othersIndex = list.findIndex(
      (s) =>
        s.name &&
        (s.name.toLowerCase() === "others" ||
          s.name.toLowerCase().includes("others") ||
          s.name.includes("अन्य"))
    );
    if (othersIndex > -1) {
      const [othersSection] = list.splice(othersIndex, 1);
      list.push(othersSection);
    }
    return list;
  }, [allCategories, sections]);

  // Build flat chapter list for book reader pagination
  const allChaptersList = useMemo(() => {
    const list = [];
    categorizedQuizzes.forEach((sec) => {
      (sec.subSections || []).forEach((sub) => {
        if (sub.quizzes && sub.quizzes.length > 0) {
          sub.quizzes.forEach((q) => {
            if ((q.questionCount ?? q.questions?.length ?? 0) > 0) {
              list.push(q);
            }
          });
        } else if ((sub.questionCount ?? sub.questions?.length ?? 0) > 0) {
          list.push(sub);
        }
      });
    });
    return list;
  }, [categorizedQuizzes]);

  return (
    <div className="w-full min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 antialiased font-sans select-none pb-28">
      {/* Top Hero Banner & Mode Switcher */}
      <div className="w-full max-w-5xl mx-auto px-3 sm:px-6 pt-4 sm:pt-6">
        
        {/* Academic Header Banner */}
        <div className="mb-4 text-center sm:text-left flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xs">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200/70 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-[11px] font-black uppercase tracking-wider mb-1.5">
              <Compass className="w-3.5 h-3.5" />
              <span>
                {isHindi ? "सामान्य ज्ञान हब • General Knowledge" : "General Knowledge Hub"}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {isHindi ? "सामान्य ज्ञान व वस्तुनिष्ठ क्विज़" : "General Knowledge & Quizzes"}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              {isHindi
                ? "भारत, विश्व, इतिहास, भूगोल, विज्ञान व 40+ विषयों का सम्पूर्ण अभ्यास"
                : "India, World, History, Geography, Science & 40+ GK Topics"}
            </p>
          </div>

          <div className="flex items-center justify-center sm:justify-end gap-2">
            <span className="text-[11px] font-black px-3 py-1 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800">
              ✨ 40+ {isHindi ? "श्रेणियां" : "Categories"}
            </span>
            <span className="text-[11px] font-black px-3 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800">
              📚 10,000+ {isHindi ? "प्रश्न" : "Questions"}
            </span>
          </div>
        </div>

        {/* ── Mode Switcher: Quiz Mode vs Read Mode ── */}
        <div className="mb-6">
          <ExamModeSwitcher
            mode={examMode}
            onModeChange={(newMode) => {
              setExamMode(newMode);
              if (newMode === "quiz") {
                setSelectedReadChapter(null);
              }
            }}
            isHindi={isHindi}
            compact={false}
          />
        </div>
      </div>

      {/* Main Content Area based on Selected Mode */}
      <div className="w-full max-w-5xl mx-auto px-3 sm:px-6">
        {examMode === "read" ? (
          /* ================= READ MODE: DIGITAL BOOK READER / INDEX ================= */
          <div className="space-y-4">
            {selectedReadChapter ? (
              <DigitalBookReader
                chapter={selectedReadChapter}
                subject={selectedReadSubject}
                initialPage={
                  Number(
                    searchParams?.get("set") || searchParams?.get("page")
                  ) || 1
                }
                onBackToIndex={() => setSelectedReadChapter(null)}
                isHindi={isHindi}
                allChapters={allChaptersList}
                onSelectChapter={(chap, subj) => {
                  setSelectedReadChapter(chap);
                  if (subj) setSelectedReadSubject(subj);
                }}
              />
            ) : (
              <div className="space-y-4">
                {/* Read Mode Info Pill */}
                <div className="p-3.5 bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800 rounded-2xl flex items-center justify-between text-xs text-indigo-950 dark:text-indigo-200">
                  <div className="flex items-center gap-2.5">
                    <BookOpen className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                    <div>
                      <p className="font-extrabold text-xs">
                        {isHindi
                          ? "डिजिटल अध्ययन मोड (Read Mode) सक्रिय है"
                          : "Digital Study Book Mode is Active"}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {isHindi
                          ? "अध्याय चुनें और बिना किसी समय सीमा के सभी प्रश्न व उत्तर व्याख्या सहित पढ़ें।"
                          : "Select any topic or chapter to read questions with answers and explanations."}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setExamMode("quiz")}
                    className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-indigo-300 dark:border-indigo-700 text-indigo-600 dark:text-indigo-400 font-bold rounded-xl text-xs hover:bg-indigo-50 shadow-2xs shrink-0"
                  >
                    {isHindi ? "क्विज़ खेलें 🎯" : "Play Quiz 🎯"}
                  </button>
                </div>

                {/* Hierarchical Subject Index Tree */}
                <SubjectIndexTree
                  sections={categorizedQuizzes}
                  onSelectChapter={(chap, subj) => {
                    setSelectedReadChapter(chap);
                    if (subj) setSelectedReadSubject(subj);
                  }}
                  isHindi={isHindi}
                />
              </div>
            )}
          </div>
        ) : (
          /* ================= QUIZ MODE: MODERN EXPLORER SECTION ================= */
          <div className="space-y-6">
            <ExplorerHomeSection
              dbCategories={allCategories}
              dataLoaded={dataLoaded}
              isHindi={isHindi}
            />
          </div>
        )}
      </div>
    </div>
  );
}
