"use client";

import { useState, useMemo, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useData } from "@/context/DataContext";
import { useQuiz } from "@/context/QuizContext";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import styles from "@/styles/CategorySets.module.css";
import ResumeBanner from "@/components/ResumeBanner";

// Helper function to detect if text is Hindi
function isHindiText(text) {
  if (!text || typeof text !== 'string') return false;
  const hindiRegex = /[\u0900-\u097F]/;
  return hindiRegex.test(text);
}

// Helper function to detect quiz language
function detectQuizLanguage(questions) {
  if (!questions || !Array.isArray(questions) || questions.length === 0) return 'en';
  const sampleQuestions = questions.slice(0, Math.min(3, questions.length));
  let hindiCount = 0;
  sampleQuestions.forEach(q => {
    const hasHindi = isHindiText(q.text) || (Array.isArray(q.options) && q.options.some(opt => isHindiText(opt)));
    if (hasHindi) hindiCount++;
  });
  return hindiCount > sampleQuestions.length / 2 ? 'hi' : 'en';
}

const SETS_PER_PAGE = 6;
const TIMER_OPTIONS = [
  { label: "No Timer", value: 0 },
  { label: "30s", value: 30 },
  { label: "60s", value: 60 },
  { label: "90s", value: 90 },
];

export default function CategorySetsPage() {
  const params = useParams();
  const router = useRouter();
  const { quizzes } = useData();
  const { startQuizSet, startQuizResume } = useQuiz();
  const { data: session } = useSession();

  const [category, setCategory] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [questionsLoaded, setQuestionsLoaded] = useState(false);
  const [setSize, setSetSize] = useState(20);

  const [timer, setTimer] = useState(0);
  const [language, setLanguage] = useState("en");
  const [selectedSet, setSelectedSet] = useState(null);
  const [page, setPage] = useState(1);
  const [searchQuestion, setSearchQuestion] = useState("");
  const [revealedAnswers, setRevealedAnswers] = useState(new Set());
  const [isTranslatingIndex, setIsTranslatingIndex] = useState(false);
  const [userProgress, setUserProgress] = useState([]);
  const [showResumeChoice, setShowResumeChoice] = useState(false);
  const [isMixMode, setIsMixMode] = useState(false);
  const [numQuestions, setNumQuestions] = useState(20);
  const [difficulty, setDifficulty] = useState("ALL");
  const [viewSetIndex, setViewSetIndex] = useState(null);

  // Sync index language with quiz context when clicking toggle
  const { translateQuiz } = useQuiz();

  // Load category metadata first
  useEffect(() => {
    if (params.slug) {
      setLoading(true);
      setError(null);
      fetch(`/api/categories/${params.slug}?metaOnly=true`, { cache: 'no-store' })
        .then(res => {
          if (!res.ok) throw new Error("Category not found");
          return res.json();
        })
        .then(data => {
          if (data.error) throw new Error(data.error);
          setCategory(data);
          setLoading(false);

          // Background fetch all questions
          fetch(`/api/categories/${params.slug}`, { cache: 'no-store' })
            .then(res => res.json())
            .then(fullData => {
              setQuestions(fullData.questions || []);
              setQuestionsLoaded(true);
            })
            .catch(err => console.error("Error loading questions:", err));
        })
        .catch(err => {
          console.error("Error loading category:", err);
          setError(err.message);
          setLoading(false);
        });
    }
  }, [params.slug]);

  // Fetch progress
  useEffect(() => {
    if (session?.user && category?.id) {
      fetch(`/api/progress?categoryId=${category.id}`)
        .then(res => res.json())
        .then(data => setUserProgress(Array.isArray(data) ? data : []))
        .catch(err => {
          console.error("Error fetching progress:", err);
        });
    }
  }, [session?.user, category?.id]);

  const sets = useMemo(() => {
    if (!category || !setSize || setSize <= 0) return [];
    const count = category.questionCount || 0;
    const result = [];

    for (let i = 0; i < count; i += setSize) {
      result.push({
        index: result.length + 1,
        start: i,
        end: Math.min(i + setSize, count),
        questions: questions.slice(i, i + setSize),
      });
    }
    return result;
  }, [category, questions, setSize]);

  const paginatedSets = useMemo(() => {
    return sets.map(set => {
      const progress = Array.isArray(userProgress)
        ? userProgress.find(p => p.setIndex === set.index)
        : null;
      return { ...set, progress };
    }).slice((page - 1) * SETS_PER_PAGE, page * SETS_PER_PAGE);
  }, [sets, page, userProgress]);

  const totalPages = Math.ceil(sets.length / SETS_PER_PAGE);

  const filteredQuestions = useMemo(() => {
    if (!searchQuestion.trim()) return questions;
    return questions.filter(q =>
      q.text.toLowerCase().includes(searchQuestion.toLowerCase()) ||
      (q.options && q.options.some(opt => opt.toLowerCase().includes(searchQuestion.toLowerCase())))
    );
  }, [questions, searchQuestion]);

  const subCategories = useMemo(() => {
    return category?.subCategories || [];
  }, [category]);

  const handleLivePlay = (set) => {
    const sessionId = Math.random().toString(36).substring(2, 10).toUpperCase();
    toast.success("Creating live room for this set...");
    const setQuery = set ? `&setIndex=${set.index}` : '';
    router.push(`/live/${sessionId}?is_host=true&categoryId=${category?.id || params.slug}${setQuery}`);
  };

  // JSON-LD Schema for SEO
  const jsonLd = useMemo(() => {
    if (!category || !questionsLoaded) return null;
    return {
      "@context": "https://schema.org",
      "@type": "Quiz",
      "name": category.topic,
      "description": category.description,
      "educationalAlignment": [
        {
          "@type": "AlignmentObject",
          "educationalFramework": "Educational Knowledge",
          "targetName": category.topic
        }
      ],
      "hasPart": questions.slice(0, 50).map((q, idx) => {
        const correctText = String(q.correctAnswer || "").trim();
        const correctIdx = Array.isArray(q.options)
          ? q.options.findIndex(opt => String(opt).trim() === correctText)
          : -1;

        return {
          "@type": "Question",
          "name": q.text,
          "educationalLevel": category.difficulty || "Beginner",
          "suggestedAnswer": [
            {
              "@type": "Answer",
              "text": correctIdx !== -1 ? q.options[correctIdx] : correctText
            }
          ]
        };
      })
    };
  }, [category, questions, questionsLoaded]);


  const handleLanguageToggle = async (targetLang) => {
    if (isTranslatingIndex || targetLang === language) return;

    // Only translate if actually needed
    const currentContentLang = detectQuizLanguage(questions);
    if (currentContentLang === targetLang) {
      setLanguage(targetLang);
      return;
    }

    setIsTranslatingIndex(true);
    try {
      const result = await translateQuiz(questions, currentContentLang, targetLang);
      if (result?.questions) {
        setQuestions(result.questions);
      }
      setLanguage(targetLang);
    } finally {
      setIsTranslatingIndex(false);
    }
  };

  const handlePlay = (set) => {
    if (!questionsLoaded) {
      toast.error("Loading questions...");
      return;
    }
    setIsMixMode(false);
    setSelectedSet(set);
    const detectedLang = detectQuizLanguage(set.questions);
    setLanguage(detectedLang);
  };

  const handlePlayMix = () => {
    if (!questionsLoaded) {
      toast.error("Loading questions...");
      return;
    }
    setIsMixMode(true);
    setSelectedSet({ index: 'mix', questions: [] }); // Dummy set to open modal
    setLanguage(detectQuizLanguage(questions));
  };

  const handleStart = (mode = 'normal') => {
    if (!selectedSet || !questionsLoaded) return;

    let targetQuestions = selectedSet.questions;
    let topicSuffix = isMixMode ? " (Mega Mix)" : ` Set ${selectedSet.index}`;

    if (isMixMode) {
      let filtered = [...questions];
      if (difficulty !== "ALL") {
        filtered = filtered.filter(q => (q.difficulty || "").toUpperCase() === difficulty);
      }

      if (filtered.length === 0) {
        toast.error(`No ${difficulty.toLowerCase()} questions found in this category.`);
        return;
      }

      const shuffled = filtered.sort(() => 0.5 - Math.random());
      targetQuestions = shuffled.slice(0, numQuestions);
    }

    if (selectedSet.progress && !selectedSet.progress.isComplete && mode !== 'fresh') {
      startQuizResume(selectedSet.progress, targetQuestions, mode);
    } else {
      startQuizSet(category.id, targetQuestions, timer, language, selectedSet.index, category.topic + topicSuffix);
    }
    router.push(`/quiz/${category.slug || category.id}`);
  };

  const toggleAnswer = (idx) => {
    setRevealedAnswers(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  if (loading) {
    return (
      <main className={styles.page}>
        <div className={styles.skeletonPage}>
          <div className={`${styles.skeletonHeader} ${styles.shimmer}`}></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className={`${styles.skeletonCard} ${styles.shimmer}`}></div>
            ))}
          </div>
        </div>
      </main>
    );
  }

  if (error || !category) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-6 p-4 text-center">
        <div className="text-6xl mb-4">🔍</div>
        <h1 className="text-3xl font-black text-slate-800">Mystery Not Found</h1>
        <p className="text-slate-500 max-w-md font-medium">
          We couldn&apos;t find the quiz category you&apos;re looking for. It might have moved or disappeared into the void!
        </p>
        <Link href="/" className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-black shadow-xl hover:bg-indigo-700 transition-all">
          Back to Safety (Home)
        </Link>
      </div>
    );
  }

  return (
    <main className={styles.page}>
      {jsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />}

      <div className={styles.heroSection}>
        <div className={styles.categoryHeroGlass}>
          <div className={styles.heroLayout}>
            <div className={styles.heroIconBox}>
              {category.image ? <img src={category.image} alt={category.topic} className={styles.heroImg} /> : <span className={styles.heroEmoji}>{category.emoji}</span>}
            </div>
            <div className={styles.heroContent}>
              <div className={styles.heroBadgeRow}>
                <span className={styles.heroBadge}>{category.difficulty || 'Expert Mode'}</span>
                <span className={styles.heroBadgeSecondary}>{category.questionCount} Questions</span>
              </div>
              <h1 className={styles.heroTitle}>{category.topic}</h1>
              <p className={styles.heroDesc}>{category.description || "Master these concepts with our curated study sets."}</p>
              <div className={styles.heroStatsRow}>
                <div className={styles.heroStat}><span className={styles.hIcon}>📚</span> {sets.length} Sets</div>
                <div className={styles.heroStat}><span className={styles.hIcon}>⏱️</span> ~{Math.ceil(category.questionCount * 0.3)}m</div>
                <div className={styles.heroStat}><span className={styles.hIcon}>🌍</span> Multi-lang</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.contentWrap}>
        {/* Sub-Categories Navigation (Hierarchy Flow) */}
        {subCategories.length > 0 && (
          <section className={styles.setsNavigation} style={{ marginBottom: '40px' }}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>📁 Specialized Sub-Topics</h2>
              <p className={styles.sectionLead}>Explore specific sub-categories inside {category.topic}.</p>
            </div>
            <div className={styles.setsGrid}>
              {subCategories.map(subCat => (
                <Link href={`/category/${subCat.slug || subCat.id}`} key={subCat.id} className={styles.setCard} style={{ textDecoration: 'none', flexDirection: 'row', alignItems: 'center', gap: '16px', padding: '24px', cursor: 'pointer' }}>
                  <div style={{ fontSize: '2.5rem', flexShrink: 0 }}>
                    {subCat.image ? <img src={subCat.image} style={{ width: '50px', height: '50px', borderRadius: '12px', objectFit: 'cover' }} alt={subCat.topic} /> : (subCat.emoji || '📝')}
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3 className={styles.setCardTitle} style={{ marginBottom: '4px' }}>{subCat.topic}</h3>
                    <p className={styles.setCardInfo} style={{ marginBottom: '0' }}>{subCat.description || 'Explore this specialized topic'}</p>
                  </div>
                  <div style={{ color: 'var(--accent)', fontSize: '1.5rem', fontWeight: 'bold', transition: 'transform 0.2s' }}>→</div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Mega Mix Challenge Card */}
        <section className={styles.mixSection}>
          <motion.div
            className={styles.mixCard}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.02 }}
          >
            <div className={styles.mixCardInner}>
              <div className={styles.mixIconWrapper}>
                <span className={styles.mixIconCircle}>✨</span>
              </div>
              <h2 className={styles.mixTitle}>Mega Mix Challenge</h2>
              <p className={styles.mixDesc}>
                Mix questions from all sets in <strong>{category.topic}</strong>.
              </p>
              <button className={styles.btnMix} onClick={handlePlayMix}>
                <span>▷</span> Configure & Play
              </button>
            </div>
          </motion.div>
        </section>

        {/* Sets Navigation */}
        <section className={styles.setsNavigation}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>🎯 Interactive Practice Sets</h2>
            <h3 className="text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-500 my-2">{category.topic}</h3>
            <p className={styles.sectionLead}>Each set is optimized for focus and quick learning.</p>
          </div>

          <div className={styles.setsGrid}>
            {paginatedSets.map((set) => (
              <motion.div
                key={set.index}
                className={styles.setCard}
                whileHover={{ y: -8, scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <div className={styles.setCardHeader}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h3 className={styles.setCardTitle}>Set {set.index}</h3>
                    {set.progress?.isComplete && (
                      <span className={styles.masteryTick} title="100% Completed">✓</span>
                    )}
                  </div>
                  <div className={styles.setMeta}>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      {set.progress?.progress > 0 && !set.progress.isComplete && (
                        <span className={styles.progressPercent}>{Math.round(set.progress.progress)}% Done</span>
                      )}
                      <button
                        className={`${styles.viewQuestionsBtn} ${viewSetIndex === set.index ? styles.viewBtnActive : ""}`}
                        onClick={() => setViewSetIndex(viewSetIndex === set.index ? null : set.index)}
                        title={viewSetIndex === set.index ? "Hide Questions" : "View Questions"}
                        style={{ width: '38px', height: '38px', fontSize: '1rem', borderRadius: '12px', padding: 0 }}
                      >
                        👁️
                      </button>
                    </div>
                  </div>
                </div>
                <div className={styles.setCardBody}>
                  <div className={styles.setCardBadges}>
                    <span className={styles.questionCountBadge}>📝 {set.end - set.start} Questions</span>
                  </div>
                  {set.progress && (
                    <div className={styles.scoreLine}>
                      <span className={styles.scoreLabel}>Last Score:</span>
                      <span className={styles.bestScore}>
                        {(() => {
                          try {
                            const answers = JSON.parse(set.progress.answersJson || "[]");
                            const correct = answers.filter(a => a.isCorrect).length;
                            return `${correct} / ${set.end - set.start}`;
                          } catch (e) { return "0 / 0"; }
                        })()}
                      </span>
                    </div>
                  )}
                </div>
                <div className={styles.setCardActions}>
                  <button className={styles.playIconButton} onClick={() => handlePlay(set)}>
                    <span>{set.progress?.progress > 0 && !set.progress.isComplete ? "Continue Learning" : "Play Quiz"}</span>
                    <span className={styles.playArrow}>&gt;</span>
                  </button>
                  <button className={styles.liveButtonStyle} onClick={() => handleLivePlay(set)}>
                    <span className={styles.liveDot}></span>
                    Play Live
                  </button>
                </div>

                <AnimatePresence>
                  {viewSetIndex === set.index && (
                    <motion.div
                      className={styles.questionsAccordion}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className={styles.accordionHeader}>
                        <span>📝 Prep Review: {set.end - set.start} Questions</span>
                      </div>
                      <div className={styles.accordionList}>
                        {set.questions.map((q, idx) => (
                          <div key={q.id || idx} className={styles.accordionItem}>
                            <div className={styles.accordionQ}>
                              <span className={styles.accQNum}>Q{idx + 1}</span>
                              <p className={styles.accQText}>{q.text}</p>
                            </div>
                            <div className={styles.accOptions}>
                              {Array.isArray(q.options) && q.options.map((opt, oIdx) => (
                                <span key={oIdx} className={styles.accOptBadge}>{opt}</span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                      <button className={styles.accordionStartBtn} onClick={() => handlePlay(set)}>
                        Start This Set Now 🚀
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className={styles.paginationArea}>
              <button className={styles.pageArrow} disabled={page === 1} onClick={() => setPage(page - 1)}>&lt;</button>
              <div className={styles.pageDots}>
                {Array.from({ length: totalPages }).map((_, i) => (
                  <button key={i} className={`${styles.pageDot} ${page === i + 1 ? styles.dotActive : ""}`} onClick={() => setPage(i + 1)}>{i + 1}</button>
                ))}
              </div>
              <button className={styles.pageArrow} disabled={page === totalPages} onClick={() => setPage(page + 1)}>→</button>
            </div>
          )}
        </section>

        {/* --- Senior Strategy: SEO Question Index --- */}
        <section className={styles.seoIndexSection}>
          <div className={styles.indexHeader}>
            <div className={styles.indexTitleGroup}>
              <h2 className={styles.indexTitle}>📑 Question Index & Study Guide</h2>
              <div className={styles.indexLangToggle}>
                <button
                  className={language === "en" ? styles.langActive : ""}
                  onClick={() => handleLanguageToggle("en")}
                  disabled={isTranslatingIndex}
                >{isTranslatingIndex && language !== "en" ? "..." : "English Index"}</button>
                <button
                  className={language === "hi" ? styles.langActive : ""}
                  onClick={() => handleLanguageToggle("hi")}
                  disabled={isTranslatingIndex}
                >{isTranslatingIndex && language !== "hi" ? "..." : "Hindi Index"}</button>
              </div>
            </div>
            <div className={styles.searchBar}>
              <span className={styles.searchIcon}>🔍</span>
              <input
                type="text"
                placeholder="Search specific questions..."
                className={styles.searchInput}
                value={searchQuestion}
                onChange={(e) => setSearchQuestion(e.target.value)}
              />
            </div>
          </div>

          <div className={styles.questionsList}>
            {!questionsLoaded ? <div className={styles.loadingIndex}>Optimizing question index...</div> : (
              sets.map((set) => {
                const setQuestions = set.questions.filter(q =>
                  !searchQuestion.trim() ||
                  q.text.toLowerCase().includes(searchQuestion.toLowerCase()) ||
                  (q.options && q.options.some(opt => opt.toLowerCase().includes(searchQuestion.toLowerCase())))
                );

                if (setQuestions.length === 0) return null;

                return (
                  <div key={set.index} className={styles.indexSetGroup}>
                    <div className={styles.indexSetHeader}>
                      <div className={styles.indexSetInfo}>
                        <h3 className={styles.indexSetTitle}>{category.topic} Set {set.index}</h3>
                        <p className={styles.indexSetSub}>Questions #{set.start + 1} to #{set.end}</p>
                      </div>
                      <button className={styles.indexPlayBtn} onClick={() => handlePlay(set)}>
                        Play {category.topic} Quiz (Set {set.index}) →
                      </button>
                    </div>
                    <div className={styles.indexSetQuestions}>
                      {setQuestions.map((q, qOffset) => {
                        const globalIdx = set.start + set.questions.indexOf(q);
                        return (
                          <div key={globalIdx} className={styles.indexItem}>
                            {/* Monetization Slot Placeholder */}
                            {globalIdx > 0 && globalIdx % 10 === 0 && <div className={styles.adPlaceholder}><span>ADVERTISEMENT SLOT</span></div>}

                            <div className={styles.indexQuestion}>
                              <span className={styles.qNum}>#{globalIdx + 1}</span>
                              <h3 className={styles.qText}>{q.text}</h3>
                            </div>

                            <div className={styles.indexActions}>
                              <button className={styles.revealBtn} onClick={() => toggleAnswer(globalIdx)}>
                                {revealedAnswers.has(globalIdx) ? "Hide Details" : "Reveal Answer & Options"}
                              </button>
                            </div>

                            <AnimatePresence>
                              {revealedAnswers.has(globalIdx) && (
                                <motion.div
                                  className={styles.expandedDetails}
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: "auto", opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                >
                                  <ul className={styles.optionsList}>
                                    {q.options.map((opt, oIdx) => {
                                      const isCorrect = String(opt).trim() === String(q.correctAnswer).trim();
                                      return (
                                        <li key={oIdx} className={isCorrect ? styles.correctOpt : ""}>
                                          {opt} {isCorrect && <span className={styles.check}>✓</span>}
                                        </li>
                                      );
                                    })}
                                  </ul>
                                  {q.explanation && <p className={styles.explanation}><strong>Explanation:</strong> {q.explanation}</p>}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            )}
            {questionsLoaded && sets.every(s => s.questions.filter(q => !searchQuestion.trim() || q.text.toLowerCase().includes(searchQuestion.toLowerCase()) || (q.options && q.options.some(opt => opt.toLowerCase().includes(searchQuestion.toLowerCase())))).length === 0) && (
              <p className={styles.noResults}>No questions found matching your search.</p>
            )}
          </div>
        </section>
      </div>

      {/* Timer Modal (unchanged logic, updated UI) */}
      {selectedSet && (
        <div className={styles.overlay} onClick={closeModal}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <button
              className={styles.modalClose}
              onClick={closeModal}
              aria-label="Close"
              title="Close"
            >
              ✕
            </button>
            <div className={styles.modalHeader}>
              <span className={styles.modalEmoji}>{isMixMode ? "✨" : category.emoji}</span>
              <h2 className={styles.modalTitle}>
                {isMixMode ? "Mega Mix Challenge Configuration" : `Configure Practice: Set ${selectedSet.index}`}
              </h2>
            </div>

            {isMixMode && (
              <>
                <div className={styles.settingGroup}>
                  <label>📈 Number of Questions</label>
                  <div className={styles.tabRow}>
                    {[10, 20, 30, 50].map(n => (
                      <button key={n} className={numQuestions === n ? styles.tabActive : ""} onClick={() => setNumQuestions(n)}>{n}</button>
                    ))}
                  </div>
                </div>

                <div className={styles.settingGroup}>
                  <label>📊 Difficulty Level</label>
                  <div className={styles.tabRow}>
                    {["ALL", "EASY", "MEDIUM", "HARD"].map(d => (
                      <button key={d} className={difficulty === d ? styles.tabActive : ""} onClick={() => setDifficulty(d)}>{d}</button>
                    ))}
                  </div>
                </div>
              </>
            )}

            <div className={styles.settingGroup}>
              <label>Prefer English or Hindi?</label>
              <div className={styles.tabRow}>
                <button className={language === "en" ? styles.tabActive : ""} onClick={() => setLanguage("en")}>English</button>
                <button className={language === "hi" ? styles.tabActive : ""} onClick={() => setLanguage("hi")}>Hindi</button>
              </div>
            </div>

            <div className={styles.settingGroup}>
              <label>Set your pace (Time per question)</label>
              <div className={styles.tabRow}>
                {TIMER_OPTIONS.map(o => <button key={o.value} className={timer === o.value ? styles.tabActive : ""} onClick={() => setTimer(o.value)}>{o.label}</button>)}
              </div>
            </div>

            <div className={styles.modalActions}>
              <button
                className={styles.btnLaunch}
                onClick={() => handleStart('normal')}
                disabled={!questionsLoaded}
              >
                🚀 {isMixMode ? "Start Challenge" : (selectedSet.progress?.isComplete ? "Practice Again" : "Start Mastering")}
              </button>
              <button className={styles.btnLater} onClick={closeModal}>Decide Later</button>
            </div>
          </div>
        </div>
      )}

      <ResumeBanner />
    </main>
  );

  function closeModal() {
    setSelectedSet(null);
    setTimer(0);
    setIsMixMode(false);
  }
}
