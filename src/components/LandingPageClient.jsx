"use client";

import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useData } from "@/context/DataContext";
import { motion, AnimatePresence } from "framer-motion";
import { Search, MapPin, Calendar, Clock, BookOpen, User, ArrowRight, Share2, Heart, Filter, SlidersHorizontal, ChevronDown, ChevronUp, Star, LayoutGrid, List, Sparkles, Trophy, Radio } from "lucide-react";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { debounce } from "lodash";
import { useSession, signIn } from "next-auth/react";
import { useUI } from "@/context/UIContext";
import { useLanguage } from "@/context/LanguageContext";
import toast from "react-hot-toast";
import styles from "@/styles/LandingPage.module.css";
import WelcomePromoPopup from "@/components/WelcomePromoPopup";
import LiveStudyButton from "@/components/engine/LiveStudyButton";
import MixPlayCard from "@/components/MixPlayCard";
import MixQuizModal from "@/components/MixQuizModal";

// Import safe JSON parsing utility
function safeJsonParse(json, fallback = []) {
  if (!json) return fallback;
  if (typeof json !== 'string') return json;
  try {
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) ? parsed : fallback;
  } catch (error) {
    console.error("JSON parse error in home page:", error, "on string:", json);
    return fallback;
  }
}


function getRelevantImage(topic, emoji) {
  const topicLower = topic.toLowerCase();
  
  // Science related topics
  if (topicLower.includes('science') || topicLower.includes('physics') || topicLower.includes('chemistry') || topicLower.includes('biology') || topicLower.includes('astronomy')) {
    return '🔬';
  }
  
  // History related topics
  if (topicLower.includes('history') || topicLower.includes('ancient') || topicLower.includes('medieval') || topicLower.includes('war') || topicLower.includes('civilization')) {
    return '📚';
  }
  
  // Geography related topics
  if (topicLower.includes('geography') || topicLower.includes('country') || topicLower.includes('capital') || topicLower.includes('world') || topicLower.includes('map')) {
    return '🌍';
  }
  
  // Technology/Computer topics
  if (topicLower.includes('computer') || topicLower.includes('technology') || topicLower.includes('programming') || topicLower.includes('software') || topicLower.includes('internet')) {
    return '💻';
  }
  
  // Mathematics topics
  if (topicLower.includes('math') || topicLower.includes('mathematics') || topicLower.includes('algebra') || topicLower.includes('geometry') || topicLower.includes('calculation')) {
    return '🔢';
  }
  
  // Sports topics
  if (topicLower.includes('sport') || topicLower.includes('football') || topicLower.includes('cricket') || topicLower.includes('basketball') || topicLower.includes('tennis')) {
    return '⚽';
  }
  
  // Entertainment/Movies topics
  if (topicLower.includes('movie') || topicLower.includes('film') || topicLower.includes('cinema') || topicLower.includes('bollywood') || topicLower.includes('hollywood')) {
    return '🎬';
  }
  
  // Music topics
  if (topicLower.includes('music') || topicLower.includes('song') || topicLower.includes('instrument') || topicLower.includes('singer') || topicLower.includes('melody')) {
    return '🎵';
  }
  
  // Literature/Books topics
  if (topicLower.includes('book') || topicLower.includes('literature') || topicLower.includes('novel') || topicLower.includes('author') || topicLower.includes('poem')) {
    return '📖';
  }
  
  // Art topics
  if (topicLower.includes('art') || topicLower.includes('painting') || topicLower.includes('drawing') || topicLower.includes('sculpture') || topicLower.includes('museum')) {
    return '🎨';
  }
  
  // Food/Cooking topics
  if (topicLower.includes('food') || topicLower.includes('cook') || topicLower.includes('recipe') || topicLower.includes('cuisine') || topicLower.includes('dish')) {
    return '🍳';
  }
  
  // Animals/Nature topics
  if (topicLower.includes('animal') || topicLower.includes('wildlife') || topicLower.includes('nature') || topicLower.includes('forest') || topicLower.includes('ocean')) {
    return '🦁';
  }
  
  // Health/Medical topics
  if (topicLower.includes('health') || topicLower.includes('medical') || topicLower.includes('disease') || topicLower.includes('body') || topicLower.includes('medicine')) {
    return '⚕️';
  }
  
  // Business/Economy topics
  if (topicLower.includes('business') || topicLower.includes('economy') || topicLower.includes('finance') || topicLower.includes('money') || topicLower.includes('market')) {
    return '💰';
  }
  
  // Politics/Government topics
  if (topicLower.includes('politics') || topicLower.includes('government') || topicLower.includes('election') || topicLower.includes('democracy') || topicLower.includes('parliament')) {
    return '🏛️';
  }
  
  // Space/Universe topics
  if (topicLower.includes('space') || topicLower.includes('universe') || topicLower.includes('planet') || topicLower.includes('galaxy') || topicLower.includes('astronaut')) {
    return '🚀';
  }
  
  // Religion/Mythology topics
  if (topicLower.includes('religion') || topicLower.includes('mythology') || topicLower.includes('god') || topicLower.includes('temple') || topicLower.includes('church')) {
    return '⛪';
  }
  
  // Language topics
  if (topicLower.includes('language') || topicLower.includes('english') || topicLower.includes('grammar') || topicLower.includes('vocabulary') || topicLower.includes('speaking')) {
    return '💬';
  }
  
  // Indian / Specific Regional topics
  if (topicLower.includes('india') || topicLower.includes('indian') || topicLower.includes('kingdom')) {
    return '🇮🇳';
  }

  // Time / Important Days topics
  if (topicLower.includes('day') || topicLower.includes('date') || topicLower.includes('calendar') || topicLower.includes('important days')) {
    return '📅';
  }

  // General Knowledge topics
  if (topicLower.includes('general') || topicLower.includes('gk') || topicLower.includes('knowledge') || topicLower.includes('trivia') || topicLower.includes('facts')) {
    return '🧠';
  }
  
  // Current Affairs topics
  if (topicLower.includes('current') || topicLower.includes('affairs') || topicLower.includes('news') || topicLower.includes('latest') || topicLower.includes('recent')) {
    return '📰';
  }
  
  // Default fallback to provided emoji or a general quiz emoji
  return emoji || '📝';
}

const HOME_CHIPS = ["General Knowledge", "Others"];

// Helper function to identify daily categories dynamically
const getDailyCategoryIds = (quizzes) => {
  const dailyIds = new Set();
  
  quizzes.forEach(category => {
    // Identify Quiz of the Day by topic or specific properties
    if (category.topic.toLowerCase().includes('quiz of the day') || 
        category.topic.toLowerCase().includes('daily quiz') ||
        category.categoryClass?.includes('daily-quiz')) {
      dailyIds.add(category.id);
    }
    
    // Identify Daily Current Affairs by topic or specific properties
    if (category.topic.toLowerCase().includes('current affairs') || 
        category.topic.toLowerCase().includes('daily current') ||
        category.categoryClass?.includes('current-affairs')) {
      dailyIds.add(category.id);
    }
  });
  
  return dailyIds;
};

const estimateTime = (numQuestions) => {
  const seconds = numQuestions * 18; // Avg 18s per question
  const minutes = Math.round(seconds / 60);
  return minutes < 1 ? "< 1 min" : `~${minutes} mins`;
};

// Calculate progress for a category
const calculateProgress = (categoryId, totalQuestions) => {
  // This would normally come from user data/API
  // For demo, we'll use localStorage to simulate progress (client-side only)
  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem(`quiz-progress-${categoryId}`);
      if (saved) {
        const { completed = 0, total = totalQuestions } = JSON.parse(saved);
        return total > 0 ? Math.round((completed / total) * 100) : 0;
      }
    } catch (error) {
      console.error('Error reading localStorage:', error);
    }
  }
  return 0; // Default to 0% progress
};

