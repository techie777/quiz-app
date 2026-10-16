"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import { useData } from "@/context/DataContext";
import {
  Sparkles,
  Search,
  Swords,
  BookOpen,
  Zap,
  Flame,
  Volume2,
  VolumeX,
  Play,
  Share2,
  Copy,
  Check,
  X,
  ChevronRight,
  Compass,
  Trophy,
  Filter,
  CheckCircle2,
  Globe,
  Award,
  Layers,
  GraduationCap,
  Target,
  RefreshCw,
  Clock,
  Lightbulb,
  ExternalLink,
} from "lucide-react";
import SubjectIndexTree from "@/components/govt-exam/SubjectIndexTree";
import DigitalBookReader from "@/components/govt-exam/DigitalBookReader";
import {
  getCategoryCardImageUrl,
  getCategoryGradientHue,
  getCategoryGroup,
} from "@/lib/categoryCardImages";
import toast from "react-hot-toast";

// ================= Audio Synthesizer (Web Audio API) =================
const playTone = (type = "pop", soundEnabled = true) => {
  if (!soundEnabled || typeof window === "undefined") return;
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    const now = ctx.currentTime;

    if (type === "pop") {
      osc.type = "triangle";
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(740, now + 0.08);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
      osc.start(now);
      osc.stop(now + 0.09);
    } else if (type === "success") {
      osc.type = "sine";
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.setValueAtTime(554.37, now + 0.08);
      osc.frequency.setValueAtTime(659.25, now + 0.16);
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
      osc.start(now);
      osc.stop(now + 0.32);
    } else if (type === "click") {
      osc.type = "sine";
      osc.frequency.setValueAtTime(500, now);
      osc.frequency.exponentialRampToValueAtTime(800, now + 0.04);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.04);
      osc.start(now);
      osc.stop(now + 0.05);
    }
  } catch (e) {
    // Audio restrictions before user gesture ignored
  }
};

// ================= Hot Visual Quizzes Data =================
const HOT_TRIVIA = [
  {
    id: "t1",
    title: "Guess Personality",
    titleHi: "पहचानो कौन?",
    type: "IMAGE",
    icon: "👤",
    count: "20 Qs",
    bg: "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800",
    slug: "famous-people",
  },
  {
    id: "t2",
    title: "Flags of the World",
    titleHi: "विश्व के ध्वज",
    type: "FLAG",
    icon: "🚩",
    count: "20 Qs",
    bg: "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800",
    slug: "world-gk",
  },
  {
    id: "t3",
    title: "Brand Logo Quiz",
    titleHi: "ब्रांड लोगो पहचान",
    type: "LOGO",
    icon: "🏷️",
    count: "20 Qs",
    bg: "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800",
    slug: "brands-companies",
  },
  {
    id: "t4",
    title: "Indian States Map",
    titleHi: "भारत राज्य व नदियां",
    type: "MAP",
    icon: "🗺️",
    count: "20 Qs",
    bg: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
    slug: "indian-states-uts",
  },
  {
    id: "t5",
    title: "Capitals & Monuments",
    titleHi: "स्मारक व धरोहर",
    type: "IMAGE",
    icon: "🏛️",
    count: "20 Qs",
    bg: "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800",
    slug: "heritage-monuments",
  },
  {
    id: "t6",
    title: "Animals & Birds",
    titleHi: "पशु व पक्षी संसार",
    type: "NATURE",
    icon: "🦜",
    count: "20 Qs",
    bg: "bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800",
    slug: "nature-animals",
  },
];

// ================= Digital FlexBooks Shelf Data =================
const FLEX_BOOKS = [
  {
    id: "fb-india",
    title: "India General Knowledge",
    hindiTitle: "सम्पूर्ण भारत सामान्य ज्ञान",
    slug: "india-gk",
    chapters: 18,
    status: "Live Available",
    coverBg: "from-indigo-900 via-indigo-950 to-slate-900",
    accentColor: "indigo",
    topics: [
      "सिंधु घाटी से स्वतंत्रता तक",
      "भारत की नदियां व जलवायु",
      "संविधान के महत्वपूर्ण अनुच्छेद",
      "राष्ट्रीय प्रतीक व पुरस्कार",
    ],
    description:
      "Structured chapter notes with self-assessment quizzes for UPSC, SSC & State PSC.",
  },
  {
    id: "fb-world",
    title: "World General Knowledge",
    hindiTitle: "विश्व सामान्य ज्ञान व भूगोल",
    slug: "world-gk",
    chapters: 14,
    status: "Live Available",
    coverBg: "from-blue-900 via-slate-900 to-cyan-950",
    accentColor: "blue",
    topics: [
      "सौरमंडल व पृथ्वी की संरचना",
      "विश्व के प्रमुख जलडमरूमध्य",
      "संयुक्त राष्ट्र व वैश्विक संगठन",
      "अंतर्राष्ट्रीय सीमाएं",
    ],
    description:
      "Universe, Solar System, Continents, Ocean Currents & Global Governance.",
  },
  {
    id: "fb-history",
    title: "Indian History & Heritage",
    hindiTitle: "भारतीय इतिहास एवं संस्कृति",
    slug: "india-history",
    chapters: 16,
    status: "Live Available",
    coverBg: "from-amber-950 via-slate-900 to-stone-900",
    accentColor: "amber",
    topics: [
      "वैदिक काल व बौद्ध धर्म",
      "मौर्य व गुप्त साम्राज्य",
      "मुगल काल व मराठा साम्राज्य",
      "1857 की क्रांति व स्वतंत्रता",
    ],
    description:
      "Ancient, Medieval and Modern Indian history with chronological timelines and PYQs.",
  },
  {
    id: "fb-science",
    title: "General Science & Discovery",
    hindiTitle: "सामान्य विज्ञान एवं प्रौद्योगिकी",
    slug: "science--discovery",
    chapters: 20,
    status: "Live Available",
    coverBg: "from-purple-950 via-indigo-950 to-slate-900",
    accentColor: "purple",
    topics: [
      "दैनिक जीवन में भौतिकी",
      "आवर्त सारणी व रासायनिक यौगिक",
      "मानव शरीर क्रिया विज्ञान",
      "अंतरिक्ष व रक्षा प्रौद्योगिकी",
    ],
    description:
      "Physics, Chemistry, Biology and Space Tech fundamentals for competitive exams.",
  },
];

