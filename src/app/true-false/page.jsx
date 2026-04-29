"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import { CheckCircle, ArrowRight, Brain, Sparkles, Play } from "lucide-react";
import styles from "@/styles/TrueFalse.module.css";

const LanguageToggle = ({ lang, onChange, className }) => (
  <div 
    className={`${styles.langToggle} ${className}`} 
    onClick={(e) => {
      e.preventDefault();
      e.stopPropagation();
      onChange(lang === "EN" ? "HI" : "EN");
    }}
  >
    <div className={`${styles.langThumb} ${lang === "HI" ? styles.langThumbHindi : ""}`} />
    <div className={`${styles.langOption} ${lang === "EN" ? styles.langOptionActive : ""}`}>EN</div>
    <div className={`${styles.langOption} ${lang === "HI" ? styles.langOptionActive : ""}`}>HI</div>
  </div>
);

export default function TrueFalseHub() {
  const { t, language: globalAppLang } = useLanguage();
  const [categories, setCategories] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [globalLang, setGlobalLang] = useState(globalAppLang.toUpperCase());

  // Sync with global app language
  useEffect(() => {
    setGlobalLang(globalAppLang.toUpperCase());
  }, [globalAppLang]);

  // Initial data load
  useEffect(() => {
    fetch("/api/true-false/categories")
      .then(res => res.json())
      .then(data => {
        setCategories(data.categories || []);
      })
      .catch(err => console.error(err));
  }, []);

  const fetchQuestions = async (pageNum, catId, reset = false) => {
    if (loadingMore || (!hasMore && !reset)) return;
    setLoadingMore(true);
    
    try {
      const res = await fetch(`/api/true-false/list?page=${pageNum}&categoryId=${catId}`);
      const data = await res.json();
      
      if (res.ok) {
        setQuestions(prev => reset ? data.questions : [...prev, ...data.questions]);
        setHasMore(data.pagination.page < data.pagination.totalPages);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMore(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    setPage(1);
    setHasMore(true);
    fetchQuestions(1, selectedCategory, true);
  }, [selectedCategory]);

  const observer = useRef();
  const lastElementRef = useCallback(node => {
    if (loadingMore) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setPage(prev => {
          const next = prev + 1;
          fetchQuestions(next, selectedCategory);
          return next;
        });
      }
    });
    if (node) observer.current.observe(node);
  }, [loadingMore, hasMore, selectedCategory]);

  return (
    <div className={styles.page}>
      <div className={styles.container}>

        {/* Voyager Play Button */}
        <div className={styles.voyagerPlayWrapper}>
          <Link href="/true-false/voyager" className={styles.voyagerPlayBtn} title={t('tf.voyager')}>
            <Play fill="currentColor" size={24} />
          </Link>
          <span className={styles.voyagerPlayLabel}>{t('tf.voyager')}</span>
        </div>

        {/* Global Language Toggle */}
        <div className={styles.globalLangWrapper}>
          <span className={styles.globalLangLabel}>{t('tf.streamLang')}</span>
          <LanguageToggle lang={globalLang} onChange={setGlobalLang} />
        </div>

        {/* Category Filters */}
        <div className={styles.categoryFilterScroll}>
          <div 
             className={`${styles.filterChip} ${selectedCategory === 'all' ? styles.filterChipActive : ''}`}
             onClick={() => setSelectedCategory('all')}
          >
            {t('tf.all')}
          </div>
          {categories.map(cat => (
            <div 
               key={cat.id}
               className={`${styles.filterChip} ${selectedCategory === cat.id ? styles.filterChipActive : ''}`}
               onClick={() => setSelectedCategory(cat.id)}
            >
              {globalAppLang === 'hi' && cat.nameHi ? cat.nameHi : cat.name}
            </div>
          ))}
        </div>

        {loading && questions.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className={styles.wallCard} style={{ background: '#022c22', height: '300px' }}></div>
            ))}
          </div>
        ) : (
          <div className={styles.wallGrid}>
            {questions.map((q, idx) => (
              <WallTrueFalseCard 
                key={q.id + idx} 
                question={q} 
                isLast={questions.length === idx + 1}
                lastRef={lastElementRef}
                globalLang={globalLang}
                t={t}
              />
            ))}
          </div>
        )}

        {loadingMore && (
          <div className="flex justify-center py-10">
            <div className={styles.loadingSpinner}></div>
          </div>
        )}

        {!hasMore && questions.length > 0 && (
          <div className="text-center py-10 text-emerald-500/50 font-bold">
            {t('tf.end')}
          </div>
        )}
      </div>
    </div>
  );
}

function WallTrueFalseCard({ question, isLast, lastRef, globalLang, t }) {
  const [localLang, setLocalLang] = useState(null);
  const [userGuess, setUserGuess] = useState(null); // null, 'correct', 'incorrect'
  
  const currentLang = localLang || globalLang;
  const displayText = currentLang === "HI" && question.statementHi ? question.statementHi : question.statement;

  const handleGuess = (e, guess) => {
    e.preventDefault();
    e.stopPropagation();
    if (userGuess) return; // Prevent multiple guesses
    
    // Correct answer is a boolean in the DB
    if (guess === question.correctAnswer) {
       setUserGuess('correct');
    } else {
       setUserGuess('incorrect');
    }
  };

  return (
    <div className={styles.wallCard} ref={isLast ? lastRef : null}>
       <div className={styles.actionBadge}>
          <LanguageToggle 
            lang={currentLang} 
            onChange={setLocalLang} 
            className={styles.langToggleSmall}
          />
        </div>

       <Link href={`/true-false/${question.category?.slug}?id=${question.id}`} className="flex-1 flex flex-col">
          <div 
            className={`${styles.wallCardContent} ${question.image ? styles.wallCardContentWithImg : ''}`}
            style={question.image ? { backgroundImage: `linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.4) 100%), url('${question.image}')` } : {}}
          >
             <h3 className={styles.bigCardText}>{displayText}</h3>
             
             {/* Gamification Layer */}
             {!userGuess ? (
               <div className={styles.wallCardActions}>
                  <button className={`${styles.guessBtn} ${styles.trueBtn}`} onClick={(e) => handleGuess(e, true)}>{t('tf.true')}</button>
                  <button className={`${styles.guessBtn} ${styles.falseBtn}`} onClick={(e) => handleGuess(e, false)}>{t('tf.false')}</button>
               </div>
             ) : (
               <div className={`${styles.resPill} ${userGuess === 'correct' ? styles.correctPill : styles.incorrectPill}`}>
                  {userGuess === 'correct' ? (
                     <><span>🎯</span> {t('tf.right')}</>
                  ) : (
                     <><span>❌</span> {t('tf.wrong')}</>
                  )}
               </div>
             )}

             <div className={styles.cardFooter}>
               <span className={styles.cardCategory}>{globalLang === 'HI' && question.category?.nameHi ? question.category?.nameHi : question.category?.name}</span>
               <div className="flex gap-2">
                 <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                 </div>
               </div>
             </div>
          </div>
       </Link>
    </div>
  );
}
