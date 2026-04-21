"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useQuiz } from "@/context/QuizContext";
import { useData } from "@/context/DataContext";
import styles from "@/styles/ResultPage.module.css";
import { useMonetization } from "@/context/MonetizationContext";
import { Download, FileText, Lock, Crown, Share2 } from "lucide-react";
import jsPDF from "jspdf";
import "jspdf-autotable";
import AdGate from "@/components/monetization/AdGate";
import toast from "react-hot-toast";

function getMotivation(percentage) {
  if (percentage === 100) return { text: "Perfect Score!", emoji: "🌟" };
  if (percentage >= 80) return { text: "Great Job!", emoji: "🎉" };
  if (percentage >= 60) return { text: "Good Effort!", emoji: "👍" };
  if (percentage >= 40) return { text: "Keep Practicing!", emoji: "💪" };
  return { text: "Don't Give Up!", emoji: "📚" };
}

const CONFETTI_COLORS = ["#4361ee", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#00e5ff"];

export default function ResultPage() {
  const router = useRouter();
  const { isPro } = useMonetization();
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
    mixedSectionName
  } = useQuiz();
  const { quizzes } = useData();
  const [showReview, setShowReview] = useState(false);
  const [confetti, setConfetti] = useState([]);
  const [showPostQuizPopup, setShowPostQuizPopup] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAllQuizzes, setShowAllQuizzes] = useState(false);
  const [showGateAd, setShowGateAd] = useState(true);

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
     router.push(`/category/${quizId}`);
   };

   const handleSuggestionClick = (suggestionId) => {
     setShowPostQuizPopup(false);
     router.push(`/category/${suggestionId}`);
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
  const motivation = getMotivation(percentage);

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
    router.push(`/category/${quizId}`);
  };

  const handleExportPDF = () => {
    if (!isPro) {
        toast.error("Pro exclusive feature!");
        return;
    }

    const doc = new jsPDF();
    doc.setFontSize(22);
    doc.text("Quiz Performance Report", 105, 20, { align: "center" });
    
    doc.setFontSize(14);
    doc.text(`Category: ${category?.topic || "General"}`, 20, 40);
    doc.text(`Score: ${score} / ${total}`, 20, 50);
    doc.text(`Accuracy: ${percentage}%`, 20, 60);

    const tableData = [];
    questions.forEach((q, i) => {
        const answer = answers.find(a => a.questionId === q.id);
        const selected = answer && answer.selected !== null ? q.options[answer.selected] : "N/A";
        tableData.push([i + 1, q.text, q.correctAnswer, selected, answer?.isCorrect ? "Correct" : "Incorrect"]);
    });

    doc.autoTable({
        startY: 70,
        head: [['#', 'Question', 'Correct Answer', 'Your Answer', 'Status']],
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
          <h1>{showGateAd ? "Unlocking Your Results..." : "Loading Results..."}</h1>
          <p>{showGateAd ? "Support us by watching this short update." : "Analyzing your performance..."}</p>
        </div>
      ) : (
        // Full results show only after ad is done or if user is Pro
        <div className={styles.resultContainer}>
          {/* Left Sidebar: You May Like */}
          <aside className={styles.sidebarLeft}>
            <h3 className={styles.sidebarTitle}>You May Like</h3>
            <div className={styles.suggestedList}>
              {quizzes.slice(0, 3).map(quiz => (
                <div key={quiz.id} className={styles.suggestedCard} onClick={() => router.push(`/category/${quiz.id}`)}>
                  <span className={styles.suggestedEmoji}>{quiz.emoji || "📝"}</span>
                  <div className={styles.suggestedInfo}>
                    <span className={styles.suggestedName}>{quiz.topic}</span>
                    <span className={styles.suggestedQuestions}>{quiz.questions.length} Qs</span>
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
            <div className={`${styles.scoreCard} glass-card`}>
              {quizId && (
                <div className={styles.nextSetTeaser} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: '16px' }}>
                  <button className={styles.nextSetLink} onClick={handleContinueNextSet}>
                    {isMixedMode 
                      ? `Back to ${mixedSectionName} Categories`
                      : `Continue to ${category?.topic || "Next Set"} (${selectedSetIndex ? `Set ${selectedSetIndex + 1}` : "Next"})`
                    }
                  </button>
                  <button onClick={() => {
                      const shareText = `I just scored ${score}/${total} (${percentage}%) in ${category?.topic || 'QuizWeb'}! Think you can beat me?`;
                      const shareUrl = window.location.origin + `/category/${quizId}`;
                      if (navigator.share) {
                          navigator.share({ title: 'My Quiz Score!', text: shareText, url: shareUrl }).catch(()=>{});
                      } else { 
                          navigator.clipboard.writeText(`${shareText} ${shareUrl}`); 
                          toast.success("Score copied to clipboard!"); 
                      }
                  }} className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-widest hover:bg-indigo-100 transition-all ml-auto">
                      <Share2 size={14} /> Share
                  </button>
                </div>
              )}
              <div className={styles.trophy}>🏆</div>
              <h1 className={styles.heading}>Quiz Completed!</h1>
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
                  <span className={styles.statLabel}>Total</span>
                  <span className={styles.statValue}>{total}</span>
                </div>
                <div className={`${styles.statItem} ${styles.correct}`}>
                  <span className={styles.statLabel}>Correct</span>
                  <span className={styles.statValue}>{performance.correct}</span>
                </div>
                <div className={`${styles.statItem} ${styles.wrong}`}>
                  <span className={styles.statLabel}>Wrong</span>
                  <span className={styles.statValue}>{performance.wrong}</span>
                </div>
                <div className={`${styles.statItem} ${styles.skipped}`}>
                  <span className={styles.statLabel}>Skipped</span>
                  <span className={styles.statValue}>{performance.skipped}</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className={styles.actions}>
              <button className="btn-primary" onClick={handlePlayAgain}>
                🔄 Play Again
              </button>
              <button
                className="btn-secondary"
                onClick={() => setShowReview(!showReview)}
              >
                {showReview ? "Hide Answers" : "📋 View Answers"}
              </button>
              <button className="btn-secondary" onClick={handleBackToQuizzes}>
                ← Back to Quizzes
              </button>
              
              <div className="flex gap-2 w-full mt-4">
                 <button 
                   className={`flex-1 ${styles.exportBtn} ${!isPro ? "opacity-60 cursor-not-allowed" : ""}`} 
                   onClick={handleExportPDF}
                 >
                    {isPro ? <Download size={16} /> : <Lock size={16} />}
                    {isPro ? "Export PDF" : "Unlock PDF Export"}
                 </button>
              </div>
            </div>

            {/* Post-Quiz Donation Prompt */}
            <Link href="/donate" className="block mt-8 mb-4 p-1 rounded-2xl bg-gradient-to-r from-rose-100 to-rose-50 border border-rose-200 hover:scale-[1.01] transition-transform group">
              <div className="bg-white rounded-xl px-6 py-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-rose-50 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">☕</div>
                  <div>
                    <h4 className="text-sm font-black text-slate-800">Support Free Learning</h4>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Help us keep QuizWeb ad-free for everyone</p>
                  </div>
                </div>
                <div className="hidden sm:flex items-center gap-2 text-rose-500 font-black text-xs uppercase tracking-widest">
                  Donate <ArrowRight size={14} />
                </div>
              </div>
            </Link>

            {/* Answer Review */}
            {showReview && (
              <div className={styles.review}>
                <h2 className={styles.reviewTitle}>Answer Review</h2>
                {questions.map((question, index) => {
                  const answer = answers.find((a) => a.questionId === question.id);
                  const isAnswered = !!answer;
                  const isCorrect = answer?.isCorrect || false;
                  
                  const selectedOptionText = isAnswered && answer.selected !== null && answer.selected !== undefined 
                    ? question.options[answer.selected] 
                    : (answer?.selected === null ? "Timed Out" : "Skipped");
                  
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
                          {!isAnswered ? "✗ Skipped" : (isCorrect ? "✓ Correct" : "✗ Wrong")}
                        </span>
                      </div>
                      <p className={styles.reviewQuestion}>{question.text}</p>
                      
                      <div className={styles.reviewAnswers}>
                        <p className={styles.yourAnswer}>
                          Your answer: <strong>{selectedOptionText}</strong>
                        </p>
                        <p className={styles.correctAnswer}>
                          Correct answer: <strong>{question.correctAnswer}</strong>
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
            <h3 className={styles.sidebarTitle}>Suggested Quizzes</h3>
            <div className={styles.suggestedList}>
              {quizzes.slice(3, 6).map(quiz => (
                <div key={quiz.id} className={styles.suggestedCard} onClick={() => router.push(`/category/${quiz.id}`)}>
                  <span className={styles.suggestedEmoji}>{quiz.emoji || "🔥"}</span>
                  <div className={styles.suggestedInfo}>
                    <span className={styles.suggestedName}>{quiz.topic}</span>
                    <span className={styles.suggestedQuestions}>{quiz.questions.length} Qs</span>
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
              <h2 className={styles.popupTitle}>🎉 Great Job! What&apos;s Next?</h2>
               <div className={styles.searchBar}>
                 <input 
                   type="text" 
                   placeholder="Search other quizzes..." 
                   value={searchQuery}
                   onChange={(e) => setSearchQuery(e.target.value)}
                   className={styles.searchInput}
                 />
                 <button 
                   className={`${styles.viewAllBtn} ${showAllQuizzes ? styles.active : ""}`}
                   onClick={() => setShowAllQuizzes(!showAllQuizzes)}
                 >
                   {showAllQuizzes ? "Showing All" : "View All"}
                 </button>
               </div>
            </div>

            <div className={styles.popupContent}>
              {quizId && (
                <button 
                  className={styles.nextSetBtn}
                  onClick={handleContinueNextSet}
                >
                  Continue Next Set of {category?.topic || 'this category'}
                </button>
              )}

              <div className={styles.suggestionsList}>
                 <h3 className={styles.suggestionsLabel}>
                   {showAllQuizzes ? "Explore All Categories:" : "Recommended for you:"}
                 </h3>
                <div className={styles.miniSuggestionsGrid}>
                  {filteredQuizzes.map(quiz => (
                    <div 
                      key={quiz.id} 
                      className={styles.miniSuggestionCard}
                      onClick={() => handleSuggestionClick(quiz.id)}
                    >
                      <span className={styles.miniSuggestionEmoji}>{quiz.emoji || '📚'}</span>
                      <span className={styles.miniSuggestionTitle}>{quiz.topic}</span>
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
         title="Unlocking Quiz Results"
      />
    </main>
  );
}
