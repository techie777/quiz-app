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
  const [loaded, setLoaded] = useState(false);
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

  // Sync index language with quiz context when clicking toggle
  const { translateQuiz } = useQuiz();

  // Load category metadata first for instant UI
  useEffect(() => {
    if (params.id) {
      fetch(`/api/categories/${params.id}?metaOnly=true`, { cache: 'no-store' })
        .then(res => res.json())
        .then(data => {
          setCategory(data);
          setLoaded(true);
          
          // Now fetch all questions in the background
          fetch(`/api/categories/${params.id}`, { cache: 'no-store' })
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

  // Fetch progress if logged in
  useEffect(() => {
    if (session?.user && params.id) {
       fetch(`/api/progress?categoryId=${params.id}`)
         .then(res => res.json())
         .then(data => setUserProgress(Array.isArray(data) ? data : []))
         .catch(err => {
           console.error("Error fetching progress:", err);
           setUserProgress([]);
         });
    }
  }, [session, params.id]);

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

  if (!loaded) {
    return (
      <main className={styles.page}>
        <div className={styles.skeletonPage}>
          <div className={styles.skeletonHeader}><div className={`${styles.skeletonCircle} ${styles.shimmer}`}></div></div>
          <div className={styles.skeletonGrid}>{[1,2,3,4,5,6].map(i => <div key={i} className={styles.skeletonCard}></div>)}</div>
        </div>
      </main>
    );
  }

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
    setSelectedSet(set);
    const detectedLang = detectQuizLanguage(set.questions);
    setLanguage(detectedLang);
  };

  const handleStart = (mode = 'normal') => {
    if (!selectedSet || !questionsLoaded) return;
    
    if (selectedSet.progress && !selectedSet.progress.isComplete && mode !== 'fresh') {
       // Resume last session (mode could be 'last' or 'unanswered')
       startQuizResume(selectedSet.progress, selectedSet.questions, mode);
    } else {
       // Start new
       startQuizSet(category.id, selectedSet.questions, timer, language, selectedSet.index);
    }
    router.push(`/quiz/${category.id}`);
  };

  const toggleAnswer = (idx) => {
    setRevealedAnswers(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

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
                    <Link href={`/category/${subCat.id}`} key={subCat.id} className={styles.setCard} style={{ textDecoration: 'none', flexDirection: 'row', alignItems: 'center', gap: '16px', padding: '24px', cursor: 'pointer' }}>
                        <div style={{ fontSize: '2.5rem', flexShrink: 0 }}>
                            {subCat.image ? <img src={subCat.image} style={{ width: '50px', height: '50px', borderRadius: '12px', objectFit: 'cover' }} alt={subCat.topic}/> : (subCat.emoji || '📝')}
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
        
        {/* Sets Navigation */}
        <section className={styles.setsNavigation}>
            <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>🎯 Interactive Practice Sets</h2>
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
                            <h3 className={styles.setCardTitle}>Study Set {set.index}</h3>
                            {set.progress?.isComplete && (
                               <span className={styles.masteryTick} title="100% Completed">✓</span>
                            )}
                            <div className={styles.setMeta}>
                              <span className={styles.setRange}>Q {set.start + 1} – {set.end}</span>
                              {set.progress?.progress > 0 && !set.progress.isComplete && (
                                <span className={styles.progressPercent}>{Math.round(set.progress.progress)}% Done</span>
                              )}
                            </div>
                        </div>
                        <div className={styles.setCardBody}>
                          <p className={styles.setCardInfo}>Contains {set.end - set.start} targeted questions.</p>
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
                        <button className={styles.playIconButton} onClick={() => handlePlay(set)}>
                            <span>{set.progress?.progress > 0 && !set.progress.isComplete ? "Continue Learning" : "Start Exploring"}</span>
                            <span className={styles.playArrow}>→</span>
                        </button>
                    </motion.div>
                ))}
            </div>

            {totalPages > 1 && (
                <div className={styles.paginationArea}>
                    <button className={styles.pageArrow} disabled={page === 1} onClick={() => setPage(page-1)}>←</button>
                    <div className={styles.pageDots}>
                        {Array.from({ length: totalPages }).map((_, i) => (
                            <button key={i} className={`${styles.pageDot} ${page === i+1 ? styles.dotActive : ""}`} onClick={() => setPage(i+1)}>{i+1}</button>
                        ))}
                    </div>
                    <button className={styles.pageArrow} disabled={page === totalPages} onClick={() => setPage(page+1)}>→</button>
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
                     filteredQuestions.map((q, idx) => (
                         <div key={idx} className={styles.indexItem}>
                             {/* Monetization Slot Placeholder */}
                             {idx > 0 && idx % 10 === 0 && <div className={styles.adPlaceholder}><span>ADVERTISEMENT SLOT</span></div>}

                             <div className={styles.indexQuestion}>
                                 <span className={styles.qNum}>#{idx + 1}</span>
                                 <h3 className={styles.qText}>{q.text}</h3>
                             </div>
                             
                             <div className={styles.indexActions}>
                                 <button className={styles.revealBtn} onClick={() => toggleAnswer(idx)}>
                                     {revealedAnswers.has(idx) ? "Hide Details" : "Reveal Answer & Options"}
                                 </button>
                             </div>

                             <AnimatePresence>
                                {revealedAnswers.has(idx) && (
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
                     ))
                 )}
                 {questionsLoaded && filteredQuestions.length === 0 && <p className={styles.noResults}>No questions found matching your search.</p>}
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
              <span className={styles.modalEmoji}>{category.emoji}</span>
              <h2 className={styles.modalTitle}>Configure Practice: Set {selectedSet.index}</h2>
            </div>

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
              {selectedSet.progress && !selectedSet.progress.isComplete ? (
                <>
                  <button 
                    className={styles.btnLaunch} 
                    onClick={() => handleStart('last')}
                    disabled={!questionsLoaded}
                  >
                    🚀 Resume Session
                  </button>
                  <button 
                    className={styles.btnMastery} 
                    onClick={() => handleStart('unanswered')}
                    disabled={!questionsLoaded}
                  >
                    🎯 Practice Unanswered
                  </button>
                  <button className={styles.btnReset} onClick={() => handleStart('fresh')}>
                    Start Fresh
                  </button>
                </>
              ) : (
                <button 
                  className={styles.btnLaunch} 
                  onClick={() => handleStart('normal')}
                  disabled={!questionsLoaded}
                >
                  🚀 {selectedSet.progress?.isComplete ? "Practice Again" : "Start Mastering"}
                </button>
              )}
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
  }
}