// Helper function to extract or generate multiple topic-relevant questions for auto-refreshing preview
export function getCardQuestionsList(quiz, isHindi) {
  if (quiz?.questions && Array.isArray(quiz.questions) && quiz.questions.length > 0) {
    const formatted = quiz.questions.map(q => {
      const text = (isHindi && q.textHi) ? q.textHi : q.text;
      const opts = (isHindi && q.optionsHi && q.optionsHi.length > 0) ? q.optionsHi : q.options;
      if (text && opts && Array.isArray(opts) && opts.length >= 2) {
        return { text, options: opts };
      }
      return null;
    }).filter(Boolean);
    if (formatted.length > 0) return formatted;
  }

  const topicLower = (quiz?.topic || "").toLowerCase();
  
  if (topicLower.includes('bollywood') || topicLower.includes('movie') || topicLower.includes('cinema') || topicLower.includes('film')) {
    return isHindi ? [
      { text: "भारत की पहली मूक (Silent) फिल्म कौन सी थी?", options: ["आलम आरा", "राजा हरिश्चंद्र", "पुंडलिक", "किस्सा कुर्सी का"] },
      { text: "भारत की पहली बोलती फिल्म कौन सी थी?", options: ["आलम आरा", "राजा हरिश्चंद्र", "शोले", "मदर इंडिया"] },
      { text: "ऑस्कर पुरस्कार जीतने वाले प्रथम भारतीय कौन थे?", options: ["भानु अथैया", "सत्यजीत रे", "ए.आर. रहमान", "गुलजार"] },
      { text: "फिल्म 'शोले' के निर्देशक कौन थे?", options: ["रमेश सिप्पी", "यश चोपड़ा", "सुभाष घई", "करण जौहर"] }
    ] : [
      { text: "Which was India's first silent feature film?", options: ["Alam Ara", "Raja Harishchandra", "Pundalik", "Kissa Kursi Ka"] },
      { text: "Which was India's first sound motion picture?", options: ["Alam Ara", "Raja Harishchandra", "Sholay", "Mother India"] },
      { text: "Who was the first Indian to win an Oscar award?", options: ["Bhanu Athaiya", "Satyajit Ray", "A.R. Rahman", "Gulzar"] },
      { text: "Who directed the legendary movie 'Sholay'?", options: ["Ramesh Sippy", "Yash Chopra", "Subhash Ghai", "Karan Johar"] }
    ];
  }

  if (topicLower.includes('computer') || topicLower.includes('tech')) {
    return isHindi ? [
      { text: "कंप्यूटर सिस्टम में 'Cache' क्या है?", options: ["डेटा स्टोरेज", "तेज मेमोरी", "वायरस", "इनपुट डिवाइस"] },
      { text: "बाइनरी सिस्टम में कितने अंक होते हैं?", options: ["10", "8", "2", "16"] },
      { text: "कंप्यूटर के संदर्भ में 'ALU' का क्या अर्थ है?", options: ["Arithmetic Logic Unit", "Array Logic Unit", "Access List Unit", "All Logic Unit"] },
      { text: "कंप्यूटर में RAM की मुख्य भूमिका क्या है?", options: ["अस्थाई स्टोरेज", "स्थाई डेटा", "प्रोसेसिंग चिप", "डिस्प्ले कार्ड"] }
    ] : [
      { text: "What is 'Cache' in a computer system?", options: ["Data Storage", "High-speed Memory", "Virus", "Input Device"] },
      { text: "How many digits are used in the Binary System?", options: ["10", "8", "2", "16"] },
      { text: "What does 'ALU' stand for in computers?", options: ["Arithmetic Logic Unit", "Array Logic Unit", "Access List Unit", "All Logic Unit"] },
      { text: "What is the main function of RAM in a computer?", options: ["Temporary Storage", "Permanent Data", "Processing Unit", "Display Controller"] }
    ];
  }

  if (topicLower.includes('bio') || topicLower.includes('science') || topicLower.includes('chem') || topicLower.includes('phys')) {
    return isHindi ? [
      { text: "जीव जगत की मूलभूत क्रियात्मक इकाई क्या है?", options: ["कोशिका (Cell)", "ऊतक (Tissue)", "अंग (Organ)", "डीएनए (DNA)"] },
      { text: "मानव शरीर में सबसे बड़ी ग्रंथि कौन सी है?", options: ["यकृत (Liver)", "अग्न्याशय (Pancreas)", "थायरॉयड", "पीयूष ग्रंथि"] },
      { text: "प्रकाश संश्लेषण किस रंग के प्रकाश में सर्वाधिक होता है?", options: ["लाल प्रकाश", "हरा प्रकाश", "नीला प्रकाश", "पीला प्रकाश"] }
    ] : [
      { text: "What is the structural and functional unit of life?", options: ["Cell", "Tissue", "Organ", "DNA"] },
      { text: "Which is the largest gland in the human body?", options: ["Liver", "Pancreas", "Thyroid", "Pituitary"] },
      { text: "In which light color is photosynthesis most active?", options: ["Red Light", "Green Light", "Blue Light", "Yellow Light"] }
    ];
  }

  if (topicLower.includes('history') || topicLower.includes('ancient') || topicLower.includes('medieval')) {
    return isHindi ? [
      { text: "भारत में प्रथम स्वतंत्रता संग्राम किस वर्ष हुआ था?", options: ["1857", "1947", "1920", "1942"] },
      { text: "सिंधु घाटी सभ्यता का प्रमुख बंदरगाह नगर कौन सा था?", options: ["लोथल", "कालीबंगा", "हड़प्पा", "मोहनजोदड़ो"] },
      { text: "अशोक महान किस वंश के सम्राट थे?", options: ["मौर्य वंश", "गुप्त वंश", "कुषाण वंश", "शुंग वंश"] }
    ] : [
      { text: "In which year did the First War of Independence take place?", options: ["1857", "1947", "1920", "1942"] },
      { text: "Which was the major port town of Indus Valley Civilization?", options: ["Lothal", "Kalibangan", "Harappa", "Mohenjo-daro"] },
      { text: "Emperor Ashoka belonged to which dynasty?", options: ["Mauryan", "Gupta", "Kushan", "Shunga"] }
    ];
  }

  if (topicLower.includes('geography') || topicLower.includes('capital') || topicLower.includes('world') || topicLower.includes('map')) {
    return isHindi ? [
      { text: "क्षेत्रफल की दृष्टि से विश्व का सबसे बड़ा देश कौन सा है?", options: ["रूस (Russia)", "कनाडा (Canada)", "चीन (China)", "अमेरिका (USA)"] },
      { text: "भारत की सबसे लंबी नदी कौन सी है?", options: ["गंगा", "यमुना", "गोदावरी", "नर्मदा"] },
      { text: "विश्व का सबसे गहरा महासागर कौन सा है?", options: ["प्रशांत महासागर", "अटलांटिक महासागर", "हिंद महासागर", "आर्कटिक महासागर"] }
    ] : [
      { text: "Which is the largest country in the world by area?", options: ["Russia", "Canada", "China", "USA"] },
      { text: "Which is the longest river flowing in India?", options: ["Ganga", "Yamuna", "Godavari", "Narmada"] },
      { text: "Which is the deepest ocean in the world?", options: ["Pacific Ocean", "Atlantic Ocean", "Indian Ocean", "Arctic Ocean"] }
    ];
  }

  if (topicLower.includes('math') || topicLower.includes('algebra') || topicLower.includes('number')) {
    return isHindi ? [
      { text: "संख्या 144 का वर्गमूल (Square Root) क्या होगा?", options: ["12", "14", "16", "144"] },
      { text: "पाई (π) का लगभग मान कितना होता है?", options: ["3.14", "2.14", "4.14", "1.41"] },
      { text: "सबसे छोटी अभाज्य संख्या (Prime Number) कौन सी है?", options: ["2", "1", "3", "0"] }
    ] : [
      { text: "What is the square root of 144?", options: ["12", "14", "16", "144"] },
      { text: "What is the approximate value of Pi (π)?", options: ["3.14", "2.14", "4.14", "1.41"] },
      { text: "Which is the smallest Prime Number?", options: ["2", "1", "3", "0"] }
    ];
  }

  if (topicLower.includes('sport') || topicLower.includes('cricket') || topicLower.includes('football')) {
    return isHindi ? [
      { text: "भारत ने पहला क्रिकेट विश्व कप किस वर्ष जीता था?", options: ["1983", "2011", "1975", "1992"] },
      { text: "ओलंपिक खेलों के प्रतीक चिन्ह में कितने छल्ले होते हैं?", options: ["5", "4", "6", "7"] },
      { text: "हॉकी के जादूगर के नाम से किसे जाना जाता है?", options: ["मेजर ध्यानचंद", "केडी सिंह", "बलबीर सिंह", "धनराज पिल्लै"] }
    ] : [
      { text: "In which year did India win its first Cricket World Cup?", options: ["1983", "2011", "1975", "1992"] },
      { text: "How many rings are there in the Olympic logo?", options: ["5", "4", "6", "7"] },
      { text: "Who is known as the Wizard of Hockey?", options: ["Major Dhyan Chand", "K.D. Singh", "Balbir Singh", "Dhanraj Pillay"] }
    ];
  }

  return isHindi ? [
    { text: `${quiz?.topicHi || quiz?.topic || 'सामान्य ज्ञान'} का मुख्य सवाल?`, options: ["विकल्प A", "विकल्प B", "विकल्प C", "विकल्प D"] },
    { text: `${quiz?.topicHi || quiz?.topic || 'विषय'} से संबंधित दूसरा महत्वपूर्ण प्रश्न?`, options: ["उत्तर 1", "उत्तर 2", "उत्तर 3", "उत्तर 4"] }
  ] : [
    { text: `Sample question from ${quiz?.topic || 'General Knowledge'}?`, options: ["Option A", "Option B", "Option C", "Option D"] },
    { text: `Second key question from ${quiz?.topic || 'this topic'}?`, options: ["Ans 1", "Ans 2", "Ans 3", "Ans 4"] }
  ];
}

