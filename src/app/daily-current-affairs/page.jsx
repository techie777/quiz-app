"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useMonetization } from "@/context/MonetizationContext";
import { motion, AnimatePresence } from "framer-motion";
import AdGate from "@/components/monetization/AdGate";
import { useLanguage } from "@/context/LanguageContext";
import styles from "@/styles/CurrentAffairs.module.css";
import CalendarWidget from "@/components/current-affairs/CalendarWidget";
import LanguageToggle from "@/components/LanguageToggle";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      type: "spring",
      stiffness: 260,
      damping: 20
    }
  }
};

function formatDate(d) {
  if (!d) return "";
  try {
    const [y, m, day] = String(d).split("-");
    const dt = new Date(Number(y), Number(m) - 1, Number(day));
    return dt.toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return d;
  }
}

const CATEGORY_ICONS = {
  "all": "🌐",
  "science & technology": "🧪",
  "international": "🌍",
  "national": "🇮🇳",
  "sports": "🏆",
  "economy": "📈",
  "polity": "⚖️",
  "environment": "🌿",
  "defense": "🛡️",
  "banking": "🏦",
  "important days": "📅",
  "awards": "🏅"
};

function getCategoryIcon(cat) {
  if (!cat) return "🗞️";
  return CATEGORY_ICONS[cat.toLowerCase()] || "🗞️";
}

function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}

// Helper function to get today's date in YYYY-MM-DD format (local timezone)
function getTodayDateString() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const DUMMY_ONE_LINERS = [
  {
    id: "dummy-ol-1",
    date: getTodayDateString(),
    category: "International",
    heading: "India & France Sign Strategic Bilateral Agreement for AI Infrastructure & Clean Energy",
    headingHi: "भारत और फ्रांस ने एआई बुनियादी ढांचे और स्वच्छ ऊर्जा के लिए रणनीतिक समझौते पर हस्ताक्षर किए",
    oneLiner: "India and France have partnered to launch a joint AI and clean energy innovation hub in New Delhi.",
    oneLinerHi: "भारत और फ्रांस ने नई दिल्ली में एक संयुक्त एआई और स्वच्छ ऊर्जा नवाचार केंद्र शुरू करने के लिए साझेदारी की है।",
    description: "The strategic partnership aims to accelerate renewable energy transitions and build high-performance computing clusters."
  },
  {
    id: "dummy-ol-2",
    date: getTodayDateString(),
    category: "Science & Technology",
    heading: "ISRO Successfully Launches EOS-08 Earth Observation Satellite from Sriharikota",
    headingHi: "इसरो ने श्रीहरिकोटा से EOS-08 पृथ्वी अवलोकन उपग्रह का सफल प्रक्षेपण किया",
    oneLiner: "ISRO's SSLV-D3 rocket placed the EOS-08 satellite into precise Low Earth Orbit.",
    oneLinerHi: "इसरो के SSLV-D3 रॉकेट ने EOS-08 उपग्रह को सटीक निचली पृथ्वी कक्षा में स्थापित किया।",
    description: "EOS-08 carries advanced electro-optical and thermal infrared payloads for environmental monitoring and disaster management."
  },
  {
    id: "dummy-ol-3",
    date: getTodayDateString(),
    category: "Economy",
    heading: "RBI Keeps Repo Rate Unchanged at 6.5% for Seventh Consecutive Policy Review",
    headingHi: "आरबीआई ने लगातार सातवीं मौद्रिक समीक्षा में रेपो दर 6.5% पर अपरिवर्तित रखी",
    oneLiner: "RBI's Monetary Policy Committee maintained the benchmark repo rate at 6.5% to ensure inflation stability.",
    oneLinerHi: "आरबीआई की मौद्रिक नीति समिति ने मुद्रास्फीति की स्थिरता सुनिश्चित करने के लिए रेपो दर 6.5% पर बनाए रखी।",
    description: "Governor Shaktikanta Das highlighted strong domestic GDP growth projections while monitoring food price pressures."
  },
  {
    id: "dummy-ol-4",
    date: getTodayDateString(),
    category: "Sports",
    heading: "India Secures Top Position at International Youth Science & Athletics Olympiad 2026",
    headingHi: "भारत ने अंतर्राष्ट्रीय युवा विज्ञान और एथलेटिक्स ओलंपियाड 2026 में शीर्ष स्थान हासिल किया",
    oneLiner: "Indian contingent won 12 gold medals at the International Youth Olympiad held in New Delhi.",
    oneLinerHi: "नई दिल्ली में आयोजित अंतर्राष्ट्रीय युवा ओलंपियाड में भारतीय दल ने 12 स्वर्ण पदक जीते।",
    description: "Over 45 participating nations competed in STEM research presentations and athletic tracks."
  },
  {
    id: "dummy-ol-5",
    date: getTodayDateString(),
    category: "Defense",
    heading: "DRDO Successfully Conducts Flight Test of Indigenous High-Speed Unmanned Aerial Vehicle",
    headingHi: "डीआरडीओ ने स्वदेशी हाई-स्पीड मानव रहित हवाई वाहन का उड़ान परीक्षण सफलतापूर्वक किया",
    oneLiner: "DRDO successfully flight-tested the indigenous 'Abhyas' high-speed aerial target from Odisha coast.",
    oneLinerHi: "डीआरडीओ ने ओडिशा तट से स्वदेशी 'अभ्यास' हाई-स्पीड हवाई लक्ष्य का सफल उड़ान परीक्षण किया।",
    description: "The vehicle demonstrated autonomous navigation capabilities and high-subsonic flight maneuvers."
  }
];

