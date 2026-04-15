"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams } from "next/navigation";
import { Sparkles, Share2, Quote, ArrowRight, ArrowLeft, Eye, Maximize2, Minimize2 } from "lucide-react";
import toast from "react-hot-toast";
import styles from "@/styles/FunFacts.module.css";
import dynamic from "next/dynamic";
import { AnimatePresence, motion } from "framer-motion";
import { useRef } from "react";
import { useMonetization } from "@/context/MonetizationContext";
import AdGate from "@/components/monetization/AdGate";

const AntiGravity = dynamic(() => import("../../../components/fun-facts/AntiGravity"), { ssr: false });
const StarSprinkler = dynamic(() => import("../../../components/fun-facts/StarSprinkler"), { ssr: false });

export default function InfiniteFactEngine() {
  const { slug } = useParams();
  const cardRef = useRef(null);
  const [fact, setFact] = useState(null);
  const [loading, setLoading] = useState(true);
  const [antiGravityEn, setAntiGravityEn] = useState(false);
  const [sprinkleTrigger, setSprinkleTrigger] = useState(0);
  const [language, setLanguage] = useState("hi"); 
  const [translating, setTranslating] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const { isPro, useCounts, incrementCount } = useMonetization();
  const [history, setHistory] = useState([]); // Track previous facts
  const [showAdGate, setShowAdGate] = useState(false);
  const [pendingNext, setPendingNext] = useState(false);

  useEffect(() => {
    fetchFact();
    
    const handleFsChange = () => {
      setIsFullScreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFsChange);
    return () => document.removeEventListener("fullscreenchange", handleFsChange);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      cardRef.current?.requestFullscreen().catch(err => {
        toast.error(`Error attempting to enable full-screen mode: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  const stars = useMemo(() => {
    return Array.from({ length: 40 }).map((_, i) => ({
      id: i,
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
      duration: `${2 + Math.random() * 4}s`,
      delay: `${Math.random() * 2}s`
    }));
  }, []);

  const fetchFact = async (omitFactId) => {
    // Check limits (Trigger AdGate every 20 facts)
    if (!isPro && useCounts.facts > 0 && useCounts.facts % 20 === 0 && !pendingNext) {
      setShowAdGate(true);
      return;
    }

    // Save current fact to history before fetching next
    if (fact && !omitFactId) {
      setHistory(prev => [...prev, fact]);
    }

    setLoading(true);
    try {
      let category = null;
      if (slug !== "voyager") {
        const catRes = await fetch("/api/fun-facts/categories");
        const catData = await catRes.json();
        category = catData.categories?.find((c) => c.slug === slug);
        
        if (!category) {
          setFact(null); setLoading(false); return;
        }
      }

      let url = "/api/fun-facts?";
      if (category) url += `categoryId=${category.id}&`;
      if (omitFactId) url += `omitFactId=${omitFactId}`;

      const res = await fetch(url);
      if (!res.ok) throw new Error("Fact fetch failed");
      const data = await res.json();
      
      setFact(data.fact);
      incrementCount("facts");
      setPendingNext(false); 
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch fact");
    } finally {
      setLoading(false);
    }
  };

  const goBack = () => {
    if (history.length === 0) return;
    const prevFact = history[history.length - 1];
    setHistory(prev => prev.slice(0, -1));
    setFact(prevFact);
  };

  const handleTranslate = async (targetLang) => {
    if (language === targetLang) return;
    
    if (targetLang === "hi" && fact?.descriptionHi) {
      setLanguage("hi");
      return;
    }
    if (targetLang === "en" && fact?.description) {
      setLanguage("en");
      return;
    }

    setTranslating(true);
    try {
      const textToTranslate = language === "en" ? fact.description : fact.descriptionHi || fact.description;
      const res = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: textToTranslate, to: targetLang })
      });
      const data = await res.json();
      if (data.translations) {
        setFact(prev => ({
          ...prev,
          [targetLang === "hi" ? "descriptionHi" : "description"]: data.translations
        }));
        setLanguage(targetLang);
      }
    } catch (err) {
      toast.error("Translation failed");
    } finally {
      setTranslating(false);
    }
  };

  const shareFact = () => {
    if (!fact) return;
    const desc = language === "hi" ? (fact.descriptionHi || fact.description) : fact.description;
    const text = `Did you know? ${desc}`;
    const url = window.location.href;
    
    if (navigator.share) {
      navigator.share({ title: "Mind-Blowing Fact", text, url }).catch(console.error);
    } else {
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
    }
  };

  const currentDescription = useMemo(() => {
    if (!fact) return "";
    if (language === "hi") return fact.descriptionHi || fact.description;
    return fact.description;
  }, [fact, language]);

  return (
    <div className={styles.engineWrapper}>
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
      
      <button 
        onClick={() => {
            setAntiGravityEn(true);
            setSprinkleTrigger(prev => prev + 1);
        }} 
        title="Zero-G Mode"
        className={styles.antiGravityTrigger}
      >
        <Sparkles className="w-5 h-5 text-yellow-400" />
      </button>

      {antiGravityEn && <AntiGravity onReset={() => window.location.reload()} />}
      <StarSprinkler trigger={sprinkleTrigger} />

      <div className={`${styles.container} matter-element`}>
        <div 
          ref={cardRef}
          className={`${styles.factCard} ${(!fact || fact?.id?.charCodeAt(0) % 2 === 0) ? styles.blueTheme : styles.goldTheme}`}
        >
          <div className={styles.topControls}>
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

            <div className="flex items-center gap-3">
              <Link href="/fun-facts" className={`${styles.iconButton} ${styles.withText} border-yellow-500/50`}>
                <span className="text-yellow-400">Topics</span>
              </Link>
              
              <button 
                disabled={loading || history.length === 0}
                onClick={goBack}
                className={`${styles.iconButton} ${styles.nextFactBtn} ${styles.withText}`}
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>

              <button 
                disabled={loading}
                onClick={() => fetchFact(fact?.id)}
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
                onClick={shareFact}
                className={styles.iconButton}
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex-1 flex flex-col justify-center w-full">
            <AnimatePresence mode="wait">
              {loading ? (
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
                    {slug === "voyager" && (
                      <span style={{ color: "white", marginRight: "0.5rem" }}>
                        VOYAGER STREAM:
                      </span>
                    )}
                    {language === "hi" ? (fact.category?.nameHi || fact.category?.name) : fact.category?.name}
                  </div>
                  
                  <div className="relative mb-8">
                    <Quote className={styles.quoteIcon} />
                    <h2 className={styles.factDescription}>
                      {translating ? "Translating..." : currentDescription}
                    </h2>
                  </div>

                  {fact.image && (
                    <div className={styles.factImageContainer}>
                      <img src={fact.image} alt="Fact context" className={styles.factImage} />
                    </div>
                  )}

                  <div className={styles.viewCount}>
                    <Eye className="w-4 h-4" />
                    <span>{fact.views || 0} people have read this</span>
                  </div>
                </motion.div>
              ) : (
                <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-12 text-gray-400 text-center flex-1 flex items-center justify-center">
                  No facts available.
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
      
      <AdGate 
        isOpen={showAdGate}
        onClose={() => setShowAdGate(false)}
        onComplete={() => {
          setShowAdGate(false);
          setPendingNext(true); // Flag to bypass limit check for ONE fetch
          fetchFact(fact?.id);
        }}
        title="Unlocking More Fun Facts"
      />
    </div>
  );
}