// Stateful component that stays STATIC on desktop/website and ROTATES QUESTIONS ONLY ON MOBILE VIEW
const CardQuestionPreview = React.memo(({ quiz, isHindi }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const questionsList = useMemo(() => {
    return getCardQuestionsList(quiz, isHindi);
  }, [quiz, isHindi]);

  // AUTO ROTATE ONLY ON MOBILE VIEW! (Static on Desktop)
  useEffect(() => {
    if (!isMobile || questionsList.length <= 1) {
      setCurrentIndex(0);
      return;
    }

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % questionsList.length);
    }, 3600);

    return () => clearInterval(interval);
  }, [isMobile, questionsList.length]);

  const currentQ = questionsList[currentIndex] || questionsList[0];
  if (!currentQ) return null;

  return (
    <div style={{ margin: '8px 0 10px 0', minHeight: '106px', position: 'relative' }}>
      <AnimatePresence mode="wait">
        <motion.div
          key={isMobile ? currentIndex : "static-desktop"}
          initial={isMobile ? { opacity: 0, y: 6 } : false}
          animate={{ opacity: 1, y: 0 }}
          exit={isMobile ? { opacity: 0, y: -6 } : false}
          transition={{ duration: 0.35 }}
        >
          <p style={{
            fontSize: '0.82rem',
            color: 'var(--text-secondary)',
            margin: '0 0 6px 0',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            minHeight: '34px',
            lineHeight: '1.45',
            fontWeight: '500'
          }}>
            {currentQ.text}
          </p>
          {currentQ.options && Array.isArray(currentQ.options) && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
              {currentQ.options.slice(0, 4).map((opt, i) => (
                <div key={i} style={{
                  fontSize: '0.75rem',
                  padding: '5px 6px',
                  background: 'rgba(99, 102, 241, 0.05)',
                  border: '1px solid rgba(99, 102, 241, 0.12)',
                  borderRadius: '8px',
                  color: 'var(--text-primary)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  textAlign: 'center',
                  fontWeight: '500'
                }}>
                  {opt}
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
});
CardQuestionPreview.displayName = "CardQuestionPreview";

// Sub-section component for categorized quizzes
const SubSection = React.memo(({ title, quizzes, onViewAll, showMixCard, sectionName, onOpenMixModal, id }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [favorites, setFavorites] = useState(new Set());
  const { data: session } = useSession();
  const { t, isHindi } = useLanguage();
  const [localSearch, setLocalSearch] = useState("");
  const [showAllChips, setShowAllChips] = useState(false);

  const filteredQuizzes = useMemo(() => {
    if (!localSearch.trim()) return quizzes || [];
    return (quizzes || []).filter(q => 
      (q.topic || "").toLowerCase().includes(localSearch.toLowerCase()) ||
      (q.topicHi && q.topicHi.toLowerCase().includes(localSearch.toLowerCase()))
    );
  }, [quizzes, localSearch]);

  const handleShare = useCallback((e, quiz) => {
    e.preventDefault();
    e.stopPropagation();

    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const url = `${origin}/category/${quiz.slug || quiz.id}`;
    const text = `${quiz.topic} - ${quiz.questionCount || 0} questions`;

    async function shareLinkOnly() {
      if (navigator.share) {
        await navigator.share({ title: quiz.topic, text, url });
        return true;
      }
      await navigator.clipboard?.writeText(url);
      toast.success("Link copied");
      return true;
    }

    async function shareImageIfPossible() {
      if (!navigator.canShare) return false;
      // Minimal, reliable fallback: do not attempt image generation without a dedicated renderer
      return false;
    }

    (async () => {
      try {
        const didImage = await shareImageIfPossible();
        if (didImage) return;
        await shareLinkOnly();
      } catch {
        try {
          await shareLinkOnly();
        } catch {}
      }
    })();
  }, []);

  // Load favorites from server (signed-in users) or localStorage (guests)
  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        if (session?.user && !session.user.isAdmin) {
          const res = await fetch("/api/category-favourites?ids=1", { cache: "no-store" });
          const data = await res.json().catch(() => ({}));
          const ids = Array.isArray(data?.ids) ? data.ids : [];
          if (!cancelled) setFavorites(new Set(ids));
          return;
        }
      } catch {}

      try {
        const saved = localStorage.getItem("favorite_quizzes");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && !cancelled) setFavorites(new Set(parsed));
        }
      } catch (e) {
        console.error("Failed to parse favorites", e);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [session]);

  const toggleFavorite = useCallback((e, quizId) => {
    e.preventDefault();
    e.stopPropagation();
    if (!session?.user || session.user.isAdmin) {
      setShowSignInModal(true);
      return;
    }

    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(quizId)) next.delete(quizId);
      else next.add(quizId);
      return next;
    });

    fetch("/api/category-favourites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ categoryId: quizId }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (typeof data?.favourited === "boolean") {
          setFavorites((prev) => {
            const next = new Set(prev);
            if (data.favourited) next.add(quizId);
            else next.delete(quizId);
            return next;
          });
        }
      })
      .catch(() => {});
  }, [session]);

  // Get relevant icon for the sub-section
  const getTranslatedTopic = useCallback((topic, topicHi) => {
    if (isHindi && topicHi) return topicHi;
    if (!isHindi) return topic;
    
    // Fallback dictionary for common topics if topicHi is missing
    const fallbacks = {
      "General Knowledge": "सामान्य ज्ञान",
      "GK": "सामान्य ज्ञान",
      "India": "भारत",
      "World": "विश्व",
      "History": "इतिहास",
      "Sports": "खेल",
      "Computer": "कंप्यूटर",
      "Technology": "तकनीक",
      "Economy": "अर्थव्यवस्था",
      "Polity": "राजव्यवस्था",
      "Chemistry": "रसायन विज्ञान",
      "Physics": "भौतिकी",
      "Biology": "जीव विज्ञान",
      "Bollywood": "बॉलीवुड",
      "Entertainment": "मनोरंजन",
      "Others": "अन्य"
    };
    
    return fallbacks[topic] || topic;
  }, [isHindi]);

  const getSubSectionIcon = useCallback((title) => {
    const titleLower = title.toLowerCase();
    
    if (titleLower.includes('general knowledge') || titleLower.includes('gk')) return '🧠';
    if (titleLower.includes('india')) return '🇮🇳';
    if (titleLower.includes('world')) return '🌍';
    if (titleLower.includes('history')) return '📚';
    if (titleLower.includes('sports')) return '⚽';
    if (titleLower.includes('computer') || titleLower.includes('technology')) return '💻';
    if (titleLower.includes('economy')) return '💰';
    if (titleLower.includes('polity')) return '🏛️';
    if (titleLower.includes('chemistry')) return '⚗️';
    if (titleLower.includes('physics')) return '⚛️';
    if (titleLower.includes('biology')) return '🧬';
    if (titleLower.includes('bollywood') || titleLower.includes('entertainment')) return '🎬';
    if (titleLower.includes('company') || titleLower.includes('ceo')) return '🏢';
    if (titleLower.includes('others')) return '📋';
    
    return '📝'; // Default icon
  }, []);

  const toggleExpand = useCallback(() => {
    setIsExpanded(prev => !prev);
  }, []);

  const router = useRouter();
  const handleLivePlay = useCallback((e, quizId) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const sessionId = Math.random().toString(36).substring(2, 10).toUpperCase();
    toast.success("Creating live room...");
    router.push(`/live/${sessionId}?is_host=true${quizId ? `&categoryId=${quizId}` : ''}`);
  }, [router]);

  if (!quizzes || quizzes.length === 0) return null;

  return (
    <div className={styles.subSection} id={id}>
      <div className={styles.subSectionContentWrapper}>
        
        {String(title || "").trim().toLowerCase() !== "topics" && title !== sectionName && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <span className={styles.subSectionIcon}>{getSubSectionIcon(title)}</span>
            <h3 className={styles.subSectionTitle} style={{ fontSize: '1.1rem', margin: 0 }}>
              {getTranslatedTopic(title, null)}
              <span className={styles.subSectionCount}>({quizzes.length} {isHindi ? 'क्विज़' : 'Quizzes'})</span>
            </h3>
          </div>
        )}

        <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'center' }}>
          <div className={styles.searchBox} style={{ width: '100%', maxWidth: '450px', margin: '0 auto', borderRadius: '20px', padding: '2px 14px', background: 'var(--bg-primary)' }}>
            <span className={styles.searchIcon} style={{ display: 'flex', alignItems: 'center', opacity: 0.7 }}>
              <Search size={18} />
            </span>
            <input
              type="text"
              className={styles.searchInput}
              style={{ padding: '10px 0', fontSize: '0.92rem', marginLeft: '8px' }}
              placeholder={isHindi ? `खोजें ${sectionName || title} क्विज़ विषय...` : `Search ${sectionName || title} Quiz Topic Here...`}
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
            />
            {localSearch && (
              <button
                onClick={() => setLocalSearch("")}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Quick Access Chips */}
        {quizzes && quizzes.length > 0 && (
          <div style={{ 
            display: 'flex', 
            flexWrap: 'wrap', 
            gap: '8px', 
            justifyContent: 'center', 
            marginBottom: '20px',
            padding: '4px'
          }}>
            {quizzes.slice(0, showAllChips ? quizzes.length : 5).map((quiz) => (
              <Link
                key={quiz.id}
                href={`/category/${quiz.slug || quiz.id}`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  borderRadius: '12px',
                  background: 'rgba(99, 102, 241, 0.05)',
                  border: '1px solid rgba(99, 102, 241, 0.15)',
                  color: 'var(--text-primary)',
                  fontSize: '0.8rem',
                  fontWeight: '600',
                  textDecoration: 'none',
                  transition: 'all 0.2s ease',
                  whiteSpace: 'nowrap'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--brand-gradient)';
                  e.currentTarget.style.borderColor = 'transparent';
                  e.currentTarget.style.color = 'white';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(99, 102, 241, 0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(99, 102, 241, 0.05)';
                  e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.15)';
                  e.currentTarget.style.color = 'var(--text-primary)';
                  e.currentTarget.style.transform = 'none';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <span style={{ fontSize: '1rem' }}>{quiz.emoji || "📝"}</span>
                <span>{isHindi && quiz.topicHi ? quiz.topicHi : quiz.topic}</span>
              </Link>
            ))}
            {quizzes.length > 5 && (
              <button
                onClick={() => setShowAllChips(!showAllChips)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '6px 12px',
                  borderRadius: '12px',
                  background: 'rgba(99, 102, 241, 0.08)',
                  border: '1px dashed rgba(99, 102, 241, 0.4)',
                  color: 'var(--brand-primary, #6366f1)',
                  fontSize: '0.8rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  whiteSpace: 'nowrap'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(99, 102, 241, 0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(99, 102, 241, 0.08)';
                }}
              >
                {showAllChips ? (isHindi ? 'कम दिखाएं' : 'View Less') : (isHindi ? 'और देखें' : `+${quizzes.length - 5} More`)}
              </button>
            )}
          </div>
        )}



        <div className={styles.subSectionGrid}>
          {showMixCard && <MixPlayCard sectionName={sectionName} quizzes={quizzes} onOpenModal={onOpenMixModal} />}
          {(filteredQuizzes || []).map((quiz) => (
            <motion.div
              key={quiz.id}
              className={styles.subSectionCard}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Link href={`/category/${quiz.slug || quiz.id}`} className={styles.subSectionCardLink}>
                <div className={styles.subSectionCardImage}>
                  {quiz.image ? (
                    <img 
                      src={quiz.image} 
                      alt={quiz.topic} 
                      className={styles.subSectionCardImg}
                      loading="lazy"
                    />
                  ) : (
                    <span className={styles.subSectionCardEmoji}>
                      {getRelevantImage(quiz.topic, quiz.emoji)}
                    </span>
                  )}
                  <div className={styles.cardActions}>
                    <button 
                      className={`${styles.favoriteBtn} ${favorites.has(quiz.id) ? styles.isFavorite : ''}`}
                      onClick={(e) => toggleFavorite(e, quiz.id)}
                      title={favorites.has(quiz.id) ? (t('common.removeFav') || "Remove from favorites") : (t('common.addFav') || "Add to favorites")}
                    >
                      <Heart size={16} fill={favorites.has(quiz.id) ? "currentColor" : "none"} />
                    </button>
                    <button
                      className={styles.shareBtn}
                      onClick={(e) => handleShare(e, quiz)}
                      title={t('common.share') || "Share"}
                    >
                      <Share2 size={16} />
                    </button>
                  </div>
                </div>
                <div className={styles.subSectionCardContent}>
                  <h4 className={styles.subSectionCardTitle}>{getTranslatedTopic(quiz.topic, quiz.topicHi)}</h4>
                  
                  <div className={styles.subSectionCardFooter}>
                    <span className={styles.subSectionCardCount}>
                      📝 {quiz.questionCount || 0}+ {isHindi ? 'प्रश्न' : 'Questions'}
                    </span>
                  </div>

                  {/* Featured Question & 4 Options Preview (Auto-rotates ONLY on Mobile, Static on Desktop) */}
                  <CardQuestionPreview quiz={quiz} isHindi={isHindi} />

                  <div className={styles.setCardActions}>
                    <button
                      className={styles.playQuizButton}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        window.location.href = `/category/${quiz.slug || quiz.id}`;
                      }}
                      aria-label={`${t('quizzes.cards.playQuiz')} ${quiz.topic}`}
                    >
                      {t('quizzes.cards.playQuiz')}
                    </button>
                    <button
                      className={`${styles.liveButtonStyle} ${styles.liveButtonOutline}`}
                      onClick={(e) => handleLivePlay(e, quiz.id)}
                      title={t('quizzes.cards.playWithFriends') || "Play with friends"}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                      {t('quizzes.cards.playLive')}
                    </button>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
});
SubSection.displayName = "SubSection";

