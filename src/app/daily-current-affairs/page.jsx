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

function OneLinerCard({ item, isHindi, handleShare, router }) {
  const oneLinerText = isHindi 
    ? (item.oneLinerHi || item.headingHi || item.oneLiner || item.heading) 
    : (item.oneLiner || item.heading);
  const headingText = isHindi && item.headingHi ? item.headingHi : item.heading;
  const categoryIcon = getCategoryIcon(item.category);

  return (
    <motion.div 
      className="group bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-amber-400 dark:hover:border-amber-500 rounded-3xl p-5 sm:p-6 shadow-sm hover:shadow-xl hover:shadow-amber-500/10 transition-all duration-300 relative overflow-hidden flex flex-col justify-between" 
      variants={itemVariants} 
      layout
    >
      {/* Decorative Accent Bar */}
      <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-amber-400 via-indigo-500 to-purple-600 rounded-r-full" />

      <div className="pl-3">
        {/* Top Meta Row */}
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 text-xs font-black border border-amber-200/60 dark:border-amber-900/50">
              {categoryIcon} {item.category || (isHindi ? "सामयिकी" : "General")}
            </span>
            <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 flex items-center gap-1">
              <span>📅</span> {formatDate(item.date)}
            </span>
          </div>

          <button 
            onClick={(e) => { e.stopPropagation(); handleShare(item); }} 
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-amber-100 dark:hover:bg-amber-900/40 text-slate-500 hover:text-amber-600 transition-colors" 
            title="Share Fact"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
          </button>
        </div>

        {/* Main Heading */}
        <h4 className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-snug mb-3 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
          {headingText}
        </h4>

        {/* High-Yield One-Liner Exam Highlight Box */}
        <div className="bg-amber-50/80 dark:bg-slate-800/80 border border-amber-200/80 dark:border-amber-900/40 rounded-2xl p-4 text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-semibold">
          <span className="inline-flex items-center gap-1 text-amber-700 dark:text-amber-400 font-extrabold mr-1.5 uppercase text-[11px] tracking-wider">
            <span>💡 ⚡ High-Yield Exam Fact:</span>
          </span>
          {oneLinerText}
        </div>
      </div>

      {/* Card Footer */}
      <div className="pl-3 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-400 dark:text-slate-500">
          🔥 {isHindi ? "त्वरित पुनरीक्षण कार्ड" : "Rapid Revision Note"}
        </span>
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

  // Helper function to reset canvas shadow state completely
  const resetShadow = (ctx) => {
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
  };

  // Share functionality (Redesigned World-Class Social Card Generator)
  const handleShare = async (item) => {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      canvas.width = 1080;
      canvas.height = 1080;
      
      // Ensure shadows are clear at start
      resetShadow(ctx);

      // 1. Premium Dark Indigo Glow Background
      const mainGrd = ctx.createLinearGradient(0, 0, 1080, 1080);
      mainGrd.addColorStop(0, '#0f172a');
      mainGrd.addColorStop(0.5, '#1e1b4b');
      mainGrd.addColorStop(1, '#0f172a');
      ctx.fillStyle = mainGrd;
      ctx.fillRect(0, 0, 1080, 1080);

      // Radial Glow Accents
      const glow1 = ctx.createRadialGradient(900, 150, 20, 900, 150, 450);
      glow1.addColorStop(0, 'rgba(99, 102, 241, 0.35)');
      glow1.addColorStop(1, 'rgba(99, 102, 241, 0)');
      ctx.fillStyle = glow1;
      ctx.fillRect(0, 0, 1080, 1080);

      const glow2 = ctx.createRadialGradient(150, 900, 20, 150, 900, 450);
      glow2.addColorStop(0, 'rgba(245, 158, 11, 0.25)');
      glow2.addColorStop(1, 'rgba(245, 158, 11, 0)');
      ctx.fillStyle = glow2;
      ctx.fillRect(0, 0, 1080, 1080);

      // 2. Top Header Brand Bar (Dynamic Spacing to Prevent Text Overlap)
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 34px "Outfit", sans-serif';
      ctx.fillText('🧠 QuizWeb', 70, 88);
      const logoWidth = ctx.measureText('🧠 QuizWeb').width;

      ctx.fillStyle = '#94a3b8';
      ctx.font = '600 20px "Inter", sans-serif';
      ctx.fillText(isHindi ? '• दैनिक समसामयिकी' : '• Daily Current Affairs', 70 + logoWidth + 14, 86);

      // Right Header Badge (Exam Revision Pill)
      ctx.fillStyle = 'rgba(245, 158, 11, 0.2)';
      roundRect(ctx, 770, 52, 240, 50, 25);
      ctx.fill();
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.5)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = '#fbbf24';
      ctx.font = 'bold 20px "Outfit", sans-serif';
      ctx.fillText(isHindi ? '⚡ परीक्षा सार' : '⚡ TOPIC BRIEFING', 800, 84);

      // 3. Main Intelligence Card Container
      const cardX = 70;
      const cardY = 135;
      const cardW = 940;
      const cardH = 780;

      // Card Drop Shadow (Only for the card box)
      ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
      ctx.shadowBlur = 35;
      ctx.shadowOffsetY = 15;

      // Card Background Fill
      ctx.fillStyle = '#1e293b';
      roundRect(ctx, cardX, cardY, cardW, cardH, 28);
      ctx.fill();

      // CRITICAL FIX: Reset shadow properties completely so text is NEVER duplicated!
      resetShadow(ctx);

      // Card Border Stroke
      ctx.strokeStyle = 'rgba(99, 102, 241, 0.35)';
      ctx.lineWidth = 2;
      roundRect(ctx, cardX, cardY, cardW, cardH, 28);
      ctx.stroke();

      // Top Accent Line on Card
      const accentGrd = ctx.createLinearGradient(cardX, cardY, cardX + cardW, cardY);
      accentGrd.addColorStop(0, '#6366f1');
      accentGrd.addColorStop(0.5, '#a855f7');
      accentGrd.addColorStop(1, '#ec4899');
      ctx.fillStyle = accentGrd;
      roundRect(ctx, cardX, cardY, cardW, 8, 28);
      ctx.fill();
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(cardX, cardY + 8, cardW, 10);

      // 4. Meta Row: Category Pill & Date Stamp
      const metaY = cardY + 50;
      // Category Pill
      const catText = `${getCategoryIcon(item.category)} ${(item.category || "GENERAL").toUpperCase()}`;
      ctx.font = 'bold 20px "Outfit", sans-serif';
      const catWidth = ctx.measureText(catText).width + 36;
      
      ctx.fillStyle = 'rgba(99, 102, 241, 0.2)';
      roundRect(ctx, cardX + 40, metaY, catWidth, 44, 22);
      ctx.fill();
      ctx.strokeStyle = 'rgba(129, 140, 248, 0.5)';
      ctx.lineWidth = 1;
      roundRect(ctx, cardX + 40, metaY, catWidth, 44, 22);
      ctx.stroke();

      ctx.fillStyle = '#818cf8';
      ctx.fillText(catText, cardX + 58, metaY + 29);

      // Date Stamp Pill
      const dateText = `📅 ${formatDate(item.date)}`;
      ctx.font = 'bold 20px "Outfit", sans-serif';
      const dateWidth = ctx.measureText(dateText).width + 36;

      const dateX = cardX + 56 + catWidth;
      ctx.fillStyle = 'rgba(241, 245, 249, 0.08)';
      roundRect(ctx, dateX, metaY, dateWidth, 44, 22);
      ctx.fill();
      ctx.strokeStyle = 'rgba(241, 245, 249, 0.15)';
      ctx.lineWidth = 1;
      roundRect(ctx, dateX, metaY, dateWidth, 44, 22);
      ctx.stroke();

      ctx.fillStyle = '#e2e8f0';
      ctx.fillText(dateText, dateX + 18, metaY + 29);

      // 5. Main Headline
      ctx.fillStyle = '#ffffff';
      ctx.font = '800 42px "Outfit", sans-serif';
      const headingText = isHindi && item.headingHi ? item.headingHi : item.heading;
      const headingLines = wrapText(ctx, headingText, cardW - 80);

      let textY = metaY + 95;
      headingLines.slice(0, 3).forEach(line => {
        ctx.fillText(line, cardX + 40, textY);
        textY += 54;
      });

      // 6. High-Yield Exam Takeaway Callout Box (if oneLiner exists)
      const oneLinerText = isHindi 
        ? (item.oneLinerHi || item.oneLiner) 
        : item.oneLiner;

      if (oneLinerText) {
        textY += 15;
        const boxY = textY;
        
        ctx.font = '600 24px "Inter", sans-serif';
        const oneLinerLines = wrapText(ctx, oneLinerText, cardW - 130);
        const boxH = Math.min(oneLinerLines.length * 36 + 50, 160);

        ctx.fillStyle = 'rgba(245, 158, 11, 0.12)';
        roundRect(ctx, cardX + 40, boxY, cardW - 80, boxH, 18);
        ctx.fill();

        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(cardX + 40, boxY, 8, boxH);

        ctx.fillStyle = '#fbbf24';
        ctx.font = 'bold 19px "Outfit", sans-serif';
        ctx.fillText(isHindi ? '💡 परीक्षा उपयोगी मुख्य सार:' : '💡 EXAM KEY TAKEAWAY:', cardX + 65, boxY + 34);

        ctx.fillStyle = '#fef08a';
        ctx.font = '600 23px "Inter", sans-serif';
        let lineY = boxY + 68;
        oneLinerLines.slice(0, 3).forEach(l => {
          ctx.fillText(l, cardX + 65, lineY);
          lineY += 34;
        });

        textY = boxY + boxH + 25;
      } else {
        textY += 15;
      }

      // 7. Summary Description Body
      ctx.fillStyle = '#cbd5e1';
      ctx.font = '500 26px "Inter", sans-serif';
      const descText = isHindi && item.descriptionHi ? item.descriptionHi : item.description;
      const availableH = (cardY + cardH) - textY - 20;
      const maxDescLines = Math.max(1, Math.floor(availableH / 40));
      const descLines = wrapText(ctx, descText, cardW - 80);

      descLines.slice(0, maxDescLines).forEach(line => {
        ctx.fillText(line, cardX + 40, textY);
        textY += 40;
      });

      // 8. Bottom Glassmorphic Branding Footer
      const footerY = 945;
      ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
      roundRect(ctx, 70, footerY, 940, 90, 24);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = 1;
      roundRect(ctx, 70, footerY, 940, 90, 24);
      ctx.stroke();

      // Footer Text Left
      ctx.fillStyle = '#818cf8';
      ctx.font = 'bold 24px "Outfit", sans-serif';
      ctx.fillText(isHindi ? 'प्रतिस्पर्धी परीक्षाओं के लिए विश्वसनीय जानकारी' : 'Trusted Current Affairs for UPSC, SSC & Govt Exams', 110, footerY + 52);

      // Footer Right Website Badge
      const hostText = `🌐 ${window.location.host}`;
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 24px "Outfit", sans-serif';
      const hostW = ctx.measureText(hostText).width;
      ctx.fillText(hostText, 980 - hostW, footerY + 52);

      // Convert canvas to image blob and share/download
      canvas.toBlob(async (blob) => {
        if (navigator.share && navigator.canShare({ files: [new File([blob], 'current-affair.png', { type: 'image/png' })] })) {
          await navigator.share({
            title: item.heading,
            text: `Daily Current Affairs - ${formatDate(item.date)} | QuizWeb`,
            files: [new File([blob], 'current-affair.png', { type: 'image/png' })]
          });
        } else {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `Current-Affairs-${item.date || 'QuizWeb'}.png`;
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
    const displayOneLiner = isHindi && item.oneLinerHi ? item.oneLinerHi : item.oneLiner;
    const categoryIcon = getCategoryIcon(item.category);

    return (
      <motion.div 
        variants={itemVariants}
        layout
        className="group cursor-pointer bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-indigo-500/60 dark:hover:border-indigo-500/60 rounded-3xl p-6 sm:p-7 shadow-sm hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-300 relative overflow-hidden flex flex-col justify-between"
        onClick={() => handleReadMore(item)}
      >
        {/* Top Decorative Soft Indigo Light Border Line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-indigo-200/80 dark:bg-indigo-900/60" />

        <div>
          {/* Header Row: Category Badge, Date Pill, Action Buttons */}
          <div className="flex items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3.5 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-300 text-xs font-black border border-indigo-200/60 dark:border-indigo-900/60 uppercase tracking-wider">
                {categoryIcon} {item.category || (isHindi ? "सामयिकी" : "General")}
              </span>
              
              <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold border border-slate-200/60 dark:border-slate-700 flex items-center gap-1.5">
                <span>📅</span> {formatDate(item.date)}
              </span>

              {isRead && (
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500 text-white text-[10px] font-black tracking-widest uppercase shadow-sm">
                  {isHindi ? "पढ़ा हुआ" : "READ"}
                </span>
              )}
            </div>

            {/* Bookmark & Share Badges */}
            <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
              <button 
                onClick={() => toggleFav(item.id)} 
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-rose-100 dark:hover:bg-rose-950/40 text-slate-500 hover:text-rose-500 transition-colors text-sm" 
                title="Favourite"
              >
                {isFav ? "❤️" : "🤍"}
              </button>
              <button 
                onClick={() => handleShare(item)} 
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-indigo-100 dark:hover:bg-indigo-950/40 text-slate-500 hover:text-indigo-600 transition-colors text-sm" 
                title="Share"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
              </button>
            </div>
          </div>

          {/* Big Headline */}
          <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors leading-snug mb-3">
            {displayHeading}
          </h3>

          {/* Description Summary */}
          <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed line-clamp-3 mb-4 font-medium">
            {displayDesc}
          </p>

          {/* High-Yield One-Liner Highlight Box inside Article Card */}
          {displayOneLiner && (
            <div className="bg-indigo-50/70 dark:bg-slate-800/80 border-l-4 border-indigo-500 rounded-xl p-3.5 mb-4 text-xs sm:text-sm text-indigo-950 dark:text-indigo-200 font-semibold">
              <span className="font-black text-indigo-600 dark:text-indigo-400 block mb-0.5 uppercase text-[11px] tracking-wider">
                💡 {isHindi ? "परीक्षा उपयोगी सार (Key Takeaway):" : "Exam Key Takeaway:"}
              </span>
              {displayOneLiner}
            </div>
          )}
        </div>

        {/* Footer Action Bar */}
        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
          <span className="inline-flex items-center gap-1.5 text-xs font-black text-indigo-600 dark:text-indigo-400 group-hover:translate-x-1 transition-transform">
            <span>{isHindi ? "पूरा विवरण पढ़ें" : "Read Full Intelligence"}</span>
            <span>→</span>
          </span>
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
        <div className="fixed inset-0 z-[100] flex items-start sm:items-center justify-center p-3 sm:p-6 pt-20 sm:pt-24 pb-12 bg-slate-950/80 backdrop-blur-md overflow-y-auto" onClick={() => setReading(null)}>
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", stiffness: 350, damping: 25 }}
            className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden relative my-auto mt-4 sm:my-auto" 
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Command Bar */}
            <div className="flex items-center justify-between gap-3 p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/80 dark:bg-slate-900/80">
              <div className="flex items-center gap-2">
                <button 
                  className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-indigo-50 dark:hover:bg-indigo-950/40 disabled:opacity-30 disabled:pointer-events-none transition-all flex items-center gap-1.5"
                  onClick={navigateToPrevious}
                  disabled={items.findIndex(item => item.id === reading?.id) === 0}
                >
                  <span>←</span>
                  <span>{isHindi ? "पिछला" : "Previous"}</span>
                </button>

                <span className="px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 text-xs font-black border border-indigo-100 dark:border-indigo-900">
                  {items.findIndex(item => item.id === reading?.id) + 1} / {items.length}
                </span>

                <button 
                  className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-indigo-50 dark:hover:bg-indigo-950/40 disabled:opacity-30 disabled:pointer-events-none transition-all flex items-center gap-1.5"
                  onClick={navigateToNext}
                  disabled={items.findIndex(item => item.id === reading?.id) === items.length - 1}
                >
                  <span>{isHindi ? "अगला" : "Next"}</span>
                  <span>→</span>
                </button>
              </div>

              <button 
                className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-rose-100 dark:hover:bg-rose-950/50 text-slate-500 hover:text-rose-500 flex items-center justify-center text-sm font-black transition-colors" 
                onClick={() => setReading(null)} 
                title="Close"
              >
                ✕
              </button>
            </div>

            {/* Modal Body Content */}
            <div className="p-6 sm:p-8 max-h-[72vh] overflow-y-auto custom-scrollbar space-y-5">
              
              {/* Category & Date Meta Row */}
              <div className="flex items-center justify-between gap-3 flex-wrap border-b border-slate-100 dark:border-slate-800/60 pb-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-3.5 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-300 text-xs font-black uppercase tracking-wider border border-indigo-200/50 dark:border-indigo-900/50">
                    {getCategoryIcon(reading.category)} {reading.category || (isHindi ? "सामयिकी" : "General")}
                  </span>
                  <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold border border-slate-200/60 dark:border-slate-700 flex items-center gap-1.5">
                    <span>📅</span> {formatDate(reading.date)}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => toggleFav(reading.id)} 
                    className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-rose-100 dark:hover:bg-rose-950/40 text-slate-500 hover:text-rose-500 transition-colors text-sm" 
                    title="Favourite"
                  >
                    {favIds.has(reading.id) ? "❤️" : "🤍"}
                  </button>
                  <button 
                    onClick={() => handleShare(reading)} 
                    className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-indigo-100 dark:hover:bg-indigo-950/40 text-slate-500 hover:text-indigo-600 transition-colors text-sm" 
                    title="Share Briefing Image"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
                  </button>
                </div>
              </div>

              {/* Optional Cover Image */}
              {reading.image && (
                <div className="w-full rounded-2xl overflow-hidden shadow-md max-h-72">
                  <img src={reading.image} alt={reading.heading} className="w-full h-full object-cover" />
                </div>
              )}

              {/* Current Affairs Headline */}
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white leading-tight pt-1">
                {isHindi && reading.headingHi ? reading.headingHi : reading.heading}
              </h2>

              {/* Article Content Text */}
              <div className="text-slate-700 dark:text-slate-200 text-sm sm:text-base leading-relaxed space-y-3 font-normal pt-1">
                {(isHindi && reading.descriptionHi ? reading.descriptionHi : reading.description)
                  .split('\n')
                  .map((para, pIdx) => (
                    <p key={pIdx}>{para}</p>
                  ))
                }
              </div>
            </div>

            {/* Bottom Footer Bar */}
            <div className="flex items-center justify-between p-4 px-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60">
              <button
                className="px-4 py-2 rounded-xl bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700 text-xs font-bold transition-colors"
                onClick={() => setReading(null)}
              >
                {isHindi ? "बंद करें" : "Close Reader"}
              </button>

              <button 
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black shadow-md shadow-indigo-600/20 transition-all flex items-center gap-1.5"
                onClick={() => handleShare(reading)}
              >
                <span>🔗</span>
                <span>{isHindi ? "शेयर कार्ड" : "Share Briefing"}</span>
              </button>
            </div>
          </motion.div>
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
