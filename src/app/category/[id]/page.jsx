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
  if (!questions || !Array.isArray(questions) || questions.length === 0) return 'en';
  
  // Check first few questions to determine language
  const sampleQuestions = questions.slice(0, Math.min(3, questions.length));
  let hindiCount = 0;
  
  sampleQuestions.forEach(q => {
    const hasHindi = isHindiText(q.text) || (Array.isArray(q.options) && q.options.some(opt => isHindiText(opt)));
    if (hasHindi) {
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

  const [category, setCategory] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [questionsLoaded, setQuestionsLoaded] = useState(false);
  const [setSize, setSetSize] = useState(20);

  const [timer, setTimer] = useState(0);
  const [language, setLanguage] = useState("en");
  const [selectedSet, setSelectedSet] = useState(null);
  const [page, setPage] = useState(1);

  // Load category metadata first for instant UI
  useEffect(() => {
    if (params.id) {
      // Fetch only metadata first
      fetch(`/api/categories/${params.id}?metaOnly=true`)
        .then(res => res.json())
        .then(data => {
          setCategory(data);
          setLoaded(true);
          
          // Now fetch all questions in the background
          fetch(`/api/categories/${params.id}`)
            .then(res => res.json())
            .then(fullData => {
              setQuestions(fullData.questions || []);
              setQuestionsLoaded(true);
            })
            .catch(err => console.error("Error loading questions:", err));
        })
        .catch(err => console.error("Error loading category:", err));
    }
  }, [params.id]);

  const sets = useMemo(() => {
    if (!category || !setSize || setSize <= 0) return [];
    const count = category.questionCount || 0;
    const result = [];
    
    for (let i = 0; i < count; i += setSize) {
      result.push({
        index: result.length + 1,
        start: i,
        end: Math.min(i + setSize, count),
        // Note: actual questions are added only if questionsLoaded is true
        questions: questions.slice(i, i + setSize),
      });
    }
    return result;
  }, [category, questions, setSize]);

  const paginatedSets = useMemo(() => {
    return sets.slice(
      (page - 1) * SETS_PER_PAGE,
      page * SETS_PER_PAGE
    );
  }, [sets, page]);

  const totalPages = Math.ceil(sets.length / SETS_PER_PAGE);

  const subCategories = useMemo(() => {
    if (!category || !quizzes) return [];
    return (quizzes || []).filter((c) => c.parentId === category.id && !c.hidden);
  }, [quizzes, category]);

  if (!loaded) {
    return (
      <main className={styles.page}>
        <div className={styles.loadingContainer}>
          <div className={styles.loaderWrapper}>
            <div className={styles.loaderCircle}></div>
            <div className={styles.loaderCircle}></div>
            <div className={styles.loaderCircle}></div>
            <div className={styles.loaderText}>Loading</div>
          </div>
        </div>
      </main>
    );
  }

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
    if (!questionsLoaded) {
      alert("Still loading questions, please wait a moment...");
      return;
    }
    setSelectedSet(set);
    setTimer(0);
    // Auto-detect the language of the quiz content
    const detectedLang = detectQuizLanguage(set.questions);
    setLanguage(detectedLang);
  };

  const handleStart = () => {
    if (!selectedSet) return;
    startQuizSet(category.id, selectedSet.questions, timer, language, selectedSet.index);
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
                {category.questionCount} questions
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
                ~{Math.ceil(category.questionCount * 0.3)} mins
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
      {subCategories.length > 0 && (
        <div className={styles.subCategories}>
          <h2 className={styles.subTitle}>
            <span className={styles.subTitleIcon}>🔍</span>
            Explore Sub-categories
          </h2>
          <div className={styles.subGrid}>
            {subCategories.map((sub) => (
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
            Choose a set to start practicing. Each set contains {setSize} questions.
            {!questionsLoaded && <span className={styles.backgroundLoading}> (Loading questions in background...)</span>}
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
                <div key={set.index} className={styles.setCard}>
                  <div className={styles.setCardImage}>
                    <div className={styles.setCardIcon}>
                      <span className={styles.setEmoji}>🎮</span>
                    </div>
                  </div>
                  <div className={styles.setCardBody}>
                    <h3 className={styles.setCardTitle}>Set {set.index}</h3>
                    
                    <button
                      className={styles.playBtn}
                      onClick={() => handlePlay(set)}
                    >
                      Play Quiz
                    </button>

                    <div className={styles.setCardFooter}>
                      <span className={styles.setRange}>
                        Q {set.start + 1} – {set.end}
                      </span>
                      <span className={styles.setTime}>
                        ~{Math.ceil((set.end - set.start) * 0.3)} mins
                      </span>
                    </div>
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
                {selectedSet.end - selectedSet.start} questions (Q
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