// Function to categorize quizzes based on sections
function categorizeQuizzes(quizzes, sections) {
  const sectionMap = new Map();
  const matchedQuizIds = new Set();
  
  (sections || []).forEach(section => {
    const nameKey = (section.name || "").trim();
    if (!nameKey) return;

    if (!sectionMap.has(nameKey)) {
      sectionMap.set(nameKey, {
        id: section.id,
        name: section.name,
        nameHi: section.nameHi,
        subSections: []
      });
    }

    const sectionData = sectionMap.get(nameKey);
    
    (section.subSections || []).forEach(subSection => {
      const quizIds = subSection.quizIds || [];
      const subSectionQuizzes = quizzes.filter(quiz => quizIds.includes(quiz.id));
      
      if (subSectionQuizzes.length > 0) {
        subSectionQuizzes.forEach(q => matchedQuizIds.add(q.id));

        const subTitleKey = (subSection.name || "").trim();
        const existingSub = sectionData.subSections.find(s => (s.title || "").trim() === subTitleKey);
        
        if (existingSub) {
          const existingIds = new Set(existingSub.quizzes.map(q => q.id));
          subSectionQuizzes.forEach(q => {
            if (!existingIds.has(q.id)) existingSub.quizzes.push(q);
          });
        } else {
          sectionData.subSections.push({
            title: subSection.name,
            titleHi: subSection.nameHi,
            quizzes: [...subSectionQuizzes],
            order: subSection.order
          });
        }
      }
    });
  });

  const categorized = Array.from(sectionMap.values()).filter(s => s.subSections.length > 0);
  categorized.forEach(s => s.subSections.sort((a, b) => a.order - b.order));

  // Collect quizzes that are not in any section
  const uncategorized = quizzes.filter(quiz => !matchedQuizIds.has(quiz.id));
  if (uncategorized.length > 0) {
    categorized.push({
      id: "uncategorized",
      name: "State GK Quizzes",
      nameHi: "स्टेट जीके क्विज़",
      subSections: [{
        title: "State GK",
        titleHi: "स्टेट जीके",
        quizzes: uncategorized,
        order: 999
      }]
    });
  }
  
  return categorized;
}