// Helper to structure quizzes into hierarchical sections for Read Mode (SubjectIndexTree)
function categorizeQuizzes(quizzes, sections) {
  const sectionMap = new Map();
  const matchedQuizIds = new Set();

  (sections || []).forEach((section) => {
    const nameKey = (section.name || "").trim();
    if (!nameKey) return;

    if (!sectionMap.has(nameKey)) {
      sectionMap.set(nameKey, {
        id: section.id,
        name: section.name,
        nameHi: section.nameHi,
        subSections: [],
      });
    }

    const sectionData = sectionMap.get(nameKey);

    (section.subSections || []).forEach((subSection) => {
      const quizIds = subSection.quizIds || [];
      const subSectionQuizzes = quizzes.filter((quiz) =>
        quizIds.includes(quiz.id)
      );

      if (subSectionQuizzes.length > 0) {
        subSectionQuizzes.forEach((q) => matchedQuizIds.add(q.id));

        const subTitleKey = (subSection.name || "").trim();
        const existingSub = sectionData.subSections.find(
          (s) => (s.title || "").trim() === subTitleKey
        );

        if (existingSub) {
          const existingIds = new Set(existingSub.quizzes.map((q) => q.id));
          subSectionQuizzes.forEach((q) => {
            if (!existingIds.has(q.id)) existingSub.quizzes.push(q);
          });
        } else {
          sectionData.subSections.push({
            title: subSection.name,
            titleHi: subSection.nameHi,
            quizzes: [...subSectionQuizzes],
            order: subSection.order || 0,
          });
        }
      }
    });
  });

  const categorized = Array.from(sectionMap.values()).filter(
    (s) => s.subSections.length > 0
  );
  categorized.forEach((s) => s.subSections.sort((a, b) => a.order - b.order));

  // Collect quizzes not yet assigned
  const uncategorized = quizzes.filter((quiz) => !matchedQuizIds.has(quiz.id));
  if (uncategorized.length > 0) {
    const imageQuizzes = uncategorized.filter((q) =>
      q.categoryClass?.includes("image-quiz")
    );
    const govtQuizzes = uncategorized.filter((q) =>
      q.categoryClass?.includes("govt-exam")
    );
    const others = uncategorized.filter(
      (q) =>
        !q.categoryClass?.includes("image-quiz") &&
        !q.categoryClass?.includes("govt-exam")
    );

    if (imageQuizzes.length > 0) {
      categorized.push({
        id: "uncategorized_image",
        name: "Image Quizzes",
        nameHi: "चित्र क्विज़",
        subSections: [
          {
            title: "Image Categories",
            titleHi: "चित्र श्रेणियां",
            quizzes: imageQuizzes,
            order: 998,
          },
        ],
      });
    }

    if (govtQuizzes.length > 0) {
      categorized.push({
        id: "uncategorized_govt",
        name: "Govt Exam Preparation",
        nameHi: "सरकारी परीक्षा की तैयारी",
        subSections: [
          {
            title: "Govt Exams",
            titleHi: "सरकारी परीक्षा",
            quizzes: govtQuizzes,
            order: 999,
          },
        ],
      });
    }

    if (others.length > 0) {
      categorized.push({
        id: "uncategorized_others",
        name: "General Knowledge (GK)",
        nameHi: "सामान्य ज्ञान (GK)",
        subSections: [
          {
            title: "General Knowledge Topics",
            titleHi: "सामान्य ज्ञान विषय",
            quizzes: others,
            order: 1000,
          },
        ],
      });
    }
  }

  return categorized;
}

// Keywords of unwanted exam topics, math modules, and sub-chapters that should not appear on the GK Hub
const UNWANTED_CATEGORY_KEYWORDS = [
  "reasoning",
  "algebra",
  "mensuration",
  "geometry",
  "arithmetic",
  "quantitative",
  "aptitude",
  "data-interpretation",
  "mahabharat",
  "physics-gk",
  "chemistry-gk",
  "logical",
  "verbal",
  "non-verbal",
  "number-systems",
];

const UNWANTED_EXACT_SLUGS = new Set([
  "logical-analytical-reasoning",
  "non-verbal-reasoning",
  "verbal-reasoning",
  "mensuration-geometry",
  "number-systems-basic-algebra",
  "mahabharat-gk",
  "madhya-pradesh-gk",
  "physics-gk",
  "modern-indian-history",
]);

const CANONICAL_PRIORITY_ORDER = [
  "india-gk",
  "world-gk",
  "india-history",
  "history",
  "india-geography",
  "general-science",
  "science--discovery",
  "science",
  "current-affairs",
  "indian-polity",
  "india-polity",
  "india-sports",
  "sports",
  "technology",
  "art-culture",
  "indian-culture",
  "human-body",
  "famous-people",
  "heritage-monuments",
  "space-universe",
  "space-astronomy",
  "indian-states-uts",
  "indian-cities",
  "animals-nature",
  "nature-animals",
  "money-business",
  "business-economy",
  "politics-government",
  "general-knowledge",
  "brands-companies",
  "lifestyle-everyday-knowledge",
  "awards-achievements",
  "defence-military",
  "inventions-discoveries",
  "kids-family-quiz",
  "fun-viral-quiz",
  "gaming",
  "language-grammar",
  "literature",
  "mathematics",
  "music",
  "plants-agriculture",
  "theatre-performing-arts",
  "transport",
  "travel-tourism",
  "food",
  "brain-riddles",
  "amazing-facts",
];

function isCleanMainGKCategory(cat) {
  if (!cat) return false;
  if (cat.hidden) return false;
  // If it has a parentId, it is a sub-topic/sub-chapter, not a primary main category
  if (cat.parentId) return false;
  if (cat.categoryClass === "govt-exam" || cat.categoryClass?.includes("exam-")) return false;

  const slug = (cat.slug || cat.topic || "").toLowerCase().trim();
  const title = (cat.name || cat.topic || "").toLowerCase().trim();

  if (UNWANTED_EXACT_SLUGS.has(slug)) return false;

  for (const kw of UNWANTED_CATEGORY_KEYWORDS) {
    if (slug.includes(kw) || title.includes(kw)) {
      return false;
    }
  }
  return true;
}

function getCategoryPriority(slug) {
  const idx = CANONICAL_PRIORITY_ORDER.indexOf(slug);
  return idx !== -1 ? idx : 999;
}

