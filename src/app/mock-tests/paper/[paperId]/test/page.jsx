"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import styles from "@/styles/MockEngine.module.css";

// STATUS TYPES (Mimicking TCS)
const STATUS = {
    NOT_VISITED: 'NOT_VISITED',
    NOT_ANSWERED: 'NOT_ANSWERED',
    ANSWERED: 'ANSWERED',
    MARKED: 'MARKED',
    MARKED_ANSWERED: 'MARKED_ANSWERED'
};

const getStatusStyle = (status, styles) => {
    const map = {
        [STATUS.NOT_VISITED]: styles.notVisited,
        [STATUS.NOT_ANSWERED]: styles.notAnswered,
        [STATUS.ANSWERED]: styles.answered,
        [STATUS.MARKED]: styles.marked,
        [STATUS.MARKED_ANSWERED]: styles.markedAnswered
    };
    return map[status] || styles.notVisited;
};

export default function MockTestEngine() {
  const { paperId } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  
  // ── CORE DATA STATE ──
  const [paper, setPaper] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // ── ENTRANCE GUARD (Strict Mock Protocol) ──
  useEffect(() => {
    if (status === "unauthenticated") {
        router.push(`/api/auth/signin?callbackUrl=${encodeURIComponent(window.location.href)}`);
    }
  }, [status, router]);

  // ── TEST PROGRESS STATE ──
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({}); // { qId: { option, status } }
  const [timeLeft, setTimeLeft] = useState(3600); // Default 60 mins
  const [activeSection, setActiveSection] = useState(null);
  const [language, setLanguage] = useState(searchParams.get('lang') || "English");
  const [isPaused, setIsPaused] = useState(false);
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ── REFS ──
  const timerRef = useRef(null);
  const autoSaveRef = useRef(null);
  const containerRef = useRef(null);

  // ── INITIAL HYDRATION ──
  useEffect(() => {
    async function init() {
      if (status === "loading" || status === "unauthenticated") return;
      try {
        const [paperRes, qRes] = await Promise.all([
          fetch(`/api/mock-tests/paper/${paperId}`),
          fetch(`/api/mock-tests/paper/${paperId}/questions`)
        ]);
        
        const paperData = await paperRes.json();
        const qData = await qRes.json();
        
        if (paperData.error || qData.error) throw new Error("Initialization failed");
        
        setPaper(paperData);
        setQuestions(qData);
        setActiveSection(paperData.sections[0]?.id);
        
        // 1. Initial State Check (Strict separation of Fresh vs Resume)
        const mode = searchParams.get('mode');
        let initialAnswers = {};
        let initialTime = paperData.timeLimit * 60;
        let initialIndex = 0;

        if (mode === 'resume') {
            console.log("🔄 [INIT] Resumption mode active.");
            
            // Check LocalStorage first for speed
            const saved = localStorage.getItem(`mock_state_${paperId}`);
            if (saved) {
                const { sa, st, si } = JSON.parse(saved);
                initialAnswers = sa || {};
                initialTime = st || paperData.timeLimit * 60;
                initialIndex = si || 0;
            }

            // Sync with DB if signed in (Master Record)
            if (session?.user) {
                try {
                    const res = await fetch(`/api/mock-tests/attempt/resume/${paperId}`);
                    if (res.ok) {
                        const dbAttempt = await res.json();
                        if (dbAttempt && dbAttempt.id) {
                            console.log("📡 [RESUME] Syncing with Cloud Session:", dbAttempt.id);
                            if (dbAttempt.answersJson) initialAnswers = JSON.parse(dbAttempt.answersJson);
                            if (dbAttempt.timeLeft) initialTime = dbAttempt.timeLeft;
                        }
                    }
                } catch (e) {
                    console.error("DB Resumption sync failed:", e);
                }
            }
        } else {
            console.log("✨ [INIT] Fresh Start mode active. Ignoring previous session data.");
            // Explicitly ensure local cache is clean
            localStorage.removeItem(`mock_state_${paperId}`);
        }

        setAnswers(initialAnswers);
        setTimeLeft(initialTime);
        setCurrentIndex(initialIndex);
      } catch (e) {
        toast.error("Critical: Failed to load exam protocol.");
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [paperId]);

  // ── TIMER LOGIC ──
  useEffect(() => {
    if (loading || isPaused) return;

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [loading, isPaused]);

  // ── AUTO-SYNC LOGIC (LocalStorage every 5s, DB every 30s) ──
  useEffect(() => {
    if (loading) return;
    
    // Local Backup (Fast)
    const localSave = setInterval(() => {
       localStorage.setItem(`mock_state_${paperId}`, JSON.stringify({
           sa: answers,
           st: timeLeft,
           si: currentIndex
       }));
    }, 5000);

    // DB Backup (Signed-in only, slower)
    let dbSave;
    if (session?.user) {
        dbSave = setInterval(async () => {
            try {
                await fetch(`/api/mock-tests/attempt/resume/${paperId}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        answersJson: JSON.stringify(answers),
                        timeLeft
                    })
                });
            } catch (e) {
                console.warn("[SYNC] DB sync failed", e);
            }
        }, 30000);
    }

    return () => {
        clearInterval(localSave);
        if (dbSave) clearInterval(dbSave);
    };
  }, [loading, answers, timeLeft, currentIndex, paperId, session]);

  // ── VIEW TRIGGER: Mark NOT_VISITED as NOT_ANSWERED upon viewing ──
  useEffect(() => {
    if (loading || !currentQuestion) return;
    
    if (getStatus(currentQuestion.id) === STATUS.NOT_VISITED) {
        updateAnswer(currentQuestion.id, undefined, STATUS.NOT_ANSWERED);
    }
  }, [currentIndex, loading]);


  // ── PROCTORING (ANTI-CHEAT) ──
  useEffect(() => {
    const handleBlur = () => {
        if (!loading) toast.error("WARNING: Tab switching detected. This activity is logged.", { duration: 5000 });
    };

    const handleFullScreenChange = () => {
        if (!document.fullscreenElement && !loading) {
            toast("Exam must be taken in Full Screen.", { icon: '⚠️' });
        }
    };

    window.addEventListener('blur', handleBlur);
    document.addEventListener('fullscreenchange', handleFullScreenChange);
    
    // Disable Right-Click
    const disableCtx = (e) => e.preventDefault();
    document.addEventListener('contextmenu', disableCtx);

    return () => {
        window.removeEventListener('blur', handleBlur);
        document.removeEventListener('fullscreenchange', handleFullScreenChange);
        document.removeEventListener('contextmenu', disableCtx);
    };
  }, [loading]);

  // ── NAVIGATION HELPERS ──
  const currentQuestion = questions[currentIndex];
  
  const getStatus = (qId) => answers[qId]?.status || STATUS.NOT_VISITED;

  const updateAnswer = (qId, option, status) => {
    setAnswers(prev => ({
        ...prev,
        [qId]: { option, status }
    }));
  };

  const handleSaveAndNext = () => {
    const selected = answers[currentQuestion.id]?.option;
    if (selected !== undefined) {
        updateAnswer(currentQuestion.id, selected, STATUS.ANSWERED);
    } else {
        updateAnswer(currentQuestion.id, undefined, STATUS.NOT_ANSWERED);
    }
    if (currentIndex < questions.length - 1) setCurrentIndex(prev => prev + 1);
  };

  const handleMarkForReview = () => {
      const selected = answers[currentQuestion.id]?.option;
      const newStatus = selected !== undefined ? STATUS.MARKED_ANSWERED : STATUS.MARKED;
      updateAnswer(currentQuestion.id, selected, newStatus);
      if (currentIndex < questions.length - 1) setCurrentIndex(prev => prev + 1);
  };

  const handleClearResponse = () => {
      updateAnswer(currentQuestion.id, undefined, STATUS.NOT_ANSWERED);
  };

    const handleSubmitFinal = async () => {
       if (isSubmitting) return;

       // 1. Session Safeguard
       if (!session?.user) {
           toast.error("Session expired. Please sign in again.");
           router.push('/api/auth/signin');
           return;
       }

       // 2. Final User Confirmation
       const confirmSubmit = window.confirm("⚠️ FINAL WARNING: Read carefully!\n\nYou are about to end this examination. Once submitted, you cannot change your answers. Do you wish to proceed and VIEW YOUR SCORECARD?");
       if (!confirmSubmit) return;

       setIsSubmitting(true);
       const loadingToast = toast.loading("Saving Final Responses...");
      
      try {
          const payload = {
              paperId,
              answersJson: JSON.stringify(answers),
              timeLeft
          };

          console.log("🚀 [ENGINE] Submitting Payload:", payload);
          const res = await fetch('/api/mock-tests/attempt/submit', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
          });

          const data = await res.json();
          if (data.error) throw new Error(data.error);

          toast.success("Examination Complete!", { id: loadingToast });
          localStorage.removeItem(`mock_state_${paperId}`);
          
          console.log("🏁 [ENGINE] Redirecting to SCORECARD:", `/mock-tests/result/${data.id}`);
          window.location.href = `/mock-tests/result/${data.id}`;
      } catch (err) {
          console.error("❌ [ENGINE] Submission Failure:", err);
          toast.error(`Submission Failed: ${err.message}`, { id: loadingToast });
          setIsSubmitting(false);
      }
    };

  const handleAutoSubmit = () => {

      toast.success("TIME EXPIRED: Processing submission...");
      handleSubmitFinal();
  };

  const getSectionSummary = () => {
      if (!paper || !questions) return [];
      
      return paper.sections.map(section => {
          const sectionQs = questions.filter(q => q.sectionId === section.id);
          const stats = {
              total: sectionQs.length,
              answered: 0,
              notAnswered: 0,
              marked: 0,
              notVisited: 0
          };

          sectionQs.forEach(q => {
              const status = getStatus(q.id);
              if (status === STATUS.ANSWERED || status === STATUS.MARKED_ANSWERED) stats.answered++;
              if (status === STATUS.MARKED || status === STATUS.MARKED_ANSWERED) stats.marked++;
              if (status === STATUS.NOT_ANSWERED) stats.notAnswered++;
              if (status === STATUS.NOT_VISITED) stats.notVisited++;
          });

          return { name: section.name, ...stats };
      });
  };


  const formatTime = (seconds) => {
      const h = Math.floor(seconds / 3600);
      const m = Math.floor((seconds % 3600) / 60);
      const s = seconds % 60;
      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (loading) return <div className="h-screen bg-slate-50 flex items-center justify-center font-black uppercase text-xs tracking-widest text-slate-400">Loading Tactical Engine...</div>;

  return (
    <div className={styles.mockWrapper} ref={containerRef}>
      {/* 🏛️ HEADER */}
      <header className={styles.header}>
        <div className="flex items-center gap-2 md:gap-4 flex-1 min-w-0">
           <span className="text-lg md:text-xl font-black text-indigo-600 tracking-tighter shrink-0">QuizWeb!</span>
           <div className="hidden xs:block h-6 w-px bg-slate-200" />
           <span className="text-[11px] md:text-[13px] font-bold text-slate-600 uppercase truncate">
             {paper.title}
           </span>
        </div>

        <div className="flex items-center gap-2 md:gap-6 shrink-0">
            <div className={`px-2 md:px-4 py-1.5 md:py-2 rounded-lg border flex items-center gap-2 md:gap-3 ${timeLeft < 300 ? 'bg-red-50 border-red-200 text-red-600' : 'bg-slate-50 border-slate-200'}`}>
                <span className="hidden lg:inline text-[9px] font-black uppercase tracking-widest">Time Remaining:</span>
                <span className="text-sm md:text-lg font-black font-mono w-16 md:w-24 text-center">{formatTime(timeLeft)}</span>
            </div>
            
            <div className="flex items-center gap-1.5 md:gap-2">
                <button 
                    onClick={() => document.documentElement.requestFullscreen()}
                    className="flex items-center justify-center p-2 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-50 transition-colors"
                    title="Full Screen"
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
                    </svg>
                </button>
                <button 
                    onClick={() => setIsPaused(!isPaused)}
                    className="flex items-center gap-2 bg-white border border-slate-200 px-3 md:px-4 py-2 rounded-lg text-[9px] md:text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm"
                >
                    {isPaused ? (
                        <>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                            <span className="hidden sm:inline">RESUME</span>
                        </>
                    ) : (
                        <>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                            <span className="hidden sm:inline">PAUSE</span>
                        </>
                    )}
                </button>
            </div>
        </div>
      </header>


      {/* 🕹️ MAIN LAYOUT */}
      <div className={styles.mainLayout}>
        
        {/* LEFT: QUESTIONS */}
        <div className={styles.leftPane}>
            <div className={styles.sectionTabs}>
                <span className="text-[10px] font-black text-slate-400 uppercase mr-4 ml-2">Sections:</span>
                {paper.sections.map(s => (
                    <button 
                        key={s.id}
                        onClick={() => {
                            const firstQOfSection = questions.findIndex(q => q.sectionId === s.id);
                            if (firstQOfSection !== -1) setCurrentIndex(firstQOfSection);
                            setActiveSection(s.id);
                        }}
                        className={`${styles.sectionTab} ${activeSection === s.id ? styles.sectionTabActive : ''}`}
                    >
                        {s.name}
                    </button>
                ))}
            </div>

            <div className={styles.questionHeader}>
                <span className="text-sm font-black text-slate-900 uppercase">Question No. {currentIndex + 1}</span>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                         <span className="w-8 h-6 bg-green-100 text-green-700 text-[10px] font-black flex items-center justify-center rounded">+{paper.positiveMarking}</span>
                         <span className="w-8 h-6 bg-red-100 text-red-700 text-[10px] font-black flex items-center justify-center rounded">-{paper.negativeMarking}</span>
                    </div>
                    <div className="h-4 w-px bg-slate-200" />
                    <select 
                        className="bg-white border-none text-[11px] font-bold text-slate-500 focus:ring-0 outline-none"
                        value={language}
                        onChange={(e) => setLanguage(e.target.value)}
                    >
                        <option>English</option>
                        <option>Hindi</option>
                    </select>
                </div>
            </div>

            <div className={styles.questionBody}>
                <p className="text-base font-bold text-slate-800 leading-relaxed whitespace-pre-wrap">
                    {language === "Hindi" && currentQuestion.textHi ? currentQuestion.textHi : currentQuestion.text}
                </p>
                
                {currentQuestion.image && (
                    <img src={currentQuestion.image} className="max-w-full h-auto rounded-xl border border-slate-100 my-6 shadow-sm" alt="Question Graphic" />
                )}

                <div className={styles.optionsList}>
                    {(language === "Hindi" && currentQuestion.optionsHi ? currentQuestion.optionsHi : currentQuestion.options).map((opt, i) => (
                        <div 
                            key={i}
                            className={`${styles.optionItem} ${answers[currentQuestion.id]?.option === i ? styles.optionItemActive : ''}`}
                            onClick={() => updateAnswer(currentQuestion.id, i, getStatus(currentQuestion.id) === STATUS.NOT_VISITED ? STATUS.NOT_ANSWERED : getStatus(currentQuestion.id))}
                        >
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center text-[10px] font-bold ${answers[currentQuestion.id]?.option === i ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300 text-slate-400'}`}>
                                {String.fromCharCode(65 + i)}
                            </div>
                            <span className="text-sm font-medium">{opt}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* ACTION FOOTER */}
            <div className={styles.footer}>
                <div className="flex gap-2">
                    <button onClick={handleMarkForReview} className={`${styles.actionBtn} ${styles.btnSecondary}`}>Mark for Review & Next</button>
                    <button onClick={handleClearResponse} className={`${styles.actionBtn} ${styles.btnSecondary}`}>Clear Response</button>
                </div>
                <button onClick={handleSaveAndNext} className={`${styles.actionBtn} ${styles.btnPrimary}`}>Save & Next</button>
            </div>
        </div>

        {/* RIGHT: PALETTE (Lives at bottom on mobile) */}
        <div className={`${styles.rightPane} ${isPaletteOpen ? styles.rightPaneOpen : ''}`}>
            <div className={styles.paletteScrollArea}>

            <div className={styles.paletteHeader}>
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white rounded-xl shadow-sm overflow-hidden flex items-center justify-center text-xl">👤</div>
                    <div>
                    <p className="text-xs font-black text-slate-800 truncate w-32 uppercase">{session?.user?.name || "CANDIDATE"}</p>
                    <p className="text-[9px] font-bold text-indigo-500 uppercase tracking-widest mt-0.5">Time Limit: {paper.timeLimit}min</p>
                    </div>
                </div>
                <button 
                  onClick={() => setIsPaletteOpen(false)}
                  className="md:hidden ml-auto text-slate-400 hover:text-slate-600"
                >
                    ✕
                </button>
            </div>


            <div className={styles.statsSummary}>
                <div className="grid grid-cols-2 gap-y-2">
                    <div className={styles.statRow}>
                        <div className={`${styles.statBubble} ${styles.answered}`}>
                            {questions.filter(q => getStatus(q.id) === STATUS.ANSWERED).length}
                        </div>
                        <span className="text-slate-500 truncate">Answered</span>
                    </div>
                    <div className={styles.statRow}>
                        <div className={`${styles.statBubble} ${styles.notAnswered}`}>
                            {questions.filter(q => getStatus(q.id) === STATUS.NOT_ANSWERED).length}
                        </div>
                        <span className="text-slate-500 truncate">Not Answered</span>
                    </div>
                    <div className={styles.statRow}>
                        <div className={`${styles.statBubble} ${styles.notVisited}`}>
                            {questions.filter(q => getStatus(q.id) === STATUS.NOT_VISITED).length}
                        </div>
                        <span className="text-slate-500 truncate">Not Visited</span>
                    </div>
                    <div className={styles.statRow}>
                        <div className={`${styles.statBubble} ${styles.marked}`}>
                            {questions.filter(q => getStatus(q.id) === STATUS.MARKED).length}
                        </div>
                        <span className="text-slate-500 truncate">Marked</span>
                    </div>
                    <div className={styles.statRow} style={{gridColumn: 'span 2'}}>
                        <div className={`${styles.statBubble} ${styles.markedAnswered}`}>
                            {questions.filter(q => getStatus(q.id) === STATUS.MARKED_ANSWERED).length}
                        </div>
                        <span className="text-slate-500 truncate">Answered & Marked (Evaluation)</span>
                    </div>
                </div>
            </div>


            <div className="px-4 py-2 bg-slate-800 text-white text-[10px] font-black uppercase tracking-widest">Question Palette</div>
            
            <div className={styles.paletteGrid}>
                {questions.map((q, i) => {
                    const status = getStatus(q.id);
                    return (
                        <div 
                            key={q.id}
                            onClick={() => setCurrentIndex(i)}
                            className={`${styles.paletteItem} ${getStatusStyle(status, styles)} ${currentIndex === i ? styles.currentQuestion : ''}`}
                        >
                            {i+1}
                        </div>
                    );
                })}
            </div>
            </div>

            <div className="p-4 bg-white/80 border-t border-slate-200 shrink-0">
                <button 
                  onClick={() => setShowSummary(true)}
                  className={`${styles.actionBtn} ${styles.btnSubmit} w-full py-4 h-auto rounded-xl text-[13px] font-black shadow-lg shadow-indigo-100`}
                >
                    SUBMIT TEST
                </button>
            </div>

        </div>

      </div>

      {/* SUMMARY MODAL (TCS/NTA Style) */}
      <AnimatePresence>
          {showSummary && (
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }}
                className={styles.modalOverlay}
              >
                  <motion.div 
                    initial={{ scale: 0.95, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    className={styles.summaryModal}
                  >
                      <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                          <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest">Test Summary</h2>
                      </div>
                      
                      <div className="p-6 overflow-x-auto">
                          <table className={styles.summaryTable}>
                              <thead>
                                  <tr>
                                      <th>Section Name</th>
                                      <th>No. of Questions</th>
                                      <th>Answered</th>
                                      <th>Not Answered</th>
                                      <th>Marked for Review</th>
                                      <th>Not Visited</th>
                                  </tr>
                              </thead>
                              <tbody>
                                  {getSectionSummary().map((row, idx) => (
                                      <tr key={idx}>
                                          <td className="text-left font-bold">{row.name}</td>
                                          <td>{row.total}</td>
                                          <td>{row.answered}</td>
                                          <td>{row.notAnswered}</td>
                                          <td>{row.marked}</td>
                                          <td>{row.notVisited}</td>
                                      </tr>
                                  ))}
                              </tbody>
                          </table>
                      </div>

                      <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-center gap-4">
                          <button 
                            onClick={() => setShowSummary(false)}
                            className="px-8 py-3 bg-orange-500 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-orange-600 transition-colors shadow-lg shadow-orange-100"
                          >
                            Close
                          </button>
                          <button 
                            onClick={handleSubmitFinal}
                            disabled={isSubmitting}
                            className="px-8 py-3 bg-emerald-500 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-100 disabled:opacity-50"
                          >
                            {isSubmitting ? 'Submitting...' : 'View Result'}
                          </button>
                      </div>
                  </motion.div>
              </motion.div>
          )}
      </AnimatePresence>

      {/* PAUSE OVERLAY */}
      <AnimatePresence>
          {isPaused && (
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-[100] bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center"
              >
                  <span className="text-6xl mb-6">⏸️</span>
                  <h2 className="text-2xl font-black text-slate-800 uppercase tracking-[0.2em] mb-4">Exam Suspended</h2>
                  <p className="text-slate-500 mb-8 font-medium">Progress is safely cached. Click resume to restore timer.</p>
                  <button 
                    onClick={() => setIsPaused(false)}
                    className="bg-indigo-600 text-white px-12 py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-indigo-500 shadow-xl"
                  >
                    Resume Ops
                  </button>
              </motion.div>
          )}
      </AnimatePresence>

    </div>
  );
}
