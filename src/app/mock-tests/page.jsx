"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import styles from "@/styles/MockTestsHub.module.css";
import { useModules } from "@/context/DataContext";
import { useLanguage } from "@/context/LanguageContext";
import {
  ShieldCheck,
  Search,
  Sparkles,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  FileText,
  RotateCcw,
} from "lucide-react";

export default function MockTestsHub() {
  const router = useRouter();
  const modules = useModules();
  const { isHindi } = useLanguage();

  useEffect(() => {
    if (modules && !modules.mockTests) {
      router.replace("/");
    }
  }, [modules, router]);

  const [categories, setCategories] = useState([]);
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);

  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    async function fetchHubData() {
      try {
        const res = await fetch("/api/mock-tests/hub");
        const data = await res.json();
        if (data.categories) setCategories(data.categories);
        if (data.exams) setExams(data.exams);
      } catch (error) {
        console.error("Failed to fetch hub data:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchHubData();
  }, []);

  const filteredExams = useMemo(() => {
    return exams.filter((exam) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        exam.name.toLowerCase().includes(q) ||
        exam.description?.toLowerCase().includes(q);
      const matchesCategory =
        activeCategory === "all" || exam.categoryId === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [exams, activeCategory, searchQuery]);

  return (
    <main className={styles.page}>
      {/* ──────────────── 1. RESTORED PREMIUM HERO SECTION ──────────────── */}
      <section className={styles.hero}>
        <div className={styles.heroBadge}>
          <ShieldCheck size={14} className="text-indigo-400" />
          <span>
            {isHindi
              ? "ऑल इंडिया मॉक टेस्ट सीरीज़ 2026"
              : "All India Mock Test Series 2026"}
          </span>
        </div>

        <h1 className={styles.title}>
          {isHindi ? "सरकारी परीक्षा " : "Govt Exam "}
          <span className={styles.textAccent}>
            {isHindi ? "मॉक टेस्ट व टेस्ट सीरीज़" : "Mock Test Series"}
          </span>
        </h1>

        <p className={styles.subtitle}>
          {isHindi
            ? "नवीनतम परीक्षा पैटर्न, विस्तृत द्विभाषी व्याख्या व ऑल इंडिया रैंक के साथ संपूर्ण अभ्यास करें।"
            : "Practice with latest exam pattern questions, detailed bilingual solutions, and real-time All India ranking."}
        </p>
      </section>

      {/* ──────────────── 2. MAIN LAYOUT ──────────────── */}
      {loading ? (
        <div className={styles.loaderArea}>
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <section className={styles.mainLayout}>
          {/* Sidebar / Mobile Category Sticky Bar */}
          <aside className={styles.sidebar}>
            <h3 className={styles.sidebarTitle}>
              {isHindi ? "परीक्षा श्रेणियां" : "Categories"}
            </h3>
            <div className={styles.categoryList}>
              <button
                className={`${styles.categoryItem} ${
                  activeCategory === "all" ? styles.activeCategory : ""
                }`}
                onClick={() => setActiveCategory("all")}
              >
                <span>🌍</span>
                <span>{isHindi ? "सभी परीक्षाएं" : "All Exams"}</span>
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  className={`${styles.categoryItem} ${
                    activeCategory === cat.id ? styles.activeCategory : ""
                  }`}
                  onClick={() => setActiveCategory(cat.id)}
                >
                  <span>{cat.icon || "📚"}</span>
                  <span>{cat.name}</span>
                </button>
              ))}
            </div>
          </aside>

          {/* Exam Grid Area */}
          <div className={styles.contentArea}>
            <div className={styles.resultsHeader}>
              <h2>
                {isHindi
                  ? `${filteredExams.length} परीक्षाएं उपलब्ध`
                  : `Showing ${filteredExams.length} Exams`}
              </h2>
              <div className={styles.searchWrapper}>
                <Search size={18} className={styles.searchIcon} />
                <input
                  type="text"
                  placeholder={
                    isHindi
                      ? "परीक्षा खोजें (जैसे: SSC CGL, UPSC, बैंक)..."
                      : "Search for an exam (e.g. SSC CGL, Bank)..."
                  }
                  className={styles.searchInput}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {filteredExams.length === 0 ? (
              <div className={styles.emptyState}>
                <span className="text-6xl mb-4 block">🔍</span>
                <h3>{isHindi ? "कोई परीक्षा नहीं मिली" : "No Exams Found"}</h3>
                <p>
                  {isHindi
                    ? "कृपया अन्य कीवर्ड खोजें या श्रेणी फ़िल्टर रीसेट करें।"
                    : "Try adjusting your search criteria or category filter."}
                </p>
                {(searchQuery || activeCategory !== "all") && (
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      setActiveCategory("all");
                    }}
                    className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-xs uppercase tracking-wider hover:bg-indigo-700 transition"
                  >
                    <RotateCcw size={14} />
                    <span>{isHindi ? "फ़िल्टर रीसेट करें" : "Reset Filters"}</span>
                  </button>
                )}
              </div>
            ) : (
              <div className={styles.examGrid}>
                <AnimatePresence>
                  {filteredExams.map((exam) => (
                    <motion.div
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      key={exam.id}
                      className={styles.examCardWrapper}
                    >
                      <Link
                        href={`/mock-tests/${exam.id}`}
                        className={styles.examCard}
                      >
                        <div className={styles.examCardTop}>
                          <div className={styles.iconBox}>
                            {exam.emoji || "📝"}
                          </div>
                          {exam.category && (
                            <span className={styles.cardBadge}>
                              {exam.category.name}
                            </span>
                          )}
                        </div>

                        <h4 className={styles.examName}>{exam.name}</h4>
                        <p className={styles.examDesc}>
                          {exam.description ||
                            (isHindi
                              ? `${exam.name} के लिए फुल-लेंथ व सेक्शनल मॉक टेस्ट हल करें।`
                              : `Prepare for ${exam.name} with full-length mocks.`)}
                        </p>

                        {/* Test Highlights Badges */}
                        <div className={styles.cardFeaturesRow}>
                          <span className={`${styles.cardFeaturePill} ${styles.cardFeaturePillPrimary}`}>
                            📋 {exam._count?.papers || 0} {isHindi ? "टेस्ट पेपर्स" : "Tests"}
                          </span>
                          <span className={styles.cardFeaturePill}>
                            ✓ {isHindi ? "फ्री डेमो" : "Free Demo"}
                          </span>
                          <span className={styles.cardFeaturePill}>
                            🌐 {isHindi ? "द्विभाषी (EN/HI)" : "Bilingual"}
                          </span>
                        </div>

                        <div className={styles.examFooter}>
                          <div className={styles.testCount}>
                            <span>🎯</span>{" "}
                            <span>{isHindi ? "ऑल इंडिया रैंक" : "AIR Rank"}</span>
                          </div>
                          <div className={styles.viewBtn}>
                            {isHindi ? "टेस्ट देखें →" : "Explore Tests →"}
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </section>
      )}
    </main>
  );
}