const DUMMY_MCQS = [
  {
    id: "dummy-mcq-1",
    text: "Which space agency recently launched the EOS-08 Earth Observation Satellite aboard the SSLV-D3 launch vehicle?",
    textHi: "हाल ही में किस अंतरिक्ष एजेंसी ने SSLV-D3 प्रक्षेपण यान के माध्यम से EOS-08 पृथ्वी अवलोकन उपग्रह का प्रक्षेपण किया?",
    options: ["NASA", "ISRO", "ESA", "JAXA"],
    optionsHi: ["नासा (NASA)", "इसरो (ISRO)", "ईएसए (ESA)", "जाक्सा (JAXA)"],
    correctAnswer: 1,
    explanation: "ISRO successfully launched the EOS-08 Earth Observation Satellite from the Satish Dhawan Space Centre, Sriharikota."
  },
  {
    id: "dummy-mcq-2",
    text: "What is the benchmark Repo Rate maintained by the Reserve Bank of India in its recent Monetary Policy decision?",
    textHi: "भारतीय रिजर्व बैंक ने अपने हालिया मौद्रिक नीति निर्णय में बेंचमार्क रेपो दर कितनी बनाए रखी है?",
    options: ["6.0%", "6.25%", "6.5%", "6.75%"],
    optionsHi: ["6.0%", "6.25%", "6.5%", "6.75%"],
    correctAnswer: 2,
    explanation: "The RBI Monetary Policy Committee voted to keep the benchmark policy repo rate unchanged at 6.5%."
  },
  {
    id: "dummy-mcq-3",
    text: "Which country partnered with India to establish a Joint AI and Clean Energy Innovation Hub in 2026?",
    textHi: "वर्ष 2026 में संयुक्त एआई और स्वच्छ ऊर्जा नवाचार केंद्र स्थापित करने के लिए किस देश ने भारत के साथ साझेदारी की?",
    options: ["Germany", "France", "Japan", "United Kingdom"],
    optionsHi: ["जर्मनी", "फ्रांस", "जापान", "यूनाइटेड किंगडम"],
    correctAnswer: 1,
    explanation: "India and France signed a bilateral agreement in New Delhi to expand cooperation in artificial intelligence and clean energy."
  },
  {
    id: "dummy-mcq-4",
    text: "What is the name of the indigenous High-Speed Unmanned Aerial Target successfully flight-tested by DRDO?",
    textHi: "डीआरडीओ द्वारा सफलतापूर्वक परीक्षण किए गए स्वदेशी हाई-स्पीड मानव रहित हवाई लक्ष्य का क्या नाम है?",
    options: ["Abhyas", "Ghatak", "Rustom-II", "Tapas"],
    optionsHi: ["अभ्यास (Abhyas)", "घातक (Ghatak)", "रुस्तम-II (Rustom-II)", "तपस (Tapas)"],
    correctAnswer: 0,
    explanation: "DRDO successfully flight-tested the indigenous High-Speed Unmanned Aerial Target 'Abhyas' off the Integrated Test Range in Chandipur, Odisha."
  },
  {
    id: "dummy-mcq-5",
    text: "How many gold medals did the Indian contingent win at the International Youth Science & Athletics Olympiad 2026?",
    textHi: "अंतर्राष्ट्रीय युवा विज्ञान और एथलेटिक्स ओलंपियाड 2026 में भारतीय दल ने कितने स्वर्ण पदक जीते?",
    options: ["8 Gold Medals", "10 Gold Medals", "12 Gold Medals", "15 Gold Medals"],
    optionsHi: ["8 स्वर्ण पदक", "10 स्वर्ण पदक", "12 स्वर्ण पदक", "15 स्वर्ण पदक"],
    correctAnswer: 2,
    explanation: "India secured top position with 12 gold medals in the international competition held in New Delhi."
  }
];

function OneLinerCard({ item, isHindi, handleShare }) {
  const oneLinerText = isHindi 
    ? (item.oneLinerHi || item.headingHi || item.oneLiner || item.heading) 
    : (item.oneLiner || item.heading);

  return (
    <motion.div className={styles.oneLinerCard} variants={itemVariants} layout>
      <div className={styles.oneLinerContentRow}>
        <div className={styles.oneLinerBullet}>💡</div>
        <div className={styles.oneLinerBodyText}>{oneLinerText}</div>
        <button 
          onClick={(e) => { e.stopPropagation(); handleShare(item); }} 
          className={styles.badgeBtn} 
          title="Share"
          style={{ flexShrink: 0 }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
        </button>
      </div>
    </motion.div>
  );
}

function MCQReadCard({ question, qIndex, isHindi, router, selectedDate }) {
  const [selectedOpt, setSelectedOpt] = useState(null);
  const [showAnswer, setShowAnswer] = useState(false);

  const questionText = isHindi && question.textHi ? question.textHi : question.text;
  const rawOptions = isHindi && Array.isArray(question.optionsHi) && question.optionsHi.length > 0
    ? question.optionsHi 
    : (Array.isArray(question.options) ? question.options : []);

  const correctIdx = typeof question.correctAnswer === 'number' ? question.correctAnswer : 0;
  const optionKeys = ["A", "B", "C", "D"];

  return (
    <motion.div className={styles.mcqCard} variants={itemVariants} layout>
      <div className={styles.mcqHeader}>
        <span className={styles.mcqNumBadge}>Q{qIndex + 1} • {isHindi ? "MCQ अभ्यास" : "MCQ Practice"}</span>
        <button 
          className={styles.playQuizBtnSmall}
          onClick={() => router.push(`/daily/daily-current-affairs?date=${selectedDate || getTodayDateString()}`)}
        >
          ▶ {isHindi ? "क्विज खेलें" : "Play Quiz"}
        </button>
      </div>
      <div className={styles.mcqQuestionText}>{questionText}</div>
      
      <div className={styles.mcqOptionsList}>
        {rawOptions.map((opt, idx) => {
          let optClass = styles.mcqOptionBtn;
          if (showAnswer || selectedOpt !== null) {
            if (idx === correctIdx) {
              optClass += ` ${styles.mcqCorrect}`;
            } else if (selectedOpt === idx && idx !== correctIdx) {
              optClass += ` ${styles.mcqIncorrect}`;
            }
          }

          return (
            <button
              key={idx}
              className={optClass}
              onClick={() => {
                setSelectedOpt(idx);
                setShowAnswer(true);
              }}
            >
              <span className={styles.mcqOptionKey}>{optionKeys[idx] || idx + 1}</span>
              <span>{opt}</span>
            </button>
          );
        })}
      </div>

      <div className={styles.viewAnswerBar}>
        <button
          className={styles.viewAnswerBtn}
          onClick={() => setShowAnswer(!showAnswer)}
        >
          {showAnswer ? "🙈 " + (isHindi ? "उत्तर छुपाएं" : "Hide Answer") : "👁️ " + (isHindi ? "उत्तर देखें" : "View Answer")}
        </button>
        <span className="text-xs text-slate-400 font-medium">
          {showAnswer ? (isHindi ? "सही उत्तर हरा है" : "Correct answer in green") : (isHindi ? "उत्तर देखने के लिए ऑप्शन दबाएं" : "Click option or button to reveal")}
        </span>
      </div>

      {showAnswer && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className={styles.answerExplanationBox}>
          <strong>💡 {isHindi ? "सही उत्तर:" : "Correct Answer:"}</strong> Choice {optionKeys[correctIdx]} - {rawOptions[correctIdx]}
          {question.explanation && <div className="mt-1 text-xs text-emerald-800">{question.explanation}</div>}
        </motion.div>
      )}
    </motion.div>
  );
}

