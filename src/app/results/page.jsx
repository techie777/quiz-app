"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, User, Download, FileText, Lock, Crown, Share2 } from "lucide-react";
import { useQuiz } from "@/context/QuizContext";
import { useSession } from "next-auth/react";
import { useData } from "@/context/DataContext";
import { useLanguage } from "@/context/LanguageContext";
import styles from "@/styles/ResultPage.module.css";
import { useMonetization } from "@/context/MonetizationContext";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import AdGate from "@/components/monetization/AdGate";
import { toPng } from "html-to-image";
import toast from "react-hot-toast";

function getMotivation(percentage, t) {
  if (percentage === 100) return { text: t('result.motivation.perfect'), emoji: "🌟" };
  if (percentage >= 80) return { text: t('result.motivation.great'), emoji: "🎉" };
  if (percentage >= 60) return { text: t('result.motivation.good'), emoji: "👍" };
  if (percentage >= 40) return { text: t('result.motivation.practice'), emoji: "💪" };
  return { text: t('result.motivation.keepGoing'), emoji: "📚" };
}

const CONFETTI_COLORS = ["#4361ee", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#00e5ff"];

export default function ResultPage() {
  const router = useRouter();
  const { isPro } = useMonetization();
  const { data: authSession } = useSession();
  const { t, isHindi } = useLanguage();
  const { 
    score, 
    questions, 
    answers, 
    quizId, 
    difficulty, 
    timerSetting, 
    language, 
    selectedSetIndex, 
    resetQuiz, 
    startQuiz, 
    startQuizSet,
    startMixedQuiz,
    isMixedMode,
    mixedSectionName,
    quizSlug,
    categoryName: quizCategoryName
  } = useQuiz();
  const { quizzes } = useData();
  const [showReview, setShowReview] = useState(false);
  const [confetti, setConfetti] = useState([]);
  const [showPostQuizPopup, setShowPostQuizPopup] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAllQuizzes, setShowAllQuizzes] = useState(false);
  const [showGateAd, setShowGateAd] = useState(true);
  const [userProfile, setUserProfile] = useState(null);
  const resultCardRef = useRef(null);

  useEffect(() => {
    if (authSession?.user && !authSession.user.isAdmin) {
      fetch("/api/user/profile")
        .then((r) => r.json())
        .then((data) => {
          setUserProfile(data);
        })
        .catch(() => {});
    }
  }, [authSession]);

  const category = useMemo(() => {
    if (isMixedMode) return null;
    return (quizzes || []).find((q) => q.id === quizId);
  }, [quizzes, quizId, isMixedMode]);

  const filteredQuizzes = useMemo(() => {
    if (!quizzes || !Array.isArray(quizzes)) return [];
    const validQuizzes = quizzes.filter(q => q && q.topic && !q.hidden);
    
    // If showAllQuizzes is false, and no search query, show only first 6 recommendations
    // If search query is present, search across all valid quizzes
    if (!showAllQuizzes && !searchQuery) {
      return validQuizzes.slice(0, 6);
    }
    
    const query = searchQuery.toLowerCase();
    return validQuizzes.filter(q => 
      (q.topic && q.topic.toLowerCase().includes(query)) ||
      (q.description && q.description.toLowerCase().includes(query))
    ).slice(0, showAllQuizzes ? 50 : 10);
  }, [quizzes, searchQuery, showAllQuizzes]);

  // Show suggestions 5 seconds after results are revealed (post-ad)
  useEffect(() => {
    if (questions && questions.length > 0 && !showGateAd) {
      const timer = setTimeout(() => {
        setShowPostQuizPopup(true);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [questions, showGateAd]);

  const handleContinueNextSet = () => {
     if (isMixedMode) {
       router.push("/");
       return;
     }
     router.push(`/category/${quizSlug || quizId}`);
   };

   const handleSuggestionClick = (suggestionId) => {
     setShowPostQuizPopup(false);
      const suggestion = quizzes.find(q => q.id === suggestionId);
      router.push(`/category/${suggestion?.slug || suggestionId}`);

   };

  const performance = useMemo(() => {
    if (!questions || questions.length === 0) return null;
    const total = questions.length;
    const correct = score;
    const skipped = total - answers.length;
    const wrong = total - correct - skipped;
    const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;

    return { correct, wrong, skipped, total, accuracy };
  }, [questions, score, answers]);

  const total = performance?.total || 0;
  const percentage = performance?.accuracy || 0;
  const motivation = getMotivation(percentage, t);

  // Always call this hook - handle redirection logic inside
  useEffect(() => {
    if (total === 0) {
      router.replace("/");
    }
  }, [total, router]);

  // Always call this hook - handle confetti logic inside
  useEffect(() => {
    if (total === 0) return;
    const pieces = Array.from({ length: 40 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 2,
      duration: 2 + Math.random() * 2,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      rotation: Math.random() * 360,
    }));
    setConfetti(pieces);
  }, [total]);

  const handlePlayAgain = () => {
    if (isMixedMode) {
      startMixedQuiz(questions, mixedSectionName, timerSetting, difficulty, language);
      router.push("/quiz/mix");
      return;
    }
    startQuizSet(quizId, questions, timerSetting, language);
    router.push(`/quiz/${quizId}`);
  };

  const handleBackToQuizzes = () => {
    resetQuiz();
    if (isMixedMode) {
      router.push("/");
      return;
    }
    router.push(`/category/${quizSlug || quizId}`);
  };

  const handleExportPDF = () => {
    if (!isPro) {
        toast.error(t('result.export.proOnly'));
        return;
    }

    const doc = new jsPDF();
    doc.setFontSize(22);
    doc.text(t('result.export.reportTitle'), 105, 20, { align: "center" });
    
    doc.setFontSize(14);
    doc.text(`${t('result.export.category')}: ${category?.topic || "General"}`, 20, 40);
    doc.text(`${t('result.stats.total')}: ${score} / ${total}`, 20, 50);
    doc.text(`${t('result.accuracy')}: ${percentage}%`, 20, 60);

    const tableData = [];
    questions.forEach((q, i) => {
        const answer = answers.find(a => a.questionId === q.id);
        const selected = answer && answer.selected !== null ? q.options[answer.selected] : "N/A";
        tableData.push([i + 1, q.text, q.correctAnswer, selected, answer?.isCorrect ? t('result.review.badgeCorrect') : t('result.review.badgeWrong')]);
    });

    autoTable(doc, {
        startY: 70,
        head: [['#', t('result.review.question'), t('result.review.correct'), t('result.review.yourAnswer'), t('result.status')]],
        body: tableData,
    });

    doc.save(`Quiz-Report-${quizId || 'General'}.pdf`);
  };

  // Always return JSX - never return null or conditionally skip hooks
  return (
    <main className={styles.page}>
      {total === 0 || (showGateAd && !isPro) ? (
        // Loading / Gated state
        <div className={styles.loadingContainer}>
          <div className={styles.spinner}></div>
          <h1>{showGateAd ? t('result.unlocking') : t('result.loading')}</h1>
          <p>{showGateAd ? t('result.supportUs') : t('result.analyzing')}</p>
        </div>
      ) : (
        // Full results show only after ad is done or if user is Pro
        <div className={styles.resultContainer}>
          {/* Left Sidebar: You May Like */}
          <aside className={styles.sidebarLeft}>
            <h3 className={styles.sidebarTitle}>{t('result.sidebar.youMayLike')}</h3>
            <div className={styles.suggestedList}>
              {quizzes.slice(0, 3).map(quiz => (
                <div key={quiz.id} className={styles.suggestedCard} onClick={() => router.push(`/category/${quiz.slug || quiz.id}`)}>
                  <span className={styles.suggestedEmoji}>{quiz.emoji || "📝"}</span>
                  <div className={styles.suggestedInfo}>
                    <span className={styles.suggestedName}>
                      {isHindi && quiz.topicHi ? quiz.topicHi : quiz.topic}
                    </span>
                    <span className={styles.suggestedQuestions}>{quiz.questionCount || 0} {isHindi ? 'प्रश्न' : 'Qs'}</span>
                  </div>
                </div>
              ))}
            </div>
          </aside>

          {/* Center: Main Content */}
          <div className={styles.mainContent}>
            {/* Confetti */}
            <div className={styles.confettiContainer}>
              {confetti.map((piece) => (
                <div
                  key={piece.id}
                  className={styles.confettiPiece}
                  style={{
                    left: `${piece.left}%`,
                    animationDelay: `${piece.delay}s`,
                    animationDuration: `${piece.duration}s`,
                    backgroundColor: piece.color,
                    transform: `rotate(${piece.rotation}deg)`,
                  }}
                />
              ))}
            </div>

            {/* Score Card */}
            <div id="result-card" ref={resultCardRef} className={`${styles.scoreCard} glass-card`}>
              {(quizId || isMixedMode) && (
                <div className={styles.nextSetTeaser} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: '16px' }}>
                  <button className={styles.nextSetLink} onClick={handleContinueNextSet}>
                    {isMixedMode 
                      ? `${t('result.actions.backTo')} ${mixedSectionName} ${t('common.categories') || 'Categories'}`
                      : `${t('result.actions.continue')} ${(isHindi && category?.topicHi) ? category.topicHi : (category?.topic || t('result.actions.nextSet'))} (${selectedSetIndex ? `${t('live.lobby.selection.set')} ${selectedSetIndex + 1}` : t('common.next')})`
                    }
                  </button>
                    <button onClick={async () => {
                        const shareText = t('result.share.text')
                          .replace('{score}', score)
                          .replace('{total}', total)
                          .replace('{percentage}', percentage)
                          .replace('{topic}', quizCategoryName || category?.topic || mixedSectionName || 'QuizWeb');
                        const shareUrl = window.location.origin + (quizSlug || quizId ? `/category/${quizSlug || quizId}` : '/');
                        
                        try {
                          if (resultCardRef.current && navigator.share && navigator.canShare) {
                            const dataUrl = await toPng(resultCardRef.current, { cacheBust: true, pixelRatio: 2, backgroundColor: '#0f172a' });
                            const blob = await (await fetch(dataUrl)).blob();
                            const file = new File([blob], 'quiz-result.png', { type: 'image/png' });
                            
                            if (navigator.canShare({ files: [file] })) {
                              await navigator.share({
                                files: [file],
                                title: t('result.share.title'),
                                text: shareText + "\n" + shareUrl,
                              });
                              return;
                            }
                          }
                        } catch (err) {
                          console.error("Share image failed:", err);
                        }

                        if (navigator.share) {
                            navigator.share({ title: t('result.share.title'), text: shareText, url: shareUrl }).catch(()=>{});
                        } else { 
                            navigator.clipboard.writeText(`${shareText} ${shareUrl}`); 
                            toast.success(t('result.share.copied')); 
                        }
                    }} className="flex items-center gap-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-widest hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-all ml-auto">
                        <Share2 size={14} /> {t('common.share')}
                    </button>
                </div>
              )}

              {/* Challenge a Friend Section */}
              <div className="mb-8 p-4 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-xl shadow-indigo-500/20 transform hover:scale-[1.02] transition-all">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-xl">⚔️</div>
                    <div>
                      <h4 className="text-sm font-black uppercase tracking-widest">{t('result.challenge.title') || 'Challenge a Friend'}</h4>
                      <p className="text-[10px] opacity-90 font-bold">{t('result.challenge.subtitle') || 'Prove you are the smartest in your group!'}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      const shareText = `🔥 I just scored ${score}/${total} (${percentage}%) on the ${quizCategoryName || category?.topic || 'QuizWeb'} quiz! Can you beat me?\n\nChallenge link: ${window.location.origin}${quizSlug || quizId ? `/category/${quizSlug || quizId}` : '/'}`;
                      window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, '_blank');
                    }}
                    className="px-4 py-2 bg-white text-indigo-600 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-indigo-50 transition-colors shadow-lg"
                  >
                    Send on WhatsApp
                  </button>
                </div>
              </div>
              
              {/* User Avatar & Name */}
              {authSession?.user && (
                <div className="flex flex-col items-center mb-6 animate-in fade-in zoom-in duration-500">
                  <div className="w-16 h-16 rounded-full border-4 border-indigo-500/20 p-1 mb-2">
                    <div className="w-full h-full rounded-full bg-indigo-100 flex items-center justify-center overflow-hidden">
                      {(userProfile?.avatar || authSession.user.image) ? (
                        <img 
                          src={userProfile?.avatar || authSession.user.image} 
                          alt="Profile" 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User size={32} className="text-indigo-500" />
                      )}
                    </div>
                  </div>
                  <span className="text-sm font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest">
                    {userProfile?.name || authSession.user.name}
                  </span>
                </div>
              )}

              <div className={styles.trophy}>🏆</div>
              <h1 className={styles.heading}>{t('result.title')}</h1>
              <div className={styles.scoreCircle}>
                <span className={styles.scoreNum}>{score}</span>
                <span className={styles.scoreDivider}>/</span>
                <span className={styles.scoreTotal}>{total}</span>
              </div>
              <div className={styles.motivation}>
                <span>{motivation.emoji}</span>
                <span>{motivation.text}</span>
              </div>
              <div className={styles.percentage}>{percentage}%</div>
              <div className={styles.stats}>
                <div className={styles.statItem}>
                  <span className={styles.statLabel}>{t('result.stats.total')}</span>
                  <span className={styles.statValue}>{total}</span>
                </div>
                <div className={`${styles.statItem} ${styles.correct}`}>
                  <span className={styles.statLabel}>{t('result.stats.correct')}</span>
                  <span className={styles.statValue}>{performance.correct}</span>
                </div>
                <div className={`${styles.statItem} ${styles.wrong}`}>
                  <span className={styles.statLabel}>{t('result.stats.wrong')}</span>
                  <span className={styles.statValue}>{performance.wrong}</span>
                </div>
                <div className={`${styles.statItem} ${styles.skipped}`}>
                  <span className={styles.statLabel}>{t('result.stats.skipped')}</span>
                  <span className={styles.statValue}>{performance.skipped}</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className={styles.actions}>
              <button className="btn-primary" onClick={handlePlayAgain}>
                🔄 {t('result.actions.playAgain')}
              </button>
              <button
                className="btn-secondary"
                onClick={() => setShowReview(!showReview)}
              >
                {showReview ? t('result.actions.hideAnswers') : `📋 ${t('result.actions.viewAnswers')}`}
              </button>
              <button className="btn-secondary" onClick={handleBackToQuizzes}>
                ← {t('result.actions.backToQuizzes')}
              </button>
              
              <div className="flex gap-2 w-full mt-4">
                 <button 
                   className={`flex-1 ${styles.exportBtn} ${!isPro ? "opacity-60 cursor-not-allowed" : ""}`} 
                   onClick={handleExportPDF}
                 >
                    {isPro ? <Download size={16} /> : <Lock size={16} />}
                    {isPro ? t('result.actions.exportPDF') : t('result.actions.unlockExport')}
                 </button>
              </div>
            </div>

            {/* Post-Quiz Donation Prompt */}
            <Link href="/donate" className="block mt-8 mb-4 p-1 rounded-2xl bg-gradient-to-r from-rose-100 to-rose-50 dark:from-rose-900/20 dark:to-rose-800/10 border border-rose-200 dark:border-rose-800/30 hover:scale-[1.01] transition-transform group">
              <div className="bg-white dark:bg-slate-900/50 rounded-xl px-6 py-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">☕</div>
                  <div>
                    <h4 className="text-sm font-black text-slate-800 dark:text-slate-200">{t('result.donate.title')}</h4>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">{t('result.donate.subtitle')}</p>
                  </div>
                </div>
                <div className="hidden sm:flex items-center gap-2 text-rose-500 dark:text-rose-400 font-black text-xs uppercase tracking-widest">
                  {t('result.donate.btn')} <ArrowRight size={14} />
                </div>
              </div>
            </Link>

            {/* Answer Review */}
            {showReview && (
              <div className={styles.review}>
                <h2 className={styles.reviewTitle}>{t('result.review.title')}</h2>
                {questions.map((question, index) => {
                  const answer = answers.find((a) => a.questionId === question.id);
                  const isAnswered = !!answer;
                  const isCorrect = answer?.isCorrect || false;
                  
                  const selectedOptionText = isAnswered && answer.selected !== null && answer.selected !== undefined 
                    ? question.options[answer.selected] 
                    : (answer?.selected === null ? t('result.review.timedOut') : t('result.review.skippedLabel'));
                  
                  return (
                    <div
                      key={question.id}
                      className={`${styles.reviewItem} ${
                        !isAnswered ? styles.reviewSkipped : (isCorrect ? styles.reviewCorrect : styles.reviewWrong)
                      }`}
                    >
                      <div className={styles.reviewHeader}>
                        <span className={styles.reviewNum}>Q{index + 1}</span>
                        <span className={`${styles.reviewBadge} ${!isAnswered ? styles.badgeSkipped : (isCorrect ? styles.badgeCorrect : styles.badgeWrong)}`}>
                          {!isAnswered ? `✗ ${t('result.review.badgeSkipped')}` : (isCorrect ? `✓ ${t('result.review.badgeCorrect')}` : `✗ ${t('result.review.badgeWrong')}`)}
                        </span>
                      </div>
                      <p className={styles.reviewQuestion}>
                        {(isHindi && question.textHi) ? question.textHi : question.text}
                      </p>
                      
                      <div className={styles.reviewAnswers}>
                        <p className={styles.yourAnswer}>
                          {t('result.review.yourAnswer')}: <strong>
                            {(() => {
                              if (!isAnswered || answer.selected === null) return selectedOptionText;
                              if (isHindi && Array.isArray(question.optionsHi) && question.optionsHi[answer.selected]) {
                                return question.optionsHi[answer.selected];
                              }
                              return selectedOptionText;
                            })()}
                          </strong>
                        </p>
                        <p className={styles.correctAnswer}>
                          {t('result.review.correct')}: <strong>
                            {(() => {
                              if (isHindi && Array.isArray(question.optionsHi)) {
                                const correctIdx = question.options.findIndex(opt => String(opt).trim() === String(question.correctAnswer).trim());
                                if (correctIdx !== -1 && question.optionsHi[correctIdx]) return question.optionsHi[correctIdx];
                              }
                              return question.correctAnswer;
                            })()}
                          </strong>
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Sidebar: Suggested Quizzes */}
          <aside className={styles.sidebarRight}>
            <h3 className={styles.sidebarTitle}>{t('result.sidebar.suggested')}</h3>
            <div className={styles.suggestedList}>
              {quizzes.slice(3, 6).map(quiz => (
                <div key={quiz.id} className={styles.suggestedCard} onClick={() => router.push(`/category/${quiz.slug || quiz.id}`)}>
                  <span className={styles.suggestedEmoji}>{quiz.emoji || "🔥"}</span>
                  <div className={styles.suggestedInfo}>
                    <span className={styles.suggestedName}>
                      {isHindi && quiz.topicHi ? quiz.topicHi : quiz.topic}
                    </span>
                    <span className={styles.suggestedQuestions}>{quiz.questionCount || 0} {isHindi ? 'प्रश्न' : 'Qs'}</span>
                  </div>
                </div>
              ))}
            </div>
          </aside>
        </div>
      )}

      {/* Post Quiz Suggestions Popup (shown after a delay) */}
      {showPostQuizPopup && (
        <div className={styles.modalOverlay}>
          <div className={styles.suggestionsPopup}>
            <button className={styles.closeBtn} onClick={() => setShowPostQuizPopup(false)}>✕</button>
            
            <div className={styles.popupHeader}>
              <h2 className={styles.popupTitle}>{t('result.popup.title')}</h2>
               <div className={styles.searchBar}>
                 <input 
                   type="text" 
                   placeholder={t('result.popup.searchPlaceholder')} 
                   value={searchQuery}
                   onChange={(e) => setSearchQuery(e.target.value)}
                   className={styles.searchInput}
                 />
                 <button 
                   className={`${styles.viewAllBtn} ${showAllQuizzes ? styles.active : ""}`}
                   onClick={() => setShowAllQuizzes(!showAllQuizzes)}
                 >
                   {showAllQuizzes ? t('result.popup.showingAll') : t('result.popup.viewAll')}
                 </button>
               </div>
            </div>

            <div className={styles.popupContent}>
              {quizId && (
                <button 
                  className={styles.nextSetBtn}
                  onClick={handleContinueNextSet}
                >
                  {t('result.popup.continuePrefix')} {(isHindi && category?.topicHi) ? category.topicHi : (category?.topic || t('result.popup.thisCategory'))}
                </button>
              )}

              <div className={styles.suggestionsList}>
                 <h3 className={styles.suggestionsLabel}>
                   {showAllQuizzes ? t('result.popup.exploreAll') : t('result.popup.recommended')}
                 </h3>
                <div className={styles.miniSuggestionsGrid}>
                  {filteredQuizzes.map(quiz => (
                    <div 
                      key={quiz.id} 
                      className={styles.miniSuggestionCard}
                      onClick={() => handleSuggestionClick(quiz.id)}
                    >
                      <span className={styles.miniSuggestionEmoji}>{quiz.emoji || '📚'}</span>
                      <span className={styles.miniSuggestionTitle}>
                        {isHindi && quiz.topicHi ? quiz.topicHi : quiz.topic}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <AdGate 
         isOpen={showGateAd && total > 0 && !isPro}
         onClose={() => setShowGateAd(false)}
         onComplete={() => setShowGateAd(false)}
         title={t('result.unlocking')}
      />
    </main>
  );
}
