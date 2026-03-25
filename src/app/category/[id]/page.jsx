"use client";

import { useState, useMemo, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useData } from "@/context/DataContext";
import { useQuiz } from "@/context/QuizContext";
import styles from "@/styles/CategorySets.module.css";

// Helper function to detect if text is Hindi
function isHindiText(text) {
  if (!text || typeof text !== 'string') return false;
  // Hindi Unicode range: \u0900-\u097F
  const hindiRegex = /[\u0900-\u097F]/;
  return hindiRegex.test(text);
}

// Helper function to detect quiz language
function detectQuizLanguage(questions) {
  if (!questions || questions.length === 0) return 'en';
  
  // Check first few questions to determine language
  const sampleQuestions = questions.slice(0, Math.min(3, questions.length));
  let hindiCount = 0;
  
  sampleQuestions.forEach(q => {
    if (isHindiText(q.text) || (q.options && q.options.some(opt => isHindiText(opt)))) {
      hindiCount++;
    }
  });
  
  // If majority of sample questions have Hindi text, consider it Hindi
  return hindiCount > sampleQuestions.length / 2 ? 'hi' : 'en';
}

const SET_SIZE = 30;
const SETS_PER_PAGE = 6;
const TIMER_OPTIONS = [
  { label: "No Timer", value: 0 },
  { label: "30 seconds", value: 30 },
  { label: "60 seconds", value: 60 },
  { label: "90 seconds", value: 90 },
];

