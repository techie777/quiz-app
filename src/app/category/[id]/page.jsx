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
          <div className={styles.headerTop}>
            <h1 className={styles.title}>{category.topic}</h1>
            <div className={styles.headerMeta}>
              <span className={styles.difficultyBadge}>
                {category.difficulty || 'Medium'}
              </span>
              <span className={styles.questionCount}>
                {category.questions.length} questions
              </span>
            </div>
          </div>
          <p className={styles.desc}>{category.description}</p>
          <div className={styles.headerStats}>
            <div className={styles.statItem}>
              <span className={styles.statIcon}>📚</span>
              <span className={styles.statText}>
                {sets.length} {sets.length === 1 ? "set" : "sets"}
              </span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statIcon}>⏱️</span>
              <span className={styles.statText}>
                ~{Math.ceil(category.questions.length * 0.3)} mins
              </span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statIcon}>🎯</span>
              <span className={styles.statText}>
                {category.difficulty || 'Medium'} level
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Sub-categories */}
      {quizzes.some((c) => c.parentId === category.id && !c.hidden) && (
        <div className={styles.subCategories}>
          <h2 className={styles.subTitle}>
            <span className={styles.subTitleIcon}>🔍</span>
            Explore Sub-categories
          </h2>
          <div className={styles.subGrid}>
            {quizzes
              .filter((c) => c.parentId === category.id && !c.hidden)
              .map((sub) => (
                <Link
                  key={sub.id}
                  href={`/category/${sub.id}`}
                  className={`${styles.subCard} glass-card`}
                >
                  <div className={styles.subCardImage}>
                    <span className={styles.subEmoji}>{sub.emoji}</span>
                  </div>
                  <div className={styles.subInfo}>
                    <span className={styles.subName}>{sub.topic}</span>
                    <span className={styles.subCount}>
                      {sub.questions?.length || 0} questions
                    </span>
                  </div>
                  <div className={styles.subArrow}>→</div>
                </Link>
              ))}
          </div>
        </div>
      )}

      {/* Quiz Sets Section */}
      <div className={styles.setsSection}>
        <div className={styles.setsHeader}>
          <h2 className={styles.setsTitle}>
            <span className={styles.setsTitleIcon}>🎮</span>
            Quiz Sets
          </h2>
          <p className={styles.setsSubtitle}>
            Choose a set to start practicing. Each set contains {SET_SIZE} questions.
          </p>
        </div>

        {sets.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>📭</div>
            <h3 className={styles.emptyTitle}>No Questions Yet</h3>
            <p className={styles.emptyDesc}>
              This category doesn't have any questions at the moment. Check back later!
            </p>
          </div>
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
                    <div className={styles.setCardTopContent}>
                      <span className={styles.setNum}>Set {set.index}</span>
                      <span className={styles.setBadge}>New</span>
                    </div>
                  </div>
                  <div className={styles.setCardBody}>
                    <div className={styles.setInfo}>
                      <p className={styles.setRange}>
                        Questions {set.start + 1} – {set.end}
                      </p>
                      <p className={styles.setCount}>
                        {set.questions.length} questions
                      </p>
                      <div className={styles.setTime}>
                        <span className={styles.setTimeIcon}>⏱️</span>
                        <span className={styles.setTimeText}>
                          ~{Math.ceil(set.questions.length * 0.3)} mins
                        </span>
                      </div>
                    </div>
                    <button
                      className={`btn-primary ${styles.playBtn}`}
                      onClick={() => handlePlay(set)}
                    >
                      <span className={styles.playBtnIcon}>▶</span>
                      Play Quiz
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
      </div>

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
