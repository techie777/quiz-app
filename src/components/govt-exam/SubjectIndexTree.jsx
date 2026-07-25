"use client";

import React, { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Search, BookOpen, Layers, ArrowRight } from "lucide-react";

import ExamModeSwitcher from "./ExamModeSwitcher";

// Clean main subject name by stripping redundant "Section A: " prefixes
function getMainSubjectName(title, isHindi = false) {
  if (!title) return isHindi ? "सामान्य विषय" : "General Subject";
  const cleaned = title.replace(/^Section\s+[A-Z0-9]+:\s*/i, "").trim();
  return cleaned || title;
}

export default function SubjectIndexTree({
  sections = [],
  onSelectChapter,
  isHindi = false,
  examMode,
  onModeChange,
  searchTerm = "",
}) {
  const [expandedSections, setExpandedSections] = useState({});

  // Flatten top sections into main subject groups (e.g. Section A, Section B, Section C, Section D)
  const subjectGroups = useMemo(() => {
    const list = [];

    sections.forEach((sec, secIdx) => {
      const secName = sec.name || "Subject";
      const secNameHi = sec.nameHi || secName;
      const subSections = sec.subSections || [];

      if (subSections.length > 0) {
        subSections.forEach((sub, sIdx) => {
          const subTitle = isHindi && sub.titleHi ? sub.titleHi : (sub.title || sub.name || `Subject ${sIdx + 1}`);
          let finalTitle = subTitle;
          if (String(sub.title || "").trim().toLowerCase() === "topics" || String(subTitle || "").trim().toLowerCase() === "topics" || subTitle === secName) {
            finalTitle = isHindi ? secNameHi : secName;
          }
          const mainSubject = getMainSubjectName(finalTitle, isHindi);

          const chapters = (sub.quizzes && sub.quizzes.length > 0)
            ? sub.quizzes
            : [sub];

          list.push({
            id: sub.id || `${sec.id || secIdx}_sub_${sIdx}`,
            title: finalTitle,
            mainSubjectName: mainSubject,
            parentSection: sec,
            subSection: sub,
            chapters: chapters,
          });
        });
      } else {
        const mainSubject = getMainSubjectName(secName, isHindi);
        const chapters = sec.quizzes && sec.quizzes.length > 0 ? sec.quizzes : [sec];
        list.push({
          id: sec.id || `sec_${secIdx}`,
          title: isHindi && sec.nameHi ? sec.nameHi : secName,
          mainSubjectName: mainSubject,
          parentSection: sec,
          subSection: sec,
          chapters: chapters,
        });
      }
    });

    return list;
  }, [sections, isHindi]);

  // Initialize all subject groups as expanded by default
  useEffect(() => {
    if (subjectGroups.length > 0 && Object.keys(expandedSections).length === 0) {
      const initial = {};
      subjectGroups.forEach((group) => {
        initial[group.id] = true;
      });
      setExpandedSections(initial);
    }
  }, [subjectGroups, expandedSections]);

  const toggleSection = (id) => {
    setExpandedSections((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Filter subject groups and chapters based on search query
  const filteredGroups = useMemo(() => {
    if (!searchTerm.trim()) return subjectGroups;

    const term = searchTerm.toLowerCase();
    return subjectGroups
      .map((group) => {
        const titleMatch = (group.title || "").toLowerCase().includes(term);
        const subjectMatch = (group.mainSubjectName || "").toLowerCase().includes(term);

        const matchingChapters = (group.chapters || []).filter((cat) => {
          const topic = (cat.topic || cat.title || "").toLowerCase();
          const topicHi = (cat.topicHi || "").toLowerCase();
          return topic.includes(term) || topicHi.includes(term);
        });

        if (titleMatch || subjectMatch || matchingChapters.length > 0) {
          return {
            ...group,
            chapters: (titleMatch || subjectMatch) ? group.chapters : matchingChapters,
          };
        }
        return null;
      })
      .filter(Boolean);
  }, [subjectGroups, searchTerm]);

  // Calculate overall metrics
  const totalSubjects = subjectGroups.length;
  const totalChapters = subjectGroups.reduce(
    (acc, group) => acc + (group.chapters?.length || 0),
    0
  );

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      <div className="space-y-4">
        {filteredGroups.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center border border-dashed border-slate-300 dark:border-slate-800">
            <Layers size={48} className="mx-auto text-indigo-400 mb-3" />
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-1">
              {isHindi ? "कोई अध्याय नहीं मिला" : "No chapters found"}
            </h3>
            <p className="text-slate-500 text-sm">
              {isHindi
                ? "कृपया अपनी खोज बदलें या खोज शब्द साफ़ करें।"
                : "Try searching with a different keyword or clear search."}
            </p>
          </div>
        ) : (
          filteredGroups.map((group, grpIdx) => {
            const grpId = group.id;
            const isOpen = expandedSections[grpId] ?? true;
            const grpTitle = group.title;
            const mainSubj = group.mainSubjectName;
            const chapters = group.chapters || [];

            // Calculate total question count for subject group
            const totalQCount = chapters.reduce((acc, cat) => {
              return acc + (cat.questionCount || cat.questions?.length || 20);
            }, 0);

            return (
              <div
                key={grpId}
                className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden"
              >
                {/* Main Subject Accordion Header */}
                <button
                  type="button"
                  onClick={() => toggleSection(grpId)}
                  className="w-full p-5 sm:p-6 flex items-center justify-between gap-4 text-left hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-black text-lg flex-shrink-0">
                      {grpIdx + 1}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-base sm:text-xl font-extrabold text-slate-900 dark:text-slate-100 truncate">
                        {grpTitle}
                      </h3>
                      <p className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                        {chapters.length} {isHindi ? "अध्याय" : "Chapters"} • ~
                        {totalQCount} {isHindi ? "प्रश्न" : "Questions"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="hidden sm:inline-flex px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-xs font-bold border border-indigo-100 dark:border-indigo-900">
                      {chapters.length} {isHindi ? "अध्याय" : "Chapters"}
                    </span>
                    <ChevronDown
                      size={20}
                      className={`text-slate-400 transition-transform duration-300 ${
                        isOpen ? "rotate-180" : ""
                      }`}
                    />
                  </div>
                </button>

                {/* Sub-Chapters Cards List */}
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/40 dark:bg-slate-950/30 p-4 sm:p-6"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {chapters.filter(cat => (cat.questionCount ?? cat.questions?.length ?? 0) > 0).map((cat, catIdx) => {
                          const catTitle =
                            isHindi && cat.topicHi
                              ? cat.topicHi
                              : cat.topic || cat.title || cat.name || `Chapter ${catIdx + 1}`;
                          const desc =
                            (isHindi && cat.descriptionHi) ? cat.descriptionHi : cat.description;
                          const qCount =
                            cat.questionCount || cat.questions?.length || 20;

                          return (
                            <motion.div
                              key={cat.id || catIdx}
                              whileHover={{ y: -4, scale: 1.01 }}
                              transition={{ duration: 0.2 }}
                              onClick={() => onSelectChapter(cat, group.parentSection)}
                              className="group cursor-pointer bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/80 border border-slate-200/80 dark:border-slate-800 hover:border-emerald-500/50 dark:hover:border-emerald-500/50 rounded-2xl p-5 shadow-sm hover:shadow-xl hover:shadow-emerald-500/10 transition-all duration-300 flex flex-col justify-between"
                            >
                              <div>
                                <div className="flex items-center justify-between gap-3 mb-3">
                                  <span className="w-12 h-12 rounded-2xl bg-emerald-100/60 dark:bg-emerald-950/60 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                                    {cat.emoji || "📖"}
                                  </span>
                                  <span className="px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 text-xs font-black border border-emerald-100 dark:border-emerald-900/50">
                                    {qCount} {isHindi ? 'प्रश्न' : 'Qs'}
                                  </span>
                                </div>

                                <h4 className="text-base font-black text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors line-clamp-1">
                                  {catTitle}
                                </h4>
                                
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                                  {desc || (isHindi ? "अध्याय पढ़ें और अवधारणाओं को समझें।" : "Read chapter content and master key concepts.")}
                                </p>
                              </div>

                              <div className="mt-5 pt-4 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between">
                                <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 truncate max-w-[140px]">
                                  📘 {mainSubj}
                                </span>
                                
                                <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black shadow-md shadow-emerald-600/20 group-hover:translate-x-1 transition-all">
                                  <span>{isHindi ? "पढ़ें" : "Read"}</span>
                                  <ArrowRight size={14} />
                                </span>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
