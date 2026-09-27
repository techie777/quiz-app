"use client";

import { useState, useMemo, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useData } from "@/context/DataContext";
import { useQuiz } from "@/context/QuizContext";
import { useLanguage } from "@/context/LanguageContext";
import { useTier } from "@/context/TierContext";
import { useMonetization } from "@/context/MonetizationContext";
import { motion, AnimatePresence } from "framer-motion";
import { Users } from "lucide-react";
import toast from "react-hot-toast";
import styles from "@/styles/CategorySets.module.css";
import ResumeBanner from "@/components/ResumeBanner";
import QuizEmptyState from "@/components/QuizEmptyState";
import SetCard, { FREE_SETS_QUOTA } from "@/components/SetCard";
import CategoryCard from "@/components/CategoryCard";
import UnifiedPaywallModal from "@/components/UnifiedPaywallModal";
import StickyPaywallCTA from "@/components/StickyPaywallCTA";

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

const SETS_PER_PAGE = 8;

export default function CategorySetsPage() {
  const params = useParams();
  const router = useRouter();
  const { quizzes } = useData();
  const { startQuizSet, startQuizResume } = useQuiz();
  const { data: session } = useSession();
  const { t, isHindi, language: globalLang } = useLanguage();
  const { tier } = useTier();
  const effectiveSetSize = tier === "kids" ? 10 : 20;

  const [category, setCategory] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [questionsLoaded, setQuestionsLoaded] = useState(false);
  const [setSize, setSetSize] = useState(20);
  const [activeModalSet, setActiveModalSet] = useState(null);
  const [page, setPage] = useState(1);

  // Scroll to top when page changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [page]);

  const [timer, setTimer] = useState(0);
  const [language, setLanguage] = useState(globalLang);
  const [selectedSet, setSelectedSet] = useState(null);
  const [isStarting, setIsStarting] = useState(false);
  const [searchQuestion, setSearchQuestion] = useState("");
  const [revealedAnswers, setRevealedAnswers] = useState(new Set());
  const [isTranslatingIndex, setIsTranslatingIndex] = useState(false);
  const [userProgress, setUserProgress] = useState([]);
  const [showResumeChoice, setShowResumeChoice] = useState(false);
  const [isMixMode, setIsMixMode] = useState(false);
  const [numQuestions, setNumQuestions] = useState(20);
  const [difficulty, setDifficulty] = useState("ALL");
  const { isPro } = useMonetization();
  const [paywallModalOpen, setPaywallModalOpen] = useState(false);
  const [paywallItemTitle, setPaywallItemTitle] = useState("");

  const handleLockedClick = (set) => {
    setPaywallItemTitle(`${category?.topic || "Quiz"} Set ${set?.index || ""}`);
    setPaywallModalOpen(true);
  };
  
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Pre-fetch quiz page route for zero-delay navigation
  useEffect(() => {
    if (category?.slug || category?.id) {
      router.prefetch(`/quiz/${category.slug || category.id}`);
    }
  }, [category, router]);

  useEffect(() => {
    if (selectedSet && (category?.slug || category?.id)) {
      router.prefetch(`/quiz/${category.slug || category.id}`);
    }
  }, [selectedSet, category, router]);

  // Sync index language with quiz context when clicking toggle
  const { translateQuiz } = useQuiz();

  const TIMER_OPTIONS = useMemo(() => [
    { label: "No Timer", value: 0 },
    { label: "30s", value: 30 },
    { label: "60s", value: 60 },
    { label: "90s", value: 90 },
  ], []);

  // Update document title dynamically
  useEffect(() => {
    if (category?.topic) {
      document.title = `${category.topic} | QuizWeb Pro`;
    }
  }, [category, isHindi]);

  // Sync with global language toggle
  useEffect(() => {
    if (globalLang !== language && questionsLoaded) {
      handleLanguageToggle(globalLang);
    }
  }, [globalLang]);

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
        .then(async data => {
          if (data.error) throw new Error(data.error);
          
          let finalCategory = data;
          
          // Use DB translation if available
          if (globalLang === 'hi' && data.topicHi) {
            finalCategory = { ...data, topic: data.topicHi, description: data.descriptionHi || data.description };
          } else if (globalLang === 'hi' && !isHindiText(data.topic)) {
            // Fallback to auto-translate if DB field is missing
            try {
              const metaRes = await fetch("/api/translate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text: [data.topic, data.description || ""], from: 'en', to: 'hi' }),
              });
              if (metaRes.ok) {
                const { translations } = await metaRes.json();
                finalCategory = { ...data, topic: translations[0], description: translations[1] };
              }
            } catch (e) {
              console.error("Initial meta translation failed:", e);
            }
          }

          setCategory(finalCategory);
          setLoading(false);

          // Background fetch all questions
          fetch(`/api/categories/${params.slug}`, { cache: 'no-store' })
            .then(res => res.json())
            .then(fullData => {
              setQuestions(fullData.questions || []);
              setQuestionsLoaded(true);
              
              // If global language is Hindi, also translate these questions
              if (globalLang === 'hi') {
                const currentContentLang = detectQuizLanguage(fullData.questions);
                if (currentContentLang === 'en') {
                  handleLanguageToggle('hi', fullData.questions);
                }
              }
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
    if (!category || !effectiveSetSize || effectiveSetSize <= 0) return [];
    const count = category.questionCount || 0;
    const result = [];

    for (let i = 0; i < count; i += effectiveSetSize) {
      result.push({
        index: result.length + 1,
        start: i,
        end: Math.min(i + effectiveSetSize, count),
        questions: questions.slice(i, i + effectiveSetSize),
      });
    }
    return result;
  }, [category, questions, effectiveSetSize]);

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
      (q?.text || "").toLowerCase().includes(searchQuestion.toLowerCase()) ||
      (q?.options && Array.isArray(q.options) && q.options.some(opt => (opt || "").toLowerCase().includes(searchQuestion.toLowerCase())))
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
    if (!category || !questionsLoaded || !Array.isArray(questions)) return null;
    return {
      "@context": "https://schema.org",
      "@type": "Quiz",
      "name": category.topic || "",
      "description": category.description || "",
      "educationalAlignment": [
        {
          "@type": "AlignmentObject",
          "educationalFramework": "Educational Knowledge",
          "targetName": category.topic || ""
        }
      ],
      "hasPart": questions.slice(0, 50).map((q, idx) => {
        const correctText = String(q?.correctAnswer || "").trim();
        const correctIdx = Array.isArray(q?.options)
          ? q.options.findIndex(opt => String(opt || "").trim() === correctText)
          : -1;

        return {
          "@type": "Question",
          "name": q?.text || "",
          "educationalLevel": category.difficulty || "Beginner",
          "suggestedAnswer": [
            {
              "@type": "Answer",
              "text": (correctIdx !== -1 && Array.isArray(q?.options)) ? q.options[correctIdx] : correctText
            }
          ]
        };
      })
    };
  }, [category, questions, questionsLoaded]);


  const handleLanguageToggle = async (targetLang, overrideQuestions = null) => {
    const qToTranslate = overrideQuestions || questions;
    if (isTranslatingIndex || (targetLang === language && !overrideQuestions)) return;

    // Only translate if actually needed
    const currentContentLang = detectQuizLanguage(qToTranslate);
    
    setIsTranslatingIndex(true);
    try {
      // 1. Translate Metadata if needed
      if (category && targetLang === 'hi' && !isHindiText(category.topic)) {
         const metaRes = await fetch("/api/translate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: [category.topic, category.description || ""], from: 'en', to: 'hi' }),
         });
         if (metaRes.ok) {
            const { translations } = await metaRes.json();
            setCategory(prev => ({ ...prev, topic: translations[0], description: translations[1] }));
         }
      }
      
      // 2. Translate Questions
      if (currentContentLang !== targetLang) {
        const result = await translateQuiz(qToTranslate, currentContentLang, targetLang);
        if (result?.questions) {
          setQuestions(result.questions);
        }
      }
      setLanguage(targetLang);
    } catch (e) {
      console.error("Language toggle failed:", e);
    } finally {
      setIsTranslatingIndex(false);
    }
  };

  const handlePlay = (set) => {
    if (!questionsLoaded) {
      toast.error("Loading questions...");
      return;
    }
    setIsStarting(false);
    setIsMixMode(false);
    setSelectedSet(set);
    const detectedLang = detectQuizLanguage(set.questions);
    setLanguage(detectedLang);
    if (category?.slug || category?.id) {
      router.prefetch(`/quiz/${category.slug || category.id}`);
    }
  };

  const handlePlayMix = () => {
    if (!questionsLoaded) {
      toast.error("Loading questions...");
      return;
    }
    setIsStarting(false);
    setIsMixMode(true);
    setSelectedSet({ index: 'mix', questions: [] }); // Dummy set to open modal
    setLanguage(detectQuizLanguage(questions));
    if (category?.slug || category?.id) {
      router.prefetch(`/quiz/${category.slug || category.id}`);
    }
  };

  const handleStart = (mode = 'normal') => {
    if (!selectedSet || !questionsLoaded || isStarting) return;
    setIsStarting(true);

    let targetQuestions = selectedSet.questions;
    let topicSuffix = isMixMode 
      ? ` (${t('quizzes.category.megaMix')})` 
      : ` ${t('live.lobby.selection.set')} ${selectedSet.index}`;

    if (isMixMode) {
      let filtered = [...questions];
      if (difficulty !== "ALL") {
        filtered = filtered.filter(q => (q.difficulty || "").toUpperCase() === difficulty);
      }

      if (filtered.length === 0) {
        toast.error(`No ${difficulty.toLowerCase()} questions found in this category.`);
        setIsStarting(false);
        return;
      }

      const shuffled = filtered.sort(() => 0.5 - Math.random());
      targetQuestions = shuffled.slice(0, numQuestions);
    }

    if (selectedSet.progress && !selectedSet.progress.isComplete && mode !== 'fresh') {
      startQuizResume(selectedSet.progress, targetQuestions, mode);
    } else {
      startQuizSet(category.id, targetQuestions, timer, language, selectedSet.index, category.topic + topicSuffix, true);
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

  if (!isMounted) return null;

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

      <div className={styles.contentWrap}>
        {/* Sub-Categories Navigation (Seekho Category Grid) */}
        {subCategories.length > 0 && (
          <section className="mb-10">
            <div className="mb-4">
              <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                📁 {t('quizzes.category.subTopics') || (isHindi ? "उप-विषय" : "Sub-Topics")}
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                {isHindi ? `${category.topic} के अंतर्गत विशेष विषय चुनें।` : `Explore specialized sub-categories under ${category.topic}.`}
              </p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-4">
              {subCategories.map(subCat => (
                <CategoryCard key={subCat.id} category={subCat} />
              ))}
            </div>
          </section>
        )}

        {/* If Quiz Has No Questions */}
        {questionsLoaded && questions.length === 0 ? (
          <QuizEmptyState topic={category.topic} isHindi={isHindi} />
        ) : (
          <>
            {/* Sets Section (Seekho Pattern: Vertical Stack of Set Cards below one short intro line) */}
            <section className="mt-8 mb-10">
              <div className="mb-5 border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                    🎯 {t('quizzes.category.sets') || (isHindi ? "क्विज़ सेट्स" : "Quiz Sets")}
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/50">
                    {sets.length} {isHindi ? "सेट्स" : "Sets"}
                  </span>
                </div>
                {/* One short intro line */}
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                  {isHindi
                    ? `${category.topic} के लिए ${effectiveSetSize}-प्रश्नों के सुनियोजित सेट्स हल करें और ज्ञान बढ़ाएं।`
                    : `Complete each ${effectiveSetSize}-question set to practice and master ${category.topic}.`}
                </p>
              </div>

              {/* Vertical list of Set cards with identical layout */}
              <div className="flex flex-col gap-3 sm:gap-3.5">
                {page === 1 && (
                  <SetCard 
                    isMix={true} 
                    categoryTopic={category.topic} 
                    handlePlayMix={handlePlayMix} 
                    mixQuestions={questions}
                  />
                )}
                {paginatedSets.map((set) => (
                  <SetCard
                    key={set.index}
                    set={set}
                    categoryTopic={category.topic}
                    freeQuota={FREE_SETS_QUOTA}
                    handlePlay={handlePlay}
                    handleLivePlay={handleLivePlay}
                    handleLockedClick={handleLockedClick}
                  />
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
                  <h2 className={styles.indexTitle}>📑 {isHindi ? 'प्रश्न अनुक्रमणिका और अध्ययन मार्गदर्शिका' : 'Question Index & Study Guide'}</h2>
                  <div className={styles.indexLangToggle}>
                    <button
                      className={language === "en" ? styles.langActive : ""}
                      onClick={() => handleLanguageToggle("en")}
                      disabled={isTranslatingIndex}
                    >{isTranslatingIndex && language !== "en" ? "..." : (isHindi ? 'अंग्रेजी अनुक्रमणिका' : 'English Index')}</button>
                    <button
                      className={language === "hi" ? styles.langActive : ""}
                      onClick={() => handleLanguageToggle("hi")}
                      disabled={isTranslatingIndex}
                    >{isTranslatingIndex && language !== "hi" ? "..." : (isHindi ? 'हिंदी अनुक्रमणिका' : 'Hindi Index')}</button>
                  </div>
                </div>
                <div className={styles.searchBar}>
                  <span className={styles.searchIcon}>🔍</span>
                  <input
                    type="text"
                    placeholder={isHindi ? 'विशिष्ट प्रश्न खोजें...' : 'Search specific questions...'}
                    className={styles.searchInput}
                    value={searchQuestion}
                    onChange={(e) => setSearchQuestion(e.target.value)}
                  />
                </div>
              </div>

              <div className={styles.questionsList}>
                {!questionsLoaded ? <div className={styles.loadingIndex}>{isHindi ? 'प्रश्न अनुक्रमणिका अनुकूलित की जा रही है...' : 'Optimizing question index...'}</div> : (
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
                            <h3 className={styles.indexSetTitle}>
                              {category.topic} {t('live.lobby.selection.set')} {set.index}
                            </h3>
                            <p className={styles.indexSetSub}>{isHindi ? 'प्रश्न' : 'Questions'} #{set.start + 1} {isHindi ? 'से' : 'to'} #{set.end}</p>
                          </div>
                          <button className={styles.indexPlayBtn} onClick={() => handlePlay(set)}>
                            {isHindi ? 'खेलें' : 'Play'} {category.topic} {isHindi ? 'क्विज़' : 'Quiz'} ({t('live.lobby.selection.set')} {set.index}) →
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

                                <ul className={styles.optionsList}>
                                  {q.options.map((opt, oIdx) => {
                                    const isCorrect = String(opt).trim() === String(q.correctAnswer).trim();
                                    const showCorrect = revealedAnswers.has(globalIdx) && isCorrect;
                                    return (
                                      <li key={oIdx} className={showCorrect ? styles.correctOpt : ""}>
                                        {opt} {showCorrect && <span className={styles.check}>✓</span>}
                                      </li>
                                    );
                                  })}
                                </ul>

                                <div className={styles.indexActions}>
                                  <button className={styles.revealBtn} onClick={() => toggleAnswer(globalIdx)}>
                                    {revealedAnswers.has(globalIdx) ? (isHindi ? 'उत्तर छिपाएं' : 'Hide Answer') : (isHindi ? 'उत्तर देखें' : 'View Answer')}
                                  </button>
                                </div>

                                <AnimatePresence>
                                  {revealedAnswers.has(globalIdx) && q.explanation && (
                                    <motion.div
                                      className={styles.expandedDetails}
                                      initial={{ height: 0, opacity: 0 }}
                                      animate={{ height: "auto", opacity: 1 }}
                                      exit={{ height: 0, opacity: 0 }}
                                    >
                                      <p className={styles.explanation}><strong>{isHindi ? 'स्पष्टीकरण:' : 'Explanation:'}</strong> {q.explanation}</p>
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
                  <p className={styles.noResults}>{isHindi ? 'आपकी खोज से मेल खाने वाला कोई प्रश्न नहीं मिला।' : 'No questions found matching your search.'}</p>
                )}
              </div>
            </section>
          </>
        )}
      </div>

      {/* Timer Modal (unchanged logic, updated UI) */}
      {/* Practice Set Configuration Modal (Refined, Sleek, Compact UI) */}
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

            {/* Compact, Beautiful Header */}
            <div className={styles.modalHeaderCompact}>
              <div className={styles.modalEmojiBadge}>
                {isMixMode ? "✨" : (category.emoji || "📝")}
              </div>
              <div className={styles.modalHeaderInfo}>
                <h2
                  className={styles.modalTitle}
                  title={isMixMode ? t('quizzes.category.megaMix') : `${category.topic || 'Practice'}: Set ${selectedSet.index}`}
                >
                  {isMixMode 
                    ? t('quizzes.category.megaMix') 
                    : `${category.topic || 'Practice'}: Set ${selectedSet.index}`}
                </h2>
                <div className={styles.modalMetaPills}>
                  <span className={styles.metaChipQuestions}>
                    📝 {tier === 'kids' ? 10 : (selectedSet.questions?.length > 0 ? selectedSet.questions.length : ((selectedSet.end - selectedSet.start) || 20))} {isHindi ? 'प्रश्न' : 'Questions'}
                  </span>
                  <span className={styles.metaChipMode}>
                    {isMixMode ? (isHindi ? 'मिक्स मोड' : 'Mix Rumble') : (isHindi ? 'अभ्यास मोड' : 'Practice Set')}
                  </span>
                </div>
              </div>
            </div>

            {/* Mix Mode Settings */}
            {isMixMode && (
              <div className={styles.mixSettingsContainer}>
                <div className={styles.settingGroup}>
                  <div className={styles.settingLabelRow}>
                    <span className={styles.settingLabelText}>
                      📈 {isHindi ? 'प्रश्नों की संख्या' : 'Question Count'}
                    </span>
                    <span className={styles.sliderBadgeCompact}>
                      ⚡ {numQuestions} {isHindi ? 'प्रश्न' : 'Qs'}
                    </span>
                  </div>
                  <div className={styles.sliderBoxCompact}>
                    <input 
                      type="range" 
                      min="5" 
                      max="100" 
                      step="5" 
                      value={numQuestions} 
                      onChange={(e) => setNumQuestions(parseInt(e.target.value) || 10)} 
                      className={styles.rangeSlider}
                    />
                  </div>
                  <div className={styles.presetChipRow}>
                    {[10, 20, 30, 50].map(n => (
                      <button 
                        key={n} 
                        type="button"
                        className={`${styles.presetChip} ${numQuestions === n ? styles.presetChipActive : ""}`} 
                        onClick={() => setNumQuestions(n)}
                      >
                        ⚡ {n}
                      </button>
                    ))}
                  </div>
                </div>

                <div className={styles.settingGroup}>
                  <div className={styles.settingLabelRow}>
                    <span className={styles.settingLabelText}>
                      📊 {isHindi ? 'कठिनाई स्तर' : 'Difficulty'}
                    </span>
                  </div>
                  <div className={styles.diffChipRow}>
                    {["ALL", "EASY", "MEDIUM", "HARD"].map(d => (
                      <button 
                        key={d} 
                        type="button"
                        className={`${styles.diffChip} ${difficulty === d ? styles.diffChipActive : ""}`} 
                        onClick={() => setDifficulty(d)}
                      >
                        <span>{d === 'ALL' ? '🌟' : (d === 'EASY' ? '🟢' : (d === 'MEDIUM' ? '🟡' : '🔴'))}</span>
                        <span>{isHindi ? (d === 'ALL' ? 'सभी' : (d === 'EASY' ? 'सरल' : (d === 'MEDIUM' ? 'मध्यम' : 'कठिन'))) : d}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Language Selection */}
            <div className={styles.settingGroup}>
              <div className={styles.settingLabelRow}>
                <span className={styles.settingLabelText}>
                  🌐 {isHindi ? 'भाषा चुनें' : 'Language'}
                </span>
              </div>
              <div className={styles.langGrid}>
                <button 
                  type="button"
                  className={`${styles.langOptionBtn} ${language === "en" ? styles.langOptionActive : ""}`} 
                  onClick={() => setLanguage("en")}
                >
                  <span className={styles.langFlag}>🇬🇧</span>
                  <span className={styles.langName}>English</span>
                </button>
                <button 
                  type="button"
                  className={`${styles.langOptionBtn} ${language === "hi" ? styles.langOptionActive : ""}`} 
                  onClick={() => setLanguage("hi")}
                >
                  <span className={styles.langFlag}>🇮🇳</span>
                  <span className={styles.langName}>हिन्दी</span>
                </button>
              </div>
            </div>

            {/* Pace / Timer Selection (when not Kids tier) */}
            {tier !== "kids" && (
              <div className={styles.settingGroup}>
                <div className={styles.settingLabelRow}>
                  <span className={styles.settingLabelText}>
                    ⏱️ {isHindi ? 'समय सीमा (प्रति प्रश्न)' : 'Pace (Per Question)'}
                  </span>
                </div>
                <div className={styles.timerGridCompact}>
                  {TIMER_OPTIONS.map(o => (
                    <button 
                      key={o.value} 
                      type="button"
                      className={`${styles.timerPillCompact} ${timer === o.value ? styles.timerPillActive : ""}`} 
                      onClick={() => setTimer(o.value)}
                    >
                      <span className={styles.timerIcon}>{o.value === 0 ? '♾️' : '⏳'}</span>
                      <span className={styles.timerText}>{o.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className={styles.modalActionsCompact}>
              <button
                className={styles.btnLaunchCompact}
                onClick={() => handleStart('normal')}
                disabled={!questionsLoaded || isStarting}
                style={isStarting ? { opacity: 0.85, cursor: "wait", pointerEvents: "none" } : {}}
              >
                {isStarting ? (
                  <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                    <span className={styles.spinnerInline} />
                    <span>{isHindi ? 'प्रश्नोत्तरी शुरू हो रही है...' : 'Launching Quiz...'}</span>
                  </span>
                ) : (
                  <>🚀 {isMixMode ? (isHindi ? 'चुनौती शुरू करें' : 'Start Challenge') : (selectedSet.progress?.isComplete ? (isHindi ? 'फिर से अभ्यास करें' : 'Practice Again') : (isHindi ? 'अभ्यास शुरू करें' : 'Start Practice'))}</>
                )}
              </button>
              <button className={styles.btnLaterCompact} onClick={closeModal} disabled={isStarting}>
                {isHindi ? 'रद्द करें' : 'Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Instant Launch Transition Overlay */}
      {isStarting && (
        <div 
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 10000,
            background: "rgba(15, 23, 42, 0.85)",
            backdropFilter: "blur(8px)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            color: "#ffffff"
          }}
        >
          <div style={{
            width: "56px",
            height: "56px",
            border: "4px solid rgba(99, 102, 241, 0.2)",
            borderTopColor: "#6366f1",
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
            marginBottom: "16px"
          }} />
          <h3 style={{ fontSize: "1.25rem", fontWeight: 800, margin: "0 0 6px" }}>
            {isHindi ? "🚀 अभ्यास सत्र तैयार किया जा रहा है..." : "🚀 Preparing Quiz Engine..."}
          </h3>
          <p style={{ fontSize: "0.88rem", color: "#94a3b8", margin: 0 }}>
            {isHindi ? "बस एक क्षण..." : "Just a moment..."}
          </p>
        </div>
      )}

      {/* Prep Review Modal */}
      {activeModalSet && (
        <div className={styles.overlay} onClick={() => setActiveModalSet(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px', width: '95%', overflow: 'hidden', display: 'flex', flexDirection: 'column', padding: 0 }}>
            <button
              className={styles.modalClose}
              onClick={() => setActiveModalSet(null)}
              aria-label="Close"
              title="Close"
              style={{ top: '16px', right: '16px', zIndex: 10 }}
            >
              ✕
            </button>
            <div className={styles.modalHeader} style={{ padding: '24px 24px 0', marginBottom: '16px' }}>
              <span className={styles.modalEmoji}>📝</span>
              <h2 className={styles.modalTitle}>
                {t('quizzes.category.prepReview')} (Set {activeModalSet.index})
              </h2>
            </div>
            
            <div className={styles.accordionList} style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '0 24px 16px' }}>
              {activeModalSet.questions.map((q, idx) => (
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

            <div className={styles.modalActions} style={{ padding: '16px 24px', borderTop: '1px solid var(--card-border)', marginTop: '0', display: 'flex' }}>
               <button 
                 className={styles.playIconButton} 
                 onClick={() => { setActiveModalSet(null); handlePlay(activeModalSet); }}
                 style={{ width: '100%', justifyContent: 'center', height: '56px', fontSize: '1.1rem' }}
               >
                 <span>{t('quizzes.cards.playQuiz')}</span>
                 <span className={styles.playArrow}>&gt;</span>
               </button>
            </div>
          </div>
        </div>
      )}

      {/* Sticky CTA Bar above bottom nav when viewing locked content (Requirement 5) */}
      <StickyPaywallCTA
        hasLockedContent={sets.some((s) => s.index > FREE_SETS_QUOTA)}
        isPro={isPro}
        onUnlockClick={() => {
          setPaywallItemTitle(category?.topic || "Premium Sets");
          setPaywallModalOpen(true);
        }}
      />

      {/* Unified Paywall Modal (Requirement 4) */}
      <UnifiedPaywallModal
        isOpen={paywallModalOpen}
        onClose={() => setPaywallModalOpen(false)}
        itemTitle={paywallItemTitle}
        itemType="quiz"
      />

      <ResumeBanner />
    </main>
  );

  function closeModal() {
    setSelectedSet(null);
    setTimer(0);
    setIsMixMode(false);
    setIsStarting(false);
  }
}