const CARD_GRADIENTS = [
  "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  "linear-gradient(135deg, #10b981 0%, #059669 100%)",
  "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
  "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
  "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)",
  "linear-gradient(135deg, #ec4899 0%, #db2777 100%)",
];

export default function CategorySetsPage() {
  const params = useParams();
  const router = useRouter();
  const { quizzes } = useData();
  const { startQuizSet } = useQuiz();

  const category = quizzes.find((c) => c.id === params.id);
  const [timer, setTimer] = useState(0);
  const [language, setLanguage] = useState("en");
  const [selectedSet, setSelectedSet] = useState(null);
  const [page, setPage] = useState(1);

  const sets = useMemo(() => {
    if (!category) return [];
    const result = [];
    const qs = category.questions;
    for (let i = 0; i < qs.length; i += SET_SIZE) {
      result.push({
        index: result.length + 1,
        start: i,
        end: Math.min(i + SET_SIZE, qs.length),
        questions: qs.slice(i, i + SET_SIZE),
      });
    }
    return result;
  }, [category]);

  const totalPages = Math.ceil(sets.length / SETS_PER_PAGE);
  const paginatedSets = sets.slice(
    (page - 1) * SETS_PER_PAGE,
    page * SETS_PER_PAGE
  );

  if (!category) {
    return (
      <main className={styles.page}>
        <div className={styles.empty}>
          <h2>Category not found</h2>
          <button className="btn-primary" onClick={() => router.push("/")}>
            Back to Home
          </button>
        </div>
      </main>
    );
  }

  const handlePlay = (set) => {
    setSelectedSet(set);
    setTimer(0);
    // Auto-detect the language of the quiz content
    const detectedLang = detectQuizLanguage(set.questions);
    setLanguage(detectedLang);
  };

  const handleStart = () => {
    if (!selectedSet) return;
    startQuizSet(category.id, selectedSet.questions, timer, language);
    router.push(`/quiz/${category.id}`);
  };

  const closeModal = () => {
    setSelectedSet(null);
    setTimer(0);
    setLanguage(category?.originalLang || "en");
  };

  return (
    <main className={styles.page}>
      {/* Category Header */}
      <div className={styles.header}>
        <div className={styles.headerImage}>
          {category.image ? (
            <img src={category.image} alt={category.topic} className={styles.headerImg} />
          ) : (
            <span className={styles.headerEmoji}>{category.emoji}</span>
          )}
        </div>
        <div className={styles.headerInfo}>
          <h1 className={styles.title}>{category.topic}</h1>
          <p className={styles.desc}>{category.description}</p>
          <p className={styles.totalCount}>
            {category.questions.length} questions · {sets.length}{" "}
            {sets.length === 1 ? "set" : "sets"}
          </p>
        </div>
      </div>

      {/* Sub-categories */}
      {quizzes.some((c) => c.parentId === category.id && !c.hidden) && (
        <div className={styles.subCategories}>
          <h2 className={styles.subTitle}>Explore Sub-categories</h2>
          <div className={styles.subGrid}>
            {quizzes
              .filter((c) => c.parentId === category.id && !c.hidden)
              .map((sub) => (
                <Link
                  key={sub.id}
                  href={`/category/${sub.id}`}
                  className={`${styles.subCard} glass-card`}
                >
                  <span className={styles.subEmoji}>{sub.emoji}</span>
                  <div className={styles.subInfo}>
                    <span className={styles.subName}>{sub.topic}</span>
                    <span className={styles.subCount}>
                      {sub.questions?.length || 0} questions
                    </span>
                  </div>
                </Link>
              ))}
          </div>
        </div>
      )}

      {/* Sets Grid */}
      {sets.length === 0 ? (
        <p className={styles.emptyText}>No questions in this category yet.</p>
      ) : (
        <>
          <div className={styles.grid}>
            {paginatedSets.map((set, i) => (
              <div key={set.index} className={`${styles.setCard} glass-card`}>
                <div
                  className={styles.setCardTop}
                  style={{
                    background:
                      CARD_GRADIENTS[(set.index - 1) % CARD_GRADIENTS.length],
                  }}
                >
                  <span className={styles.setNum}>Set {set.index}</span>
                </div>
                <div className={styles.setCardBody}>
                  <p className={styles.setRange}>
                    Questions {set.start + 1} – {set.end}
                  </p>
                  <p className={styles.setCount}>
                    {set.questions.length} questions
                  </p>
                  <button
                    className={`btn-primary ${styles.playBtn}`}
                    onClick={() => handlePlay(set)}
                  >
                    ▶ Play Quiz
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className={styles.pagination}>
              <button
                className={styles.pageBtn}
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
              >
                ← Previous
              </button>
              <div className={styles.pageNumbers}>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (p) => (
                    <button
                      key={p}
                      className={`${styles.pageNum} ${
                        p === page ? styles.pageNumActive : ""
                      }`}
                      onClick={() => setPage(p)}
                    >
                      {p}
                    </button>
                  )
                )}
              </div>
              <button
                className={styles.pageBtn}
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}

      {/* Timer Modal */}
      {selectedSet && (
        <div className={styles.overlay} onClick={closeModal}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <button className={styles.closeBtn} onClick={closeModal}>
              ✕
            </button>
            <div className={styles.modalHeader}>
              <span className={styles.modalEmoji}>{category.emoji}</span>
              <h2 className={styles.modalTitle}>
                {category.topic} — Set {selectedSet.index}
              </h2>
              <p className={styles.modalDesc}>
                {selectedSet.questions.length} questions (Q
                {selectedSet.start + 1}–{selectedSet.end})
              </p>
            </div>

            <div className={styles.settingGroup}>
              <label className={styles.settingLabel}>
                Select Language
              </label>
              <div className={styles.optionRow}>
                <button
                  type="button"
                  className={`${styles.optionBtn} ${
                    language === "en" ? styles.active : ""
                  }`}
                  onClick={(e) => {
                    e.preventDefault();
                    setLanguage("en");
                  }}
                >
                  🇺🇸 English
                </button>
                <button
                  type="button"
                  className={`${styles.optionBtn} ${
                    language === "hi" ? styles.active : ""
                  }`}
                  onClick={(e) => {
                    e.preventDefault();
                    setLanguage("hi");
                  }}
                >
                  🇮🇳 Hindi
                </button>
              </div>
            </div>

            <div className={styles.settingGroup}>
              <label className={styles.settingLabel}>
                Timer (per question)
              </label>
              <div className={styles.optionRow}>
                {TIMER_OPTIONS.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    className={`${styles.optionBtn} ${
                      timer === t.value ? styles.active : ""
                    }`}
                    onClick={(e) => {
                      e.preventDefault();
                      setTimer(t.value);
                    }}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              className={`btn-primary ${styles.startBtn}`}
              onClick={(e) => {
                e.preventDefault();
                handleStart();
              }}
            >
              🚀 Start Quiz
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
