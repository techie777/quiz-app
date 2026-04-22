"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { CheckCircle, Globe, Maximize2, Minimize2, Eye, Share2, Play, Pause, Sparkles, Rocket, ArrowLeft, ArrowRight } from "lucide-react";
import toast from "react-hot-toast";
import styles from "@/styles/TrueFalse.module.css";
import { AnimatePresence, motion } from "framer-motion";
import confetti from "canvas-confetti";
import dynamic from "next/dynamic";

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

const AntiGravity = dynamic(() => import("../../../components/fun-facts/AntiGravity"), { ssr: false });

export default function TrueFalseVoyager() {
  const cardRef = useRef(null);
  const [question, setQuestion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [language, setLanguage] = useState("EN"); 
  const [timeLeft, setTimeLeft] = useState(100); // Percentage for progress circle
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [result, setResult] = useState(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [streak, setStreak] = useState(0);
  const [autoAdvance, setAutoAdvance] = useState(true);
  const [autoAdvanceDelay, setAutoAdvanceDelay] = useState(5000);
  const [antiGravityEn, setAntiGravityEn] = useState(false);

  // Generate stars for the background
  const stars = useMemo(() => {
    return Array.from({ length: 40 }).map((_, i) => ({
      id: i,
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
      duration: `${2 + Math.random() * 4}s`,
      delay: `${Math.random() * 2}s`
    }));
  }, []);

  useEffect(() => {
    fetchQuestion();
    
    const handleFsChange = () => {
      setIsFullScreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFsChange);
    return () => document.removeEventListener("fullscreenchange", handleFsChange);
  }, []);

  useEffect(() => {
    let interval;
    if (showResult && autoAdvance && !loading) {
      const startTime = Date.now();
      const endTime = startTime + autoAdvanceDelay;
      
      interval = setInterval(() => {
        const now = Date.now();
        const percentage = Math.max(0, 100 - ((now - startTime) / autoAdvanceDelay) * 100);
        setTimeLeft(percentage);
        
        if (now >= endTime) {
          clearInterval(interval);
          handleNext();
        }
      }, 50);
    } else {
      setTimeLeft(100);
    }
    return () => clearInterval(interval);
  }, [showResult, autoAdvance, autoAdvanceDelay, loading]);

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      cardRef.current?.requestFullscreen().catch(err => {
        toast.error(`Error attempting to enable full-screen mode: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  const fetchQuestion = async () => {
    setLoading(true);
    setShowResult(false);
    setResult(null);
    
    try {
      const url = question 
        ? `/api/true-false?omitQuestionId=${question.id}`
        : `/api/true-false`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (response.ok && data.question) {
        setQuestion(data.question);
      } else {
        toast.error("No more questions available");
        setQuestion(null);
      }
    } catch (error) {
      console.error("Error fetching question:", error);
      toast.error("Failed to fetch question");
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = async (userAnswer) => {
    if (!question || isSubmitting || showResult) return;
    
    setIsSubmitting(true);
    
    // Sprinkle stars!
    const rect = document.activeElement?.getBoundingClientRect();
    if (rect) {
      confetti({
        particleCount: 40,
        spread: 70,
        origin: { x: (rect.left + rect.width / 2) / window.innerWidth, y: (rect.top + rect.height / 2) / window.innerHeight },
        shapes: ['star'],
        colors: ['#fbbf24', '#f59e0b', '#10b981', '#34d399'],
        ticks: 200,
        gravity: 1.2,
        decay: 0.94,
        startVelocity: 30
      });
    }
    
    try {
      const response = await fetch("/api/true-false", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId: question.id,
          userAnswer,
          language: language.toLowerCase()
        }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setResult(data);
        setShowResult(true);
        
        // Update score
        setScore(prev => ({
          correct: prev.correct + (data.correct ? 1 : 0),
          total: prev.total + 1
        }));
        
        // Update streak
        setStreak(prev => data.correct ? prev + 1 : 0);
        
        if (data.correct) toast.success("Correct!");
        else toast.error("Incorrect!");
      }
    } catch (error) {
      console.error("Error submitting answer:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNext = () => {
    fetchQuestion();
  };

  const handleShare = async () => {
    if (!question) return;
    const text = `Test your knowledge on True/False Voyager! Current Streak: ${streak}`;
    const url = window.location.href;

    if (navigator.share) {
      navigator.share({ title: 'True/False Voyager', text, url }).catch(console.error);
    } else {
      navigator.clipboard.writeText(`${text}\n\n${url}`);
      toast.success('Link copied to clipboard!');
    }
  };

  return (
    <div className={styles.engineWrapper}>
      {/* Background Stars */}
      {stars.map(star => (
        <div 
          key={star.id}
          className={styles.star}
          style={{ 
            top: star.top, 
            left: star.left, 
            "--duration": star.duration,
            animationDelay: star.delay
          }}
        />
      ))}

      {/* Zero-G Trigger */}
      <button 
        onClick={() => setAntiGravityEn(true)} 
        title="Zero-G Mode"
        className={styles.antiGravityTrigger}
      >
        <Sparkles className="w-5 h-5 text-emerald-400" />
      </button>

      {antiGravityEn && <AntiGravity onReset={() => window.location.reload()} />}

      <div className={`${styles.container} matter-element`}>
        <div 
          ref={cardRef}
          className={`${styles.factCard} ${(!question || question?.id?.charCodeAt(0) % 2 === 0) ? styles.greenTheme : styles.tealTheme} ${showResult ? (result?.correct ? styles.correctGlow : styles.incorrectGlow) : ""}`}
        >
          {/* New Top Bar: Simplified Language & Score */}
          <div className={styles.voyagerTopBar}>
            <LanguageToggle lang={language} onChange={setLanguage} />
            
            <div className={styles.scoreDisplay}>
               <span className={styles.scoreLabel}>POINTS</span>
               <span className={styles.scoreValue}>{score.correct} / {score.total}</span>
            </div>

            <button 
              className={`${styles.pauseBtn} ${autoAdvance ? styles.pulseActive : ""}`}
              onClick={() => setAutoAdvance(!autoAdvance)}
              title={autoAdvance ? "Pause Auto-advance" : "Resume Auto-advance"}
            >
              {autoAdvance ? <Pause size={18} /> : <Play size={18} />}
            </button>
          </div>

            
          {/* Main Content Area */}
          <div className="flex-1 flex flex-col justify-center w-full">
            <AnimatePresence mode="wait">
              {loading && !question ? (
                 <motion.div key="loader" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 flex justify-center items-center">
                    <div className="w-12 h-12 border-4 border-white/30 border-t-emerald-500 rounded-full animate-spin"></div>
                 </motion.div>
              ) : question ? (
                <motion.div
                  key={question.id + showResult + language}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.05 }}
                  transition={{ duration: 0.3 }}
                  className="w-full"
                >
                    {!showResult ? (
                      <>
                        <div className={styles.voyagerHeroArea}>
                           <div className={styles.categoryBadgeTop}>
                              {language === "HI" && question.category.nameHi ? question.category.nameHi : question.category.name}
                           </div>

                           <h2 className={styles.voyagerFactText}>
                               {language === "HI" && question.statementHi ? question.statementHi : question.statement}
                           </h2>

                           {question.image && (
                               <div className={styles.factImageContainer}>
                                   <img src={question.image} alt="Quest" className={styles.factImage} />
                               </div>
                           )}
                        </div>

                        <div className={styles.voyagerInteractionArea}>
                            <button 
                               className={`${styles.tactileBtn} ${styles.trueBtnTactile}`} 
                               onClick={() => handleAnswer(true)} 
                               disabled={isSubmitting}
                            >
                                TRUE
                            </button>
                            <button 
                               className={`${styles.tactileBtn} ${styles.falseBtnTactile}`} 
                               onClick={() => handleAnswer(false)} 
                               disabled={isSubmitting}
                            >
                                FALSE
                            </button>
                        </div>
                      </>
                   ) : (
                     <div className={styles.resultContainer}>
                        <div className={`${styles.resultTitle} ${result.correct ? styles.correctText : styles.incorrectText}`}>
                            {result.correct ? "Correct! Amazing!" : "Oops! Not quite."}
                        </div>
                        
                        <p className={styles.explanation}>
                            {language === "HI" && result.explanationHi ? result.explanationHi : (result.explanation || "Correct answer revealed below.")}
                        </p>

                        <div className={styles.correctAnswer}>
                            The Correct Answer is: <strong>{result.correctAnswer ? "True" : "False"}</strong>
                        </div>

                        {!autoAdvance && (
                            <div className="flex justify-center mt-8">
                                <button className={`${styles.iconButton} ${styles.nextFactBtn} ${styles.withText}`} onClick={handleNext}>
                                    Next Challenge <ArrowRight className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                     </div>
                   )}

                   {/* Social Proof Above Bottom Bar */}
                   <div className={styles.socialProofBottom}>
                      <Eye className="w-4 h-4 mr-2" />
                      <span>{question?.views || 0} explorers tested</span>
                   </div>
                </motion.div>
              ) : (
                <motion.div 
                   key="scanning"
                   initial={{ opacity: 0 }}
                   animate={{ opacity: 1 }}
                   exit={{ opacity: 0 }}
                   className="text-gray-400 text-center py-20"
                >
                   Scanning for more challenges...
                </motion.div>
              )}
            </AnimatePresence>

            {/* Bottom Navigation Bar - Back Inside */}
            <div className={styles.voyagerBottomNav}>
               <button onClick={handleShare} className={styles.navIconBtn} disabled={!question}>
                  <Share2 size={20} />
               </button>

               <div className={styles.nextBtnContainer} onClick={handleNext}>
                  <svg className={styles.progressRing} width="70" height="70">
                     <circle
                        className={styles.progressRingCircleBg}
                        stroke="rgba(255,255,255,0.1)"
                        strokeWidth="4"
                        fill="transparent"
                        r="30"
                        cx="35"
                        cy="35"
                     />
                     <circle
                        className={styles.progressRingCircle}
                        stroke="#10b981"
                        strokeWidth="4"
                        strokeDasharray={2 * Math.PI * 30}
                        strokeDashoffset={2 * Math.PI * 30 * (1 - timeLeft / 100)}
                        strokeLinecap="round"
                        fill="transparent"
                        r="30"
                        cx="35"
                        cy="35"
                     />
                  </svg>
                  <button className={styles.navNextBtn}>
                     <ArrowRight size={24} />
                  </button>
               </div>

               <button onClick={toggleFullScreen} className={styles.navIconBtn}>
                  {isFullScreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
               </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
