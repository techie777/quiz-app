"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ArrowRight, ShieldCheck, BookOpen, Sparkles } from "lucide-react";
import styles from "@/styles/GovtExams.module.css";

export default function GovtExamsHub() {
  const [categories, setCategories] = useState([]);
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);

  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    async function fetchHubData() {
      try {
        const res = await fetch("/api/govt-exams/hub");
        const data = await res.json();
        if (data.categories) setCategories(data.categories);
        if (data.exams) setExams(data.exams);
      } catch (error) {
        console.error("Failed to fetch govt exams hub data:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchHubData();
  }, []);

  const filteredExams = useMemo(() => {
    return exams.filter((exam) => {
      const matchesSearch =
        exam.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        exam.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory =
        activeCategory === "all" || exam.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [exams, activeCategory, searchQuery]);

  // Group exams by Category for structured rendering when category is 'all'
  const groupedExams = useMemo(() => {
    const groups = {};
    filteredExams.forEach((exam) => {
      const cat = exam.category || "Other Exams";
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(exam);
    });
    return groups;
  }, [filteredExams]);

  return (
    <main className={styles.page}>
      {/* Background ambient light */}
      <div className={styles.bgOrbs} aria-hidden="true">
        <div className={`${styles.orb} ${styles.orb1}`} />
        <div className={`${styles.orb} ${styles.orb2}`} />
      </div>

      {/* Hero Banner */}
      <section className={styles.hubHeader}>
        <div className={styles.badge}>
          <Sparkles size={14} /> Official Recruitment Portal
        </div>
        <h1 className={styles.hubTitle}>
          Government Exam <span className={styles.highlight}>Mastery Hub</span>
        </h1>
        <p className={styles.hubSubtitle}>
          Complete preparation portal featuring Syllabus, Career Guides, Digital FlexBooks with Chapter Quizzes, and Official Mocks.
        </p>
      </section>

      {loading ? (
        <div className="flex justify-center items-center py-24">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <>
          {/* Controls Bar: Filter Pills + Search */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div className={styles.filterBar}>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  className={`${styles.categoryBtn} ${
                    activeCategory === cat.id ? styles.activeCategory : ""
                  }`}
                  onClick={() => setActiveCategory(cat.id)}
                >
                  <span>{cat.icon}</span> {cat.name}
                </button>
              ))}
            </div>

            <div className={styles.searchWrapper}>
              <Search size={18} className={styles.searchIcon} />
              <input
                type="text"
                placeholder="Search exams (e.g. SSC CGL, SBI PO)..."
                className={styles.searchInput}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Exam Grid */}
          {Object.keys(groupedExams).length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center border border-dashed border-slate-200 dark:border-slate-800">
              <span className="text-5xl mb-4 block">🔍</span>
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-2">No Exams Found</h3>
              <p className="text-slate-500 text-sm">Try adjusting your search keywords or category filters.</p>
            </div>
          ) : (
            Object.entries(groupedExams).map(([categoryName, examList]) => (
              <div key={categoryName} className={styles.categoryGroup}>
                <div className={styles.categoryGroupHeader}>
                  <h2 className={styles.categoryGroupTitle}>{categoryName}</h2>
                  <div className={styles.categoryDivider} />
                </div>

                <div className={styles.examGrid}>
                  <AnimatePresence>
                    {examList.map((exam, i) => (
                      <motion.div
                        layout
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.2, delay: i * 0.04 }}
                        key={exam.id}
                      >
                        <Link href={`/govt-exams/${exam.slug}`} className={styles.examCard}>
                          <div className={styles.examCardTop}>
                            <div className={styles.iconBox}>{exam.emoji || "🏛️"}</div>
                            <span className={styles.catBadge}>{exam.category}</span>
                          </div>

                          <h3 className={styles.examName}>{exam.name}</h3>
                          <p className={styles.examDesc}>{exam.description}</p>

                          {exam.subExams && exam.subExams.length > 0 && (
                            <div className={styles.subExamsList}>
                              {exam.subExams.map((sub, idx) => (
                                <span key={idx} className={styles.subExamChip}>
                                  {sub}
                                </span>
                              ))}
                            </div>
                          )}

                          <div className={styles.examFooter}>
                            <span className="text-xs font-bold text-slate-400">
                              📋 {exam.testCount || 10}+ Modules
                            </span>
                            <div className={styles.viewBtn}>
                              View details <ArrowRight size={14} />
                            </div>
                          </div>
                        </Link>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            ))
          )}
        </>
      )}
    </main>
  );
}
