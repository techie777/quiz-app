"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { Sparkles, Globe, Maximize2, Minimize2, Share2, ArrowLeft, ArrowRight, Rocket, Play, Pause, Quote, Eye } from "lucide-react";
import toast from "react-hot-toast";
import styles from "@/styles/FunFacts.module.css";
import { AnimatePresence, motion } from "framer-motion";
import dynamic from "next/dynamic";

const AntiGravity = dynamic(() => import("../../../components/fun-facts/AntiGravity"), { ssr: false });

export default function FunFactsVoyager() {
  const cardRef = useRef(null);
  const [fact, setFact] = useState(null);
  const [loading, setLoading] = useState(true);
  const [language, setLanguage] = useState("hi"); // Default to Hindi as per slug page
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [autoAdvance, setAutoAdvance] = useState(true); // Default to true for Voyager
  const [autoAdvanceDelay, setAutoAdvanceDelay] = useState(10000); // 10s default
  const [timer, setTimer] = useState(null);
  const [history, setHistory] = useState([]);
  const [antiGravityEn, setAntiGravityEn] = useState(false);
  const [translating, setTranslating] = useState(false);

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
    fetchFact();
    
    const handleFsChange = () => {
      setIsFullScreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFsChange);
    return () => document.removeEventListener("fullscreenchange", handleFsChange);
  }, []);

  useEffect(() => {
    if (autoAdvance && fact && !loading) {
      if (timer) clearTimeout(timer);
      const newTimer = setTimeout(() => {
        handleNext();
      }, autoAdvanceDelay);
      setTimer(newTimer);
    }
    
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [fact, autoAdvance, autoAdvanceDelay, loading]);

  const fetchFact = async (omitFactId) => {
    // Save current fact to history before fetching next
    if (fact && !omitFactId) {
      setHistory(prev => [...prev, fact]);
    }

    setLoading(true);
    try {
      const url = omitFactId ? `/api/fun-facts?omitFactId=${omitFactId}` : `/api/fun-facts`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (response.ok && data.fact) {
        setFact(data.fact);
      } else {
        toast.error("No more facts available");
        // Don't clear fact if it was already there
      }
    } catch (error) {
      console.error("Error fetching fact:", error);
      toast.error("Failed to fetch fact");
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (timer) clearTimeout(timer);
    fetchFact(fact?.id);
  };

  const handlePrevious = () => {
    if (timer) clearTimeout(timer);
    if (history.length === 0) {
        fetchFact(); // Just fetch a new one if no history
        return;
    }
    const prevFact = history[history.length - 1];
    setHistory(prev => prev.slice(0, -1));
    setFact(prevFact);
  };

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      cardRef.current?.requestFullscreen().catch(err => {
        toast.error(`Error attempting to enable full-screen mode: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  const handleShare = async () => {
    if (!fact) return;
    const desc = language === "hi" ? (fact.descriptionHi || fact.description) : fact.description;
    const text = `Did you know? ${desc}`;
    const url = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Fun Facts Voyager',
          text,
          url
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      navigator.clipboard.writeText(`${text}\n\n${url}`);
      toast.success('Link copied to clipboard!');
    }
  };

  const handleTranslate = async (targetLang) => {
    if (language === targetLang) return;
    setLanguage(targetLang);
  };

  const currentFactText = useMemo(() => {
    if (!fact) return "";
    if (language === "hi") return fact.descriptionHi || fact.description;
    return fact.description;
  }, [fact, language]);

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
        <Sparkles className="w-5 h-5 text-yellow-400" />
      </button>

      {antiGravityEn && <AntiGravity onReset={() => window.location.reload()} />}

      <div className={`${styles.container} matter-element`}>
        <div 
          ref={cardRef}
          className={`${styles.factCard} ${(!fact || fact?.id?.charCodeAt(0) % 2 === 0) ? styles.blueTheme : styles.goldTheme}`}
        >
          {/* Top Control Bar */}
          <div className={styles.topControls}>
            <div className="flex items-center gap-2">
                <div className={styles.compactLangToggle}>
                <button 
                    className={`${styles.compactLangBtn} ${language === "en" ? styles.activeLang : ""}`}
                    onClick={() => handleTranslate("en")}
                >EN</button>
                <button 
                    className={`${styles.compactLangBtn} ${language === "hi" ? styles.activeLang : ""}`}
                    onClick={() => handleTranslate("hi")}
                >HI</button>
                </div>

                {/* Auto Advance Toggle */}
                <div className={styles.compactLangToggle}>
                    <button 
                        className={`${styles.compactLangBtn} ${autoAdvance ? styles.activeLang : ""}`}
                        onClick={() => setAutoAdvance(!autoAdvance)}
                        title={autoAdvance ? "Pause Auto-advance" : "Play Auto-advance"}
                    >
                        {autoAdvance ? <Pause size={14} /> : <Play size={14} />}
                    </button>
                    {autoAdvance && (
                        <select 
                            value={autoAdvanceDelay}
                            onChange={(e) => setAutoAdvanceDelay(Number(e.target.value))}
                            className="bg-transparent text-[10px] text-white font-bold px-2 outline-none border-none cursor-pointer"
                        >
                            <option value={5000} className="text-black">5s</option>
                            <option value={10000} className="text-black">10s</option>
                            <option value={15000} className="text-black">15s</option>
                        </select>
                    )}
                </div>
            </div>

            <div className="flex items-center gap-3">
              <button 
                disabled={loading || history.length === 0}
                onClick={handlePrevious}
                className={`${styles.iconButton} ${styles.nextFactBtn} ${styles.withText}`}
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>

              <button 
                disabled={loading}
                onClick={handleNext}
                className={`${styles.iconButton} ${styles.nextFactBtn} ${styles.withText}`}
              >
                <span>Next</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            
            <div className="flex items-center gap-2">
              <button 
                onClick={toggleFullScreen}
                className={styles.iconButton}
                title={isFullScreen ? "Exit Full Screen" : "Full Screen"}
              >
                {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>

              <button 
                disabled={loading || !fact}
                onClick={handleShare}
                className={styles.iconButton}
                title="Share Fact"
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col justify-center w-full">
            <AnimatePresence mode="wait">
              {loading && !fact ? (
                <motion.div 
                  key="loader"
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }} 
                  exit={{ opacity: 0 }}
                  className="flex justify-center items-center py-12 flex-1"
                >
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500"></div>
                </motion.div>
              ) : fact ? (
                <motion.div
                  key={fact.id + language}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.4, ease: "easeInOut" }}
                  className="w-full"
                >
                  <div className={styles.categoryBadge}>
                    <Rocket className="w-3 h-3 mr-2 text-yellow-500" />
                    <span style={{ color: "white", marginRight: "0.5rem" }}>
                      VOYAGER STREAM:
                    </span>
                    {language === "hi" ? (fact.category?.nameHi || fact.category?.name) : fact.category?.name}
                  </div>
                  
                  <div className="relative mb-8">
                    <Quote className={styles.quoteIcon} />
                    <h2 className={styles.factDescription}>
                      {currentFactText}
                    </h2>
                  </div>

                  {fact.image && (
                    <div className={styles.factImageContainer}>
                      <img src={fact.image} alt="Fact context" className={styles.factImage} />
                    </div>
                  )}

                  <div className={styles.viewCount}>
                    <Eye className="w-4 h-4" />
                    <span>{fact.views || 0} explorers have read this</span>
                  </div>
                </motion.div>
              ) : (
                <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-12 text-gray-400 text-center flex-1 flex items-center justify-center">
                  <div className="flex flex-col items-center gap-4">
                    <Rocket size={48} className="text-gray-600 animate-pulse" />
                    <p>Scanning the universe for more facts...</p>
                    <button 
                        onClick={() => fetchFact()}
                        className="mt-4 bg-white/10 hover:bg-white/20 px-6 py-2 rounded-full text-white transition-colors"
                    >
                        Try Again
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