// Main Category Section component
const MainCategorySection = React.memo(({ section, sectionIds, onOpenMixModal, isFirstSection }) => {
  const { isHindi } = useLanguage();
  const [isExpanded, setIsExpanded] = useState(true);
  const subSections = section.subSections || [];
  
  if (subSections.length === 0) return null;

  const totalQuizzesCount = subSections.reduce((acc, sub) => acc + (sub.quizzes?.length || 0), 0);
  const sectionDisplayName = isHindi && section.nameHi ? section.nameHi : section.name;

  return (
    <div className={styles.mainCategorySection} id={sectionIds?.[section.name] || undefined}>
      <div className={styles.mainCategoryHeader}>
        <div className={styles.mainCategoryTitleWrapper}>
          <h2 className={styles.sectionTitle}>
            {sectionDisplayName}
          </h2>
          <span className={styles.sectionTitleCount}>
            ({totalQuizzesCount} {isHindi ? 'क्विज़ उपलब्ध' : 'Quizzes Available'})
          </span>
        </div>

        <button 
          className={styles.sectionToggleIconButton}
          onClick={() => setIsExpanded(!isExpanded)}
          aria-label={isExpanded ? "Collapse section" : "Expand section"}
          title={isExpanded ? (isHindi ? "छिपाएं" : "Collapse") : (isHindi ? "दिखाएं" : "Expand")}
        >
          <svg 
            width="18" 
            height="18" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2.5" 
            strokeLinecap="round" 
            strokeLinejoin="round"
            style={{ 
              transform: isExpanded ? 'rotate(0deg)' : 'rotate(180deg)',
              transition: 'transform 0.3s ease' 
            }}
          >
            <path d="M18 15l-6-6-6 6"/>
          </svg>
        </button>
      </div>
      
      {isExpanded && subSections.map((subSection, index) => (
        <SubSection
          key={subSection.title}
          id={sectionIds?.[subSection.title] || undefined}
          title={isHindi && subSection.titleHi ? subSection.titleHi : subSection.title}
          quizzes={subSection.quizzes}
          showMixCard={isFirstSection && index === 0}
          sectionName={section.name}
          onOpenMixModal={onOpenMixModal}
        />
      ))}
    </div>
  );
});
MainCategorySection.displayName = "MainCategorySection";