export default function DailyCurrentAffairsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [months, setMonths] = useState([]);
  const [postedDates, setPostedDates] = useState([]);
  const [calMonth, setCalMonth] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [favIds, setFavIds] = useState(new Set());
  const { t, isHindi } = useLanguage();
  const { isPro, useCounts, incrementCount } = useMonetization();
  const [readItems, setReadItems] = useState(new Set()); 
  const [showAdGate, setShowAdGate] = useState(false);
  const [pendingItem, setPendingItem] = useState(null);
  const [reading, setReading] = useState(null);
  const [loginPrompt, setLoginPrompt] = useState(false);
  const maxFreeReads = 2; 

  const [activeTab, setActiveTab] = useState("ca"); // "ca" | "oneliner" | "mcq"
  const [mcqQuestions, setMcqQuestions] = useState([]);
  const [mcqLoading, setMcqLoading] = useState(false);

  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedDate, setSelectedDate] = useState(""); // Initialize empty for hydration safety
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [hasMounted, setHasMounted] = useState(false);
  const [showPdfPreview, setShowPdfPreview] = useState(false);

  // Group items by date uniquely
  const groupedItems = useMemo(() => {
    const groups = {};
    // Double-layered uniqueness check: ID + (Heading + Date)
    const seenIds = new Set();
    const seenBriefings = new Set();
    
    items.forEach(item => {
      const briefingKey = `${item.date}-${item.heading}`;
      if (seenIds.has(item.id) || seenBriefings.has(briefingKey)) return;
      
      seenIds.add(item.id);
      seenBriefings.add(briefingKey);
      
      if (!groups[item.date]) groups[item.date] = [];
      groups[item.date].push(item);
    });
    return groups;
  }, [items]);

  const sortedDates = useMemo(() => {
    return Object.keys(groupedItems).sort((a, b) => b.localeCompare(a));
  }, [groupedItems]);

  // Helper to fetch calendar posted dates for a month
  const fetchMonthPostedDates = async (mStr) => {
    try {
      const res = await fetch(`/api/current-affairs?calMonth=${mStr}&pageSize=1`, { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data.postedDates)) {
        setPostedDates(data.postedDates);
      }
    } catch (err) {
      console.error("Fetch month posted dates error:", err);
    }
  };

  // Load items
  const loadItems = async (pageNum, reset = false) => {
    if (pageNum > 1 && !hasMore) return;
    
    setLoading(true);
    const params = new URLSearchParams();
    params.set("page", String(pageNum));
    params.set("pageSize", String(pageSize));
    if (selectedCategory && selectedCategory !== "all") params.set("category", selectedCategory);
    if (searchQuery.trim()) params.set("q", searchQuery.trim());
    if (calMonth) params.set("calMonth", calMonth);
    
    const activeDate = selectedDate || getTodayDateString();

    if (selectedDate && !searchQuery.trim()) {
      params.set("date", selectedDate);
      if (pageNum === 1) params.set("fallback", "true");
    } else if (selectedMonth && !searchQuery.trim()) {
      params.set("month", selectedMonth);
    }

    try {
      const res = await fetch(`/api/current-affairs?${params.toString()}`, { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      
      const newItems = Array.isArray(data.items) ? data.items : [];
      
      if (reset) {
        setItems(newItems);
      } else {
        setItems(prev => {
          const existingIds = new Set(prev.map(i => i.id));
          const filteredNew = newItems.filter(i => !existingIds.has(i.id));
          return [...prev, ...filteredNew];
        });
      }

      setHasMore(newItems.length === pageSize);
      setTotal(Number(data.total || 0));
      setCategories(Array.isArray(data.categories) ? data.categories : []);
      setMonths(Array.isArray(data.months) ? data.months : []);
      if (Array.isArray(data.postedDates)) {
        setPostedDates(data.postedDates);
      }
      if (data.calMonth && !calMonth) {
        setCalMonth(data.calMonth);
      }

      if (data.date && data.date !== selectedDate && pageNum === 1 && selectedDate && !searchQuery.trim()) {
        setSelectedDate(data.date);
      }
    } catch (err) {
      console.error("Load Items Error:", err);
    } finally {
      setLoading(false);
      setIsInitialLoad(false);
    }
  };

  // Set initial state on client to avoid hydration mismatch
  useEffect(() => {
    setHasMounted(true);
    if (!selectedDate) {
      const t = getTodayDateString();
      setSelectedDate(t);
      setCalMonth(t.slice(0, 7));
    }
  }, []);

  // Update calMonth when selectedDate or selectedMonth changes
  useEffect(() => {
    if (selectedDate) {
      setCalMonth(selectedDate.slice(0, 7));
    } else if (selectedMonth) {
      setCalMonth(selectedMonth);
    }
  }, [selectedDate, selectedMonth]);

  // Fetch MCQs when activeTab === "mcq" or selectedDate changes
  useEffect(() => {
    if (activeTab !== "mcq" || !hasMounted) return;
    const fetchDate = selectedDate || getTodayDateString();
    let cancelled = false;

    async function fetchMCQs() {
      setMcqLoading(true);
      try {
        const res = await fetch(`/api/daily-quizzes?type=daily-current-affairs&date=${encodeURIComponent(fetchDate)}`, { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled && Array.isArray(data.questions)) {
          setMcqQuestions(data.questions);
        }
      } catch (err) {
        console.error("Fetch MCQs Error:", err);
      } finally {
        if (!cancelled) setMcqLoading(false);
      }
    }

    fetchMCQs();
    return () => {
      cancelled = true;
    };
  }, [activeTab, selectedDate, hasMounted]);

  // Initial load or filter change
  useEffect(() => {
    if (!hasMounted || selectedDate === "") return;
    setPage(1);
    loadItems(1, true);
  }, [selectedCategory, selectedDate, selectedMonth, searchQuery, hasMounted]);

  // Infinite Scroll Trigger
  useEffect(() => {
    if (loading || !hasMore || (page === 1 && isInitialLoad)) return;

    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && !loading) {
          setPage(prev => {
            const nextPage = prev + 1;
            loadItems(nextPage);
            return nextPage;
          });
        }
      },
      { 
        threshold: 0.1,
        rootMargin: '400px' 
      }
    );

    const target = document.getElementById('load-more-trigger');
    if (target) observer.observe(target);

    return () => {
      if (target) observer.unobserve(target);
    };
  }, [loading, hasMore, isInitialLoad, page]);

  const exportHref = useMemo(() => {
    const params = new URLSearchParams();
    if (selectedCategory && selectedCategory !== "all") params.set("category", selectedCategory);
    if (selectedDate) params.set("date", selectedDate);
    if (!selectedDate && selectedMonth) params.set("month", selectedMonth);
    return `/current-affairs/export?${params.toString()}`;
  }, [selectedCategory, selectedDate, selectedMonth]);

  useEffect(() => {
    const isUser = session?.user && !session.user.isAdmin;
    if (status !== "authenticated" || !isUser) {
      setFavIds(new Set());
      return;
    }
    let cancelled = false;
    async function loadFavs() {
      try {
        const res = await fetch("/api/current-affairs/favourites?ids=1", { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled) return;
        setFavIds(new Set(Array.isArray(data.ids) ? data.ids : []));
      } catch {}
    }
    loadFavs();
    return () => {
      cancelled = true;
    };
  }, [session, status]);

  const handleReadMore = (item) => {
    // Pro users or already read items can be accessed unconditionally
    if (isPro || readItems.has(item.id)) {
      setReading(item);
      return;
    }
    
    // Check if free reads are available (Limit 2)
    if (useCounts.ca < maxFreeReads) {
      setReading(item);
      setReadItems(prev => new Set([...prev, item.id]));
      incrementCount("ca");
      return;
    }
    
    // If limit reached, show Ad Gate
    setPendingItem(item);
    setShowAdGate(true);
  };

  // Navigation functions for modal
  const navigateToPrevious = () => {
    const currentIndex = items.findIndex(item => item.id === reading?.id);
    if (currentIndex > 0) {
      const previousItem = items[currentIndex - 1];
      
      // Check if user can read this item
      if (!canReadItem(previousItem)) {
        setLoginPrompt(true);
        return;
      }
      
      setReading(previousItem);
      // Only mark as read and increment counter if it's a new item
      if (!readItems.has(previousItem.id)) {
        setReadItems(prev => new Set([...prev, previousItem.id]));
        incrementCount("ca");
      }
    }
  };

  const navigateToNext = () => {
    const currentIndex = items.findIndex(item => item.id === reading?.id);
    if (currentIndex < items.length - 1) {
      const nextItem = items[currentIndex + 1];
      
      // Check if user can read this item
      if (!canReadItem(nextItem)) {
        setLoginPrompt(true);
        return;
      }
      
      setReading(nextItem);
      // Only mark as read and increment counter if it's a new item
      if (!readItems.has(nextItem.id)) {
        setReadItems(prev => new Set([...prev, nextItem.id]));
        incrementCount("ca");
      }
    }
  };

  // Helper function to check if user can read an item
  const canReadItem = (item) => {
    if (isPro) return true;
    if (readItems.has(item.id)) return true;
    return useCounts.ca < maxFreeReads;
  };

  // Share functionality
  const handleShare = async (item) => {
    try {
      // Create a canvas to generate the share image
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      // Set canvas size
      canvas.width = 1080;
      canvas.height = 1080;
      
      // Create premium gradient background (like the card)
      const grd = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      grd.addColorStop(0, '#f0f9ff'); // soft light blue
      grd.addColorStop(1, '#e0f2fe'); // deeper light blue
      ctx.fillStyle = grd;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Top banner with Hindi/English title
      ctx.fillStyle = '#3b82f6';
      ctx.fillRect(0, 0, canvas.width, 160);
      ctx.fillStyle = '#1e40af';
      ctx.fillRect(canvas.width - 200, 50, 160, 60);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 36px "Outfit", sans-serif';
      ctx.fillText(isHindi ? "दैनिक" : "Daily", canvas.width - 170, 80);
      ctx.fillText(isHindi ? "जानकारी" : "Briefing", canvas.width - 170, 100);

      // Draw Main White Card Content Box
      ctx.shadowColor = 'rgba(15, 23, 42, 0.08)';
      ctx.shadowBlur = 40;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 20;
      
      ctx.fillStyle = '#ffffff';
      roundRect(ctx, 80, 220, canvas.width - 160, canvas.height - 380, 30);
      ctx.fill();
      
      // Top blue border on the card
      const accentGrd = ctx.createLinearGradient(80, 220, canvas.width - 80, 220);
      accentGrd.addColorStop(0, '#38bdf8');
      accentGrd.addColorStop(1, '#3b82f6');
      ctx.fillStyle = accentGrd;
      roundRect(ctx, 80, 220, canvas.width - 160, 16, 30);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(80, 236, canvas.width - 160, 20); // Cover bottom curve of the top border

      // Reset shadow for text
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;

      // Draw Date Pill
      ctx.fillStyle = '#e0f2fe'; // var(--bg-secondary)
      roundRect(ctx, 140, 280, 240, 50, 12);
      ctx.fill();
      ctx.fillStyle = '#1e293b';
      ctx.font = 'bold 24px "Outfit", sans-serif';
      ctx.fillText(`📅 ${formatDate(item.date)}`, 160, 314);
      
      // Draw Category Pill (next to Date)
      ctx.fillStyle = '#e0f2fe';
      roundRect(ctx, 400, 280, 300, 50, 12);
      ctx.fill();
      ctx.fillStyle = '#0284c7';
      ctx.font = 'bold 22px "Outfit", sans-serif';
      ctx.fillText(`${getCategoryIcon(item.category)} ${item.category.toUpperCase()}`, 420, 314);

      // Draw Quote mark
      ctx.fillStyle = 'rgba(56, 189, 248, 0.15)';
      ctx.font = 'bold 160px "Georgia", serif';
      ctx.fillText('“', 140, 420);

      // Draw Heading
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 44px "Outfit", sans-serif';
      const headingText = isHindi && item.headingHi ? item.headingHi : item.heading;
      const headingLines = wrapText(ctx, headingText, canvas.width - 280);
      let yPos = 460;
      headingLines.slice(0, 3).forEach(line => {
        ctx.fillText(line, 140, yPos);
        yPos += 60;
      });

      // Draw Description
      ctx.fillStyle = '#475569';
      ctx.font = '28px "Inter", sans-serif';
      const descText = isHindi && item.descriptionHi ? item.descriptionHi : item.description;
      const descLines = wrapText(ctx, descText.substring(0, 300) + '...', canvas.width - 280);
      yPos += 30;
      descLines.slice(0, 5).forEach(line => {
        ctx.fillText(line, 140, yPos);
        yPos += 45;
      });

      // Bottom info section (Footer)
      ctx.fillStyle = '#ffffff';
      roundRect(ctx, 80, canvas.height - 140, canvas.width - 160, 100, 20);
      ctx.fill();
      
      // Website info text
      ctx.fillStyle = '#3b82f6';
      ctx.font = 'bold 28px "Outfit", sans-serif';
      ctx.fillText(isHindi ? 'क्विज़वेब पर अधिक दैनिक समसामयिकी पढ़ें' : 'Read more Daily Current Affairs on QuizWeb', 120, canvas.height - 90);
      
      ctx.fillStyle = '#64748b';
      ctx.font = '20px "Inter", sans-serif';
      ctx.fillText(isHindi ? 'नवीनतम राष्ट्रीय और अंतर्राष्ट्रीय विकास के साथ अपडेट रहें।' : 'Stay updated with the latest national and international developments.', 120, canvas.height - 60);
      
      // Website URL link
      ctx.fillStyle = '#1e40af';
      ctx.font = 'bold 24px "Outfit", sans-serif';
      ctx.fillText(`🌐 ${window.location.host}`, canvas.width - 340, canvas.height - 75);
      
      // Convert to blob and share
      canvas.toBlob(async (blob) => {
        if (navigator.share && navigator.canShare({ files: [new File([blob], 'current-affair.png', { type: 'image/png' })] })) {
          await navigator.share({
            title: item.heading,
            text: `Daily Current Affairs - ${formatDate(item.date)} | QuizWeb`,
            files: [new File([blob], 'current-affair.png', { type: 'image/png' })]
          });
        } else {
          // Fallback: download the image
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'current-affair.png';
          a.click();
          URL.revokeObjectURL(url);
        }
      });
    } catch (error) {
      console.error('Share failed:', error);
      alert('Sharing is not available on this device');
    }
  };

  // Helper function to draw rounded rectangles
  const roundRect = (ctx, x, y, width, height, radius) => {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  };

  // Helper function to wrap text
  const wrapText = (ctx, text, maxWidth) => {
    const words = text.split(' ');
    const lines = [];
    let currentLine = words[0];

    for (let i = 1; i < words.length; i++) {
      const word = words[i];
      const width = ctx.measureText(currentLine + " " + word).width;
      if (width < maxWidth) {
        currentLine += " " + word;
      } else {
        lines.push(currentLine);
        currentLine = word;
      }
    }
    lines.push(currentLine);
    return lines;
  };

  const toggleFav = async (id) => {
    const isUser = session?.user && !session.user.isAdmin;
    if (status !== "authenticated" || !isUser) {
      setLoginPrompt(true);
      return;
    }
    const res = await fetch("/api/current-affairs/favourites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentAffairId: id }),
    });
    if (!res.ok) return;
    const data = await res.json().catch(() => ({}));
    const favourited = !!data?.favourited;
    setFavIds((prev) => {
      const next = new Set(prev);
      if (favourited) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const chipStyle = (label) => {
    const s = String(label || "");
    let h = 0;
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 360;
    return {
      background: `linear-gradient(135deg, hsla(${h}, 85%, 55%, 0.18), hsla(${(h + 40) % 360}, 85%, 55%, 0.10))`,
      borderColor: `hsla(${h}, 85%, 55%, 0.35)`,
      color: `hsl(${h}, 65%, 40%)`,
    };
  };

  const WallCurrentAffairCard = ({ item, isRead, isFav, toggleFav, handleReadMore, handleShare, isPro, caCount, maxFree, isHindi }) => {
    const displayHeading = isHindi && item.headingHi ? item.headingHi : item.heading;
    const displayDesc = isHindi && item.descriptionHi ? item.descriptionHi : item.description;

    return (
      <motion.div 
        variants={itemVariants}
        className={styles.wallCard}
        layout
      >
        <div className={styles.wallCardContent} style={item.image ? { backgroundImage: `linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.4) 100%), url('${item.image}')` } : {}} onClick={() => handleReadMore(item)}>
           <div className={styles.actionBadge}>
             <button onClick={(e) => { e.stopPropagation(); toggleFav(item.id); }} className={styles.badgeBtn} title="Favourite">{isFav ? "❤️" : "🤍"}</button>
             <button onClick={(e) => { e.stopPropagation(); handleShare(item); }} className={styles.badgeBtn} title="Share" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
               <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-secondary)' }}><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
             </button>
           </div>
           
           <div className={styles.quoteWrapper}>
             <span className={styles.quoteMark}>“</span>
             <h3 className={styles.bigCardText}>{displayHeading}</h3>
             <div className={styles.cardDatePill}>
               <span className={styles.calendarIcon}>📅</span> {formatDate(item.date)}
             </div>
           </div>
           
           <p className={styles.cardSummary}>{displayDesc}</p>

           {item.oneLiner && (
             <div style={{ padding: '8px 12px', background: 'var(--accent-light)', borderLeft: '3px solid var(--accent)', borderRadius: '4px', fontSize: '0.85rem', marginBottom: '1rem', color: 'var(--accent-dark)', fontWeight: '500' }}>
               <strong>💡 One-Liner:</strong> {item.oneLiner}
             </div>
           )}
           
           <div className={styles.cardFooter}>
             <span className={styles.cardCategory}>{getCategoryIcon(item.category)} {item.category}</span>
             <div className="flex gap-2 items-center">
                {isRead && <span className="text-[10px] bg-emerald-500/80 text-white px-2 py-0.5 rounded-full font-bold">READ</span>}
                <button 
                  className={styles.playQuizBtnSmall}
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    router.push(`/daily/daily-current-affairs?date=${item.date}`);
                  }}
                >
                  ▶ Play Quiz
                </button>
             </div>
           </div>
        </div>
      </motion.div>
    );
  };

  if (!hasMounted) {
    return (
      <main className={styles.page}>
        <div className={styles.header}>
           <h1 className={styles.title}>{hasMounted ? t('ca.title') : 'Intelligence Briefing'}</h1>
           <div className={styles.skeletonTitle} style={{ width: '200px', height: '20px' }}></div>
        </div>
        <div className={styles.skeletonList}>
           <div className={styles.skeletonCard} style={{ height: '400px' }}></div>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      {/* Premium Glassmorphic Command Ribbon (Date & Search Bar) */}
      <div className={styles.dateRibbonWrapper}>
        <div className={styles.dateRibbon}>
        <div className={styles.ribbonDateGroup}>
          <button 
             className={styles.ribbonBtn} 
             onClick={() => setSelectedDate(prev => adjustDate(prev || getTodayDateString(), -1))}
             title="Previous Day"
             aria-label="Previous Day"
          >
            ‹
          </button>
          
          <div className={styles.ribbonCenter} title="Click to change date">
             <span style={{ fontSize: '1.05rem', color: '#6366f1' }}>📅</span>
             <span className={styles.selectedDateText}>
                {formatDate(selectedDate || getTodayDateString())}
             </span>
             <input 
                type="date" 
                value={selectedDate} 
                max={getTodayDateString()}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  setSearchQuery("");
                }}
                className={styles.dateInputOverlay}
             />
          </div>

          <button 
             className={styles.ribbonBtn} 
             onClick={() => setSelectedDate(prev => adjustDate(prev || getTodayDateString(), 1))}
             disabled={(selectedDate || getTodayDateString()) >= getTodayDateString()}
             title="Next Day"
             aria-label="Next Day"
          >
            ›
          </button>

          <button 
             className={styles.todayBtn}
             onClick={() => {
               setSelectedDate(getTodayDateString());
               setSearchQuery("");
             }}
          >
            <span>✨</span>
            <span>{t('ca.today')}</span>
          </button>
        </div>

        <div className={styles.searchWrapper}>
          <span style={{ color: '#6366f1', fontSize: '0.9rem' }}>🔍</span>
          <input 
            type="text" 
            placeholder={isHindi ? "करंट अफेयर्स खोजें..." : "Search Current Affairs..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery("")} 
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.85rem', color: '#94a3b8', padding: '0 4px' }}
            >
              ✕
            </button>
          )}
        </div>

        <a className={styles.exportBtnSmall} href={exportHref} target="_blank" rel="noreferrer" title="Export Intelligence PDF">
           <span>📥</span>
           <span>{isHindi ? "PDF एक्सपोर्ट" : "Export PDF"}</span>
        </a>
        </div>
      </div>

      <div className={styles.layout}>
        <aside className={styles.sidebar}>
          <div className={styles.sidebarHeaderRow}>
            <div className={styles.sidebarTitle}>
              <span>🗂️</span>
              <span>{t('ca.sidebarTitle')}</span>
            </div>
            <div className={styles.sidebarLangWrapper}>
              <LanguageToggle />
            </div>
          </div>
          <div className={styles.categoryScrollList}>
            <button
              className={`${styles.sideItem} ${selectedCategory === "all" ? styles.sideActive : ""}`}
              onClick={() => setSelectedCategory("all")}
            >
              <span className={styles.sideIcon}>🌐</span>
              <span className={styles.sideText}>{t('ca.all')}</span>
            </button>
            {categories.map((c) => (
              <button
                key={c}
                className={`${styles.sideItem} ${selectedCategory === c ? styles.sideActive : ""}`}
                onClick={() => setSelectedCategory(c)}
              >
                <span className={styles.sideIcon}>{getCategoryIcon(c)}</span>
                <span className={styles.sideText}>{c}</span>
              </button>
            ))}
          </div>
        </aside>

        <section className={styles.content}>
          {/* Sticky 3-Tab Segmented Control Bar */}
          <div className={styles.modeSegmentWrapper}>
            <div className={styles.modeSegmentBar}>
            <button 
              className={`${styles.modeTabBtn} ${activeTab === "ca" ? styles.modeTabActive : ""}`}
              onClick={() => setActiveTab("ca")}
            >
              <span>📰</span>
              <span>{isHindi ? "करंट अफेयर्स" : "Current Affairs"}</span>
            </button>

            <button 
              className={`${styles.modeTabBtn} ${activeTab === "oneliner" ? styles.modeTabActive : ""}`}
              onClick={() => setActiveTab("oneliner")}
            >
              <span>💡</span>
              <span>{isHindi ? "वन-लाइनर" : "One Liner"}</span>
            </button>

            <button 
              className={`${styles.modeTabBtn} ${activeTab === "mcq" ? styles.modeTabActive : ""}`}
              onClick={() => setActiveTab("mcq")}
            >
              <span>📝</span>
              <span>{isHindi ? "MCQ अभ्यास" : "MCQ Practice"}</span>
            </button>
            </div>
          </div>

          {activeTab === "mcq" ? (
            mcqLoading ? (
              <div className={styles.skeletonList}>
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className={styles.skeletonCard} style={{ height: '260px', borderRadius: '1.25rem' }} />
                ))}
              </div>
            ) : (
              <div className={styles.mcqGrid}>
                <AnimatePresence mode="popLayout">
                  {(mcqQuestions.length > 0 ? mcqQuestions : DUMMY_MCQS).map((q, idx) => (
                    <MCQReadCard 
                      key={q.id || idx} 
                      question={q} 
                      qIndex={idx} 
                      isHindi={isHindi} 
                      router={router} 
                      selectedDate={selectedDate}
                    />
                  ))}
                </AnimatePresence>
                
                <div className="flex justify-center my-4">
                  <button 
                    className={styles.playQuizBtn}
                    style={{ maxWidth: '320px' }}
                    onClick={() => router.push(`/daily/daily-current-affairs?date=${selectedDate || getTodayDateString()}`)}
                  >
                    ▶ {isHindi ? "फुल टाइम्ड क्विज खेलें" : "Play Full Timed Quiz"}
                  </button>
                </div>
              </div>
            )
          ) : loading ? (
            <div className={styles.skeletonList}>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className={styles.skeletonCard} style={{ height: '320px', borderRadius: '1.5rem' }}>
                  <div className={styles.skeletonBody}>
                    <div className={styles.skeletonTitle} />
                    <div className={styles.skeletonMeta} />
                  </div>
                </div>
              ))}
            </div>
          ) : (items.length === 0 && activeTab !== 'oneliner') ? (
            <div className={styles.empty}>{t('ca.noResults')}</div>
          ) : (
            <div className={styles.feedContainer}>
              {activeTab === 'oneliner' && items.length === 0 ? (
                <div className={styles.oneLinerGrid}>
                  {DUMMY_ONE_LINERS.map((it) => (
                    <OneLinerCard 
                      key={it.id} 
                      item={it} 
                      isHindi={isHindi} 
                      handleShare={handleShare} 
                      router={router} 
                    />
                  ))}
                </div>
              ) : (
                <AnimatePresence mode="popLayout">
                  {sortedDates.map(date => (
                    <motion.div 
                      key={date} 
                      className={styles.dateGroup}
                      initial="hidden"
                      animate="visible"
                      variants={containerVariants}
                      layout
                    >
                      <motion.div className={activeTab === 'oneliner' ? styles.oneLinerGrid : styles.wallGrid} layout>
                        {groupedItems[date].map((it) => (
                          activeTab === 'oneliner' ? (
                            <OneLinerCard 
                              key={it.id} 
                              item={it} 
                              isHindi={isHindi} 
                              handleShare={handleShare} 
                              router={router} 
                            />
                          ) : (
                            <WallCurrentAffairCard 
                              key={it.id} 
                              item={it}
                              isRead={readItems.has(it.id)}
                              isFav={favIds.has(it.id)}
                              toggleFav={toggleFav}
                              handleReadMore={handleReadMore}
                              handleShare={handleShare}
                              isPro={isPro}
                              caCount={useCounts.ca}
                              maxFree={maxFreeReads}
                              isHindi={isHindi}
                            />
                          )
                        ))}
                      </motion.div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
              
              <div id="load-more-trigger" className={styles.loadMoreTrigger}>
                {loading && !isInitialLoad && (
                  <div className={styles.miniLoader}>
                    <div className={styles.briefingSpinner}></div>
                    <span>{t('ca.loading')}</span>
                  </div>
                )}
                {!hasMore && items.length > 0 && (
                  <div className={styles.endOfFeed}>
                    <span>{t('ca.end')}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </section>

        {/* Right Sidebar with Interactive Calendar & Archives */}
        <aside className={styles.rightSidebar}>
          {/* Calendar Widget Section */}
          <div style={{ marginBottom: '1.25rem' }}>
            <div className={styles.sidebarTitle}>{isHindi ? "कैलेंडर स्टेटस" : "Calendar Status"}</div>
            <CalendarWidget 
              selectedDate={selectedDate}
              onSelectDate={(dStr) => {
                setSelectedMonth("");
                setSelectedDate(dStr);
                setSearchQuery("");
              }}
              postedDates={postedDates}
              activeMonthStr={calMonth}
              onMonthChange={(mStr) => {
                setCalMonth(mStr);
                fetchMonthPostedDates(mStr);
              }}
              isHindi={isHindi}
            />
          </div>

          <div className={styles.sidebarTitle}>{isHindi ? "पुराने अपडेट्स (Archives)" : "Archives"}</div>
          
          <button
            className={`${styles.sideItem} ${!selectedMonth && selectedDate === getTodayDateString() ? styles.sideActive : ""}`}
            onClick={() => {
              setSelectedMonth("");
              setSelectedDate(getTodayDateString());
              setSearchQuery("");
            }}
          >
            <span className={styles.sideIcon}>📅</span>
            <span className={styles.sideText}>{isHindi ? "आज के अपडेट्स" : "Today's Updates"}</span>
          </button>

          <div style={{ marginTop: '1.5rem', marginBottom: '0.75rem' }} className={styles.sidebarTitle}>
            {isHindi ? "महीने के अनुसार" : "Month-Wise"}
          </div>

          {months.length > 0 ? months.map((m) => {
            const [y, mo] = m.split("-");
            const dateObj = new Date(Number(y), Number(mo) - 1, 1);
            const label = dateObj.toLocaleDateString(isHindi ? 'hi-IN' : 'en-US', { month: 'long', year: 'numeric' });
            
            return (
              <button
                key={m}
                className={`${styles.sideItem} ${selectedMonth === m ? styles.sideActive : ""}`}
                onClick={() => {
                  setSelectedDate("");
                  setSelectedMonth(m);
                }}
              >
                <span className={styles.sideIcon}>📁</span>
                <span className={styles.sideText}>{label}</span>
              </button>
            );
          }) : (
            <div className={styles.empty} style={{ fontSize: '0.85rem', padding: '1rem', textAlign: 'center' }}>
              {isHindi ? "कोई पुराना डेटा नहीं" : "No archives found"}
            </div>
          )}

          {/* Monthly Archive Section / PDF Generation */}
          <div className={styles.monthlyArchive}>
            <div className={styles.monthlyArchiveTitle}>
              <span>📊</span>
              <span>{isHindi ? "मंथली इनसाइट्स" : "Monthly Insights"}</span>
            </div>
            
            <div className={styles.progressIndicator}>
              <div className={styles.progressLabel}>
                <span>{isHindi ? "डेटा संग्रहण" : "Data Accumulation"}</span>
                <span>{Math.round((items.length / 100) * 100)}%</span>
              </div>
              <div className={styles.progressBar}>
                <div 
                  className={styles.progressFill} 
                  style={{ width: `${Math.min((items.length / 100) * 100, 100)}%` }}
                ></div>
              </div>
            </div>
            
            <button 
              className={styles.generatePdfBtn}
              onClick={() => setShowPdfPreview(true)}
            >
              <span>📄</span>
              <span>{isHindi ? "PDF रिपोर्ट जनरेट करें" : "Generate PDF Report"}</span>
            </button>
          </div>
        </aside>
      </div>

      {reading && (
        <div className={styles.modalOverlay} onClick={() => setReading(null)}>
          <div className={`${styles.modal} glass-card`} onClick={(e) => e.stopPropagation()}>
            {/* Mobile Navigation - Top */}
            <div className={styles.mobileModalNavigation}>
              <button 
                className={styles.navButton}
                onClick={navigateToPrevious}
                disabled={items.findIndex(item => item.id === reading?.id) === 0}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 12H5M12 19l-7-7 7-7"/>
                </svg>
                {t('ca.prev')}
              </button>
              
              <div className={styles.navInfo}>
                <span>{items.findIndex(item => item.id === reading?.id) + 1} / {items.length}</span>
              </div>
              
              <div style={{ display: 'flex', gap: '8px' }}>
                <button 
                  className={styles.navButton}
                  onClick={navigateToNext}
                  disabled={items.findIndex(item => item.id === reading?.id) === items.length - 1}
                >
                  {t('ca.next')}
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </button>
                <button className={styles.navCloseBtn} onClick={() => setReading(null)} title="Close">
                  ✕
                </button>
              </div>
            </div>

            {/* Desktop Absolute Close Button */}
            <button className={`${styles.absoluteCloseBtn} ${styles.desktopOnly}`} onClick={() => setReading(null)} title="Close">
              ✕
            </button>

            {/* Top Row: Compact Date */}
            <div className={styles.modalHeaderCompact}>
              <div className={styles.compactDate}>
                <span className={styles.compactDateIcon}>📅</span>
                {formatDate(reading.date)}
              </div>
            </div>



            {/* Content Area */}
            <div className={styles.modalContent}>
              <div className={styles.modalImageContainer}>
                {reading.image ? (
                  <img src={reading.image} alt={reading.heading} className={styles.modalImage} />
                ) : (
                  <div className={styles.modalImageFallback}>
                    <span>🗞️</span>
                  </div>
                )}
              </div>
              
              <div className={styles.modalTextContainer}>
                <h2 className={styles.modalTitle}>{reading.heading}</h2>
                <div className={styles.modalDesc}>
                  {reading.description.split('\n').map((paragraph, index) => (
                    <p key={index}>{paragraph}</p>
                  ))}
                </div>
              </div>
            </div>

            {/* Desktop Navigation - Bottom */}
            <div className={styles.modalNavigation}>
              <button 
                className={styles.navButton}
                onClick={navigateToPrevious}
                disabled={items.findIndex(item => item.id === reading?.id) === 0}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 12H5M12 19l-7-7 7-7"/>
                </svg>
                Previous
              </button>
              
              <div className={styles.navInfo}>
                <span>{items.findIndex(item => item.id === reading?.id) + 1} / {items.length}</span>
              </div>
              
              <button 
                className={styles.navButton}
                onClick={navigateToNext}
                disabled={items.findIndex(item => item.id === reading?.id) === items.length - 1}
              >
                Next
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {loginPrompt && (
        <div className={styles.loginPromptOverlay} onClick={() => setLoginPrompt(false)}>
          <div className={`${styles.loginPrompt} glass-card`} onClick={(e) => e.stopPropagation()}>
            <p className={styles.loginPromptText}>
                Sign in to save favourites and get unlimited access to current affairs.
            </p>
            <div className={styles.loginPromptBtns}>
              <button className="btn-primary" onClick={() => router.push("/signin")}>
                Sign In
              </button>
              <button className="btn-secondary" onClick={() => setLoginPrompt(false)}>
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PDF Preview Mockup */}
      {showPdfPreview && (
        <div className={styles.pdfPreviewWrapper}>
          <div className={styles.pdfPreview}>
            <button 
              className={styles.pdfPreviewClose}
              onClick={() => setShowPdfPreview(false)}
            >
              ✕
            </button>
            
            <div className={styles.pdfPreviewHeader}>
              <div className={styles.pdfPreviewIcon}>📄</div>
              <div className={styles.pdfPreviewTitle}>Monthly Report Preview</div>
            </div>
            
            <div className={styles.pdfPreviewContent}>
              <div className={styles.pdfPreviewSection}>
                <div className={styles.pdfPreviewSectionTitle}>Daily News</div>
                <div className={styles.pdfPreviewSectionText}>
                  Curated headlines and summaries from {formatDate(selectedDate || getTodayDateString())}
                </div>
              </div>
              
              <div className={styles.pdfPreviewSection}>
                <div className={styles.pdfPreviewSectionTitle}>Quick One-Liners</div>
                <div className={styles.pdfPreviewSectionText}>
                  Bite-sized facts for rapid revision and memorization
                </div>
              </div>
              
              <div className={styles.pdfPreviewSection}>
                <div className={styles.pdfPreviewSectionTitle}>MCQ Practice</div>
                <div className={styles.pdfPreviewSectionText}>
                  Interactive quiz questions to test your knowledge
                </div>
              </div>
            </div>
            
            <a 
              href={exportHref} 
              target="_blank" 
              rel="noreferrer"
              className={styles.generatePdfBtn}
              style={{ marginTop: '1rem' }}
            >
              <span>⬇️</span>
              <span>Download Full PDF</span>
            </a>
          </div>
        </div>
      )}

      <AdGate 
        isOpen={showAdGate}
        onClose={() => {
            setShowAdGate(false);
            setPendingItem(null);
        }}
        onComplete={() => {
            setShowAdGate(false);
            if (pendingItem) {
                setReading(pendingItem);
                setReadItems(prev => new Set([...prev, pendingItem.id]));
                incrementCount("ca"); // Increment but let them read after ad
                setPendingItem(null);
            }
        }}
        title={hasMounted ? t('ca.title') : "Intelligence Briefing"}
      />
    </main>
  );
}