export default function SamanyaGyanClient({ initialCategories = [] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isHindi } = useLanguage();
  const { quizzes, loaded: dataLoaded } = useData();

  const modeQuery = searchParams?.get("mode");
  const catQuery =
    searchParams?.get("cat") ||
    searchParams?.get("chapter") ||
    searchParams?.get("topic");

  // Navigation & Mode
  const [examMode, setExamMode] = useState(modeQuery === "read" ? "read" : "quiz");
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Read Mode State
  const [selectedReadChapter, setSelectedReadChapter] = useState(null);
  const [selectedReadSubject, setSelectedReadSubject] = useState(null);
  const [sections, setSections] = useState([]);

  // Modals
  const [isBattleModalOpen, setIsBattleModalOpen] = useState(false);
  const [battleSubTab, setBattleSubTab] = useState("create");
  const [generatedPin, setGeneratedPin] = useState("482910");
  const [joinPin, setJoinPin] = useState("");
  const [copiedPin, setCopiedPin] = useState(false);
  const [selectedBook, setSelectedBook] = useState(null);
  const [isCustomEngineOpen, setIsCustomEngineOpen] = useState(false);
  const [activeQuizLaunch, setActiveQuizLaunch] = useState(null);

  // Custom Test Engine State
  const [customQuestionCount, setCustomQuestionCount] = useState(25);
  const [customSelectedSubjects, setCustomSelectedSubjects] = useState([
    "india-gk",
    "science--discovery",
    "world-gk",
  ]);

  // Image error state map
  const [imgErrors, setImgErrors] = useState({});

  const triggerAudio = (type = "pop") => {
    playTone(type, soundEnabled);
  };

  // Fetch sections for Read Mode SubjectIndexTree
  useEffect(() => {
    let isMounted = true;
    fetch("/api/sections", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (isMounted && Array.isArray(data)) {
          setSections(data);
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, []);


  // Merge categories from Context and Server-side props with strict GK filtering
  const allCategories = useMemo(() => {
    const rawList =
      Array.isArray(quizzes) && quizzes.length > 0
        ? quizzes
        : Array.isArray(initialCategories)
        ? initialCategories
        : [];

    const clean = rawList.filter(isCleanMainGKCategory);

    // Sort by canonical priority first, then questionCount descending
    return clean.sort((a, b) => {
      const slugA = (a.slug || a.topic || "").toLowerCase().trim();
      const slugB = (b.slug || b.topic || "").toLowerCase().trim();
      const priorityA = getCategoryPriority(slugA);
      const priorityB = getCategoryPriority(slugB);
      if (priorityA !== priorityB) return priorityA - priorityB;
      const countA = a.questionCount || a._count?.questions || 0;
      const countB = b.questionCount || b._count?.questions || 0;
      return countB - countA;
    });
  }, [quizzes, initialCategories]);

  // Handle URL chapter deep-link for Read Mode
  useEffect(() => {
    if (catQuery && allCategories.length > 0) {
      const qLower = catQuery.toLowerCase().trim();
      const matched = allCategories.find(
        (c) =>
          (c.slug && c.slug.toLowerCase() === qLower) ||
          (c.id && c.id.toLowerCase() === qLower) ||
          (c.topic && c.topic.toLowerCase() === qLower)
      );
      if (matched) {
        setSelectedReadChapter(matched);
        setExamMode("read");
      }
    }
  }, [catQuery, allCategories]);

  // Build categorized sections for Read Mode
  const categorizedQuizzes = useMemo(() => {
    const list = categorizeQuizzes(allCategories, sections);
    const othersIndex = list.findIndex(
      (s) =>
        s.name &&
        (s.name.toLowerCase() === "others" ||
          s.name.toLowerCase().includes("others") ||
          s.name.includes("अन्य"))
    );
    if (othersIndex > -1) {
      const [othersSection] = list.splice(othersIndex, 1);
      list.push(othersSection);
    }
    return list;
  }, [allCategories, sections]);

  // Build flat chapter list for book reader pagination
  const allChaptersList = useMemo(() => {
    const list = [];
    categorizedQuizzes.forEach((sec) => {
      (sec.subSections || []).forEach((sub) => {
        if (sub.quizzes && sub.quizzes.length > 0) {
          sub.quizzes.forEach((q) => {
            if ((q.questionCount ?? q.questions?.length ?? 0) > 0) {
              list.push(q);
            }
          });
        } else if ((sub.questionCount ?? sub.questions?.length ?? 0) > 0) {
          list.push(sub);
        }
      });
    });
    return list;
  }, [categorizedQuizzes]);

  // Filtered Categories based on Active Chip & Search Query
  const filteredCategories = useMemo(() => {
    return allCategories.filter((cat) => {
      const slug = (cat.slug || cat.topic || "").toLowerCase().trim();
      const group = getCategoryGroup(slug);

      let matchesCat = true;
      if (activeCategory === "popular") {
        matchesCat =
          cat.isTrending ||
          [
            "india-gk",
            "world-gk",
            "current-affairs",
            "general-knowledge",
            "india-history",
            "science--discovery",
            "science",
          ].includes(slug) ||
          (cat.questionCount || 0) > 100;
      } else if (activeCategory === "india") {
        matchesCat = slug.includes("india") || group === "india";
      } else if (activeCategory === "world") {
        matchesCat = slug.includes("world") || group === "world";
      } else if (activeCategory === "science") {
        matchesCat =
          slug.includes("science") ||
          slug.includes("tech") ||
          slug.includes("bio") ||
          slug.includes("space");
      } else if (activeCategory === "history") {
        matchesCat =
          slug.includes("history") ||
          slug.includes("culture") ||
          slug.includes("heritage");
      } else if (activeCategory === "trivia") {
        matchesCat =
          slug.includes("trivia") ||
          slug.includes("fun") ||
          slug.includes("riddle") ||
          slug.includes("brain") ||
          slug.includes("sports");
      }

      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (cat.topic && cat.topic.toLowerCase().includes(q)) ||
        (cat.name && cat.name.toLowerCase().includes(q)) ||
        (cat.topicHi && cat.topicHi.toLowerCase().includes(q)) ||
        (cat.nameHi && cat.nameHi.toLowerCase().includes(q)) ||
        (cat.description && cat.description.toLowerCase().includes(q)) ||
        (cat.descriptionHi && cat.descriptionHi.toLowerCase().includes(q)) ||
        slug.includes(q);

      return matchesCat && matchesSearch;
    });
  }, [allCategories, activeCategory, searchQuery]);

  // Battle Handlers
  const handleCreateBattle = () => {
    triggerAudio("success");
    const randomPin = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedPin(randomPin);
    setCopiedPin(false);
    setBattleSubTab("create");
    setIsBattleModalOpen(true);
  };

  const handleCopyCode = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(generatedPin);
      setCopiedPin(true);
      triggerAudio("pop");
      toast.success(isHindi ? "रूम कोड कॉपी हो गया!" : "Room PIN copied!");
      setTimeout(() => setCopiedPin(false), 2000);
    }
  };

  const handleLaunchQuiz = (category) => {
    triggerAudio("click");
    setActiveQuizLaunch(category);
  };

  const handleStartDirectPractice = (category) => {
    triggerAudio("success");
    const slug =
      category.slug ||
      (category.topic ? category.topic.toLowerCase().replace(/[^a-z0-9]+/g, "-") : category.id);
    router.push(`/category/${slug}`);
  };

  const toggleSubjectMix = (subSlug) => {
    triggerAudio("pop");
    setCustomSelectedSubjects((prev) =>
      prev.includes(subSlug) ? prev.filter((s) => s !== subSlug) : [...prev, subSlug]
    );
  };

  return (
    <div className="w-full min-h-screen bg-slate-50/70 dark:bg-slate-950 text-slate-800 dark:text-slate-100 antialiased font-sans select-none pb-32">
      {/* ================= 1. TOP HERO BANNER & DUAL MODE SWITCHER ================= */}
      <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6">
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-7 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-50/60 dark:bg-indigo-950/30 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

          {/* Header Row */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-1.5 bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800 px-3 py-0.5 rounded-full text-xs font-black uppercase tracking-wide">
                <Compass className="w-3.5 h-3.5" />
                <span>
                  {isHindi
                    ? "सामान्य ज्ञान हब • General Knowledge Hub"
                    : "General Knowledge Hub"}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                {isHindi ? "सामान्य ज्ञान व वस्तुनिष्ठ क्विज़" : "General Knowledge & Quizzes"}
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium max-w-2xl">
                {isHindi
                  ? "भारत, विश्व, इतिहास, भूगोल, विज्ञान व 40+ विषयों का सम्पूर्ण अभ्यास instant scoring व रैंकिंग के साथ।"
                  : "Explore India & World GK, History, Geography, Science, and 40+ curated topics with instant scoring & leaderboards."}
              </p>
            </div>

            {/* Metrics Tags & Controls */}
            <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
              {/* Audio Toggle */}
              <button
                onClick={() => {
                  const next = !soundEnabled;
                  setSoundEnabled(next);
                  if (next) playTone("pop", true);
                }}
                className={`w-9 h-9 rounded-xl flex items-center justify-center border transition-all active:scale-95 ${
                  soundEnabled
                    ? "bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 shadow-2xs"
                    : "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400"
                }`}
                title={soundEnabled ? "Mute Sounds" : "Enable Audio"}
                aria-label="Toggle Sound"
              >
                {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>

              {/* Streak Badge */}
              <div className="flex items-center gap-1.5 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 px-3 py-1.5 rounded-xl text-xs font-black text-amber-900 dark:text-amber-200 shadow-2xs">
                <Flame className="w-4 h-4 text-amber-500 fill-amber-500 animate-pulse" />
                <span className="font-mono">5d Streak</span>
              </div>

              {/* Categories & Questions Metrics */}
              <span className="bg-indigo-50 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-200 border border-indigo-200/80 dark:border-indigo-800 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs">
                <Sparkles className="w-4 h-4 text-indigo-500" />
                <span>40+ {isHindi ? "श्रेणियां" : "Categories"}</span>
              </span>
              <span className="bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200 border border-emerald-200/80 dark:border-emerald-800 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs font-mono">
                <BookOpen className="w-4 h-4 text-emerald-600" />
                <span>10,000+ {isHindi ? "प्रश्न" : "Questions"}</span>
              </span>
            </div>
          </div>

          {/* Interactive Dual Mode Switcher Bar */}
          <div className="p-1.5 bg-slate-100 dark:bg-slate-800 rounded-2xl flex max-w-md mx-auto sm:mx-0 border border-slate-200/80 dark:border-slate-700">
            <button
              onClick={() => {
                triggerAudio("pop");
                setExamMode("quiz");
                setSelectedReadChapter(null);
              }}
              className={`flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-black flex items-center justify-center gap-2 transition-all ${
                examMode === "quiz"
                  ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-600/30"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Zap className="w-4 h-4 text-amber-300" />
              <span>{isHindi ? "🎯 क्विज़ मोड (अभ्यास)" : "🎯 Quiz Practice Mode"}</span>
            </button>

            <button
              onClick={() => {
                triggerAudio("pop");
                setExamMode("read");
              }}
              className={`flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-black flex items-center justify-center gap-2 transition-all ${
                examMode === "read"
                  ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-600/30"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <BookOpen className="w-4 h-4 text-indigo-300" />
              <span>{isHindi ? "📖 रीड मोड (डिजिटल बुक्स)" : "📖 Read Mode (Digital FlexBooks)"}</span>
            </button>
          </div>
        </div>
      </section>

      {/* ================= 2. MAIN HUB CONTENT CONTAINER ================= */}
      <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-5 space-y-6">
        {/* ================= QUIZ MODE VIEW ================= */}
        {examMode === "quiz" && (
          <>
            {/* 3-in-1 Quick Action Deck (1v1 Live Battle + Daily Quiz + GK Engine) */}
            <section className="grid grid-cols-1 lg:grid-cols-3 gap-3.5">
              {/* Card 1: 1v1 Battle Arena */}
              <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white rounded-3xl p-4 sm:p-5 border border-indigo-500/20 shadow-md flex flex-col justify-between relative overflow-hidden group">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-600/30 border border-indigo-400/30 flex items-center justify-center text-amber-300 text-xl shadow-inner">
                      ⚔️
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                        Live Play
                      </span>
                      <h3 className="text-sm sm:text-base font-black text-white">1v1 Live Battle</h3>
                    </div>
                  </div>
                  <span className="text-[10px] bg-white/10 px-2.5 py-1 rounded-full text-slate-300 border border-white/10 font-mono">
                    1.4k Online
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed mb-4">
                  {isHindi
                    ? "दोस्त के साथ रियल-टाइम क्विज़ मुकाबला — रूम कोड या लिंक से लाइव खेलें!"
                    : "Real-time multiplayer duel with friends — challenge with room code or link!"}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={handleCreateBattle}
                    className="py-2.5 px-3 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white text-xs font-black rounded-xl shadow-md active:scale-95 transition flex items-center justify-center gap-1"
                  >
                    <span>⚔️ Play Live</span>
                  </button>
                  <button
                    onClick={() => {
                      triggerAudio("pop");
                      setBattleSubTab("join");
                      setIsBattleModalOpen(true);
                    }}
                    className="py-2.5 px-3 bg-white/10 hover:bg-white/15 text-white text-xs font-bold rounded-xl border border-white/20 active:scale-95 transition flex items-center justify-center gap-1"
                  >
                    <span>🚀 Join Code</span>
                  </button>
                </div>
              </div>

              {/* Card 2: Daily Quiz Challenge */}
              <div className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-700 text-white rounded-3xl p-4 sm:p-5 shadow-md flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="bg-white/20 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full backdrop-blur-xs flex items-center gap-1">
                      <Flame className="w-3 h-3 text-amber-300 fill-amber-300" /> DAILY QUEST
                    </span>
                    <span className="text-xs font-bold text-amber-300">+50 XP</span>
                  </div>
                  <h3 className="text-base sm:text-lg font-black text-white">
                    {isHindi ? "दैनिक समसामयिकी व GK" : "Daily GK Challenge"}
                  </h3>
                  <p className="text-xs text-indigo-100 mt-1">
                    {isHindi
                      ? "आज के 10 ताज़ा चुने हुए प्रश्न • 3 मिनट टाइमर"
                      : "10 fresh questions curated today • 3 minutes timer"}
                  </p>
                </div>
                <Link
                  href="/daily-quiz"
                  onClick={() => triggerAudio("success")}
                  className="mt-4 w-full py-2.5 bg-white hover:bg-slate-50 text-indigo-900 font-black text-xs rounded-xl shadow-md active:scale-95 transition flex items-center justify-center gap-1.5 no-underline"
                >
                  <Play className="w-3.5 h-3.5 fill-indigo-900" />
                  <span>{isHindi ? "आज का क्विज़ खेलें" : "Play Today's Quiz"}</span>
                </Link>
              </div>

              {/* Card 3: GK Test Engine Customizer */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-5 border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col justify-between hover:border-indigo-300 dark:hover:border-indigo-600 transition-all">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-[10px] font-black px-2.5 py-0.5 rounded-full">
                      MOCK GENERATOR
                    </span>
                    <span className="text-[10px] bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold px-2 py-0.5 rounded-full">
                      NEW
                    </span>
                  </div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    {isHindi ? "GK टेस्ट इंजन" : "GK Test Engine"}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {isHindi
                      ? "40+ विषयों को मिलाकर अपना कस्टमाइज्ड मॉक टेस्ट सिर्फ 2 टैप में बनाएं।"
                      : "Build your custom timed mock test across 40+ subjects in just 2 taps."}
                  </p>
                </div>
                <button
                  onClick={() => {
                    triggerAudio("pop");
                    setIsCustomEngineOpen(true);
                  }}
                  className="mt-4 w-full py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 hover:text-indigo-700 text-slate-800 dark:text-slate-200 font-black text-xs rounded-xl border border-slate-200 dark:border-slate-700 transition active:scale-95 flex items-center justify-center gap-1.5"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                  <span>{isHindi ? "कस्टम टेस्ट बनाएं →" : "Build Custom Test →"}</span>
                </button>
              </div>
            </section>

            {/* ================= SEARCH & CATEGORY CHIPS ================= */}
            <div className="space-y-3 pt-2">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                {/* Search Bar */}
                <div className="relative flex-1 max-w-xl">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={
                      isHindi
                        ? "40+ क्विज़ श्रेणियां खोजें (जैसे भारत GK, भूगोल, विज्ञान)..."
                        : "Search 40+ quiz categories (e.g. India GK, Geography, Science)..."
                    }
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl pl-10 pr-9 py-2.5 text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 shadow-2xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Counter Tag */}
                <div className="flex items-center justify-between sm:justify-end gap-2 text-xs font-bold text-slate-500 dark:text-slate-400">
                  <span>
                    {isHindi
                      ? `${filteredCategories.length} श्रेणियां उपलब्ध`
                      : `Showing ${filteredCategories.length} Categories`}
                  </span>
                </div>
              </div>

              {/* Category Pills Carousel */}
              <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none no-scrollbar">
                {[
                  { id: "all", label: isHindi ? "सभी क्विज़" : "All Quizzes", icon: "🌐" },
                  { id: "popular", label: isHindi ? "लोकप्रिय" : "Popular", icon: "⭐" },
                  { id: "india", label: isHindi ? "भारत GK" : "India GK", icon: "🇮🇳" },
                  { id: "world", label: isHindi ? "विश्व GK" : "World GK", icon: "🌍" },
                  { id: "science", label: isHindi ? "विज्ञान" : "Science", icon: "🔬" },
                  { id: "history", label: isHindi ? "इतिहास" : "History", icon: "📜" },
                  { id: "trivia", label: isHindi ? "पहेलियां व रोचक" : "Brain Teasers", icon: "🧩" },
                ].map((cat) => {
                  const isActive = activeCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => {
                        triggerAudio("pop");
                        setActiveCategory(cat.id);
                      }}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all flex items-center gap-1.5 active:scale-95 ${
                        isActive
                          ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs"
                          : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800"
                      }`}
                    >
                      <span>{cat.icon}</span>
                      <span>{cat.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ================= HOT TRIVIA / VISUAL QUIZZES CAROUSEL ================= */}
            <section className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <h2 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                  <span>🔥 {isHindi ? "हॉट विजुअल क्विज़" : "Hot Visual Quizzes"}</span>
                  <span className="text-[11px] font-normal text-slate-400">
                    ({isHindi ? "चित्र पहेली व ट्रिविया" : "Picture Trivia"})
                  </span>
                </h2>
                <Link
                  href="/fun-quizzes"
                  className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline no-underline"
                >
                  {isHindi ? "सभी देखें →" : "View All Trivia →"}
                </Link>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
                {HOT_TRIVIA.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => {
                      triggerAudio("success");
                      router.push(`/category/${item.slug}`);
                    }}
                    className={`rounded-2xl p-3 border transition-all cursor-pointer flex flex-col justify-between hover:scale-[1.02] active:scale-95 ${item.bg}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-white/80 dark:bg-black/40 border border-current">
                        {item.type}
                      </span>
                      <span className="text-xl">{item.icon}</span>
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-slate-900 dark:text-white line-clamp-1">
                        {isHindi && item.titleHi ? item.titleHi : item.title}
                      </h4>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                        {item.count}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* ================= MAIN 4-COLUMN RESPONSIVE QUIZ GRID ================= */}
            <section className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <h2 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <span>🎯 {isHindi ? "मुख्य प्रश्न बैंक व श्रेणियां" : "Main Question Banks"}</span>
                  <span className="text-[11px] bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold px-2 py-0.5 rounded-full">
                    ● {filteredCategories.length} Live Now
                  </span>
                </h2>
              </div>

              {filteredCategories.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-10 text-center border border-dashed border-slate-300 dark:border-slate-800">
                  <span className="text-3xl block mb-2">🔍</span>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {isHindi ? "कोई क्विज़ नहीं मिला" : "No quizzes match your search"}
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-1">
                    {isHindi
                      ? "कृपया दूसरा शब्द खोजें या श्रेणी फ़िल्टर रीसेट करें।"
                      : "Try another keyword or reset the category filter."}
                  </p>
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      setActiveCategory("all");
                    }}
                    className="mt-3 text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-3.5 py-1.5 rounded-xl border border-indigo-200 dark:border-indigo-800"
                  >
                    {isHindi ? "सभी फ़िल्टर रीसेट करें" : "Reset All Filters"}
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
                  {filteredCategories.map((card) => {
                    const slug =
                      card.slug ||
                      (card.topic ? card.topic.toLowerCase().replace(/[^a-z0-9]+/g, "-") : card.id);
                    const title = card.name || card.topic || "Quiz Category";
                    const subtitle = card.nameHi || card.topicHi || "";
                    const desc = card.description || card.descriptionHi || "";
                    const qCount = Number(
                      card.questionCount ??
                      card.questionsCount ??
                      card.count ??
                      card._count?.questions ??
                      (card.questions?.length || 0)
                    );
                    const imageSrc = getCategoryCardImageUrl(card);
                    const hue = getCategoryGradientHue(slug);
                    const fallbackBg = `linear-gradient(145deg, hsl(${hue} 80% 90%), hsl(${(hue + 40) % 360} 75% 80%))`;
                    const playsCount = `${Math.max(25, (qCount * 17) % 180 + 35)}k`;

                    return (
                      <div
                        key={card.id || slug}
                        onClick={() => handleLaunchQuiz(card)}
                        className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-2xs hover:shadow-lg hover:border-indigo-400 dark:hover:border-indigo-500 transition-all cursor-pointer flex flex-col justify-between overflow-hidden group active:scale-[0.98]"
                      >
                        {/* Card Visual Header with Existing WebP Card Artwork */}
                        <div
                          className="h-32 sm:h-36 w-full relative overflow-hidden flex flex-col justify-between p-3"
                          style={{ background: fallbackBg }}
                        >
                          {/* Real WebP Image from /cards/ */}
                          {imageSrc && !imgErrors[slug] && (
                            <>
                              <img
                                src={imageSrc}
                                alt={title}
                                loading="lazy"
                                onError={() =>
                                  setImgErrors((prev) => ({ ...prev, [slug]: true }))
                                }
                                className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/15 to-transparent pointer-events-none" />
                            </>
                          )}

                          {/* Fallback Emoji if image fails */}
                          {(!imageSrc || imgErrors[slug]) && (
                            <span className="absolute inset-0 flex items-center justify-center text-4xl select-none">
                              {card.icon || card.emoji || "📚"}
                            </span>
                          )}

                          {/* Top Badges */}
                          <div className="flex items-center justify-between relative z-10">
                            <span className="text-[10px] font-black bg-white/90 dark:bg-slate-900/90 text-slate-900 dark:text-white px-2 py-0.5 rounded-full shadow-2xs flex items-center gap-1 backdrop-blur-xs">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                              {isHindi ? "लाइव" : "Live"}
                            </span>
                            <span className="text-[10px] font-bold bg-black/40 backdrop-blur-xs text-white px-2 py-0.5 rounded-full">
                              {card.isTrending ? "Trending" : "Popular"}
                            </span>
                          </div>

                          {/* Bottom Plays Overlay */}
                          <div className="flex items-center justify-between relative z-10">
                            <span className="text-2xl filter drop-shadow group-hover:scale-110 transition-transform">
                              {card.icon || card.emoji || "✨"}
                            </span>
                            <span className="text-[10px] font-bold text-white bg-black/40 backdrop-blur-xs px-2 py-0.5 rounded-md font-mono">
                              {playsCount} plays
                            </span>
                          </div>
                        </div>

                        {/* Card Details */}
                        <div className="p-3.5 flex-1 flex flex-col justify-between space-y-2">
                          <div>
                            <h3 className="font-black text-sm text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors leading-tight">
                              {title}
                            </h3>
                            {subtitle && (
                              <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                                {subtitle}
                              </p>
                            )}
                            {desc && (
                              <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                                {desc}
                              </p>
                            )}
                          </div>

                          {/* Card Footer */}
                          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                            <span className="text-[11px] font-black text-indigo-600 dark:text-indigo-400 font-mono">
                              {qCount > 0
                                ? `${qCount.toLocaleString()} ${isHindi ? "प्रश्न" : "Questions"}`
                                : isHindi
                                ? "अध्ययन सामग्री"
                                : "Practice Quiz"}
                            </span>
                            <span className="text-[11px] font-bold bg-indigo-50 dark:bg-indigo-950/60 group-hover:bg-indigo-600 group-hover:text-white text-indigo-700 dark:text-indigo-300 px-2.5 py-1 rounded-xl transition-all flex items-center gap-0.5">
                              {isHindi ? "खेलें" : "Play"} <ChevronRight className="w-3 h-3" />
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </>
        )}

        {/* ================= READ MODE: DIGITAL FLEXBOOKS ================= */}
        {examMode === "read" && (
          <section className="space-y-6 animate-in fade-in duration-200">
            {selectedReadChapter ? (
              <DigitalBookReader
                chapter={selectedReadChapter}
                subject={selectedReadSubject}
                initialPage={
                  Number(searchParams?.get("set") || searchParams?.get("page")) || 1
                }
                onBackToIndex={() => setSelectedReadChapter(null)}
                isHindi={isHindi}
                allChapters={allChaptersList}
                onSelectChapter={(chap, subj) => {
                  setSelectedReadChapter(chap);
                  if (subj) setSelectedReadSubject(subj);
                }}
              />
            ) : (
              <>
                {/* FlexBook Header Info */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 dark:border-slate-800 pb-3">
                  <div>
                    <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                      <span>📚 {isHindi ? "डिजिटल फ्लेक्सबुक्स व अध्याय नोट्स" : "Digital FlexBooks & Chapter Notes"}</span>
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {isHindi
                        ? "सम्पूर्ण थ्योरी, परीक्षा सारांश और अध्याय-वार स्व-मूल्यांकन क्विज़ पढ़ें।"
                        : "Read complete theory, revision summaries, and take chapter-wise self assessments."}
                    </p>
                  </div>
                  <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 px-3 py-1 rounded-xl self-start">
                    {FLEX_BOOKS.length} {isHindi ? "सक्रिय पुस्तकें" : "Active Books"}
                  </span>
                </div>

                {/* Featured Active Books (2-Column Grid on Desktop) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {FLEX_BOOKS.map((book) => {
                    return (
                      <div
                        key={book.id}
                        className="rounded-3xl p-4 sm:p-5 border transition-all flex flex-col justify-between bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-950 border-indigo-200/80 dark:border-slate-800 shadow-xs hover:shadow-md"
                      >
                        <div className="flex gap-4">
                          {/* Book 3D Spine Graphic */}
                          <div
                            className={`w-24 h-32 rounded-2xl bg-gradient-to-br ${book.coverBg} text-white p-2.5 shadow-md flex flex-col justify-between shrink-0 border border-white/20 relative overflow-hidden`}
                          >
                            <div className="text-[8px] font-bold tracking-wider uppercase text-amber-300">
                              QuizWeb FlexBook
                            </div>
                            <div className="text-xs font-black leading-tight text-white">
                              {book.title}
                            </div>
                            <div className="text-[8px] text-slate-300 font-mono">
                              {book.chapters} {isHindi ? "अध्याय" : "Chapters"}
                            </div>
                          </div>

                          {/* Book Content */}
                          <div className="space-y-1.5 flex-1">
                            <div className="flex items-center justify-between">
                              <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
                                {book.status}
                              </span>
                              <span className="text-[10px] font-mono text-slate-400">
                                {book.chapters} Chapters
                              </span>
                            </div>

                            <h3 className="font-black text-sm sm:text-base text-slate-900 dark:text-white leading-tight">
                              {book.title}
                            </h3>
                            <p className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                              {book.hindiTitle}
                            </p>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                              {book.description}
                            </p>
                          </div>
                        </div>

                        {/* Chapter Topics Preview List */}
                        <div className="my-3 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            {isHindi ? "प्रमुख अध्याय:" : "Key Chapters:"}
                          </p>
                          <div className="grid grid-cols-2 gap-1 text-[11px] text-slate-700 dark:text-slate-300">
                            {book.topics.map((t, idx) => (
                              <span key={idx} className="flex items-center gap-1 line-clamp-1">
                                <span className="w-1 h-1 rounded-full bg-indigo-500" />
                                {t}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="pt-2 flex items-center gap-2">
                          <button
                            onClick={() => {
                              triggerAudio("pop");
                              setSelectedBook(book);
                            }}
                            className="flex-1 py-2.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl shadow-xs transition active:scale-95 flex items-center justify-center gap-1.5"
                          >
                            <BookOpen className="w-3.5 h-3.5" />
                            <span>{isHindi ? "पुस्तक व नोट्स पढ़ें" : "Read Book & Notes"}</span>
                          </button>
                          <button
                            onClick={() => {
                              triggerAudio("pop");
                              const matched = allCategories.find((c) => c.slug === book.slug);
                              if (matched) {
                                router.push(`/category/${book.slug}`);
                              } else {
                                router.push(`/category/${book.slug}`);
                              }
                            }}
                            className="py-2.5 px-3 bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold text-xs rounded-xl border border-slate-200 dark:border-slate-700 transition active:scale-95"
                          >
                            {isHindi ? "टेस्ट लें" : "Take Test"}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Hierarchical Subject Index Tree for All Topics */}
                <div className="pt-4 space-y-3">
                  <div className="p-3.5 bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800 rounded-2xl flex items-center justify-between text-xs text-indigo-950 dark:text-indigo-200">
                    <div className="flex items-center gap-2.5">
                      <BookOpen className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                      <div>
                        <p className="font-extrabold text-xs">
                          {isHindi
                            ? "सम्पूर्ण पाठ्यक्रम अनुक्रमणिका (Complete Curriculum Index)"
                            : "Complete Curriculum Index & Chapter Notes"}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          {isHindi
                            ? "किसी भी विषय को चुनें और बिना किसी समय सीमा के सभी प्रश्न व उत्तर व्याख्या सहित पढ़ें।"
                            : "Select any topic or chapter to read questions with answers and explanations."}
                        </p>
                      </div>
                    </div>
                  </div>

                  <SubjectIndexTree
                    sections={categorizedQuizzes}
                    onSelectChapter={(chap, subj) => {
                      setSelectedReadChapter(chap);
                      if (subj) setSelectedReadSubject(subj);
                    }}
                    isHindi={isHindi}
                  />
                </div>
              </>
            )}
          </section>
        )}
      </main>

      {/* ================= MODAL 1: 1v1 LIVE BATTLE DIALOG ================= */}
      {isBattleModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setIsBattleModalOpen(false)}
        >
          <div
            className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-2xl border border-slate-100 dark:border-slate-800 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-bold">
                  ⚔️
                </div>
                <h3 className="font-black text-sm text-slate-900 dark:text-white">
                  {isHindi ? "1v1 लाइव क्विज़ एरीना" : "1v1 Live Quiz Arena"}
                </h3>
              </div>
              <button
                onClick={() => setIsBattleModalOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Sub-Switch: Create vs Join */}
            <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-bold">
              <button
                onClick={() => setBattleSubTab("create")}
                className={`py-1.5 rounded-lg transition ${
                  battleSubTab === "create"
                    ? "bg-white dark:bg-slate-700 text-indigo-700 dark:text-white shadow-2xs"
                    : "text-slate-600 dark:text-slate-400"
                }`}
              >
                {isHindi ? "रूम बनाएं" : "Create Room"}
              </button>
              <button
                onClick={() => setBattleSubTab("join")}
                className={`py-1.5 rounded-lg transition ${
                  battleSubTab === "join"
                    ? "bg-white dark:bg-slate-700 text-indigo-700 dark:text-white shadow-2xs"
                    : "text-slate-600 dark:text-slate-400"
                }`}
              >
                {isHindi ? "कोड से जुड़ें" : "Join with PIN"}
              </button>
            </div>

            {battleSubTab === "create" ? (
              <div className="space-y-3 text-center">
                <div className="bg-indigo-50/80 dark:bg-indigo-950/40 p-4 rounded-2xl border border-indigo-200 dark:border-indigo-800">
                  <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                    {isHindi ? "आपका लाइव रूम कोड" : "Your Live Room Code"}
                  </span>
                  <p className="text-3xl font-black text-slate-900 dark:text-white font-mono tracking-widest my-1">
                    {generatedPin}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {isHindi
                      ? "यह कोड अपने प्रतिद्वंद्वी के साथ शेयर करें!"
                      : "Share this code with your challenger!"}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={handleCopyCode}
                    className="py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-center gap-1.5 transition active:scale-95"
                  >
                    {copiedPin ? (
                      <Check className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                    <span>{copiedPin ? "Copied!" : "Copy PIN"}</span>
                  </button>
                  <button
                    onClick={() => {
                      const shareText = `Join my live 1v1 GK Battle on QuizWeb! Room Code: ${generatedPin}`;
                      if (typeof navigator !== "undefined" && navigator.share) {
                        navigator
                          .share({
                            title: "QuizWeb 1v1 Battle",
                            text: shareText,
                            url: `${window.location.origin}/arena?room=${generatedPin}&mode=battle`,
                          })
                          .catch(() => {});
                      } else {
                        handleCopyCode();
                      }
                    }}
                    className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition"
                  >
                    <Share2 className="w-4 h-4" />
                    <span>WhatsApp</span>
                  </button>
                </div>

                <button
                  onClick={() => {
                    setIsBattleModalOpen(false);
                    router.push(`/arena?room=${generatedPin}&host=true&mode=battle`);
                  }}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl shadow-md transition"
                >
                  {isHindi ? "बैटल लॉबी शुरू करें 🚀" : "Start Battle Room 🚀"}
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  {isHindi ? "6 अंकों का रूम कोड डालें:" : "Enter 6-Digit Room Code:"}
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={joinPin}
                  onChange={(e) => setJoinPin(e.target.value.replace(/\D/g, ""))}
                  placeholder="e.g. 482910"
                  className="w-full text-center text-2xl font-mono font-bold tracking-widest py-3 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  disabled={joinPin.length < 4}
                  onClick={() => {
                    setIsBattleModalOpen(false);
                    router.push(`/arena?room=${joinPin}&mode=battle`);
                  }}
                  className="w-full py-3 bg-indigo-600 disabled:opacity-50 text-white font-black text-xs rounded-xl shadow-md transition"
                >
                  {isHindi ? "रूम में प्रवेश करें 🚀" : "Enter Room 🚀"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= MODAL 2: DIGITAL FLEXBOOK READER DRAWER ================= */}
      {selectedBook && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setSelectedBook(null)}
        >
          <div
            className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-2xl border border-slate-100 dark:border-slate-800 max-h-[85vh] flex flex-col space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl">📖</span>
                <div>
                  <h3 className="font-black text-sm text-slate-900 dark:text-white">
                    {selectedBook.title}
                  </h3>
                  <p className="text-[10px] text-slate-400 font-bold">{selectedBook.hindiTitle}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedBook(null)}
                className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-y-auto space-y-2.5 flex-1 pr-1 text-xs">
              <p className="font-bold text-slate-700 dark:text-slate-300">
                {isHindi ? "डिजिटल फ्लेक्सबुक अध्याय:" : "Digital FlexBook Chapters:"}
              </p>
              {selectedBook.topics.map((t, i) => (
                <div
                  key={i}
                  className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 transition cursor-pointer flex items-center justify-between"
                  onClick={() => {
                    const matched = allCategories.find((c) => c.slug === selectedBook.slug);
                    if (matched) {
                      setSelectedReadChapter(matched);
                      setSelectedBook(null);
                    } else {
                      toast.success(`Opening chapter: "${t}"`);
                      setSelectedBook(null);
                    }
                  }}
                >
                  <div>
                    <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 block">
                      Chapter {i + 1}
                    </span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{t}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </div>
              ))}
            </div>

            <button
              onClick={() => {
                const matched = allCategories.find((c) => c.slug === selectedBook.slug);
                if (matched) {
                  setSelectedReadChapter(matched);
                }
                setSelectedBook(null);
              }}
              className="w-full py-3 bg-indigo-600 text-white font-black text-xs rounded-xl shadow-md"
            >
              {isHindi ? "पूर्ण डिजिटल रीडर खोलें" : "Open Full Book Reader"}
            </button>
          </div>
        </div>
      )}

      {/* ================= MODAL 3: GK TEST ENGINE BUILDER ================= */}
      {isCustomEngineOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setIsCustomEngineOpen(false)}
        >
          <div
            className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-2xl border border-slate-100 dark:border-slate-800 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <span className="text-xl">⚡</span>
                <h3 className="font-black text-sm text-slate-900 dark:text-white">
                  {isHindi ? "कस्टम GK टेस्ट इंजन" : "Custom Test Engine"}
                </h3>
              </div>
              <button
                onClick={() => setIsCustomEngineOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  {isHindi ? "प्रश्नों की संख्या चुनें:" : "Number of Questions:"}
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[10, 25, 50].map((num) => (
                    <button
                      key={num}
                      onClick={() => setCustomQuestionCount(num)}
                      className={`py-2 rounded-xl border font-bold transition ${
                        customQuestionCount === num
                          ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                          : "border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                      }`}
                    >
                      {num} Qs
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  {isHindi ? "मिश्रित करने के लिए विषय चुनें:" : "Select Subjects to Mix:"}
                </label>
                <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                  {[
                    { id: "india-gk", label: "India GK (भारत सामान्य ज्ञान)" },
                    { id: "science--discovery", label: "General Science (सामान्य विज्ञान)" },
                    { id: "world-gk", label: "World Geography (विश्व भूगोल)" },
                    { id: "india-history", label: "Indian History (भारतीय इतिहास)" },
                    { id: "sports", label: "Sports & Games (खेलकूद GK)" },
                  ].map((sub) => {
                    const isSelected = customSelectedSubjects.includes(sub.id);
                    return (
                      <div
                        key={sub.id}
                        onClick={() => toggleSubjectMix(sub.id)}
                        className={`flex items-center justify-between p-2 rounded-xl border cursor-pointer transition ${
                          isSelected
                            ? "bg-indigo-50/80 dark:bg-indigo-950/50 border-indigo-300 dark:border-indigo-700 text-indigo-950 dark:text-indigo-200"
                            : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                        }`}
                      >
                        <span className="font-bold text-[11px]">{sub.label}</span>
                        {isSelected ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        ) : (
                          <div className="w-4 h-4 rounded-full border border-slate-300 dark:border-slate-600 shrink-0" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                setIsCustomEngineOpen(false);
                const firstSub = customSelectedSubjects[0] || "india-gk";
                router.push(`/category/${firstSub}?count=${customQuestionCount}&custom=true`);
              }}
              className="w-full py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-black text-xs rounded-xl shadow-md active:scale-95 transition"
            >
              {isHindi ? "कस्टम टेस्ट शुरू करें 🚀" : "Start Custom Test 🚀"}
            </button>
          </div>
        </div>
      )}

      {/* ================= MODAL 4: QUIZ LAUNCH CONFIRMATION ================= */}
      {activeQuizLaunch && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setActiveQuizLaunch(null)}
        >
          <div
            className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-2xl border border-slate-100 dark:border-slate-800 text-center space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-16 h-16 mx-auto rounded-3xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-800 flex items-center justify-center text-4xl shadow-inner">
              {activeQuizLaunch.icon || activeQuizLaunch.emoji || "📚"}
            </div>
            <div>
              <span className="text-[10px] font-black bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 px-2.5 py-0.5 rounded-full">
                {activeQuizLaunch.isTrending ? "Trending" : "GK Set"}
              </span>
              <h3 className="font-black text-base text-slate-900 dark:text-white mt-1">
                {activeQuizLaunch.title || activeQuizLaunch.topic || activeQuizLaunch.name}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
                {activeQuizLaunch.hindiTitle || activeQuizLaunch.topicHi || activeQuizLaunch.nameHi || ""}
              </p>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs text-left space-y-1">
              <div className="flex justify-between font-medium">
                <span className="text-slate-500 dark:text-slate-400">
                  {isHindi ? "कुल उपलब्ध प्रश्न:" : "Available Questions:"}
                </span>
                <span className="font-bold text-slate-900 dark:text-white font-mono">
                  {Number(
                    activeQuizLaunch.questionCount ??
                    activeQuizLaunch.questionsCount ??
                    (activeQuizLaunch.questions?.length || 0)
                  ).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between font-medium">
                <span className="text-slate-500 dark:text-slate-400">
                  {isHindi ? "टेस्ट फॉर्मेट:" : "Test Format:"}
                </span>
                <span className="font-bold text-slate-900 dark:text-white">
                  20 Qs per Set (Timed)
                </span>
              </div>
              <div className="flex justify-between font-medium">
                <span className="text-slate-500 dark:text-slate-400">
                  {isHindi ? "भाषा:" : "Language:"}
                </span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  Bilingual (Hindi + English)
                </span>
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setActiveQuizLaunch(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-xs text-slate-600 dark:text-slate-400"
              >
                {isHindi ? "रद्द करें" : "Cancel"}
              </button>
              <button
                onClick={() => {
                  const target = activeQuizLaunch;
                  setActiveQuizLaunch(null);
                  handleStartDirectPractice(target);
                }}
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl shadow-md active:scale-95 transition"
              >
                {isHindi ? "अभ्यास शुरू करें ▶" : "Start Practice ▶"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