export default function LandingPage({ initialCategories = [] }) {
  const { data: session } = useSession();
  const { settings, loaded, quizzes } = useData();
  const { openOnboarding } = useUI();
  const { t, isHindi } = useLanguage();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [sections, setSections] = useState([]);
  const [sectionsLoaded, setSectionsLoaded] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [audienceTab, setAudienceTab] = useState("regular"); // "regular" | "govt"
  const quizSectionRef = useRef(null);

  const scrollToQuizzes = () => {
    quizSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  useEffect(() => {
    setMounted(true);
  }, []);
  
  // New state for paginated data
  const [visibleCategories, setVisibleCategories] = useState(initialCategories);
  const [totalCategories, setTotalCategories] = useState(initialCategories.length || 0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(initialCategories.length === 0);
  const [loadingMore, setLoadingMore] = useState(false);
  const itemsPerPage = 12;

  // Debounced search logic
  const debouncedSearchHandler = useCallback(
    debounce((value) => {
      setDebouncedSearch(value);
      setPage(1); // Reset to first page on search
    }, 500),
    []
  );

  const handleSearchChange = useCallback((value) => {
    setSearch(value);
    debouncedSearchHandler(value);
    setSelectedSuggestionIndex(-1);
    setShowSuggestions(value.trim().length > 0);
  }, [debouncedSearchHandler]);

  // Fetch sections from DB
  useEffect(() => {
    const fetchSections = async () => {
      try {
        const res = await fetch('/api/sections', { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          setSections(data);
        }
      } catch (error) {
        console.error("Failed to fetch sections:", error);
      } finally {
        setSectionsLoaded(true);
      }
    };
    fetchSections();
  }, []);

  const [activeFilters, setActiveFilters] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const [sortBy, setSortBy] = useState("default"); // default, newest, popular, alphabetical
  const [difficultyFilter, setDifficultyFilter] = useState("all"); // all, easy, medium, hard
  const [questionCountFilter, setQuestionCountFilter] = useState("all"); // all, small, medium, large
  const [isPersonalized, setIsPersonalized] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [showSignInModal, setShowSignInModal] = useState(false);
  const [userInterestsCount, setUserInterestsCount] = useState(0);
  const [userInterests, setUserInterests] = useState([]);

  // Check for interests on load
  useEffect(() => {
    if (session?.user?.id) {
      fetch("/api/user/interests")
        .then(r => r.json())
        .then(data => {
          const interests = data.interestedCategories || [];
          setUserInterests(interests);
          setUserInterestsCount(interests.length);
          if (interests.length > 0) {
            setIsPersonalized(true); // Default to personalized if they have interests
          } else {
            const hasSeen = localStorage.getItem(`has_seen_onboarding_${session.user.id}`);
            if (!hasSeen) {
              openOnboarding();
              localStorage.setItem(`has_seen_onboarding_${session.user.id}`, "true");
            }
          }
        })
        .catch(() => {});
    }
  }, [session?.user?.id, openOnboarding]);

  const [userProgress, setUserProgress] = useState({});
  const [previewCategory, setPreviewCategory] = useState(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  
  // Mixed Mode State
  const [showMixModal, setShowMixModal] = useState(false);
  const [activeMixSection, setActiveMixSection] = useState(null);

  const handleOpenMixModal = useCallback((sectionName) => {
    setActiveMixSection(sectionName);
    setShowMixModal(true);
  }, []);

  // Fetch paginated categories
  const fetchCategories = useCallback(async (reset = false) => {
    if (reset) {
      setLoading(true);
      setPage(1);
      setVisibleCategories([]); // Clear immediately for visual feedback
    } else {
      setLoadingMore(true);
    }

    try {
      const currentPage = reset ? 1 : page;
      const skip = (currentPage - 1) * itemsPerPage;
      
      const params = new URLSearchParams({
        limit: itemsPerPage.toString(),
        skip: skip.toString(),
        search: debouncedSearch,
        sortBy: sortBy,
        difficulty: difficultyFilter,
        questionCount: questionCountFilter,
        chips: activeFilters.join(","),
        personalized: isPersonalized.toString()
      });

      const res = await fetch(`/api/categories?${params}`, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        if (reset) {
          setVisibleCategories(data.categories || []);
        } else {
          setVisibleCategories(prev => [...prev, ...(data.categories || [])]);
        }
        setTotalCategories(data.total || 0);
      }
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [page, debouncedSearch, sortBy, difficultyFilter, questionCountFilter, activeFilters, isPersonalized]);

  useEffect(() => {
    fetchCategories(true);
  }, [debouncedSearch, sortBy, difficultyFilter, questionCountFilter, activeFilters, isPersonalized]);

  const handleLoadMore = () => {
    setPage(prev => prev + 1);
  };

  useEffect(() => {
    if (page > 1) {
      fetchCategories(false);
    }
  }, [page]);

  // Cleanup effect for any timers or animations
  useEffect(() => {
    const handleClickOutside = (event) => {
      const searchContainer = document.querySelector(`.${styles.heroSearchWrapper}`);
      if (searchContainer && !searchContainer.contains(event.target)) {
        setShowSuggestions(false);
        setSelectedSuggestionIndex(-1);
      }
      
      const advancedFiltersPanel = document.querySelector(`.${styles.advancedFiltersPanel}`);
      if (advancedFiltersPanel && showAdvancedFilters && !advancedFiltersPanel.contains(event.target)) {
        const advancedFiltersToggle = document.querySelector(`.${styles.advancedFiltersToggle}`);
        if (advancedFiltersToggle && !advancedFiltersToggle.contains(event.target)) {
          setShowAdvancedFilters(false);
        }
      }
    };

    // Keyboard navigation handler
    const handleKeyDown = (event) => {
      // Escape key closes dropdowns and filters
      if (event.key === 'Escape') {
        setShowSuggestions(false);
        setSelectedSuggestionIndex(-1);
        if (showAdvancedFilters) {
          setShowAdvancedFilters(false);
        }
      }
      
      // Tab navigation for cards
      if (event.key === 'Tab' && !event.shiftKey) {
        const focusableElements = document.querySelectorAll('a[href], button, input, [tabindex]:not([tabindex="-1"])');
        const currentIndex = Array.from(focusableElements).indexOf(document.activeElement);
        const nextIndex = (currentIndex + 1) % focusableElements.length;
        focusableElements[nextIndex]?.focus();
        event.preventDefault();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showAdvancedFilters]);

  // Debounced search effect
  useEffect(() => {
    if (!search.trim()) {
      setIsSearching(false);
      setSearchSuggestions([]);
      setShowSuggestions(false);
      setSelectedSuggestionIndex(-1);
      return;
    }
    
    setIsSearching(true);
    const timer = setTimeout(() => {
      // Generate search suggestions from available categories
      const suggestions = quizzes
        .filter(cat => 
          cat.topic.toLowerCase().includes(search.toLowerCase()) ||
          cat.description.toLowerCase().includes(search.toLowerCase()) ||
          (Array.isArray(cat.chips) && cat.chips.some((chip) => String(chip || "").toLowerCase().includes(search.toLowerCase())))
        )
        .slice(0, 12) // Limit to 12 suggestions
        .map(cat => ({
          id: cat.id,
          slug: cat.slug,
          topic: cat.topic,
          description: cat.description,
          emoji: cat.emoji
        }));
      
      setSearchSuggestions(suggestions);
      setIsSearching(false);
    }, 300); // Debounce search for 300ms

    return () => clearTimeout(timer);
  }, [search, quizzes]);

  const handleFilterClick = useCallback((filter) => {
    setActiveFilters(prev => 
      prev.includes(filter) 
        ? prev.filter(f => f !== filter) 
        : [...prev, filter]
    );
  }, []);

  const handleSearchKeyDown = useCallback((e) => {
    if (!showSuggestions || searchSuggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedSuggestionIndex(prev => 
          prev < searchSuggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedSuggestionIndex(prev => 
          prev > 0 ? prev - 1 : searchSuggestions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedSuggestionIndex >= 0) {
          const selectedSuggestion = searchSuggestions[selectedSuggestionIndex];
          setSearch(selectedSuggestion.topic);
          setDebouncedSearch(selectedSuggestion.topic);
          setShowSuggestions(false);
          setSelectedSuggestionIndex(-1);
          router.push(`/category/${selectedSuggestion.slug || selectedSuggestion.id}`);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedSuggestionIndex(-1);
        break;
    }
  }, [showSuggestions, searchSuggestions, selectedSuggestionIndex, router]);

  const handleSuggestionClick = useCallback((suggestion) => {
    setSearch(suggestion.topic);
    setDebouncedSearch(suggestion.topic);
    setShowSuggestions(false);
    setSelectedSuggestionIndex(-1);
    router.push(`/category/${suggestion.slug || suggestion.id}`);
  }, [router]);

  const handlePreviewClick = useCallback((category) => {
    setPreviewCategory(category);
    setShowPreviewModal(true);
  }, []);

  const closePreviewModal = useCallback(() => {
    setShowPreviewModal(false);
    setPreviewCategory(null);
  }, []);

  const chips = useMemo(() => HOME_CHIPS, []);

  const sectionIds = useMemo(() => {
    const ids = {};
    (sections || []).forEach((s) => {
      const key = String(s?.name || "").trim();
      if (!key) return;
      ids[key] = `section-${key.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}`;
    });
    return ids;
  }, [sections]);

  const scrollToSection = useCallback((sectionName) => {
    const id = sectionIds[sectionName];
    if (!id) return false;
    const el = document.getElementById(id);
    if (!el) return false;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    return true;
  }, [sectionIds]);

  const handleHomeChipClick = useCallback((chip) => {
    const list = (sections || []).map((s) => String(s?.name || "")).filter(Boolean);
    if (list.length === 0) return;

    const isGk = (name) => {
      const n = String(name || "").toLowerCase();
      return n.includes("general knowledge") || n === "gk" || n.includes(" gk") || n.includes("gk ");
    };

    let target = null;
    if (chip === "General Knowledge") {
      target = list.find(isGk) || null;
    } else {
      target = list.find((n) => !isGk(n)) || null;
    }

    if (target) {
      const ok = scrollToSection(target);
      if (!ok) {
        // fallback: jump near main list
        document.querySelector(`.${styles.allSubSections}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  }, [sections, scrollToSection]);

  // For sections, we still use the full list for now as they are specialized
  // but we should eventually optimize /api/sections to return only what's needed.
  const dailyCategoryIds = useMemo(() => getDailyCategoryIds(quizzes), [quizzes]);
  const baseFilteredCategories = useMemo(() => {
    let list = quizzes.filter((c) => !c.hidden && !dailyCategoryIds.has(c.id));
    
    // Apply Personalization to the base list if active
    if (isPersonalized && userInterests.length > 0) {
      list = list.filter(c => userInterests.includes(c.id));
    } else {
      // If not personalized, only show top-level categories or those marked for home
      list = list.filter(c => !c.parentId || c.showSubCategoriesOnHome);
    }

    // Apply Advanced Filters to the main view as well
    if (difficultyFilter !== "all") {
      list = list.filter(c => c.questions?.some(q => q.difficulty === difficultyFilter));
    }
    
    if (questionCountFilter !== "all") {
      list = list.filter(c => {
        const count = c.questions?.length || 0;
        if (questionCountFilter === "small") return count >= 1 && count <= 10;
        if (questionCountFilter === "medium") return count >= 11 && count <= 25;
        if (questionCountFilter === "large") return count >= 26;
        return true;
      });
    }

    if (sortBy === "alphabetical") {
      list = [...list].sort((a, b) => a.topic.localeCompare(b.topic));
    } else if (sortBy === "newest") {
      list = [...list].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    } else if (sortBy === "popular") {
      list = [...list].sort((a, b) => (b.questions?.length || 0) - (a.questions?.length || 0));
    }

    return list;
  }, [quizzes, dailyCategoryIds, difficultyFilter, questionCountFilter, sortBy, isPersonalized, userInterests]);

  const isGovtSection = useCallback((sectionName) => {
    if (!sectionName) return false;
    const name = String(sectionName).toLowerCase();
    return name.includes("govt") || name.includes("exam") || name.includes("सरकारी") || name.includes("परीक्षा");
  }, []);

  const allCategorizedQuizzes = useMemo(() => {
    const list = categorizeQuizzes(baseFilteredCategories, sections);
    const othersIndex = list.findIndex(s => 
      s.name && (
        s.name.toLowerCase() === 'others' || 
        s.name.toLowerCase().includes('others') ||
        s.name.includes('अन्य')
      )
    );
    if (othersIndex > -1) {
      const [othersSection] = list.splice(othersIndex, 1);
      list.push(othersSection);
    }
    return list;
  }, [baseFilteredCategories, sections]);

  const categorizedQuizzes = useMemo(() => {
    if (audienceTab === "govt") {
      return allCategorizedQuizzes.filter(s => isGovtSection(s.name));
    }
    return allCategorizedQuizzes.filter(s => !isGovtSection(s.name));
  }, [allCategorizedQuizzes, audienceTab, isGovtSection]);

  const regularCount = useMemo(() => {
    const regularSections = allCategorizedQuizzes.filter(s => !isGovtSection(s.name));
    return regularSections.reduce((acc, sec) => acc + sec.subSections.reduce((sAcc, sub) => sAcc + (sub.quizzes?.length || 0), 0), 0);
  }, [allCategorizedQuizzes, isGovtSection]);

  const govtCount = useMemo(() => {
    const govtSections = allCategorizedQuizzes.filter(s => isGovtSection(s.name));
    return govtSections.reduce((acc, sec) => acc + sec.subSections.reduce((sAcc, sub) => sAcc + (sub.quizzes?.length || 0), 0), 0);
  }, [allCategorizedQuizzes, isGovtSection]);

  const sectionChipsData = useMemo(() => {
    if (audienceTab === "govt") {
      const chips = [];
      categorizedQuizzes.forEach(section => {
        (section.subSections || []).forEach(sub => {
          if (sub.quizzes && sub.quizzes.length > 0) {
            chips.push({
              id: sub.title,
              name: sub.title,
              nameHi: sub.titleHi,
              count: sub.quizzes.length
            });
          }
        });
      });
      return chips;
    }

    return categorizedQuizzes.map(section => {
      const totalQuizzesCount = section.subSections.reduce((acc, sub) => acc + (sub.quizzes?.length || 0), 0);
      return {
        id: section.id,
        name: section.name,
        nameHi: section.nameHi,
        count: totalQuizzesCount
      };
    }).filter(s => s.count > 0);
  }, [categorizedQuizzes, audienceTab]);

  return (
    <main className={styles.page}>
      {/* Search Orbs & Hero Section */}
      <motion.section 
        className={styles.hero}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className={styles.heroContent}>
          
          {/* Audience Mode Dual Tab Segmented Switcher */}
          <div className={styles.audienceTabsWrapper}>
            <div className={styles.audienceTabsContainer}>
              <button
                onClick={() => setAudienceTab("regular")}
                className={styles.audienceTabBtn}
                style={{
                  color: audienceTab === "regular" ? '#ffffff' : 'var(--text-secondary)',
                }}
              >
                {audienceTab === "regular" && (
                  <motion.div
                    layoutId="audienceTabIndicator"
                    style={{
                      position: 'absolute',
                      inset: 0,
                      borderRadius: '18px',
                      background: 'var(--brand-gradient)',
                      boxShadow: '0 6px 20px rgba(99, 102, 241, 0.35)',
                      zIndex: -1
                    }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <span style={{ fontSize: '1.1rem' }}>🎯</span>
                <span>{t('quizzes.tabs.regular') || 'Regular Quizzes'}</span>
                <span className={styles.audienceTabBadge} style={{
                  background: audienceTab === "regular" ? 'rgba(255, 255, 255, 0.25)' : 'rgba(99, 102, 241, 0.1)',
                  color: audienceTab === "regular" ? '#ffffff' : 'var(--accent)',
                }}>
                  {regularCount}
                </span>
              </button>

              <button
                onClick={() => setAudienceTab("govt")}
                className={styles.audienceTabBtn}
                style={{
                  color: audienceTab === "govt" ? '#ffffff' : 'var(--text-secondary)',
                }}
              >
                {audienceTab === "govt" && (
                  <motion.div
                    layoutId="audienceTabIndicator"
                    style={{
                      position: 'absolute',
                      inset: 0,
                      borderRadius: '18px',
                      background: 'var(--brand-gradient)',
                      boxShadow: '0 6px 20px rgba(99, 102, 241, 0.35)',
                      zIndex: -1
                    }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <span style={{ fontSize: '1.1rem' }}>🏛️</span>
                <span>{t('quizzes.tabs.govtExams') || 'Govt Exam Preparation'}</span>
                <span className={styles.audienceTabBadge} style={{
                  background: audienceTab === "govt" ? 'rgba(255, 255, 255, 0.25)' : 'rgba(99, 102, 241, 0.1)',
                  color: audienceTab === "govt" ? '#ffffff' : 'var(--accent)',
                }}>
                  {govtCount}
                </span>
              </button>
            </div>
          </div>

          <div className={styles.searchActionRow}>
            {/* Integrated Search Command Center */}
            <div className={styles.heroSearchWrapper} style={{ flex: 1, margin: 0, position: 'relative', zIndex: 1000 }}>
              <div className={styles.searchBox}>
                <span className={styles.searchIcon}>
                  {mounted ? (loading ? "⏳" : <Search size={20} />) : null}
                </span>
                <input
                  id="search-box"
                  type="text"
                  className={styles.searchInput}
                  placeholder={loading ? (t('common.searching') || "Searching...") : (t('quizzes.search.placeholder') || 'Search for a quiz topic...')}
                  value={search}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                  onFocus={() => setShowSuggestions(search.trim().length > 0 && searchSuggestions.length > 0)}
                  disabled={loading}
                />
                {search.trim() && (
                  <button
                    className={styles.clearButton}
                    onClick={() => handleSearchChange("")}
                  >✕</button>
                )}
              </div>
              
              {showSuggestions && searchSuggestions.length > 0 && (
                <div className={styles.suggestionsDropdown}>
                  <div className={styles.suggestionsHeader}>
                    <span>{t('quizzes.search.results')}</span>
                    <span className={styles.suggestionCount}>{searchSuggestions.length} {t('quizzes.search.found')}</span>
                  </div>
                  {searchSuggestions.map((suggestion, index) => (
                    <button
                      key={suggestion.id}
                      className={`${styles.suggestionItem} ${
                        index === selectedSuggestionIndex ? styles.selected : ""
                      }`}
                      onClick={() => handleSuggestionClick(suggestion)}
                    >
                      <span className={styles.suggestionEmoji}>{suggestion.emoji || "📝"}</span>
                      <div className={styles.suggestionContent}>
                        <strong className={styles.suggestionName}>
                          {isHindi && suggestion.topicHi ? suggestion.topicHi : suggestion.topic}
                        </strong>
                        <p className={styles.suggestionDescription}>
                          {(() => {
                            const desc = (isHindi && suggestion.descriptionHi) ? suggestion.descriptionHi : suggestion.description;
                            if (!desc) return t('quizzes.search.defaultDesc');
                            return desc.length > 70 ? desc.substring(0, 70) + "..." : desc;
                          })()}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            <button 
              className={`${styles.feedTab} ${styles.playLiveBtnMobile}`}
              style={{ margin: 0, padding: '0 24px', flexShrink: 0, height: '56px', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--brand-gradient)', border: 'none', color: 'white', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 8px 25px rgba(99, 102, 241, 0.35)' }}
              onClick={() => {
                const sessionId = Math.random().toString(36).substring(2, 10).toUpperCase();
                toast.success(isHindi ? "लाइव रूम बना रहे हैं..." : "Creating live room...");
                router.push(`/live/${sessionId}?is_host=true`);
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
                e.currentTarget.style.boxShadow = '0 12px 30px rgba(99, 102, 241, 0.45)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.boxShadow = '0 8px 25px rgba(99, 102, 241, 0.35)';
              }}
            >
              <span className={styles.tabIcon} style={{ color: 'white' }}><Radio size={18} /></span>
              {isHindi ? 'लाइव खेलें' : 'Play Live'} <span className={`${styles.liveDot} animate-pulse`} style={{ background: '#fff', boxShadow: '0 0 0 2px rgba(255,255,255,0.4)' }} />
            </button>

            {session?.user && (
              <button 
                className={styles.feedTab}
                style={{ margin: 0, padding: '0 16px', flexShrink: 0, height: '56px', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-secondary)', border: '1px solid var(--navbar-border)', color: 'var(--text-primary)', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
                onClick={openOnboarding}
                title={t('banners.personalized.btn') || "Personalize"}
              >
                <SlidersHorizontal size={18} />
                <span className="hidden sm:inline">{t('banners.personalized.btn') || "Personalize"}</span>
              </button>
            )}
          </div>

          {/* Section Chips */}
          {!search && !activeFilters.length && sectionChipsData.length > 0 && (
            <div className={styles.sectionChipsContainer} style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'center', margin: '0 auto 16px auto', maxWidth: '800px' }}>
              {sectionChipsData.map((s) => (
                <button
                  key={s.id}
                  className={styles.sectionChip}
                  onClick={() => scrollToSection(s.name)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '10px 20px',
                    borderRadius: '16px',
                    background: 'rgba(99, 102, 241, 0.08)',
                    border: '1.5px solid rgba(99, 102, 241, 0.15)',
                    color: 'var(--accent)',
                    fontSize: '0.9rem',
                    fontWeight: '700',
                    cursor: 'pointer',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    boxShadow: '0 4px 12px rgba(99, 102, 241, 0.05)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'var(--brand-gradient)';
                    e.currentTarget.style.borderColor = 'transparent';
                    e.currentTarget.style.color = 'white';
                    e.currentTarget.style.transform = 'translateY(-3px)';
                    e.currentTarget.style.boxShadow = '0 10px 25px rgba(99, 102, 241, 0.3)';
                    const countSpan = e.currentTarget.querySelector('.chip-count-badge');
                    if (countSpan) {
                      countSpan.style.background = 'rgba(255, 255, 255, 0.25)';
                      countSpan.style.color = 'white';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(99, 102, 241, 0.08)';
                    e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.15)';
                    e.currentTarget.style.color = 'var(--accent)';
                    e.currentTarget.style.transform = 'none';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(99, 102, 241, 0.05)';
                    const countSpan = e.currentTarget.querySelector('.chip-count-badge');
                    if (countSpan) {
                      countSpan.style.background = 'var(--bg-primary)';
                      countSpan.style.color = 'var(--accent)';
                    }
                  }}
                >
                  <span>{isHindi && s.nameHi ? s.nameHi : s.name}</span>
                  <span className="chip-count-badge" style={{ 
                    display: 'inline-flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    background: 'var(--bg-primary)', 
                    padding: '2px 8px', 
                    borderRadius: '10px', 
                    fontSize: '0.75rem', 
                    color: 'var(--accent)',
                    fontWeight: '800',
                    transition: 'all 0.3s ease'
                  }}>
                    {s.count}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </motion.section>

      {/* Main Category Sections */}
      {!search && !activeFilters.length && (
        <div className={styles.allSubSections}>


          {/* Scroll Anchor for Main Quizzes (e.g., General Knowledge) */}
          <div ref={quizSectionRef} className="h-0 w-0 pointer-events-none -mt-8" />

          {categorizedQuizzes.map((section) => (
            <MainCategorySection 
              key={section.id}
              section={section} 
              sectionIds={sectionIds}
              onOpenMixModal={handleOpenMixModal}
              isFirstSection={true}
            />
          ))}
        </div>
      )}

      <MixQuizModal 
        isOpen={showMixModal} 
        onClose={() => setShowMixModal(false)} 
        sectionName={activeMixSection} 
      />

      {/* All Categories Section (always shown, but title changes based on search/filter) */}
      <div className={styles.allCategoriesWrapper} style={{ marginTop: (!search && !activeFilters.length) ? '40px' : '0' }}>
        <h2 className={styles.sectionTitle}>
          {(search || activeFilters.length > 0) ? t('quizzes.search.results') : t('quizzes.sections.all')}
        </h2>
        {loading && visibleCategories.length === 0 && <div className={styles.loadingHint}>{t('quizzes.sections.loading')}</div>}
        {/* For You Welcome Banner */}
        {isPersonalized && userInterestsCount > 0 && (
          <div className="max-w-6xl mx-auto mb-10 p-6 rounded-3xl bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 flex flex-col md:flex-row items-center justify-between gap-6" style={{ gridColumn: "1 / -1", width: "100%" }}>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500 flex items-center justify-center text-2xl shadow-lg shadow-cyan-500/20">👤</div>
              <div>
                <h3 className="text-xl font-black text-slate-800 dark:text-white">{t('banners.personalized.title')}</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm">{t('banners.personalized.subtitle').replace('{count}', userInterestsCount)}</p>
              </div>
            </div>
            <button 
              onClick={openOnboarding}
              className="px-6 py-2 bg-slate-800 dark:bg-white dark:text-slate-900 text-white rounded-xl font-bold text-sm hover:scale-105 transition-transform"
            >
              {t('banners.personalized.btn')}
            </button>
          </div>
        )}

          <motion.div 
            className={styles.subSectionGrid}
            variants={{ 
              hidden: { opacity: 0 },
              show: {
                opacity: 1,
                transition: { staggerChildren: 0.05 }
              }
            }}
            initial="hidden"
            animate="show"
          >
            {/* Regular Quiz Cards */}
            {loading && visibleCategories.length === 0
              ? Array.from({ length: 9 }).map((_, idx) => (
                  <motion.div
                    key={`sk-${idx}`}
                    className={styles.subSectionCard}
                    variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
                    layout
                  >
                    <div className={`${styles.subSectionCard} ${styles.skeletonCard}`}>
                      <div className={styles.subSectionCardImage}>
                        <div className={styles.skeletonMedia} />
                      </div>
                      <div className={styles.subSectionCardContent}>
                        <div className={styles.skeletonTitle} />
                        <div className={styles.skeletonLine} />
                        <div className={styles.skeletonLineShort} />
                        <div className={styles.skeletonFooter} />
                        <div className={styles.skeletonButton} />
                      </div>
                    </div>
                  </motion.div>
                ))
              : visibleCategories.map((cat, index) => {
                  const progress = calculateProgress(cat.id, cat.questions.length);
                  return (
                    <motion.div
                      key={cat.id}
                      className={styles.subSectionCard}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      layoutId={cat.id}
                    >
                      <Link
                        href={`/category/${cat.slug || cat.id}`}
                        className={styles.subSectionCardLink}
                        aria-label={`View ${cat.topic} quiz category with ${cat.questions.length} questions`}
                        onClick={() => {
                          sessionStorage.setItem("quizReferrer", window.location.pathname);
                        }}
                      >
                        <div className={styles.subSectionCardImage}>
                          {cat.image ? (
                            <img
                              src={cat.image}
                              alt={cat.topic}
                              className={styles.subSectionCardImg}
                              loading="lazy"
                              onError={(e) => {
                                e.currentTarget.style.display = "none";
                              }}
                            />
                          ) : (
                            <span className={styles.subSectionCardEmoji}>
                              {getRelevantImage(cat.topic, cat.emoji)}
                            </span>
                          )}
                        </div>
                        <div className={styles.subSectionCardContent}>
                          <h4 className={styles.subSectionCardTitle}>
                            {isHindi && cat.topicHi ? cat.topicHi : cat.topic}
                          </h4>
                          
                          <div className={styles.subSectionCardFooter}>
                            <span className={styles.subSectionCardCount}>
                              📝 {cat.questionCount || cat.questions?.length || 0}+ {isHindi ? 'प्रश्न' : 'Questions'}
                            </span>
                            <span className={styles.subSectionCardTime}>
                              {estimateTime(cat.questions?.length || cat.questionCount || 20)}
                            </span>
                          </div>

                          {/* Featured Question & 4 Options Preview (Auto-rotates ONLY on Mobile, Static on Desktop) */}
                          <CardQuestionPreview quiz={cat} isHindi={isHindi} />

                          <div className={styles.setCardActions}>
                            <button
                              className={styles.playQuizButton}
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                window.location.href = `/category/${cat.slug || cat.id}`;
                              }}
                              aria-label={`${t('quizzes.cards.playQuiz')} ${cat.topic}`}
                            >
                              {t('quizzes.cards.playQuiz')}
                            </button>
                            <button
                              className={`${styles.liveButtonStyle} ${styles.liveButtonOutline}`}
                              onClick={(e) => handleLivePlay(e, cat.id)}
                              title={t('quizzes.cards.playWithFriends') || "Play with friends"}
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                              {t('quizzes.cards.playLive')}
                            </button>
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  );
                })}
          </motion.div>

          {/* Load More Button */}
          {visibleCategories.length < totalCategories && (
            <div className={styles.loadMoreContainer}>
              <button 
                className={styles.loadMoreButton} 
                onClick={handleLoadMore}
                disabled={loadingMore}
              >
                {loadingMore ? (
                  <>
                    <span className={styles.loader}></span>
                    {t('common.loading') || 'Loading...'}
                  </>
                ) : (
                  t('quizzes.sections.loadMore')
                )}
              </button>
            </div>
          )}
      </div>

      {!loading && visibleCategories.length === 0 && (search || activeFilters.length > 0) && (
        <p className={styles.empty}>
          {t('quizzes.sections.noMatch')}
        </p>
      )}

      {/* Preview Modal */}
      {showPreviewModal && previewCategory && (
        <div className={styles.modalOverlay} onClick={closePreviewModal}>
          <div className={styles.previewModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>
                <span className={styles.modalEmoji}>{previewCategory.emoji || '📝'}</span>
                {isHindi && previewCategory.topicHi ? previewCategory.topicHi : previewCategory.topic}
              </h3>
              <button 
                className={styles.modalClose}
                onClick={closePreviewModal}
                aria-label="Close preview modal"
              >
                ✕
              </button>
            </div>
            
            <div className={styles.modalContent}>
              <div className={styles.modalSection}>
                <h4 className={styles.modalSectionTitle}>📊 {t('modals.preview.stats')}</h4>
                <div className={styles.statsGrid}>
                  <div className={styles.statItem}>
                    <span className={styles.statLabel}>Questions</span>
                    <span className={styles.statValue}>{previewCategory.questions?.length || 0}</span>
                  </div>
                  <div className={styles.statItem}>
                    <span className={styles.statLabel}>Est. Time</span>
                    <span className={styles.statValue}>{estimateTime(previewCategory.questions?.length || 0)}</span>
                  </div>
                  <div className={styles.statItem}>
                    <span className={styles.statLabel}>Progress</span>
                    <span className={styles.statValue}>
                      {calculateProgress(previewCategory.id, previewCategory.questions?.length || 0)}%
                    </span>
                  </div>
                </div>
              </div>
              
              <div className={styles.modalSection}>
                <h4 className={styles.modalSectionTitle}>📝 {t('modals.preview.description') || 'Description'}</h4>
                <p className={styles.modalDescription}>
                  {(isHindi && previewCategory.descriptionHi) ? previewCategory.descriptionHi : (previewCategory.description || t('modals.preview.noDesc') || 'No description available for this category.')}
                </p>
              </div>
              
              <div className={styles.modalSection}>
                <h4 className={styles.modalSectionTitle}>🎯 Difficulty</h4>
                <div className={styles.difficultyBadges}>
                  {['easy', 'medium', 'hard'].map(difficulty => {
                    const hasDifficulty = previewCategory.difficulty?.toLowerCase() === difficulty;
                    return (
                      <span
                        key={difficulty}
                        className={`${styles.difficultyBadge} ${hasDifficulty ? styles.difficultyBadgeActive : ''}`}
                      >
                        {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>
            
            <div className={styles.modalFooter}>
              <Link 
                href={`/category/${previewCategory.slug || previewCategory.id}`}
                className={styles.modalPrimaryButton}
                onClick={closePreviewModal}
              >
                Start Quiz
              </Link>
              <button 
                className={styles.modalSecondaryButton}
                onClick={closePreviewModal}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Sign In Modal */}
      {showSignInModal && (
        <div className={styles.modalOverlay} onClick={() => setShowSignInModal(false)}>
          <div className={styles.signInModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>{t('modals.signin.title')}</h3>
              <button className={styles.modalClose} onClick={() => setShowSignInModal(false)}>✕</button>
            </div>
            <div className={styles.modalContent}>
              <p className={styles.modalDescription}>
                {t('modals.signin.desc')}
              </p>
              <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-xl mb-6 text-sm text-indigo-700 dark:text-indigo-300">
                <strong>{t('modals.signin.why')}</strong>
                <ul className="list-disc ml-4 mt-2 space-y-1">
                  {(t('modals.signin.benefits') || []).map((benefit, bIdx) => (
                    <li key={bIdx}>{benefit}</li>
                  ))}
                </ul>
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button 
                className={styles.modalPrimaryButton}
                onClick={() => signIn(undefined, { callbackUrl: window.location.pathname })}
              >
                {t('modals.signin.btn')}
              </button>
              <button 
                className={styles.modalSecondaryButton}
                onClick={() => setShowSignInModal(false)}
              >
                {t('modals.signin.later')}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
