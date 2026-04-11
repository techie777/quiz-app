"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { CheckCircle, Globe, Maximize2, Minimize2, Eye, Share2, Play, Pause, Sparkles, Rocket, ArrowLeft, ArrowRight } from "lucide-react";
import toast from "react-hot-toast";
import styles from "@/styles/TrueFalse.module.css";
import { AnimatePresence, motion } from "framer-motion";
import dynamic from "next/dynamic";

const AntiGravity = dynamic(() => import("../../../components/fun-facts/AntiGravity"), { ssr: false });

export default function TrueFalseVoyager() {
  const cardRef = useRef(null);
  const [question, setQuestion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [language, setLanguage] = useState("hi"); 
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
    if (showResult && autoAdvance && !loading) {
      const timer = setTimeout(() => {
        handleNext();
      }, autoAdvanceDelay);
      return () => clearTimeout(timer);
    }
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
    
    try {
      const response = await fetch("/api/true-false", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId: question.id,
          userAnswer,
          language
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
          {/* Top Control Bar */}
          <div className={styles.topControls}>
            <div className="flex items-center gap-2">
                <div className={styles.compactLangToggle}>
                    <button 
                        className={`${styles.compactLangBtn} ${language === "en" ? styles.activeLang : ""}`}
                        onClick={() => setLanguage("en")}
                    >EN</button>
                    <button 
                        className={`${styles.compactLangBtn} ${language === "hi" ? styles.activeLang : ""}`}
                        onClick={() => setLanguage("hi")}
                    >HI</button>
                </div>

                {/* Auto Advance Toggle */}
                <div className={styles.compactLangToggle}>
                    <button 
                        className={`${styles.compactLangBtn} ${autoAdvance ? styles.activeLang : ""}`}
                        onClick={() => setAutoAdvance(!autoAdvance)}
                    >
                        {autoAdvance ? <Pause size={14} /> : <Play size={14} />}
                    </button>
                    {autoAdvance && (
                        <select 
                            value={autoAdvanceDelay}
                            onChange={(e) => setAutoAdvanceDelay(Number(e.target.value))}
                            className="bg-transparent text-[10px] text-white font-bold px-2 outline-none border-none cursor-pointer"
                        >
                            <option value={3000} className="text-black">3s</option>
                            <option value={5000} className="text-black">5s</option>
                            <option value={10000} className="text-black">10s</option>
                        </select>
                    )}
                </div>
            </div>

            {/* Score Pill */}
            <div className={styles.scoreBar}>
              <div className={styles.scorePill}>
                Score: <span className={styles.scoreValue}>{score.correct}/{score.total}</span>
              </div>
              {streak > 1 && (
                <div className={styles.scorePill}>
                  🔥 {streak} Streak
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <button onClick={toggleFullScreen} className={styles.iconButton}>
                {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
              <button onClick={handleShare} className={styles.iconButton} disabled={!question}>
                <Share2 className="w-4 h-4" />
              </button>
            </div>
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
                        <div className={styles.categoryBadge}>
                            <Rocket className="w-3 h-3 mr-2" />
                            {language === "hi" && question.category.nameHi ? question.category.nameHi : question.category.name}
                        </div>

                        <h2 className={styles.factDescription}>
                            {language === "hi" && question.statementHi ? question.statementHi : question.statement}
                        </h2>

                        {question.image && (
                            <div className={styles.factImageContainer}>
                                <img src={question.image} alt="Quest" className={styles.factImage} />
                            </div>
                        )}

                        <div className={styles.answerButtonsGroup}>
                            <button className={`${styles.answerBtn} ${styles.trueBtn}`} onClick={() => handleAnswer(true)} disabled={isSubmitting}>
                                True
                            </button>
                            <button className={`${styles.answerBtn} ${styles.falseBtn}`} onClick={() => handleAnswer(false)} disabled={isSubmitting}>
                                False
                            </button>
                        </div>
                     </>
                   ) : (
                     <div className={styles.resultContainer}>
                        <div className={`${styles.resultTitle} ${result.correct ? styles.correctText : styles.incorrectText}`}>
                            {result.correct ? "Correct! Amazing!" : "Oops! Not quite."}
                        </div>
                        
                        <p className={styles.explanation}>
                            {language === "hi" && result.explanationHi ? result.explanationHi : (result.explanation || "Correct answer revealed below.")}
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

                   <div className={styles.viewCount}>
                      <Eye className="w-4 h-4" />
                      <span>{question.views || 0} explorers tested</span>
                   </div>
                </motion.div>
              ) : (
                <div className="text-gray-400">Scanning for more challenges...</div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
