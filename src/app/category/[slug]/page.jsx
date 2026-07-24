"use client";

import { useState, useMemo, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useData } from "@/context/DataContext";
import { useQuiz } from "@/context/QuizContext";
import { useLanguage } from "@/context/LanguageContext";
import { motion, AnimatePresence } from "framer-motion";
import { Users } from "lucide-react";
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

const SetCard = ({ set, t, isHindi, handlePlay, handleLivePlay, styles, isMix = false, categoryTopic = "", handlePlayMix, onViewQuestions, mixQuestions = [] }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [mixIndex, setMixIndex] = useState(0);

  const randomizedMixQuestions = useMemo(() => {
    if (!isMix || !mixQuestions || mixQuestions.length === 0) return [];
    return [...mixQuestions].sort(() => 0.5 - Math.random());
  }, [isMix, mixQuestions]);

  useEffect(() => {
    if (isMix && randomizedMixQuestions.length > 0) {
      const interval = setInterval(() => {
        setMixIndex((prev) => (prev + 1) % Math.min(randomizedMixQuestions.length, 10));
      }, 3500);
      return () => clearInterval(interval);
    }
  }, [isMix, randomizedMixQuestions]);

  const [showMixInfo, setShowMixInfo] = useState(false);

  useEffect(() => {
    if (isMix) {
      const timer = setTimeout(() => setShowMixInfo(true), 600);
      return () => clearTimeout(timer);
    }
  }, [isMix]);

  useEffect(() => {
    let timer;
    if (showMixInfo) {
      timer = setTimeout(() => setShowMixInfo(false), 5000);
    }
    return () => clearTimeout(timer);
  }, [showMixInfo]);

  const handleEyeClick = () => {
    if (window.innerWidth <= 768) {
      setIsExpanded(!isExpanded);
    } else {
      onViewQuestions(set);
    }
  };

  if (isMix) {
    return (
      <motion.div
        className={styles.setCard}
        whileHover={{ y: -8, scale: 1.02 }}
        transition={{ type: "spring", stiffness: 300 }}
        style={{ border: '2px solid var(--accent)', background: 'linear-gradient(145deg, rgba(99, 102, 241, 0.05) 0%, rgba(168, 85, 247, 0.05) 100%)' }}
      >
        <div className={styles.setCardHeader} style={{ marginBottom: '-8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
            <h3 className={styles.setCardTitle} style={{ fontSize: '0.95rem', lineHeight: '1.3', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>✨ {t('quizzes.category.megaMix')}</h3>
          </div>
          <div className={styles.setMeta}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button
                className={styles.viewQuestionsBtn}
                onClick={() => setShowMixInfo(!showMixInfo)}
                title="Mega Mix Info"
                style={{ width: '38px', height: '38px', fontSize: '1.1rem', borderRadius: '12px', padding: 0, fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                i
              </button>
            </div>
          </div>
          <AnimatePresence>
            {showMixInfo && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                style={{
                  position: 'absolute',
                  top: '55px',
                  right: '0',
                  background: 'var(--bg-primary)',
                  padding: '12px',
                  borderRadius: '12px',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                  zIndex: 10,
                  fontSize: '0.8rem',
                  color: 'var(--text-secondary)',
                  width: 'calc(100% - 20px)',
                  maxWidth: '280px',
                  border: '1px solid var(--card-border)',
                  lineHeight: '1.4'
                }}
              >
                अपनी पसंद के विषय, मनचाहे सवाल और कठिनाई स्तर चुनें! बिना टाइमर या टाइमर के साथ कस्टमाइज्ड क्विज़ खेलें और खुद को चैलेंज करें।
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <div className={styles.setCardBody}>
          <div className={styles.setCardBadges} style={{ margin: '4px 0' }}>
            <span className={styles.questionCountBadge}>📝 {mixQuestions?.length || 0} {t('quizzes.cards.questions')}</span>
          </div>
          <div style={{ margin: '8px 0 0 0', position: 'relative', height: '110px' }}>
            <AnimatePresence mode="wait">
              {randomizedMixQuestions && randomizedMixQuestions.length > 0 ? (
                <motion.div
                  key={mixIndex}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.4 }}
                  style={{ position: 'absolute', width: '100%' }}
                >
                  <p className={styles.setPreviewDesc} style={{fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0 0 8px 0', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', minHeight: '36px', lineHeight: '1.4'}}>
                    {randomizedMixQuestions[mixIndex].text}
                  </p>
                  {randomizedMixQuestions[mixIndex].options && Array.isArray(randomizedMixQuestions[mixIndex].options) && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                      {randomizedMixQuestions[mixIndex].options.slice(0, 4).map((opt, i) => (
                        <div key={i} style={{
                          fontSize: '0.75rem',
                          padding: '4px 8px',
                          background: 'rgba(99, 102, 241, 0.05)',
                          border: '1px solid rgba(99, 102, 241, 0.1)',
                          borderRadius: '6px',
                          color: 'var(--text-primary)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          textAlign: 'center'
                        }}>
                          {opt}
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              ) : (
                <p className={styles.setPreviewDesc} style={{fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', minHeight: '36px', lineHeight: '1.4'}}>
                  {t('quizzes.category.mixDesc')} {categoryTopic}.
                </p>
              )}
            </AnimatePresence>
          </div>
        </div>
        <div className={styles.setCardActions}>
          <button className={styles.playIconButton} onClick={handlePlayMix} style={{ width: '100%', justifyContent: 'center' }}>
            <span>{t('quizzes.category.configurePlay')}</span>
            <span className={styles.playArrow}>&gt;</span>
          </button>
        </div>
      </motion.div>
    );
  }

  const firstQ = set.questions && set.questions.length > 0 ? set.questions[0] : null;
  const previewDesc = firstQ ? firstQ.text : "";

  return (
    <motion.div
      className={styles.setCard}
      whileHover={{ y: -8, scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      <div className={styles.setCardHeader} style={{ marginBottom: '-8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
          <h3 className={styles.setCardTitle} style={{ fontSize: '0.95rem', lineHeight: '1.3', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={`${categoryTopic} ${t('live.lobby.selection.set')} ${set.index}`}>{categoryTopic} {t('live.lobby.selection.set')} {set.index}</h3>
          {set.progress?.isComplete && (
            <span className={styles.masteryTick} title={isHindi ? '100% पूर्ण' : '100% Completed'}>✓</span>
          )}
        </div>
        <div className={styles.setMeta}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {set.progress?.progress > 0 && !set.progress.isComplete && (
              <span className={styles.progressPercent}>{Math.round(set.progress.progress)}% Done</span>
            )}
            <button
              className={`${styles.viewQuestionsBtn} ${isExpanded ? styles.viewBtnActive : ""}`}
              onClick={handleEyeClick}
              title={isExpanded ? "Hide Questions" : "View Questions"}
              style={{ width: '38px', height: '38px', fontSize: '1rem', borderRadius: '12px', padding: 0 }}
            >
              👁️
            </button>
          </div>
        </div>
      </div>
      <div className={styles.setCardBody}>
        <div className={styles.setCardBadges} style={{ margin: '4px 0' }}>
          <span className={styles.questionCountBadge}>📝 {set.questions?.length || 0} {t('quizzes.cards.questions')}</span>
        </div>
        {previewDesc && (
           <div style={{ margin: '4px 0 0 0' }}>
             <p className={styles.setPreviewDesc} style={{fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0 0 8px 0', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', minHeight: '36px', lineHeight: '1.4'}}>
               {previewDesc}
             </p>
             {firstQ.options && Array.isArray(firstQ.options) && (
               <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                 {firstQ.options.slice(0, 4).map((opt, i) => (
                   <div key={i} style={{
                     fontSize: '0.75rem',
                     padding: '4px 8px',
                     background: 'rgba(99, 102, 241, 0.05)',
                     border: '1px solid rgba(99, 102, 241, 0.1)',
                     borderRadius: '6px',
                     color: 'var(--text-primary)',
                     whiteSpace: 'nowrap',
                     overflow: 'hidden',
                     textOverflow: 'ellipsis',
                     textAlign: 'center'
                   }}>
                     {opt}
                   </div>
                 ))}
               </div>
             )}
           </div>
        )}
        {set.progress && (
          <div className={styles.scoreLine} style={{marginTop: '12px'}}>
            <span className={styles.scoreLabel}>{t('quizzes.category.lastScore')}:</span>
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
          <span>{set.progress?.progress > 0 && !set.progress.isComplete ? t('quizzes.category.continueLearning') : t('quizzes.cards.playQuiz')}</span>
          <span className={styles.playArrow}>&gt;</span>
        </button>
        <button className={styles.liveButtonStyle} onClick={() => handleLivePlay(set)}>
          <Users size={18} />
          <span>{t('quizzes.cards.playLive')}</span>
        </button>
      </div>

      {/* Mobile Accordion Only */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            key="questions-accordion"
            className={styles.questionsAccordion}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className={styles.accordionHeader}>
              <span>📝 {t('quizzes.category.prepReview')}: {set.end - set.start} {t('quizzes.cards.questions')}</span>
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
              {t('quizzes.cards.playQuiz')} 🚀
            </button>
          </motion.div>
        )}
      </AnimatePresence>

    </motion.div>
  );
};

export default function CategorySetsPage() {
  const params = useParams();
  const router = useRouter();
  const { quizzes } = useData();
  const { startQuizSet, startQuizResume } = useQuiz();
  const { data: session } = useSession();
  const { t, isHindi, language: globalLang } = useLanguage();

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
  const [searchQuestion, setSearchQuestion] = useState("");
  const [revealedAnswers, setRevealedAnswers] = useState(new Set());
  const [isTranslatingIndex, setIsTranslatingIndex] = useState(false);
  const [userProgress, setUserProgress] = useState([]);
  const [showResumeChoice, setShowResumeChoice] = useState(false);
  const [isMixMode, setIsMixMode] = useState(false);
  const [numQuestions, setNumQuestions] = useState(20);
  const [difficulty, setDifficulty] = useState("ALL");
  const [viewSetIndex, setViewSetIndex] = useState(null);
  
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

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
        {/* Sub-Categories Navigation (Hierarchy Flow) */}
        {subCategories.length > 0 && (
          <section className={styles.setsNavigation} style={{ marginBottom: '40px' }}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>📁 {t('quizzes.category.subTopics')}</h2>
              <p className={styles.sectionLead}>{t('quizzes.category.explore')} {category.topic}.</p>
            </div>
            <div className={styles.setsGrid}>
              {subCategories.map(subCat => (
                <Link href={`/category/${subCat.slug || subCat.id}`} key={subCat.id} className={styles.setCard} style={{ textDecoration: 'none', flexDirection: 'row', alignItems: 'center', gap: '16px', padding: '24px', cursor: 'pointer' }}>
                  <div style={{ fontSize: '2.5rem', flexShrink: 0 }}>
                    {subCat.image ? <img src={subCat.image} style={{ width: '50px', height: '50px', borderRadius: '12px', objectFit: 'cover' }} alt={subCat.topic} /> : (subCat.emoji || '📝')}
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3 className={styles.setCardTitle} style={{ marginBottom: '4px' }}>
                      {isHindi && subCat.topicHi ? subCat.topicHi : subCat.topic}
                    </h3>
                    <p className={styles.setCardInfo} style={{ marginBottom: '0' }}>
                      {(isHindi && subCat.descriptionHi) ? subCat.descriptionHi : (subCat.description || (isHindi ? 'इस विषय का पता लगाएं' : 'Explore this specialized topic'))}
                    </p>
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
            <h2 className={styles.sectionTitle}>🎯 {t('quizzes.category.sets')}</h2>
            <h3 className="text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-500 my-2">
              {category.topic}
            </h3>
            <p className={styles.sectionLead}>{isHindi ? 'प्रत्येक सेट फोकस और त्वरित सीखने के लिए अनुकूलित है।' : 'Each set is optimized for focus and quick learning.'}</p>
          </div>

          <div className={styles.setsGrid}>
            {page === 1 && (
              <SetCard 
                isMix={true} 
                categoryTopic={category.topic} 
                t={t} 
                styles={styles} 
                handlePlayMix={handlePlayMix} 
                mixQuestions={questions}
              />
            )}
            {paginatedSets.map((set) => (
              <SetCard
                key={set.index}
                set={set}
                t={t}
                isHindi={isHindi}
                handlePlay={handlePlay}
                handleLivePlay={handleLivePlay}
                styles={styles}
                onViewQuestions={setActiveModalSet}
                categoryTopic={category.topic}
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
                {isMixMode ? t('quizzes.category.megaMix') : `${isHindi ? 'कॉन्फ़िगर प्रैक्टिस:' : 'Configure Practice:'} ${t('live.lobby.selection.set')} ${selectedSet.index}`}
              </h2>
            </div>

            {isMixMode && (
              <>
                <div className={styles.settingGroup}>
                  <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <span>📈 {isHindi ? 'प्रश्नों की संख्या' : 'Number of Questions'}</span>
                    <span className={styles.sliderBadge}>⚡ {numQuestions} {isHindi ? 'प्रश्न' : 'Questions'}</span>
                  </label>
                  <div className={styles.sliderBox}>
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
                  <div className={styles.tabRow}>
                    {[10, 20, 30, 50].map(n => (
                      <button key={n} className={numQuestions === n ? styles.tabActiveEmerald : ""} onClick={() => setNumQuestions(n)}><span className={styles.tabIcon}>⚡</span> {n}</button>
                    ))}
                  </div>
                </div>

                <div className={styles.settingGroup}>
                  <label>📊 {isHindi ? 'कठिनाई स्तर' : 'Difficulty Level'}</label>
                  <div className={styles.tabRow}>
                    {["ALL", "EASY", "MEDIUM", "HARD"].map(d => (
                      <button key={d} className={difficulty === d ? styles.tabActiveAmber : ""} onClick={() => setDifficulty(d)}><span className={styles.tabIcon}>{d === 'ALL' ? '🌟' : (d === 'EASY' ? '🟢' : (d === 'MEDIUM' ? '🟡' : '🔴'))}</span> {isHindi ? (d === 'ALL' ? 'सभी' : (d === 'EASY' ? 'आसान' : (d === 'MEDIUM' ? 'मध्यम' : 'कठिन'))) : d}</button>
                    ))}
                  </div>
                </div>
              </>
            )}

            <div className={styles.settingGroup}>
              <label>🌐 {isHindi ? 'अंग्रेजी या हिंदी पसंद करेंगे?' : 'Prefer English or Hindi?'}</label>
              <div className={styles.tabRow}>
                <button className={language === "en" ? styles.tabActiveCyan : ""} onClick={() => setLanguage("en")}><span className={styles.tabIcon}>🇬🇧</span> English</button>
                <button className={language === "hi" ? styles.tabActiveCyan : ""} onClick={() => setLanguage("hi")}><span className={styles.tabIcon}>🇮🇳</span> Hindi</button>
              </div>
            </div>

            <div className={styles.settingGroup}>
              <label>⏱️ {isHindi ? 'अपनी गति निर्धारित करें (प्रति प्रश्न समय)' : 'Set your pace (Time per question)'}</label>
              <div className={styles.tabRow}>
                {TIMER_OPTIONS.map(o => <button key={o.value} className={timer === o.value ? styles.tabActiveRuby : ""} onClick={() => setTimer(o.value)}><span className={styles.tabIcon}>{o.value === 0 ? '♾️' : '⌛'}</span> {o.label}</button>)}
              </div>
            </div>

            <div className={styles.modalActions}>
              <button
                className={styles.btnLaunch}
                onClick={() => handleStart('normal')}
                disabled={!questionsLoaded}
              >
                🚀 {isMixMode ? (isHindi ? 'चुनौती शुरू करें' : 'Start Challenge') : (selectedSet.progress?.isComplete ? (isHindi ? 'फिर से अभ्यास करें' : 'Practice Again') : (isHindi ? 'सीखना शुरू करें' : 'Start Mastering'))}
              </button>
              <button className={styles.btnLater} onClick={closeModal}>{isHindi ? 'बाद में तय करें' : 'Decide Later'}</button>
            </div>
          </div>
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

      <ResumeBanner />
    </main>
  );

  function closeModal() {
    setSelectedSet(null);
    setTimer(0);
    setIsMixMode(false);
  }
}
